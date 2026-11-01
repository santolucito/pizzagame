'use strict';
// Snowy Peak: a snow map reached by a ski lift from Construction Town.
//   - Construction Town: a little timber lift station right beside the Pizza Mine (west of its hill), with a big wheel
//     and chairs going up a cable towards the mountains. '🚡 Ride the ski lift' → a full-screen cut-scene (the chef on a
//     swinging chair going up a snowy slope) → the top station of Snowy Peak. '🚡 Ride down' there goes back.
//   - Snowy Peak (map 'snow', the rectangle 5000..7400 × 5000..6600, its own sky band with peaks along the top):
//     the runs go downhill from north to south. An in-map lift from the bottom station glides back to the top.
//     * Sledding hill (west): '🛷 Grab a sled' at the rack → vehicle 'sled': slides downhill by itself, the joystick
//       steers left/right, soft bumps off trees, stops on the flat at the bottom ("Wheee!").
//     * Ski run (middle-east): '⛷️ Put on skis' at the ski hut → vehicle 'skis' (a bit faster): eight slalom gates
//       (sparkle + "3 / 8 gates"), a jump ramp ("Whoosh!"), a finish arch with the time. A tree only stops you: "Oops! ❄️".
//     * Snowman meadow (east): '❄️ Roll a snowball', walk to push it (it grows and leaves a track), push it onto
//       another ball to stack it ('⛄ Stack it!'), three high → '🥕 Add a face'. Up to 3 finished snowmen stay (saved).
//     * A cocoa cabin with a $3 hot cocoa pad (carried 30 s), kids sledding, a friendly snow dog, pines, falling
//       snow and footprints.
// Extension module: Game.ext.unshift + Render.ext.push (see js/EXTENSIONS.md).

CFG.SNOW = {
  WORLD: { x0: 5000, y0: 5000, x1: 7400, y1: 6600, walkY0: 5172 },
  SKY_H: 150,
  TRAVEL_DUR: 6,
  // ---- Construction Town: the lift station on the grass west of the mine's hill (x 3976..4124, y -98..34)
  CT: {
    HUT: { x0: 3976, y0: -98, x1: 4064, y1: -14 },          // the timber hut (solid)
    DECK: { x0: 4064, y0: -84, x1: 4124, y1: 34 },          // the boarding deck (walkable planks)
    WHEEL: { x: 4094, y: -66, h: 48, r: 24 },               // the big wheel on its post (ground spot, height, radius)
    BOARD: { x: 4106, y: 24 },                               // stand here: '🚡 Ride the ski lift'
  },
  // ---- Snowy Peak
  TOP: { x0: 5560, y0: 5150, x1: 5770, y1: 5236 },           // the top station (solid footprint)
  TOP_SPOT: { x: 5640, y: 5270 },                            // '🚡 Ride down' (to Construction Town)
  ARRIVE: { x: 5640, y: 5318 },                              // where the chef steps off a lift at the top
  BOTTOM: { x0: 5650, y0: 6500, x1: 5750, y1: 6560 },        // the bottom station (solid footprint)
  BOTTOM_SPOT: { x: 5640, y: 6452 },                         // '🚡 Ride up'
  STRANDS: [5684, 5716], CABLE_H: 104, LIFT_SPEED: 340,
  TOWERS: [5560, 5860, 6160],                                // lift towers along x 5700
  SLOPE: { x0: 5040, y0: 5340, x1: 6460, y1: 6290 },         // where the snow slides you downhill
  RACK: { x: 5330, y: 5232 }, RACK_SPOT: { x: 5330, y: 5272 },
  SKI_HUT: { x0: 6060, y0: 5160, x1: 6190, y1: 5236 }, SKI_SPOT: { x: 6125, y: 5272 },
  // eight flag gates, swinging gently left and right of the middle of the run: going straight down the middle
  // still passes them all (a five-year-old's slalom), steering towards each flag pair is the fun part
  GATES: [{ x: 6075, y: 5420 }, { x: 6175, y: 5520 }, { x: 6075, y: 5620 }, { x: 6175, y: 5720 },
    { x: 6075, y: 5920 }, { x: 6175, y: 6020 }, { x: 6075, y: 6120 }, { x: 6175, y: 6210 }],
  GATE_HALF: 56,
  RAMP: { x: 6125, y: 5820, w: 100, h: 44 },                 // the jump ramp (its lip is at y)
  FINISH_Y: 6268, FINISH: { x0: 5790, x1: 6450 },
  FENCE: { x: 6458, y0: 5340, y1: 6290 },
  // pines: [x, y, size]
  TREES: [[5030, 5400, 1.2], [5040, 5700, 1.1], [5025, 6000, 1.3], [5045, 6250, 1], [5290, 5560, 1], [5470, 5700, 0.9],
    [5130, 5850, 1], [5320, 6020, 1.1], [5480, 6180, 0.9], [5830, 5480, 1], [6420, 5600, 1.1], [5840, 5900, 0.9],
    [6410, 6050, 1], [5850, 6200, 1], [5100, 5222, 1.1], [5520, 5206, 1], [5900, 5212, 1.1], [6300, 5204, 1], [6480, 5226, 1.2],
    [5200, 6530, 1], [5450, 6566, 1.1], [6000, 6540, 1], [6300, 6522, 1.2], [6520, 5970, 1], [7360, 5300, 1.2],
    [7370, 5700, 1.1], [7350, 6100, 1.2], [7360, 6450, 1], [6580, 6510, 1.1], [7120, 5980, 0.9], [6900, 5220, 1], [7220, 5212, 1.1]],
  MEADOW: { x0: 6540, y0: 5250, x1: 7340, y1: 5910 },
  CABIN: { x0: 6700, y0: 6080, x1: 6960, y1: 6200 }, COCOA_PAD: { x: 6830, y: 6266 }, COCOA_T: 30, COCOA_PRICE: 3,
  DOG: { x0: 6580, y0: 5960, x1: 7300, y1: 6500, home: { x: 7040, y: 6290 } },
  KIDS: [{ lane: 5200, delay: 0, shirt: '#e4572e', cap: '#3b7dd8', sled: '#3b7dd8' }, { lane: 5400, delay: 6, shirt: '#8e5bd1', cap: '#ffd166', sled: '#2f9e44' },
    { lane: 5545, delay: 12, shirt: '#2f9e44', cap: '#e4572e', sled: '#ffd166' }],
  KID_UP_X: 5090,
  SLED: { acc: 120, max: 240, steer: 170, push: 120 },
  SKI: { acc: 160, max: 300, steer: 210, push: 120 },
  JUMP: { dur: 0.75, h: 46 },
  BALL: { r0: 10, r1: 28, grow: 520, reach: 60 },
  MEN_MAX: 3,
};
CFG.AREAS.snow = { WORLD: CFG.SNOW.WORLD, noSky: true };
CFG.VEHICLES.sled = { speed: 0, radius: 15, label: '🛷 Hop on', exit: '🚶 Hop off' };
CFG.VEHICLES.skis = { speed: 0, radius: 14, label: '⛷️ Skis', exit: '🚶 Take off skis' };

const SnowExt = {
  name: 'snow',
  st: null,
  defaults: { snow: { seen: false, rides: 0, sleds: 0, runs: 0, best: 0, gatesBest: 0, jumps: 0, built: 0, men: [], cocoas: 0 } },

  // ---------- state ----------
  build(g) {
    const d = JSON.parse(JSON.stringify(this.defaults.snow));
    const s = Object.assign(d, g.s.snow || {});
    s.men = Array.isArray(s.men) ? s.men.filter((m) => m && Array.isArray(m.r) && m.r.length === 3).slice(-CFG.SNOW.MEN_MAX) : [];
    g.s.snow = s;
    const S = CFG.SNOW;
    this.st = {
      sled: null, skis: null, lift: null, run: null, cocoa: 0,
      ball: null, stacks: [], tracks: [], prints: [], lastPrint: null, lastP: null, printSide: 1,
      kids: S.KIDS.map((k, i) => ({ i, lane: k.lane, x: k.lane, y: 5300, state: 'wait', t: k.delay * 0.4 + 1, v: 0, path: null, facing: 1, bob: 0, moving: false, say: null, hop: 0, look: k })),
      dog: { x: S.DOG.home.x, y: S.DOG.home.y, tx: S.DOG.home.x, ty: S.DOG.home.y, wait: 1, facing: -1, moving: false, bob: 0, hop: 0, say: null, sayT: 0, wagT: 0 },
      fade: 0,
    };
    this.st.obs = this.buildObs();
  },
  save(g) { if (!this.st || !g.s.snow) this.build(g); return g.s.snow; },
  buildObs() {
    const S = CFG.SNOW, o = [];
    const box = (b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    o.push(box(S.TOP), box(S.BOTTOM), box(S.SKI_HUT), box(S.CABIN));
    o.push({ x: S.RACK.x - 50, y: S.RACK.y - 36, w: 100, h: 40 });
    for (const [x, y, s] of S.TREES) o.push({ x: x - 10 * s, y: y - 9, w: 20 * s, h: 14 });
    for (const ty of S.TOWERS) o.push({ x: 5700 - 7, y: ty - 6, w: 14, h: 10 });
    o.push({ x: S.FENCE.x - 4, y: S.FENCE.y0, w: 8, h: S.FENCE.y1 - S.FENCE.y0 });
    return o;
  },
  ctObs() { const H = CFG.SNOW.CT.HUT; return [{ x: H.x0, y: H.y0, w: H.x1 - H.x0, h: H.y1 - H.y0 }]; },

  // ---------- helpers ----------
  mine(v) { return !!v && (v.kind === 'sled' || v.kind === 'skis') && (v === this.st.sled || v === this.st.skis); },
  riding(g) { return g.driving && this.st && this.mine(g.vehicle); },
  busy(g) {
    return g.onTrain || g.ride || g.travel || g.fishing ||
      (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))));
  },
  onFoot(g) { return !g.driving && !this.busy(g) && !(this.st && this.st.lift); },
  near(g, s, d) { return U.dist(g.player.x, g.player.y, s.x, s.y) < d; },
  inRect(x, y, R) { return x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1; },
  inMeadow(x, y) { return this.inRect(x, y, CFG.SNOW.MEADOW); },
  onSlope(x, y) { const L = CFG.SNOW.SLOPE; return x > L.x0 && x < L.x1 && y >= L.y0 && y < L.y1; },
  inRunout(x, y) { const L = CFG.SNOW.SLOPE; return y >= L.y1 - 10 && x > L.x0 - 20 && x < L.x1 + 20; },
  say(g, x, y, text, color, big = true, dur = 1.4) { g.floats.push({ x, y, text, color: color || '#ffe08a', t: 0, dur, big }); },
  sparkle(g, x, y, n = 6, spread = 22) { for (let i = 0; i < n; i++) g.fx.push({ kind: 'sparkle', x0: x + U.rand(-spread, spread), y0: y + U.rand(-spread, spread * 0.6), x1: 0, y1: 0, t: -i * 0.05, dur: 0.55 }); },
  hash(i) { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); },
  free(g, x, y, r = 11) { return y >= g.walkTop() - 1 && !this.st.obs.some((o) => g.hitRect(x, y, r, o)); },
  speedOf(v) { return Math.hypot(v.sx || 0, v.sy || 0); },
  newSled(x, y) { return { kind: 'sled', x, y, angle: Math.PI / 2, vx: 0, vy: 0, sx: 0, sy: 0, z: 0, air: null, bump: 0, side: 1, run: false }; },
  newSkis(x, y) { return { kind: 'skis', x, y, angle: Math.PI / 2, vx: 0, vy: 0, sx: 0, sy: 0, z: 0, air: null, bump: 0, side: 1, run: false }; },
  stackBase(sk) { return sk.balls[0] || 0; },
  // the radii drawn for a stack: biggest at the bottom, each one a little smaller than the one under it
  stackRadii(balls) {
    const out = [], sorted = balls.slice().sort((a, b) => b - a);
    for (let i = 0; i < sorted.length; i++) out.push(i ? Math.min(sorted[i], out[i - 1] * 0.8) : sorted[i]);
    return out;
  },
  sizeOf(r) { const B = CFG.SNOW.BALL; return r < B.r0 + (B.r1 - B.r0) * 0.38 ? 1 : r < B.r0 + (B.r1 - B.r0) * 0.8 ? 2 : 3; },

  // ---------- game hooks ----------
  obstacles(g, forCar) {
    if (!this.st) this.build(g);
    if (g.area === 'site') return this.ctObs();
    if (g.area !== 'snow') return [];
    if (forCar && this.riding(g)) return [];   // the sled and the skis do their own bumping
    return this.st.obs;
  },
  vehicles(g) {
    if (!this.st || g.area !== 'snow') return [];
    const v = [];
    if (this.st.sled) v.push(this.st.sled);
    if (this.st.skis) v.push(this.st.skis);
    return v;
  },
  action(g) {
    if (!this.st) this.build(g);
    const S = CFG.SNOW, st = this.st;
    if (g.area === 'site') {
      if (!this.onFoot(g)) return null;
      if (this.near(g, S.CT.BOARD, 40)) return { label: '🚡 Ride the ski lift', run: (gg) => this.rideUpMountain(gg) };
      return null;
    }
    if (g.area !== 'snow' || this.busy(g) || st.lift) return null;
    const p = g.player;
    if (g.driving) {
      if (!this.riding(g)) return null;
      const v = g.vehicle;
      if (this.near(g, S.TOP_SPOT, 44)) return { label: '🚡 Ride down', run: (gg) => this.rideDownMountain(gg) };
      if (this.inRunout(v.x, v.y) && this.speedOf(v) < 70 && !v.air) return { label: '🚡 Ride up', run: (gg) => this.startLift(gg) };
      return null;
    }
    if (st.ball) {
      const sk = this.stackNear(g, st.ball, true);
      if (sk) return { label: '⛄ Stack it!', run: (gg) => this.stackOnto(gg, sk) };
      return { label: '✋ Let go', run: (gg) => this.letGo(gg) };
    }
    if (this.near(g, S.TOP_SPOT, 40)) return { label: '🚡 Ride down', run: (gg) => this.rideDownMountain(gg) };
    if (this.near(g, S.BOTTOM_SPOT, 44)) return { label: '🚡 Ride up', run: (gg) => this.startLift(gg) };
    if (this.near(g, S.RACK_SPOT, 46)) return { label: '🛷 Grab a sled', run: (gg) => this.grabSled(gg) };
    if (this.near(g, S.SKI_SPOT, 46)) return { label: '⛷️ Put on skis', run: (gg) => this.putOnSkis(gg) };
    const done = st.stacks.find((sk) => sk.balls.length >= 3 && U.dist(p.x, p.y, sk.x, sk.y) < this.stackBase(sk) + 130);
    if (done) return { label: '🥕 Add a face', run: (gg) => this.addFace(gg, done) };
    const loose = st.stacks.find((sk) => sk.balls.length === 1 && U.dist(p.x, p.y, sk.x, sk.y) < sk.balls[0] + 46);
    if (loose) return { label: '❄️ Push the snowball', run: (gg) => this.pushLoose(gg, loose) };
    if (this.inMeadow(p.x, p.y)) return { label: '❄️ Roll a snowball', run: (gg) => this.rollBall(gg) };
    const d = st.dog;
    if (U.dist(p.x, p.y, d.x, d.y) < 56) return { label: '🐶 Pat the dog', run: (gg) => this.patDog(gg) };
    return null;
  },
  hint(g) {
    if (!this.st) return undefined;
    const S = CFG.SNOW, st = this.st, p = g.player;
    if (g.area === 'site') {
      if (!this.onFoot(g)) return undefined;
      const d = U.dist(p.x, p.y, S.CT.BOARD.x, S.CT.BOARD.y);
      if (d < 70) return { text: 'Ride the ski lift up to the snow! 🚡', target: d < 34 ? null : S.CT.BOARD };
      return undefined;
    }
    if (g.area !== 'snow' || g.travel) return undefined;
    if (this.busy(g)) return null;
    if (st.lift) return { text: 'Up we go! 🚡', target: null };
    const s = g.s.snow;
    if (g.driving) {
      const v = g.vehicle; if (!this.riding(g)) return null;
      const ski = v.kind === 'skis';
      if (this.inRunout(v.x, v.y)) return this.speedOf(v) < 70 ? { text: 'Ride up the lift for another go! 🚡', target: null } : { text: ski ? 'Swoosh! ⛷️' : 'Wheee! 🛷', target: null };
      if (this.onSlope(v.x, v.y)) {
        if (ski) return { text: `Steer through the flags! ${st.run ? st.run.gates.length : 0} / ${S.GATES.length} 🚩`, target: null };
        return { text: 'Steer left and right! 🛷', target: null };
      }
      if (ski) return { text: 'Ski down the hill through the flags! ⛷️', target: { x: v.x, y: S.SLOPE.y0 + 40 } };
      return { text: 'Push the sled down the hill! 🛷', target: { x: v.x, y: S.SLOPE.y0 + 40 } };
    }
    if (st.ball) {
      const b = st.ball, sk = this.stackNear(g, b, true) || this.nearestStack(b, 3);
      if (sk) return { text: 'Push it onto the other snowball! ⛄', target: { x: sk.x, y: sk.y } };
      if (this.sizeOf(b.r) < 3) return { text: 'Walk around to roll it bigger! ❄️', target: null };
      return { text: 'Big snowball! Let go and roll another ❄️', target: null };
    }
    if (this.near(g, S.TOP_SPOT, 40)) return { text: 'Ride the lift back down to Construction Town 🚡', target: null };
    if (this.near(g, S.BOTTOM_SPOT, 44)) return { text: 'Ride the lift up the mountain! 🚡', target: null };
    if (this.near(g, S.RACK_SPOT, 46)) return { text: 'Grab a sled! 🛷', target: null };
    if (this.near(g, S.SKI_SPOT, 46)) return { text: 'Put on the skis! ⛷️', target: null };
    if (st.cocoa > 0 && this.near(g, S.COCOA_PAD, 60)) return { text: 'Mmm, hot cocoa! ☕', target: null };
    const done = st.stacks.find((sk) => sk.balls.length >= 3);
    if (done) return { text: 'Give the snowman a face! 🥕', target: { x: done.x, y: done.y + 20 } };
    if (this.inMeadow(p.x, p.y)) {
      if (st.stacks.length) return { text: 'Roll another snowball and stack it! ⛄', target: null };
      return { text: 'Roll a snowball for a snowman! ⛄', target: null };
    }
    const sled = st.sled;
    if (sled && !g.driving && U.dist(p.x, p.y, sled.x, sled.y) < 70) return { text: 'Hop on the sled! 🛷', target: null };
    if (p.y > S.SLOPE.y1 - 10 && p.x < S.SLOPE.x1 + 20) return { text: 'Ride the lift up the mountain! 🚡', target: S.BOTTOM_SPOT };
    if (!s.sleds) return { text: 'Grab a sled and slide down! 🛷', target: S.RACK_SPOT };
    if (!s.runs) return { text: 'Put on skis! ⛷️', target: S.SKI_SPOT };
    if (!s.built) return { text: 'Build a snowman! ⛄', target: { x: (S.MEADOW.x0 + S.MEADOW.x1) / 2, y: S.MEADOW.y0 + 120 } };
    if (!s.cocoas) return { text: 'Warm up with a hot cocoa! ☕', target: S.COCOA_PAD };
    return { text: 'Sled, ski or build a snowman! ❄️', target: null };
  },
  pads(g) {
    if (g.area !== 'snow' || !this.st) return [];
    const S = CFG.SNOW;
    return [{ key: 'snowCocoa', label: 'Hot cocoa', ico: '☕', pos: S.COCOA_PAD, price: S.COCOA_PRICE, sub: 'warm & yummy' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'snowCocoa') return;
    const p = g.player, s = this.save(g);
    this.st.cocoa = CFG.SNOW.COCOA_T; s.cocoas++;
    this.say(g, p.x, p.y - 74, 'Mmm, hot cocoa! ☕', '#ffe08a', true, 1.6);
    Haptics.success();
  },
  arrive(g, tr) {
    if (tr.via !== 'skilift') return;
    if (!this.st) this.build(g);
    const S = CFG.SNOW, p = g.player, s = this.save(g), st = this.st;
    st.lift = null; st.ball = null;
    if (tr.to === 'snow') {
      p.x = S.ARRIVE.x; p.y = S.ARRIVE.y; p.facing = 1;
      s.rides++;
      if (!s.seen) { s.seen = true; g.toast('⛄ Welcome to Snowy Peak!', true); }
      else this.say(g, p.x, p.y - 80, 'Snowy Peak! 🏔️', '#ffffff', true, 1.6);
    } else {
      p.x = S.CT.BOARD.x; p.y = S.CT.BOARD.y; p.facing = 1;
    }
    p.moving = false; p.hasMoved = true; g.cameraSnap = true;
    st.lastP = null; st.lastPrint = null;
    if (g.save) g.save();
  },
  home(g) {
    if (!this.st) return;
    const st = this.st;
    st.lift = null; st.ball = null; st.run = null; st.cocoa = 0; st.skis = null; st.sled = null; st.stacks = []; st.tracks = []; st.prints = []; st.lastP = null; st.lastPrint = null;
  },

  // ---------- the lifts ----------
  rideUpMountain(g) {
    Sfx.chime(); Haptics.tap();
    g.startTravel('snow', 'skilift', CFG.SNOW.TRAVEL_DUR);
  },
  rideDownMountain(g) {
    this.parkGear(g);
    this.st.ball = null;
    Sfx.chime(); Haptics.tap();
    g.startTravel('site', 'skilift', CFG.SNOW.TRAVEL_DUR);
  },
  // step off the sled / skis: both go back to their rack and hut
  parkGear(g) {
    const st = this.st;
    if (this.riding(g)) { g.driving = false; g.vehicle = null; }
    st.sled = null; st.skis = null; st.run = null;
  },
  startLift(g) {
    const st = this.st, p = g.player;
    let veh = null;
    if (this.riding(g)) {
      veh = g.vehicle; g.driving = false; g.vehicle = null;
      veh.sx = 0; veh.sy = 0; veh.vx = 0; veh.vy = 0; veh.air = null; veh.z = 0; veh.bump = 0; veh.run = false;
    } else if (st.sled && this.inRunout(st.sled.x, st.sled.y)) st.sled = null;   // a sled left at the bottom goes back to its rack
    st.run = null; st.ball = null;
    st.lift = { t: 0, from: { x: p.x, y: p.y }, veh, gx: p.x, gy: p.y, lift: 0, sway: 0 };
    Sfx.pickup(); Haptics.tap();
  },
  stepLift(g, dt) {
    const S = CFG.SNOW, st = this.st, L = st.lift, p = g.player;
    L.t += dt;
    const bx = S.STRANDS[0], by = S.BOTTOM_SPOT.y;
    const walk = U.clamp(U.dist(L.from.x, L.from.y, bx, by) / 320, 0.2, 1.4);
    if (L.t < walk) {
      const k = L.t / walk; L.gx = U.lerp(L.from.x, bx, k); L.gy = U.lerp(L.from.y, by, k); L.lift = 0;
      p.facing = bx < L.from.x ? -1 : 1; p.moving = true; p.bob += dt * 14;
    } else {
      const total = by - S.ARRIVE.y, d = (L.t - walk) * S.LIFT_SPEED;
      L.gx = bx; L.gy = by - Math.min(d, total);
      L.lift = 40 * U.clamp(Math.min(d / 70, (total - d) / 70), 0, 1);
      L.sway = Math.sin(g.time * 2.4) * 0.08;
      p.moving = false; p.facing = 1;
      if (d >= total) {
        const v = L.veh;
        st.lift = null;
        p.x = S.ARRIVE.x; p.y = S.ARRIVE.y; p.moving = false;
        if (v) { v.x = S.ARRIVE.x; v.y = S.ARRIVE.y; v.angle = Math.PI / 2; g.vehicle = v; g.driving = true; }
        this.say(g, p.x, p.y - 80, 'At the top! 🏔️', '#ffffff', true, 1.4);
        st.lastP = null; st.lastPrint = null;
        return;
      }
    }
    p.x = L.gx; p.y = L.gy - L.lift; p.hasMoved = true;
  },

  // ---------- sled and skis ----------
  grabSled(g) {
    const S = CFG.SNOW, st = this.st, p = g.player;
    st.ball = null;
    st.sled = this.newSled(S.RACK_SPOT.x, S.RACK_SPOT.y + 8);
    p.x = st.sled.x; p.y = st.sled.y;
    g.vehicle = st.sled; g.driving = true;
    this.say(g, p.x, p.y - 70, '🛷 Wheee!', '#ffffff', true, 1.2);
    Sfx.pickup(); Haptics.tap();
  },
  putOnSkis(g) {
    const S = CFG.SNOW, st = this.st, p = g.player;
    st.ball = null;
    st.skis = this.newSkis(S.SKI_SPOT.x, S.SKI_SPOT.y + 8);
    p.x = st.skis.x; p.y = st.skis.y;
    g.vehicle = st.skis; g.driving = true; st.run = null;
    this.say(g, p.x, p.y - 74, '⛷️ Skis on!', '#ffffff', true, 1.2);
    Sfx.pickup(); Haptics.tap();
  },
  stepRide(g, dt) {
    const S = CFG.SNOW, st = this.st, v = g.vehicle, p = g.player, a = Input.axis(), ski = v.kind === 'skis', P = ski ? S.SKI : S.SLED, L = S.SLOPE;
    v.vx = 0; v.vy = 0;   // the core's own driving stays still: the snow does the moving
    const prevY = v.y, slope = this.onSlope(v.x, v.y);
    if (v.air) {
      v.air.t += dt; v.z = Math.sin(Math.min(1, v.air.t / S.JUMP.dur) * Math.PI) * S.JUMP.h;
      if (v.air.t >= S.JUMP.dur) { v.air = null; v.z = 0; this.say(g, v.x, v.y - 60, 'Ta-da! ✨', '#ffffff', false, 0.9); }
    }
    if (v.bump > 0) { v.bump -= dt; v.sx = v.side * 130; v.sy = 0; }
    else if (slope || v.air) {
      v.sy = Math.min(P.max, Math.max(v.sy, 20) + P.acc * dt);
      v.sx += (a.x * P.steer - v.sx) * (1 - Math.pow(0.004, dt));
      v.run = true;
    } else if (v.y >= L.y1 - 1 && v.x > L.x0 - 40 && v.x < L.x1 + 40) {
      // the flat at the bottom: slow down to a stop (the joystick can shuffle along once slow)
      const f = Math.pow(0.2, dt); v.sx *= f; v.sy *= f;
      const sp = this.speedOf(v);
      if (sp < 60 && (a.x || a.y)) { v.sx = a.x * P.push * 0.8; v.sy = a.y * P.push * 0.8; }
      else if (sp < 10) { v.sx = 0; v.sy = 0; }
      if (v.run && sp < 14) { v.run = false; this.stopped(g, v); }
    } else {
      // flat ground at the top (or off the runs): push along with the joystick
      const k = 1 - Math.pow(0.01, dt); v.sx += (a.x * P.push - v.sx) * k; v.sy += (a.y * P.push - v.sy) * k;
    }
    // move, bumping off trees, fences and lift towers (not while flying off the ramp)
    const r = CFG.VEHICLES[v.kind].radius, W = S.WORLD, top = Math.max(W.y0 + 30, g.walkTop() + r - 12);
    const obs = v.air ? [] : st.obs.filter((o) => !g.hitRect(v.x, v.y, r, o));
    let nx = U.clamp(v.x + v.sx * dt, W.x0 + 30, W.x1 - 30);
    for (const o of obs) if (g.hitRect(nx, v.y, r, o)) { nx = v.sx > 0 ? o.x - r : o.x + o.w + r; v.sx = 0; }
    v.x = nx;
    let ny = U.clamp(v.y + v.sy * dt, top, W.y1 - 30), hit = null;
    for (const o of obs) if (g.hitRect(v.x, ny, r, o)) { ny = v.sy > 0 ? o.y - r : o.y + o.h + r; hit = o; }
    if (hit && v.sy > 60 && (slope || this.onSlope(v.x, ny + 4))) {
      v.bump = 0.36; v.side = v.x < hit.x + hit.w / 2 ? -1 : 1; v.sy = 0; v.sx = 0;
      this.say(g, v.x, v.y - 70, ski ? 'Oops! ❄️' : 'Bump! 🌲', '#ffffff', true, 1.1);
      Sfx.drop(); Haptics.tap();
    } else if (hit) v.sy = 0;
    v.y = ny;
    const sp = this.speedOf(v);
    if (sp > 15) { const tgt = Math.atan2(v.sy, v.sx); let d = tgt - v.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; v.angle += d * Math.min(1, dt * 8); }
    p.x = v.x; p.y = v.y; p.moving = sp > 15; p.hasMoved = true;
    if (Math.abs(v.sx) > 20) p.facing = v.sx < 0 ? -1 : 1;
    // the jump ramp
    const R = S.RAMP;
    if (!v.air && v.sy > 80 && prevY < R.y && v.y >= R.y && Math.abs(v.x - R.x) < R.w / 2) {
      v.air = { t: 0 }; v.z = 0;
      this.say(g, v.x, v.y - 90, 'Whoosh! 💨', '#ffffff', true, 1.3);
      const s = this.save(g); s.jumps++;
      Sfx.tone(300, 0.3, 'sine', 0.045, 500); Haptics.tap();
    }
    if (ski) this.stepGates(g, v, prevY);
    // sled and ski tracks in the snow
    this.addTrack(v.x, v.y, ski ? 'ski' : 'sled', v.air);
  },
  stepGates(g, v, prevY) {
    const S = CFG.SNOW, st = this.st, s = this.save(g);
    if (prevY < S.SLOPE.y0 && v.y >= S.SLOPE.y0) st.run = { t0: g.time, gates: [], done: false };
    const run = st.run; if (!run || run.done) return;
    S.GATES.forEach((gt, i) => {
      if (run.gates.includes(i) || !(prevY < gt.y && v.y >= gt.y) || Math.abs(v.x - gt.x) >= S.GATE_HALF) return;
      run.gates.push(i);
      this.sparkle(g, gt.x, gt.y - 20, 6, 26);
      this.say(g, v.x, v.y - 84, `${run.gates.length} / ${S.GATES.length} gates 🚩`, '#ffe08a', true, 1.2);
      Sfx.tone(880 + run.gates.length * 60, 0.12, 'triangle', 0.035); Haptics.tap();
    });
    const F = S.FINISH;
    if (prevY < S.FINISH_Y && v.y >= S.FINISH_Y && v.x > F.x0 && v.x < F.x1) {
      run.done = true;
      const time = Math.max(0.1, g.time - run.t0), tt = time.toFixed(1);
      s.runs++; s.gatesBest = Math.max(s.gatesBest || 0, run.gates.length);
      const best = !s.best || time < s.best; if (best) s.best = Math.round(time * 10) / 10;
      run.time = time;
      this.say(g, v.x, v.y - 110, `Finish! ⏱️ ${tt} s`, '#ffe08a', true, 2.4);
      this.say(g, v.x, v.y - 84, `🎉 ${run.gates.length} / ${S.GATES.length} gates`, '#ffffff', true, 2.4);
      this.sparkle(g, v.x, S.FINISH_Y - 60, 12, 60);
      Sfx.unlock(); Haptics.success();
      if (g.save) g.save();
    }
  },
  stopped(g, v) {
    const s = this.save(g);
    if (v.kind === 'sled') {
      s.sleds++;
      this.say(g, v.x, v.y - 80, 'Wheee! 🛷', '#ffe08a', true, 1.8);
      this.sparkle(g, v.x, v.y - 20, 5, 20);
      Haptics.success();
      if (g.save) g.save();
    }
  },
  addTrack(x, y, kind, air) {
    const st = this.st, lp = st.lastPrint;
    if (air) { st.lastPrint = null; return; }
    const step = kind === 'foot' ? 20 : 12;
    if (lp && U.dist(lp.x, lp.y, x, y) < step) return;
    st.printSide = -st.printSide;
    st.prints.push({ x, y, kind, t: 0, side: st.printSide, ang: lp ? Math.atan2(y - lp.y, x - lp.x) : Math.PI / 2, jump: lp && U.dist(lp.x, lp.y, x, y) > 60 });
    st.lastPrint = { x, y };
    if (st.prints.length > 110) st.prints.shift();
  },

  // ---------- snowman ----------
  rollBall(g) {
    const st = this.st, p = g.player, B = CFG.SNOW.BALL, M = CFG.SNOW.MEADOW, f = p.facing || 1;
    const x = U.clamp(p.x + f * (B.r0 + 16), M.x0 + B.r0, M.x1 - B.r0), y = U.clamp(p.y + 2, M.y0 + 10, M.y1);
    st.ball = { x, y, r: B.r0, dist: 0, roll: 0, dir: { x: f, y: 0 }, age: 0, size: 1 };
    st.lastP = { x: p.x, y: p.y };
    this.say(g, x, y - 40, '❄️', '#ffffff', true, 0.9);
    Sfx.pickup(); Haptics.tap();
  },
  pushLoose(g, sk) {
    const st = this.st, p = g.player, B = CFG.SNOW.BALL;
    st.stacks = st.stacks.filter((x) => x !== sk);
    const r = sk.balls[0], dist = (r - B.r0) / (B.r1 - B.r0) * B.grow, dx = sk.x - p.x, dy = sk.y - p.y, d = Math.hypot(dx, dy) || 1;
    st.ball = { x: sk.x, y: sk.y, r, dist, roll: 0, dir: { x: dx / d, y: dy / d }, age: 0, size: this.sizeOf(r) };
    st.lastP = { x: p.x, y: p.y };
    Sfx.pickup(); Haptics.tap();
  },
  letGo(g) {
    const st = this.st, b = st.ball; if (!b) return;
    st.ball = null;
    st.stacks.push({ x: b.x, y: b.y, balls: [b.r], t: 0 });
    while (st.stacks.length > 5) st.stacks.shift();
    Sfx.drop(); Haptics.tap();
  },
  // a stack the pushed ball can go on (generous reach when `reach`, touching otherwise)
  stackNear(g, b, reach) {
    let best = null, bd = Infinity;
    for (const sk of this.st.stacks) {
      if (sk.balls.length >= 3) continue;
      const d = U.dist(b.x, b.y, sk.x, sk.y), lim = this.stackBase(sk) + b.r + (reach ? CFG.SNOW.BALL.reach : -6);
      if (d < lim && d < bd) { bd = d; best = sk; }
    }
    return best;
  },
  nearestStack(b, maxBalls) {
    let best = null, bd = Infinity;
    for (const sk of this.st.stacks) { if (sk.balls.length >= maxBalls) continue; const d = U.dist(b.x, b.y, sk.x, sk.y); if (d < bd) { bd = d; best = sk; } }
    return best;
  },
  stackOnto(g, sk) {
    const st = this.st, b = st.ball; if (!b) return;
    st.ball = null;
    sk.balls.push(b.r); sk.balls.sort((x, y) => y - x); sk.t = 0;
    this.sparkle(g, sk.x, sk.y - this.stackBase(sk) * 2, 5, 18);
    this.say(g, sk.x, sk.y - 110, sk.balls.length >= 3 ? 'Now add a face! 🥕' : 'Stacked! ⛄', '#ffffff', true, 1.6);
    Sfx.drop(); Haptics.tap();
  },
  addFace(g, sk) {
    const st = this.st, s = this.save(g), S = CFG.SNOW;
    st.stacks = st.stacks.filter((x) => x !== sk);
    s.men.push({ x: Math.round(sk.x), y: Math.round(sk.y), r: this.stackRadii(sk.balls).map((x) => Math.round(x * 10) / 10), hat: s.built % 3 });
    while (s.men.length > S.MEN_MAX) { const old = s.men.shift(); this.sparkle(g, old.x, old.y - 30, 6, 24); }
    s.built++;
    const top = this.stackRadii(sk.balls).reduce((a, r) => a + r * 1.7, 0);
    this.sparkle(g, sk.x, sk.y - top * 0.6, 12, 40);
    this.say(g, sk.x, sk.y - top - 30, 'You built a snowman! ⛄', '#ffe08a', true, 2.4);
    Sfx.unlock(); Haptics.success();
    if (g.save) g.save();
  },
  stepPush(g, dt) {
    const st = this.st, b = st.ball, p = g.player, S = CFG.SNOW, B = S.BALL, M = S.MEADOW;
    b.age += dt;
    const lp = st.lastP || { x: p.x, y: p.y }, dx = p.x - lp.x, dy = p.y - lp.y, d = Math.hypot(dx, dy);
    st.lastP = { x: p.x, y: p.y };
    if (d > 0.3) { let nx = b.dir.x * 0.7 + (dx / d) * 0.3, ny = b.dir.y * 0.7 + (dy / d) * 0.3; const n = Math.hypot(nx, ny) || 1; b.dir = { x: nx / n, y: ny / n }; }
    const tx = U.clamp(p.x + b.dir.x * (b.r + 16), M.x0 + b.r, M.x1 - b.r), ty = U.clamp(p.y + b.dir.y * (b.r + 10) + 2, M.y0 + 10, M.y1);
    const ox = b.x, oy = b.y, k = Math.min(1, dt * 14);
    b.x += (tx - b.x) * k; b.y += (ty - b.y) * k;
    const moved = Math.hypot(b.x - ox, b.y - oy);
    b.dist += moved; b.roll += moved / Math.max(6, b.r);
    b.r = B.r0 + (B.r1 - B.r0) * Math.min(1, b.dist / B.grow);
    const size = this.sizeOf(b.r);
    if (size > b.size) { b.size = size; this.say(g, b.x, b.y - b.r * 2 - 20, size >= 3 ? 'Big snowball! ❄️' : 'Bigger! ❄️', '#ffffff', true, 1.1); Sfx.pickup(); }
    // the track the ball leaves in the snow
    const lt = st.tracks[st.tracks.length - 1];
    if (!lt || U.dist(lt.x, lt.y, b.x, b.y) > 9) { st.tracks.push({ x: b.x, y: b.y, r: b.r, t: 0, gap: !lt || U.dist(lt.x, lt.y, b.x, b.y) > 30 }); if (st.tracks.length > 260) st.tracks.shift(); }
    // pushed right into another snowball: on it goes
    if (b.age > 0.6) { const sk = this.stackNear(g, b, false); if (sk) { this.stackOnto(g, sk); return; } }
    // walked away from it: it stays where it is
    if (U.dist(p.x, p.y, b.x, b.y) > b.r + 80) this.letGo(g);
  },

  // ---------- the dog and the kids ----------
  patDog(g) {
    const d = this.st.dog, p = g.player;
    d.hop = 0.7; d.say = U.pick(['Woof! 🐾', '❤️', 'Arf arf! 🐶']); d.sayT = 1.6; d.facing = p.x < d.x ? -1 : 1;
    this.say(g, d.x, d.y - 60, '❤️', '#ff8fb1', true, 1.2);
    Sfx.chime(); Haptics.tap();
  },
  stepDog(g, dt) {
    const S = CFG.SNOW, D = S.DOG, d = this.st.dog, p = g.player;
    d.hop = Math.max(0, d.hop - dt); d.sayT = Math.max(0, d.sayT - dt); if (d.sayT <= 0) d.say = null; d.wagT += dt;
    const near = !g.driving && !this.st.lift && U.dist(p.x, p.y, d.x, d.y) < 170 && this.inRect(p.x, p.y, { x0: D.x0 - 60, y0: D.y0 - 120, x1: D.x1 + 60, y1: D.y1 + 60 });
    let tx = d.tx, ty = d.ty, sp = 60;
    if (near) { const side = p.x < d.x ? 1 : -1; tx = U.clamp(p.x + side * 44, D.x0, D.x1); ty = U.clamp(p.y + 6, D.y0, D.y1); sp = 130; }
    else {
      if (d.wait > 0) { d.wait -= dt; d.moving = false; return; }
    }
    // never into the cabin
    const C = S.CABIN; if (this.inRect(tx, ty, { x0: C.x0 - 16, y0: C.y0 - 16, x1: C.x1 + 16, y1: C.y1 + 12 })) ty = C.y1 + 26;
    const dist = U.dist(d.x, d.y, tx, ty);
    if (dist < 4) { d.moving = false; if (!near) { d.wait = U.rand(1, 3); d.tx = U.rand(D.x0, D.x1); d.ty = U.rand(D.y0, D.y1); if (this.inRect(d.tx, d.ty, { x0: C.x0 - 20, y0: C.y0 - 20, x1: C.x1 + 20, y1: C.y1 + 20 })) d.ty = C.y1 + 40; } else if (Math.random() < dt * 0.5) d.hop = 0.5; return; }
    d.moving = true; d.facing = tx < d.x ? -1 : 1; d.bob += dt * 12;
    U.moveToward(d, tx, ty, sp, dt);
  },
  stepKids(g, dt) {
    const S = CFG.SNOW, top = 5300, bottom = 6340, p = g.player;
    for (const k of this.st.kids) {
      k.hop = Math.max(0, k.hop - dt);
      if (k.say) { k.say.t -= dt; if (k.say.t <= 0) k.say = null; }
      if (k.state === 'wait') { k.t -= dt; k.moving = false; if (k.t <= 0) { if (k.y >= bottom - 5) { k.state = 'walk'; k.path = [{ x: S.KID_UP_X, y: bottom }, { x: S.KID_UP_X, y: top }, { x: k.lane, y: top }]; } else { k.state = 'slide'; k.v = 40; } } continue; }
      if (k.state === 'walk') {
        const w = k.path[0]; k.moving = true; k.bob += dt * 12; k.facing = w.x < k.x - 2 ? -1 : w.x > k.x + 2 ? 1 : k.facing;
        if (U.moveToward(k, w.x, w.y, 70, dt)) { k.path.shift(); if (!k.path.length) { k.state = 'wait'; k.t = U.rand(0.8, 2.2); k.y = top; } }
        if (!g.driving && U.dist(p.x, p.y, k.x, k.y) < 110 && !k.say && Math.random() < dt * 0.4) { k.say = { text: '👋', t: 1.4 }; k.hop = 0.5; }
        continue;
      }
      // sliding down the hill, wiggling a little
      k.v = Math.min(190, k.v + 90 * dt); k.y += k.v * dt; k.x = k.lane + Math.sin((k.y - top) * 0.012 + k.i) * 18; k.moving = false;
      if (!k.say && k.y > top + 250 && Math.random() < dt * 0.6) k.say = { text: 'Wheee!', t: 1.4 };
      if (k.y >= bottom) { k.y = bottom; k.state = 'wait'; k.t = U.rand(1, 2); }
    }
  },

  // ---------- update ----------
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, S = CFG.SNOW;
    st.fade = Math.max(0, st.fade - dt);
    if (st.cocoa > 0) st.cocoa = Math.max(0, st.cocoa - dt);
    for (const f of st.prints) f.t += dt;
    while (st.prints.length && st.prints[0].t > 9) st.prints.shift();
    for (const f of st.tracks) f.t += dt;
    while (st.tracks.length && st.tracks[0].t > 60) st.tracks.shift();
    if (g.area === 'site') {
      // a save or a push that left the chef inside the lift hut puts them on the boarding spot
      if (this.onFoot(g) && this.ctObs().some((o) => g.hitRect(p.x, p.y, 8, o))) { p.x = S.CT.BOARD.x; p.y = S.CT.BOARD.y; p.moving = false; }
    }
    if (g.area !== 'snow') {
      if (st.lift && !g.travel) st.lift = null;
      st.ball = null; st.lastP = null;
      return;
    }
    this.stepKids(g, dt);
    this.stepDog(g, dt);
    if (g.travel) return;
    if (st.lift) { this.stepLift(g, dt); return; }
    if (g.driving) { if (this.riding(g)) this.stepRide(g, dt); return; }
    // the skis go back to the hut as soon as you take them off
    if (st.skis) { st.skis = null; st.run = null; this.say(g, p.x, p.y - 74, '⛷️ Skis off!', '#ffffff', false, 1); }
    if (this.busy(g)) return;
    // rescue: never inside a tree, a hut or the sky
    if (!this.free(g, p.x, p.y)) { p.x = S.ARRIVE.x; p.y = S.ARRIVE.y; p.moving = false; st.ball = null; this.say(g, p.x, p.y - 70, 'Oops! ❄️', '#ffffff', true, 1.2); return; }
    if (p.moving) this.addTrack(p.x, p.y, 'foot', false);
    if (st.ball) this.stepPush(g, dt); else st.lastP = { x: p.x, y: p.y };
  },

  // ================= art =================
  paint: {
    snow(r, g) { SnowExt.paintSnow(r, g); },
  },
  paintAfter(r, g, area) { if (area === 'site') this.paintCtStation(r); },

  // ---- Construction Town: the timber lift hut and its deck (the wheel and the cable are drawn each frame)
  paintCtStation(r) {
    const ctx = r.ctx, C = CFG.SNOW.CT, H = C.HUT, D = C.DECK, B = C.BOARD;
    // the deck
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(D.x0 + 4, D.y0 + 4, D.x1 - D.x0, D.y1 - D.y0);
    ctx.fillStyle = '#c08a52'; ctx.fillRect(D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0);
    ctx.fillStyle = '#9a6a3a'; for (let y = D.y0 + 9; y < D.y1; y += 10) ctx.fillRect(D.x0, y, D.x1 - D.x0, 2);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(D.x0, D.y0, 3, D.y1 - D.y0); ctx.fillRect(D.x1 - 3, D.y0, 3, D.y1 - D.y0);
    // the boarding spot: a blue mat with a chair on it
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, B.x - 17, B.y - 12, 34, 22, 6); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; U.roundRect(ctx, B.x - 17, B.y - 12, 34, 22, 6); ctx.stroke();
    ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚡', B.x, B.y);
    // the hut: a log wall under a snowy gable roof
    const wallH = 48, fy = H.y1 - wallH, cx = (H.x0 + H.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(H.x0 + 6, fy + 8, H.x1 - H.x0, wallH);
    ctx.fillStyle = '#a0683a'; ctx.fillRect(H.x0, fy, H.x1 - H.x0, wallH);
    ctx.fillStyle = '#7d4f2b'; for (let y = fy + 7; y < H.y1; y += 8) ctx.fillRect(H.x0, y, H.x1 - H.x0, 2);
    ctx.fillStyle = '#b07a45'; for (const x of [H.x0, H.x1]) for (let y = fy + 4; y < H.y1; y += 8) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, H.x0 + 12, H.y1 - 32, 20, 32, 4); ctx.fill();                  // door
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(H.x0 + 28, H.y1 - 16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; U.roundRect(ctx, H.x0 + 44, fy + 14, 34, 18, 3); ctx.fill();                    // ticket window, warm light
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(H.x0 + 61, fy + 14); ctx.lineTo(H.x0 + 61, fy + 32); ctx.stroke();
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.moveTo(H.x0 - 10, fy + 6); ctx.lineTo(cx, H.y0 - 14); ctx.lineTo(H.x1 + 10, fy + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(H.x0 - 8, fy + 1); ctx.lineTo(cx, H.y0 - 18); ctx.lineTo(H.x1 + 8, fy + 1); ctx.lineTo(H.x1 - 2, fy + 3); ctx.lineTo(cx, H.y0 - 6); ctx.lineTo(H.x0 + 2, fy + 3); ctx.closePath(); ctx.fill();
    for (let x = H.x0 - 6; x <= H.x1 + 6; x += 11) { ctx.beginPath(); ctx.arc(x, fy + 3, 3 + (x % 3), 0, Math.PI); ctx.fill(); }
    // the sign
    const sx = cx, sy = fy - 16;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, sx - 50, sy - 13, 100, 26, 7); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; U.roundRect(ctx, sx - 50, sy - 13, 100, 26, 7); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛷️ SKI LIFT', sx, sy + 1);
  },

  // ---- Snowy Peak: the static map
  paintSnow(r, g) {
    const ctx = r.ctx, S = CFG.SNOW, W = S.WORLD, h = (i) => this.hash(i), L = S.SLOPE;
    const top = W.y0 + S.SKY_H;
    // snow everywhere, with soft blue shadows and glints
    ctx.fillStyle = '#f2f8ff'; ctx.fillRect(W.x0, top - 10, W.x1 - W.x0, W.y1 - top + 10);
    for (let i = 0; i < 160; i++) {
      const x = W.x0 + h(i) * (W.x1 - W.x0), y = top + 20 + h(i + 300) * (W.y1 - top - 20), rr = 20 + h(i + 600) * 60;
      ctx.fillStyle = i % 3 ? 'rgba(200,220,245,0.35)' : 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the slopes: a little bluer as they drop, with soft hill bands across
    const sg = ctx.createLinearGradient(0, L.y0, 0, L.y1); sg.addColorStop(0, 'rgba(225,238,252,0.2)'); sg.addColorStop(1, 'rgba(190,212,240,0.55)');
    ctx.fillStyle = sg; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    ctx.strokeStyle = 'rgba(160,190,225,0.35)'; ctx.lineWidth = 3;
    for (let y = L.y0 + 60; y < L.y1; y += 110) { ctx.beginPath(); for (let x = L.x0; x <= 5640; x += 20) { const yy = y + Math.sin(x * 0.012 + y) * 10; if (x === L.x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
    // the ski run: groomed corduroy
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(5790, L.y0, 650, L.y1 - L.y0);
    ctx.fillStyle = 'rgba(170,195,230,0.25)'; for (let x = 5796; x < 6440; x += 9) ctx.fillRect(x, L.y0, 2, L.y1 - L.y0);
    ctx.strokeStyle = 'rgba(59,125,216,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(5790, L.y0); ctx.lineTo(5790, L.y1); ctx.moveTo(6440, L.y0); ctx.lineTo(6440, L.y1); ctx.stroke(); ctx.setLineDash([]);
    // the lift corridor
    ctx.fillStyle = 'rgba(200,215,235,0.35)'; ctx.fillRect(5655, S.TOP.y1, 90, S.BOTTOM.y0 - S.TOP.y1);
    // the start line of the ski run
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(5800, L.y0 - 3, 630, 6);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(5800, L.y0 - 3, 30, 6); ctx.fillRect(6400, L.y0 - 3, 30, 6);
    this.paintSign(r, 5870, L.y0 - 10, 'START ⛷️', '#3b7dd8');
    // the finish line: checkers across the run
    for (let x = S.FINISH.x0 + 10, i = 0; x < S.FINISH.x1 - 10; x += 12, i++) { ctx.fillStyle = i % 2 ? '#2b1d14' : '#ffffff'; ctx.fillRect(x, S.FINISH_Y - 6, 12, 6); ctx.fillStyle = i % 2 ? '#ffffff' : '#2b1d14'; ctx.fillRect(x, S.FINISH_Y, 12, 6); }
    // the jump ramp: a wedge of packed snow rising to a lip at RAMP.y
    const R = S.RAMP, rx0 = R.x - R.w / 2, rx1 = R.x + R.w / 2, lip = 14;
    ctx.fillStyle = 'rgba(80,120,170,0.3)'; ctx.beginPath(); ctx.ellipse(R.x + 8, R.y + 12, R.w / 2 + 8, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e6f0fb'; ctx.beginPath(); ctx.moveTo(rx0 + 12, R.y - R.h); ctx.lineTo(rx1 - 12, R.y - R.h); ctx.lineTo(rx1, R.y - lip); ctx.lineTo(rx0, R.y - lip); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9fbde0'; ctx.fillRect(rx0, R.y - lip, R.w, lip);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(rx0, R.y - lip, R.w, 3);
    ctx.fillStyle = '#ff8c1a'; for (let i = 0; i < 3; i++) { const yy = R.y - R.h + 8 + i * 9; ctx.beginPath(); ctx.moveTo(R.x - 14, yy); ctx.lineTo(R.x, yy + 6); ctx.lineTo(R.x + 14, yy); ctx.lineTo(R.x + 14, yy + 3); ctx.lineTo(R.x, yy + 9); ctx.lineTo(R.x - 14, yy + 3); ctx.closePath(); ctx.fill(); }
    for (const x of [rx0, rx1]) { ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 2, R.y - lip - 22, 4, 24); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, R.y - lip - 14, 4, 5); }
    // the meadow: fresh sparkly snow inside a ring of little stakes
    const M = S.MEADOW;
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; U.roundRect(ctx, M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0, 40); ctx.fill();
    ctx.fillStyle = 'rgba(150,200,255,0.55)'; for (let i = 0; i < 90; i++) { const x = M.x0 + 20 + h(i + 2000) * (M.x1 - M.x0 - 40), y = M.y0 + 20 + h(i + 2100) * (M.y1 - M.y0 - 40); ctx.fillRect(x, y, 2, 2); }
    ctx.fillStyle = '#e4572e'; for (let x = M.x0 + 20; x < M.x1; x += 60) { ctx.fillRect(x, M.y0 - 6, 4, 10); ctx.fillRect(x, M.y1 - 4, 4, 10); }
    this.paintSign(r, M.x0 + 110, M.y0 + 40, '⛄ SNOWMAN MEADOW', '#8e5bd1');
    // signs for the runs
    this.paintSign(r, 5170, 5300, '🛷 SLEDDING HILL', '#e4572e');
    this.paintSign(r, 6280, 5300, '⛷️ SKI RUN', '#3b7dd8');
    // footprints from the top station out onto the snow
    ctx.fillStyle = 'rgba(150,180,215,0.4)';
    for (let i = 0; i < 12; i++) { const x = S.ARRIVE.x + 30 + i * 24, y = S.ARRIVE.y + 14 + Math.sin(i * 0.7) * 10 + (i % 2 ? 5 : -5); ctx.beginPath(); ctx.ellipse(x, y, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    // the fences: east of the ski run and along the bottom
    const fence = (x0, y0, x1, y1) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 40));
      ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0 - 8); ctx.lineTo(x1, y1 - 8); ctx.moveTo(x0, y0 - 16); ctx.lineTo(x1, y1 - 16); ctx.stroke();
      for (let i = 0; i <= n; i++) { const x = U.lerp(x0, x1, i / n), y = U.lerp(y0, y1, i / n); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 3, y - 22, 6, 24); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 22, 4, Math.PI, 0); ctx.fill(); }
    };
    fence(S.FENCE.x, S.FENCE.y0, S.FENCE.x, S.FENCE.y1);
    fence(W.x0 + 10, W.y1 - 8, W.x1 - 10, W.y1 - 8);
    // the sled rack: a wooden A-frame with sleds leaning on it
    const K = S.RACK;
    ctx.fillStyle = 'rgba(80,120,170,0.25)'; ctx.beginPath(); ctx.ellipse(K.x + 4, K.y + 4, 56, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(K.x - 48, K.y - 44, 6, 46); ctx.fillRect(K.x + 42, K.y - 44, 6, 46); ctx.fillRect(K.x - 50, K.y - 46, 100, 6);
    ['#e4572e', '#3b7dd8', '#2f9e44', '#ffd166'].forEach((c, i) => { const x = K.x - 34 + i * 23; ctx.fillStyle = c; U.roundRect(ctx, x - 9, K.y - 40, 18, 40, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 6, K.y - 32, 12, 3); ctx.fillRect(x - 6, K.y - 22, 12, 3); ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 10, K.y - 2, 20, 3); });
    ctx.fillStyle = '#ffffff'; ctx.fillRect(K.x - 50, K.y - 50, 100, 5);
    this.paintSpot(r, S.RACK_SPOT, '🛷');
    // the ski hut, with skis leaning on its front
    this.paintHut(r, S.SKI_HUT, '#c0392b', '⛷️ SKIS');
    for (let i = 0; i < 4; i++) { const x = S.SKI_HUT.x1 - 18 - i * 12; ctx.fillStyle = ['#ffd166', '#3b7dd8', '#e4572e', '#2f9e44'][i]; U.roundRect(ctx, x - 2.5, S.SKI_HUT.y1 - 52, 5, 52, 2.5); ctx.fill(); }
    this.paintSpot(r, S.SKI_SPOT, '⛷️');
    // the top station
    this.paintHut(r, S.TOP, '#7a4a26', '🚡 SKI LIFT', S.TOP.x0 + 60);
    this.paintSpot(r, S.TOP_SPOT, '🚡');
    this.paintSpot(r, S.BOTTOM_SPOT, '🚡');
    // the sky band with the mountain peaks (drawn last so nothing pokes into it)
    this.paintSky(r, W.x0, W.x1, W.y0, top);
  },
  paintSky(r, x0, x1, y0, base) {
    const ctx = r.ctx, h = (i) => this.hash(i);
    const sky = ctx.createLinearGradient(0, y0, 0, base); sky.addColorStop(0, '#6fb8ef'); sky.addColorStop(1, '#d6ecff');
    ctx.fillStyle = sky; ctx.fillRect(x0, y0, x1 - x0, base - y0 + 2);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * 0.78, y0 + 40, 22, 0, Math.PI * 2); ctx.fill();
    const peaks = (step, hmin, hmax, col, snowCol, off) => {
      for (let x = x0 - step; x < x1 + step; x += step) {
        const k = Math.floor(x / step), ph = hmin + (hmax - hmin) * h(k * 3.1 + off), px = x + step / 2 + (h(k + off) - 0.5) * step * 0.4, w = step * 0.85;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px - w, base); ctx.lineTo(px, base - ph); ctx.lineTo(px + w, base); ctx.closePath(); ctx.fill();
        ctx.fillStyle = snowCol; ctx.beginPath(); ctx.moveTo(px, base - ph); ctx.lineTo(px - w * 0.36, base - ph * 0.62); ctx.lineTo(px - w * 0.16, base - ph * 0.68); ctx.lineTo(px, base - ph * 0.58); ctx.lineTo(px + w * 0.18, base - ph * 0.68); ctx.lineTo(px + w * 0.38, base - ph * 0.62); ctx.closePath(); ctx.fill();
      }
    };
    peaks(260, 70, 130, '#93a9c8', '#ffffff', 11);
    peaks(180, 40, 80, '#7e95b8', '#f4f9ff', 37);
    // the snowbank where the map starts
    ctx.fillStyle = '#e6f1fc'; ctx.beginPath(); ctx.moveTo(x0, base + 24);
    for (let x = x0; x <= x1; x += 24) ctx.lineTo(x, base - 6 - Math.abs(Math.sin(x * 0.02)) * 8);
    ctx.lineTo(x1, base + 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(160,190,225,0.5)'; ctx.fillRect(x0, base + 18, x1 - x0, 4);
  },
  paintSign(r, x, y, text, col) {
    const ctx = r.ctx; ctx.font = r.font(12); const w = ctx.measureText(text).width + 22;
    ctx.fillStyle = 'rgba(80,120,170,0.25)'; ctx.fillRect(x - w / 2 + 6, y - 2, w, 5);
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 3, y - 30, 6, 30);
    ctx.fillStyle = col; U.roundRect(ctx, x - w / 2, y - 52, w, 24, 6); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; U.roundRect(ctx, x - w / 2, y - 52, w, 24, 6); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 39);
  },
  paintSpot(r, s, ico) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(59,125,216,0.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(59,125,216,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(s.x, s.y, 26, 12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, s.x, s.y + 1);
  },
  // a timber hut seen from the front: the roof (with snow) above its footprint, a log wall, a door and a window
  paintHut(r, B, roof, label, labelX) {
    const ctx = r.ctx, wallH = 46, fy = B.y1 - wallH, w = B.x1 - B.x0, cx = (B.x0 + B.x1) / 2, lx = labelX || cx;
    ctx.fillStyle = 'rgba(80,120,170,0.25)'; ctx.fillRect(B.x0 + 8, B.y0 + 10, w, B.y1 - B.y0);
    ctx.fillStyle = '#a0683a'; ctx.fillRect(B.x0, fy, w, wallH);
    ctx.fillStyle = '#7d4f2b'; for (let y = fy + 7; y < B.y1; y += 8) ctx.fillRect(B.x0, y, w, 2);
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, cx - 12, B.y1 - 32, 24, 32, 4); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; U.roundRect(ctx, B.x0 + 10, fy + 10, 22, 16, 3); ctx.fill(); U.roundRect(ctx, B.x1 - 32, fy + 10, 22, 16, 3); ctx.fill();
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(B.x0 - 8, fy + 2); ctx.lineTo(B.x1 + 8, fy + 2); ctx.lineTo(B.x1 - 4, B.y0 - 6); ctx.lineTo(B.x0 + 4, B.y0 - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(B.x0 - 5, fy - 2); ctx.lineTo(B.x1 + 5, fy - 2); ctx.lineTo(B.x1 - 7, B.y0 - 4); ctx.lineTo(B.x0 + 7, B.y0 - 4); ctx.closePath(); ctx.fill();
    for (let x = B.x0; x <= B.x1; x += 12) { ctx.beginPath(); ctx.arc(x, fy - 1, 5 + (x % 3), 0, Math.PI); ctx.fill(); }
    ctx.font = r.font(12); const tw = ctx.measureText(label).width + 20;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, lx - tw / 2, fy - 30, tw, 22, 6); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; U.roundRect(ctx, lx - tw / 2, fy - 30, tw, 22, 6); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, lx, fy - 18);
  },

  // ---- each frame
  bgKey() { return ''; },
  dynamic(r, g) {
    if (!this.st || g.area !== 'snow') return;
    const ctx = r.ctx, S = CFG.SNOW, W = S.WORLD, st = this.st;
    // above the map's top edge (seen under the HUD) is more sky
    if (r.camY < W.y0) { ctx.fillStyle = '#6fb8ef'; ctx.fillRect(r.camX - 10, r.camY - 10, r.viewW + 20, W.y0 - r.camY + 10); }
    // the snowball tracks: strokes of a dozen points each (overlapping single segments would bead up)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const T = st.tracks;
    for (let i = 1; i < T.length;) {
      if (T[i].gap) { i++; continue; }
      const j0 = i - 1; let j = i;
      while (j < T.length && !T[j].gap && j - j0 < 12) j++;
      const last = T[j - 1], al = 0.24 * (1 - Math.min(1, last.t / 60));
      ctx.strokeStyle = `rgba(150,178,212,${al.toFixed(3)})`; ctx.lineWidth = last.r * 1.1;
      ctx.beginPath(); ctx.moveTo(T[j0].x, T[j0].y); for (let k = j0 + 1; k < j; k++) ctx.lineTo(T[k].x, T[k].y); ctx.stroke();
      i = j;
    }
    ctx.lineCap = 'butt';
    // footprints and sled / ski tracks
    for (const f of st.prints) {
      const al = 0.45 * (1 - f.t / 9); if (al <= 0) continue;
      ctx.fillStyle = `rgba(140,170,210,${al.toFixed(3)})`;
      if (f.kind === 'foot') { const px = -Math.sin(f.ang) * 5 * f.side, py = Math.cos(f.ang) * 5 * f.side; ctx.beginPath(); ctx.ellipse(f.x + px, f.y + 3 + py, 4, 2.6, f.ang, 0, Math.PI * 2); ctx.fill(); }
      else { const d = f.kind === 'ski' ? 6 : 11; for (const sd of [-1, 1]) { const px = -Math.sin(f.ang) * d * sd, py = Math.cos(f.ang) * d * sd; ctx.save(); ctx.translate(f.x + px, f.y + 4 + py); ctx.rotate(f.ang); ctx.fillRect(-7, -1.5, 14, 3); ctx.restore(); } }
    }
    // the shadow under a flying sled or skier
    const v = g.driving && this.riding(g) ? g.vehicle : null;
    if (v && v.z > 0) { const k = 1 - v.z / (S.JUMP.h * 1.6); ctx.fillStyle = 'rgba(70,100,150,0.3)'; ctx.beginPath(); ctx.ellipse(v.x, v.y + 6, 18 * k, 7 * k, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player;
    if (g.area === 'site') return;
    if (g.area !== 'snow') return;
    const S = CFG.SNOW, x0 = r.camX - 80, x1 = r.camX + r.viewW + 80, y0 = r.camY - 40, y1 = r.camY + r.viewH + 140;
    const vis = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
    for (const [x, y, s] of S.TREES) if (vis(x, y)) items.push({ y, draw: () => this.drawPine(r.ctx, x, y, s) });
    for (const ty of S.TOWERS) if (vis(5700, ty)) items.push({ y: ty, draw: () => this.drawTower(r, 5700, ty) });
    S.GATES.forEach((gt, i) => { if (vis(gt.x, gt.y)) items.push({ y: gt.y, draw: () => this.drawGate(r, g, gt, i) }); });
    if (vis(6120, S.FINISH_Y)) items.push({ y: S.FINISH_Y, draw: () => this.drawFinish(r, g) });
    if (vis(5700, S.BOTTOM.y1)) items.push({ y: S.BOTTOM.y1, draw: () => this.drawBottomStation(r, g) });
    if (vis(6830, S.CABIN.y1)) items.push({ y: S.CABIN.y1, draw: () => this.drawCabin(r, g) });
    for (const k of st.kids) if (vis(k.x, k.y)) items.push({ y: k.y, draw: () => this.drawKid(r, g, k) });
    { const d = st.dog; if (vis(d.x, d.y)) items.push({ y: d.y, draw: () => this.drawDog(r, g, d) }); }
    for (const m of g.s.snow.men) if (vis(m.x, m.y)) items.push({ y: m.y, draw: () => this.drawSnowman(r.ctx, m.x, m.y, m.r, true, m.hat) });
    for (const sk of st.stacks) items.push({ y: sk.y, draw: () => this.drawSnowman(r.ctx, sk.x, sk.y, this.stackRadii(sk.balls), false) });
    if (st.ball) { const b = st.ball; items.push({ y: b.y, draw: () => this.drawBall(r.ctx, b) }); }
    // the sled and the skis
    for (const v of [st.sled, st.skis]) {
      if (!v || st.lift) continue;
      const ridden = g.driving && g.vehicle === v;
      items.push({ y: v.y + 2, draw: () => (v.kind === 'sled' ? this.drawSledRide(r, g, v, ridden) : this.drawSkier(r, g, v)) });
    }
    if (st.lift && st.lift.lift > 0) items.push({ y: p.y + 0.5, draw: () => this.drawLiftChair(r, g) });
    if (st.cocoa > 0 && !g.driving && !st.lift) items.push({ y: p.y + 1, draw: () => this.drawCocoa(r, g) });
  },
  overlay(r, g) {
    if (!this.st) return;
    if (g.area === 'site') { this.drawCtLift(r, g); return; }
    if (g.area !== 'snow') return;
    const ctx = r.ctx, st = this.st;
    this.drawLiftLine(r, g);
    const bubble = (x, y, text) => { ctx.font = r.font(13); const tw = ctx.measureText(text).width + 22; r.drawBubble(x, y, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, tw); };
    const d = st.dog;
    if (d.say) bubble(d.x, d.y - 54 - d.hop * 20, d.say);
    for (const k of st.kids) if (k.say) bubble(k.x, k.y - (k.state === 'slide' ? 70 : 76) - (k.hop > 0 ? 8 : 0), k.say.text);
    const sled = st.sled;
    if (sled && !g.driving && !st.lift && g.nearVehicle === sled) bubble(sled.x, sled.y - 44 + Math.sin(g.time * 5) * 3, '🛷');
  },
  // falling snow over the snow map (light and cheap: positions come straight from the clock)
  screen(r, g) {
    if (g.area !== 'snow' || g.travel) return;
    const W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    this.drawFlakes(r.ctx, W, H, g.time, 46, 0.85);
  },
  drawFlakes(ctx, W, H, t, n, alpha) {
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = alpha; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sp = 26 + this.hash(i + 7) * 34, rr = 1.4 + this.hash(i + 13) * 2.2;
      const y = ((this.hash(i + 99) * (H + 20) + t * sp) % (H + 20)) - 10;
      let x = (this.hash(i) * W + Math.sin(t * 0.8 + i) * 14 + t * 8) % W; if (x < 0) x += W;
      ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, Math.PI * 2);
    }
    ctx.fill(); ctx.globalAlpha = 1;
  },

  // ---- drawings
  drawPine(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(70,100,150,0.2)'; ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 2, 26 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 4 * s, y - 14 * s, 8 * s, 16 * s);
    for (let i = 0; i < 3; i++) {
      const w = (30 - i * 7) * s, base = y - (10 + i * 20) * s, tip = base - (34 - i * 4) * s;
      ctx.fillStyle = i % 2 ? '#2f7d4f' : '#276b43'; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x + w, base); ctx.lineTo(x, tip); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x, tip); ctx.lineTo(x - w * 0.42, tip + (base - tip) * 0.45); ctx.quadraticCurveTo(x, tip + (base - tip) * 0.32, x + w * 0.42, tip + (base - tip) * 0.45); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(x - w + 4 * s, base - 2 * s, 4 * s, 0, Math.PI * 2); ctx.arc(x + w - 4 * s, base - 2 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawTower(r, x, y) {
    const ctx = r.ctx, H = CFG.SNOW.CABLE_H, S = CFG.SNOW;
    ctx.fillStyle = 'rgba(70,100,150,0.22)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 2, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d8591'; ctx.fillRect(x - 4, y - H, 8, H + 2);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(S.STRANDS[0] - 6, y - H - 4, S.STRANDS[1] - S.STRANDS[0] + 12, 6);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(S.STRANDS[0], y - H - 1, 3, 0, Math.PI * 2); ctx.arc(S.STRANDS[1], y - H - 1, 3, 0, Math.PI * 2); ctx.fill();
  },
  // a chair hanging from the cable at (gx, gy): the bar, a bench with a backrest and a safety bar
  drawChair(ctx, gx, gy, col, sway, back) {
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(sway || 0);
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(-16, 40); ctx.lineTo(-16, 58); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    if (back !== false) { ctx.fillStyle = col; U.roundRect(ctx, -18, 40, 36, 14, 4); ctx.fill(); }
    ctx.fillStyle = col; U.roundRect(ctx, -20, 54, 40, 8, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-20, 59, 40, 3);
    ctx.restore();
  },
  drawLiftLine(r, g) {
    const ctx = r.ctx, S = CFG.SNOW, H = S.CABLE_H, st = this.st, t = g.time;
    const y0 = S.TOP.y1 - 10 - H, y1 = S.BOTTOM.y0 + 10 - H;
    if (r.camX > S.STRANDS[1] + 60 || r.camX + r.viewW < S.STRANDS[0] - 60) return;
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2;
    ctx.beginPath(); for (const x of S.STRANDS) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); } ctx.stroke();
    // empty chairs going round (up on the left strand, down on the right)
    const sp = 120, off = (t * 50) % sp, L = st.lift, cols = ['#e4572e', '#3b7dd8', '#2f9e44', '#ffd166'];
    for (let i = 0; y0 + i * sp < y1 + sp; i++) {
      const yu = y1 - i * sp - off, yd = y0 + i * sp + off;
      if (yu > y0 && yu < y1 && !(L && L.lift > 0 && Math.abs(yu - (L.gy - H)) < 90) && yu > r.camY - 80 && yu < r.camY + r.viewH) this.drawChair(ctx, S.STRANDS[0], yu, cols[i % 4], Math.sin(t * 2 + i) * 0.05);
      if (yd > y0 && yd < y1 && yd > r.camY - 80 && yd < r.camY + r.viewH) this.drawChair(ctx, S.STRANDS[1], yd, cols[(i + 2) % 4], Math.sin(t * 2 + i + 1) * 0.05);
    }
    // the big wheels at both stations
    this.drawWheel(ctx, 5700, S.TOP.y1 - 10 - H, 18, t);
    this.drawWheel(ctx, 5700, S.BOTTOM.y0 + 10 - H, 18, -t);
  },
  drawWheel(ctx, x, y, R, t) {
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * Math.PI / 3; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  },
  // the chef's own chair (drawn just in front of the chef while riding the lift in the snow map)
  drawLiftChair(r, g) {
    const ctx = r.ctx, L = this.st.lift, p = g.player, S = CFG.SNOW;
    const cy = L.gy - S.CABLE_H;   // where the chair holds the cable, above the chef
    ctx.save(); ctx.translate(p.x, cy); ctx.rotate(L.sway);
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3;
    const seat = p.y - 6 - cy;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, seat - 48); ctx.lineTo(-22, seat - 36); ctx.lineTo(-22, seat); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -22, seat - 2, 44, 9, 3); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-20, seat - 16); ctx.lineTo(20, seat - 16); ctx.lineTo(20, seat - 4); ctx.stroke();   // the safety bar
    // the sled or skis riding up with the chef, hanging under the seat
    const v = L.veh;
    if (v) {
      if (v.kind === 'sled') this.drawSled(ctx, 0, seat + 26, '#e4572e', 0);
      else { ctx.fillStyle = '#e4572e'; for (const d of [-5, 5]) { U.roundRect(ctx, d - 2.5, seat + 10, 5, 34, 2.5); ctx.fill(); } }
    }
    ctx.restore();
  },
  drawSled(ctx, x, y, col, tilt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt || 0);
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2.5;
    for (const d of [-12, 12]) { ctx.beginPath(); ctx.moveTo(d, -18); ctx.lineTo(d, 12); ctx.quadraticCurveTo(d, 20, d * 0.6, 20); ctx.stroke(); }
    ctx.fillStyle = col; U.roundRect(ctx, -14, -20, 28, 32, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let k = -14; k < 8; k += 8) ctx.fillRect(-11, k, 22, 3);
    ctx.restore();
  },
  drawSledFront(ctx, x, y, col, tilt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt || 0);
    ctx.fillStyle = col; U.roundRect(ctx, -15, 4, 30, 10, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-13, 10, 26, 3);
    ctx.restore();
  },
  chefLook(g, extra) { const p = g.player; return Object.assign({ shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: p.facing, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' }, extra || {}); },
  // someone sitting in a sled: the legs are tucked out of sight
  drawSeated(r, x, y, look) {
    const ctx = r.ctx;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 60, y - 140, 120, 132); ctx.clip();
    r.drawPerson(x, y + 2, look);
    ctx.restore();
  },
  drawSledRide(r, g, v, ridden) {
    const ctx = r.ctx, tilt = U.clamp((v.sx || 0) / 500, -0.35, 0.35), z = v.z || 0, x = v.x, y = v.y - z;
    if (!ridden) {
      ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, v.y + 6, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
      this.drawSled(ctx, x, y, '#e4572e', tilt); this.drawSledFront(ctx, x, y, '#e4572e', tilt); return;
    }
    if (!z) { ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, v.y + 6, 18, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    this.drawSled(ctx, x, y, '#e4572e', tilt);
    this.drawSeated(r, x, y - 2, this.chefLook(g));
    this.drawSledFront(ctx, x, y, '#e4572e', tilt);
  },
  // the chef on skis: bobble hat, skis under the feet, short poles held close (no swinging arms)
  drawSkier(r, g, v) {
    const ctx = r.ctx, p = g.player, z = v.z || 0, x = v.x, y = v.y - z, tilt = U.clamp((v.sx || 0) / 600, -0.45, 0.45);
    if (!z) { ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, v.y + 5, 16, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    for (const d of [-6, 6]) {
      ctx.save(); ctx.translate(x + d, y + 2); ctx.rotate(-tilt);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, -3, -16, 6, 46, 3); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, 29, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const look = this.chefLook(g, { hat: undefined, hair: '#2b1d14', hairStyle: 0, facing: p.facing || 1 });
    r.drawPerson(x, y, look);
    // the bobble hat and the chef's moustache
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x, y - 41, 11.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, x - 12, y - 44, 24, 6, 3); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y - 55, 5, 0, Math.PI * 2); ctx.fill();
    const f = look.facing; ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + f - 3, y - 33, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(x + f + 3, y - 33, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    // short poles, held close
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 17); ctx.lineTo(x - 17, y + 6); ctx.moveTo(x + 14, y - 17); ctx.lineTo(x + 17, y + 6); ctx.stroke();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(x - 17, y + 6, 2.5, 0, Math.PI * 2); ctx.arc(x + 17, y + 6, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  drawGate(r, g, gt, i) {
    const ctx = r.ctx, S = CFG.SNOW, run = this.st.run, done = run && run.gates.includes(i), t = g.time;
    const col = i % 2 ? '#3b7dd8' : '#e4572e';
    ctx.strokeStyle = done ? 'rgba(255,209,102,0.9)' : (i % 2 ? 'rgba(59,125,216,0.45)' : 'rgba(228,87,46,0.45)'); ctx.lineWidth = 4; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(gt.x - S.GATE_HALF, gt.y); ctx.lineTo(gt.x + S.GATE_HALF, gt.y); ctx.stroke(); ctx.setLineDash([]);
    for (const d of [-1, 1]) {
      const x = gt.x + d * S.GATE_HALF;
      ctx.fillStyle = 'rgba(70,100,150,0.22)'; ctx.beginPath(); ctx.ellipse(x + 3, gt.y + 1, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 1.5, gt.y - 34, 3, 35);
      const wv = Math.sin(t * 5 + i + d) * 2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, gt.y - 34); ctx.lineTo(x - d * 18, gt.y - 29 + wv); ctx.lineTo(x, gt.y - 22); ctx.closePath(); ctx.fill();
    }
    if (done) { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⭐', gt.x, gt.y - 30 + Math.sin(t * 4 + i) * 2); }
  },
  drawFinish(r, g) {
    const ctx = r.ctx, S = CFG.SNOW, F = S.FINISH, y = S.FINISH_Y, h = 96, t = g.time;
    for (const x of [F.x0 + 4, F.x1 - 4]) {
      ctx.fillStyle = 'rgba(70,100,150,0.22)'; ctx.beginPath(); ctx.ellipse(x + 5, y + 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 6, y - h, 12, h);
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 6, y - h + 10 + k * 22, 12, 8);
    }
    const bx0 = F.x0 - 4, bx1 = F.x1 + 4;
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, bx0, y - h - 26, bx1 - bx0, 30, 8); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; U.roundRect(ctx, bx0, y - h - 26, bx1 - bx0, 30, 8); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const run = this.st.run, cx = (F.x0 + F.x1) / 2;
    ctx.fillText(run && run.done ? `🏁 FINISH!  ⏱️ ${run.time.toFixed(1)} s  ·  ${run.gates.length} / ${S.GATES.length} 🚩` : '🏁 FINISH 🏁', cx, y - h - 10);
    for (let k = 0; k < 8; k++) { const x = bx0 + 20 + k * (bx1 - bx0 - 40) / 7; ctx.fillStyle = ['#ffd166', '#e4572e', '#2f9e44', '#8e5bd1'][k % 4]; ctx.beginPath(); ctx.moveTo(x - 6, y - h + 4); ctx.lineTo(x + 6, y - h + 4); ctx.lineTo(x, y - h + 14 + Math.sin(t * 3 + k) * 2); ctx.closePath(); ctx.fill(); }
  },
  drawBottomStation(r, g) {
    const ctx = r.ctx, S = CFG.SNOW, B = S.BOTTOM;
    this.paintHut(r, B, '#7a4a26', '🚡 LIFT', B.x0 + 30);
    // the wheel's post (the wheel itself is drawn with the cable)
    ctx.fillStyle = '#7d8591'; ctx.fillRect(5700 - 4, B.y0 + 10 - S.CABLE_H, 8, B.y0 - 40 - (B.y0 + 10 - S.CABLE_H));
  },
  drawCabin(r, g) {
    const ctx = r.ctx, C = CFG.SNOW.CABIN, t = g.time, w = C.x1 - C.x0, cx = (C.x0 + C.x1) / 2, wallH = 64, fy = C.y1 - wallH;
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.fillRect(C.x0 + 10, C.y0 + 8, w, C.y1 - C.y0);
    // chimney with smoke
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(C.x1 - 60, C.y0 - 64, 22, 50);
    for (let i = 0; i < 4; i++) { const k = ((t * 0.4 + i / 4) % 1); ctx.fillStyle = `rgba(240,240,250,${(0.7 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(C.x1 - 49 + Math.sin(k * 6 + i) * 8, C.y0 - 70 - k * 60, 7 + k * 10, 0, Math.PI * 2); ctx.fill(); }
    // log walls
    ctx.fillStyle = '#9a5f33'; ctx.fillRect(C.x0, fy, w, wallH);
    ctx.fillStyle = '#7a4a26'; for (let y = fy + 8; y < C.y1; y += 9) ctx.fillRect(C.x0, y, w, 3);
    for (const x of [C.x0, C.x1]) { ctx.fillStyle = '#b07a45'; for (let y = fy + 4; y < C.y1; y += 9) { ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); } }
    // door, windows with a warm glow
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, cx - 16, C.y1 - 42, 32, 42, 5); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx + 9, C.y1 - 20, 2.5, 0, Math.PI * 2); ctx.fill();
    const glow = 0.85 + Math.sin(t * 3) * 0.08;
    for (const wx of [C.x0 + 22, C.x1 - 66]) { ctx.fillStyle = `rgba(255,214,120,${glow.toFixed(2)})`; U.roundRect(ctx, wx, fy + 16, 44, 28, 4); ctx.fill(); ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + 22, fy + 16); ctx.lineTo(wx + 22, fy + 44); ctx.moveTo(wx, fy + 30); ctx.lineTo(wx + 44, fy + 30); ctx.stroke(); }
    // roof and its thick snow
    ctx.fillStyle = '#6b3d1f'; ctx.beginPath(); ctx.moveTo(C.x0 - 14, fy + 4); ctx.lineTo(C.x1 + 14, fy + 4); ctx.lineTo(C.x1 - 10, C.y0 - 16); ctx.lineTo(C.x0 + 10, C.y0 - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(C.x0 - 10, fy - 2); ctx.lineTo(C.x1 + 10, fy - 2); ctx.lineTo(C.x1 - 14, C.y0 - 14); ctx.lineTo(C.x0 + 14, C.y0 - 14); ctx.closePath(); ctx.fill();
    for (let x = C.x0 - 6; x <= C.x1 + 6; x += 14) { ctx.beginPath(); ctx.arc(x, fy - 1, 6 + (x % 4), 0, Math.PI); ctx.fill(); }
    // the sign
    ctx.font = r.font(14); const label = '☕ COCOA CABIN', tw = ctx.measureText(label).width + 24;
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, cx - tw / 2, fy - 34, tw, 26, 7); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; U.roundRect(ctx, cx - tw / 2, fy - 34, tw, 26, 7); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, fy - 20);
  },
  drawCocoa(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 17, y = p.y - 22 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    for (let i = 0; i < 2; i++) { const k = (t * 0.8 + i * 0.5) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 6 + i) * 3, y - 12 - k * 16, 3 + k * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + f * 8, y - 1, 4.5, -Math.PI / 2, Math.PI / 2, f < 0); ctx.stroke();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 8, y - 9, 16, 16, 3); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 8, y - 3, 16, 3);
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(x, y - 8, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
  },
  drawBall(ctx, b) {
    const x = b.x, y = b.y, r = b.r;
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 2, r * 1.05, r * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y - r, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c5d6ea'; ctx.lineWidth = 1.5; ctx.stroke();
    // rolling lumps
    ctx.save(); ctx.beginPath(); ctx.arc(x, y - r, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(190,210,235,0.6)';
    for (let k = 0; k < 3; k++) { const a = b.roll + k * 2.1; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.55, y - r + Math.sin(a) * r * 0.3, r * 0.22, r * 0.14, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(180,200,230,0.45)'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.7, r * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 1.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
  },
  // a stack of snowballs (rs from the bottom up); finished ones get coal eyes, a carrot nose, a scarf and a hat
  drawSnowman(ctx, x, y, rs, face, hat) {
    if (!rs.length) return;
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 2, rs[0] * 1.15, rs[0] * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    const cs = []; let cy = y - rs[0];
    for (let i = 0; i < rs.length; i++) { if (i) cy -= rs[i - 1] * 0.82 + rs[i] * 0.78; cs.push(cy); }
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i], yy = cs[i];
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, yy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c5d6ea'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(x, yy, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = 'rgba(180,200,230,0.4)'; ctx.beginPath(); ctx.arc(x + r * 0.35, yy + r * 0.3, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (!face || rs.length < 3) return;
    const hr = rs[2], hy = cs[2], mr = rs[1], my = cs[1];
    // buttons
    ctx.fillStyle = '#2b1d14'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(x, my + k * mr * 0.38, Math.max(2, mr * 0.09), 0, Math.PI * 2); ctx.fill(); }
    // scarf
    const sc = ['#e4572e', '#3b7dd8', '#2f9e44'][(hat || 0) % 3];
    ctx.fillStyle = sc; U.roundRect(ctx, x - hr * 0.95, hy + hr * 0.62, hr * 1.9, Math.max(6, hr * 0.32), 4); ctx.fill();
    U.roundRect(ctx, x + hr * 0.25, hy + hr * 0.7, Math.max(6, hr * 0.32), hr * 1.0, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + hr * 0.25, hy + hr * 1.35, Math.max(6, hr * 0.32), 2);
    // eyes, carrot nose and a coal smile
    ctx.fillStyle = '#2b1d14'; const er = Math.max(1.8, hr * 0.12);
    ctx.beginPath(); ctx.arc(x - hr * 0.35, hy - hr * 0.18, er, 0, Math.PI * 2); ctx.arc(x + hr * 0.35, hy - hr * 0.18, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.moveTo(x - 1, hy - hr * 0.02); ctx.lineTo(x + hr * 0.95, hy + hr * 0.12); ctx.lineTo(x - 1, hy + hr * 0.24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(x + k * hr * 0.17, hy + hr * 0.45 - Math.abs(k) * hr * -0.05 - (2 - Math.abs(k)) * hr * 0.04, Math.max(1.2, hr * 0.06), 0, Math.PI * 2); ctx.fill(); }
    // a top hat
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - hr * 0.95, hy - hr * 0.86, hr * 1.9, hr * 0.2, 2); ctx.fill();
    U.roundRect(ctx, x - hr * 0.6, hy - hr * 1.7, hr * 1.2, hr * 0.9, 3); ctx.fill();
    ctx.fillStyle = sc; ctx.fillRect(x - hr * 0.6, hy - hr * 1.02, hr * 1.2, hr * 0.16);
  },
  drawKid(r, g, k) {
    const ctx = r.ctx, L = k.look, hop = k.hop > 0 ? Math.sin(k.hop * Math.PI * 2) * 6 : 0;
    const look = { shirt: L.shirt, skin: '#f1c27d', hat: 'cap', capColor: L.cap, facing: k.facing, moving: k.moving, bob: k.bob, pants: '#3a3f5c' };
    ctx.save(); ctx.translate(k.x, k.y - Math.abs(hop)); ctx.scale(0.78, 0.78);
    if (k.state === 'slide' || (k.state === 'wait' && k.y < 5320)) {
      const tilt = k.state === 'slide' ? Math.cos((k.y - 5300) * 0.012 + k.i) * 0.15 : 0;
      ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(3, 6, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
      this.drawSled(ctx, 0, 0, L.sled, tilt); this.drawSeated(r, 0, -2, look); this.drawSledFront(ctx, 0, 0, L.sled, tilt);
    } else {
      // walking back up, pulling the sled on a rope
      const sx = -k.facing * 4, sy = k.state === 'walk' && k.path && k.path[0] && k.path[0].y < k.y - 4 ? 34 : 0, ox = sy ? 0 : -k.facing * 34;
      ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, -14); ctx.lineTo(ox, sy - 14 + (sy ? 0 : 10)); ctx.stroke();
      this.drawSled(ctx, ox, sy, L.sled, sy ? 0 : Math.PI / 2); this.drawSledFront(ctx, ox, sy, L.sled, sy ? 0 : Math.PI / 2);
      r.drawPerson(0, 0, look);
    }
    ctx.restore();
  },
  drawDog(r, g, d) {
    const ctx = r.ctx, f = d.facing, hop = d.hop > 0 ? Math.abs(Math.sin(d.hop * Math.PI * 2)) * 10 : 0, x = d.x, y = d.y - hop, t = g.time;
    const step = d.moving ? Math.sin(d.bob) * 3 : 0, wag = Math.sin(t * (d.moving || hop ? 14 : 6)) * 0.5;
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 2, 18 * (1 - hop / 30), 6, 0, 0, Math.PI * 2); ctx.fill();
    // tail (curled, wagging)
    ctx.save(); ctx.translate(x - f * 16, y - 18); ctx.rotate(-f * 0.6 + wag * f);
    ctx.fillStyle = '#e8eef5'; ctx.beginPath(); ctx.ellipse(-f * 2, -8, 5, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // legs
    ctx.fillStyle = '#9aa7b8'; for (const [lx, s] of [[-10, 1], [-4, -1], [6, 1], [12, -1]]) { U.roundRect(ctx, x + f * lx - 2.5, y - 10 + s * step * 0.5, 5, 10, 2); ctx.fill(); }
    // body: grey back, white belly
    ctx.fillStyle = '#9aa7b8'; ctx.beginPath(); ctx.ellipse(x, y - 16, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f7fb'; ctx.beginPath(); ctx.ellipse(x + f * 2, y - 12, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    // a red collar and the head
    ctx.fillStyle = '#9aa7b8'; ctx.beginPath(); ctx.arc(x + f * 18, y - 26, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f7fb'; ctx.beginPath(); ctx.ellipse(x + f * 22, y - 22, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x + f * 12 - 3, y - 20, 6, 8);
    ctx.fillStyle = '#7e8a9b'; for (const e of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + f * 18 + e * 6, y - 32); ctx.lineTo(x + f * 18 + e * 8, y - 42); ctx.lineTo(x + f * 18 + e * 1, y - 35); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 21, y - 29, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + f * 28, y - 23, 2.6, 0, Math.PI * 2); ctx.fill();
    if (d.hop > 0 || d.say) { ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.ellipse(x + f * 25, y - 17, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  },

  // ---- Construction Town: the big wheel on its post, the cable up to the mountains and its chairs
  drawCtLift(r, g) {
    const ctx = r.ctx, C = CFG.SNOW.CT, Wh = C.WHEEL, t = g.time, wy = Wh.y - Wh.h;
    if (r.camX > Wh.x + 200 || r.camX + r.viewW < Wh.x - 200) return;
    const topY = Math.min(r.camY - 60, wy - 120);
    const xl0 = Wh.x - Wh.r, xr0 = Wh.x + Wh.r, xl1 = Wh.x - Wh.r * 0.55, xr1 = Wh.x + Wh.r * 0.55;
    const at = (x0, x1, y) => x0 + (x1 - x0) * (wy - y) / (wy - topY);
    // the post
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Wh.x + 4, Wh.y + 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(Wh.x - 5, wy, 10, Wh.h + 2);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Wh.x - 14, Wh.y - 4, 28, 6);
    // the cable
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xl0, wy); ctx.lineTo(xl1, topY); ctx.moveTo(xr0, wy); ctx.lineTo(xr1, topY); ctx.stroke();
    // chairs: up the right-hand strand, down the left
    const sp = 84, off = (t * 34) % sp, cols = ['#e4572e', '#3b7dd8', '#2f9e44', '#ffd166'];
    for (let i = 0; wy - i * sp > topY - sp; i++) {
      const yu = wy - 10 - i * sp - off, yd = topY + i * sp + off;
      const su = 0.75 + 0.25 * (yu - topY) / (wy - topY), sd = 0.75 + 0.25 * (yd - topY) / (wy - topY);
      if (yu < wy - 6 && yu > topY) { ctx.save(); ctx.translate(at(xr0, xr1, yu), yu); ctx.scale(su, su); this.drawChair(ctx, 0, 0, cols[i % 4], Math.sin(t * 2 + i) * 0.06); ctx.restore(); }
      if (yd < wy - 6 && yd > topY) { ctx.save(); ctx.translate(at(xl0, xl1, yd), yd); ctx.scale(sd, sd); this.drawChair(ctx, 0, 0, cols[(i + 2) % 4], Math.sin(t * 2 + i + 1) * 0.06); ctx.restore(); }
    }
    this.drawWheel(ctx, Wh.x, wy, Wh.r, t);
  },

  // ---- the ride between Construction Town and Snowy Peak (full screen)
  travel: {
    skilift(r, g, W, H) { SnowExt.drawLiftRide(r, g, W, H); },
  },
  drawLiftRide(r, g, W, H) {
    const ctx = r.ctx, tr = g.travel, up = tr.to === 'snow', t = tr.t, dur = tr.dur, k = U.clamp(t / dur, 0, 1);
    const ease = k * k * (3 - 2 * k), LEN = 2400, s = (up ? ease : 1 - ease) * LEN;
    const A = 0.36, ca = Math.cos(A), sa = Math.sin(A), cx = W * 0.5, cy = H * 0.66, sc = U.clamp(Math.min(W, H) / 520, 0.85, 1.5);
    const X = (u) => cx + (u - s) * ca, Y = (u, hh) => cy - (u - s) * sa - (hh || 0);
    const h = (i) => this.hash(i);
    // sky and far peaks (slow parallax)
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#6fb8ef'); sky.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.14, Math.min(W, H) * 0.05, 0, Math.PI * 2); ctx.fill();
    const far = s * 0.12, base = H * 0.42 + s * 0.06;
    for (let i = -1; i < W / 160 + 3; i++) {
      const j = i + Math.floor(far / 160), px = j * 160 - far + 80, ph = 90 + h(j * 3.3) * 110, w = 150;
      ctx.fillStyle = '#93a9c8'; ctx.beginPath(); ctx.moveTo(px - w, base + 60); ctx.lineTo(px, base - ph); ctx.lineTo(px + w, base + 60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px, base - ph); ctx.lineTo(px - w * 0.3, base - ph + (ph + 60) * 0.3); ctx.lineTo(px, base - ph + (ph + 60) * 0.22); ctx.lineTo(px + w * 0.3, base - ph + (ph + 60) * 0.3); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#e3eefa'; ctx.fillRect(0, base + 58, W, H);
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) { const qx = ((i * 330 - s * 0.25) % (W + 300) + W + 300) % (W + 300) - 150, qy = H * (0.1 + (i % 2) * 0.08) + s * 0.05; ctx.beginPath(); ctx.arc(qx, qy, 16, 0, Math.PI * 2); ctx.arc(qx + 20, qy - 9, 21, 0, Math.PI * 2); ctx.arc(qx + 44, qy, 15, 0, Math.PI * 2); ctx.fill(); }
    // the snowy slope
    const u0 = s - W / ca - 200, u1 = s + W / ca + 200;
    ctx.fillStyle = '#f4f9ff'; ctx.beginPath(); ctx.moveTo(X(u0), H + 10);
    for (let u = u0; u <= u1; u += 40) ctx.lineTo(X(u), Y(u, Math.sin(u * 0.01) * 6));
    ctx.lineTo(X(u1), H + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cfe0f2'; ctx.lineWidth = 3; ctx.beginPath(); for (let u = u0; u <= u1; u += 40) { if (u === u0) ctx.moveTo(X(u), Y(u, Math.sin(u * 0.01) * 6)); else ctx.lineTo(X(u), Y(u, Math.sin(u * 0.01) * 6)); } ctx.stroke();
    ctx.fillStyle = 'rgba(190,212,240,0.5)'; for (let u = Math.floor(u0 / 120) * 120; u < u1; u += 120) { ctx.beginPath(); ctx.ellipse(X(u) + 30, Y(u) + 60 + h(u) * 40, 60, 10, -A, 0, Math.PI * 2); ctx.fill(); }
    // Construction Town's snowy rooftops at the bottom, the lift station by the mine, the top station up at the end
    const house = (u, depth, col, roof) => {
      const x = X(u), y = Y(u) + depth, w = 70 * sc, hh = 44 * sc;
      ctx.fillStyle = col; ctx.fillRect(x - w / 2, y - hh, w, hh);
      ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x - w / 2 + 10 * sc, y - hh + 12 * sc, 14 * sc, 12 * sc); ctx.fillRect(x + w / 2 - 24 * sc, y - hh + 12 * sc, 14 * sc, 12 * sc);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, y - hh); ctx.lineTo(x, y - hh - 32 * sc); ctx.lineTo(x + w / 2 + 8, y - hh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, y - hh - 2); ctx.lineTo(x, y - hh - 34 * sc); ctx.lineTo(x + w / 2 + 6, y - hh - 2); ctx.lineTo(x + w / 2 - 6, y - hh + 4); ctx.lineTo(x, y - hh - 24 * sc); ctx.lineTo(x - w / 2 + 6, y - hh + 4); ctx.closePath(); ctx.fill();
    };
    [[-420, 30, '#ffd166', '#e4572e'], [-330, -10, '#9fe0ff', '#3b7dd8'], [-250, 46, '#ffb6c1', '#8e5bd1'], [-150, 10, '#f2d6a0', '#b23a48'], [-90, 70, '#cfe3f7', '#2d5a8a'], [-520, 60, '#a5d6a7', '#e4572e']].forEach(([u, d, c, rf]) => { if (X(u) > -120 && X(u) < W + 120) house(u, d, c, rf); });
    const station = (u, label) => {
      const x = X(u), y = Y(u) + 20, w = 90 * sc, hh = 50 * sc;
      if (x < -150 || x > W + 150) return;
      ctx.fillStyle = '#a0683a'; ctx.fillRect(x - w / 2, y - hh, w, hh); ctx.fillStyle = '#7d4f2b'; for (let yy = y - hh + 7; yy < y; yy += 8) ctx.fillRect(x - w / 2, yy, w, 2);
      ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, y - hh); ctx.lineTo(x, y - hh - 26 * sc); ctx.lineTo(x + w / 2 + 8, y - hh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, y - hh - 2); ctx.lineTo(x, y - hh - 28 * sc); ctx.lineTo(x + w / 2 + 6, y - hh - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; ctx.font = r.font(Math.round(12 * sc)); const tw = ctx.measureText(label).width + 16; U.roundRect(ctx, x - tw / 2, y - hh + 8, tw, 20 * sc, 5); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y - hh + 8 + 10 * sc);
    };
    station(-30, '⛷️ SKI LIFT');
    station(LEN + 60, '🏔️ SNOWY PEAK');
    // pine trees along the slope (some in front, some behind), lift towers
    const CH = 170 * sc;
    for (let u = Math.floor(u0 / 70) * 70; u < u1; u += 70) {
      const i = Math.round(u / 70); if (u < 60 || u > LEN - 40 || h(i * 1.7) < 0.35) continue;
      const depth = (h(i * 2.9) - 0.3) * 120, x = X(u), y = Y(u) + depth, ts = sc * (0.8 + h(i * 5.1) * 0.5) * (1 + depth / 400);
      if (x > -60 && x < W + 60) this.drawPine(ctx, x, y, ts);
    }
    for (let u = 200; u < LEN; u += 420) {
      const x = X(u), y = Y(u) + 4; if (x < -40 || x > W + 40) continue;
      ctx.fillStyle = '#7d8591'; ctx.fillRect(x - 4, y - CH, 8, CH); ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 16, y - CH - 4, 32, 6);
    }
    // the cables: the far one (chairs coming the other way), then ours
    const cab = (hh) => { ctx.beginPath(); ctx.moveTo(X(u0), Y(u0, hh)); ctx.lineTo(X(u1), Y(u1, hh)); ctx.stroke(); };
    ctx.strokeStyle = '#6a7380'; ctx.lineWidth = 1.5; cab(CH + 18);
    const cols = ['#3b7dd8', '#2f9e44', '#ffd166', '#e4572e'];
    for (let i = -6; i <= 6; i++) {
      const u = s + i * 300 - ((t * 120) % 300) * (up ? 1 : -1) * 2; const x = X(u); if (x < -40 || x > W + 40) continue;
      ctx.save(); ctx.translate(x, Y(u, CH + 18)); ctx.scale(sc * 0.7, sc * 0.7); this.drawChair(ctx, 0, 0, cols[(i + 6) % 4], Math.sin(g.time * 2 + i) * 0.06); ctx.restore();
    }
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2.5; cab(CH);
    for (const i of [-2, -1, 1, 2]) { const u = s + i * 330, x = X(u); if (x < -60 || x > W + 60) continue; ctx.save(); ctx.translate(x, Y(u, CH)); ctx.scale(sc, sc); this.drawChair(ctx, 0, 0, cols[(i + 4) % 4], Math.sin(g.time * 2.2 + i) * 0.08); ctx.restore(); }
    // our chair, swinging gently, with the chef sitting on it, feet dangling
    const jolt = Math.exp(-t * 2) * Math.sin(t * 9) * 0.12 + Math.exp(-(dur - t) * 3) * Math.sin(t * 9) * 0.1;
    const sw = Math.sin(g.time * 2.1) * 0.09 + jolt;
    ctx.save(); ctx.translate(X(s), Y(s, CH)); ctx.rotate(sw); ctx.scale(sc * 1.25, sc * 1.25);
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(-22, 42); ctx.lineTo(-22, 78); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -24, 50, 48, 18, 5); ctx.fill();          // backrest
    r.drawPerson(0, 92, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: up ? 1 : -1, moving: false, pants: '#2d3a4a', carry: 0 });
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -26, 78, 52, 9, 3); ctx.fill();            // the seat, in front of the chef's lap
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-24, 62); ctx.lineTo(24, 62); ctx.lineTo(24, 78); ctx.stroke();   // the safety bar
    ctx.restore();
    // falling snow over everything
    this.drawFlakes(ctx, W, H, g.time, 70, 0.9);
    // the banner
    const txt = up ? '🚡 Up to Snowy Peak!' : '🚡 Down to Construction Town!';
    ctx.font = r.font(18); const bw = ctx.measureText(txt).width + 36;
    const by = W < 640 ? 104 : 70;
    ctx.fillStyle = 'rgba(45,58,74,0.85)'; U.roundRect(ctx, W / 2 - bw / 2, by, bw, 38, 12); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, by + 20);
    // a white fade at both ends
    const fade = Math.max(0, 1 - t / 0.35, 1 - (dur - t) / 0.4);
    if (fade > 0) { ctx.fillStyle = `rgba(255,255,255,${U.clamp(fade, 0, 1).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
};
Game.ext.unshift(SnowExt);   // ahead of the outer map: at the lift and on the snow its buttons and hints count
Render.ext.push(SnowExt);
