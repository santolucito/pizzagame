'use strict';
// The rest of Construction Town: the site block (2600..4000 × -170..900) stays the big building site; east of it
// (x 4000..4500) and south of it (y 900..1300) the town goes on with paved streets, a WELCOME sign, a HARDWARE STORE
// you can go inside (paint cans, tools, a key-cutting machine, a paint shaker, a hammer-the-nail game, a shopkeeper,
// a toy toolbox and a hard hat), three little houses with gardens (one with a barking dog), a park with a pond and a
// duck, a playground slide, a bus shelter, a mailbox, a water tower, a DINER with a neon sign and a picnic table, a
// dirt bike track loop for the site machines, and the CONCRETE FACTORY in the south-east corner: silos, a conveyor,
// a mixing plant with a turning drum and a puffing chimney, and two rideable concrete mixers (the '🪣 Pour!' button swings
// out a telescoping chute at the back and pours a stream of concrete into a puddle under its tip). In the site block, by
// the excavator, a rideable CRANE TRUCK with a steel beam pile: the hook hangs in front of the cab ('🪝 Lift a beam' near
// the beams, '⬇️ Put it down' anywhere: on the half-built house's walls it clicks into place with a sparkle).
// Extension module: registered with Game.ext (first, so its door beats the core) and Render.ext (see js/EXTENSIONS.md).
CFG.SITETOWN = {
  EAST: { x0: 4000, y0: -170, x1: 4500, y1: 1300 },           // the east strip
  SOUTH: { x0: 2600, y0: 900, x1: 4000, y1: 1300 },           // the south strip
  SITE_ROAD: { x0: 4016, y0: 120, x1: 4096, y1: 1300 },       // paved street down the east side, from the gravel road (16 px sidewalks each side)
  SOUTH_ST: { x0: 2600, y0: 916, x1: 4096, y1: 996 },         // paved street along the south of the site block
  SIGN: { x: 4300, y: 178 },                                  // WELCOME TO CONSTRUCTION TOWN
  STORE: { x0: 4150, y0: 220, x1: 4420, y1: 380, door: { x: 4285, half: 18 } },
  DOOR_OUT: { x: 4285, y: 398 },                              // on the store's sidewalk, just below the door
  MAILBOX: { x: 4126, y: 470 },
  HOUSES: [
    { x0: 4150, y0: 460, x1: 4230, y1: 560, wall: '#ffd166', roof: '#e4572e' },
    { x0: 4285, y0: 460, x1: 4365, y1: 560, wall: '#9fe0ff', roof: '#3b7dd8' },
    { x0: 4420, y0: 460, x1: 4500, y1: 560, wall: '#ffb6c1', roof: '#8e5bd1' },
  ],
  GARDEN_H: 70,                                               // the fenced gardens below the houses (y 570..640)
  DOG: { x0: 4292, y0: 582, x1: 4358, y1: 634, home: { x: 4325, y: 612 } },   // the middle garden has a dog
  PARK: { x0: 4130, y0: 680, x1: 4330, y1: 1000 }, POND: { x: 4230, y: 830, rx: 64, ry: 38 },
  SLIDE: { top: { x: 4420, y: 700 }, bottom: { x: 4420, y: 790 }, dur: 0.8 },   // walk onto the ladder (top) and slide south
  BUS: { x: 4136, y: 905 },                                   // bus shelter (just art) on the grass by the street
  TOWER: { x: 4440, y: 950 },                                 // the water tower's legs stand here
  LAMPS: [[4106, 200], [4106, 440], [4106, 680], [4106, 920], [4106, 1160], [3200, 1006], [3700, 1006], [2700, 1006]],
  TREES: [[4470, 170], [4350, 690], [4480, 662], [4300, 980], [3720, 1060], [3960, 1060], [3720, 1260], [3300, 1060], [2660, 1040]],
  BEDS: [[4230, 180], [4370, 180], [4470, 420], [3440, 1260]],   // flower beds (art)
  CROSSINGS: [{ x0: 4016, y0: 160, x1: 4096, y1: 186 }, { x0: 4016, y0: 860, x1: 4096, y1: 886 }, { x0: 3650, y0: 916, x1: 3676, y1: 996 }, { x0: 2990, y0: 916, x1: 3016, y1: 996 }],
  // the concrete factory (south-east corner)
  FACTORY: {
    x0: 4112, y0: 1012, x1: 4500, y1: 1300,
    SILOS: [4150, 4196, 4242], SILO_BOX: { x0: 4128, y0: 1024, x1: 4264, y1: 1110 },
    PLANT: { x0: 4296, y0: 1020, x1: 4386, y1: 1110 }, DRUM: { x: 4341, y: 1076, r: 26 }, CHUTE: { x: 4341, y: 1112 }, CHIMNEY: { x: 4372, y: 1030 },
    PILE: { x: 4452, y: 1078, r: 32 }, PILE_BOX: { x0: 4418, y0: 1052, x1: 4500, y1: 1104 },
    BELT: { x0: 4432, y0: 1066, x1: 4378, y1: 1032 },
    SIGN: { x: 4196, y: 1004 },                                        // the banner across the silos (drawn with them)
  },
  MIXERS: [{ x: 4210, y: 1200, angle: -Math.PI / 2 }, { x: 4340, y: 1200, angle: -Math.PI / 2 }],
  PUDDLE: 20,                                                 // seconds a poured puddle stays
  // the mixer's pour: the chute swings out and extends (OUT s), the stream pours (FLOW s), the chute folds back (FOLD s)
  POUR: { OUT: 0.5, FLOW: 1.5, FOLD: 0.5, PIVOT: -56, SWING: 0.7, SEGS: [20, 20, 18], DROP: 30 },
  // the crane truck in the site block, near the excavator: the hook hangs HOOK px in front of it, a steel beam pile under it
  CRANETRUCK: { x: 3440, y: 690, angle: Math.PI },
  HOOK: 95, BEAM_PILE: { x: 3345, y: 700 }, BEAM_PILE_BOX: { x0: 3311, y0: 687, x1: 3379, y1: 713 },
  LOOSE_BEAMS: [[3535, 600, 1.3], [2650, 470, 1.45]],          // a couple of beams lying around (x, y, angle)
  BEAM_LEN: 70, LIFT_REACH: 95, TRUCK_REACH: 125, FRAME_PAD: 44, LIFT_T: 1.4, DROP_T: 1.4,
  // the south strip: the dirt track, the diner and a park
  TRACK: { x: 2950, y: 1160, rx: 310, ry: 118, rxi: 200, ryi: 54 },
  DINER: { x0: 3400, y0: 1040, x1: 3660, y1: 1170, door: { x: 3530 } },
  TABLE: { x: 3530, y: 1232 }, SEAT: { x: 3530, y: 1258 },   // picnic table and the bench spot you sit on
  POND2: { x: 3810, y: 1180, rx: 62, ry: 38 },
  PADS: { shake: { x: 3634, y: 1234 }, toolbox: { x: 4100, y: 4296 }, hardhat: { x: 4210, y: 4296 } },
  // the hardware store interior (reserved rectangle)
  WORLD: { x0: 4000, y0: 4000, x1: 4600, y1: 4400 },
  ROOM: { x0: 4040, y0: 4100, x1: 4560, y1: 4340 }, WALL: 24, BACK_TOP: 4016,
  PAINT_SHELF: { x0: 4050, y0: 4030, x1: 4270, y1: 4096 }, PEGBOARD: { x0: 4290, y0: 4030, x1: 4470, y1: 4096 },
  KEY_COUNTER: { x0: 4480, y0: 4100, x1: 4552, y1: 4124 }, KEY: { x: 4516, y: 4100 }, KEY_SPOT: { x: 4516, y: 4148 },
  MIX: { x: 4090, y: 4132 }, MIX_BOX: { x0: 4066, y0: 4112, x1: 4114, y1: 4150 }, MIX_SPOT: { x: 4090, y: 4178 },
  AISLES: [{ x0: 4150, y0: 4160, x1: 4340, y1: 4188, kind: 'paint' }, { x0: 4150, y0: 4236, x1: 4340, y1: 4264, kind: 'tools' }],
  BENCH: { x0: 4470, y0: 4178, x1: 4552, y1: 4214 }, NAIL: { x: 4518, y: 4192 }, NAIL_SPOT: { x: 4518, y: 4240 },
  COUNTER: { x0: 4380, y0: 4268, x1: 4500, y1: 4298 }, KEEPER_HOME: { x: 4440, y: 4250 },
  PLANT: { x: 4058, y: 4320 },
  EXIT: { x: 4300, y: 4322 },                                 // the mat inside the door (the door is in the bottom wall)
  KEY_T: 1.3, MIX_T: 1.6, SEAT_T: 0, WEAR: 30,                // seconds: key cutting, paint shaking, how long the toolbox / hat / milkshake last
};
CFG.AREAS.hardware = { WORLD: CFG.SITETOWN.WORLD };
CFG.VEHICLES.mixer = { speed: 240, radius: 22, label: '🚛 Drive the mixer', exit: '🚶 Hop out' };
CFG.VEHICLES.cranetruck = { speed: 260, radius: 24, label: '🏗️ Drive the crane', exit: '🚶 Get out' };

const SiteTownExt = {
  name: 'sitetown',
  st: null,
  mixers: null,
  defaults: { sitetown: { seen: false, pours: 0, keys: 0, mixes: 0, nails: 0, toolboxes: 0, hats: 0, shakes: 0, slides: 0, sits: 0 } },

  // ---------- state ----------
  build(g) {
    const S = CFG.SITETOWN;
    if (!g.s.sitetown) g.s.sitetown = JSON.parse(JSON.stringify(this.defaults.sitetown));
    this.mixers = S.MIXERS.map((m) => ({ kind: 'mixer', x: m.x, y: m.y, angle: m.angle, vx: 0, vy: 0, drum: 0, pour: null }));
    const C = S.CRANETRUCK;
    this.crane = { kind: 'cranetruck', x: C.x, y: C.y, angle: C.angle, vx: 0, vy: 0, out: 0, boom: 0, carry: null, anim: null };
    this.rides = this.mixers.concat([this.crane]);
    this.st = {
      fade: 0, puddles: [], smoke: [], smokeT: 0,
      beams: S.LOOSE_BEAMS.map(([x, y, a]) => ({ x, y, a })), frameBeams: [], placed: 0,   // steel beams (not saved)
      seat: null, slide: null, slideCd: 0, shake: 0, toolbox: 0, hat: 0,
      dog: { x: S.DOG.home.x, y: S.DOG.home.y, facing: 1, moving: false, bob: 0, wag: 0, happy: 0, target: null, timer: 0, barkT: 0 },
      duck: { a: 0, x: S.POND.x, y: S.POND.y, facing: 1, quackT: 0 }, duck2: { a: 2, x: S.POND2.x, y: S.POND2.y, facing: 1, quackT: 0 },
      key: null, mix: null, nail: { depth: 0, hit: 0, done: 0 }, sparks: [],
      keeper: { x: S.KEEPER_HOME.x, y: S.KEEPER_HOME.y, facing: -1, moving: false, bob: 0, wave: 0 },
      siteObs: null, roomObs: null,
    };
    // outside: buildings, the pond, the water tower's legs, the mailbox, tree trunks, the factory's plant row
    const o = [];
    const box = (b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    o.push(box(S.STORE));
    for (const h of S.HOUSES) o.push(box(h));
    o.push({ x: S.MAILBOX.x - 8, y: S.MAILBOX.y - 8, w: 16, h: 14 });
    o.push({ x: S.POND.x - S.POND.rx, y: S.POND.y - S.POND.ry, w: S.POND.rx * 2, h: S.POND.ry * 2 });
    o.push({ x: S.POND2.x - S.POND2.rx, y: S.POND2.y - S.POND2.ry, w: S.POND2.rx * 2, h: S.POND2.ry * 2 });
    o.push({ x: S.TOWER.x - 20, y: S.TOWER.y - 14, w: 40, h: 28 });
    for (const [x, y] of S.TREES) o.push({ x: x - 9, y: y - 8, w: 18, h: 14 });
    o.push(box(S.FACTORY.SILO_BOX), box(S.FACTORY.PLANT), box(S.FACTORY.PILE_BOX));
    o.push(box(S.DINER));
    o.push(box(S.BEAM_PILE_BOX));   // the steel beam pile in the site block
    o.push({ x: S.TABLE.x - 32, y: S.TABLE.y - 11, w: 64, h: 22 });
    this.st.siteObs = o;
    // inside: the room's walls, the back counter, the paint shaker, the aisle shelves, the workbench, the counter, a plant
    const R = S.ROOM, w = S.WALL, r = [];
    r.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    r.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    r.push(box(S.KEY_COUNTER), box(S.MIX_BOX), box(S.BENCH), box(S.COUNTER));
    for (const a of S.AISLES) r.push(box(a));
    r.push({ x: S.PLANT.x - 14, y: S.PLANT.y - 14, w: 28, h: 26 });
    this.st.roomObs = r;
  },
  obstacles(g) {
    if (!this.st) this.build(g);
    if (g.area === 'site') return this.st.siteObs;
    if (g.area === 'hardware') return this.st.roomObs;
    return [];
  },
  vehicles(g) { if (!this.rides) this.build(g); return this.rides; },
  free(x, y) {
    const R = CFG.SITETOWN.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.roomObs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  inMixer(g) { return g.driving && this.mixers && this.mixers.includes(g.vehicle); },
  inCrane(g) { return g.driving && !!this.crane && g.vehicle === this.crane; },
  atDoor(g) { const D = CFG.SITETOWN.DOOR_OUT, p = g.player; return g.area === 'site' && this.onFoot(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  nearSpot(g, s, d = 26) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < d; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const S = CFG.SITETOWN, st = this.st;
    if (g.area === 'site') {
      if (this.inMixer(g)) return { label: '🪣 Pour!', run: (gg) => this.pour(gg) };   // pressing again while it pours does nothing
      if (this.inCrane(g)) {
        const v = this.crane;
        if (v.anim) return null;
        if (v.carry) return { label: '⬇️ Put it down', run: (gg) => this.dropBeam(gg) };
        if (this.liftSource(g)) return { label: '🪝 Lift a beam', run: (gg) => this.liftBeam(gg) };
        return null;
      }
      if (!this.onFoot(g)) return null;
      if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
      if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
      if (this.nearSpot(g, S.SEAT)) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg) };
      return null;
    }
    if (g.area !== 'hardware') return null;
    if (st.key || st.mix) return null;
    if (this.nearSpot(g, S.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.nearSpot(g, S.KEY_SPOT)) return { label: '🔑 Cut a key', run: (gg) => this.cutKey(gg) };
    if (this.nearSpot(g, S.MIX_SPOT)) return { label: '🎨 Shake the paint', run: (gg) => this.mixPaint(gg) };
    if (this.nearSpot(g, S.NAIL_SPOT)) return { label: '🔨 Whack the nail!', run: (gg) => this.whack(gg) };
    return null;
  },
  enter(g) {
    const S = CFG.SITETOWN, p = g.player;
    g.area = 'hardware'; p.x = S.EXIT.x; p.y = S.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.seat = null; this.st.slide = null; Sfx.ding(); Haptics.tap();
    if (!g.s.sitetown.seen) { g.s.sitetown.seen = true; g.toast('🔧 Welcome to the hardware store!', true); }
  },
  leave(g) {
    const S = CFG.SITETOWN, p = g.player;
    g.area = 'site'; p.x = S.DOOR_OUT.x; p.y = S.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.key = null; this.st.mix = null; this.st.fade = 0.45; Sfx.drop();
  },
  // ---------- the concrete mixer's pour: the chute swings out and telescopes, a stream pours from its tip, it folds back
  pour(g) {
    const v = g.vehicle;
    if (!v || v.kind !== 'mixer' || v.pour) return;
    v.pour = { t: 0, lock: { x: v.x, y: v.y, angle: v.angle }, puddle: null };
    v.vx = 0; v.vy = 0; g.s.sitetown.pours++;
    Sfx.pickup(); Haptics.tap();
  },
  pourDur() { const P = CFG.SITETOWN.POUR; return P.OUT + P.FLOW + P.FOLD; },
  // the chute's shape for a mixer right now: its angle (vehicle frame), the three segment lengths, and the tip (local + world)
  chute(v) {
    const P = CFG.SITETOWN.POUR, cl = (x) => U.clamp(x, 0, 1), ease = (x) => x * x * (3 - 2 * x);
    let swing = 0, l2 = 0, l3 = 0, flowing = false;
    const t = v && v.pour ? v.pour.t : -1;
    if (t >= 0) {
      if (t < P.OUT) { swing = ease(cl(t / 0.25)); l2 = P.SEGS[1] * ease(cl((t - 0.15) / 0.2)); l3 = P.SEGS[2] * ease(cl((t - 0.3) / 0.2)); }
      else if (t < P.OUT + P.FLOW) { swing = 1; l2 = P.SEGS[1]; l3 = P.SEGS[2]; flowing = true; }
      else { const u = t - P.OUT - P.FLOW; l3 = P.SEGS[2] * (1 - ease(cl(u / 0.2))); l2 = P.SEGS[1] * (1 - ease(cl((u - 0.15) / 0.2))); swing = 1 - ease(cl((u - 0.3) / 0.2)); }
    }
    const ang = Math.PI - P.SWING * swing, len = P.SEGS[0] + l2 + l3;
    const lx = P.PIVOT + Math.cos(ang) * len, ly = Math.sin(ang) * len;
    const a = v ? v.angle : 0, ca = Math.cos(a), sa = Math.sin(a);
    const tip = v ? { x: v.x + lx * ca - ly * sa, y: v.y + lx * sa + ly * ca } : { x: lx, y: ly };
    return { ang, segs: [P.SEGS[0], l2, l3], swing, local: { x: lx, y: ly }, tip, flowing, t };
  },
  stepPour(g, m, dt) {
    const P = CFG.SITETOWN.POUR, st = this.st, p = m.pour;
    p.t += dt; this.lockVehicle(g, m, p.lock);
    if (p.t >= P.OUT && !p.puddle) {
      // the stream reaches the ground under the chute's tip: a puddle starts growing there
      const tip = this.chute(m).tip, x = tip.x, y = tip.y + P.DROP;
      p.puddle = { x, y, t: 0, r: 22 + Math.random() * 6, grow: P.FLOW };
      st.puddles.push(p.puddle); if (st.puddles.length > 24) st.puddles.shift();
      g.floats.push({ x, y: y - 44, text: 'Splosh!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
      for (let i = 0; i < 6; i++) g.fx.push({ kind: 'dirt', x0: x, y0: y - 4, x1: x + U.rand(-22, 22), y1: y + U.rand(-8, 10), t: -i * 0.05, dur: 0.4 });
      Sfx.drop();
    }
    if (p.t >= this.pourDur()) m.pour = null;
  },
  // hold a vehicle still (outriggers down, chute out): the joystick does nothing until it is done
  lockVehicle(g, v, L) {
    v.x = L.x; v.y = L.y; v.angle = L.angle; v.vx = 0; v.vy = 0;
    if (g.driving && g.vehicle === v) { g.player.x = v.x; g.player.y = v.y; g.player.moving = false; }
  },

  // ---------- the crane truck: the hook hangs in front of the cab; lift a steel beam and put it down where the hook is
  hookPos(v) { const H = CFG.SITETOWN.HOOK; v = v || this.crane; return { x: v.x + Math.cos(v.angle) * H, y: v.y + Math.sin(v.angle) * H }; },
  beamSources() {
    const P = CFG.SITETOWN.BEAM_PILE;
    return [{ kind: 'pile', x: P.x, y: P.y - 14, a: 0 }].concat(this.st.beams.map((b) => ({ kind: 'loose', b, x: b.x, y: b.y, a: b.a })));
  },
  // the beam the hook can reach (generous: near the hook, or near the truck), nearest the hook first
  liftSource(g) {
    const S = CFG.SITETOWN, v = this.crane, h = this.hookPos(v);
    let best = null, bd = Infinity;
    for (const s of this.beamSources()) {
      const dh = U.dist(h.x, h.y, s.x, s.y), dv = U.dist(v.x, v.y, s.x, s.y);
      if ((dh < S.LIFT_REACH || dv < S.TRUCK_REACH) && dh < bd) { bd = dh; best = s; }
    }
    return best;
  },
  // where a beam lowered at (x, y) lands on the half-built house's walls (null when the hook is not over the house)
  frameSpot(x, y, anywhere) {
    const S = CFG.SITETOWN, B = CFG.SITE.BUILDING, pad = S.FRAME_PAD, w = 7, half = S.BEAM_LEN / 2;
    if (!anywhere && (x < B.x0 - pad || x > B.x1 + pad || y < B.y0 - pad || y > B.y1 + pad)) return null;
    const dl = B.door.x - B.door.half, dr = B.door.x + B.door.half;
    const segs = [[B.x0, B.x1, B.y0 + w, 1], [B.x0, dl, B.y1 - w, 1], [dr, B.x1, B.y1 - w, 1], [B.y0, B.y1, B.x0 + w, 0], [B.y0, B.y1, B.x1 - w, 0]];
    let best = null, bd = Infinity;
    for (const [a0, a1, c, horiz] of segs) {
      const lo = a0 + half - 4, hi = Math.max(lo, a1 - half + 4);
      const q = horiz ? { x: U.clamp(x, lo, hi), y: c, a: 0 } : { x: c, y: U.clamp(y, lo, hi), a: Math.PI / 2 };
      const d = U.dist(x, y, q.x, q.y); if (d < bd) { bd = d; best = q; }
    }
    best.lev = this.st.frameBeams.filter((b) => b.a === best.a && U.dist(b.x, b.y, best.x, best.y) < 26).length;
    return best;
  },
  carryAngle(v) { return v.angle + Math.PI / 2; },
  boomH(b) { return 30 + 44 * b; },   // how high the boom's tip is (screen px) for a boom raise of 0..1
  liftBeam(g) {
    const v = this.crane; if (v.anim || v.carry) return;
    const src = this.liftSource(g); if (!src) return;
    if (src.kind === 'loose') this.st.beams = this.st.beams.filter((b) => b !== src.b);
    v.anim = { kind: 'lift', t: 0, lock: { x: v.x, y: v.y, angle: v.angle }, from: { x: src.x, y: src.y, a: src.a } };
    v.vx = 0; v.vy = 0;
    Sfx.pickup(); Haptics.tap();
  },
  dropBeam(g) {
    const v = this.crane; if (v.anim || !v.carry) return;
    const h = this.hookPos(v), f = this.frameSpot(h.x, h.y);
    const to = f ? { x: f.x, y: f.y, a: f.a, lev: f.lev, frame: true } : { x: h.x, y: h.y, a: this.carryAngle(v), lev: 0, frame: false };
    v.carry = null; v.vx = 0; v.vy = 0;
    v.anim = { kind: 'drop', t: 0, lock: { x: v.x, y: v.y, angle: v.angle }, to, placed: false };
    Haptics.tap();
  },
  placeBeam(g, to) {
    const st = this.st;
    if (to.frame) {
      st.frameBeams.push({ x: to.x, y: to.y, a: to.a, lev: to.lev }); if (st.frameBeams.length > 30) st.frameBeams.shift();
      st.placed++;
      const y = to.y - to.lev * 6;
      for (let i = 0; i < 7; i++) g.fx.push({ kind: 'sparkle', x0: to.x + U.rand(-30, 30) * (to.a ? 0.3 : 1), y0: y + U.rand(-30, 30) * (to.a ? 1 : 0.3) - 6, x1: 0, y1: 0, t: -i * 0.05, dur: 0.6 });
      g.floats.push({ x: to.x, y: y - 40, text: 'Click! ✨', color: '#ffe08a', t: 0, dur: 1.4, big: true });
      Sfx.ding(); Haptics.success();
    } else {
      st.beams.push({ x: to.x, y: to.y, a: to.a }); if (st.beams.length > 12) st.beams.shift();
      g.floats.push({ x: to.x, y: to.y - 34, text: 'Clunk!', color: '#fff8ee', t: 0, dur: 1, big: false });
      Sfx.drop(); Haptics.tap();
    }
  },
  stepCrane(g, dt) {
    const S = CFG.SITETOWN, v = this.crane, a = v.anim;
    if (!a) { v.out = Math.max(0, v.out - dt * 4); v.boom = v.carry ? 1 : 0; return; }
    a.t += dt; this.lockVehicle(g, v, a.lock);
    const T = a.kind === 'lift' ? S.LIFT_T : S.DROP_T, k = U.clamp((a.t - 0.3) / 0.8, 0, 1), e = k * k * (3 - 2 * k);
    v.out = a.t < 0.3 ? a.t / 0.3 : a.t > T - 0.3 ? Math.max(0, (T - a.t) / 0.3) : 1;   // the outriggers drop, then tuck back in
    v.boom = a.kind === 'lift' ? e : 1 - e;
    if (a.kind === 'drop' && !a.placed && a.t >= 1.1) { a.placed = true; this.placeBeam(g, a.to); }
    if (a.t >= T) { if (a.kind === 'lift') v.carry = { t: 0 }; v.anim = null; v.out = 0; v.boom = v.carry ? 1 : 0; }
  },
  // the beam in the air right now (lifting, carried or lowering): {x, y (ground), h (height), a}, or null
  beamNow(v) {
    v = v || this.crane;
    const a = v.anim, hook = this.hookPos(v), ch = this.boomH(1) - 26, ca = this.carryAngle(v);
    const lerpA = (a0, a1, k) => { let d = a1 - a0; while (d > Math.PI / 2) d -= Math.PI; while (d < -Math.PI / 2) d += Math.PI; return a0 + d * k; };
    if (a) {
      const k0 = U.clamp((a.t - 0.3) / 0.8, 0, 1), k = k0 * k0 * (3 - 2 * k0);
      if (a.kind === 'lift') return { x: U.lerp(a.from.x, hook.x, k), y: U.lerp(a.from.y, hook.y, k), h: U.lerp(0, ch, k), a: lerpA(a.from.a, ca, k) };
      if (a.placed) return null;
      return { x: U.lerp(hook.x, a.to.x, k), y: U.lerp(hook.y, a.to.y, k), h: U.lerp(ch, a.to.lev * 6, k), a: lerpA(ca, a.to.a, k) };
    }
    if (v.carry) return { x: hook.x, y: hook.y, h: ch, a: ca };
    return null;
  },
  craneHint(g) {
    const v = this.crane, h = this.hookPos(v);
    if (v.anim) return { text: v.anim.kind === 'lift' ? 'Up it goes! 🪝' : 'Down it goes! ⬇️', target: null };
    if (v.carry) {
      if (this.frameSpot(h.x, h.y)) return { text: 'Press the big button to put the beam on the house! 🏠', target: null };
      const f = this.frameSpot(h.x, h.y, true);
      return { text: 'Bring the beam to the house! 🏠', target: { x: f.x, y: f.y } };
    }
    if (this.liftSource(g)) return { text: 'Press the big button to lift a beam! 🪝', target: null };
    const s = this.beamSources().sort((a, b) => U.dist(h.x, h.y, a.x, a.y) - U.dist(h.x, h.y, b.x, b.y))[0];
    return { text: 'Drive the hook to the steel beams! 🪝', target: { x: s.x, y: s.y } };
  },
  sitDown(g) {
    const S = CFG.SITETOWN, p = g.player;
    this.st.seat = { t: 0 }; p.x = S.SEAT.x; p.y = S.SEAT.y; p.moving = false; p.facing = 1; g.s.sitetown.sits++;
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) { if (!this.st.seat) return; this.st.seat = null; g.player.moving = false; Sfx.drop(); },
  cutKey(g) {
    const st = this.st; st.key = { t: 0 }; g.s.sitetown.keys++;
    const p = g.player; p.moving = false; Sfx.clean(); Haptics.tap();
  },
  mixPaint(g) { const st = this.st; st.mix = { t: 0 }; g.player.moving = false; Sfx.pickup(); Haptics.tap(); },
  whack(g) {
    const S = CFG.SITETOWN, n = this.st.nail, p = g.player;
    if (n.done > 0) return;
    n.depth = Math.min(3, n.depth + 1); n.hit = 0.25; p.moving = false; p.facing = 1;
    for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: S.NAIL.x + U.rand(-8, 8), y0: S.NAIL.y - 8 + U.rand(-6, 6), x1: 0, y1: 0, t: -i * 0.04, dur: 0.35 });
    if (n.depth >= 3) {
      n.done = 2; g.s.sitetown.nails++;
      g.floats.push({ x: S.NAIL.x, y: S.NAIL.y - 40, text: 'Nailed it! 🔨', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Sfx.chime(); Haptics.success();
    } else { g.floats.push({ x: S.NAIL.x, y: S.NAIL.y - 30, text: 'Bonk!', color: '#fff8ee', t: 0, dur: 0.7 }); Sfx.drop(); Haptics.tap(); }
  },
  home(g) {
    if (!this.st) return;
    const st = this.st, S = CFG.SITETOWN;
    st.seat = null; st.slide = null; st.key = null; st.mix = null; st.fade = 0;
    for (const m of this.mixers) m.pour = null;
    const v = this.crane; v.anim = null; v.carry = null; v.out = 0; v.boom = 0;
    st.keeper.x = S.KEEPER_HOME.x; st.keeper.y = S.KEEPER_HOME.y; st.keeper.wave = 0;
  },
  // a save or a push that left the chef in a wall or in the shelves goes back onto the door mat
  rescue(g) {
    const p = g.player, S = CFG.SITETOWN;
    if (this.free(p.x, p.y)) return false;
    p.x = S.EXIT.x; p.y = S.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, S = CFG.SITETOWN, p = g.player;
    st.fade = Math.max(0, st.fade - dt);
    st.toolbox = Math.max(0, st.toolbox - dt); st.hat = Math.max(0, st.hat - dt); st.shake = Math.max(0, st.shake - dt);
    st.slideCd = Math.max(0, st.slideCd - dt);
    for (const m of this.mixers) { m.drum += dt * (m.pour ? 14 : g.driving && g.vehicle === m ? 3.5 : 0.8); if (m.pour) this.stepPour(g, m, dt); }
    this.stepCrane(g, dt);
    for (const q of st.puddles) q.t += dt; st.puddles = st.puddles.filter((q) => q.t < S.PUDDLE);
    if (g.area === 'site') this.updateSite(g, dt);
    else { if (st.seat) st.seat = null; if (st.slide) st.slide = null; }
    if (g.area === 'hardware') this.updateStore(g, dt);
    else { st.key = null; st.mix = null; }
  },
  updateSite(g, dt) {
    const st = this.st, S = CFG.SITETOWN, p = g.player, t = g.time;
    // the chimney puffs
    st.smokeT -= dt; if (st.smokeT <= 0) { st.smokeT = 0.5; st.smoke.push({ x: S.FACTORY.CHIMNEY.x, y: S.FACTORY.CHIMNEY.y - 60, t: 0, dx: U.rand(-6, 10) }); }
    for (const s of st.smoke) { s.t += dt; s.y -= 22 * dt; s.x += s.dx * dt; } st.smoke = st.smoke.filter((s) => s.t < 2.2);
    // seated at the picnic table: stay put
    if (st.seat) { st.seat.t += dt; p.x = S.SEAT.x; p.y = S.SEAT.y; p.moving = false; }
    // the slide: walk onto the ladder and whoosh down to the bottom
    const SL = S.SLIDE;
    if (st.slide) {
      const s = st.slide; s.t += dt; const k = Math.min(1, s.t / SL.dur), ex = U.lerp(SL.top.x, SL.bottom.x, k), ey = U.lerp(SL.top.y, SL.bottom.y + 24, k * k);
      if (U.dist(p.x, p.y, s.px, s.py) > 40) st.slide = null;   // moved by something else (a push, a rescue): let go
      else { p.x = ex; p.y = ey; p.moving = true; p.bob += dt * 14; s.px = ex; s.py = ey; if (k >= 1) { st.slide = null; st.slideCd = 1.2; p.moving = false; } }
    } else if (this.onFoot(g) && st.slideCd <= 0 && U.dist(p.x, p.y, SL.top.x, SL.top.y) < 16) {
      st.slide = { t: 0, px: p.x, py: p.y }; g.s.sitetown.slides++;
      g.floats.push({ x: SL.top.x, y: SL.top.y - 40, text: 'Wheee!', color: '#ffe08a', t: 0, dur: 1.2, big: true });
      Sfx.pickup(); Haptics.tap();
    }
    // the dog in its garden: potters about, barks when you pass by
    const d = st.dog, D = S.DOG;
    d.wag += dt * 10; d.happy = Math.max(0, d.happy - dt); d.timer -= dt; d.barkT -= dt;
    const near = U.dist(p.x, p.y, d.x, d.y) < 120 && !g.onTrain && !g.travel;
    if (near) {
      d.target = null; d.moving = false; d.facing = p.x < d.x ? -1 : 1; d.happy = 0.5; d.wag += dt * 14;
      if (d.barkT <= 0) { d.barkT = 1.6; g.floats.push({ x: d.x, y: d.y - 40, text: U.pick(['Woof!', 'Woof woof!', 'Arf!']), color: '#2b1d14', t: 0, dur: 1.1, big: true }); }
    } else {
      if (!d.target || d.timer <= 0) { d.target = { x: U.rand(D.x0 + 12, D.x1 - 12), y: U.rand(D.y0 + 10, D.y1 - 8) }; d.timer = U.rand(3, 6); }
      if (U.moveToward(d, d.target.x, d.target.y, 34, dt)) { d.moving = false; d.target = null; d.timer = U.rand(2, 4); } else { d.bob += dt * 10; if (d.target) d.facing = d.target.x < d.x ? -1 : 1; }
    }
    // the ducks paddle slow circles on their ponds
    for (const [dk, P] of [[st.duck, S.POND], [st.duck2, S.POND2]]) {
      dk.a += dt * 0.35; const nx = P.x + Math.cos(dk.a) * (P.rx - 22), ny = P.y + Math.sin(dk.a) * (P.ry - 14);
      dk.facing = nx < dk.x ? -1 : 1; dk.x = nx; dk.y = ny; dk.quackT -= dt;
      if (U.dist(p.x, p.y, dk.x, dk.y) < 90 && dk.quackT <= 0) { dk.quackT = 3; g.floats.push({ x: dk.x, y: dk.y - 26, text: 'Quack!', color: '#2b1d14', t: 0, dur: 1, big: true }); }
    }
  },
  updateStore(g, dt) {
    const st = this.st, S = CFG.SITETOWN, p = g.player;
    if (!st.key && !st.mix) this.rescue(g);
    if (st.key) {
      st.key.t += dt; p.x = S.KEY_SPOT.x; p.y = S.KEY_SPOT.y; p.moving = false; p.facing = 1;
      if (Math.random() < dt * 30) st.sparks.push({ x: S.KEY.x + U.rand(-6, 6), y: S.KEY.y - 10, vx: U.rand(-40, 40), vy: U.rand(-60, -20), t: 0 });
      if (st.key.t >= S.KEY_T) { st.key = null; g.floats.push({ x: S.KEY.x, y: S.KEY.y - 40, text: 'A shiny new key! 🔑', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Sfx.ding(); Haptics.success(); }
    }
    if (st.mix) {
      st.mix.t += dt; p.x = S.MIX_SPOT.x; p.y = S.MIX_SPOT.y; p.moving = false; p.facing = 1;
      if (st.mix.t >= S.MIX_T) {
        st.mix = null; g.s.sitetown.mixes++;
        g.floats.push({ x: S.MIX.x, y: S.MIX.y - 44, text: '🌈 Splash!', color: '#ff5c8a', t: 0, dur: 1.6, big: true });
        const cols = ['#e4572e', '#f2b134', '#41b883', '#3b7dd8', '#8e5bd1', '#ff8fab'];
        for (let i = 0; i < 10; i++) st.sparks.push({ x: S.MIX.x, y: S.MIX.y - 20, vx: U.rand(-90, 90), vy: U.rand(-120, -40), t: 0, col: cols[i % 6], r: 3 });
        Sfx.chime(); Haptics.success();
      }
    }
    for (const s of st.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 220 * dt; } st.sparks = st.sparks.filter((s) => s.t < 0.7);
    const n = st.nail; n.hit = Math.max(0, n.hit - dt); if (n.done > 0) { n.done -= dt; if (n.done <= 0) { n.done = 0; n.depth = 0; } }
    // the shopkeeper waves when you come close
    const k = st.keeper; k.facing = p.x < k.x ? -1 : 1;
    k.wave = U.dist(p.x, p.y, k.x, k.y) < 110 ? k.wave + dt : 0;
  },
  pads(g) {
    const S = CFG.SITETOWN;
    if (g.area === 'site') return [{ key: 'stShake', label: 'Milkshake', ico: '🥤', pos: S.PADS.shake, price: 3, sub: 'yum!' }];
    if (g.area === 'hardware') return [
      { key: 'stToolbox', label: 'Toy Toolbox', ico: '🧰', pos: S.PADS.toolbox, price: 4, sub: 'carry it!' },
      { key: 'stHardhat', label: 'Hard Hat', ico: '⛑️', pos: S.PADS.hardhat, price: 6, sub: 'wear it!' },
    ];
    return [];
  },
  onPad(g, pad) {
    const st = this.st, p = g.player, S = CFG.SITETOWN;
    if (pad.key === 'stShake') { st.shake = S.WEAR; g.s.sitetown.shakes++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A milkshake! 🥤', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'stToolbox') { st.toolbox = S.WEAR; g.s.sitetown.toolboxes++; g.floats.push({ x: p.x, y: p.y - 60, text: 'Your own toolbox! 🧰', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'stHardhat') { st.hat = S.WEAR; g.s.sitetown.hats++; g.floats.push({ x: p.x, y: p.y - 60, text: 'Safety first! ⛑️', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else return;
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const S = CFG.SITETOWN, st = this.st, p = g.player, s = g.s.sitetown;
    if (g.area === 'site') {
      if (g.travel || g.onTrain || g.ride || g.fishing) return undefined;
      if (g.driving) {
        if (this.inMixer(g)) return { text: g.vehicle.pour ? 'Splosh! Fresh concrete 🪣' : 'Press the big button to pour concrete! 🪣', target: null };
        return this.inCrane(g) ? this.craneHint(g) : undefined;
      }
      if (st.seat) return { text: st.shake > 0 ? 'Mmm, milkshake! 🥤' : 'Enjoy the sunshine! Press the button to stand up', target: null };
      if (st.slide) return { text: 'Wheee! 🛝', target: null };
      const dd = U.dist(p.x, p.y, S.DOOR_OUT.x, S.DOOR_OUT.y);
      if (dd < 70) return { text: 'Go into the hardware store! 🔧', target: dd < 30 ? null : S.DOOR_OUT };
      if (U.dist(p.x, p.y, this.crane.x, this.crane.y) < 110) return { text: 'Drive the crane truck! 🏗️', target: this.crane };
      const m = this.mixers.slice().sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
      if (U.dist(p.x, p.y, m.x, m.y) < 160) return { text: 'Drive the concrete mixer! 🚛', target: m };
      if (U.dist(p.x, p.y, S.SEAT.x, S.SEAT.y) < 70) return { text: s.shakes || g.s.cash < 3 ? 'Sit at the picnic table! 🪑' : 'Buy a milkshake at the diner! 🥤', target: s.shakes || g.s.cash < 3 ? S.SEAT : S.PADS.shake };
      if (U.dist(p.x, p.y, S.SLIDE.top.x, S.SLIDE.top.y) < 70) return { text: 'Climb the slide! 🛝', target: S.SLIDE.top };
      return undefined;
    }
    if (g.area !== 'hardware') return undefined;
    if (st.key) return { text: 'Bzzzzt! Cutting your key 🔑', target: null };
    if (st.mix) return { text: 'Shake shake shake! 🎨', target: null };
    if (st.nail.depth > 0 && st.nail.done <= 0) return { text: `Whack it again! ${3 - st.nail.depth} to go 🔨`, target: null };
    if (!s.nails) return { text: 'Hammer the nail into the board! 🔨', target: S.NAIL_SPOT };
    if (!s.keys) return { text: 'Cut a key on the buzzing machine! 🔑', target: S.KEY_SPOT };
    if (!s.mixes) return { text: 'Shake up some paint! 🎨', target: S.MIX_SPOT };
    if (!s.hats && g.s.cash + (g.s.padPaid.stHardhat || 0) >= 6) return { text: 'Get a hard hat! ⛑️', target: S.PADS.hardhat };
    if (!s.toolboxes && g.s.cash + (g.s.padPaid.stToolbox || 0) >= 4) return { text: 'Get a toy toolbox! 🧰', target: S.PADS.toolbox };
    if (st.hat > 0) return { text: 'Looking safe! ⛑️', target: null };
    return { text: 'Nice tools! 🔧', target: null };
  },
  bgKey(g) { return 'st1'; },

  // ---------- the new districts, static ----------
  paintAfter(r, g, area) { if (area === 'site') this.paintStreets(r, g); },
  grass(ctx, x0, y0, x1, y1) {
    ctx.fillStyle = '#79b85e'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < ((x1 - x0) * (y1 - y0)) / 2600; i++) { const x = x0 + ((i * 193) % (x1 - x0)), y = y0 + ((i * 101) % (y1 - y0)); ctx.beginPath(); ctx.ellipse(x, y, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  road(ctx, b, vert) {
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(b.x0 - 16, b.y0 - (vert ? 0 : 16), b.x1 - b.x0 + 32, b.y1 - b.y0 + (vert ? 0 : 32));
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    if (vert) for (let y = b.y0; y < b.y1; y += 40) { ctx.beginPath(); ctx.moveTo(b.x0 - 16, y + 0.5); ctx.lineTo(b.x0, y + 0.5); ctx.moveTo(b.x1, y + 0.5); ctx.lineTo(b.x1 + 16, y + 0.5); ctx.stroke(); }
    else for (let x = b.x0; x < b.x1; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, b.y0 - 16); ctx.lineTo(x + 0.5, b.y0); ctx.moveTo(x + 0.5, b.y1); ctx.lineTo(x + 0.5, b.y1 + 16); ctx.stroke(); }
    ctx.fillStyle = '#5a5d63'; ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    ctx.fillStyle = '#f2c94c';
    if (vert) for (let y = b.y0 + 10; y < b.y1 - 10; y += 40) ctx.fillRect((b.x0 + b.x1) / 2 - 2, y, 4, 20);
    else for (let x = b.x0 + 10; x < b.x1 - 10; x += 40) ctx.fillRect(x, (b.y0 + b.y1) / 2 - 2, 20, 4);
  },
  tree(ctx, x, y, big) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 4, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a4f2a'; ctx.fillRect(x - 5, y - 26, 10, 30);
  },
  canopy(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.arc(x + 4, y - 28, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y - 34, 22, 0, Math.PI * 2); ctx.arc(x - 16, y - 24, 15, 0, Math.PI * 2); ctx.arc(x + 16, y - 24, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 6, y - 40, 9, 0, Math.PI * 2); ctx.fill();
  },
  lamp(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 2, y - 44, 4, 46); ctx.fillRect(x - 6, y - 2, 12, 4);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 48, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,224,138,0.25)'; ctx.beginPath(); ctx.arc(x, y - 48, 11, 0, Math.PI * 2); ctx.fill();
  },
  bed(ctx, x, y) {
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 30, y - 12, 60, 24, 8); ctx.fill();
    const cols = ['#e4572e', '#ffd166', '#ff8fab', '#8e5bd1', '#fff'];
    for (let i = 0; i < 8; i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x - 24 + i * 7, y + (i % 2 ? 4 : -4), 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x - 24 + i * 7, y + (i % 2 ? 4 : -4), 1.3, 0, Math.PI * 2); ctx.fill(); }
  },
  house(ctx, r, h) {
    const w = h.x1 - h.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(h.x0 + 6, h.y0 + 8, w, h.y1 - h.y0);
    ctx.fillStyle = h.wall; ctx.fillRect(h.x0, h.y0 + 30, w, h.y1 - h.y0 - 30);
    ctx.fillStyle = h.roof; ctx.beginPath(); ctx.moveTo(h.x0 - 6, h.y0 + 32); ctx.lineTo(h.x0 + w / 2, h.y0 - 4); ctx.lineTo(h.x1 + 6, h.y0 + 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(h.x0 + 10, h.y0 + 16, w - 20, 3);
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(h.x0 + 10, h.y0 + 44, 18, 16); ctx.fillRect(h.x1 - 28, h.y0 + 44, 18, 16);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(h.x0 + 10, h.y0 + 44, 18, 16); ctx.strokeRect(h.x1 - 28, h.y0 + 44, 18, 16);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(h.x0 + w / 2 - 9, h.y1 - 30, 18, 30); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(h.x0 + w / 2 + 5, h.y1 - 15, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(h.x1 - 22, h.y0 + 2, 8, 18);   // chimney
  },
  paintStreets(r, g) {
    const ctx = r.ctx, S = CFG.SITETOWN, E = S.EAST, So = S.SOUTH;
    // grass over both strips (the core painted dirt), the railway re-drawn across the top of the east strip
    this.grass(ctx, E.x0 - 16, E.y0, E.x1, E.y1);
    this.grass(ctx, So.x0, So.y0, So.x1, So.y1);
    { const ty = CFG.SITE.STATION.trackY; ctx.fillStyle = '#8d7b63'; ctx.fillRect(E.x0 - 16, ty - 18, E.x1 - E.x0 + 16, 36); ctx.fillStyle = '#6b4a2b'; for (let x = E.x0 - 16; x < E.x1; x += 22) ctx.fillRect(x, ty - 12, 10, 24); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(E.x0 - 16, ty - 8, E.x1 - E.x0 + 16, 4); ctx.fillRect(E.x0 - 16, ty + 4, E.x1 - E.x0 + 16, 4); }
    // the gravel road runs on into the strip (re-painted over the grass)
    { const R = CFG.SITE.ROAD; ctx.fillStyle = '#8c8c86'; ctx.fillRect(E.x0 - 16, R.y0, E.x1 - E.x0 + 16, R.y1 - R.y0); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 120; i++) ctx.fillRect(E.x0 - 16 + ((i * 97) % (E.x1 - E.x0 + 16)), R.y0 + ((i * 53) % (R.y1 - R.y0)), 3, 2); }
    // streets with sidewalks, dashes and crosswalks
    this.road(ctx, S.SITE_ROAD, true);
    this.road(ctx, S.SOUTH_ST, false);
    ctx.fillStyle = '#5a5d63'; ctx.fillRect(S.SITE_ROAD.x0, S.SOUTH_ST.y0 - 16, S.SITE_ROAD.x1 - S.SITE_ROAD.x0, S.SOUTH_ST.y1 - S.SOUTH_ST.y0 + 32);   // the junction
    ctx.fillStyle = '#fff8ee';
    for (const c of S.CROSSINGS) { if (c.x1 - c.x0 > c.y1 - c.y0) for (let x = c.x0 + 4; x < c.x1 - 4; x += 12) ctx.fillRect(x, c.y0, 7, c.y1 - c.y0); else for (let y = c.y0 + 4; y < c.y1 - 4; y += 12) ctx.fillRect(c.x0, y, c.x1 - c.x0, 7); }
    // ---- the welcome sign on two posts by the gravel road
    const G = S.SIGN;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(G.x - 110, G.y - 8, 220, 10);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(G.x - 90, G.y - 30, 8, 36); ctx.fillRect(G.x + 82, G.y - 30, 8, 36);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, G.x - 106, G.y - 64, 212, 44, 8); ctx.fill();
    ctx.fillStyle = '#f2b705'; U.roundRect(ctx, G.x - 102, G.y - 60, 204, 36, 7); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏗️ WELCOME TO', G.x, G.y - 50); ctx.fillText('CONSTRUCTION TOWN', G.x, G.y - 34);
    // ---- the hardware store: brick box, big window, striped awning, door and a sign
    const St = S.STORE, sw = St.x1 - St.x0;
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(St.x0 - 16, St.y1, sw + 32, 26);   // its own sidewalk
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(St.x0 + 6, St.y0 + 8, sw, St.y1 - St.y0);
    ctx.fillStyle = '#c96a3a'; ctx.fillRect(St.x0, St.y0, sw, St.y1 - St.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; for (let yy = St.y0 + 6; yy < St.y1; yy += 12) { ctx.fillRect(St.x0, yy, sw, 1.5); const off = ((yy - St.y0) / 12) % 2 ? 14 : 0; for (let xx = St.x0 + off; xx < St.x1; xx += 28) ctx.fillRect(xx, yy, 1.5, 12); }
    ctx.fillStyle = '#8d4a26'; ctx.fillRect(St.x0, St.y0, sw, 12);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(St.x0 + 20, St.y0 + 60, 90, 60); ctx.fillRect(St.x1 - 110, St.y0 + 60, 90, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(St.x0 + 26, St.y0 + 66, 14, 48); ctx.fillRect(St.x1 - 104, St.y0 + 66, 14, 48);
    // paint cans and a hammer in the windows
    ['#e4572e', '#3b7dd8', '#41b883'].forEach((c, i) => { ctx.fillStyle = c; U.roundRect(ctx, St.x0 + 48 + i * 18, St.y0 + 92, 14, 20, 3); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(St.x0 + 48 + i * 18, St.y0 + 90, 14, 4); });
    ctx.font = r.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔨', St.x1 - 65, St.y0 + 92);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(St.x0 + 10 + i * (sw - 20) / 9, St.y0 + 40, (sw - 20) / 9 + 1, 16); }   // awning
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(St.x0 + 10, St.y0 + 56, sw - 20, 4);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, St.x0 + sw / 2 - 90, St.y0 + 14, 180, 24, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(13); ctx.fillText('🔧 HARDWARE STORE', St.x0 + sw / 2, St.y0 + 26);
    const dx = St.door.x; ctx.fillStyle = '#5b3a1a'; ctx.fillRect(dx - 18, St.y1 - 40, 36, 40); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(dx - 13, St.y1 - 34, 26, 16); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(dx + 11, St.y1 - 14, 2.5, 0, Math.PI * 2); ctx.fill();
    const D = S.DOOR_OUT; for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#fff8ee', '#3b7dd8'][i]; ctx.fillRect(D.x - 15 + i * 10, D.y - 6, 10, 12); } ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 12);
    // ---- mailbox
    const M = S.MAILBOX; ctx.fillStyle = '#5c6670'; ctx.fillRect(M.x - 2, M.y - 10, 4, 16); ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, M.x - 9, M.y - 24, 18, 16, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(M.x - 5, M.y - 20, 10, 3);
    // ---- three little houses with picket-fenced gardens
    for (const h of S.HOUSES) {
      this.house(ctx, r, h);
      const gy0 = h.y1 + 10, gy1 = gy0 + S.GARDEN_H;
      ctx.fillStyle = '#8fd16a'; ctx.fillRect(h.x0, gy0, h.x1 - h.x0, gy1 - gy0);
      ctx.fillStyle = '#fff8ee'; for (let x = h.x0; x <= h.x1 - 4; x += 10) { ctx.fillRect(x, gy1 - 10, 4, 12); ctx.fillRect(x, gy0 - 4, 4, 12); } for (let y = gy0; y < gy1; y += 10) { ctx.fillRect(h.x0 - 2, y, 4, 6); ctx.fillRect(h.x1 - 2, y, 4, 6); }
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(h.x0, gy1 - 4, h.x1 - h.x0, 2); ctx.fillRect(h.x0, gy0 + 2, h.x1 - h.x0, 2);
      const cols = ['#e4572e', '#ffd166', '#ff8fab', '#8e5bd1'];
      for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(h.x0 + 10 + i * 12, gy0 + 16 + (i % 2) * 6, 3.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#c9a46a'; ctx.fillRect(h.x0 + (h.x1 - h.x0) / 2 - 8, h.y1, 16, 10);   // step
    }
    { const D2 = S.DOG; ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, D2.x1 - 30, D2.y0 - 2, 26, 22, 4); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(D2.x1 - 17, D2.y0 + 10, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(D2.x1 - 32, D2.y0 - 6, 30, 5); }   // kennel
    // ---- the park: path, pond, benches
    const P = S.PARK, Pd = S.POND;
    ctx.fillStyle = '#8fd16a'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 24); ctx.fill();
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(P.x0 - 16, P.y0 + 60, 50, 20);   // path in from the sidewalk
    this.pond(ctx, Pd);
    for (const [bx, by] of [[P.x0 + 40, P.y0 + 30], [P.x1 - 50, P.y1 - 60]]) { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(bx - 20, by - 6, 40, 8); ctx.fillRect(bx - 20, by + 4, 40, 6); ctx.fillStyle = '#4a2d12'; ctx.fillRect(bx - 16, by + 10, 4, 8); ctx.fillRect(bx + 12, by + 10, 4, 8); }
    // ---- the playground slide: ladder at the top, a yellow chute running south
    const SL = S.SLIDE;
    ctx.fillStyle = '#c9a46a'; U.roundRect(ctx, SL.top.x - 40, SL.top.y - 30, 80, SL.bottom.y - SL.top.y + 70, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, SL.top.x - 12, SL.top.y + 4, 30, SL.bottom.y - SL.top.y + 24, 8); ctx.fill();
    ctx.fillStyle = '#f2b705'; U.roundRect(ctx, SL.top.x - 16, SL.top.y - 2, 32, SL.bottom.y - SL.top.y + 26, 8); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(SL.top.x - 9, SL.top.y + 6, 18, SL.bottom.y - SL.top.y + 12);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(SL.top.x - 16, SL.top.y - 2, 5, SL.bottom.y - SL.top.y + 26); ctx.fillRect(SL.top.x + 11, SL.top.y - 2, 5, SL.bottom.y - SL.top.y + 26);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(SL.top.x - 14, SL.top.y - 28, 4, 30); ctx.fillRect(SL.top.x + 10, SL.top.y - 28, 4, 30); for (let k = 0; k < 4; k++) ctx.fillRect(SL.top.x - 14, SL.top.y - 24 + k * 7, 28, 3);
    ctx.font = r.font(12); ctx.fillStyle = '#2b1d14'; ctx.textAlign = 'center'; ctx.fillText('🛝', SL.top.x + 30, SL.top.y - 14);
    // ---- the bus shelter (just art): a glass box with a roof and a bench, a stop sign
    const Bs = S.BUS;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Bs.x - 20, Bs.y - 10, 48, 38);
    ctx.fillStyle = 'rgba(191,227,255,0.55)'; ctx.fillRect(Bs.x - 22, Bs.y - 30, 44, 50);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Bs.x - 16, Bs.y - 2, 32, 7);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(Bs.x - 24, Bs.y - 32, 4, 54); ctx.fillRect(Bs.x + 20, Bs.y - 32, 4, 54); ctx.fillRect(Bs.x - 26, Bs.y - 36, 52, 6);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(Bs.x - 26, Bs.y - 36, 52, 6);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(Bs.x + 30, Bs.y - 30, 3, 50); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, Bs.x + 22, Bs.y - 46, 20, 16, 4); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.fillText('🚌', Bs.x + 32, Bs.y - 38);
    // ---- the water tower's concrete pad (the tower itself is drawn with the entities so you can walk round it)
    const Tw = S.TOWER; ctx.fillStyle = '#b9b5ad'; U.roundRect(ctx, Tw.x - 30, Tw.y - 22, 60, 44, 6); ctx.fill();
    // ---- the concrete factory yard: concrete slab, fence, sign, conveyor base, the chute's spill
    this.paintFactory(r, g);
    // ---- the south strip: the dirt track, the diner, the park with the second pond
    this.paintTrack(r, g);
    this.paintDiner(r, g);
    { const P2 = S.POND2; ctx.fillStyle = '#8fd16a'; U.roundRect(ctx, 3700, 1030, 290, 260, 24); ctx.fill(); this.pond(ctx, P2); ctx.fillStyle = '#d2cbbb'; ctx.fillRect(3820, 1012, 24, 30); }
    // ---- lamp posts, flower beds and tree trunks (the canopies are drawn over everything)
    for (const [x, y] of S.LAMPS) this.lamp(ctx, x, y);
    for (const [x, y] of S.BEDS) this.bed(ctx, x, y);
    for (const [x, y] of S.TREES) this.tree(ctx, x, y);
  },
  pond(ctx, P) {
    ctx.fillStyle = '#c9a46a'; ctx.beginPath(); ctx.ellipse(P.x, P.y + 2, P.rx + 8, P.ry + 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5aa9e6'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8fd0ff'; ctx.beginPath(); ctx.ellipse(P.x - P.rx * 0.2, P.y - P.ry * 0.25, P.rx * 0.5, P.ry * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#41b883'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(P.x + P.rx * 0.5 - i * 10, P.y + P.ry * 0.4 + (i % 2) * 6, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); }   // lily pads
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(P.x + P.rx * 0.5, P.y + P.ry * 0.4 - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9c0a8'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(P.x + Math.cos(i * 1.3) * (P.rx + 6), P.y + Math.sin(i * 1.3) * (P.ry + 5), 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }   // stones
  },
  paintFactory(r, g) {
    const ctx = r.ctx, F = CFG.SITETOWN.FACTORY;
    ctx.fillStyle = '#b9b5ad'; ctx.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let x = F.x0; x < F.x1; x += 48) { ctx.beginPath(); ctx.moveTo(x + 0.5, F.y0); ctx.lineTo(x + 0.5, F.y1); ctx.stroke(); }
    for (let y = F.y0; y < F.y1; y += 48) { ctx.beginPath(); ctx.moveTo(F.x0, y + 0.5); ctx.lineTo(F.x1, y + 0.5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 60; i++) ctx.fillRect(F.x0 + ((i * 97) % (F.x1 - F.x0)), F.y0 + ((i * 53) % (F.y1 - F.y0)), 4, 3);
    // chain-link fence along the top and right, with a wide gate to the street on the left
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2;
    const fence = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); const L = Math.hypot(x1 - x0, y1 - y0); for (let k = 0; k <= L; k += 20) { const x = x0 + (x1 - x0) * k / L, y = y0 + (y1 - y0) * k / L; ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 2, y - 10, 4, 12); } };
    fence(F.x0 + 2, F.y0 + 4, F.x1, F.y0 + 4); fence(F.x0 + 2, F.y0 + 4, F.x0 + 2, F.y0 + 120); fence(F.x0 + 2, F.y1 - 30, F.x0 + 2, F.y1);
    // parking bays for the mixers
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    for (const m of CFG.SITETOWN.MIXERS) ctx.strokeRect(m.x - 34, m.y - 62, 68, 124); ctx.setLineDash([]);
    // a spill of old concrete under the chute and some tyre marks
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.ellipse(F.CHUTE.x, F.CHUTE.y + 18, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(F.x0 + 10, F.y1 - 60); ctx.quadraticCurveTo(F.x0 + 120, F.y1 - 80, F.x0 + 110, F.y0 + 140); ctx.stroke();
  },
  paintTrack(r, g) {
    const ctx = r.ctx, T = CFG.SITETOWN.TRACK;
    ctx.fillStyle = '#a07a4a'; ctx.beginPath(); ctx.ellipse(T.x, T.y, T.rx, T.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8fd16a'; ctx.beginPath(); ctx.ellipse(T.x, T.y, T.rxi, T.ryi, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(T.x, T.y, (T.rx + T.rxi) / 2, (T.ry + T.ryi) / 2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let i = 0; i < 60; i++) { const a = i * 0.21, rr = T.rxi + 12 + (i % 5) * 18; ctx.beginPath(); ctx.ellipse(T.x + Math.cos(a) * rr, T.y + Math.sin(a) * rr * T.ry / T.rx, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
    // tyre stacks and hay bales round the outside (art), a chequered start line and a flag in the infield
    for (let i = 0; i < 14; i++) { const a = i * (Math.PI * 2 / 14) + 0.2, x = T.x + Math.cos(a) * (T.rx + 14), y = T.y + Math.sin(a) * (T.ry + 12); if (i % 2) { ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.ellipse(x, y, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 4, 2, 0, 0, Math.PI * 2); ctx.fill(); } else { ctx.fillStyle = '#e8c56a'; U.roundRect(ctx, x - 10, y - 6, 20, 12, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 10, y - 1, 20, 2); } }
    for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) { ctx.fillStyle = (i + k) % 2 ? '#fff' : '#2b1d14'; ctx.fillRect(T.x + T.rxi + 2 + i * 14, T.y - 8 + k * 8, 14, 8); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(T.x - 2, T.y - 56, 4, 60); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(T.x + 2, T.y - 56); ctx.lineTo(T.x + 30, T.y - 48); ctx.lineTo(T.x + 2, T.y - 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x - 60, T.y - 28, 120, 22, 5); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏁 DIRT TRACK', T.x, T.y - 17);
  },
  paintDiner(r, g) {
    const ctx = r.ctx, S = CFG.SITETOWN, D = S.DINER, w = D.x1 - D.x0;
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(D.x0 - 20, D.y1, w + 40, 24);   // forecourt
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(D.x0 + 6, D.y0 + 8, w, D.y1 - D.y0);
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, D.x0, D.y0, w, D.y1 - D.y0, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = D.y0 + 8; y < D.y1; y += 10) ctx.fillRect(D.x0 + 4, y, w - 8, 2);   // chrome ribbing
    ctx.fillStyle = '#e4572e'; ctx.fillRect(D.x0, D.y0 + 30, w, 8); ctx.fillRect(D.x0, D.y1 - 26, w, 8);
    ctx.fillStyle = '#bfe3ff'; for (let i = 0; i < 4; i++) { if (i === 2) continue; U.roundRect(ctx, D.x0 + 20 + i * 62, D.y0 + 52, 46, 44, 5); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 4; i++) { if (i === 2) continue; ctx.fillRect(D.x0 + 26 + i * 62, D.y0 + 58, 8, 32); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(D.door.x - 18, D.y1 - 44, 36, 44); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(D.door.x - 12, D.y1 - 38, 24, 20);
    // the milkshake window at the right end
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, D.x1 - 92, D.y0 + 100, 84, 18, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥤 MILKSHAKES $3', D.x1 - 50, D.y0 + 109);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, D.x1 - 92, D.y1 - 20, 84, 14, 3); ctx.fill();   // the serving ledge
    // the roof sign's box (the neon tubes flicker in the dynamic pass)
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, D.x0 + w / 2 - 70, D.y0 - 26, 140, 44, 8); ctx.fill();
    // the picnic table: top (solid) and two benches
    const T = S.TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x - 32, T.y - 24, 70, 54);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(T.x - 36, T.y - 28, 72, 10); ctx.fillRect(T.x - 36, T.y + 20, 72, 10);
    ctx.fillStyle = '#c99a5f'; U.roundRect(ctx, T.x - 32, T.y - 11, 64, 22, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = T.x - 26; x < T.x + 30; x += 12) ctx.fillRect(x, T.y - 9, 2, 18);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(T.x - 12, T.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(T.x + 12, T.y, 5, 0, Math.PI * 2); ctx.fill();   // ketchup and mustard
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(T.x - 60, T.y - 30, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x - 62, T.y - 21, 4, 22);   // a parasol-ish umbrella stub (bin)
  },

  // ---------- the hardware store interior, static ----------
  paint: { hardware(r, g) { SiteTownExt.paintStore(r, g); } },
  paintStore(r, g) {
    const ctx = r.ctx, S = CFG.SITETOWN, W = S.WORLD, R = S.ROOM, w = S.WALL;
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, S.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - S.BACK_TOP);
    // a grey concrete floor with painted aisle stripes
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let y = R.y0; y < R.y1; y += 32) for (let x = R.x0 + ((y / 32) % 2) * 16; x < R.x1; x += 32) ctx.fillRect(x, y, 30, 30);
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(R.x0, S.AISLES[0].y0 - 12, R.x1 - R.x0, 3); ctx.fillRect(R.x0, S.AISLES[1].y1 + 10, R.x1 - R.x0, 3);
    // walls: a tall back wall of pegboard-cream, orange cornice, steel side and bottom walls
    ctx.fillStyle = '#f6e7cf'; ctx.fillRect(R.x0 - w, S.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - S.BACK_TOP);
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(R.x0 - w, S.BACK_TOP, R.x1 - R.x0 + 2 * w, 8); ctx.fillStyle = '#2b1d14'; ctx.fillRect(R.x0 - w, S.BACK_TOP + 8, R.x1 - R.x0 + 2 * w, 2);
    ctx.fillStyle = '#8c97a3'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x0 - w, R.y0 - 4, R.x1 - R.x0 + 2 * w, 4);
    // the paint-can wall: three shelves of colourful cans
    const Ps = S.PAINT_SHELF, cols = ['#e4572e', '#f2b134', '#41b883', '#3b7dd8', '#8e5bd1', '#ff8fab', '#4dd0e1', '#ffd166', '#2b1d14', '#fff'];
    for (let row = 0; row < 3; row++) {
      const sy = Ps.y0 + 20 + row * 22;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Ps.x0, sy, Ps.x1 - Ps.x0, 4); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Ps.x0, sy + 4, Ps.x1 - Ps.x0, 2);
      for (let i = 0; i < 12; i++) { const x = Ps.x0 + 6 + i * 18, c = cols[(i + row * 3) % cols.length]; ctx.fillStyle = c; U.roundRect(ctx, x, sy - 15, 14, 15, 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 1, sy - 17, 16, 3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 3, sy - 11, 8, 5); }
    }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, Ps.x0 + 60, Ps.y0 - 10, 100, 14, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎨 PAINT', Ps.x0 + 110, Ps.y0 - 3);
    // the pegboard of tools
    const Pb = S.PEGBOARD;
    ctx.fillStyle = '#e8d2b0'; ctx.fillRect(Pb.x0, Pb.y0, Pb.x1 - Pb.x0, Pb.y1 - Pb.y0); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = Pb.y0 + 6; y < Pb.y1; y += 10) for (let x = Pb.x0 + 6; x < Pb.x1; x += 10) ctx.fillRect(x, y, 2, 2);
    ctx.font = r.font(18); ctx.fillStyle = '#2b1d14';
    ['🔨', '🪚', '🔧', '🪛', '🪜', '📏', '🧲', '🔦'].forEach((t, i) => ctx.fillText(t, Pb.x0 + 16 + (i % 4) * 44, Pb.y0 + 18 + Math.floor(i / 4) * 30));
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, Pb.x0 + 40, Pb.y0 - 10, 100, 14, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🔧 TOOLS', Pb.x0 + 90, Pb.y0 - 3);
    // the key-cutting machine on its counter
    const Kc = S.KEY_COUNTER, K = S.KEY;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Kc.x0, Kc.y0, Kc.x1 - Kc.x0, Kc.y1 - Kc.y0, 4); ctx.fill(); ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, Kc.x0, Kc.y0 - 4, Kc.x1 - Kc.x0, 12, 4); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, K.x - 20, K.y - 30, 40, 28, 5); ctx.fill(); ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, K.x - 16, K.y - 26, 32, 10, 3); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(K.x + 12, K.y - 10, 4, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Kc.x0 + 10 + i * 10, Kc.y0 - 12, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(Kc.x0 + 9 + i * 10, Kc.y0 - 10, 2, 7); }   // keys on a ring
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.fillText('🔑 KEYS CUT', K.x, Kc.y1 - 6);
    // the paint shaker (its can rattles live)
    const Mx = S.MIX_BOX;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Mx.x0 + 3, Mx.y0 + 4, Mx.x1 - Mx.x0, Mx.y1 - Mx.y0);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Mx.x0, Mx.y0, Mx.x1 - Mx.x0, Mx.y1 - Mx.y0, 6); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, Mx.x0 + 4, Mx.y0 + 4, Mx.x1 - Mx.x0 - 8, 10, 3); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Mx.x1 - 10, Mx.y1 - 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.fillText('SHAKER', (Mx.x0 + Mx.x1) / 2, Mx.y1 - 8);
    // the aisle shelves
    for (const a of S.AISLES) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(a.x0 + 3, a.y0 + 4, a.x1 - a.x0, a.y1 - a.y0);
      ctx.fillStyle = '#8c97a3'; U.roundRect(ctx, a.x0, a.y0 - 6, a.x1 - a.x0, a.y1 - a.y0 + 6, 4); ctx.fill();
      ctx.fillStyle = '#5c6670'; ctx.fillRect(a.x0, a.y1 - 4, a.x1 - a.x0, 4);
      if (a.kind === 'paint') for (let i = 0; i < 11; i++) { const x = a.x0 + 6 + i * 17; ctx.fillStyle = cols[i % cols.length]; U.roundRect(ctx, x, a.y0 - 14, 13, 16, 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 1, a.y0 - 16, 15, 3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 3, a.y0 - 10, 7, 4); }
      else { ctx.font = r.font(14); ctx.fillStyle = '#2b1d14'; ['🔩', '🧰', '🪣', '🔦', '🧲', '🪚', '🔧', '📏', '🪛'].forEach((t, i) => ctx.fillText(t, a.x0 + 14 + i * 21, a.y0 + 4)); }
    }
    // the workbench with the board (the nail is live)
    const B = S.BENCH;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(B.x0 + 3, B.y0 + 4, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 4); ctx.fill(); ctx.fillStyle = '#b5773a'; U.roundRect(ctx, B.x0 + 2, B.y0 - 4, B.x1 - B.x0 - 4, 10, 3); ctx.fill();
    ctx.fillStyle = '#c99a5f'; U.roundRect(ctx, B.x0 + 14, B.y0 + 4, B.x1 - B.x0 - 28, 20, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(B.x0 + 18, B.y0 + 12, B.x1 - B.x0 - 36, 2);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.fillText('🔨 HAMMER TIME', (B.x0 + B.x1) / 2, B.y1 - 6);
    // the shop counter with a till and a jar of lollies
    const C = S.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#ff7a1a'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = C.x0 + 8; x < C.x1 - 6; x += 16) ctx.fillRect(x, C.y0 + 12, 8, C.y1 - C.y0 - 16);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0 - 2, C.y0 - 8, C.x1 - C.x0 + 4, 18, 6); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, C.x1 - 40, C.y0 - 20, 28, 18, 4); ctx.fill(); ctx.fillStyle = '#8ef0a0'; ctx.fillRect(C.x1 - 36, C.y0 - 17, 20, 6);
    ctx.font = r.font(12); ctx.fillStyle = '#2b1d14'; ctx.fillText('🧰', C.x0 + 20, C.y0 - 8);
    // the pads' wares: a toolbox and a hard hat on little stands
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, S.PADS.toolbox.x - 16, S.PADS.toolbox.y - 50, 32, 8, 3); ctx.fill(); U.roundRect(ctx, S.PADS.hardhat.x - 16, S.PADS.hardhat.y - 50, 32, 8, 3); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, S.PADS.toolbox.x - 12, S.PADS.toolbox.y - 66, 24, 16, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(S.PADS.toolbox.x - 5, S.PADS.toolbox.y - 70, 10, 4);
    ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(S.PADS.hardhat.x, S.PADS.hardhat.y - 58, 12, Math.PI, 0); ctx.fill(); ctx.fillRect(S.PADS.hardhat.x - 15, S.PADS.hardhat.y - 59, 30, 4);
    // the plant, the door in the bottom wall, its mat and the name plate
    const P = S.PLANT;
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 14, 12, 0, Math.PI * 2); ctx.arc(P.x - 10, P.y - 8, 8, 0, Math.PI * 2); ctx.arc(P.x + 10, P.y - 8, 8, 0, Math.PI * 2); ctx.fill();
    const E = S.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#fff8ee', '#3b7dd8'][i]; ctx.fillRect(E.x - 21 + i * 14, E.y - 8, 14, 14); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 60, R.y1 + w + 4, 120, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🔧 HARDWARE STORE 🔧', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.SITETOWN.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, S = CFG.SITETOWN, t = g.time;
    if (g.area === 'site') {
      // poured concrete puddles (fade out at the end)
      for (const q of st.puddles) {
        const k = q.grow ? 0.25 + 0.75 * Math.sqrt(Math.min(1, q.t / q.grow)) : Math.min(1, q.t * 4), a = q.t > S.PUDDLE - 2 ? (S.PUDDLE - q.t) / 2 : 1;
        ctx.globalAlpha = a; ctx.fillStyle = '#8a8d93'; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * k, q.r * 0.55 * k, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a3a6ab'; ctx.beginPath(); ctx.ellipse(q.x - q.r * 0.2, q.y - q.r * 0.15, q.r * 0.5 * k, q.r * 0.25 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      // steel beams lying on the ground and the ones set on the half-built house's walls
      for (const b of st.beams) this.drawBeam(ctx, b.x, b.y, b.a, 0, true);
      for (const b of st.frameBeams) this.drawBeam(ctx, b.x, b.y, b.a, b.lev * 6, true);
      // driving the crane truck: the hook's ring on the ground (green when there is something to lift or the house to build)
      if (this.inCrane(g) && !this.crane.anim) {
        const v = this.crane, h = this.hookPos(v), f = v.carry ? this.frameSpot(h.x, h.y) : null, ok = v.carry ? !!f : !!this.liftSource(g);
        if (f) { ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 6); this.drawBeam(ctx, f.x, f.y, f.a, f.lev * 6, false); ctx.globalAlpha = 1; }
        const pr = 1 + Math.sin(t * 5) * 0.08;
        ctx.strokeStyle = ok ? '#41b883' : '#ffe08a'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.ellipse(h.x, h.y, 24 * pr, 12 * pr, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = ok ? 'rgba(65,184,131,0.22)' : 'rgba(255,224,138,0.18)'; ctx.beginPath(); ctx.ellipse(h.x, h.y, 24 * pr, 12 * pr, 0, 0, Math.PI * 2); ctx.fill();
      }
      // the conveyor belt: moving stripes and gravel lumps
      const F = CFG.SITETOWN.FACTORY, B = F.BELT, L = Math.hypot(B.x1 - B.x0, B.y1 - B.y0), ang = Math.atan2(B.y1 - B.y0, B.x1 - B.x0);
      ctx.save(); ctx.translate(B.x0, B.y0); ctx.rotate(ang);
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, -6, -9, L + 12, 18, 6); ctx.fill(); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(0, -6, L, 12);
      ctx.fillStyle = '#6d6d6d'; const off = (t * 40) % 14; for (let k = -14; k < L; k += 14) { const x = k + off; if (x > 0 && x < L - 4) ctx.fillRect(x, -6, 4, 12); }
      ctx.fillStyle = '#9a9a9a'; for (let k = 0; k < 4; k++) { const x = ((t * 40 + k * 18) % L); ctx.beginPath(); ctx.arc(x, -2, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      // the neon DINER sign flickers
      const D = S.DINER, cx = (D.x0 + D.x1) / 2, on = Math.sin(t * 6) > -0.9, pink = on ? '#ff5c8a' : '#8a3550', cyan = Math.sin(t * 2.3) > -0.95 ? '#4dd0e1' : '#2a6a74';
      ctx.font = r.font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = pink; ctx.fillText('DINER', cx, D.y0 - 6);
      ctx.strokeStyle = cyan; ctx.lineWidth = 3; U.roundRect(ctx, cx - 62, D.y0 - 20, 124, 32, 8); ctx.stroke();
      if (on) { ctx.fillStyle = 'rgba(255,92,138,0.15)'; U.roundRect(ctx, cx - 70, D.y0 - 28, 140, 48, 12); ctx.fill(); }
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.fillText(Math.floor(t) % 2 ? '★ OPEN ★' : '☆ OPEN ☆', cx, D.y0 + 14);
      // the ducks
      for (const d of [st.duck, st.duck2]) this.drawDuck(r, d, t);
    } else if (g.area === 'hardware') {
      this.drawOutside(r, g);
      // the key machine buzzes: a spinning wheel and sparks
      const K = S.KEY;
      if (st.key) { ctx.save(); ctx.translate(K.x - 6, K.y - 18); ctx.rotate(t * 30); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(2, -1, 5, 2); } ctx.restore(); ctx.fillStyle = '#ffd166'; ctx.fillRect(K.x + 2, K.y - 17, 10, 3); }
      else { ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(K.x - 6, K.y - 18, 7, 0, Math.PI * 2); ctx.fill(); }
      for (const s of st.sparks) { ctx.fillStyle = s.col || '#ffd166'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r || 1.6, 0, Math.PI * 2); ctx.fill(); }
      // the paint shaker's can rattles while it mixes
      const Mx = S.MIX, sh = st.mix ? Math.sin(t * 60) * 3 : 0, sh2 = st.mix ? Math.cos(t * 47) * 2 : 0;
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, Mx.x - 9 + sh, Mx.y - 34 + sh2, 18, 18, 3); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(Mx.x - 10 + sh, Mx.y - 36 + sh2, 20, 3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(Mx.x - 5 + sh, Mx.y - 29 + sh2, 10, 5);
      if (st.mix) { ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('~ ~ ~', Mx.x, Mx.y - 46 + sh2); }
      // the nail in the board
      const N = S.NAIL, n = st.nail, depth = n.depth * 5;
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(N.x - 1.5, N.y - 18 + depth, 3, 18 - depth); ctx.fillRect(N.x - 4, N.y - 20 + depth, 8, 3);
      if (n.hit > 0) { ctx.fillStyle = '#ffd166'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💥', N.x, N.y - 24 + depth); }
      if (n.done > 0) { ctx.fillStyle = '#41b883'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✅', N.x + 20, N.y - 14); }
    }
  },
  drawDuck(r, d, t) {
    const ctx = r.ctx, f = d.facing, bob = Math.sin(t * 4 + d.a) * 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(d.x, d.y + 4, 14, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.ellipse(d.x, d.y + bob, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(d.x + f * 7, d.y - 6 + bob, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8c42'; ctx.fillRect(d.x + f * 10 + (f < 0 ? -4 : 0), d.y - 7 + bob, 4, 2.5);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(d.x + f * 8, d.y - 7.5 + bob, 1, 0, Math.PI * 2); ctx.fill();
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, S = CFG.SITETOWN;
    if (!g.driving && !g.onTrain && !g.travel) {
      if (st.hat > 0) items.push({ y: p.y + 1, draw: () => this.drawHardHat(r, g) });
      if (st.toolbox > 0) items.push({ y: p.y + 1, draw: () => this.drawToolbox(r, g) });
      if (st.shake > 0) items.push({ y: p.y + 1, draw: () => this.drawShake(r, g) });
    }
    if (g.area === 'site') {
      for (const v of this.mixers) items.push({ y: v.y + 12, draw: () => { r.drawSiteVehicle(g, v, 30); this.drawStream(r, g, v); } });
      items.push({ y: this.crane.y + 12, draw: () => this.drawCrane(r, g, this.crane) });
      items.push({ y: S.BEAM_PILE_BOX.y1, draw: () => this.drawBeamPile(r, g) });
      items.push({ y: st.dog.y, draw: () => r.drawDog(st.dog, g) });
      items.push({ y: S.TOWER.y + 2, draw: () => this.drawTower(r, g) });
      items.push({ y: S.FACTORY.SILO_BOX.y1 + 1, draw: () => this.drawSilos(r, g) });
      items.push({ y: S.FACTORY.PLANT.y1 + 1, draw: () => this.drawPlant(r, g) });
      items.push({ y: S.FACTORY.PILE_BOX.y1, draw: () => this.drawPile(r, g) });
    } else if (g.area === 'hardware') {
      items.push({ y: st.keeper.y, draw: () => this.drawKeeper(r, g) });
    }
  },
  // a red steel I-beam seen from above, `h` px off the ground
  drawBeam(ctx, x, y, a, h, shadow) {
    const L = CFG.SITETOWN.BEAM_LEN;
    if (shadow) { ctx.save(); ctx.translate(x + 3, y + 4); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, -L / 2, -6, L, 12, 3); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.translate(x, y - (h || 0)); ctx.rotate(a);
    ctx.fillStyle = '#c7442a'; U.roundRect(ctx, -L / 2, -7, L, 14, 2); ctx.fill();
    ctx.fillStyle = '#ef6a45'; ctx.fillRect(-L / 2, -7, L, 4);
    ctx.fillStyle = '#9a3220'; ctx.fillRect(-L / 2, 3, L, 4); ctx.fillRect(-L / 2, -1, L, 2);
    ctx.fillStyle = '#4a1a10'; for (const ex of [-L / 2 + 6, L / 2 - 6]) { ctx.beginPath(); ctx.arc(ex, -4.5, 1.4, 0, Math.PI * 2); ctx.arc(ex, 4.5, 1.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawBeamPile(r, g) {
    const ctx = r.ctx, P = CFG.SITETOWN.BEAM_PILE, B = CFG.SITETOWN.BEAM_PILE_BOX;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 26, B.y0 - 2, 10, B.y1 - B.y0 + 4); ctx.fillRect(P.x + 16, B.y0 - 2, 10, B.y1 - B.y0 + 4);   // wooden blocks
    for (let i = 0; i < 3; i++) this.drawBeam(ctx, P.x, P.y - 10 + i * 9, 0, 4, false);
    for (let i = 0; i < 2; i++) this.drawBeam(ctx, P.x + 3, P.y - 6 + i * 9, 0, 14, false);
    this.drawBeam(ctx, P.x - 2, P.y - 2, 0, 24, false);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, P.x - 26, B.y1 + 2, 52, 13, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏗️ STEEL', P.x, B.y1 + 9);
  },
  // the crane truck: the truck itself (outriggers, turntable) turned with it, then the boom, the cable, the hook and any beam
  // drawn in world space so the boom can rise towards the camera
  drawCrane(r, g, v) {
    const ctx = r.ctx, riding = g.driving && g.vehicle === v;
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    r.drawVehicle(v.kind, g, g.s.paint[v.kind], v);
    if (riding) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-26, -9, 7, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(-23, -9, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-25, -9, 4.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    const ca = Math.cos(v.angle), sa = Math.sin(v.angle), px = v.x + (-22) * ca - 8 * sa, py = v.y + (-22) * sa + 8 * ca;
    const hk = this.hookPos(v), th = this.boomH(v.boom), tx = hk.x, ty = hk.y - th, bx0 = px, by0 = py - 16;
    const col = r.paintColor(g.s.paint[v.kind] || '#f2b705', g);
    // the boom's shadow on the ground, then the boom: a thick yellow lattice arm from the turntable to the tip
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + 6, py + 6); ctx.lineTo(hk.x + 6 + v.boom * 10, hk.y + 6); ctx.stroke();
    const bw = 10 + v.boom * 3, L = Math.hypot(tx - bx0, ty - by0), ang = Math.atan2(ty - by0, tx - bx0);
    ctx.save(); ctx.translate(bx0, by0); ctx.rotate(ang);
    ctx.fillStyle = '#8a6a00'; U.roundRect(ctx, -6, -bw / 2 - 1, L + 10, bw + 2, 4); ctx.fill();
    ctx.fillStyle = col; U.roundRect(ctx, -5, -bw / 2, L + 8, bw, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = 4; x < L - 4; x += 10) { ctx.moveTo(x, -bw / 2 + 2); ctx.lineTo(x + 5, bw / 2 - 2); ctx.moveTo(x + 5, bw / 2 - 2); ctx.lineTo(x + 10, -bw / 2 + 2); }
    ctx.stroke();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(L, 0, bw / 2 + 1, 0, Math.PI * 2); ctx.fill();   // the pulley at the tip
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the cable and the hook, with the beam on a two-rope sling when there is one
    const beam = this.beamNow(v);
    const hookX = beam ? beam.x : tx, hookY = beam ? beam.y - beam.h - 16 : ty + 20;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hookX, hookY); ctx.stroke();
    if (beam) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(beam.x + 2, beam.y + 3, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
      const ex = Math.cos(beam.a) * 22, ey = Math.sin(beam.a) * 22, by = beam.y - beam.h;
      this.drawBeam(ctx, beam.x, beam.y, beam.a, beam.h, false);
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(hookX, hookY); ctx.lineTo(beam.x + ex, by + ey); ctx.moveTo(hookX, hookY); ctx.lineTo(beam.x - ex, by - ey); ctx.stroke();
    }
    ctx.fillStyle = '#f2b705'; U.roundRect(ctx, hookX - 5, hookY - 8, 10, 7, 2); ctx.fill();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(hookX, hookY + 3, 4, -Math.PI / 2, Math.PI * 0.9); ctx.stroke();
    r.drawRidingExtras(g, v, 30);
  },
  // the mixer's concrete stream: from the chute's tip straight down to the puddle, thick and wobbly, with a few drops
  drawStream(r, g, v) {
    if (!v.pour) return;
    const ch = this.chute(v); if (!ch.flowing) return;
    const ctx = r.ctx, P = CFG.SITETOWN.POUR, t = g.time, u = ch.t - P.OUT, x = ch.tip.x, y0 = ch.tip.y, y1 = y0 + P.DROP;
    const front = Math.min(1, u / 0.15), thin = Math.min(1, (P.FLOW - u) / 0.2), w = 6 + 6 * thin;
    const yb = y0 + (y1 - y0) * front, wob = Math.sin(t * 30) * 1.4;
    const body = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, y0); ctx.quadraticCurveTo(x - w / 2 + wob, (y0 + yb) / 2, x - w / 2 - 1.5, yb); ctx.lineTo(x + w / 2 + 1.5, yb); ctx.quadraticCurveTo(x + w / 2 + wob, (y0 + yb) / 2, x + w / 2, y0); ctx.closePath(); };
    ctx.fillStyle = '#5d6168'; body(); ctx.fill(); ctx.strokeStyle = '#3f4248'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#9da1a8'; ctx.fillRect(x - 1.5 + wob * 0.5, y0 + 1, 3, Math.max(0, yb - y0 - 2));
    ctx.fillStyle = '#6b6e75';
    for (let i = 0; i < 5; i++) { const k = (t * 2.2 + i * 0.2) % 1, dx = (i % 2 ? 1 : -1) * (w / 2 + 3 + k * 6); ctx.beginPath(); ctx.arc(x + dx, y0 + (y1 - y0) * k * front, 2 + (i % 2), 0, Math.PI * 2); ctx.fill(); }
    if (front >= 1) { ctx.strokeStyle = 'rgba(163,166,171,0.9)'; ctx.lineWidth = 2; const s = (t * 3) % 1; ctx.beginPath(); ctx.ellipse(x, y1, 8 + s * 10, 3 + s * 4, 0, 0, Math.PI * 2); ctx.stroke(); }
  },
  drawHardHat(r, g) {
    const ctx = r.ctx, p = g.player, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, x = p.x, y = p.y - 60 + bob;
    ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(x, y, 12, Math.PI, 0); ctx.fill();
    U.roundRect(ctx, x - 15, y - 1, 30, 5, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 3, y - 10, 6, 7);
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 12, Math.PI, 0); ctx.stroke();
  },
  drawToolbox(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, x = p.x + f * 17, y = p.y - 8 + bob;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 8, y - 4, 18, 12);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 10, y - 8, 20, 14, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 4, y - 12, 8, 4); ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 2, y - 4, 4, 3);
  },
  drawShake(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, x = p.x + f * 16, y = p.y - 22 + bob;
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x + 4, y + 10); ctx.lineTo(x - 4, y + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 8, 6, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x, y - 14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 2, y - 8); ctx.lineTo(x + 6, y - 20); ctx.stroke();
  },
  drawTower(r, g) {
    const ctx = r.ctx, T = CFG.SITETOWN.TOWER, x = T.x, y = T.y;
    ctx.strokeStyle = '#8c97a3'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 18, y + 6); ctx.lineTo(x - 26, y - 96); ctx.moveTo(x + 18, y + 6); ctx.lineTo(x + 26, y - 96); ctx.moveTo(x - 22, y - 40); ctx.lineTo(x + 22, y - 40); ctx.moveTo(x - 20, y - 16); ctx.lineTo(x + 20, y - 16); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 22, y - 40); ctx.lineTo(x + 20, y - 16); ctx.moveTo(x + 22, y - 40); ctx.lineTo(x - 20, y - 16); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, x - 30, y - 144, 68, 54, 10); ctx.fill();
    ctx.fillStyle = '#5aa9e6'; U.roundRect(ctx, x - 34, y - 150, 68, 54, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 28, y - 144, 10, 42);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(x - 34, y - 110, 68, 4); ctx.fillRect(x - 34, y - 132, 68, 4);
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.moveTo(x - 36, y - 150); ctx.lineTo(x, y - 168); ctx.lineTo(x + 36, y - 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💧 WATER', x, y - 122);
  },
  drawSilos(r, g) {
    const ctx = r.ctx, F = CFG.SITETOWN.FACTORY, t = g.time;
    for (let i = 0; i < F.SILOS.length; i++) {
      const x = F.SILOS[i], base = F.SILO_BOX.y1 - 6, h = 112 + (i % 2) * 14;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 4, base + 2, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d7dbe0'; U.roundRect(ctx, x - 20, base - h, 40, h, 8); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; for (let y = base - h + 20; y < base - 6; y += 28) ctx.fillRect(x - 20, y, 40, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - 15, base - h + 6, 7, h - 14);
      ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.ellipse(x, base - h, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['SAND', 'CEMENT', 'GRAVEL'][i], x, base - 30);
      ctx.fillStyle = Math.floor(t * 2 + i) % 2 ? '#ff3b3b' : '#ffb3b3'; ctx.beginPath(); ctx.arc(x, base - h - 10, 3, 0, Math.PI * 2); ctx.fill();   // beacon
    }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(F.SILOS[0] - 20, F.SILO_BOX.y1 - 20, F.SILOS[2] - F.SILOS[0] + 40, 6);   // walkway between them
    const Sg = F.SIGN;   // the factory's banner strung across the silos
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, Sg.x - 88, Sg.y - 12, 176, 24, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏭 CONCRETE FACTORY', Sg.x, Sg.y);
  },
  drawPlant(r, g) {
    const ctx = r.ctx, S = CFG.SITETOWN, F = S.FACTORY, P = F.PLANT, Dm = F.DRUM, t = g.time, st = this.st;
    // the tower
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(P.x0 + 6, P.y0 - 50, P.x1 - P.x0, P.y1 - P.y0 + 50);
    ctx.fillStyle = '#6d7680'; ctx.fillRect(P.x0, P.y0 - 60, P.x1 - P.x0, P.y1 - P.y0 + 60);
    ctx.fillStyle = '#f2b705'; ctx.fillRect(P.x0, P.y0 - 60, P.x1 - P.x0, 12); for (let x = P.x0; x < P.x1; x += 16) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x, P.y0 - 60, 8, 12); }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(P.x0 - 6, P.y0 - 14, P.x1 - P.x0 + 12, 8);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(P.x0 + 8, P.y0 - 44, 18, 14); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MIX', P.x0 + 17, P.y0 - 37);
    // the chimney with puffs
    const C = F.CHIMNEY; ctx.fillStyle = '#9aa0a8'; ctx.fillRect(C.x - 6, C.y - 70, 12, 46); ctx.fillStyle = '#2b1d14'; ctx.fillRect(C.x - 8, C.y - 72, 16, 5);
    for (const s of st.smoke) { const k = s.t / 2.2; ctx.fillStyle = `rgba(255,255,255,${(0.75 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(s.x, s.y - 12, 6 + k * 14, 0, Math.PI * 2); ctx.fill(); }
    // the big turning drum on the tower's front, its stripes rolling
    ctx.save(); ctx.translate(Dm.x, Dm.y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(3, 4, Dm.r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.arc(0, 0, Dm.r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, Dm.r - 3, 0, Math.PI * 2); ctx.clip(); ctx.rotate(t * 1.2);
    ctx.fillStyle = '#ff7a1a'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Dm.r, 0, Math.PI / 4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, Dm.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // the chute at the bottom, dripping
    const Ch = F.CHUTE; ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.moveTo(Ch.x - 12, Ch.y - 12); ctx.lineTo(Ch.x + 12, Ch.y - 12); ctx.lineTo(Ch.x + 6, Ch.y + 6); ctx.lineTo(Ch.x - 6, Ch.y + 6); ctx.closePath(); ctx.fill();
    const drip = (t * 1.5) % 1; ctx.fillStyle = '#8a8d93'; ctx.beginPath(); ctx.ellipse(Ch.x, Ch.y + 8 + drip * 10, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  },
  drawPile(r, g) {
    const ctx = r.ctx, P = CFG.SITETOWN.FACTORY.PILE;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(P.x + 4, P.y + 8, P.r, P.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8c8c86'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.r, P.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a8a8a2'; ctx.beginPath(); ctx.ellipse(P.x - 4, P.y - 10, P.r * 0.65, P.r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c4c4be'; ctx.beginPath(); ctx.ellipse(P.x - 8, P.y - 18, P.r * 0.3, P.r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(P.x + Math.cos(i * 2.1) * P.r * 0.6, P.y + Math.sin(i * 2.1) * P.r * 0.3, 2, 0, Math.PI * 2); ctx.fill(); }
  },
  drawKeeper(r, g) {
    const ctx = r.ctx, k = this.st.keeper, t = g.time;
    // waving hello is a happy hop and a 👋 beside the head (no arm reaching up)
    const y = k.y - (k.wave > 0 ? Math.abs(Math.sin(t * 7)) * 3 : 0);
    r.drawPerson(k.x, y, { shirt: '#fff', skin: '#c68642', hair: '#2b1d14', hairStyle: 1, facing: k.facing, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', apron: '#ff7a1a', cap: null });
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('STAFF', k.x, y - 18);
    if (k.wave > 0) { ctx.save(); ctx.translate(k.x + k.facing * 22, y - 46); ctx.rotate(Math.sin(t * 9) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore(); }
    if (k.wave > 0 && k.wave < 2.5) r.drawBubble(k.x, k.y - 72, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Hi there! 🔧', 0, 0); }, 70);
  },
  overlay(r, g) {
    if (g.area !== 'site') return;
    const ctx = r.ctx;
    for (const [x, y] of CFG.SITETOWN.TREES) this.canopy(ctx, x, y);
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx; ctx.fillStyle = `rgba(0,0,0,${(this.st.fade / 0.45 * 0.7).toFixed(2)})`; ctx.fillRect(0, 0, r.canvas.width / r.dpr, r.canvas.height / r.dpr);
  },

  // ---------- the concrete mixer, nose +x: an orange cab, a big striped drum that turns, a chute at the back
  vehicleArt: {
    // the crane truck, nose +x: a yellow carrier with four outriggers that fold out, a cab, a turntable with the
    // operator's little cab (the boom, cable and hook are drawn in world space by drawCrane)
    cranetruck(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#f2b705', out = v ? v.out || 0 : 0, t = g.time;
      h.shadow(112, 24);
      for (const ox of [-42, 30]) for (const sy of [-1, 1]) {
        const reach = 20 + out * 22;
        ctx.fillStyle = '#5c6670'; ctx.fillRect(ox - 4, sy < 0 ? -reach : 0, 8, reach);
        ctx.fillStyle = '#2b1d14'; for (let k = 6; k < reach - 4; k += 8) ctx.fillRect(ox - 4, sy < 0 ? -k - 3 : k, 8, 3);
        if (out > 0.05) { ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, ox - 9, sy * reach - 5, 18, 10, 3); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(ox - 6, sy * reach - 2, 12, 4); }
      }
      h.wheels([-30, -8, 38], 15, 10, 24);
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, -56, -20, 112, 40, 6); ctx.fill();          // chassis
      ctx.fillStyle = c; U.roundRect(ctx, -56, -22, 78, 44, 6); ctx.fill();                   // carrier deck
      ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(-56, -20 + k * 11, 6, 6);   // hazard stripes at the back
      ctx.fillStyle = c; U.roundRect(ctx, 26, -22, 30, 44, 7); ctx.fill();                     // cab
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 44, -17, 9, 34, 3); ctx.fill(); U.roundRect(ctx, 29, -17, 7, 34, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(26, -3, 30, 6);
      // the turntable and the operator's cab on it
      ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(-22, 0, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-22, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(-22, 0, 16, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      ctx.fillStyle = '#e0a800'; U.roundRect(ctx, -34, -18, 18, 16, 3); ctx.fill(); ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, -26, -16, 8, 12, 2); ctx.fill();
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, -30, 2, 16, 12, 3); ctx.fill();               // the boom's foot
      if (!v) { ctx.fillStyle = c; U.roundRect(ctx, -24, 4, 84, 8, 3); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(60, 8, 4, 0, Math.PI * 2); ctx.fill(); }   // a stowed boom when drawn on its own
      h.lights(112, 24);
      ctx.fillStyle = Math.floor(t * 3) % 2 ? '#ffb300' : '#ffe08a'; ctx.beginPath(); ctx.arc(34, -24, 3, 0, Math.PI * 2); ctx.fill();   // roof beacon
    },
    mixer(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#ff7a1a', t = g.time, spin = v && v.drum !== undefined ? v.drum : t * 0.8;
      h.shadow(110, 24);
      ctx.fillStyle = '#ff7a1a'; for (const wx of [-38, -14, 36]) { U.roundRect(ctx, wx - 8, -28, 16, 10, 3); ctx.fill(); U.roundRect(ctx, wx - 8, 18, 16, 10, 3); ctx.fill(); }
      ctx.fillStyle = '#1e1e1e'; for (const wx of [-38, -14, 36]) { ctx.fillRect(wx - 3, -27, 6, 8); ctx.fillRect(wx - 3, 19, 6, 8); }
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, -56, -18, 112, 36, 6); ctx.fill();                       // chassis
      ctx.fillStyle = c; U.roundRect(ctx, 22, -22, 34, 44, 7); ctx.fill();                                 // cab
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 42, -17, 10, 34, 3); ctx.fill(); U.roundRect(ctx, 26, -17, 8, 34, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(22, -3, 34, 6);
      // the drum: an ellipse with slanted stripes rolling across it (clipped), white and orange
      ctx.save(); ctx.beginPath(); ctx.ellipse(-12, 0, 38, 20, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#f3f3f3'; ctx.fillRect(-60, -30, 110, 60);
      ctx.fillStyle = c; const off = (spin * 10) % 18;
      for (let k = -80; k < 50; k += 18) { ctx.beginPath(); ctx.moveTo(k + off, -30); ctx.lineTo(k + off + 9, -30); ctx.lineTo(k + off + 22, 30); ctx.lineTo(k + off + 13, 30); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-60, -16, 110, 6);
      ctx.restore();
      ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(-12, 0, 38, 20, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, 18, -8, 10, 16, 3); ctx.fill();                          // drum's front bearing
      // the chute at the back: three telescoping grey channels that swing out and slide open to pour
      const ch = SiteTownExt.chute(v), P = CFG.SITETOWN.POUR;
      ctx.save(); ctx.translate(P.PIVOT, 0); ctx.rotate(ch.ang);
      const [l1, l2, l3] = ch.segs, chan = (x0, len, half, open) => {
        ctx.fillStyle = '#5c6670'; U.roundRect(ctx, x0 - 1, -half - 1, len + 2, half * 2 + 2, 3); ctx.fill();
        ctx.fillStyle = '#b7bcc4'; U.roundRect(ctx, x0, -half, len, half * 2, 3); ctx.fill();
        ctx.fillStyle = open ? '#8a8d93' : '#7c838d'; ctx.fillRect(x0 + 2, -half + 2.5, Math.max(0, len - 4), half * 2 - 5);
      };
      if (l3 > 0.5) chan(l1 + l2 - 4, l3 + 4, 4.5, ch.flowing);
      if (l2 > 0.5) chan(l1 - 4, l2 + 4, 5.5, ch.flowing);
      chan(0, l1, 6.5, ch.flowing);
      ctx.restore();
      ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(P.PIVOT, 0, 5, 0, Math.PI * 2); ctx.fill();
      h.lights(110, 24);
      ctx.fillStyle = Math.floor(t * 3) % 2 ? '#ffb300' : '#ffe08a'; ctx.beginPath(); ctx.arc(30, -24, 3, 0, Math.PI * 2); ctx.fill();   // roof beacon
    },
  },
};
Game.ext.unshift(SiteTownExt);   // first in line so its door button and hint beat the core's
Render.ext.push(SiteTownExt);
