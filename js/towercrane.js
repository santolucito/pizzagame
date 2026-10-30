'use strict';
// Tower cranes the chef can drive, on any map. A crane is a tall yellow tower with a turning jib, a trolley and a hook.
// Climb in at the little door at the mast's foot ('🏗️ Drive the crane' on the vehicle button, '🚶 Climb down' to get out):
// the chef sits up in the cab, the joystick moves the HOOK over the ground like walking (push left: the hook goes left;
// the jib turns and the trolley runs by themselves to follow it, as far as the jib reaches and never over the water), a
// ring on the ground shows where it is and the camera follows it. One big button does what fits there:
//   by a pile          '🪝 Grab a panel' (a beam, a bucket…): the hook dips and the piece swings up onto it
//   carrying, by a target   '🚀 Put it on the rocket' (or the house…): the hook lifts the piece onto its spot, it clicks on
//                      with a sparkle and "Click! ✨", and a worker cheers 🎉
//   carrying, elsewhere  '⬇️ Put it down': it lies on the ground a while, then slides back to its pile
// Each press is one quick dip of the hook (under a second); nothing needs holding. Left alone a crane goes back to its
// own work (an `idle` pose from its owner, or by default fetching pieces from its first pile to its first target).
//
// API (call at load time, after CFG exists):
//   TowerCrane.create({
//     id, area,                       // a unique name; the map it stands on
//     base: { x, y },                 // the mast's foot (a 40 × 36 obstacle); seat: the door (default 38 px south of it)
//     height, reach, counter,         // the jib's height and reach, the counter-jib's length
//     piles: [{ x, y, kind }] | (g) => [...],      // pallets to grab from ('panel', 'beam', 'bucket' or your own kind)
//     targets: [{ x, y, w, h, label, hint, carryHint, spot(g, crane, hook) => { x, y, z }, onPlace(g, crane, piece) }]
//              | (g) => [...],      // where pieces go: the hook counts near when within REACH of the rect; spot() is where
//                                   // the piece clicks on (ground x, y and height z); onPlace (optional) keeps and draws
//                                   // it itself, otherwise the crane keeps it and draws it there
//     exists(g), available(g),        // drawn at all / can be climbed into right now (defaults: always)
//     idle(g, crane) => pose,         // its own work while nobody drives it ({ th, d, z, load, kind, ph }; see calc())
//     drawLoad(r, g, crane, kind, x, y) => true,   // draw a piece kind the module does not know (y: the hook's bottom)
//     crew: [{ x, y, shirt, hat, skin, facing }],  // little workers drawn by the crane who cheer when a piece clicks on
//     driver, fetchHint, land(x, y),  // the driver's skin; the hint while the hook is empty; where the hook may go
//   }) → the crane. TowerCrane.get(id), TowerCrane.hook(crane) (the hook's ground spot), TowerCrane.state(crane).
// Registered with Game.ext (moved to the front of the line at build, so its button and hints win while riding one) and
// Render.ext. Also hides Construction Town's old static crane (CFG.SITE.CRANE.hidden) and adds a drivable one there.

CFG.TOWERCRANE = {
  DMIN: 46,        // the closest the hook comes to the mast
  SPEED: 230,      // how fast the joystick moves the hook over the ground
  DRIVE_Z: 80,     // how high the hook hangs while driven
  REACH: 70,       // a pile, a piece on the ground or a target counts this near the hook
  DIP_T: 0.6,      // one press: the hook dips down and back up (grab, put down)
  PLACE_T: 0.9,    // one press: the hook lifts a piece onto its spot and comes back
  LIFT: 0.4,       // a grabbed piece swings up onto the hook
  LOOSE: 6, SLIDE: 1.6,   // a piece put down lies there, then slides home to its pile
  NEAR: 70,        // the climb-in hint's reach
  PERIOD: 15,      // the default work loop's length (seconds)
  KEEP: 10,        // pieces a crane keeps on a target (older ones are tidied away)
};
CFG.VEHICLES.crane = { speed: 0, radius: 14, label: '🏗️ Drive the crane', exit: '🚶 Climb down', flies: true };   // it never moves; `flies` keeps beach walls from shoving it
if (CFG.SITE && CFG.SITE.CRANE) CFG.SITE.CRANE.hidden = true;   // the core skips its static crane: ours replaces it

const TowerCrane = {
  name: 'towercrane',
  defaults: { towercrane: { grabs: 0, placed: 0 } },
  list: [],
  ride: null,      // the crane the chef sits in

  // ---------- creating cranes ----------
  create(o) {
    const c = Object.assign({
      seat: { x: o.base.x, y: o.base.y + 38 }, height: 300, reach: 240, counter: 64, driver: '#e0ac69', crew: [],
      exists: () => true, available: () => true, piles: [], targets: [], phase: TowerCrane.list.length * 3.7,
    }, o);
    c.C = c.base; c.H = c.height; c.L = c.reach; c.LC = c.counter;
    c.v = { kind: 'crane', tc: c.id, x: c.seat.x, y: c.seat.y, angle: 0, vx: 0, vy: 0 };
    this.reset(c);
    this.list.push(c);
    return c;
  },
  reset(c) {
    Object.assign(c, { th: Math.PI, d: 100, z: CFG.TOWERCRANE.DRIVE_Z, load: false, kind: null, cyc: null, man: 0, lift: null, loose: [], placed: [], clock: 0 });
    c.crewSt = c.crew.map((w) => Object.assign({ wave: 0, hop: 0, say: null }, w));
  },
  get(id) { return this.list.find((c) => c.id === id) || null; },
  ofVehicle(v) { return v && v.kind === 'crane' ? this.list.find((c) => c.v === v) || null : null; },
  here(g) { return this.list.filter((c) => c.area === g.area && c.exists(g)); },
  riding(g) { return g.driving ? this.ofVehicle(g.vehicle) : null; },
  piles(g, c) { return (typeof c.piles === 'function' ? c.piles(g) : c.piles) || []; },
  targets(g, c) { return (typeof c.targets === 'function' ? c.targets(g) : c.targets) || []; },
  pileSpot(P) { return { x: P.x, y: P.y + 12 }; },
  // a crane's own pile (its first) and where its pieces slide home to
  homeSpot(c, g) { const P = this.piles(g, c)[0]; return P ? this.pileSpot(P) : { x: c.C.x, y: c.C.y + 60 }; },
  rectDist(T, x, y) { return Math.hypot(Math.max(T.x - x, 0, x - (T.x + (T.w || 0))), Math.max(T.y - y, 0, y - (T.y + (T.h || 0)))); },
  rectMid(T) { return { x: T.x + (T.w || 0) / 2, y: T.y + (T.h || 0) / 2 }; },

  // ---------- geometry ----------
  // A crane's pose: the jib's angle `th` round the mast (on the ground: 0 east, PI/2 south), the trolley `d` out along
  // it, the hook's height `z` above the ground, and what hangs on it. A ground point (x, y) at height h is drawn at (x, y - h).
  polar(c, x, y) { return { th: Math.atan2(y - c.C.y, x - c.C.x), d: U.dist(c.C.x, c.C.y, x, y) }; },
  lerpA(a, b, k) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; },
  hookAt(c, pose) { return { x: c.C.x + Math.cos(pose.th) * pose.d, y: c.C.y + Math.sin(pose.th) * pose.d }; },
  hook(c) { return this.hookAt(c, c); },
  landOk(c, P) {
    if (c.land) return c.land(P.x, P.y);
    const W = CFG.AREAS[c.area] ? CFG.AREAS[c.area].WORLD : (c.area === 'site' ? CFG.SITE.WORLD : null), m = 26;
    return !W || (P.x > W.x0 + m && P.x < W.x1 - m && P.y > W.y0 + m && P.y < W.y1 - m);
  },
  reaches(c, P) { const d = U.dist(c.C.x, c.C.y, P.x, P.y); return d >= CFG.TOWERCRANE.DMIN && d <= c.L - 8 && this.landOk(c, P); },
  // one round trip of a hook working on its own (k 0..1): down to the pile A, up, over to B, lower to `top`, hold, raise,
  // back, rest (A and B are polar spots; heights: rest, low at the pile, top at the target)
  calc(k, A, B, rest, low, top, preload) {
    const seg = [[0.12, 'down'], [0.24, 'up'], [0.4, 'over'], [0.5, 'lower'], [0.64, 'hold'], [0.74, 'raise'], [0.9, 'back'], [1, 'rest']];
    let i = 0; while (i < seg.length - 1 && k > seg[i][0]) i++;
    const a = i ? seg[i - 1][0] : 0, q = U.clamp((k - a) / (seg[i][0] - a), 0, 1), e = q * q * (3 - 2 * q), ph = seg[i][1];
    let th = A.th, d = A.d, z = rest, load = !!preload;
    const at = (P) => { th = P.th; d = P.d; }, swing = (P, Q) => { th = this.lerpA(P.th, Q.th, e); d = U.lerp(P.d, Q.d, e); };
    if (ph === 'down') z = U.lerp(rest, low, e);
    else if (ph === 'up') { z = U.lerp(low, rest, e); load = true; }
    else if (ph === 'over') { swing(A, B); load = true; }
    else if (ph === 'lower') { at(B); z = U.lerp(rest, top, e); load = true; }
    else if (ph === 'hold') { at(B); z = top; load = true; }
    else if (ph === 'raise') { at(B); z = U.lerp(top, rest, e); }
    else if (ph === 'back') swing(B, A);
    return { th, d, z, load, ph };
  },
  // its own work: the owner's idle pose, or fetching pieces from its first pile to its first target
  idlePose(g, c) {
    if (c.idle) { const p = c.idle(g, c); if (p) return p; }
    const P = this.piles(g, c)[0], T = this.targets(g, c)[0];
    if (!P || !T) return { th: c.phase, d: c.L * 0.6, z: c.H - 40, load: false, ph: 'rest' };
    const A = this.pileSpot(P), S = T.spot ? T.spot(g, c, this.rectMid(T)) : Object.assign(this.rectMid(T), { z: 30 });
    const pose = this.calc(((g.time + c.phase) % CFG.TOWERCRANE.PERIOD) / CFG.TOWERCRANE.PERIOD, this.polar(c, A.x, A.y), this.polar(c, S.x, S.y), c.H - 40, 44, (S.z || 0) + 31);
    pose.kind = P.kind; return pose;
  },
  // what is drawn: its own work, blended into the chef's driving while they sit in it (and back after)
  pose(g, c) {
    const a = this.idlePose(g, c);
    if (c.man <= 0) return a;
    const m = c.man * c.man * (3 - 2 * c.man);
    return { th: this.lerpA(a.th, c.th, m), d: U.lerp(a.d, c.d, m), z: U.lerp(a.z, c.z, m), load: m > 0.5 ? c.load : a.load, kind: m > 0.5 ? c.kind : a.kind, ph: m >= 1 ? 'driven' : a.ph };
  },
  // the pose plus where its hook is drawn (x, hy: the hook's top) and its jib's height on screen
  state(c) { const p = this.pose(Game, c), G = this.hookAt(c, p); return Object.assign(p, { x: G.x, hy: G.y - p.z, jibY: c.C.y - c.H }); },

  // ---------- game hooks ----------
  build(g) {
    for (const c of this.list) this.reset(c);
    this.ride = null;
    if (!g.s.towercrane) g.s.towercrane = { grabs: 0, placed: 0 };
    // first in line, so while riding a crane its button and hints win (it says nothing otherwise, except by a crane's door)
    const i = g.ext.indexOf(this); if (i > 0) { g.ext.splice(i, 1); g.ext.unshift(this); }
  },
  vehicles(g) {
    const r = this.riding(g);
    if (r) return [r.v];
    return this.here(g).filter((c) => c.available(g)).map((c) => c.v);
  },
  obstacles(g) { return this.here(g).map((c) => this.mastBox(c)); },
  mastBox(c) { return { x: c.C.x - 20, y: c.C.y - 18, w: 40, h: 36 }; },
  // every mast on a map (for owners that keep their own obstacle lists, like Rocket Island's fuel truck)
  boxes(g, area) { return this.list.filter((c) => c.area === area && c.exists(g)).map((c) => this.mastBox(c)); },
  busy(g) { const C = typeof CityExt !== 'undefined' ? CityExt : null; return !!(C && ((C.st && (C.st.cab || C.st.boarding)) || C.floor)); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && !this.busy(g); },
  update(g, dt) {
    const c = this.riding(g), K = CFG.TOWERCRANE;
    if (c && this.ride !== c) this.startRide(g, c);
    if (!c && this.ride) this.endRide(g);
    for (const q of this.list) {
      q.man = q === c ? Math.min(1, q.man + dt * 2.5) : Math.max(0, q.man - dt * 1.2);
      if (q.lift) { q.lift.t += dt; if (q.lift.t > K.LIFT) q.lift = null; }
      for (const o of q.loose) {
        o.t += dt;
        if (o.t > K.LOOSE) { const k = Math.min(1, (o.t - K.LOOSE) / K.SLIDE), e = k * k * (3 - 2 * k); o.x = U.lerp(o.x0, o.home.x, e); o.y = U.lerp(o.y0, o.home.y, e); o.gone = k >= 1; }
      }
      q.loose = q.loose.filter((o) => !o.gone);
      for (const p of q.placed) p.t += dt;
      for (const w of q.crewSt) { w.wave = Math.max(0, w.wave - dt); w.hop = w.wave > 0 ? Math.abs(Math.sin(g.time * 11)) * 6 : 0; if (w.say) { w.say.t += dt; if (w.say.t > 1.8) w.say = null; } }
    }
    // a save or a push that left the chef inside a mast: out at its door
    if (!c && this.onFoot(g)) {
      const p = g.player;
      for (const q of this.here(g)) { const B = this.mastBox(q); if (p.x > B.x && p.x < B.x + B.w && p.y > B.y && p.y < B.y + B.h) { p.x = q.seat.x; p.y = q.seat.y + 12; p.moving = false; } }
    }
    if (!c) return;
    if (c.cyc) this.updateHook(g, c, dt);
    else { const a = Input.axis(); if (a.x || a.y) this.moveHook(c, a, dt); }
    // the camera follows the hook (the chef's spot drives it; the chef is drawn up in the cab)
    const G = this.hook(c), p = g.player;
    p.x = G.x; p.y = G.y - 50; p.moving = false;
  },
  // climbing in: the crane takes over from where it was working (its hook low, ready to work)
  startRide(g, c) {
    if (this.ride) this.endRide(g);
    this.ride = c;
    const p = this.pose(g, c), K = CFG.TOWERCRANE;
    c.th = p.th; c.d = U.clamp(p.d, K.DMIN, c.L - 8); c.z = K.DRIVE_Z; c.load = !!p.load && (p.kind === undefined || this.knownKind(c, p.kind)); c.kind = c.load ? p.kind : null; c.cyc = null; c.lift = null;
    if (!this.landOk(c, this.hook(c))) { const P = this.piles(g, c)[0], S = P ? this.pileSpot(P) : { x: c.C.x + 80, y: c.C.y + 60 }, Q = this.polar(c, S.x, S.y); c.th = Q.th; c.d = U.clamp(Q.d, K.DMIN, c.L - 8); }
    g.floats.push({ x: c.C.x, y: c.C.y - c.H - 40, text: 'Up in the crane! 🏗️', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Haptics.tap();
  },
  knownKind(c, kind) { return ['panel', 'beam', 'bucket'].includes(kind); },   // the nose cone and other owner-only loads stay with the crane's own work
  // climbing down (or anything else that took the chef out of the cab): a dip on its way finishes, the crane goes back to work
  endRide(g) { const c = this.ride; if (!c) return; if (c.cyc && !c.cyc.done) this.hookBottom(g, c, c.cyc); c.cyc = null; this.ride = null; },
  // the joystick moves the hook: it slides round the edge of the jib's reach and stops at the water; pushed in at the mast
  // it walks round the mast instead (so pushing straight at the far side always gets there)
  moveHook(c, a, dt) {
    const K = CFG.TOWERCRANE, C = c.C, G = this.hook(c), x = G.x + a.x * K.SPEED * dt, y = G.y + a.y * K.SPEED * dt;
    if (U.dist(C.x, C.y, x, y) < K.DMIN + 1) {
      const tx = -Math.sin(c.th), ty = Math.cos(c.th), tan = a.x * tx + a.y * ty, sgn = Math.abs(tan) > 0.15 ? Math.sign(tan) : 1;
      const th = c.th + sgn * K.SPEED * dt / K.DMIN, Q = { x: C.x + Math.cos(th) * K.DMIN, y: C.y + Math.sin(th) * K.DMIN };
      if (this.landOk(c, Q)) { c.th = th; c.d = K.DMIN; }
      return;
    }
    const ring = (px, py) => { const dx = px - C.x, dy = py - C.y, d = Math.hypot(dx, dy) || 1, dd = U.clamp(d, K.DMIN, c.L - 8); return { x: C.x + dx / d * dd, y: C.y + dy / d * dd }; };
    for (const [px, py] of [[x, y], [x, G.y], [G.x, y]]) {
      const Q = ring(px, py);
      if (this.landOk(c, Q)) { const P = this.polar(c, Q.x, Q.y); c.th = P.th; c.d = P.d; return; }
    }
  },
  // what the button would do with the hook where it is: put the piece on a target, put it down, grab one, or nothing
  target(g, c) {
    const R = CFG.TOWERCRANE.REACH, G = this.hook(c), near = (P) => U.dist(G.x, G.y, P.x, P.y) < R;
    if (c.load) {
      for (const T of this.targets(g, c)) {
        if (this.rectDist(T, G.x, G.y) >= R) continue;
        const S = T.spot ? T.spot(g, c, G) : Object.assign(this.rectMid(T), { z: 30 });
        if (S && this.reaches(c, S)) return { what: 'place', T, S };
      }
      return { what: 'down' };
    }
    let P = null, bd = R; for (const q of this.piles(g, c)) { const S = this.pileSpot(q), d = U.dist(G.x, G.y, S.x, S.y); if (d < bd) { bd = d; P = q; } }   // the nearest pile
    if (P) return { what: 'grab', pile: P, kind: P.kind };
    const o = c.loose.find((q) => q.t > 0.3 && q.t < CFG.TOWERCRANE.LOOSE && near(q)); if (o) return { what: 'grab', loose: o, kind: o.kind };
    return { what: 'none' };
  },
  grabLabel(kind) { return { panel: '🪝 Grab a panel', beam: '🪝 Grab a beam', bucket: '🪝 Grab a bucket' }[kind] || '🪝 Grab it'; },
  action(g) {
    const c = this.riding(g); if (!c || g.travel) return null;
    if (c.cyc) return { label: c.cyc.label, run: () => {} };   // the hook is on its way: the button stays put
    const tg = this.target(g, c);
    const label = tg.what === 'place' ? (tg.T.label || '⬆️ Put it on top') : tg.what === 'down' ? '⬇️ Put it down' : tg.what === 'grab' ? this.grabLabel(tg.kind) : null;
    if (!label) return null;
    return { label, run: (gg) => this.startHook(gg, c, tg, label) };
  },
  // a press: the hook dips down to the pile or the ground, or lifts the piece up to its spot, and comes back
  startHook(g, c, tg, label) {
    const K = CFG.TOWERCRANE, cy = { what: tg.what, tg, label, t: 0, z0: c.z, done: false, from: { th: c.th, d: c.d } };
    if (tg.what === 'place') { cy.to = this.polar(c, tg.S.x, tg.S.y); cy.zt = (tg.S.z || 0) + 31; cy.dur = K.PLACE_T; }
    else { cy.zt = tg.what === 'grab' ? 30 : 18; cy.dur = K.DIP_T; }
    c.cyc = cy;
    Sfx.tone(300, 0.2, 'triangle', 0.03, -80); Haptics.tap();
  },
  // down and back up in one smooth swing (a placing hook also slides over to the spot); the job is done at the bottom
  updateHook(g, c, dt) {
    const cy = c.cyc; cy.t += dt;
    const k = Math.min(1, cy.t / cy.dur);
    c.z = cy.z0 + (cy.zt - cy.z0) * Math.sin(Math.PI * k);
    if (cy.to) { const e = Math.min(1, k * 2.5); c.th = this.lerpA(cy.from.th, cy.to.th, e); c.d = U.lerp(cy.from.d, cy.to.d, e); }
    if (!cy.done && k >= 0.5) { cy.done = true; this.hookBottom(g, c, cy); }
    if (k >= 1) { c.z = cy.z0; c.cyc = null; }
  },
  hookBottom(g, c, cy) {
    const G = this.hook(c), tg = cy.tg, say = (text, x, y) => g.floats.push({ x, y, text, color: '#ffe08a', t: 0, dur: 1.3, big: true });
    if (cy.what === 'grab') {
      c.load = true; c.kind = tg.kind || 'panel';
      c.lift = { t: 0, from: tg.loose ? { x: tg.loose.x, y: tg.loose.y - 4 } : { x: tg.pile.x, y: tg.pile.y - 20 } };
      if (tg.loose) c.loose = c.loose.filter((q) => q !== tg.loose);
      g.s.towercrane.grabs++;
      say('Got it! 🪝', G.x, G.y - c.z - 20); Sfx.pickup();
    } else if (cy.what === 'place') {
      const S = tg.S, piece = { kind: c.kind, x: S.x, y: S.y, z: S.z || 0, turn: !!S.turn, target: tg.T, t: 0 };
      c.load = false; c.kind = null; c.lift = null;
      for (let k = 0; k < 12; k++) g.fx.push({ kind: 'sparkle', x0: S.x + U.rand(-26, 26), y0: S.y - piece.z + U.rand(-20, 20), x1: 0, y1: 0, t: -k * 0.04, dur: 0.6 });
      say('Click! ✨', S.x, S.y - piece.z - 50);
      g.s.towercrane.placed++;
      if (tg.T.onPlace) tg.T.onPlace(g, c, piece);
      else { c.placed.push(piece); if (c.placed.length > CFG.TOWERCRANE.KEEP) c.placed.shift(); this.cheer(c, S); }
      Sfx.chime(); Haptics.success();
    } else if (cy.what === 'down') {
      c.loose.push({ x: G.x, y: G.y - 4, x0: G.x, y0: G.y - 4, t: 0, kind: c.kind || 'panel', home: this.homeSpot(c, g) }); if (c.loose.length > 6) c.loose.shift();
      c.load = false; c.kind = null; c.lift = null;
      say('Thud!', G.x, G.y - 50); Sfx.drop();
    }
  },
  // the crane's own crew: the one nearest the spot hops and cheers 🎉
  cheer(c, S) {
    let who = null, bd = Infinity; for (const w of c.crewSt) { const d = U.dist(w.x, w.y, S.x, S.y); if (d < bd) { bd = d; who = w; } }
    if (who) { who.wave = 1.6; who.say = { t: 0, text: '🎉' }; who.facing = S.x < who.x ? -1 : 1; }
  },
  hint(g) {
    const c = this.riding(g);
    if (!c) {
      if (g.travel || !this.onFoot(g)) return undefined;
      const p = g.player;
      for (const q of this.here(g)) {
        if (!q.available(g)) continue;
        const d = U.dist(p.x, p.y, q.seat.x, q.seat.y);
        if (d < CFG.TOWERCRANE.NEAR) return { text: 'Drive the crane! 🏗️', target: d < 30 ? null : q.seat };
      }
      return undefined;
    }
    if (c.cyc) return { text: c.cyc.what === 'place' ? 'Up it goes! 🏗️' : 'Down goes the hook! 🪝', target: null };
    const tg = this.target(g, c);
    if (tg.what === 'place') return { text: tg.T.hint || 'Put it on! Press the button 🏗️', target: null };
    if (c.load) {
      const T = this.targets(g, c).find((q) => this.reaches(c, q.spot ? q.spot(g, c, c.C) : this.rectMid(q)));   // a target with a spot the jib reaches (probed from the mast's side)
      return { text: (T && T.carryHint) || 'Move it over to where it goes! 🏗️', target: T ? this.rectMid(T) : null };
    }
    if (tg.what === 'grab') return { text: ({ panel: 'Grab a panel! 🪝', beam: 'Grab a beam! 🪝', bucket: 'Grab a bucket! 🪝' })[tg.kind] || 'Grab it! 🪝', target: null };
    const P = this.piles(g, c)[0];
    return { text: c.fetchHint || 'Move the hook to the pile! 🪝', target: P ? this.pileSpot(P) : null };
  },
  // Take me home: nobody in a crane, nothing hanging or lying about
  home(g) {
    if (this.ride) { this.ride.cyc = null; this.ride = null; }
    for (const c of this.list) { c.cyc = null; c.load = false; c.kind = null; c.man = 0; c.lift = null; c.loose = []; }
  },

  // ---------- drawing ----------
  paintAfter(r, g, area) {
    // the crane's footing: tracks in the ground round its base
    const ctx = r.ctx;
    for (const c of this.list) if (c.area === area && c.exists(g)) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = -2; k <= 2; k++) ctx.fillRect(c.C.x - 30, c.C.y + k * 8 + 22, 60, 3); }
  },
  bgKey(g) { return 'tc' + this.list.map((c) => (c.exists(g) ? 1 : 0)).join(''); },
  dynamic(r, g) { const c = this.riding(g); if (c && c.area === g.area) this.drawAim(r, g, c); },
  entities(r, g, items) {
    for (const c of this.here(g)) {
      // only bother when the crane is somewhere near the screen (it is tall)
      if (r.camX > c.C.x + c.L + 80 || r.camX + r.viewW < c.C.x - c.L - 80 || r.camY > c.C.y + c.L + 80 || r.camY + r.viewH < c.C.y - c.H - c.L) continue;
      const pose = this.pose(g, c), G = this.hookAt(c, pose);
      items.push({ y: c.C.y + 18, draw: () => this.drawCrane(r, g, c, pose) });
      items.push({ y: G.y + 6, draw: () => this.drawHook(r, g, c, pose) });
      for (const o of c.loose) items.push({ y: o.y, draw: () => this.drawLoose(r, g, c, o) });
      for (const p of c.placed) items.push({ y: p.y + 1, draw: () => this.drawPlacedPiece(r, g, c, p) });
      for (const w of c.crewSt) items.push({ y: w.y, draw: () => this.drawWorker(r, g, w) });
    }
  },
  overlay(r, g) {
    const ctx = r.ctx;
    for (const c of this.here(g)) for (const w of c.crewSt) if (w.say) r.drawBubble(w.x, w.y - (w.hop || 0) - 66, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(w.say.text, 0, 0); }, 30);
  },
  // the tower at C: its base with a little door, the mast up to the jib's height, the jib turned to `pose.th` (a lattice
  // band out to its tip, the counter-jib with its weight behind), the peak with its tie cables, the trolley, the cab
  // with its driver (the chef when riding), and a pennant on the tip once it is parked
  drawCrane(r, g, c, pose) {
    const ctx = r.ctx, C = c.C, J = c.H, top = C.y - J, ux = Math.cos(pose.th), uy = Math.sin(pose.th), L = c.L, LC = c.LC, riding = this.ride === c;
    const at = (dist, h) => ({ x: C.x + dist * ux, y: C.y + dist * uy - h });
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x - 22, C.y + 10, 48, 10);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, C.x - 22, C.y - 6, 44, 22, 4); ctx.fill();
    ctx.fillStyle = '#ffd166'; for (let x = C.x - 20; x < C.x + 20; x += 10) ctx.fillRect(x, C.y + 10, 5, 4);   // hazard stripes on the base
    // the mast: two yellow rails with zigzag bracing
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C.x - 8, C.y - 4); ctx.lineTo(C.x - 8, top); ctx.moveTo(C.x + 8, C.y - 4); ctx.lineTo(C.x + 8, top); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = C.y - 4, k = 0; y > top + 8; y -= 16, k++) { ctx.moveTo(C.x + (k % 2 ? 8 : -8), y); ctx.lineTo(C.x + (k % 2 ? -8 : 8), Math.max(top, y - 16)); } ctx.stroke();
    // the door into the mast at its foot (where the chef climbs in)
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, C.x - 7, C.y - 22, 14, 18, 3); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(C.x - 4, C.y - 19, 8, 5); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(C.x + 4, C.y - 11, 1.4, 0, Math.PI * 2); ctx.fill();
    // the jib: from the counter-jib's end to the tip, a lattice band; drawn behind the mast's top when it points north
    const E = at(L, J), Q = at(-LC, J), M = at(0, J);
    let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; } nx *= 9; ny *= 9;
    const jib = () => {
      ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(Q.x, Q.y); ctx.lineTo(E.x, E.y); ctx.moveTo(M.x + nx, M.y + ny); ctx.lineTo(E.x + nx * 0.4, E.y + ny * 0.4); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath();
      const n = Math.max(2, Math.round(L / 16));
      for (let k = 0; k < n; k++) { const a = k / n, b = (k + 1) / n, sa = 1 - 0.6 * a, sb = 1 - 0.6 * b; const A = { x: U.lerp(M.x, E.x, a), y: U.lerp(M.y, E.y, a) }, B2 = { x: U.lerp(M.x, E.x, b), y: U.lerp(M.y, E.y, b) }; if (k % 2) { ctx.moveTo(A.x, A.y); ctx.lineTo(B2.x + nx * sb, B2.y + ny * sb); } else { ctx.moveTo(A.x + nx * sa, A.y + ny * sa); ctx.lineTo(B2.x, B2.y); } }
      ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(Q.x, Q.y + 6, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#7d8591'; U.roundRect(ctx, Q.x - 12, Q.y - 2, 24, 16, 3); ctx.fill();   // the counterweight
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C.x, top - 30); ctx.lineTo(E.x, E.y); ctx.moveTo(C.x, top - 30); ctx.lineTo(Q.x, Q.y); ctx.stroke();
      const T = at(pose.d, J); ctx.fillStyle = '#3e424a'; U.roundRect(ctx, T.x - 7, T.y - 3, 14, 8, 2); ctx.fill();   // the trolley
      if (pose.ph === 'parked') { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(E.x - 18 * ux + 4, E.y - 18 * uy - 7 + Math.sin(g.time * 4) * 2); ctx.lineTo(E.x, E.y - 14); ctx.closePath(); ctx.fill(); }
    };
    const peak = () => { ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.moveTo(C.x - 6, top + 2); ctx.lineTo(C.x, top - 32); ctx.lineTo(C.x + 6, top + 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.ellipse(C.x, top + 2, 13, 5, 0, 0, Math.PI * 2); ctx.fill(); };
    // the cab beside the mast's top, with a big window: the driver in a hard hat, or the chef
    const cab = () => {
      const cx = C.x + 10, cy = top + 4;
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, cx, cy, 24, 22, 4); ctx.fill(); ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, cx + 3, cy + 3, 18, 11, 2); ctx.fill();
      if (riding) {
        ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(cx + 12, cy + 12, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 9.5, cy + 6, 3.4, 0, Math.PI * 2); ctx.arc(cx + 14.5, cy + 6, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(cx + 7.5, cy + 6, 9, 3.5);
        ctx.fillStyle = '#2b1d14'; ctx.fillRect(cx + 10, cy + 11, 1.4, 1.4); ctx.fillRect(cx + 13, cy + 11, 1.4, 1.4);
      } else {
        ctx.fillStyle = c.driver; ctx.beginPath(); ctx.arc(cx + 12, cy + 12, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx + 12, cy + 10, 4.5, Math.PI, 0); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(cx + 4, cy + 4, 3, 9);
    };
    if (uy < -0.2) { jib(); peak(); cab(); } else { peak(); jib(); cab(); }
  },
  // the hook, its cable and its load, drawn by the hook's spot on the ground (in front of whatever it is over); a piece
  // just grabbed swings up from its pile onto the hook
  drawHook(r, g, c, pose) {
    const ctx = r.ctx, G = this.hookAt(c, pose), x = G.x, hy = G.y - pose.z, ty = G.y - c.H;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 2, ty + 4); ctx.lineTo(x - 2, hy); ctx.moveTo(x + 2, ty + 4); ctx.lineTo(x + 2, hy); ctx.stroke();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x - 5, hy - 2, 10, 8, 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, hy + 10, 4, 0, Math.PI); ctx.stroke();
    if (!pose.load) return;
    const kind = pose.kind || 'panel';
    if (c.drawLoad && c.drawLoad(r, g, c, kind, x, hy + 12)) return;
    let px = x, py = hy + 31;
    if (c.lift && pose.ph === 'driven') { const k = U.clamp(c.lift.t / CFG.TOWERCRANE.LIFT, 0, 1), e = 1 - Math.pow(1 - k, 3); px = U.lerp(c.lift.from.x, x, e); py = U.lerp(c.lift.from.y, hy + 31, e) - Math.sin(k * Math.PI) * 12; }
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, hy + 12); ctx.lineTo(px - 12, py - 9); ctx.moveTo(x, hy + 12); ctx.lineTo(px + 12, py - 9); ctx.stroke();
    this.drawPiece(ctx, kind, px, py);
  },
  // a piece centred at (x, y): an orange rocket panel, a red steel beam, or a bucket of concrete
  drawPiece(ctx, kind, x, y, a) {
    if (a !== undefined) ctx.globalAlpha = a;
    if (kind === 'beam') {
      ctx.fillStyle = '#c0392b'; U.roundRect(ctx, x - 22, y - 7, 44, 14, 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 22, y - 3, 44, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 20, y - 6, 40, 2);
      ctx.fillStyle = '#7d1f16'; for (const dx of [-14, 0, 14]) { ctx.beginPath(); ctx.arc(x + dx, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 'bucket') {
      ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.moveTo(x - 13, y - 9); ctx.lineTo(x + 13, y - 9); ctx.lineTo(x + 9, y + 10); ctx.lineTo(x - 9, y + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b9b5ad'; ctx.beginPath(); ctx.ellipse(x, y - 9, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 11, y - 2, 22, 3);
    } else {
      ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, x - 14, y - 9, 28, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 12, y - 7, 24, 3);
      ctx.fillStyle = '#c9ccd2'; for (const dx of [-9, 9]) { ctx.beginPath(); ctx.arc(x + dx, y + 3, 1.6, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  },
  // a piece put down: it lies on the ground a while, then slides home to its pile
  drawLoose(r, g, c, o) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(o.x + 2, o.y + 3, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    this.drawPiece(ctx, o.kind, o.x, o.y - 6);
  },
  // a piece the crane put on its target (with a white flash as it clicks on); `spot` may say `turn` for a beam on a side wall
  drawPlacedPiece(r, g, c, p) {
    const ctx = r.ctx, x = p.x, y = p.y - p.z, turn = p.turn && p.kind === 'beam';   // a beam lies along its wall
    ctx.save(); ctx.translate(x, y); if (turn) ctx.rotate(Math.PI / 2);
    this.drawPiece(ctx, p.kind, 0, 0);
    if (p.t < 0.5) { ctx.strokeStyle = `rgba(255,255,255,${(1 - p.t / 0.5).toFixed(3)})`; ctx.lineWidth = 3; U.roundRect(ctx, -25, -12, 50, 24, 5); ctx.stroke(); }
    ctx.restore();
  },
  // a little crane worker: hi-vis shirt, hard hat; hops when cheering
  drawWorker(r, g, w) {
    const ctx = r.ctx;
    if (w.hop > 0.5) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(w.x, w.y + 2, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(w.x, w.y - (w.hop || 0)); ctx.scale(0.82, 0.82);
    r.drawPerson(0, 0, { shirt: w.shirt || '#ff8c42', stripes: true, skin: w.skin || '#e0ac69', hair: '#2b1d14', hairStyle: 0, facing: w.facing || 1, moving: false, bob: 0, carry: 0, pants: '#3a3f5c' });
    ctx.fillStyle = w.hat || '#ffd166'; ctx.beginPath(); ctx.arc(0, -42, 11.5, Math.PI, 0); ctx.fill(); U.roundRect(ctx, -14, -43, 28, 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-4, -48, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // while driving: a ring on the ground under the hook (green when the button can grab or place)
  drawAim(r, g, c) {
    const ctx = r.ctx, G = this.hook(c), tg = this.target(g, c), good = tg.what === 'grab' || tg.what === 'place', pulse = 1 + Math.sin(g.time * 5) * 0.08;
    ctx.fillStyle = good ? 'rgba(65,184,131,0.25)' : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(G.x, G.y, 26 * pulse, 11 * pulse, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = good ? '#41b883' : '#fff'; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.ellipse(G.x, G.y, 26 * pulse, 11 * pulse, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(G.x, G.y, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  },
};

// ---------- Construction Town's tower crane ----------
// It stands by the half-built house's north-east corner (where the old static crane's swinging jib used to be across the
// site): its pile is the two pallets beside the house (steel beams on one, buckets of concrete on the other) and its
// target is the house: pieces click on along the top of the nearest wall, two builders on the slab cheer.
CFG.SITE_CRANE = { BASE: { x: 3040, y: 280 }, HEIGHT: 300, REACH: 250, WALL_Z: 18 };
TowerCrane.create({
  id: 'site', area: 'site', base: CFG.SITE_CRANE.BASE, seat: { x: CFG.SITE_CRANE.BASE.x + 34, y: CFG.SITE_CRANE.BASE.y + 6 },
  height: CFG.SITE_CRANE.HEIGHT, reach: CFG.SITE_CRANE.REACH, counter: 60, driver: '#c68642',
  piles: CFG.SITE.PALLETS.map(([x, y], i) => ({ x, y, kind: i % 2 ? 'bucket' : 'beam' })),
  fetchHint: 'Move the hook to the pallets! 🪝',
  targets: [(() => {
    const B = CFG.SITE.BUILDING;
    return {
      x: B.x0, y: B.y0, w: B.x1 - B.x0, h: B.y1 - B.y0, label: '🏠 Put it on the house', hint: 'Put it on the house! 🏠', carryHint: 'Move it over to the house! 🏠',
      // on the top of the wall nearest the hook (a little inside its corners)
      spot(g, c, H) {
        const x = U.clamp(H.x, B.x0 + 24, B.x1 - 24), y = U.clamp(H.y, B.y0 + 7, B.y1 - 7);
        const d = [[Math.abs(H.y - B.y0), { x, y: B.y0 + 7 }], [Math.abs(H.y - B.y1), { x: x > B.door.x - B.door.half - 20 && x < B.door.x + B.door.half + 20 ? B.door.x - B.door.half - 22 : x, y: B.y1 - 7 }], [Math.abs(H.x - B.x0), { x: B.x0 + 7, y, turn: true }], [Math.abs(H.x - B.x1), { x: B.x1 - 7, y, turn: true }]];
        d.sort((a, b) => a[0] - b[0]);
        return Object.assign(d[0][1], { z: CFG.SITE_CRANE.WALL_Z });
      },
    };
  })()],
  crew: [{ x: 2930, y: 470, shirt: '#3b7dd8', hat: '#ffd166', skin: '#8d5524', facing: 1 }, { x: 2790, y: 410, shirt: '#41b883', hat: '#ff8c42', skin: '#f1c27d', facing: 1 }],
});
// a stack of steel beams and a bucket of concrete on the site's pallets, for the crane
TowerCrane.paintAfterSite = function (r, g, area) {
  if (area !== 'site') return;
  const ctx = r.ctx, [b, k] = CFG.SITE.PALLETS;
  for (let i = 0; i < 3; i++) TowerCrane.drawPiece(ctx, 'beam', b[0] + (i % 2) * 3, b[1] - 18 - i * 8);
  TowerCrane.drawPiece(ctx, 'bucket', k[0] - 8, k[1] - 22); TowerCrane.drawPiece(ctx, 'bucket', k[0] + 10, k[1] - 18);
};
{ const pa = TowerCrane.paintAfter; TowerCrane.paintAfter = function (r, g, area) { pa.call(this, r, g, area); TowerCrane.paintAfterSite(r, g, area); }; }

Game.ext.unshift(TowerCrane);   // build() moves it to the very front once every extension has loaded
Render.ext.push(TowerCrane);
