'use strict';
// Monster trucks! Two giant trucks wait in their parking bays at the west end of Construction Town's dirt track, right by
// a big stadium gate: EL TORO LOCO (an orange bull: horns on the cab, a snorting snout with a gold ring in its nose, a tail)
// and GRAVE DIGGER (black and dark green with purple flames, a tombstone in the bed, a graveyard fence and a friendly
// ghost bobbing over it). Their tyres are taller than the chef and they bounce on long springy shocks.
//   - Drive one into the gate's tunnel (or walk up to it: '🏟️ Go to the arena') and you are in the MONSTER TRUCK ARENA,
//     its own map: a dirt floor, grandstands with a cheering crowd, waving flags and a big screen, three big dirt jumps
//     and a row of junk cars. Drive up into the tunnel in the north stand (or '🏁 Back to the dirt track' on foot) to
//     come back out at the gate.
//   - Jumps: hit the top of a dirt hill fast and the truck flies (real air time, its shadow stays on the ground), then
//     lands with a bounce on its springs, a dust cloud, "WHOA! 💥" and a roar from the crowd. Two baby jumps sit on the
//     dirt track in Construction Town too.
//   - Junk cars (wrecks, not vehicles): drive over one and it is CRUSHED flat ("CRUNCH! 🚗💥", glass sparkles); a little
//     later the yellow forklift fetches a fresh one through the service door, swaps it in and takes the pancake away. The
//     forklift waits by its door and can be driven too ('🚜 Drive the forklift', '⬆️ Forks up' / '⬇️ Forks down'); hop
//     out and it drives itself home.
//   - Tricks, one big button chosen by the moment: in the air '🔄 Backflip' (a whole flip, "TA-DA! 🎉" on landing), on the
//     ground '🤸 Wheelie' (front wheels up for a couple of seconds), then '🍩 Donut' (spin on the spot in a ring of dust),
//     then Wheelie again...
//   - The other truck drives laps of the arena by itself, flying off the jumps (sometimes with a backflip) and spinning
//     donuts; it stops when the chef walks up to it, so he can climb in.
//   - Take-me-home parks both trucks back in their bays; a truck or a chef stuck in a wall is put back somewhere free.
// Drawn side-on (they turn to face the way they drive and look a little shorter driving up or down the screen).
// Runtime state only, except a few counters in g.s.mtrucks.
// Extension module: Game.ext.unshift + Render.ext.push. See js/EXTENSIONS.md.
CFG.MTRUCKS = {
  name: 'Monster Truck Arena', ico: '🏟️', toast: '🏟️ Welcome to the Monster Truck Arena!',
  WORLD: { x0: 36000, y0: 5000, x1: 38400, y1: 6400, walkY0: 5262 },   // a big free rectangle of its own (2400 × 1400)
  // ---- Construction Town: the stadium gate at the west end of the dirt track (CFG.SITETOWN.TRACK), its parking bays
  GATE: { x0: 2604, y0: 1030, x1: 2784, y1: 1150 },     // the gate building's footprint (solid); its tall front wall faces south
  MOUTH: { x: 2694, half: 66, tall: 120 },              // the tunnel's arch in the gate's front wall (a truck fits through)
  DOOR: { x: 2694, y: 1178 },                           // on foot: '🏟️ Go to the arena' within DOOR_R of here
  DOOR_R: 70,
  TRIG: { x0: 2608, x1: 2780, y0: 1140, y1: 1208 },     // a monster truck driven into this box (up under the arch) goes in
  OUT: { x: 2694, y: 1254 },                            // where a truck comes back out (the chef on foot: just under the arch)
  // after going through the gate or the tunnel: no going straight back (see gateTurn): the truck rolls out facing away
  // (OUT_DIR at the dirt track: east along it, the map ends just below the gate; ARRIVE_DIR in the arena: down onto the
  // dirt), and the way through only works again GATE_CD seconds later, once the truck is GATE_CLEAR px clear of the trigger
  OUT_DIR: 0, ARRIVE_DIR: Math.PI / 2, GATE_CD: 1, GATE_CLEAR: 30, ROLL_OUT: 150,
  PARK: { eltoro: { x: 2904, y: 1110 }, gravedigger: { x: 2904, y: 1262 } },   // the two bays (both nose to the gate)
  SITE_RAMPS: [{ x: 3080, y: 1074, rx: 46, ry: 24, h: 14, vz: 330 }, { x: 3080, y: 1246, rx: 46, ry: 24, h: 14, vz: 330 }],
  // ---- the arena
  FLOOR: { x0: 36072, y0: 5262, x1: 38328, y1: 6310 }, // the dirt (walls west, east and south; the stands north)
  ARRIVE: { x: 36300, y: 5372 },                        // you come in here, just below the tunnel
  TUNNEL: { x: 36300, half: 72 },                       // the tunnel in the north stand
  TUNNEL_TRIG: 5304,                                    // a truck driven up into the tunnel (north of this) goes out
  TUNNEL_DOOR: { x: 36300, y: 5292 },                   // on foot: '🏁 Back to the dirt track'
  ARENA_PARK: { x: 36560, y: 5384 },                    // the chef's truck waits here when he walks in
  RAMPS: [
    // each big hill has its own jump: the BACKFLIP hill flips you backwards, the FRONT FLIP hill forwards (both by
    // themselves), and the plain JUMP hill just flies you (onto the cars), where the 🔄 button can still do a backflip
    // (big and easy to hit for small hands: launched from anywhere on the inner CREST of the hill, from any side, at any
    // speed, and a driven truck heading roughly at one is pulled onto it: MAGNET)
    { x: 36720, y: 5640, rx: 135, ry: 86, h: 38, vz: 560, trick: 'back' },
    { x: 37780, y: 5640, rx: 135, ry: 86, h: 38, vz: 560, trick: 'front' },
    { x: 36700, y: 6090, rx: 120, ry: 76, h: 34, vz: 520 },   // this one flies you onto the cars
  ],
  CARS: { y: 6090, xs: [37000, 37150, 37300, 37450, 37600], colors: ['#c0504d', '#4f81bd', '#8fbf4f', '#e8b84a', '#9a6bc0'], HX: 62, HY: 34 },
  REFILL: 6,                                            // seconds a crushed car lies there before the forklift comes
  FORK: { x: 38300, y: 6176, speed: 340, reach: 74, PARK: { x: 38236, y: 6176 } },   // the service door in the east wall (the forklift
                                                        // waits just inside it and drives along the row's front)
  AI: { speed: 230, pause: 150, start: 3, path: [[36230, 5640], [37250, 5640], [38080, 5640], [38080, 6240], [37250, 6240], [36230, 6240]] },
  G: 1100, LAUNCH_MIN: 280, CREST: 0.6,   // gravity, launch speed, how near the hill's top it launches (at any speed)
  // the arena hills' magnet: within REACH (in hill radii) and heading within COS of the hill's top, a driven truck is
  // slid sideways onto it at up to PULL px/s
  MAGNET: { REACH: 2.3, COS: 0.55, PULL: 240 },
  WHEELIE: 2.4, DONUT: 1.8, FLIP: 0.95,                 // seconds
  WR: 38, WB: 56,                                       // tyre radius, half the wheelbase (the chef is ~70 px tall)
  LABELS: { wheelie: '🤸 Wheelie', donut: '🍩 Donut', flip: '🔄 Backflip' },
};
CFG.AREAS.arena = { WORLD: CFG.MTRUCKS.WORLD, noSky: true, place: 'site' };
CFG.VEHICLES.eltoro = { speed: 270, radius: 40, label: '🐂 Drive El Toro Loco', exit: '🚶 Hop out' };
CFG.VEHICLES.gravedigger = { speed: 270, radius: 40, label: '👻 Drive Grave Digger', exit: '🚶 Hop out' };
CFG.VEHICLES.forklift = { speed: 170, radius: 26, label: '🚜 Drive the forklift', exit: '🚶 Hop out' };

const MonsterTrucksExt = {
  name: 'monstertrucks',
  defaults: { mtrucks: { seen: false, jumps: 0, flips: 0, wheelies: 0, donuts: 0, crushed: 0 } },
  KINDS: ['eltoro', 'gravedigger'],
  trucks: null, st: null,

  // ================= state =================
  build(g) {
    const M = CFG.MTRUCKS;
    if (!g.s.mtrucks) g.s.mtrucks = JSON.parse(JSON.stringify(this.defaults.mtrucks));
    this.trucks = this.KINDS.map((k) => this.newTruck(k));
    this.st = {
      lastArea: null, mine: this.trucks[0], next: 'wheelie', fade: 0, cheer: 0, roarCd: 0, rescueT: 0,
      armed: true, gateCd: 0, turn: null,   // the gate / tunnel trigger (re-armed once clear of it), the turned-around stick
      dust: [], sparks: [], confetti: [], pops: [], marks: [],
      // the forklift: waits by its door; brings a fresh car for each crushed one (fetch → in → swap → out → home); drivable
      fork: { kind: 'forklift', x: M.FORK.PARK.x, y: M.FORK.PARK.y, angle: Math.PI, vx: 0, vy: 0, face: -1, phase: 'parked', car: null, t: 0, load: null, swapped: false, lift: 0, liftTo: 0 },
      cars: M.CARS.xs.map((x, i) => ({ i, x, y: M.CARS.y, color: M.CARS.colors[i % M.CARS.colors.length], flat: false, t: 9, flatT: 0 })),
    };
  },
  newTruck(kind) {
    const v = { kind, x: 0, y: 0, angle: Math.PI, vx: 0, vy: 0, area: 'site', face: -1, z: 0, vz: 0, air: null, rot: 0, sq: 0, sqv: 0, bump: 0, wheelie: null, donut: null, flip: null, ai: false, aiT: 0, wp: 0, laps: 0, launchCd: 0 };
    this.park(v);
    return v;
  },
  ensure(g) { if (!this.trucks || !this.st) this.build(g); if (!g.s.mtrucks) g.s.mtrucks = JSON.parse(JSON.stringify(this.defaults.mtrucks)); },
  isTruck(v) { return !!v && !!this.trucks && this.trucks.includes(v); },
  driven(g) { return g.driving && this.isTruck(g.vehicle) ? g.vehicle : null; },
  truck(kind) { return this.trucks && this.trucks.find((v) => v.kind === kind); },
  // the chef is somewhere else entirely: on a train, travelling, in a City taxi or up the Pizza Tower
  busy(g) {
    if (g.travel || g.onTrain || g.ride) return true;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return true;
    return false;
  },
  still(v) { v.z = 0; v.vz = 0; v.air = null; v.wheelie = null; v.donut = null; v.flip = null; v.bump = 0; v.sq = 0; v.sqv = 0; v.vx = 0; v.vy = 0; v.launchCd = 0; },
  park(v) {
    const P = CFG.MTRUCKS.PARK[v.kind];
    this.still(v); v.area = 'site'; v.x = P.x; v.y = P.y; v.angle = Math.PI; v.face = -1; v.ai = false; v.aiT = 0;
  },
  vehicles(g) { this.ensure(g); const out = this.trucks.filter((v) => v.area === g.area); if (g.area === 'arena') out.push(this.st.fork); return out; },

  // Into the arena: everything not being driven comes along; the chef's own truck waits by the tunnel, the other one
  // starts its show (on a reload into the arena, or a teleport, the same happens).
  populateArena(g) {
    const M = CFG.MTRUCKS, d = this.driven(g), st = this.st;
    if (d) st.mine = d;
    for (const v of this.trucks) {
      if (v === d) continue;
      this.still(v); v.area = 'arena';
      if (v === st.mine) { v.x = M.ARENA_PARK.x; v.y = M.ARENA_PARK.y; v.angle = 0; v.face = 1; v.ai = false; }
      else { const p = M.AI.path[M.AI.start]; v.x = p[0]; v.y = p[1]; v.wp = (M.AI.start + 1) % M.AI.path.length; v.angle = Math.PI; v.face = -1; v.ai = true; v.aiT = 0.5; }
    }
  },
  enterArena(g, v) {
    const M = CFG.MTRUCKS, st = this.st, sp0 = v ? Math.hypot(v.vx, v.vy) : 0;
    g.area = 'arena';
    if (v) { this.still(v); v.area = 'arena'; v.x = M.ARRIVE.x; v.y = M.ARRIVE.y + 12; v.angle = M.ARRIVE_DIR; v.face = 1; v.ai = false; st.mine = v; }
    this.gateTurn(g, v, sp0, M.ARRIVE_DIR);
    g.player.x = M.ARRIVE.x; g.player.y = M.ARRIVE.y + (v ? 12 : 0); g.player.moving = false; g.player.hasMoved = true;
    this.populateArena(g); st.lastArea = 'arena';
    g.cameraSnap = true; st.fade = 0.6; st.cheer = 1;
    if (!g.s.mtrucks.seen) { g.s.mtrucks.seen = true; g.toast(M.toast, true); }
    else this.pop(M.ARRIVE.x, M.ARRIVE.y - 150, 'Monster trucks! 🏟️', '#ffe08a');
    this.roar(true);
  },
  leaveArena(g, v) {
    const M = CFG.MTRUCKS, st = this.st, sp0 = v ? Math.hypot(v.vx, v.vy) : 0;
    g.area = 'site';
    if (v) { this.still(v); v.area = 'site'; v.x = M.OUT.x; v.y = M.OUT.y; v.angle = M.OUT_DIR; v.face = 1; v.ai = false; }
    this.gateTurn(g, v, sp0, M.OUT_DIR);
    for (const t of this.trucks) if (t !== v) this.park(t);
    g.player.x = M.OUT.x; g.player.y = v ? M.OUT.y : M.DOOR.y + 22; g.player.moving = false; g.player.hasMoved = true;
    st.lastArea = 'site';
    g.cameraSnap = true; st.fade = 0.6;
  },
  // Just through the gate or the tunnel (both are driven into going UP the screen): no bouncing straight back in. The
  // truck comes out already rolling away from it (dir: the angle it rolls out at), and if the stick is still held the way
  // it was going, the stick is TURNED for a while: holding it the same way keeps the truck driving out along `dir`, until
  // the stick is let go or pushed another way (then it is the normal stick again). The trigger itself is disarmed for
  // GATE_CD seconds and until the truck is clear of it.
  gateTurn(g, v, sp0, dir) {
    const M = CFG.MTRUCKS, st = this.st;
    st.armed = false; st.gateCd = M.GATE_CD; st.turn = null;
    if (!v) return;
    const rs = U.clamp(sp0 * 0.8, M.ROLL_OUT, CFG.VEHICLES[v.kind].speed);
    v.vx = Math.cos(dir) * rs; v.vy = Math.sin(dir) * rs;
    const a = Input.axis(), m = Math.hypot(a.x, a.y);
    if (m > 0.2) st.turn = { v, area: g.area, dx: a.x / m, dy: a.y / m, rot: dir - Math.atan2(a.y, a.x), t: 0, snap: null };
  },
  clearOfGate(g, x, y) {
    const M = CFG.MTRUCKS, C = M.GATE_CLEAR;
    if (g.area === 'site') { const T = M.TRIG; return x < T.x0 - C || x > T.x1 + C || y < T.y0 - C || y > T.y1 + C; }
    if (g.area === 'arena') return Math.abs(x - M.TUNNEL.x) > M.TUNNEL.half + 10 + C || y > M.TUNNEL_TRIG + C;
    return true;
  },
  // runs first thing in update, right after Game.updateDriving moved the truck with the plain stick: while the stick is
  // turned, that move is undone and the truck is driven again with the turned stick (the same physics as updateDriving)
  stepGate(g, d, dt) {
    const st = this.st, tn = st.turn;
    if (tn) {
      tn.t += dt;
      const a = Input.axis(), m = Math.hypot(a.x, a.y);
      if (d !== tn.v || g.area !== tn.area || (tn.snap && U.dist(d.x, d.y, tn.snap.x, tn.snap.y) > 40)) st.turn = null;   // (or put somewhere else)
      else if (tn.t > 0.3 && (m < 0.2 || (a.x * tn.dx + a.y * tn.dy) / m < 0.5)) st.turn = null;   // let go, or a new way
      else if (tn.snap) { Object.assign(d, tn.snap); this.turnedDrive(g, d, a, tn.rot, dt); }
    }
    st.gateCd = Math.max(0, st.gateCd - dt);
    const w = d || g.player;
    if (!st.armed && st.gateCd <= 0 && !st.turn && this.clearOfGate(g, w.x, w.y)) st.armed = true;
  },
  turnedDrive(g, c, a, rot, dt) {
    const spec = CFG.VEHICLES[c.kind], sp = spec.speed, cs = Math.cos(rot), sn = Math.sin(rot);
    const ax = a.x * cs - a.y * sn, ay = a.x * sn + a.y * cs;
    const k = (a.x || a.y) ? 1 - Math.pow(0.02, dt) : 1 - Math.pow(0.001, dt);
    c.vx += (ax * sp - c.vx) * k; c.vy += (ay * sp - c.vy) * k;
    const speed = Math.hypot(c.vx, c.vy);
    if (speed > 15) { let dA = Math.atan2(c.vy, c.vx) - c.angle; while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2; c.angle += dA * Math.min(1, dt * 10); }
    const r = spec.radius, w = g.bounds(), obs = g.townObstacles(true);
    c.x = U.clamp(c.x + c.vx * dt, w.x0 + 30, w.x1 - 30);
    for (const o of obs) if (o.w && g.hitRect(c.x, c.y, r, o)) { c.x = c.vx > 0 ? o.x - r : o.x + o.w + r; c.vx = 0; }
    c.y = U.clamp(c.y + c.vy * dt, Math.max(w.y0 + 30, g.walkTop() + r - 12), w.y1 - 30);
    for (const o of obs) if (o.w && g.hitRect(c.x, c.y, r, o)) { c.y = c.vy > 0 ? o.y - r : o.y + o.h + r; c.vy = 0; }
    g.player.x = c.x; g.player.y = c.y; g.player.moving = speed > 15;
  },
  snapTurn(d) { const tn = this.st.turn; if (tn && d === tn.v) tn.snap = { x: d.x, y: d.y, vx: d.vx, vy: d.vy, angle: d.angle }; },

  // ================= update =================
  update(g, dt) {
    this.ensure(g);
    const st = this.st, M = CFG.MTRUCKS, d = this.driven(g);
    if (d) st.mine = d;
    // a map change of any kind (a reload into the arena, a teleport, Take-me-home): the trucks follow the show
    if (g.area !== st.lastArea) {
      if (g.area === 'arena') this.populateArena(g);
      else if (st.lastArea === 'arena') for (const v of this.trucks) if (v !== d) this.park(v);
      st.lastArea = g.area; st.armed = false; st.turn = null;
    }
    st.fade = Math.max(0, st.fade - dt); st.cheer = Math.max(0, st.cheer - dt * 0.3); st.roarCd -= dt;
    this.stepBits(dt);
    this.stepCars(g, dt);
    if (g.area !== 'site' && g.area !== 'arena') { st.turn = null; return; }
    if (g.travel) return;
    this.stepGate(g, d, dt);
    // in the arena the truck that is not the chef's does the show
    if (g.area === 'arena') for (const v of this.trucks) {
      if (v.area !== 'arena') continue;
      const ai = v !== d && v !== st.mine;
      if (ai && !v.ai) { v.aiT = 1.5; v.wp = this.nearestWp(v); }
      v.ai = ai;
    } else for (const v of this.trucks) v.ai = false;
    for (const v of this.trucks) if (v.area === g.area) this.stepTruck(g, v, dt, v === d);
    if (g.area === 'arena') this.crushCheck(g, d);
    // through the gate / the tunnel with a truck (not straight back the way it just came: stepGate)
    if (d && st.armed && !d.air && !d.donut) {
      const T = M.TRIG;
      if (g.area === 'site' && d.x > T.x0 && d.x < T.x1 && d.y > T.y0 && d.y < T.y1) this.enterArena(g, d);
      else if (g.area === 'arena' && Math.abs(d.x - M.TUNNEL.x) < M.TUNNEL.half + 10 && d.y < M.TUNNEL_TRIG) this.leaveArena(g, d);
    }
    // rescues, twice a second: a chef or a truck stuck inside a wall goes somewhere free
    st.rescueT -= dt;
    if (st.rescueT <= 0) { st.rescueT = 0.5; this.rescue(g); }
    this.snapTurn(this.driven(g));
  },
  nearestWp(v) { const P = CFG.MTRUCKS.AI.path; let bi = 0, bd = Infinity; P.forEach((w, i) => { const dd = U.dist(v.x, v.y, w[0], w[1]); if (dd < bd) { bd = dd; bi = i; } }); return bi; },

  rampAt(g, x, y) {
    const R = g.area === 'arena' ? CFG.MTRUCKS.RAMPS : g.area === 'site' ? CFG.MTRUCKS.SITE_RAMPS : [];
    for (const r of R) { const dx = (x - r.x) / r.rx, dy = (y - r.y) / r.ry, d2 = dx * dx + dy * dy; if (d2 < 1) return { ramp: r, d: Math.sqrt(d2) }; }
    return null;
  },
  groundZ(g, x, y) { const h = this.rampAt(g, x, y); return h ? h.ramp.h * (1 - h.d * h.d) : 0; },
  // where a flying truck may go: the arena's dirt, or the site map's bounds (it flies over everything there)
  flyBox(g) {
    if (g.area === 'arena') { const F = CFG.MTRUCKS.FLOOR; return { x0: F.x0 + 44, x1: F.x1 - 44, y0: F.y0 + 30, y1: F.y1 - 42 }; }
    const W = g.bounds(); return { x0: W.x0 + 40, x1: W.x1 - 40, y0: g.walkTop() + 30, y1: W.y1 - 30 };
  },

  stepTruck(g, v, dt, driven) {
    const M = CFG.MTRUCKS, st = this.st;
    v.launchCd = Math.max(0, v.launchCd - dt);
    if (v.ai && !v.air && !v.donut) this.stepAI(g, v, dt);
    // the donut: hold the spot and spin
    if (v.donut) {
      const dn = v.donut; dn.t += dt;
      v.x = dn.x; v.y = dn.y; v.vx = 0; v.vy = 0;
      const k = U.clamp(dn.t / dn.dur, 0, 1); dn.a = (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) * Math.PI * 4;
      dn.puffT = (dn.puffT || 0) - dt;
      while (dn.puffT <= 0) { dn.puffT += 0.035; const a = dn.a * 1.3 + Math.random() * 0.6; st.dust.push({ x: dn.x + Math.cos(a) * 86, y: dn.y + Math.sin(a) * 30, vx: Math.cos(a) * 60, vy: Math.sin(a) * 24, t: 0, dur: U.rand(0.5, 0.8), r: U.rand(9, 15), area: g.area }); }
      if (dn.t >= dn.dur) { st.marks.push({ x: dn.x, y: dn.y, t: 0, area: g.area }); if (st.marks.length > 6) st.marks.shift(); v.donut = null; }
    }
    const sp = Math.hypot(v.vx, v.vy);
    if (v.air) {
      const a = v.air, B = this.flyBox(g);
      a.x = U.clamp(a.x + a.vx * dt, B.x0, B.x1); a.y = U.clamp(a.y + a.vy * dt, B.y0, B.y1);
      v.x = a.x; v.y = a.y; v.vx = a.vx; v.vy = a.vy;
      v.vz -= M.G * dt; v.z += v.vz * dt;
      if (v.flip) v.flip.t += dt;
      const gz = this.groundZ(g, v.x, v.y);
      if (v.z <= gz && v.vz < 0) this.land(g, v, driven, gz);
    } else {
      if (driven && g.area === 'arena' && !v.donut && v.launchCd <= 0 && sp > 1) this.magnet(g, v, sp, dt);
      const h = this.rampAt(g, v.x, v.y);
      if (h && h.d < M.CREST && sp > 1 && !v.donut && v.launchCd <= 0) this.launch(g, v, h.ramp, sp, driven);
      else { const gz = h ? h.ramp.h * (1 - h.d * h.d) : 0; v.z += (gz - v.z) * Math.min(1, dt * 18); }
    }
    // which way it faces (a little hysteresis so driving straight up the screen does not flicker)
    const c = Math.cos(v.angle);
    if (c > 0.2) v.face = 1; else if (c < -0.2) v.face = -1;
    v.rot += (v.air ? 9 : sp / M.WR) * dt;
    // springy suspension: a damped spring (landings kick it), plus the bump of rolling over a car
    v.sqv += (-90 * v.sq - 9 * v.sqv) * dt; v.sq += v.sqv * dt;
    v.bump = Math.max(0, v.bump - dt * 2.8);
    if (v.wheelie) { v.wheelie.t += dt; if (v.wheelie.t >= v.wheelie.dur) { v.wheelie = null; v.sqv += 3; } }
    if (driven) {
      g.player.x = v.x; g.player.y = v.y;
      if (g.area === 'arena' && v.z > 0) g.player.y = v.y - v.z * 0.5;   // the camera rises a little with a big jump
    }
  },
  stepAI(g, v, dt) {
    const A = CFG.MTRUCKS.AI, p = g.player;
    v.aiT = Math.max(0, v.aiT - dt);
    const near = !g.driving && U.dist(p.x, p.y, v.x, v.y) < A.pause;   // stops by the chef so he can climb in
    let tx = 0, ty = 0;
    if (!near && v.aiT <= 0) {
      const w = A.path[v.wp], dx = w[0] - v.x, dy = w[1] - v.y, dd = Math.hypot(dx, dy);
      if (dd < 40) {
        v.wp = (v.wp + 1) % A.path.length;
        if (v.wp === 0) v.laps++;
        if (v.wp === 4 && v.laps % 2 === 1) { this.startDonut(g, v, false); return; }    // a donut in the far corner every other lap
        if (v.wp === 1 && Math.random() < 0.5) this.startWheelie(g, v, false);
      } else { tx = dx / dd * A.speed; ty = dy / dd * A.speed; }
    }
    const k = 1 - Math.pow(tx || ty ? 0.05 : 0.002, dt);   // brakes harder than it speeds up
    v.vx += (tx - v.vx) * k; v.vy += (ty - v.vy) * k;
    const B = this.flyBox(g);
    v.x = U.clamp(v.x + v.vx * dt, B.x0, B.x1); v.y = U.clamp(v.y + v.vy * dt, B.y0, B.y1);
    if (Math.hypot(v.vx, v.vy) > 15) { let dA = Math.atan2(v.vy, v.vx) - v.angle; while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2; v.angle += dA * Math.min(1, dt * 6); }
  },

  launch(g, v, ramp, sp, driven) {
    const M = CFG.MTRUCKS, L = Math.max(sp, M.LAUNCH_MIN) * (ramp.h < 20 ? 0.9 : 1);
    v.air = { x: v.x, y: v.y, vx: v.vx / sp * L, vy: v.vy / sp * L };
    v.vx = v.air.vx; v.vy = v.air.vy;
    v.vz = ramp.vz; v.z = Math.max(v.z, ramp.h); v.wheelie = null; v.flip = null;
    this.st.cheer = Math.max(this.st.cheer, 0.6);
    for (let i = 0; i < 6; i++) this.st.dust.push({ x: v.x + U.rand(-40, 40), y: v.y + U.rand(-4, 6), vx: -v.vx * 0.2 + U.rand(-30, 30), vy: U.rand(-20, 10), t: 0, dur: U.rand(0.4, 0.7), r: U.rand(7, 12), area: g.area });
    if (driven) g.s.mtrucks.jumps++;
    if (ramp.trick) {
      this.startFlip(g, v, driven, ramp.trick === 'front' ? -1 : 1);
      this.pop(v.x, v.y - 200, ramp.trick === 'front' ? 'FRONT FLIP! 🔃' : 'BACKFLIP! 🔄', '#ffe08a', 1.1);
    } else if (v.ai && g.area === 'arena' && Math.random() < 0.55) this.startFlip(g, v, false);
  },
  // a driven truck heading roughly at an arena hill is slid sideways onto its top (a joystick in small hands wobbles)
  magnet(g, v, sp, dt) {
    const A = CFG.MTRUCKS.MAGNET, hx = v.vx / sp, hy = v.vy / sp;
    let best = null, be = A.REACH;
    for (const r of CFG.MTRUCKS.RAMPS) { const e = Math.hypot((v.x - r.x) / r.rx, (v.y - r.y) / r.ry); if (e < be) { be = e; best = r; } }
    if (!best || be < CFG.MTRUCKS.CREST * 0.5) return;
    const tx = best.x - v.x, ty = best.y - v.y, td = Math.hypot(tx, ty);
    if (td < 1 || (tx * hx + ty * hy) / td < A.COS) return;
    const along = tx * hx + ty * hy, px = tx - along * hx, py = ty - along * hy, pd = Math.hypot(px, py);
    if (pd < 0.5) return;
    const step = Math.min(pd, A.PULL * dt);
    v.x += px / pd * step; v.y += py / pd * step;
  },
  // seconds until a flying truck is down again (from its height and climb)
  airLeft(v) { const G = CFG.MTRUCKS.G; return (v.vz + Math.sqrt(Math.max(0, v.vz * v.vz + 2 * G * v.z))) / G; },
  land(g, v, driven, gz) {
    const st = this.st, flipped = !!v.flip;
    v.z = gz; v.vz = 0; v.air = null; v.flip = null; v.launchCd = 0.5;
    v.vx *= 0.7; v.vy *= 0.7;
    v.sqv = -7.5;   // squash down on the springs, then boing back up
    for (let i = 0; i < 18; i++) { const a = Math.random() * Math.PI * 2; st.dust.push({ x: v.x + Math.cos(a) * U.rand(30, 90), y: v.y + Math.sin(a) * U.rand(4, 14), vx: Math.cos(a) * U.rand(40, 120), vy: Math.sin(a) * U.rand(10, 40) - 10, t: 0, dur: U.rand(0.5, 0.9), r: U.rand(9, 18), area: g.area }); }
    if (flipped) {
      this.pop(v.x, v.y - 190, 'TA-DA! 🎉', '#ffe08a', 1.8);
      for (let i = 0; i < 26; i++) st.confetti.push({ x: v.x + U.rand(-60, 60), y: v.y - U.rand(120, 200), vx: U.rand(-120, 120), vy: U.rand(-260, -60), t: 0, dur: U.rand(1.2, 1.8), c: U.pick(['#ff5252', '#ffd166', '#41b883', '#3b7dd8', '#ff8fab', '#b388ff']), a: Math.random() * 6, area: g.area });
      st.cheer = 1;
      if (driven) { g.s.mtrucks.flips++; Sfx.unlock(); Haptics.success(); }
    } else {
      this.pop(v.x, v.y - 180, 'WHOA! 💥', '#ffffff', 1.3);
      st.cheer = Math.max(st.cheer, 0.85);
      if (driven) { Haptics.tap(); this.roar(false) || Sfx.drop(); }
    }
    if (g.area === 'arena') this.crushCheck(g, driven ? v : null, v);
  },
  // the crowd roars (a soft whoosh of noise), never more often than every few seconds
  roar(force) { if (!force && this.st.roarCd > 0) return false; this.st.roarCd = 3; Sfx.chuff(1.6); return true; },
  pop(x, y, text, color, dur = 1.3) { this.st.pops.push({ x, y, text, color, t: 0, dur }); if (this.st.pops.length > 8) this.st.pops.shift(); },

  // ---------------- tricks ----------------
  trickFor(v) {
    if (v.air) return v.flip ? null : 'flip';
    if (v.donut) return null;
    if (v.wheelie) return 'donut';
    return this.st.next;
  },
  doTrick(g, v, k) {
    if (k === 'flip') this.startFlip(g, v, true);
    else if (k === 'wheelie') this.startWheelie(g, v, true);
    else if (k === 'donut') this.startDonut(g, v, true);
  },
  startWheelie(g, v, driven) {
    if (v.air || v.donut) return;
    v.wheelie = { t: 0, dur: CFG.MTRUCKS.WHEELIE };
    if (driven) { this.st.next = 'donut'; g.s.mtrucks.wheelies++; Sfx.pickup(); Haptics.tap(); g.floats.push({ x: v.x, y: v.y - 160, text: 'Wheelie! 🤸', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
    this.st.cheer = Math.max(this.st.cheer, 0.5);
  },
  startDonut(g, v, driven) {
    if (v.air || v.donut) return;
    v.wheelie = null; v.donut = { t: 0, dur: CFG.MTRUCKS.DONUT, x: v.x, y: v.y, a: 0 }; v.vx = 0; v.vy = 0;
    if (driven) { this.st.next = 'wheelie'; g.s.mtrucks.donuts++; Sfx.pickup(); Haptics.tap(); g.floats.push({ x: v.x, y: v.y - 160, text: 'Donut! 🍩', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
    this.st.cheer = Math.max(this.st.cheer, 0.6);
  },
  // dir 1: a backflip (the nose goes up and over), -1: a front flip (the nose goes down and over)
  startFlip(g, v, driven, dir = 1) {
    if (!v.air || v.flip) return;
    const M = CFG.MTRUCKS, G = M.G;
    // always enough air for a whole flip: a short hop gets a little extra lift
    let left = this.airLeft(v);
    if (left < M.FLIP + 0.08) { const T = M.FLIP + 0.1; v.vz = (G * T * T / 2 - v.z) / T; left = T; }
    v.flip = { t: 0, dur: Math.min(left - 0.04, M.FLIP + 0.15), dir };
    if (driven) { Sfx.pickup(); Haptics.tap(); }
  },
  wheelieAngle(v) {
    const w = v.wheelie; if (!w) return 0;
    const up = U.clamp(w.t / 0.3, 0, 1), down = U.clamp((w.dur - w.t) / 0.35, 0, 1), k = Math.min(up, down);
    return (0.42 * (1 - Math.pow(1 - k, 3))) + Math.sin(w.t * 9) * 0.025 * k;
  },
  flipAngle(v) { const f = v.flip; if (!f) return 0; const k = U.clamp(f.t / f.dur, 0, 1); return (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) * Math.PI * 2 * (f.dir || 1); },

  // ---------------- the junk cars and the forklift ----------------
  // a truck rolling over a car (or landing on one) crushes it; one just parked on the row does not
  crushCheck(g, d, landed) {
    const M = CFG.MTRUCKS, st = this.st;
    for (const v of this.trucks) {
      if (v.area !== 'arena' || (v.air && v.z > 16) || (v !== landed && Math.hypot(v.vx, v.vy) < 20)) continue;
      for (const c of st.cars) {
        if (c.flat || Math.abs(v.x - c.x) > M.CARS.HX || Math.abs(v.y - c.y) > M.CARS.HY) continue;
        c.flat = true; c.t = 0; c.flatT = 0; v.bump = 1;
        this.pop(c.x, c.y - 170, 'CRUNCH! 🚗💥', '#ffd166', 1.3);
        for (let i = 0; i < 14; i++) st.sparks.push({ x: c.x + U.rand(-40, 40), y: c.y + U.rand(-6, 6), z: U.rand(16, 34), vx: U.rand(-110, 110), vy: U.rand(-30, 30), vz: U.rand(120, 300), t: 0, dur: U.rand(0.7, 1.1) });
        for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: c.x + U.rand(-36, 36), y0: c.y - U.rand(18, 40), x1: 0, y1: 0, t: -i * 0.08, dur: 0.6 });
        for (let i = 0; i < 8; i++) st.dust.push({ x: c.x + U.rand(-50, 50), y: c.y + U.rand(-4, 8), vx: U.rand(-60, 60), vy: U.rand(-20, 10), t: 0, dur: U.rand(0.4, 0.7), r: U.rand(7, 12), area: 'arena' });
        st.cheer = Math.max(st.cheer, 0.8);
        if (v === d) { g.s.mtrucks.crushed++; Sfx.drop(); Haptics.tap(); }
      }
    }
  },
  stepCars(g, dt) {
    const M = CFG.MTRUCKS, F = M.FORK, st = this.st, f = st.fork;
    for (const c of st.cars) { c.t += dt; if (c.flat) c.flatT += dt; }
    f.lift += (f.liftTo - f.lift) * Math.min(1, dt * 6);
    // the chef drives it: any job is finished on the spot (a fresh car pops into place); hopping out, it drives home
    if (g.driving && g.vehicle === f) {
      if (f.car && !f.swapped && (f.phase === 'in' || f.phase === 'swap')) { f.car.flat = false; f.car.t = 0; f.car.flatT = 0; }
      f.phase = 'driven'; f.car = null; f.load = null;
      const c = Math.cos(f.angle); if (c > 0.2) f.face = 1; else if (c < -0.2) f.face = -1;
      return;
    }
    if (f.phase === 'driven') { f.phase = 'home'; f.liftTo = 0; }
    const P = F.PARK;
    if (f.phase === 'parked') {
      f.x = P.x; f.y = P.y; f.face = -1; f.angle = Math.PI;
      const c = st.cars.filter((q) => q.flat && q.flatT > M.REFILL).sort((a, b) => b.x - a.x)[0];
      if (c) { f.car = c; f.phase = 'fetch'; f.swapped = false; f.t = 0; }
      return;
    }
    if (f.phase === 'home') { f.face = f.x > P.x ? -1 : 1; if (U.moveToward(f, P.x, P.y, F.speed * 0.6, dt)) f.phase = 'parked'; return; }
    if (f.phase === 'fetch') { f.face = 1; if (U.moveToward(f, F.x + 30, F.y, F.speed, dt)) { f.t += dt; if (f.t > 0.5) { f.phase = 'in'; f.load = 'fresh'; f.t = 0; } } return; }
    if (f.phase === 'in') { f.face = -1; if (U.moveToward(f, f.car.x + F.reach, F.y, F.speed, dt)) { f.phase = 'swap'; f.t = 0; } return; }
    if (f.phase === 'swap') {
      f.t += dt;
      if (f.t >= 0.6 && !f.swapped) {
        f.swapped = true; f.load = 'flat'; f.car.flat = false; f.car.t = 0; f.car.flatT = 0;
        if (g.area === 'arena') { g.fx.push({ kind: 'sparkle', x0: f.car.x, y0: f.car.y - 30, x1: 0, y1: 0, t: 0, dur: 0.6 }); g.floats.push({ x: f.car.x, y: f.car.y - 70, text: 'A fresh one! 🚗', color: '#ffffff', t: 0, dur: 1.2 }); }
      }
      if (f.t >= 1.2) { f.phase = 'out'; f.face = 1; }
      return;
    }
    if (f.phase === 'out' && U.moveToward(f, F.x + 30, F.y, F.speed, dt)) { f.load = null; f.car = null; f.phase = 'home'; }
  },
  forkBusy() { const f = this.st.fork; return f.phase !== 'parked' && f.phase !== 'home' && f.phase !== 'driven'; },
  stepBits(dt) {
    const st = this.st;
    for (const p of st.dust) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
    st.dust = st.dust.filter((p) => p.t < p.dur); if (st.dust.length > 160) st.dust.splice(0, st.dust.length - 160);
    for (const p of st.sparks) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= 900 * dt; p.z = Math.max(0, p.z + p.vz * dt); }
    st.sparks = st.sparks.filter((p) => p.t < p.dur);
    for (const p of st.confetti) { p.t += dt; p.x += p.vx * dt; p.vy += 260 * dt; p.y += p.vy * dt; p.vx *= 0.98; p.a += dt * 8; }
    st.confetti = st.confetti.filter((p) => p.t < p.dur);
    for (const p of st.pops) p.t += dt;
    st.pops = st.pops.filter((p) => p.t < p.dur);
    for (const m of st.marks) m.t += dt;
    st.marks = st.marks.filter((m) => m.t < 30);
  },

  // ---------------- rescues ----------------
  rescue(g) {
    const M = CFG.MTRUCKS, p = g.player, d = this.driven(g);
    if (g.area === 'arena') {
      const F = M.FLOOR, obs = this.obstacles(g);
      const out = (x, y, r) => x < F.x0 + r || x > F.x1 - r || y < g.walkTop() || y > F.y1 - r || obs.some((o) => g.hitRect(x, y, r, o));
      if (!g.driving && out(p.x, p.y, 12)) { p.x = M.ARRIVE.x; p.y = M.ARRIVE.y; p.moving = false; g.cameraSnap = true; g.floats.push({ x: p.x, y: p.y - 60, text: 'Oops! Back by the tunnel', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
      for (const v of this.trucks) {
        if (v.area !== 'arena' || v === d || v.air || v.donut) continue;
        if (out(v.x, v.y, 30)) { this.still(v); if (v.ai) { const w = M.AI.path[v.wp]; v.x = w[0]; v.y = w[1]; } else { v.x = M.ARENA_PARK.x; v.y = M.ARENA_PARK.y; } }
      }
      const f = this.st.fork, P = M.FORK.PARK;
      if ((f.phase === 'parked' || f.phase === 'home' || f.phase === 'driven') && out(f.x, f.y, 20)) { f.x = P.x; f.y = P.y; if (g.vehicle === f) { g.player.x = f.x; g.player.y = f.y; } else f.phase = 'parked'; }
      if (d && !d.air && !d.donut && out(d.x, d.y, 20)) { this.still(d); d.x = M.ARRIVE.x; d.y = M.ARRIVE.y + 12; g.player.x = d.x; g.player.y = d.y; g.cameraSnap = true; }
    } else if (g.area === 'site') {
      const obs = g.obstacles(), G = M.GATE;
      if (!g.driving && p.x > G.x0 - 8 && p.x < G.x1 + 8 && p.y > G.y0 - 8 && p.y < G.y1 + 10) { p.x = M.DOOR.x; p.y = M.DOOR.y + 22; p.moving = false; }
      for (const v of this.trucks) {
        if (v.area !== 'site' || v === d || v.air || v.donut) continue;
        if (obs.some((o) => o.w && g.hitRect(v.x, v.y, 20, o))) this.park(v);
      }
    }
  },

  // ================= hooks: obstacles, button, hint, home =================
  obstacles(g) {
    const M = CFG.MTRUCKS;
    if (g.area === 'site') { const G = M.GATE; return [{ x: G.x0, y: G.y0, w: G.x1 - G.x0, h: G.y1 - G.y0 }]; }
    if (g.area !== 'arena') return [];
    const W = M.WORLD, F = M.FLOOR;
    return [
      { x: W.x0, y: W.y0, w: F.x0 - W.x0, h: W.y1 - W.y0 },          // west wall
      { x: F.x1, y: W.y0, w: W.x1 - F.x1, h: W.y1 - W.y0 },          // east wall
      { x: W.x0, y: F.y1, w: W.x1 - W.x0, h: W.y1 - F.y1 },          // the south wall and its crowd
    ];
  },
  action(g) {
    if (!this.st || this.busy(g)) return null;
    const M = CFG.MTRUCKS, d = this.driven(g), p = g.player;
    if (d) { const k = this.trickFor(d); return k ? { label: M.LABELS[k], run: (gg) => this.doTrick(gg, d, k) } : null; }
    const f = this.st.fork;
    if (g.driving && g.vehicle === f) return f.liftTo ? { label: '⬇️ Forks down', run: () => { f.liftTo = 0; Sfx.drop(); } } : { label: '⬆️ Forks up', run: () => { f.liftTo = 1; Sfx.pickup(); } };
    if (g.driving) return null;
    if (g.area === 'site' && U.dist(p.x, p.y, M.DOOR.x, M.DOOR.y) < M.DOOR_R) return { label: '🏟️ Go to the arena', run: (gg) => this.enterArena(gg, null) };
    if (g.area === 'arena' && U.dist(p.x, p.y, M.TUNNEL_DOOR.x, M.TUNNEL_DOOR.y) < M.DOOR_R) return { label: '🏁 Back to the dirt track', run: (gg) => this.leaveArena(gg, null) };
    return null;
  },
  hint(g) {
    if (!this.st || this.busy(g)) return undefined;
    const M = CFG.MTRUCKS, p = g.player, d = this.driven(g);
    if (g.area === 'arena') {
      if (d) {
        if (d.air) return { text: d.flip ? (d.flip.dir < 0 ? 'Front flip! 🔃' : 'Backflip! 🔄') : 'Up in the air! Press 🔄 Backflip!', target: null };
        if (Math.abs(d.x - M.TUNNEL.x) < 200 && d.y < M.TUNNEL_TRIG + 160 && d.vy < -30) return { text: 'Drive up into the tunnel to go back 🏁', target: null };
        return { text: this.st.cars.some((c) => !c.flat) ? 'Jump the hills! Crush the cars! 💥' : 'Jump the dirt hills! 🏁', target: null };
      }
      if (g.driving) return g.vehicle === this.st.fork ? { text: 'Beep beep! Lift the forks up and down 🚜', target: null } : null;
      if (U.dist(p.x, p.y, M.TUNNEL_DOOR.x, M.TUNNEL_DOOR.y) < M.DOOR_R) return { text: 'Back to the dirt track 🏁', target: null };
      if (U.dist(p.x, p.y, this.st.fork.x, this.st.fork.y) < 90) return { text: 'Drive the forklift! 🚜', target: null };
      const v = this.trucks.filter((t) => t.area === 'arena').sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
      if (!v) return null;
      return { text: 'Hop in a monster truck! 🐂👻', target: U.dist(p.x, p.y, v.x, v.y) < 70 ? null : v };
    }
    if (g.area === 'site') {
      if (d && !this.st.armed) return { text: 'Back at the dirt track! Jump the little hills 🏁', target: null };   // just came out
      if (d) return { text: 'Drive into the big gate to the arena! 🏟️', target: U.dist(p.x, p.y, M.DOOR.x, M.DOOR.y) < 100 ? null : M.DOOR };
      if (g.driving) return undefined;
      if (U.dist(p.x, p.y, M.DOOR.x, M.DOOR.y) < M.DOOR_R) return { text: 'The Monster Truck Arena! 🏟️', target: null };
      if (this.trucks.some((v) => v.area === 'site' && U.dist(p.x, p.y, v.x, v.y) < 130)) return { text: 'Drive a monster truck! 🐂👻', target: null };
    }
    return undefined;
  },
  home(g) {
    if (!this.trucks) return;
    for (const v of this.trucks) this.park(v);
    const st = this.st, f = st.fork; st.turn = null; st.armed = true; st.gateCd = 0; Object.assign(f, { x: CFG.MTRUCKS.FORK.PARK.x, y: CFG.MTRUCKS.FORK.PARK.y, angle: Math.PI, vx: 0, vy: 0, face: -1, phase: 'parked', car: null, load: null, lift: 0, liftTo: 0 }); st.fade = 0; st.dust = []; st.sparks = []; st.confetti = []; st.pops = []; st.mine = this.trucks[0]; st.next = 'wheelie';
    for (const c of st.cars) { c.flat = false; c.flatT = 0; }
  },

  // ================= drawing =================
  vis(r, x0, y0, x1, y1) { return x1 > r.camX - 40 && x0 < r.camX + r.viewW + 40 && y1 > r.camY - 40 && y0 < r.camY + r.viewH + 40; },
  paint: { arena(r, g) { MonsterTrucksExt.paintArena(r, g); } },
  bgKey() { return ''; },

  // the arena's static art: dirt, stands, walls, the tunnel, the big screen's frame, the hills, the crush zone
  paintArena(r, g) {
    const ctx = r.ctx, M = CFG.MTRUCKS, W = M.WORLD, F = M.FLOOR, fw = F.x1 - F.x0, fh = F.y1 - F.y0;
    ctx.fillStyle = '#4a3b5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // the dirt floor: speckles, darker blotches and old tyre tracks
    ctx.fillStyle = '#b8834f'; ctx.fillRect(F.x0, F.y0, fw, fh);
    for (let i = 0; i < 420; i++) {
      const x = F.x0 + ((i * 7919) % fw), y = F.y0 + ((i * 3571) % fh);
      ctx.fillStyle = i % 3 ? 'rgba(120,78,40,0.16)' : 'rgba(255,230,190,0.18)';
      ctx.beginPath(); ctx.ellipse(x, y, 6 + (i % 7) * 3, 3 + (i % 5) * 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(70,45,20,0.12)'; ctx.lineWidth = 12;
    for (const [cx, cy, rx, ry] of [[37200, 5800, 900, 360], [37200, 5800, 760, 300], [36800, 6150, 380, 90], [37900, 5500, 300, 120]]) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
    // the crush zone: hazard stripes round the junk-car row
    const C = M.CARS, z0 = C.xs[0] - 90, z1 = C.xs[C.xs.length - 1] + 90, zy0 = C.y - 52, zy1 = C.y + 40;
    ctx.fillStyle = 'rgba(90,60,30,0.25)'; ctx.fillRect(z0, zy0, z1 - z0, zy1 - zy0);
    ctx.save(); ctx.beginPath(); ctx.rect(z0, zy0, z1 - z0, zy1 - zy0); ctx.rect(z0 + 10, zy0 + 10, z1 - z0 - 20, zy1 - zy0 - 20); ctx.clip('evenodd');
    ctx.fillStyle = '#ffd166'; ctx.fillRect(z0, zy0, z1 - z0, zy1 - zy0);
    ctx.fillStyle = '#2b2b2b'; for (let x = z0 - 100; x < z1 + 100; x += 28) { ctx.beginPath(); ctx.moveTo(x, zy1); ctx.lineTo(x + 14, zy1); ctx.lineTo(x + 14 + (zy1 - zy0), zy0); ctx.lineTo(x + (zy1 - zy0), zy0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // the dirt hills
    for (const rp of M.RAMPS) { this.paintRamp(ctx, rp); this.paintRampSign(r, rp); }
    // ---- the north stand: rows of seats (the crowd is drawn live), a concrete front wall, the tunnel, the big screen
    const sy0 = W.y0, sy1 = F.y0;
    ctx.fillStyle = '#26324a'; ctx.fillRect(W.x0, sy0, W.x1 - W.x0, sy1 - sy0);
    const rows = 6, rh = 34, cols = ['#3b7dd8', '#e4572e', '#ffd166', '#41b883'];
    for (let i = 0; i < rows; i++) {
      const y = sy0 + 20 + i * rh;
      for (let x = W.x0, k = 0; x < W.x1; x += 300, k++) { ctx.fillStyle = cols[(k + i) % cols.length]; ctx.fillRect(x, y + 14, 300, 14); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(W.x0, y + 26, W.x1 - W.x0, 4);
    }
    // aisles (stairs) between the sections
    ctx.fillStyle = '#9aa0a8'; for (let x = W.x0 + 150; x < W.x1; x += 300) { ctx.fillRect(x - 8, sy0 + 20, 16, rows * rh); ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = sy0 + 26; y < sy0 + 20 + rows * rh; y += 9) ctx.fillRect(x - 8, y, 16, 2); ctx.fillStyle = '#9aa0a8'; }
    // the front wall, with bright panels (stars and flames, no words)
    ctx.fillStyle = '#e9e4da'; ctx.fillRect(W.x0, sy1 - 34, W.x1 - W.x0, 34);
    ctx.fillStyle = '#c9c2b5'; ctx.fillRect(W.x0, sy1 - 6, W.x1 - W.x0, 6);
    for (let x = W.x0 + 40, k = 0; x < W.x1 - 60; x += 220, k++) {
      if (Math.abs(x + 80 - M.TUNNEL.x) < 160) continue;
      ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883', '#8e5bd1'][k % 4]; U.roundRect(ctx, x, sy1 - 30, 160, 22, 5); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(['⭐ ⭐ ⭐', '🔥 🔥 🔥', '🏁 🏁 🏁', '💥 💥 💥'][k % 4], x + 80, sy1 - 19);
    }
    this.paintTunnel(r, ctx, M.TUNNEL.x, sy1, 70, 106);
    ctx.font = r.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏁', M.TUNNEL.x, sy1 - 126);
    // the big screen's frame (its picture is live)
    ctx.fillStyle = '#1e1e24'; U.roundRect(ctx, 36990, sy0 + 8, 420, 120, 10); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(37050, sy0 + 128, 12, 60); ctx.fillRect(37338, sy0 + 128, 12, 60);
    // light towers at the stand's ends
    for (const x of [36090, 38310]) {
      ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 5, sy0 + 30, 10, 200);
      ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, x - 34, sy0 + 4, 68, 32, 5); ctx.fill();
      ctx.fillStyle = '#fff6b0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(x - 24 + i * 16, sy0 + 13 + j * 14, 5, 0, Math.PI * 2); ctx.fill(); }
    }
    // ---- the side walls: concrete with a row of big tyres along the dirt; the forklift's service door on the east
    for (const [x0, x1, inner] of [[W.x0, F.x0, F.x0], [F.x1, W.x1, F.x1]]) {
      ctx.fillStyle = '#b9b5ad'; ctx.fillRect(x0, F.y0 - 10, x1 - x0, F.y1 - F.y0 + 10);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = F.y0; y < F.y1; y += 60) ctx.fillRect(x0, y, x1 - x0, 3);
      const tx = inner === F.x0 ? inner - 14 : inner + 14;
      for (let y = F.y0 + 30; y < F.y1 - 10; y += 30) {
        if (inner === F.x1 && Math.abs(y - M.FORK.y) < 70) continue;
        ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.ellipse(tx, y, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.ellipse(tx, y, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = (y / 30) % 2 ? '#e4572e' : '#ffd166'; ctx.beginPath(); ctx.ellipse(tx, y, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // the service door (a dark opening with hazard stripes either side)
    const Fk = M.FORK;
    ctx.fillStyle = '#1c1410'; ctx.fillRect(F.x1, Fk.y - 62, W.x1 - F.x1, 92);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(F.x1, Fk.y - 40, W.x1 - F.x1, 70);
    for (const y of [Fk.y - 72, Fk.y + 30]) for (let x = F.x1; x < W.x1; x += 12) { ctx.fillStyle = ((x - F.x1) / 12) % 2 ? '#2b2b2b' : '#ffd166'; ctx.fillRect(x, y, 12, 10); }
    // ---- the south wall: a low barrier with flag panels, the front rows of the crowd behind it (drawn live)
    ctx.fillStyle = '#3a2f4a'; ctx.fillRect(W.x0, F.y1, W.x1 - W.x0, W.y1 - F.y1);
    ctx.fillStyle = '#e9e4da'; ctx.fillRect(W.x0, F.y1, W.x1 - W.x0, 30);
    for (let x = W.x0 + 20, k = 0; x < W.x1 - 40; x += 120, k++) { ctx.fillStyle = k % 2 ? '#e4572e' : '#3b7dd8'; ctx.fillRect(x, F.y1 + 6, 80, 18); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(W.x0, F.y1 + 28, W.x1 - W.x0, 4);
  },
  // a big sign beside each arena hill: a curly arrow showing which way the truck will flip (or a straight one: just a jump)
  paintRampSign(r, rp) {
    const ctx = r.ctx, x = rp.x + rp.rx + 46, y = rp.y - 10, trick = rp.trick;
    const col = trick === 'back' ? '#3b7dd8' : trick === 'front' ? '#e4572e' : '#41b883';
    const ico = trick === 'back' ? '🔄' : trick === 'front' ? '🔃' : '⬆️';
    const word = trick === 'back' ? 'BACKFLIP' : trick === 'front' ? 'FRONT FLIP' : 'JUMP';
    ctx.fillStyle = 'rgba(60,35,15,0.3)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 4, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 4, y - 70, 8, 72);
    ctx.fillStyle = col; U.roundRect(ctx, x - 52, y - 128, 104, 64, 12); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; U.roundRect(ctx, x - 52, y - 128, 104, 64, 12); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = r.font(30); ctx.fillText(ico, x, y - 104);
    ctx.fillStyle = '#ffffff'; ctx.font = r.font(12, 900); ctx.fillText(word, x, y - 76);
  },
  paintRamp(ctx, rp) {
    // a round dirt hill seen from above and a little in front: its shadow, then layers getting smaller, higher and
    // sunnier towards the top, and a few loose clods
    const h = rp.h, n = 6;
    ctx.fillStyle = 'rgba(60,35,15,0.3)'; ctx.beginPath(); ctx.ellipse(rp.x + 10, rp.y + 8, rp.rx * 1.05, rp.ry * 0.95, 0, 0, Math.PI * 2); ctx.fill();
    const cols = ['#7a4e27', '#87592e', '#956535', '#a5733f', '#b8864e', '#cb9a62'];
    for (let i = 0; i < n; i++) {
      const k = i / n, sc = 1 - k * 0.72;
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.ellipse(rp.x - k * rp.rx * 0.06, rp.y - k * h * 1.5, rp.rx * sc, rp.ry * sc, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,240,210,0.35)'; ctx.beginPath(); ctx.ellipse(rp.x - rp.rx * 0.14, rp.y - h * 1.38, rp.rx * 0.16, rp.ry * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a4321'; for (let i = 0; i < 7; i++) { const a = i * 2.3, rr = 0.55 + (i % 3) * 0.15; ctx.beginPath(); ctx.ellipse(rp.x + Math.cos(a) * rp.rx * rr, rp.y + Math.sin(a) * rp.ry * rr - h * 0.4, 3 + (i % 2) * 2, 2, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  // a stadium tunnel's arch in a wall whose foot is at y (dark inside, lights, a chequered trim, dirt running in)
  paintTunnel(r, ctx, x, y, half, tall) {
    const top = y - tall, R = half;
    ctx.fillStyle = '#e9e4da'; ctx.beginPath(); ctx.moveTo(x - half - 16, y); ctx.lineTo(x - half - 16, top + R); ctx.arc(x, top + R, R + 16, Math.PI, 0); ctx.lineTo(x + half + 16, y); ctx.closePath(); ctx.fill();
    // the chequered trim
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - half - 10, y); ctx.lineTo(x - half - 10, top + R); ctx.arc(x, top + R, R + 10, Math.PI, 0); ctx.lineTo(x + half + 10, y); ctx.closePath(); ctx.clip();
    for (let i = 0; i < 40; i++) for (let j = 0; j < 30; j++) { ctx.fillStyle = (i + j) % 2 ? '#2b1d14' : '#ffffff'; ctx.fillRect(x - half - 10 + i * 8, top - 10 + j * 8, 8, 8); }
    ctx.restore();
    const arch = (inset) => { ctx.beginPath(); ctx.moveTo(x - half + inset, y); ctx.lineTo(x - half + inset, top + R); ctx.arc(x, top + R, R - inset, Math.PI, 0); ctx.lineTo(x + half - inset, y); ctx.closePath(); };
    ctx.fillStyle = '#3a2c22'; arch(0); ctx.fill();
    ctx.fillStyle = '#261c15'; arch(half * 0.22); ctx.fill();
    ctx.fillStyle = '#140e0a'; arch(half * 0.45); ctx.fill();
    ctx.fillStyle = '#8f5f32'; ctx.beginPath(); ctx.moveTo(x - half, y); ctx.lineTo(x - half * 0.5, y - tall * 0.3); ctx.lineTo(x + half * 0.5, y - tall * 0.3); ctx.lineTo(x + half, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9a0'; for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (R - 8), top + R + Math.sin(a) * (R - 8), 3, 0, Math.PI * 2); ctx.fill(); }
  },

  // Construction Town's static bits: the parking bays and the baby jumps on the dirt track
  paintAfter(r, g, area) {
    if (area !== 'site') return;
    const ctx = r.ctx, M = CFG.MTRUCKS;
    for (const k of this.KINDS) {
      const P = M.PARK[k];
      ctx.fillStyle = 'rgba(120,80,40,0.35)'; U.roundRect(ctx, P.x - 98, P.y - 30, 196, 46, 10); ctx.fill();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]); U.roundRect(ctx, P.x - 98, P.y - 30, 196, 46, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k === 'eltoro' ? '🐂' : '👻', P.x + 112, P.y - 6);
    }
    for (const rp of M.SITE_RAMPS) this.paintRamp(ctx, rp);
  },

  // under everything that moves: donut rings, shadows, the arena's sky, crowd and flags
  dynamic(r, g) {
    if (!this.st || (g.area !== 'site' && g.area !== 'arena')) return;
    const ctx = r.ctx, st = this.st;
    if (g.area === 'arena') this.drawCrowd(r, g);
    for (const m of st.marks) {
      if (m.area !== g.area || !this.vis(r, m.x - 100, m.y - 40, m.x + 100, m.y + 40)) continue;
      ctx.strokeStyle = `rgba(60,35,15,${0.35 * (1 - m.t / 30)})`; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.ellipse(m.x, m.y, 84, 28, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(m.x, m.y, 60, 19, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const v of this.trucks) {
      if (v.area !== g.area || !this.vis(r, v.x - 120, v.y - 30, v.x + 120, v.y + 30)) continue;
      const gz = v.air ? this.groundZ(g, v.x, v.y) : Math.min(v.z, this.groundZ(g, v.x, v.y)), up = Math.max(0, v.z - gz), k = 1 / (1 + up / 320);
      const len = 96;
      ctx.fillStyle = `rgba(30,15,5,${0.42 * k})`; ctx.beginPath(); ctx.ellipse(v.x, v.y - gz + 2, len * k, 18 * k, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawCrowd(r, g) {
    const ctx = r.ctx, M = CFG.MTRUCKS, W = M.WORLD, F = M.FLOOR, st = this.st, t = g.time;
    const xa = Math.max(W.x0 + 10, r.camX - 30), xb = Math.min(W.x1 - 10, r.camX + r.viewW + 30);
    // the sky over the stand (seen at the top of the screen)
    if (r.camY < W.y0) { ctx.fillStyle = '#7ec8f0'; ctx.fillRect(r.camX - 10, r.camY - 10, r.viewW + 20, W.y0 - r.camY + 10); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 5; i++) { const cx = W.x0 + ((i * 523 + t * 9) % (W.x1 - W.x0)); if (cx < xa - 80 || cx > xb + 80) continue; ctx.beginPath(); ctx.ellipse(cx, W.y0 - 30 - (i % 3) * 18, 50, 14, 0, 0, Math.PI * 2); ctx.fill(); } }
    const SK = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'], SH = ['#e4572e', '#3b7dd8', '#ffd166', '#41b883', '#ff8fab', '#ffffff', '#8e5bd1', '#ff8c42'];
    const cheer = st.cheer, wave = cheer > 0.45;
    const person = (x, y, i, back) => {
      const h = Math.abs(Math.sin(t * (6 + (i % 3)) + i * 1.7)) * (1.2 + cheer * 7);
      ctx.fillStyle = SH[i % SH.length]; ctx.beginPath(); ctx.ellipse(x, y + 6 - h * 0.5, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
      if (wave && i % 2) { ctx.strokeStyle = SK[(i * 3) % SK.length]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 6, y + 2 - h); ctx.lineTo(x - 11, y - 12 - h); ctx.moveTo(x + 6, y + 2 - h); ctx.lineTo(x + 11, y - 12 - h); ctx.stroke(); }
      ctx.fillStyle = SK[(i * 3) % SK.length]; ctx.beginPath(); ctx.arc(x, y - 6 - h, 6.5, 0, Math.PI * 2); ctx.fill();
      if (!back && i % 5 === 0) { ctx.fillStyle = SH[(i + 3) % SH.length]; ctx.fillRect(x - 7, y - 13 - h, 14, 4); }   // a cap
      if (back) { ctx.fillStyle = 'rgba(60,40,20,0.6)'; ctx.beginPath(); ctx.arc(x, y - 8 - h, 5, Math.PI, 0); ctx.fill(); }
    };
    // the north stand: six rows (skipping the tunnel, the aisles and the big screen)
    if (r.camY < F.y0 + 10) {
      for (let row = 0; row < 6; row++) {
        const y = W.y0 + 34 + row * 34;
        for (let x = xa - ((xa - W.x0) % 22) + 11, i = Math.floor((xa - W.x0) / 22) * 7 + row * 131; x < xb; x += 22, i += 7) {
          const ax = (x - W.x0) % 300; if (ax > 138 && ax < 162) continue;
          if (Math.abs(x - M.TUNNEL.x) < 100 && row > 1) continue;
          if (x > 36980 && x < 37420 && row < 4) continue;
          if ((i * 13) % 11 === 0) continue;   // an empty seat here and there
          person(x, y, i, false);
        }
      }
      // the big screen: the two trucks, and a big WOW when something great happens
      if (this.vis(r, 36990, W.y0, 37410, W.y0 + 130)) {
        ctx.fillStyle = cheer > 0.5 ? (Math.floor(t * 6) % 2 ? '#2d1b4e' : '#14324f') : '#10223a'; ctx.fillRect(37004, W.y0 + 20, 392, 96);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (cheer > 0.5) { ctx.font = r.font(36); ctx.fillStyle = '#ffd166'; ctx.fillText('💥 WOW! 💥', 37200, W.y0 + 70); }
        else { ctx.font = r.font(40); ctx.fillText('🐂', 37110, W.y0 + 70); ctx.fillText('👻', 37290, W.y0 + 70); ctx.font = r.font(22); ctx.fillStyle = '#ffd166'; ctx.fillText('⚡', 37200, W.y0 + 70); }
      }
      // flags along the top of the stand
      for (let x = W.x0 + 100, k = 0; x < W.x1; x += 200, k++) {
        if (x < xa - 60 || x > xb + 60 || (x > 36960 && x < 37440)) continue;
        ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 2, W.y0 - 46, 4, 62);
        const col = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', 'check'][k % 5], wv = Math.sin(t * 5 + k);
        ctx.beginPath(); ctx.moveTo(x + 2, W.y0 - 46); ctx.quadraticCurveTo(x + 18, W.y0 - 50 + wv * 5, x + 36, W.y0 - 42 + wv * 3); ctx.lineTo(x + 36, W.y0 - 22 + wv * 3); ctx.quadraticCurveTo(x + 18, W.y0 - 30 + wv * 5, x + 2, W.y0 - 26); ctx.closePath();
        if (col === 'check') { ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) ctx.fillRect(x + 2 + i * 7, W.y0 - 52 + j * 8 + wv * 3, 7, 8); ctx.restore(); }
        else { ctx.fillStyle = col; ctx.fill(); }
      }
    }
    // the front rows behind the south wall (seen from behind)
    if (r.camY + r.viewH > F.y1 + 30) for (let row = 0; row < 2; row++) {
      const y = F.y1 + 50 + row * 30;
      for (let x = xa - ((xa - W.x0) % 26) + 13 + row * 13, i = Math.floor((xa - W.x0) / 26) * 5 + row * 77; x < xb; x += 26, i += 5) person(x, y, i, true);
    }
  },

  entities(r, g, items) {
    if (!this.st || (g.area !== 'site' && g.area !== 'arena')) return;
    const st = this.st, M = CFG.MTRUCKS;
    for (const v of this.trucks) {
      if (v.area !== g.area || !this.vis(r, v.x - 130, v.y - v.z - 220, v.x + 130, v.y + 20)) continue;
      items.push({ y: v.y, draw: () => this.drawTruckEntity(r, g, v) });
    }
    if (g.area === 'site') {
      const G = M.GATE;
      if (this.vis(r, G.x0 - 20, G.y1 - 260, G.x1 + 40, G.y1)) items.push({ y: G.y1, draw: () => this.drawGateCached(r, g) });
      return;
    }
    for (const c of st.cars) {
      if (!this.vis(r, c.x - 70, c.y - 60, c.x + 70, c.y + 10)) continue;
      items.push({ y: c.y, draw: () => this.drawJunkCar(r, g, c, c.x, c.y, 1) });
    }
    const f = st.fork;
    if (this.vis(r, f.x - 160, f.y - 120, f.x + 160, f.y + 10)) {
      items.push({ y: f.y, draw: () => this.drawForklift(r, g, f) });
      // the load slides between the forks and the row during the swap
      if (f.phase === 'swap') {
        const k = U.clamp(f.t / 0.6, 0, 1), k2 = U.clamp((f.t - 0.6) / 0.6, 0, 1), fx = f.x - M.FORK.reach, fy = f.y - 8;
        if (!f.swapped) { const y = U.lerp(fy, f.car.y, k); items.push({ y: y + 1, draw: () => this.drawJunkCar(r, g, { color: f.car.color, flat: false, t: 9, i: f.car.i }, fx, y - Math.sin(k * Math.PI) * 24, 1) }); }
        else { const y = U.lerp(f.car.y, fy, k2); items.push({ y: y + 1, draw: () => this.drawJunkCar(r, g, { color: '#8a8a8a', flat: true, t: 9, i: f.car.i }, fx, y - Math.sin(k2 * Math.PI) * 20, 1) }); }
      }
    }
  },
  drawTruckEntity(r, g, v) {
    const ctx = r.ctx, M = CFG.MTRUCKS, driven = g.driving && g.vehicle === v;
    let sx = v.face;   // always full width: no squish when driving up or down the screen
    if (v.donut) { sx = Math.cos(v.donut.a) * v.face; if (Math.abs(sx) < 0.06) sx = sx < 0 ? -0.06 : 0.06; }
    const wa = this.wheelieAngle(v), fa = this.flipAngle(v), bump = v.bump > 0 ? Math.sin((1 - v.bump) * Math.PI) * 14 : 0;
    const idle = !driven && !v.donut && !v.air && !wa && !fa && !bump && !(v.z > 0.5) && Math.hypot(v.vx || 0, v.vy || 0) < 4;
    if (idle && typeof document !== 'undefined') this.drawTruckCached(r, g, v, sx);
    else {
      ctx.save(); ctx.translate(v.x, v.y - v.z - bump); ctx.scale(sx, 1);
      if (wa) { ctx.translate(-M.WB, 0); ctx.rotate(-wa); ctx.translate(M.WB, 0); }
      if (fa) { ctx.translate(0, -70); ctx.rotate(-fa); ctx.translate(0, 70); }
      this.drawTruck(ctx, r, g, v.kind, v, driven);
      ctx.restore();
    }
    // pizzas riding along, and the "hop in" bubble above the roof
    if (driven && g.player.carry > 0) r.drawRidingExtras(g, v, 150 + v.z);
    if (!g.driving && g.nearVehicle === v) {
      const bob = Math.sin(g.time * 5) * 3, label = CFG.VEHICLES[v.kind].label + '!';
      r.drawBubble(v.x, v.y - 192 + bob, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(label, 0, 0); }, 64);
    }
  },

  // A parked truck looks the same frame after frame: draw it once into a small canvas (at the screen's pixel scale) and
  // stamp that, so two big trucks on screen cost almost nothing. Moving, driven or tricking trucks are drawn live.
  drawTruckCached(r, g, v, sx) {
    const sc = Math.max(0.25, r.scale * r.dpr), key = v.kind + '|' + sx.toFixed(2) + '|' + sc.toFixed(2);
    if (!this.spr || Object.keys(this.spr).length > 16) this.spr = {};
    let c = this.spr[key];
    if (!c) {
      c = document.createElement('canvas'); c.width = Math.ceil(400 * sc); c.height = Math.ceil(320 * sc);
      const x = c.getContext('2d'); x.scale(sc, sc); x.translate(200, 260); x.scale(sx, 1);
      this.drawTruck(x, r, g, v.kind, v, false);
      this.spr[key] = c;
    }
    r.ctx.drawImage(c, v.x - 200, v.y - v.z - 260, 400, 320);
  },

  // ---------------- the trucks (side view, at the origin = the ground under the middle, nose +x) ----------------
  tyre(ctx, cx, cy, R, rot, rim, far) {
    ctx.fillStyle = far ? '#0c0c0c' : '#1b1b1b'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = rot + i * Math.PI / 7, c = Math.cos(a), s = Math.sin(a), o = R + 3, n = R - 7, w = 4.2;
      ctx.moveTo(cx + c * o - s * w, cy + s * o + c * w); ctx.lineTo(cx + c * o + s * w, cy + s * o - c * w);
      ctx.lineTo(cx + c * n + s * w, cy + s * n - c * w); ctx.lineTo(cx + c * n - s * w, cy + s * n + c * w); ctx.closePath();
    }
    ctx.fillStyle = far ? '#141414' : '#262626'; ctx.fill();
    if (far) { ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.fillStyle = '#323232'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R * 0.47, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 5; i++) { const a = rot + i * Math.PI * 0.4; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3, 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, -2.7, -1.5); ctx.stroke();
  },
  drawTruck(ctx, r, g, kind, v, driven) {
    const M = CFG.MTRUCKS, R = M.WR, WB = M.WB, t = g.time, toro = kind === 'eltoro';
    const sp = Math.hypot(v.vx || 0, v.vy || 0), rot = v.rot || 0;
    const by = U.clamp(v.sq || 0, -0.8, 1.2) * -12 + Math.sin(t * 13 + (toro ? 0 : 2)) * Math.min(1, sp / 220) * 2;   // the body rides on the springs
    const rim = toro ? '#ffb347' : '#7cfc00';
    // far-side tyres, a little up and back
    this.tyre(ctx, -WB + 6, -R - 6, R, rot, rim, true); this.tyre(ctx, WB + 6, -R - 6, R, rot, rim, true);
    // the frame and the long springy shocks
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-78, -72 + by, 156, 9);
    for (const wx of [-WB, WB]) {
      ctx.fillStyle = '#555'; ctx.fillRect(wx - 3, -66 + by, 6, 66 - by - R);
      ctx.strokeStyle = toro ? '#ffd166' : '#b388ff'; ctx.lineWidth = 3.5; ctx.beginPath();
      const y0 = -R - 4, y1 = -66 + by, n = 5;
      for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; if (i === 0) ctx.moveTo(wx - 7, y); else ctx.lineTo(wx + (i % 2 ? 7 : -7), y); }
      ctx.stroke();
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(wx - 9, -R - 5, 18, 8);
    }
    if (toro) this.bodyToro(ctx, r, g, v, by, driven); else this.bodyDigger(ctx, r, g, v, by, driven);
    this.tyre(ctx, -WB, -R, R, rot, rim, false); this.tyre(ctx, WB, -R, R, rot, rim, false);
  },
  // the shared pickup-truck shape (bed at the back, the cab, a long hood)
  bodyPath(ctx, by) {
    ctx.beginPath();
    ctx.moveTo(-90, -64 + by); ctx.lineTo(-90, -102 + by); ctx.lineTo(-22, -102 + by); ctx.lineTo(-17, -126 + by);
    ctx.quadraticCurveTo(-15, -131 + by, -9, -131 + by); ctx.lineTo(16, -131 + by); ctx.quadraticCurveTo(22, -130 + by, 26, -125 + by);
    ctx.lineTo(38, -102 + by); ctx.lineTo(78, -98 + by); ctx.quadraticCurveTo(93, -96 + by, 94, -82 + by); ctx.lineTo(94, -64 + by); ctx.closePath();
  },
  cab(ctx, by, glass, driven) {
    ctx.fillStyle = glass; ctx.beginPath(); ctx.moveTo(-12, -124 + by); ctx.lineTo(16, -125 + by); ctx.lineTo(27, -105 + by); ctx.lineTo(-12, -105 + by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.moveTo(16, -123 + by); ctx.lineTo(19, -123 + by); ctx.lineTo(27, -107 + by); ctx.lineTo(24, -107 + by); ctx.closePath(); ctx.fill();
    if (driven) {   // the chef at the wheel: face, moustache, the white hat
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(4, -112 + by, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(8, -113 + by, 1.3, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(5, -109 + by, 6, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, -122 + by, 13, 5); ctx.beginPath(); ctx.arc(1, -124 + by, 5, 0, Math.PI * 2); ctx.arc(7, -124 + by, 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  bodyToro(ctx, r, g, v, by, driven) {
    const t = g.time, O = '#ff7a1a', OD = '#d9560b', OL = '#ffa65c';
    // the tail at the back, swishing
    const sw = Math.sin(t * 4) * 4;
    ctx.strokeStyle = OD; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-89, -96 + by); ctx.quadraticCurveTo(-104, -96 + by + sw, -102, -80 + by + sw); ctx.stroke();
    ctx.fillStyle = '#5b2d0e'; ctx.beginPath(); ctx.ellipse(-102, -77 + by + sw, 4.5, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    // the far horn: it sweeps back and up off the rear of the cab roof (the near one sweeps forward: a big bull's U)
    this.horn(ctx, -2, -129 + by, -1, '#e2d0a4', '#4a3b2c');
    this.bodyPath(ctx, by); ctx.fillStyle = O; ctx.fill();
    ctx.fillStyle = OD; ctx.fillRect(-90, -76 + by, 184, 12);
    ctx.fillStyle = OL; ctx.fillRect(-86, -99 + by, 62, 4); ctx.beginPath(); ctx.moveTo(40, -100 + by); ctx.lineTo(78, -96 + by); ctx.lineTo(78, -93 + by); ctx.lineTo(40, -97 + by); ctx.closePath(); ctx.fill();
    // bull spots of darker orange on the bed
    ctx.fillStyle = 'rgba(160,60,0,0.35)'; ctx.beginPath(); ctx.ellipse(-62, -88 + by, 12, 7, 0.3, 0, Math.PI * 2); ctx.ellipse(-36, -84 + by, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    this.cab(ctx, by, '#bfe6ff', driven);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, -102 + by); ctx.lineTo(-14, -70 + by); ctx.moveTo(30, -102 + by); ctx.lineTo(30, -70 + by); ctx.stroke();
    // a furry tuft on the roof, an ear, and the near horn, cream with a dark tip, sweeping forward and up
    ctx.fillStyle = OD; ctx.beginPath(); ctx.ellipse(4, -131 + by, 14, 4, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-16, -128 + by, 8, 4, -0.6, 0, Math.PI * 2); ctx.fill();
    this.horn(ctx, 10, -129 + by, 1, '#fff4d6', '#5b4a3a');
    // the bull's face on the hood: a big eye with a cross-but-friendly brow, the snout, a nostril, the gold nose ring
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(60, -86 + by, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(63, -85 + by, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(64.5, -86.5 + by, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a2e00'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(49, -98 + by); ctx.lineTo(70, -93 + by); ctx.stroke();
    ctx.fillStyle = '#ffb27a'; ctx.beginPath(); ctx.ellipse(87, -77 + by, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b2d0e'; ctx.beginPath(); ctx.ellipse(91, -80 + by, 3, 4.5, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a2e00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(80, -72 + by, 6, 0.2, 1.4); ctx.stroke();   // a grin
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(95, -68 + by, 6.5, -1.2, 4.2); ctx.stroke();
    ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(95, -68 + by, 6.5, 3.3, 4.1); ctx.stroke();
    // bumpers
    ctx.fillStyle = '#3a3a3a'; U.roundRect(ctx, -96, -72 + by, 10, 10, 3); ctx.fill();
    // snort! little puffs from the nostril every second or so
    const ph = (t * 0.9) % 1;
    if (ph < 0.45) { const k = ph / 0.45; ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - k)})`; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(100 + k * 30 + i * 7, -82 + by - i * 4 - k * 6, 4 + k * 6 - i, 0, Math.PI * 2); ctx.fill(); } }
  },
  // a bull's horn standing on the roof at (x, y): thick at the base, curving out (dir +1 forward, -1 back) and up
  horn(ctx, x, y, dir, col, tip) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x + dir * 2 - 8, y - 22, x + dir * 22, y - 34);
    ctx.quadraticCurveTo(x + dir * 4 + 6, y - 18, x + 7, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tip; ctx.beginPath(); ctx.moveTo(x + dir * 22, y - 34); ctx.quadraticCurveTo(x + dir * 14, y - 30, x + dir * 13, y - 26); ctx.lineTo(x + dir * 17, y - 24); ctx.closePath(); ctx.fill();
  },
  bodyDigger(ctx, r, g, v, by, driven) {
    const t = g.time, K = '#17171d', G1 = '#2e7d32', G2 = '#1b5e20', P = '#9c27b0', PL = '#e1a6ff';
    // a tombstone standing in the bed, and a little graveyard fence along the bed's rail
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(-66, -100 + by); ctx.lineTo(-66, -122 + by); ctx.arc(-54, -122 + by, 12, Math.PI, 0); ctx.lineTo(-42, -100 + by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6f757d'; ctx.fillRect(-56, -130 + by, 4, 18); ctx.fillRect(-61, -125 + by, 14, 4);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-64, -121 + by, 3, 18);
    ctx.fillStyle = '#7d8289'; ctx.beginPath(); ctx.moveTo(-38, -100 + by); ctx.lineTo(-38, -110 + by); ctx.arc(-32, -110 + by, 6, Math.PI, 0); ctx.lineTo(-26, -100 + by); ctx.closePath(); ctx.fill();
    this.bodyPath(ctx, by); ctx.fillStyle = K; ctx.fill();
    ctx.fillStyle = '#2b2b33'; for (let x = -88; x < -24; x += 8) { ctx.beginPath(); ctx.moveTo(x, -102 + by); ctx.lineTo(x + 2.5, -110 + by); ctx.lineTo(x + 5, -102 + by); ctx.closePath(); ctx.fill(); }
    // the green lower body with slime drips
    ctx.fillStyle = G2; ctx.fillRect(-90, -78 + by, 184, 14);
    ctx.fillStyle = G1; ctx.fillRect(-90, -80 + by, 184, 4);
    for (const [x, l] of [[-70, 7], [-44, 10], [-8, 6], [24, 9], [58, 7]]) { ctx.fillStyle = G1; U.roundRect(ctx, x, -78 + by, 5, l, 2.5); ctx.fill(); }
    // purple flames licking back from the nose
    const flame = (y, len, th, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(93, y - th + by); ctx.quadraticCurveTo(93 - len * 0.55, y - th * 1.5 + by, 93 - len, y + by); ctx.quadraticCurveTo(93 - len * 0.5, y + th * 0.4 + by, 93, y + th + by); ctx.closePath(); ctx.fill(); };
    flame(-90, 62, 6, P); flame(-84, 96, 7, P); flame(-92, 40, 4, PL); flame(-85, 66, 4, PL);
    this.cab(ctx, by, '#b6f5cf', driven);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, -102 + by); ctx.lineTo(-14, -82 + by); ctx.moveTo(30, -102 + by); ctx.lineTo(30, -82 + by); ctx.stroke();
    // a little painted tombstone on the door
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(0, -84 + by); ctx.lineTo(0, -94 + by); ctx.arc(8, -94 + by, 8, Math.PI, 0); ctx.lineTo(16, -84 + by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4f57'; ctx.fillRect(7, -99 + by, 2, 10); ctx.fillRect(4, -96 + by, 8, 2);
    // a glowing green headlight eye
    ctx.fillStyle = 'rgba(124,252,0,0.25)'; ctx.beginPath(); ctx.arc(88, -88 + by, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b9ff8a'; ctx.beginPath(); ctx.arc(88, -88 + by, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3a3a'; U.roundRect(ctx, 88, -72 + by, 10, 10, 3); ctx.fill(); U.roundRect(ctx, -96, -72 + by, 10, 10, 3); ctx.fill();
    // the friendly ghost, bobbing above the bed and trailing a little behind
    const gy = -158 + by + Math.sin(t * 2.6) * 6, gx = -52 - Math.min(14, Math.hypot(v.vx || 0, v.vy || 0) * 0.05) + Math.sin(t * 1.7) * 3;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(gx, gy, 14, Math.PI, 0); ctx.lineTo(gx + 14, gy + 16);
    for (let i = 0; i < 4; i++) { const x = gx + 14 - (i + 0.5) * 7; ctx.quadraticCurveTo(x + 1, gy + 16 + (i % 2 ? -5 : 6) + Math.sin(t * 6 + i) * 2, x - 3.5, gy + 16); }
    ctx.lineTo(gx - 14, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(gx - 5, gy - 2, 2.4, 3.4, 0, 0, Math.PI * 2); ctx.ellipse(gx + 5, gy - 2, 2.4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx, gy + 4, 3, 0.1, Math.PI - 0.1); ctx.fill();
    ctx.fillStyle = 'rgba(255,143,171,0.6)'; ctx.beginPath(); ctx.arc(gx - 9, gy + 3, 2.5, 0, Math.PI * 2); ctx.arc(gx + 9, gy + 3, 2.5, 0, Math.PI * 2); ctx.fill();
  },

  // a battered old junk car, side on (dents, rust, a cracked window); `flat` squashes it into a pancake
  drawJunkCar(r, g, c, x, y, s) {
    const ctx = r.ctx;
    const k = c.flat ? Math.min(1, c.t / 0.22) : 0, squish = c.flat ? 1 - 0.74 * k + (k >= 1 ? 0 : Math.sin(k * Math.PI) * 0.08) : 1, wide = 1 + (c.flat ? 0.14 * k : 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(s * wide, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 60, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1, squish);
    // wheels (flat tyres)
    for (const wx of [-34, 34]) { ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.ellipse(wx, -10, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.arc(wx, -10, 4.5, 0, Math.PI * 2); ctx.fill(); }
    // body
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.moveTo(-56, -12); ctx.lineTo(-56, -30); ctx.lineTo(-30, -34); ctx.lineTo(-18, -52); ctx.lineTo(20, -53); ctx.lineTo(34, -34); ctx.lineTo(56, -30); ctx.lineTo(57, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-56, -20, 113, 8);
    // windows, one cracked
    ctx.fillStyle = '#a8d4ee'; ctx.beginPath(); ctx.moveTo(-14, -48); ctx.lineTo(0, -48); ctx.lineTo(0, -35); ctx.lineTo(-24, -35); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -48); ctx.lineTo(18, -49); ctx.lineTo(28, -35); ctx.lineTo(4, -35); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(12, -42); ctx.lineTo(7, -47); ctx.moveTo(12, -42); ctx.lineTo(20, -46); ctx.moveTo(12, -42); ctx.lineTo(9, -36); ctx.moveTo(12, -42); ctx.lineTo(22, -38); ctx.stroke();
    // rust spots and dents
    ctx.fillStyle = '#8a4b22'; ctx.beginPath(); ctx.ellipse(-40, -24, 7, 4, 0.3, 0, Math.PI * 2); ctx.ellipse(42, -22, 5, 3, 0, 0, Math.PI * 2); ctx.ellipse(-8, -18, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(26, -26, 6, 0.3, 2.6); ctx.moveTo(-26, -30); ctx.lineTo(-20, -24); ctx.stroke();
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(52, -28, 5, 5); ctx.fillStyle = '#c0392b'; ctx.fillRect(-57, -28, 4, 5);
    ctx.restore();
    if (c.flat && k >= 1) { ctx.fillStyle = 'rgba(200,235,255,0.85)'; for (let i = 0; i < 7; i++) { const a = (c.i || 0) * 1.3 + i * 2.1; ctx.fillRect(x + Math.cos(a) * (30 + i * 5), y + 4 + Math.sin(a) * 6, 3, 2); } }
  },
  drawForklift(r, g, f) {
    const ctx = r.ctx, M = CFG.MTRUCKS, s = f.face, lift = f.load ? 18 : f.phase === 'swap' ? 10 : 2 + f.lift * 44, chef = g.driving && g.vehicle === f;
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(s, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(10, 2, 52, 8, 0, 0, Math.PI * 2); ctx.fill();
    // mast and forks out front
    ctx.fillStyle = '#5c6670'; ctx.fillRect(38, -88, 6, 82); ctx.fillRect(46, -88, 4, 82);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(44, -8 - lift, 64, 5);
    // body, counterweight, cage and the driver in a hard hat
    ctx.fillStyle = '#f2b705'; U.roundRect(ctx, -30, -40, 70, 32, 6); ctx.fill();
    ctx.fillStyle = '#c99400'; U.roundRect(ctx, -36, -36, 14, 28, 5); ctx.fill();
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(-10, -84); ctx.lineTo(30, -84); ctx.lineTo(34, -40); ctx.stroke();
    ctx.fillStyle = chef ? '#ffffff' : '#3b7dd8'; U.roundRect(ctx, 0, -62, 16, 22, 4); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(8, -68, 7, 0, Math.PI * 2); ctx.fill();
    if (chef) { ctx.fillStyle = '#ffffff'; ctx.fillRect(2, -80, 13, 6); ctx.beginPath(); ctx.arc(5, -82, 5, 0, Math.PI * 2); ctx.arc(11, -82, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(9, -66, 6, 2); }
    else { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(8, -72, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(-1, -73, 18, 3); }
    ctx.fillStyle = Math.floor(g.time * 4) % 2 ? '#ff8c42' : '#ffd166'; ctx.beginPath(); ctx.arc(10, -88, 4, 0, Math.PI * 2); ctx.fill();
    for (const wx of [-18, 28]) { ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(wx, -9, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(wx, -9, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the load on the forks (driving in: a fresh car; driving out: the pancake)
    if (f.load && f.car && f.phase !== 'swap') this.drawJunkCar(r, g, { color: f.load === 'fresh' ? f.car.color : '#8a8a8a', flat: f.load !== 'fresh', t: 9, i: f.car.i }, f.x + s * M.FORK.reach, f.y - 6 - lift, 0.8);
    if (!g.driving && g.nearVehicle === f) {
      const bob = Math.sin(g.time * 5) * 3, label = CFG.VEHICLES.forklift.label + '!';
      r.drawBubble(f.x, f.y - 120 + bob, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(label, 0, 0); }, 64);
    }
  },

  // the stadium gate at the dirt track (drawn with the people so they walk in front of it and behind its top)
  // the gate (lots of little shapes: the crowd on its roof, flags, bulbs) is redrawn into a small canvas ten times a second
  // and stamped in between, which keeps it cheap while the crowd still bobs and the flags still wave
  drawGateCached(r, g) {
    if (typeof document === 'undefined') { this.drawGate(r, g); return; }
    const G = CFG.MTRUCKS.GATE, sc = Math.max(0.25, r.scale * r.dpr), X0 = G.x0 - 40, Y0 = G.y1 - 250, W = G.x1 - G.x0 + 110, H = 280;
    let c = this.gateCv;
    if (!c || this.gateSc !== sc) { c = this.gateCv = document.createElement('canvas'); c.width = Math.ceil(W * sc); c.height = Math.ceil(H * sc); this.gateSc = sc; this.gateT = -1; }
    if (this.gateT < 0 || g.time - this.gateT >= 0.1 || g.time < this.gateT) {
      const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(sc, 0, 0, sc, -X0 * sc, -Y0 * sc);
      const real = r.ctx; r.ctx = x; try { this.drawGate(r, g); } finally { r.ctx = real; }
      this.gateT = g.time;
    }
    r.ctx.drawImage(c, X0, Y0, W, H);
  },
  drawGate(r, g) {
    const ctx = r.ctx, M = CFG.MTRUCKS, G = M.GATE, t = g.time, x0 = G.x0, x1 = G.x1, cx = (x0 + x1) / 2, base = G.y1, top = base - 168;
    // the stand behind the wall: a curved roof of seats with a few fans
    ctx.fillStyle = '#26324a'; ctx.beginPath(); ctx.moveTo(x0 - 8, top + 30); ctx.lineTo(x0 + 4, top - 26); ctx.quadraticCurveTo(cx, top - 50, x1 - 4, top - 26); ctx.lineTo(x1 + 8, top + 30); ctx.closePath(); ctx.fill();
    const SH = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', '#ff8fab'];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 10; i++) {
      const x = x0 + 16 + i * 16 + row * 8, y = top - 22 + row * 13 - Math.sin((i + 0.5) / 10 * Math.PI) * 8 * (1 - row), h = Math.abs(Math.sin(t * 6 + i * 1.3 + row)) * 2.5;
      ctx.fillStyle = SH[(i + row) % SH.length]; ctx.beginPath(); ctx.arc(x, y + 5 - h, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y - 2 - h, 4, 0, Math.PI * 2); ctx.fill();
    }
    // flag poles at the corners
    for (const [px, col] of [[x0 + 4, '#e4572e'], [x1 - 4, '#41b883']]) {
      ctx.fillStyle = '#5c6670'; ctx.fillRect(px - 2, top - 70, 4, 72);
      const wv = Math.sin(t * 5 + px) * 3;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px + 2, top - 70); ctx.quadraticCurveTo(px + 14, top - 72 + wv, px + 28, top - 64 + wv); ctx.lineTo(px + 28, top - 50 + wv); ctx.quadraticCurveTo(px + 14, top - 56 + wv, px + 2, top - 52); ctx.closePath(); ctx.fill();
    }
    // the tall front wall with a red band along its top
    ctx.fillStyle = '#d9d4cc'; ctx.fillRect(x0, top, x1 - x0, base - top);
    ctx.fillStyle = '#c62828'; ctx.fillRect(x0, top, x1 - x0, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x0, base - 8, x1 - x0, 8);
    this.paintTunnel(r, ctx, M.MOUTH.x, base, M.MOUTH.half, M.MOUTH.tall);
    // the big sign over the arch: a bull and a ghost on a red board with flashing bulbs
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, cx - 72, top + 8, 144, 30, 8); ctx.fill();
    ctx.fillStyle = '#ffd166'; for (let i = 0; i < 11; i++) { ctx.globalAlpha = (Math.floor(t * 4) + i) % 2 ? 1 : 0.45; ctx.beginPath(); ctx.arc(cx - 65 + i * 13, top + 12, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx - 65 + i * 13, top + 34, 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.font = r.font(17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐂 🏟️ 👻', cx, top + 23);
    // tyre stacks either side of the arch
    for (const sx of [x0 + 10, x1 - 10]) for (let k = 0; k < 4; k++) { ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, sx - 9, base - 12 - k * 10, 18, 10, 4); ctx.fill(); ctx.fillStyle = k % 2 ? '#ffd166' : '#e4572e'; ctx.fillRect(sx - 4, base - 8 - k * 10, 8, 2); }
  },

  // dust, glass and confetti over everything; the big pop words
  overlay(r, g) {
    if (!this.st || (g.area !== 'site' && g.area !== 'arena')) return;
    const ctx = r.ctx, st = this.st;
    for (const p of st.dust) {
      if (p.area !== g.area) continue;
      const k = p.t / p.dur; ctx.fillStyle = `rgba(196,150,100,${0.55 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y - k * 18, p.r * (0.6 + k), 0, Math.PI * 2); ctx.fill();
    }
    if (g.area === 'arena') for (const p of st.sparks) { ctx.fillStyle = `rgba(210,240,255,${1 - p.t / p.dur})`; ctx.fillRect(p.x - 2, p.y - p.z - 2, 4, 3); }
    for (const p of st.confetti) { if (p.area !== g.area) continue; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }
    for (const p of st.pops) {
      const k = p.t / p.dur, sc = k < 0.15 ? 0.4 + k / 0.15 * 0.8 : k < 0.25 ? 1.2 - (k - 0.15) * 2 : 1;
      ctx.save(); ctx.globalAlpha = 1 - U.clamp((k - 0.7) / 0.3, 0, 1); ctx.translate(p.x, p.y - k * 30); ctx.scale(sc, sc);
      ctx.font = r.font(30, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(43,29,20,0.9)'; ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,8,${Math.min(1, this.st.fade / 0.6)})`; ctx.fillRect(0, 0, W, H);
  },
  // for anyone who draws a truck through the core's Render.drawVehicle (rotated): draw it upright, side on, smaller
  vehicleArt: {
    eltoro(r, g, color, v) { MonsterTrucksExt.coreArt(r, g, 'eltoro', v); },
    gravedigger(r, g, color, v) { MonsterTrucksExt.coreArt(r, g, 'gravedigger', v); },
  },
  coreArt(r, g, kind, v) {
    const ctx = r.ctx; ctx.save(); if (v && v.angle) ctx.rotate(-v.angle); ctx.scale(0.5, 0.5); ctx.translate(0, 70);
    this.drawTruck(ctx, r, g, kind, v || { vx: 0, vy: 0, rot: 0, sq: 0 }, false); ctx.restore();
  },
};
Game.ext.unshift(MonsterTrucksExt);
Render.ext.push(MonsterTrucksExt);
