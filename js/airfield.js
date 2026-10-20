'use strict';
// The airfield east of the fire station and the flight to Cloud Harbor.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// The strip of town past the fire station is a little airfield: a north–south runway, a hangar with the
// chef's plane parked in front of it, a control tower, a windsock and an arrivals gate on the west edge
// (customers come out of it and walk to the shops). Taxi the plane onto the runway, get up to speed and
// press the big button: the plane climbs through the clouds (side-on cut-scene) to CLOUD HARBOR, a map of
// floating cloud islands joined by rope bridges, with a sky terminal, a hot-air balloon to ride, a glider
// ramp, bouncy clouds, a café with a waving pilot, a blimp and parachute jumpers. The plane waiting on
// the cloud runway flies you home again and rolls up to the hangar.

// ---------- config ----------
CFG.AIRFIELD = {
  STRIP: { x0: 1540, y0: -170, x1: 2060, y1: 1330 },      // the part of the town map that is the airfield
  RUNWAY: { x0: 1700, y0: 150, x1: 1800, y1: 1250 },
  TAXIWAY: { x0: 1800, y0: 440, x1: 1880, y1: 490 },
  APRON: { x0: 1860, y0: 380, x1: 2050, y1: 740 },
  HANGAR: { x0: 1880, y0: 190, x1: 2040, y1: 372, door: { x: 1960, half: 60 } },
  PLANE_HOME: { x: 1900, y: 465, angle: 0 },             // parked on the apron by the hangar, nose to the hangar
  LANDING: [{ x: 1750, y: 200 }, { x: 1750, y: 465 }, { x: 1900, y: 465 }],   // the landing roll: down the runway, then along the taxiway
  TERMINAL: { x0: 1596, y0: 560, x1: 1672, y1: 650, door: { x: 1590, y: 605 }, doorHalf: 16 },   // the arrivals gate; customers come out of its west door
  PLAZA: { x0: 1540, y0: 560, x1: 1596, y1: 700 },       // pavement in front of the gate joining the sidewalks
  PAD: { x0: 1596, y0: 540, x1: 1700, y1: 720 },         // concrete around the terminal
  TOWER: { x: 1626, y: 400 },
  WINDSOCK: { x: 1660, y: 236 },
  FUEL: { x: 2020, y: 560 },
  CART: { x: 1640, y: 690 },
  HELI: { x: 1890, y: 690 },
  PARKED: { x: 1990, y: 640 },                           // a visitor's little blue plane
  HEDGE: { x0: 1560, y0: 106, x1: 2040, y1: 118 },
  BENCH: { x: 1960, y: 920 },
  CONES: [[1690, 132], [1812, 132], [1690, 1268], [1812, 1268], [1870, 530], [1870, 575], [1890, 770], [1930, 790], [1700, 740]],
  RUNUP: 1.2,                                           // seconds the plane races down the runway before the fade
  FLIGHT: 8,                                            // seconds the flight takes
  coins: [{ x: 1960, y: 1020 }, { x: 1600, y: 1180 }, { x: 1860, y: 160 }],
};
CFG.CLOUD = {
  WORLD: { x0: 7200, y0: -170, x1: 8600, y1: 900 },
  ISLANDS: [
    { key: 'runway', name: 'Landing Cloud', x0: 7240, y0: 500, x1: 7920, y1: 880 },
    { key: 'terminal', name: 'Terminal Cloud', x0: 7260, y0: -130, x1: 7720, y1: 360 },
    { key: 'balloon', name: 'Bouncy Cloud', x0: 8000, y0: 460, x1: 8570, y1: 880 },
    { key: 'glider', name: 'Glider Cloud', x0: 7900, y0: -130, x1: 8570, y1: 300 },
  ],
  // rope bridges across the gaps (they reach 20 px into each island so the cloud edge is never a gap)
  BRIDGES: [
    { x0: 7470, y0: 340, x1: 7530, y1: 520, v: true },
    { x0: 7700, y0: 40, x1: 7920, y1: 100, v: false },
    { x0: 7900, y0: 620, x1: 8020, y1: 680, v: false },
    { x0: 8250, y0: 280, x1: 8310, y1: 480, v: true },
  ],
  RUNWAY: { x0: 7300, y0: 650, x1: 7860, y1: 730 },
  PLANE_HOME: { x: 7640, y: 690, angle: 0 },
  LANDING: [{ x: 7330, y: 690 }, { x: 7640, y: 690 }],
  WINDSOCK: { x: 7290, y: 600 },
  TERMINAL: { x0: 7300, y0: -90, x1: 7560, y1: 40 },
  BOARD: { x: 7430, y: 120 },
  CAFE: { x0: 7580, y0: 140, x1: 7700, y1: 240 },
  TABLES: [[7560, 300], [7640, 310]],
  PILOT: { x: 7690, y: 290 },
  GLIDER: { top: { x: 8120, y: 160 }, launch: { x: 8046, y: 218 }, p1: { x: 7900, y: 430 }, p2: { x: 7700, y: 600 }, dur: 3.4 },
  BALLOON: { x: 8420, y: 580 },
  PADS: [{ x: 8110, y: 760 }, { x: 8220, y: 830 }, { x: 8330, y: 760 }],   // bouncy clouds
  FLAGS: [[7290, -110], [7720, -110]],
  coins: [{ x: 7330, y: 300 }, { x: 7860, y: 820 }, { x: 8500, y: 520 }, { x: 8480, y: 80 }],
};
CFG.AREAS.cloud = { WORLD: CFG.CLOUD.WORLD };
CFG.VEHICLES.plane = { speed: 300, radius: 20, label: '✈️ Taxi', exit: '🚶 Hop out' };
CFG.VEHICLES.balloonride = { speed: 140, radius: 20, label: '🎈 Ride', exit: '🚶 Hop out' };
CFG.COINS.push(...CFG.AIRFIELD.coins, ...CFG.CLOUD.coins);

const AirfieldExt = {
  name: 'airfield',
  rt: null,   // runtime (not saved): the planes, the balloon, the scripted take-off / landing / rides, sky props

  // ---------- small helpers ----------
  hash(i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); },
  inStrip(x, y) { const S = CFG.AIRFIELD.STRIP; return x >= S.x0 && x <= S.x1 && y >= 100 && y <= S.y1; },
  inRect(x, y, R, m = 0) { return x > R.x0 + m && x < R.x1 - m && y > R.y0 + m && y < R.y1 - m; },
  onRunway(v, area) { return this.inRect(v.x, v.y, area === 'town' ? CFG.AIRFIELD.RUNWAY : CFG.CLOUD.RUNWAY, -30); },   // a little slack past the edge lines
  aligned(v, area) { return area === 'town' ? Math.abs(Math.sin(v.angle)) > 0.8 : Math.abs(Math.cos(v.angle)) > 0.8; },
  planeOf(g) { return !this.rt ? null : g.area === 'town' ? this.rt.plane : g.area === 'cloud' ? this.rt.cloudPlane : null; },
  // driving the plane down the runway fast enough and straight enough to lift off
  readyToFly(g) {
    const v = this.planeOf(g);
    if (!v || !g.driving || g.vehicle !== v || this.rt.runup || this.rt.roll) return false;
    return this.onRunway(v, g.area) && Math.hypot(v.vx, v.vy) > CFG.VEHICLES.plane.speed * 0.4 && this.aligned(v, g.area);
  },
  chunk(rects, max) {
    const out = [];
    for (const r of rects) { const n = Math.ceil(r.w / max), w = r.w / n; for (let i = 0; i < n; i++) out.push({ x: r.x + i * w, y: r.y, w, h: r.h }); }
    return out;
  },
  bez(a, b, c, k) { const u = 1 - k; return { x: u * u * a.x + 2 * u * k * b.x + k * k * c.x, y: u * u * a.y + 2 * u * k * b.y + k * k * c.y }; },
  nearCoin(g, R, maxD) {
    const p = g.player; let best = null, bd = maxD;
    for (const c of g.coins) { if (c.taken || c.x < R.x0 || c.x > R.x1 || c.y < R.y0 || c.y > R.y1) continue; const d = U.dist(p.x, p.y, c.x, c.y); if (d < bd) { bd = d; best = c; } }
    return best;
  },

  // ======================= game hooks =======================
  build(g) {
    const A = CFG.AIRFIELD, C = CFG.CLOUD;
    this.rt = {
      plane: { kind: 'plane', x: A.PLANE_HOME.x, y: A.PLANE_HOME.y, angle: A.PLANE_HOME.angle, vx: 0, vy: 0, lift: 0 },
      cloudPlane: { kind: 'plane', x: C.PLANE_HOME.x, y: C.PLANE_HOME.y, angle: C.PLANE_HOME.angle, vx: 0, vy: 0, lift: 0 },
      balloon: { kind: 'balloonride', x: C.BALLOON.x, y: C.BALLOON.y, angle: 0, vx: 0, vy: 0 },
      runup: null, roll: null, ride: null,
      found: false, balloonRidden: false, glided: false, padLeft: true, rampLeft: true, wave: 0,
      jumpers: [], jumpT: 3, blimpX: C.WORLD.x0 + 300,
      townObs: null, townCarObs: null, cloudObs: null, void: null, land: null,
    };
    this.buildObstacles();
  },

  // Town: the hangar, the terminal (doors on both sides for people, solid for vehicles), the tower base, the
  // props. Cloud Harbor: the sky between the islands (cut into bands, like the islands' water) plus the buildings.
  buildObstacles() {
    const A = CFG.AIRFIELD, C = CFG.CLOUD, rt = this.rt;
    const T = A.TERMINAL, H = A.HANGAR, foot = [], car = [];
    const solid = (x0, y0, x1, y1) => { const o = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; foot.push(o); car.push(o); };
    solid(H.x0, H.y0, H.x1, H.y1);
    car.push({ x: T.x0, y: T.y0, w: T.x1 - T.x0, h: T.y1 - T.y0 });
    const dw = 6, dh = T.doorHalf;
    foot.push({ x: T.x0, y: T.y0, w: T.x1 - T.x0, h: dw }, { x: T.x0, y: T.y1 - dw, w: T.x1 - T.x0, h: dw });
    for (const x of [T.x0, T.x1 - dw]) foot.push({ x, y: T.y0, w: dw, h: T.door.y - dh - T.y0 }, { x, y: T.door.y + dh, w: dw, h: T.y1 - (T.door.y + dh) });
    solid(A.TOWER.x - 22, A.TOWER.y - 20, A.TOWER.x + 22, A.TOWER.y + 12);
    solid(A.FUEL.x - 12, A.FUEL.y - 14, A.FUEL.x + 12, A.FUEL.y + 10);
    solid(A.CART.x - 22, A.CART.y - 12, A.CART.x + 22, A.CART.y + 10);
    solid(A.HELI.x - 36, A.HELI.y - 22, A.HELI.x + 36, A.HELI.y + 20);
    solid(A.PARKED.x - 46, A.PARKED.y - 40, A.PARKED.x + 46, A.PARKED.y + 36);
    rt.townObs = foot; rt.townCarObs = car;

    const W = C.WORLD;
    const land = C.ISLANDS.map((s) => ({ x0: s.x0 + 10, y0: s.y0 + 10, x1: s.x1 - 10, y1: s.y1 - 10 })).concat(C.BRIDGES.map((b) => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 })));
    rt.land = land;
    const ys = [...new Set(land.flatMap((l) => [l.y0, l.y1]).concat([W.y0, W.y1]))].sort((a, b) => a - b);
    const voids = [];
    for (let i = 0; i < ys.length - 1; i++) {
      const ya = ys[i], yb = ys[i + 1];
      const row = land.filter((l) => l.y0 < yb && l.y1 > ya).sort((a, b) => a.x0 - b.x0);
      let x = W.x0;
      for (const l of row) { if (l.x0 > x) voids.push({ x, y: ya, w: l.x0 - x, h: yb - ya }); x = Math.max(x, l.x1); }
      if (x < W.x1) voids.push({ x, y: ya, w: W.x1 - x, h: yb - ya });
    }
    const merged = [];
    for (const r of voids) { const m = merged.find((o) => o.x === r.x && o.w === r.w && o.y + o.h === r.y); if (m) m.h += r.h; else merged.push(r); }
    rt.void = this.chunk(merged, 360);
    const st = [];
    const T2 = C.TERMINAL; st.push({ x: T2.x0, y: T2.y0, w: T2.x1 - T2.x0, h: T2.y1 - T2.y0 });
    st.push({ x: C.BOARD.x - 100, y: C.BOARD.y - 10, w: 200, h: 16 });
    const K = C.CAFE; st.push({ x: K.x0, y: K.y0, w: K.x1 - K.x0, h: K.y1 - K.y0 });
    for (const [x, y] of C.TABLES) st.push({ x: x - 14, y: y - 8, w: 28, h: 16 });
    rt.cloudObs = rt.void.concat(st);
  },

  obstacles(g, forCar) {
    const rt = this.rt; if (!rt) return [];
    if (g.area === 'town') return forCar ? rt.townCarObs : rt.townObs;
    if (g.area !== 'cloud') return [];
    if (forCar && g.driving && g.vehicle === rt.balloon) return [];   // the balloon floats over everything
    return rt.cloudObs;
  },
  vehicles(g) { return this.rt ? [this.rt.plane, this.rt.cloudPlane, this.rt.balloon] : []; },

  action(g) {
    const rt = this.rt;
    if (!rt || rt.runup || rt.roll || g.travel) return null;
    if (this.readyToFly(g)) return { label: g.area === 'town' ? '🛫 Take off!' : '🛫 Fly home!', run: (gg) => this.takeOff(gg) };
    return null;
  },
  takeOff(g) {
    const rt = this.rt, v = this.planeOf(g), town = g.area === 'town', R = town ? CFG.AIRFIELD.RUNWAY : CFG.CLOUD.RUNWAY;
    const dir = town ? { x: 0, y: v.vy < 0 ? -1 : 1 } : { x: v.vx < 0 ? -1 : 1, y: 0 };
    rt.runup = { plane: v, t: 0, dur: CFG.AIRFIELD.RUNUP, dir, centre: town ? (R.x0 + R.x1) / 2 : (R.y0 + R.y1) / 2, to: town ? 'cloud' : 'town' };
    g.floats.push({ x: v.x, y: v.y - 60, text: town ? 'Up, up and away! ✈️' : 'Home we go! ✈️', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.tone(110, 1.1, 'sawtooth', 0.03, 260); Haptics.success();
  },

  arrive(g, tr) {
    if (tr.via !== 'flight') return;
    const rt = this.rt, A = CFG.AIRFIELD, C = CFG.CLOUD, p = g.player;
    for (const [v, home] of [[rt.plane, A.PLANE_HOME], [rt.cloudPlane, C.PLANE_HOME]]) { v.x = home.x; v.y = home.y; v.angle = home.angle; v.vx = 0; v.vy = 0; v.lift = 0; }
    if (tr.to === 'cloud') { this.startRoll(g, rt.cloudPlane, C.LANDING, 1.8); g.toast('☁️ Welcome to Cloud Harbor!', true); }
    else { this.startRoll(g, rt.plane, A.LANDING, 2.8); g.toast('🍕 Home sweet home!', true); }
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Touchdown! 🛬', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    p.hasMoved = true; p.moving = false; Haptics.success();
  },
  // the plane touches down at the start of the runway and rolls along the path, slowing to a stop; then you hop out
  startRoll(g, v, path, dur) {
    const dirs = []; let len = 0;
    for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1]; dirs.push(Math.atan2(b.y - a.y, b.x - a.x)); len += U.dist(a.x, a.y, b.x, b.y); }
    v.x = path[0].x; v.y = path[0].y; v.vx = 0; v.vy = 0; v.lift = 0; v.angle = dirs[0];
    g.driving = true; g.vehicle = v; g.player.x = v.x; g.player.y = v.y;
    this.rt.roll = { plane: v, path, dirs, len, t: 0, dur };
  },

  update(g, dt) {
    const rt = this.rt; if (!rt) return;
    const p = g.player;
    rt.wave += dt;
    if (rt.runup) this.updateRunup(g, dt);
    else if (rt.roll) this.updateRoll(g, dt);
    else this.steerHelp(g, dt);
    // the chef stays in the plane while the flight plays (the core still reads the joystick)
    // (parked a little away from the plane, or the core would offer the vehicle button over the cut-scene)
    if (g.travel && g.travel.via === 'flight') { const v = g.travel.from === 'town' ? rt.plane : rt.cloudPlane; p.x = v.x; p.y = v.y - 120; p.moving = false; return; }
    if (g.area === 'town') {
      if (!rt.found && !g.onTrain && this.inStrip(p.x, p.y)) { rt.found = true; g.toast('✈️ You found the airfield!', true); Sfx.ding(); }
      return;
    }
    if (g.area === 'cloud') this.updateCloud(g, dt);
  },
  // Driving the plane near the runway and roughly along it, it lines itself up on the centreline: little
  // thumbs steer wobbly, and turning off the taxiway would otherwise drift it off the far edge.
  steerHelp(g, dt) {
    const v = this.planeOf(g);
    if (!v || !g.driving || g.vehicle !== v) return;
    const town = g.area === 'town', R = town ? CFG.AIRFIELD.RUNWAY : CFG.CLOUD.RUNWAY;
    if (!this.inRect(v.x, v.y, R, -60)) return;
    if ((town ? Math.abs(Math.sin(v.angle)) : Math.abs(Math.cos(v.angle))) < 0.5 || Math.hypot(v.vx, v.vy) < 40) return;
    const k = Math.min(1, dt * 2.5), damp = 1 - Math.min(1, dt * 6);
    if (town) { v.x += ((R.x0 + R.x1) / 2 - v.x) * k; v.vx *= damp; } else { v.y += ((R.y0 + R.y1) / 2 - v.y) * k; v.vy *= damp; }
    g.player.x = v.x; g.player.y = v.y;
  },
  updateRunup(g, dt) {
    const rt = this.rt, ru = rt.runup, v = ru.plane;
    if (!g.driving || g.vehicle !== v) { rt.runup = null; v.lift = 0; return; }   // hopped out: never mind
    ru.t += dt;
    const k = Math.min(1, ru.t / ru.dur), sp = 150 + 520 * k, W = g.bounds();
    v.x += ru.dir.x * sp * dt; v.y += ru.dir.y * sp * dt;
    if (ru.dir.x === 0) v.x += (ru.centre - v.x) * Math.min(1, dt * 4); else v.y += (ru.centre - v.y) * Math.min(1, dt * 4);   // ease onto the centreline
    v.vx = ru.dir.x * sp; v.vy = ru.dir.y * sp; v.angle = Math.atan2(ru.dir.y, ru.dir.x);
    v.lift = 36 * k * k;
    v.x = U.clamp(v.x, W.x0 + 30, W.x1 - 30); v.y = U.clamp(v.y, W.y0 + 30, W.y1 - 30);
    g.player.x = v.x; g.player.y = v.y;
    if (ru.t >= ru.dur) {
      rt.runup = null; v.lift = 0; v.vx = 0; v.vy = 0;
      g.driving = false; g.vehicle = null;
      g.startTravel(ru.to, 'flight', CFG.AIRFIELD.FLIGHT);
    }
  },
  updateRoll(g, dt) {
    const rt = this.rt, ro = rt.roll, v = ro.plane;
    if (!g.driving || g.vehicle !== v) { rt.roll = null; return; }
    ro.t += dt;
    const k = Math.min(1, ro.t / ro.dur), s = ro.len * (1 - (1 - k) * (1 - k));
    let acc = 0, pos = ro.path[ro.path.length - 1], dir = ro.dirs[ro.dirs.length - 1];
    for (let i = 0; i < ro.path.length - 1; i++) {
      const a = ro.path[i], b = ro.path[i + 1], L = U.dist(a.x, a.y, b.x, b.y);
      if (s <= acc + L) { const f = (s - acc) / L; pos = { x: U.lerp(a.x, b.x, f), y: U.lerp(a.y, b.y, f) }; dir = ro.dirs[i]; break; }
      acc += L;
    }
    v.x = pos.x; v.y = pos.y; v.vx = 0; v.vy = 0;
    let d = dir - v.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; v.angle += d * Math.min(1, dt * 6);
    g.player.x = v.x; g.player.y = v.y;
    if (k >= 1) { rt.roll = null; v.angle = dir; g.exitCar(); g.player.facing = 1; }
  },

  updateCloud(g, dt) {
    const rt = this.rt, C = CFG.CLOUD, W = C.WORLD, p = g.player, t = rt.wave;
    // parachute jumpers drift down past the islands now and then
    rt.jumpT -= dt;
    if (rt.jumpT <= 0 && rt.jumpers.length < 3) { rt.jumpT = U.rand(6, 11); rt.jumpers.push({ x: U.rand(W.x0 + 80, W.x1 - 80), y: W.y0 - 90, ph: U.rand(0, 6), col: U.pick(['#e4572e', '#3b7dd8', '#ffd166', '#ff8fab', '#41b883']) }); }
    for (const j of rt.jumpers) { j.y += 34 * dt; j.ph += dt; j.x += Math.sin(j.ph * 1.2) * 18 * dt; }
    rt.jumpers = rt.jumpers.filter((j) => j.y < W.y1 + 90);
    // the blimp crosses the top of the sky very slowly
    rt.blimpX += 16 * dt; if (rt.blimpX > W.x1 + 220) rt.blimpX = W.x0 - 220;
    // the balloon floats along with a gentle wobble while you ride it
    const b = rt.balloon;
    if (g.driving && g.vehicle === b) {
      rt.balloonRidden = true;
      b.x = U.clamp(b.x + Math.sin(t * 1.1) * 14 * dt, W.x0 + 30, W.x1 - 30); b.y = U.clamp(b.y + Math.cos(t * 0.8) * 10 * dt, W.y0 + 30, W.y1 - 30);
      p.x = b.x; p.y = b.y;
    }
    if (g.driving || g.onTrain || g.travel) return;
    if (rt.ride) { this.updateRide(g, dt); return; }
    // standing in thin air (hopped out of the balloon over the gap): parachute down to the nearest cloud
    if (rt.void.some((o) => g.hitRect(p.x, p.y, 2, o))) { this.startChute(g); return; }
    // bouncy clouds
    let nearPad = false;
    for (const pd of C.PADS) {
      if (U.dist(p.x, p.y, pd.x, pd.y) >= 22) continue;
      nearPad = true;
      if (!rt.padLeft) break;
      rt.padLeft = false; rt.ride = { kind: 'bounce', t: 0, dur: 0.75, x: p.x, y: p.y, gx: p.x, gy: p.y, lift: 0 };
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Boing!', color: '#ffe08a', t: 0, dur: 1.1, big: true });
      Sfx.tone(240, 0.18, 'triangle', 0.05, 420); Haptics.tap();
      break;
    }
    if (!nearPad) rt.padLeft = true;
    // the glider ramp: walk onto the end of it and off you go
    const L = C.GLIDER.launch, nearRamp = U.dist(p.x, p.y, L.x, L.y) < 22;
    if (nearRamp && rt.rampLeft) {
      rt.rampLeft = false; rt.glided = true; rt.ride = { kind: 'glide', t: 0, dur: C.GLIDER.dur, gx: p.x, gy: p.y, lift: 0 };
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Wheee! 🪂', color: '#ffe08a', t: 0, dur: 1.3, big: true });
      Sfx.chime(); Haptics.tap();
    }
    if (!nearRamp) rt.rampLeft = true;
  },
  startChute(g) {
    const rt = this.rt, p = g.player, b = rt.balloon;
    let best = null, bd = Infinity;
    for (const l of rt.land) {
      const m = l.x1 - l.x0 > 100 ? 24 : 6;
      const x = U.clamp(p.x, l.x0 + m, l.x1 - m), y = U.clamp(p.y, l.y0 + m, l.y1 - m), d = U.dist(p.x, p.y, x, y);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    if (!best) return;
    rt.ride = { kind: 'chute', t: 0, dur: 1.5, x0: p.x, y0: p.y, x1: best.x, y1: best.y, gx: p.x, gy: p.y, lift: 70 };
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Whoosh! 🪂', color: '#ffe08a', t: 0, dur: 1.3, big: true });
    // the balloon drifts over to that cloud too, so it is never left out of reach
    if (U.dist(b.x, b.y, p.x, p.y) < 90) { const dx = p.x - best.x, dy = p.y - best.y, d = Math.hypot(dx, dy) || 1; b.x = best.x + (dx / d) * 50; b.y = best.y + (dy / d) * 50; b.vx = 0; b.vy = 0; }
  },
  updateRide(g, dt) {
    const rt = this.rt, r = rt.ride, p = g.player, G = CFG.CLOUD.GLIDER;
    r.t += dt;
    const k = Math.min(1, r.t / r.dur);
    p.hasMoved = true;
    if (r.kind === 'bounce') { r.lift = Math.sin(k * Math.PI) * 44; p.x = r.x; p.y = r.y - r.lift; p.moving = false; }
    else if (r.kind === 'glide') { const q = this.bez(G.launch, G.p1, G.p2, k); r.gx = q.x; r.gy = q.y; r.lift = 24 * (1 - k) + Math.sin(k * Math.PI) * 60; p.x = q.x; p.y = q.y - r.lift; p.moving = true; p.bob += dt * 6; p.facing = -1; }
    else { const e = U.easeOut(k); r.gx = U.lerp(r.x0, r.x1, e); r.gy = U.lerp(r.y0, r.y1, e); r.lift = 70 * (1 - k); p.x = r.gx; p.y = r.gy - r.lift; p.moving = false; }
    if (k >= 1) { p.x = r.gx; p.y = r.gy; rt.ride = null; p.moving = false; }
  },

  hint(g) {
    const rt = this.rt; if (!rt) return undefined;
    const p = g.player, A = CFG.AIRFIELD, C = CFG.CLOUD;
    if (rt.runup) return { text: '🛫 Here we go!', target: null };
    if (rt.roll) return { text: 'Touchdown! 🛬', target: null };
    if (g.area === 'town') {
      if (g.onTrain || g.fishing || g.ride || !this.inStrip(p.x, p.y)) return undefined;
      if (g.driving) {
        if (g.vehicle !== rt.plane) return undefined;
        if (this.readyToFly(g)) return { text: '🛫 Press the button to take off!', target: null };
        if (this.onRunway(rt.plane, 'town')) return { text: 'Zoom down the runway to take off!', target: null };
        const R = A.RUNWAY; return { text: 'Taxi onto the runway to take off', target: { x: (R.x0 + R.x1) / 2, y: U.clamp(p.y, R.y0 + 80, R.y1 - 80) } };
      }
      if (p.carry > 0 && g.houses.some((h) => h.order)) return undefined;   // a delivery is more urgent
      const coin = this.nearCoin(g, A.STRIP, 300); if (coin) return { text: 'Grab the shiny coin!', target: coin };
      return { text: 'Hop in the plane!', target: U.dist(p.x, p.y, rt.plane.x, rt.plane.y) < 70 ? null : rt.plane };
    }
    if (g.area !== 'cloud') return undefined;
    const rd = rt.ride;
    if (rd) return { text: rd.kind === 'glide' ? 'Wheee! Glide to the next cloud 🪂' : rd.kind === 'chute' ? 'Floating down… 🪂' : 'Boing!', target: null };
    if (g.driving) {
      if (g.vehicle === rt.balloon) return { text: 'Float around! Hop out over a cloud', target: null };
      if (g.vehicle !== rt.cloudPlane) return { text: 'Vroom!', target: null };
      if (this.readyToFly(g)) return { text: '🛫 Press the button to fly home!', target: null };
      if (this.onRunway(rt.cloudPlane, 'cloud')) return { text: 'Zoom down the runway to fly home!', target: null };
      const R = C.RUNWAY; return { text: 'Taxi onto the runway to fly home', target: { x: U.clamp(p.x, R.x0 + 80, R.x1 - 80), y: (R.y0 + R.y1) / 2 } };
    }
    if (!rt.balloonRidden) return { text: 'Ride the balloon!', target: U.dist(p.x, p.y, rt.balloon.x, rt.balloon.y) < 70 ? null : rt.balloon };
    if (!rt.glided) return { text: 'Try the glider ramp!', target: C.GLIDER.top };
    const coin = this.nearCoin(g, C.WORLD, 420); if (coin) return { text: 'Grab the shiny coin!', target: coin };
    return { text: 'Fly home from the runway ✈️', target: U.dist(p.x, p.y, rt.cloudPlane.x, rt.cloudPlane.y) < 70 ? null : rt.cloudPlane };
  },

  // ======================= render hooks =======================
  // ---------- shared art helpers ----------
  grass(ctx, x, y, w, h) {
    const W = CFG.WORLD, grd = ctx.createLinearGradient(0, W.y0, 0, W.y1); grd.addColorStop(0, '#79b85e'); grd.addColorStop(1, '#5f9c48');
    ctx.fillStyle = grd; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < w * h / 7000; i++) { ctx.beginPath(); ctx.ellipse(x + ((i * 193) % w), y + ((i * 101) % h), 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  pave(ctx, x, y, w, h, col = '#d2cbbb') {
    ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 1;
    for (let xx = x; xx <= x + w; xx += 48) { ctx.beginPath(); ctx.moveTo(xx + 0.5, y); ctx.lineTo(xx + 0.5, y + h); ctx.stroke(); }
    for (let yy = y; yy <= y + h; yy += 48) { ctx.beginPath(); ctx.moveTo(x, yy + 0.5); ctx.lineTo(x + w, yy + 0.5); ctx.stroke(); }
  },
  sign(r, x, y, text, bg = '#2b1d14', fg = '#ffe08a', size = 10) {
    const ctx = r.ctx; ctx.font = r.font(size); const w = ctx.measureText(text).width + 18;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 2, y - 30, 4, 30);
    ctx.fillStyle = bg; U.roundRect(ctx, x - w / 2, y - 46, w, 20, 5); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 36);
  },
  cone(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 3, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(x - 6, y + 2); ctx.lineTo(x + 6, y + 2); ctx.lineTo(x + 2, y - 14); ctx.lineTo(x - 2, y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 6, 8, 3);
  },
  bench(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 24, y + 6, 50, 6);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 26, y - 4, 52, 10); ctx.fillRect(x - 26, y - 16, 52, 7);
    ctx.fillStyle = '#4a2d12'; ctx.fillRect(x - 22, y + 6, 5, 8); ctx.fillRect(x + 17, y + 6, 5, 8);
  },
  // a runway: asphalt, edge lines, threshold stripes and numbers at both ends, a dashed centreline
  paintRunway(r, R, vertical, col = '#5a5f6b') {
    const ctx = r.ctx, w = R.x1 - R.x0, h = R.y1 - R.y0;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(R.x0 + 4, R.y0 + 4, w, h);
    ctx.fillStyle = col; ctx.fillRect(R.x0, R.y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 400; i++) ctx.fillRect(R.x0 + ((i * 97) % w), R.y0 + ((i * 53) % h), 2, 2);
    ctx.fillStyle = '#f3efe3';
    if (vertical) {
      ctx.fillRect(R.x0 + 4, R.y0, 3, h); ctx.fillRect(R.x1 - 7, R.y0, 3, h);
      for (let i = 0; i < 6; i++) { ctx.fillRect(R.x0 + 14 + i * 14, R.y0 + 12, 7, 40); ctx.fillRect(R.x0 + 14 + i * 14, R.y1 - 52, 7, 40); }
      for (let y = R.y0 + 110; y < R.y1 - 110; y += 54) ctx.fillRect(R.x0 + w / 2 - 2, y, 4, 30);
      ctx.font = r.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('36', R.x0 + w / 2, R.y0 + 80); ctx.fillText('18', R.x0 + w / 2, R.y1 - 80);   // upright, so little pilots can read them
    } else {
      ctx.fillRect(R.x0, R.y0 + 4, w, 3); ctx.fillRect(R.x0, R.y1 - 7, w, 3);
      for (let i = 0; i < 5; i++) { ctx.fillRect(R.x0 + 12, R.y0 + 14 + i * 12, 40, 6); ctx.fillRect(R.x1 - 52, R.y0 + 14 + i * 12, 40, 6); }
      for (let x = R.x0 + 110; x < R.x1 - 110; x += 54) ctx.fillRect(x, R.y0 + h / 2 - 2, 30, 4);
      ctx.font = r.font(24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('09', R.x0 + 80, R.y0 + h / 2); ctx.fillText('27', R.x1 - 80, R.y0 + h / 2);
    }
  },

  // ---------- town: the airfield strip ----------
  paintTown(r, g) {
    const ctx = r.ctx, A = CFG.AIRFIELD, S = A.STRIP, R = A.RUNWAY, X = A.TAXIWAY, P = A.APRON, H = A.HANGAR;
    // the core's two sidewalk strips run across the whole world: they end at the plaza in front of the gate
    this.grass(ctx, 1596, 580, S.x1 - 1596, 50); this.grass(ctx, S.x0, 640, S.x1 - S.x0, 60);
    this.pave(ctx, A.PLAZA.x0, A.PLAZA.y0, A.PLAZA.x1 - A.PLAZA.x0, A.PLAZA.y1 - A.PLAZA.y0);
    // hedge along Main Street, flowers in the south meadow
    for (let x = A.HEDGE.x0; x <= A.HEDGE.x1; x += 20) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, 112 + (x % 40 ? 2 : -2), 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 3, 109 + (x % 40 ? 2 : -2), 4, 0, Math.PI * 2); ctx.fill(); }
    const cols = ['#ff8fab', '#ffd166', '#fff', '#ff6b6b', '#9ad0ff'];
    for (let i = 0; i < 40; i++) { const x = 1560 + this.hash(i) * 480, y = 1180 + this.hash(i + 50) * 130; if (x > 1680 && x < 1820 && y < 1262) continue; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    for (const [x, y] of [[1570, 1300], [1890, 1290], [2030, 1250], [2035, 800], [1570, 870], [1600, 420], [2040, 1050]]) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 8, 18, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.arc(x - 12, y + 6, 11, 0, Math.PI * 2); ctx.arc(x + 12, y + 6, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 4, y - 6, 7, 0, Math.PI * 2); ctx.fill(); }
    // concrete: the terminal pad, the apron, the taxiway; then the runway
    this.pave(ctx, A.PAD.x0, A.PAD.y0, A.PAD.x1 - A.PAD.x0, A.PAD.y1 - A.PAD.y0, '#c9c3b5');
    ctx.fillStyle = '#7c8088'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 200; i++) ctx.fillRect(P.x0 + ((i * 97) % (P.x1 - P.x0)), P.y0 + ((i * 53) % (P.y1 - P.y0)), 2, 2);
    ctx.fillStyle = '#6b7078'; ctx.fillRect(X.x0 - 6, X.y0, X.x1 - X.x0 + 6, X.y1 - X.y0);
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(R.x1 - 10, (X.y0 + X.y1) / 2); ctx.lineTo(P.x0 + 60, (X.y0 + X.y1) / 2); ctx.stroke();
    ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(R.x1 + 10, X.y0 + 4); ctx.lineTo(R.x1 + 10, X.y1 - 4); ctx.stroke(); ctx.setLineDash([]);   // hold-short line
    // parking T for the plane, the helipad circle
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.strokeRect(A.PLANE_HOME.x - 46, A.PLANE_HOME.y - 50, 92, 100);
    const HL = A.HELI; ctx.strokeStyle = '#f3efe3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(HL.x, HL.y, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(243,239,227,0.6)'; ctx.font = r.font(28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', HL.x, HL.y + 1);
    this.paintRunway(r, R, true);
    for (const [x, y] of A.CONES) this.cone(ctx, x, y);
    this.paintHangar(r, g, H);
    this.paintTerminal(r, g, A.TERMINAL);
    // fuel pump
    const F = A.FUEL;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(F.x - 10, F.y + 6, 24, 6);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, F.x - 11, F.y - 14, 22, 24, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(F.x - 7, F.y - 10, 14, 8); ctx.fillStyle = '#2b1d14'; ctx.fillRect(F.x - 5, F.y - 8, 10, 2); ctx.fillRect(F.x - 5, F.y - 5, 6, 2);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x + 11, F.y - 8); ctx.quadraticCurveTo(F.x + 22, F.y - 10, F.x + 20, F.y + 4); ctx.stroke();
    ctx.font = r.font(11); ctx.fillStyle = '#2b1d14'; ctx.fillText('⛽', F.x, F.y - 26);
    // luggage cart with two suitcases
    const Ct = A.CART;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Ct.x - 18, Ct.y + 6, 40, 6);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(Ct.x - 18, Ct.y + 4, 8, 6); ctx.fillRect(Ct.x + 10, Ct.y + 4, 8, 6);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Ct.x - 22, Ct.y - 6, 44, 12, 3); ctx.fill(); ctx.fillRect(Ct.x + 20, Ct.y - 16, 3, 14);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Ct.x - 18, Ct.y - 16, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#f06292'; U.roundRect(ctx, Ct.x + 2, Ct.y - 18, 16, 14, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Ct.x - 12, Ct.y - 18, 6, 3); ctx.fillRect(Ct.x + 7, Ct.y - 20, 6, 3);
    // a visitor's little plane and a helicopter parked on the apron
    const Pk = A.PARKED; ctx.save(); ctx.translate(Pk.x, Pk.y); ctx.rotate(-Math.PI / 2); r.drawVehicle('plane', g, '#3b7dd8'); ctx.restore();
    this.paintHeli(r, HL.x, HL.y);
    // plane spotting bench by the runway
    this.bench(ctx, A.BENCH.x, A.BENCH.y); this.sign(r, A.BENCH.x + 50, A.BENCH.y + 6, '🔭 PLANE SPOTTING');
    // windsock pole shadow and base (the sock itself flutters live)
    this.sign(r, 1566, 548, '✈️ AIRFIELD', '#3b7dd8', '#fff');
  },
  paintHangar(r, g, H) {
    const ctx = r.ctx, w = H.x1 - H.x0, h = H.y1 - H.y0, cx = H.door.x;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(H.x0 + 6, H.y0 + 6, w, h);
    // an arched steel roof: darker at the sides, bright along the ridge, with ribs
    const grd = ctx.createLinearGradient(H.x0, 0, H.x1, 0); grd.addColorStop(0, '#7f8791'); grd.addColorStop(0.5, '#c3c8d0'); grd.addColorStop(1, '#7f8791');
    ctx.fillStyle = grd; ctx.fillRect(H.x0, H.y0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = H.y0 + 12; y < H.y1 - 20; y += 14) ctx.fillRect(H.x0, y, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx - 4, H.y0, 8, h - 18);
    // the big door on the apron side
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(cx - H.door.half - 4, H.y1 - 18, H.door.half * 2 + 8, 18);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#e4572e' : '#f2b134'; ctx.fillRect(cx - H.door.half + i * (H.door.half / 2), H.y1 - 16, H.door.half / 2, 14); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx - H.door.half, H.y1 - 4, H.door.half * 2, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(H.x0, H.y1 - 18, cx - H.door.half - 4 - H.x0, 18); ctx.fillRect(cx + H.door.half + 4, H.y1 - 18, H.x1 - cx - H.door.half - 4, 18);
    // a little side door and a window
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(H.x0 + 14, H.y1 - 30, 14, 20); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(H.x1 - 40, H.y1 - 34, 20, 14);
    // the sign on the roof
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 86, H.y0 + 54, 172, 36, 8); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA AIR ✈️', cx + 8, H.y0 + 72);
    r.drawPizza(cx - 66, H.y0 + 72, 11);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.fillText('HANGAR 1', cx, H.y0 + 112);
    // a windsock-coloured flag on a mast at the corner
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(H.x1 - 12, H.y0 + 8, 3, 30); ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(H.x1 - 9, H.y0 + 8); ctx.lineTo(H.x1 + 10, H.y0 + 13); ctx.lineTo(H.x1 - 9, H.y0 + 18); ctx.closePath(); ctx.fill();
  },
  paintTerminal(r, g, T) {
    const ctx = r.ctx, w = T.x1 - T.x0, h = T.y1 - T.y0, dh = T.doorHalf;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(T.x0 + 4, T.y0 + 4, w, h);
    // floor tiles (you can walk through the gate), walls with a door on each side
    for (let y = T.y0; y < T.y1; y += 18) for (let x = T.x0; x < T.x1; x += 18) { ctx.fillStyle = ((x - T.x0) / 18 + (y - T.y0) / 18) % 2 ? '#e6edf5' : '#f6f9fc'; ctx.fillRect(x, y, Math.min(18, T.x1 - x), Math.min(18, T.y1 - y)); }
    ctx.fillStyle = '#3b7dd8';
    ctx.fillRect(T.x0, T.y0, w, 6); ctx.fillRect(T.x0, T.y1 - 6, w, 6);
    for (const x of [T.x0, T.x1 - 6]) { ctx.fillRect(x, T.y0, 6, T.door.y - dh - T.y0); ctx.fillRect(x, T.door.y + dh, 6, T.y1 - T.door.y - dh); }
    // door mats and little awnings outside both doors
    ctx.fillStyle = '#e4572e'; ctx.fillRect(T.x0 - 12, T.door.y - dh, 12, dh * 2); ctx.fillRect(T.x1, T.door.y - dh, 12, dh * 2);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#3b7dd8'; ctx.fillRect(T.x0 - 14, T.door.y - dh - 6 + i * 8, 6, 8); ctx.fillRect(T.x1 + 8, T.door.y - dh - 6 + i * 8, 6, 8); }
    // inside: a bench, a potted plant, a baggage belt
    this.bench(ctx, T.x0 + 36, T.y0 + 28);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, T.x0 + 12, T.y1 - 30, w - 24, 14, 6); ctx.fill(); ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, T.x0 + 16, T.y1 - 27, w - 32, 8, 4); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(T.x0 + 26, T.y1 - 29, 10, 8); ctx.fillStyle = '#f06292'; ctx.fillRect(T.x1 - 40, T.y1 - 29, 10, 8);
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(T.x1 - 14, T.y0 + 16, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(T.x1 - 14, T.y0 + 10, 6, 0, Math.PI * 2); ctx.fill();
    // sign on the roof edge facing the plaza
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x0 - 6, T.y0 - 24, w + 12, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈️ ARRIVALS', T.x0 + w / 2, T.y0 - 14);
  },
  paintHeli(r, x, y) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 5, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-20, -16, 36, 3); ctx.fillRect(-20, 13, 36, 3);   // skids
    ctx.fillStyle = '#41b883'; U.roundRect(ctx, -46, -4, 34, 8, 3); ctx.fill();   // tail boom
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(-50, -10, 6, 20); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-49, -14, 4, 3); ctx.fillRect(-49, 11, 4, 3);   // tail fin + rotor
    ctx.fillStyle = '#41b883'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.ellipse(12, 0, 9, 9, 0, 0, Math.PI * 2); ctx.fill();   // cockpit glass
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();   // rotor hub (blades turn live)
    ctx.restore();
  },

  // ---------- Cloud Harbor ----------
  paint: {
    cloud(r, g) {
      const E = AirfieldExt, ctx = r.ctx, C = CFG.CLOUD, W = C.WORLD;
      const sky = ctx.createLinearGradient(0, W.y0, 0, W.y1); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(0.55, '#8fd0f7'); sky.addColorStop(1, '#d9f0ff');
      ctx.fillStyle = sky; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W.x0 + 1200, W.y0 + 60, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,247,194,0.35)'; ctx.beginPath(); ctx.arc(W.x0 + 1200, W.y0 + 60, 50, 0, Math.PI * 2); ctx.fill();
      // far soft clouds in the gaps and a cloud sea along the bottom
      const puff = (x, y, s, a) => { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 18 * s, 0, Math.PI * 2); ctx.arc(x + 20 * s, y - 10 * s, 24 * s, 0, Math.PI * 2); ctx.arc(x + 46 * s, y, 17 * s, 0, Math.PI * 2); ctx.fill(); };
      for (let i = 0; i < 26; i++) puff(W.x0 + E.hash(i) * 1400, W.y0 + E.hash(i + 30) * 1000, 0.5 + E.hash(i + 60) * 0.5, 0.35 + E.hash(i + 90) * 0.3);
      for (let x = W.x0 - 40; x < W.x1 + 40; x += 70) puff(x, W.y1 - 30 + (x % 140 ? 6 : -6), 1.4, 0.95);
      for (const b of C.BRIDGES) E.paintBridge(r, b);
      for (const s of C.ISLANDS) E.paintIsland(r, s);
      E.paintCloudThings(r, g);
    },
  },
  paintIsland(r, s) {
    const ctx = r.ctx, w = s.x1 - s.x0, h = s.y1 - s.y0;
    ctx.fillStyle = 'rgba(30,80,140,0.16)'; U.roundRect(ctx, s.x0 + 14, s.y0 + 30, w, h, 70); ctx.fill();
    const edge = [];
    for (let x = s.x0 + 22; x <= s.x1 - 22; x += 44) { edge.push([x, s.y0 + 20]); edge.push([x, s.y1 - 20]); }
    for (let y = s.y0 + 22; y <= s.y1 - 22; y += 44) { edge.push([s.x0 + 20, y]); edge.push([s.x1 - 20, y]); }
    for (const [x, y] of edge) { ctx.fillStyle = '#b7d3ec'; ctx.beginPath(); ctx.arc(x + 4, y + 12, 30 + this.hash(x * 3 + y) * 8, 0, Math.PI * 2); ctx.fill(); }
    for (const [x, y] of edge) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 30 + this.hash(x * 3 + y) * 8, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f4f8ff'; U.roundRect(ctx, s.x0 + 16, s.y0 + 16, w - 32, h - 32, 40); ctx.fill();
    ctx.fillStyle = 'rgba(120,170,220,0.13)'; for (let i = 0; i < w * h / 6000; i++) { ctx.beginPath(); ctx.ellipse(s.x0 + 30 + this.hash(i + s.x0) * (w - 60), s.y0 + 30 + this.hash(i + s.y0 + 7) * (h - 60), 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  paintBridge(r, b) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(30,80,140,0.2)'; ctx.fillRect(b.x0 + 6, b.y0 + 10, b.x1 - b.x0, b.y1 - b.y0);
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2.5;
    if (b.v) {
      for (let y = b.y0; y < b.y1; y += 10) { ctx.fillStyle = (y / 10) % 2 ? '#b98a55' : '#a97a45'; ctx.fillRect(b.x0 + 6, y, b.x1 - b.x0 - 12, 8); }
      ctx.beginPath(); ctx.moveTo(b.x0 + 4, b.y0); ctx.quadraticCurveTo(b.x0 - 2, (b.y0 + b.y1) / 2, b.x0 + 4, b.y1); ctx.moveTo(b.x1 - 4, b.y0); ctx.quadraticCurveTo(b.x1 + 2, (b.y0 + b.y1) / 2, b.x1 - 4, b.y1); ctx.stroke();
      ctx.fillStyle = '#5b3a1a'; for (const y of [b.y0 + 14, b.y1 - 14]) { ctx.fillRect(b.x0 + 1, y - 4, 6, 8); ctx.fillRect(b.x1 - 7, y - 4, 6, 8); }
    } else {
      for (let x = b.x0; x < b.x1; x += 10) { ctx.fillStyle = (x / 10) % 2 ? '#b98a55' : '#a97a45'; ctx.fillRect(x, b.y0 + 6, 8, b.y1 - b.y0 - 12); }
      ctx.beginPath(); ctx.moveTo(b.x0, b.y0 + 4); ctx.quadraticCurveTo((b.x0 + b.x1) / 2, b.y0 - 2, b.x1, b.y0 + 4); ctx.moveTo(b.x0, b.y1 - 4); ctx.quadraticCurveTo((b.x0 + b.x1) / 2, b.y1 + 2, b.x1, b.y1 - 4); ctx.stroke();
      ctx.fillStyle = '#5b3a1a'; for (const x of [b.x0 + 14, b.x1 - 14]) { ctx.fillRect(x - 4, b.y0 + 1, 8, 6); ctx.fillRect(x - 4, b.y1 - 7, 8, 6); }
    }
  },
  paintCloudThings(r, g) {
    const ctx = r.ctx, C = CFG.CLOUD, E = this;
    const path = (x, y, w, h) => { ctx.fillStyle = '#fff0c4'; U.roundRect(ctx, x, y, w, h, 12); ctx.fill(); };
    // ---- the landing cloud: runway, apron, windsock base, a bench
    path(7480, 520, 60, 140); path(7290, 560, 600, 60); path(7880, 590, 60, 60);
    E.paintRunway(r, C.RUNWAY, false, '#8d94a3');
    E.bench(ctx, 7840, 790); E.sign(r, 7790, 800, '☁️ LANDING CLOUD');
    for (const [x, y] of [[7290, 640], [7290, 740], [7870, 640], [7870, 740]]) E.cone(ctx, x, y);
    // ---- the terminal cloud
    path(7480, 160, 60, 200); path(7300, 60, 420, 40); path(7560, 60, 60, 200); path(7660, 40, 60, 40);
    E.paintSkyTerminal(r, C.TERMINAL);
    E.paintBoard(r, C.BOARD.x, C.BOARD.y);
    E.paintCafe(r, C.CAFE);
    for (const [x, y] of C.TABLES) E.paintUmbrellaTable(r, x, y);
    // bunting between two flag poles
    const [[fx0, fy0], [fx1, fy1]] = C.FLAGS;
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(fx0 - 2, fy0, 4, 50); ctx.fillRect(fx1 - 2, fy1, 4, 50);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.quadraticCurveTo((fx0 + fx1) / 2, fy0 + 30, fx1, fy1); ctx.stroke();
    const cols = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', '#ff8fab'];
    for (let i = 0; i < 18; i++) { const k = (i + 0.5) / 18, u = 1 - k, x = u * u * fx0 + 2 * u * k * (fx0 + fx1) / 2 + k * k * fx1, y = u * u * fy0 + 2 * u * k * (fy0 + 30) + k * k * fy1; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill(); }
    // ---- the glider cloud
    path(7920, 40, 160, 60); path(8060, 80, 60, 80); path(8260, 100, 60, 200); path(8100, 240, 440, 40);
    E.paintGliderRamp(r, C.GLIDER);
    E.sign(r, 8180, 130, '🪂 GLIDER RAMP');
    E.bench(ctx, 8400, 200); E.sign(r, 8460, 210, '✈️ GLIDER CLOUD');
    // ---- the bouncy cloud: balloon mooring, bouncy pads, picnic blanket
    path(8010, 620, 400, 60); path(8380, 480, 60, 160); path(8250, 460, 60, 220);
    const B = C.BALLOON;
    ctx.fillStyle = 'rgba(30,80,140,0.12)'; ctx.beginPath(); ctx.ellipse(B.x, B.y + 8, 48, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff0c4'; ctx.beginPath(); ctx.ellipse(B.x, B.y + 4, 44, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; for (const [dx, dy] of [[-40, 0], [40, 0], [0, -22], [0, 22]]) ctx.fillRect(B.x + dx - 3, B.y + dy - 3, 6, 6);
    E.sign(r, B.x, B.y - 40, '🎈 BALLOON RIDES');
    for (const pd of C.PADS) {
      ctx.fillStyle = 'rgba(255,143,171,0.35)'; ctx.beginPath(); ctx.ellipse(pd.x + 3, pd.y + 8, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pd.x - 12, pd.y + 2, 11, 0, Math.PI * 2); ctx.arc(pd.x + 2, pd.y - 6, 14, 0, Math.PI * 2); ctx.arc(pd.x + 15, pd.y + 2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; for (const [dx, dy] of [[-18, -14], [16, -18], [22, 8]]) { ctx.beginPath(); ctx.moveTo(pd.x + dx, pd.y + dy - 4); ctx.lineTo(pd.x + dx + 1.5, pd.y + dy - 1); ctx.lineTo(pd.x + dx + 4, pd.y + dy); ctx.lineTo(pd.x + dx + 1.5, pd.y + dy + 1); ctx.lineTo(pd.x + dx, pd.y + dy + 4); ctx.lineTo(pd.x + dx - 1.5, pd.y + dy + 1); ctx.lineTo(pd.x + dx - 4, pd.y + dy); ctx.lineTo(pd.x + dx - 1.5, pd.y + dy - 1); ctx.closePath(); ctx.fill(); }
    }
    E.sign(r, 8220, 720, '☁️ BOUNCY CLOUDS');
    // picnic blanket with a pizza box
    ctx.save(); ctx.translate(8480, 760); ctx.rotate(0.15); for (let y = -22; y < 22; y += 8) for (let x = -28; x < 28; x += 8) { ctx.fillStyle = ((x + 28) / 8 + (y + 22) / 8) % 2 ? '#e4572e' : '#fff'; ctx.fillRect(x, y, 8, 8); } ctx.restore();
    r.drawPizza(8484, 756, 9);
  },
  paintSkyTerminal(r, T) {
    const ctx = r.ctx, w = T.x1 - T.x0, h = T.y1 - T.y0, cx = (T.x0 + T.x1) / 2;
    ctx.fillStyle = 'rgba(30,80,140,0.2)'; ctx.fillRect(T.x0 + 6, T.y0 + 6, w, h);
    ctx.fillStyle = '#cfe3f7'; ctx.fillRect(T.x0, T.y0, w, h);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(T.x0, T.y0, w, 26); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(T.x0, T.y0 + 22, w, 4);
    // a big glass front with blue frames, a door in the middle, a clock
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(T.x0 + 10, T.y0 + 40, w - 20, 56);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(T.x0 + 10, T.y0 + 40, w - 20, 8);
    ctx.fillStyle = '#3b7dd8'; for (let x = T.x0 + 10; x <= T.x1 - 10; x += 36) ctx.fillRect(x - 2, T.y0 + 40, 4, 56);
    ctx.fillStyle = '#2d5a8a'; ctx.fillRect(cx - 18, T.y0 + 60, 36, 36); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(cx - 14, T.y0 + 64, 13, 28); ctx.fillRect(cx + 1, T.y0 + 64, 13, 28);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(cx - 24, T.y1 - 4, 48, 8);   // door mat
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, T.y0 + 34, 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, T.y0 + 34, 9, 0, Math.PI * 2); ctx.moveTo(cx, T.y0 + 34); ctx.lineTo(cx, T.y0 + 28); ctx.moveTo(cx, T.y0 + 34); ctx.lineTo(cx + 5, T.y0 + 36); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 92, T.y0 - 16, 184, 28, 7); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☁️ SKY TERMINAL ✈️', cx, T.y0 - 2);
  },
  paintBoard(r, x, y) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(30,80,140,0.2)'; ctx.fillRect(x - 96, y - 56, 200, 70);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 90, y - 10, 8, 14); ctx.fillRect(x + 82, y - 10, 8, 14);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 100, y - 64, 200, 70, 6); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈️ DEPARTURES ✈️', x, y - 54);
    ctx.strokeStyle = 'rgba(255,224,138,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 92, y - 46); ctx.lineTo(x + 92, y - 46); ctx.stroke();
    const rows = [['PIZZA MOON', '12:00', 'ON TIME', '#8ef0a0'], ['SAUCE BAY', '12:30', 'BOARDING', '#ffd166'], ['CHEESE PEAK', '1:15', 'DELAYED', '#ff8c8c'], ['HOME 🍕', 'ANY TIME', 'GO!', '#8ef0a0']];
    ctx.font = r.font(8);
    rows.forEach(([dest, time, st, col], i) => { const yy = y - 38 + i * 10; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(dest, x - 92, yy); ctx.fillStyle = '#ffe08a'; ctx.fillText(time, x - 18, yy); ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.fillText(st, x + 92, yy); });
  },
  paintCafe(r, K) {
    const ctx = r.ctx, w = K.x1 - K.x0, h = K.y1 - K.y0, cx = (K.x0 + K.x1) / 2;
    ctx.fillStyle = 'rgba(30,80,140,0.2)'; ctx.fillRect(K.x0 + 6, K.y0 + 6, w, h);
    ctx.fillStyle = '#ffcc80'; ctx.fillRect(K.x0, K.y0, w, h);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(K.x0, K.y0, w, 22); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(K.x0, K.y0 + 18, w, 4);
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(K.x0 + 10, K.y0 + 36, 34, 26); ctx.fillRect(K.x1 - 44, K.y0 + 36, 34, 26); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(K.x0 + 10, K.y0 + 36, 34, 5); ctx.fillRect(K.x1 - 44, K.y0 + 36, 34, 5);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 11, K.y1 - 34, 22, 34); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx + 6, K.y1 - 16, 2, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(K.x0 + 8 + i * ((w - 16) / 6), K.y1 - 6, (w - 16) / 6 + 0.5, 12); ctx.beginPath(); ctx.arc(K.x0 + 8 + i * ((w - 16) / 6) + (w - 16) / 12, K.y1 + 6, (w - 16) / 12, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 44, K.y0 + 66, 88, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☕ SKY CAFÉ', cx, K.y0 + 75);
  },
  paintUmbrellaTable(r, x, y) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(30,80,140,0.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 8, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; for (const dx of [-22, 22]) { U.roundRect(ctx, x + dx - 6, y - 5, 12, 10, 3); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#e4572e' : '#fff8ee'; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.arc(x, y - 14, 20, i * Math.PI / 4, (i + 1) * Math.PI / 4); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x, y - 14, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  paintGliderRamp(r, G) {
    const ctx = r.ctx, a = Math.atan2(G.launch.y - G.top.y, G.launch.x - G.top.x), len = U.dist(G.top.x, G.top.y, G.launch.x, G.launch.y);
    ctx.save(); ctx.translate(G.top.x, G.top.y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(30,80,140,0.2)'; ctx.fillRect(4, -14, len + 20, 36);
    ctx.fillStyle = '#5b3a1a'; for (const x of [6, len / 2, len + 10]) { ctx.fillRect(x - 3, -22, 6, 8); ctx.fillRect(x - 3, 16, 6, 8); }
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -20); ctx.lineTo(len + 10, -20); ctx.moveTo(6, 20); ctx.lineTo(len + 10, 20); ctx.stroke();
    for (let x = 0; x < len + 16; x += 9) { ctx.fillStyle = (x / 9) % 2 ? '#c9975f' : '#b98a55'; ctx.fillRect(x, -16, 8, 32); }
    ctx.fillStyle = '#ffd166'; ctx.fillRect(len + 8, -16, 8, 32); ctx.fillStyle = '#2b1d14'; for (let y = -14; y < 16; y += 6) ctx.fillRect(len + 8, y, 8, 2);
    ctx.restore();
    ctx.save(); ctx.translate(G.top.x + 8, G.top.y - 24); ctx.scale(0.7, 0.7); this.drawGliderWing(r); ctx.restore();
  },

  // ---------- things that move, under the people ----------
  dynamic(r, g) {
    const rt = this.rt; if (!rt) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'town') {
      if (r.camX + r.viewW < CFG.AIRFIELD.STRIP.x0 - 40) return;   // nothing of mine on screen
      this.drawWindsock(r, g, CFG.AIRFIELD.WINDSOCK.x, CFG.AIRFIELD.WINDSOCK.y, 1);
      const H = CFG.AIRFIELD.HELI;   // the parked helicopter's rotor idles round slowly
      ctx.save(); ctx.translate(H.x, H.y); ctx.rotate(t * 0.9); ctx.strokeStyle = 'rgba(43,29,20,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke(); ctx.restore();
      return;
    }
    if (g.area !== 'cloud') return;
    this.drawWindsock(r, g, CFG.CLOUD.WINDSOCK.x, CFG.CLOUD.WINDSOCK.y, -1);
    const rd = rt.ride;
    if (rd && rd.lift > 0) { ctx.fillStyle = 'rgba(30,80,140,0.2)'; ctx.beginPath(); ctx.ellipse(rd.gx, rd.gy + 4, 18 - rd.lift * 0.08, 7 - rd.lift * 0.03, 0, 0, Math.PI * 2); ctx.fill(); }
    const b = rt.balloon; ctx.fillStyle = 'rgba(30,80,140,0.18)'; ctx.beginPath(); ctx.ellipse(b.x + 12, b.y + 20, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
  },
  drawWindsock(r, g, x, y, dir) {
    const ctx = r.ctx, t = g.time, a = Math.sin(t * 2.6) * 0.12 + Math.sin(t * 7) * 0.04, len = 28 + Math.sin(t * 3) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 2, y - 44, 4, 44);
    ctx.save(); ctx.translate(x, y - 42); ctx.rotate(a + (dir < 0 ? Math.PI : 0));
    for (let i = 0; i < 4; i++) { const x0 = i * len / 4, x1 = (i + 1) * len / 4, h0 = 7 - i * 1.2, h1 = 7 - (i + 1) * 1.2, fl = Math.sin(t * 9 + i) * 1.2; ctx.fillStyle = i % 2 ? '#fff' : '#ff8c42'; ctx.beginPath(); ctx.moveTo(x0, -h0); ctx.lineTo(x1, -h1 + fl); ctx.lineTo(x1, h1 + fl); ctx.lineTo(x0, h0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },

  // ---------- y-sorted things: the planes, the tower, the balloon, the pilot, the glider ----------
  entities(r, g, items) {
    const rt = this.rt; if (!rt) return;
    if (g.area === 'town') {
      const v = rt.plane; items.push({ y: v.y + 12, draw: () => this.drawPlaneTop(r, g, v) });
      const T = CFG.AIRFIELD.TOWER; items.push({ y: T.y + 14, draw: () => this.drawTower(r, g, T.x, T.y) });
      return;
    }
    if (g.area !== 'cloud') return;
    items.push({ y: rt.cloudPlane.y + 12, draw: () => this.drawPlaneTop(r, g, rt.cloudPlane) });
    items.push({ y: rt.balloon.y + 14, draw: () => this.drawBalloon(r, g, rt.balloon) });
    items.push({ y: CFG.CLOUD.PILOT.y, draw: () => this.drawPilot(r, g) });
    const rd = rt.ride, p = g.player;
    if (rd && rd.kind === 'glide') items.push({ y: p.y + 1, draw: () => { const ctx = r.ctx; ctx.save(); ctx.translate(p.x, p.y - 58); this.drawGliderWing(r); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-14, 40); ctx.moveTo(10, 6); ctx.lineTo(14, 40); ctx.stroke(); ctx.restore(); } });
    if (rd && rd.kind === 'chute') items.push({ y: p.y + 1, draw: () => this.drawChute(r, p.x, p.y) });
  },
  drawPlaneTop(r, g, v) {
    const ctx = r.ctx;
    if (!(v.lift > 0)) { r.drawSiteVehicle(g, v, 30); return; }
    ctx.save(); ctx.translate(v.x + v.lift * 0.5, v.y + v.lift * 1.3); ctx.rotate(v.angle); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 36, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(0, -v.lift); r.drawSiteVehicle(g, v, 30); ctx.restore();
  },
  drawTower(r, g, x, y) {
    const ctx = r.ctx, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 8, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e4d8'; U.roundRect(ctx, x - 22, y - 26, 44, 36, 5); ctx.fill(); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 6, y - 10, 12, 18);
    ctx.fillStyle = '#c9c3b5'; ctx.fillRect(x - 10, y - 118, 20, 94); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 4, y - 118, 6, 94);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, x - 28, y - 156, 56, 40, 6); ctx.fill();
    ctx.fillStyle = '#9fe0ff'; U.roundRect(ctx, x - 24, y - 150, 48, 24, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - 24, y - 150, 48, 6);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 4, y - 150, 3, 24); ctx.fillRect(x + 10, y - 150, 3, 24); ctx.fillRect(x - 16, y - 150, 3, 24);
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x + 4, y - 136, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(x + 4, y - 139, 5.5, Math.PI, 0); ctx.fill();   // the controller
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, x - 32, y - 160, 64, 8, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TOWER', x, y - 110);
    // the beacon: two beams (white and green) sweeping round slowly
    const a = t * 1.3, bx = x, by = y - 168;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(bx - 2, by, 4, 8);
    for (const [off, col] of [[0, 'rgba(255,255,255,0.35)'], [Math.PI, 'rgba(120,255,160,0.35)']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + off - 0.18) * 46, by + Math.sin(a + off - 0.18) * 18); ctx.lineTo(bx + Math.cos(a + off + 0.18) * 46, by + Math.sin(a + off + 0.18) * 18); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#fff' : '#8ef0a0'; ctx.beginPath(); ctx.arc(bx, by, 3.5, 0, Math.PI * 2); ctx.fill();
  },
  drawBalloon(r, g, b) {
    const ctx = r.ctx, riding = g.driving && g.vehicle === b;
    ctx.save(); ctx.translate(b.x, b.y); r.drawVehicle('balloonride', g, g.s.paint.balloonride, b);
    if (riding) { ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(0, -12, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; U.roundRect(ctx, -6, -24, 12, 7, 2); ctx.fill(); ctx.beginPath(); ctx.arc(-3, -25, 4, 0, Math.PI * 2); ctx.arc(3, -25, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-3, -13, 2, 2); ctx.fillRect(1, -13, 2, 2); }
    ctx.restore();
    r.drawRidingExtras(g, b, 108);
  },
  drawPilot(r, g) {
    const ctx = r.ctx, P = CFG.CLOUD.PILOT, p = g.player, d = U.dist(p.x, p.y, P.x, P.y), t = g.time;
    r.drawPerson(P.x, P.y, { shirt: '#2d3a4a', skin: '#c68642', hat: 'cap', capColor: '#1f2a38', facing: -1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
    ctx.fillStyle = '#ffd166'; ctx.fillRect(P.x - 9, P.y - 25, 6, 2); ctx.fillRect(P.x - 11, P.y - 21, 8, 2);   // wings badge
    if (d < 150) { ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(P.x - 18, P.y - 34 + Math.sin(t * 7) * 5, 3.5, 0, Math.PI * 2); ctx.fill(); }   // waving
    if (d < 90) r.drawBubble(P.x, P.y - 66 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Hi, Chef! ✈️', 0, 0); }, 92);
  },
  drawGliderWing(r) {
    const ctx = r.ctx;
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(-54, 12); ctx.quadraticCurveTo(-24, -16, 0, -22); ctx.quadraticCurveTo(24, -16, 54, 12); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-36, 6); ctx.quadraticCurveTo(-18, -8, -8, -14); ctx.lineTo(-4, -4); ctx.lineTo(-26, 6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(36, 6); ctx.quadraticCurveTo(18, -8, 8, -14); ctx.lineTo(4, -4); ctx.lineTo(26, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, 4); ctx.moveTo(-54, 12); ctx.lineTo(0, 2); ctx.lineTo(54, 12); ctx.stroke();
  },
  drawChute(r, x, y) {
    const ctx = r.ctx, cy = y - 88;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const dx of [-30, -10, 10, 30]) { ctx.moveTo(x + dx, cy + 2); ctx.lineTo(x + (dx < 0 ? -12 : 12), y - 26); } ctx.stroke();
    const cols = ['#e4572e', '#ffd166', '#3b7dd8', '#ffd166', '#e4572e'];
    for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(x, cy + 4); ctx.arc(x, cy + 4, 32, Math.PI + i * Math.PI / 5, Math.PI + (i + 1) * Math.PI / 5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x, cy + 4, 32, Math.PI, Math.PI * 1.5); ctx.lineTo(x, cy + 4); ctx.closePath(); ctx.fill();
  },

  // ---------- things in the sky above everybody ----------
  overlay(r, g) {
    const rt = this.rt; if (!rt || g.area !== 'cloud') return;
    const ctx = r.ctx, t = g.time, C = CFG.CLOUD;
    const onScreen = (x, y, m) => x > r.camX - m && x < r.camX + r.viewW + m && y > r.camY - m && y < r.camY + r.viewH + m;
    for (const j of rt.jumpers) {
      if (!onScreen(j.x, j.y, 60)) continue;
      const sway = Math.sin(j.ph * 1.2) * 6;
      ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(j.x - 14, j.y - 36); ctx.lineTo(j.x + sway - 3, j.y - 12); ctx.moveTo(j.x + 14, j.y - 36); ctx.lineTo(j.x + sway + 3, j.y - 12); ctx.stroke();
      ctx.fillStyle = j.col; ctx.beginPath(); ctx.arc(j.x, j.y - 36, 16, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(j.x, j.y - 36, 16, Math.PI, Math.PI * 1.5); ctx.lineTo(j.x, j.y - 36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, j.x + sway - 4, j.y - 12, 8, 10, 3); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(j.x + sway, j.y - 16, 4, 0, Math.PI * 2); ctx.fill();
    }
    // the blimp
    const bx = rt.blimpX, by = C.WORLD.y0 + 60 + Math.sin(t * 0.5) * 6;
    if (onScreen(bx, by, 220)) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.ellipse(bx + 20, by + 120, 60, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cfe3f7'; ctx.beginPath(); ctx.ellipse(bx, by, 64, 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; ctx.fillRect(bx - 66, by - 4, 10, 8); ctx.beginPath(); ctx.moveTo(bx - 56, by - 2); ctx.lineTo(bx - 72, by - 18); ctx.lineTo(bx - 50, by - 8); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 56, by + 2); ctx.lineTo(bx - 72, by + 18); ctx.lineTo(bx - 50, by + 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(bx - 10, by - 10, 36, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, bx - 14, by + 20, 28, 10, 3); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(bx - 10, by + 22, 20, 4);
      ctx.fillStyle = '#e4572e'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA AIR', bx, by + 1);
      // the banner it tows
      const wave = Math.sin(t * 3) * 4;
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 70, by); ctx.lineTo(bx - 96, by + 10 + wave); ctx.stroke();
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, bx - 226, by + 2 + wave, 130, 18, 3); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.fillText('🍕 EAT AT NAPLES STREET', bx - 161, by + 11 + wave);
    }
    // a few birds wheeling about
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const cx = 7600 + (i % 2) * 700, cy = 150 + Math.floor(i / 2) * 420, a = t * 0.3 + i * 1.6;
      const x = cx + Math.cos(a) * (230 + i * 30), y = cy + Math.sin(a) * 100 + Math.sin(t * 2 + i) * 8;
      if (!onScreen(x, y, 30)) continue;
      const flap = Math.sin(t * 9 + i) * 4;
      ctx.beginPath(); ctx.moveTo(x - 10, y + flap); ctx.quadraticCurveTo(x - 5, y - 4, x, y); ctx.quadraticCurveTo(x + 5, y - 4, x + 10, y + flap); ctx.stroke();
    }
  },

  // the fade at the end of the take-off run
  screen(r, g) {
    const rt = this.rt; if (!rt || !rt.runup || g.travel) return;
    const f = (rt.runup.t - (rt.runup.dur - 0.4)) / 0.4; if (f <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(43,29,20,${Math.min(1, f).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },

  // ---------- vehicle art (drawn at the origin, nose +x) ----------
  vehicleArt: {
    plane(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#f2b134', t = g.time, spinning = v && (v.lift > 0 || (g.driving && g.vehicle === v) || (AirfieldExt.rt && AirfieldExt.rt.roll && AirfieldExt.rt.roll.plane === v));
      if (!(v && v.lift > 0)) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(2, 5, 36, 12, 0, 0, Math.PI * 2); ctx.fill(); U.roundRect(ctx, -4, -42, 22, 94, 6); ctx.fill(); }
      // wings
      ctx.fillStyle = c; U.roundRect(ctx, -6, -46, 22, 92, 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-6, -46, 22, 3); ctx.fillRect(-6, 43, 22, 3);
      ctx.fillStyle = '#fff'; U.roundRect(ctx, -4, -46, 18, 9, 4); ctx.fill(); U.roundRect(ctx, -4, 37, 18, 9, 4); ctx.fill();
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(5, -44, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#44d36a'; ctx.beginPath(); ctx.arc(5, 44, 2, 0, Math.PI * 2); ctx.fill();   // nav lights
      r.drawPizza(5, -28, 6); r.drawPizza(5, 28, 6);
      // tail
      ctx.fillStyle = c; U.roundRect(ctx, -38, -20, 10, 40, 3); ctx.fill();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, -38, -20, 10, 6, 2); ctx.fill(); U.roundRect(ctx, -38, 14, 10, 6, 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -40, -3, 18, 6, 2); ctx.fill();   // fin
      // fuselage
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(34, 0); ctx.quadraticCurveTo(34, -9, 20, -9); ctx.lineTo(-10, -9); ctx.quadraticCurveTo(-30, -7, -36, -3); ctx.lineTo(-36, 3); ctx.quadraticCurveTo(-30, 7, -10, 9); ctx.lineTo(20, 9); ctx.quadraticCurveTo(34, 9, 34, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, -30, -3, 50, 5, 2); ctx.fill();
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 2, -6, 18, 12, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, 4, -5, 7, 4, 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(34, 0, 4, 0, Math.PI * 2); ctx.fill();
      // propeller
      if (spinning) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(37, 0, 3, 21, 0, 0, Math.PI * 2); ctx.fill(); }
      const blade = spinning ? Math.cos(t * 40) * 20 : 20;
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(37, -blade); ctx.lineTo(37, blade); ctx.stroke();
    },
    // the balloon is drawn without the core's rotation: basket at the origin, the envelope "above" it on screen
    balloonride(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#e4572e', t = g.time, bob = Math.sin(t * 1.6) * 3;
      ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const dx of [-10, 10]) { ctx.moveTo(dx, -8); ctx.lineTo(dx * 2.4, -40 + bob); } ctx.stroke();
      ctx.fillStyle = '#a8763e'; U.roundRect(ctx, -13, -10, 26, 20, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = -6; y < 8; y += 5) ctx.fillRect(-13, y, 26, 1.5); for (let x = -8; x < 12; x += 6) ctx.fillRect(x, -10, 1.5, 20);
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, -13, -10, 26, 4, 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -7, -46 + bob, 14, 8, 2); ctx.fill();   // burner
      ctx.fillStyle = Math.floor(t * 6) % 2 ? '#ffd166' : '#ff8c42'; ctx.beginPath(); ctx.arc(0, -48 + bob, 4, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(0, -84 + bob);
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 36, 40, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 36, 40, 0, 0, Math.PI * 2); ctx.clip();
      for (const [x, w, col] of [[-26, 10, '#fff8ee'], [-6, 12, '#ffd166'], [14, 10, '#fff8ee']]) { ctx.fillStyle = col; ctx.fillRect(x, -44, w, 88); }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-40, 18, 80, 30);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-12, -16, 9, 14, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },

  // ---------- the flight, side on, full screen ----------
  travel: {
    flight(r, g, W, H) {
      const E = AirfieldExt, ctx = r.ctx, tr = g.travel, t = g.time, home = tr.to === 'town';
      const k = tr.t / tr.dur, ease = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1;
      const dist = tr.t * 380;
      // altitude: climb away from the start, cruise, then come down to the destination
      const alt = home ? (k < 0.45 ? 1 : 1 - U.easeOut((k - 0.45) / 0.55)) : (k < 0.45 ? U.easeOut(k / 0.45) : 1);
      const climb = home ? 0 : Math.max(0, 1 - k / 0.4), descent = Math.sin(U.clamp((k - 0.55) / 0.45, 0, 1) * Math.PI);
      const pitch = -0.22 * climb + 0.14 * descent;
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#3f9fe6'); sky.addColorStop(0.55, '#8fd0f7'); sky.addColorStop(1, '#d9f0ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.14, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();
      const layer = (speed, step, draw) => { const off = dist * speed; const i0 = Math.floor((off - 300) / step), i1 = Math.ceil((off + W + 300) / step); for (let i = i0; i <= i1; i++) draw(i * step - off, i); };
      const cloud = (x, y, s, a) => { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 18 * s, 0, Math.PI * 2); ctx.arc(x + 20 * s, y - 10 * s, 24 * s, 0, Math.PI * 2); ctx.arc(x + 46 * s, y, 17 * s, 0, Math.PI * 2); ctx.arc(x + 24 * s, y + 6 * s, 20 * s, 0, Math.PI * 2); ctx.fill(); };
      // far clouds high up, sliding down the screen as the plane climbs above them
      layer(0.12, 420, (x, i) => cloud(x, H * (0.1 + E.hash(i) * 0.2) + alt * H * 0.3, 0.8 + E.hash(i + 9) * 0.4, 0.8));
      layer(0.3, 330, (x, i) => cloud(x, H * (0.3 + E.hash(i + 3) * 0.25) + alt * H * 0.35, 1 + E.hash(i + 5) * 0.5, 0.9));
      // the ground, sinking away and shrinking (or rising up to meet us when we come home)
      const groundY = H * 0.7 + alt * H * 0.95, s = 1 - 0.7 * alt;
      if (groundY < H + 300) E.sceneGround(ctx, r, W, H, groundY, s, dist, t);
      // Cloud Harbor's floating islands arrive from the right, or slide away behind us
      if (!home && k > 0.5) { const q = (k - 0.5) / 0.5; E.sceneIslands(ctx, r, W * 1.4 - U.easeOut(q) * W * 0.95, H * 0.62 - q * H * 0.1, t); }
      if (home && k < 0.5) { const q = k / 0.5; E.sceneIslands(ctx, r, W * 0.45 - q * q * W * 1.4, H * 0.52 + q * H * 0.25, t); }
      // a hot-air balloon drifts by halfway, and a V of birds early on
      if (k > 0.28 && k < 0.75) { const q = (k - 0.28) / 0.47; E.sceneBalloon(ctx, W * 1.15 - q * W * 1.35, H * (0.3 + (home ? 0.15 : 0)) + Math.sin(t * 1.3) * 8, t); }
      { const q = ((t * 0.09) % 1.4), bx = W * 1.1 - q * W * 1.2, by = H * 0.2 + Math.sin(t) * 10; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const x = bx - Math.abs(i - 2) * 22, y = by + Math.abs(i - 2) * 12, flap = Math.sin(t * 9 + i) * 4; ctx.beginPath(); ctx.moveTo(x - 9, y + flap); ctx.quadraticCurveTo(x - 4, y - 4, x, y); ctx.quadraticCurveTo(x + 4, y - 4, x + 9, y + flap); ctx.stroke(); } }
      // near clouds whipping past below the plane
      layer(1.1, 300, (x, i) => cloud(x, H * (0.78 + E.hash(i + 7) * 0.2) - (1 - alt) * H * 0.6, 1.5 + E.hash(i + 11) * 0.8, 0.95));
      // the plane, with contrail puffs behind it
      const sc = Math.min(1.1, W / 720), px = W * 0.42, py = H * 0.5 + Math.sin(t * 2) * 4 - climb * H * 0.04;
      for (let i = 0; i < 9; i++) { const age = ((t * 1.6 + i * 0.45) % 4) / 4; ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - age)})`; ctx.beginPath(); ctx.arc(px - 100 * sc - age * 320, py + 8 * sc + Math.sin(i) * 6 + age * 40 * (climb - descent), (5 + age * 20) * sc, 0, Math.PI * 2); ctx.fill(); }
      E.drawPlaneSide(r, g, px, py, sc, pitch, t, r.paintColor(g.s.paint.plane, g) || '#f2b134');
      // banner and progress bar, like the train ride
      const msg = home ? '✈️ Next stop: home! 🍕' : '✈️ Next stop: Cloud Harbor! ☁️';
      ctx.fillStyle = 'rgba(43,29,20,0.85)'; const bw = Math.min(W - 24, 360); U.roundRect(ctx, W / 2 - bw / 2, 60, bw, 44, 12); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 300 ? 14 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 82);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, bw - 32, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, (bw - 32) * U.clamp(k, 0, 1), 6, 3); ctx.fill();
      if (ease < 1) { ctx.fillStyle = `rgba(43,29,20,${1 - ease})`; ctx.fillRect(0, 0, W, H); }
    },
  },
  // fields, a road, the river and the roofs of town rolling past far below
  sceneGround(ctx, r, W, H, groundY, s, dist, t) {
    const E = this;
    ctx.save(); ctx.translate(W / 2, groundY); ctx.scale(s, s); ctx.translate(-W / 2, 0);
    const span = W / s + 500, x0 = W / 2 - span / 2, deep = (H - groundY) / s + 400;
    ctx.fillStyle = '#6cb35a'; ctx.fillRect(x0, -6, span, deep);
    const layer = (step, draw) => { const i0 = Math.floor((dist + x0) / step) - 1, i1 = Math.ceil((dist + x0 + span) / step) + 1; for (let i = i0; i <= i1; i++) draw(i * step - dist, i); };
    layer(170, (x, i) => { ctx.fillStyle = i % 3 === 0 ? '#c9b25a' : i % 3 === 1 ? '#8bc34a' : '#5fa84f'; ctx.fillRect(x, 60, 160, 150); ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let yy = 70; yy < 200; yy += 14) ctx.fillRect(x + 6, yy, 148, 3); });
    ctx.fillStyle = '#474a50'; ctx.fillRect(x0, 20, span, 26); layer(44, (x) => { ctx.fillStyle = '#f2c94c'; ctx.fillRect(x, 31, 22, 4); });
    ctx.fillStyle = '#5cb8ea'; ctx.beginPath(); ctx.moveTo(x0, 230); for (let x = x0; x <= x0 + span; x += 40) ctx.lineTo(x, 230 + Math.sin((x + dist) * 0.02) * 10); ctx.lineTo(x0 + span, 290); ctx.lineTo(x0, 290); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; layer(90, (x, i) => ctx.fillRect(x, 250 + (i % 3) * 10, 30, 3));
    // roofs: little houses between the road and the fields, the pizza shop every so often
    layer(130, (x, i) => {
      const hh = E.hash(i), pizza = i % 7 === 0;
      const col = pizza ? '#e4572e' : ['#b23a48', '#2d5a8a', '#5a8a2d', '#8e5bd1', '#f06292'][i % 5];
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 14, -2 + 4, 70, 60);
      ctx.fillStyle = ['#f2d6a0', '#cfe3f7', '#e8f2cf', '#ffd6e3'][i % 4]; ctx.fillRect(x + 10, -2, 70, 60);
      ctx.fillStyle = col; ctx.fillRect(x + 10, -2, 70, 24); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 10, -2, 70, 5);
      if (pizza) { r.drawPizza(x + 45, 40, 12); } else { ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x + 20, 32, 14, 12); ctx.fillRect(x + 56, 32, 14, 12); }
      if (hh > 0.5) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x + 100, 30 + hh * 20, 16, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.restore();
  },
  // Cloud Harbor from the air: a few floating cloud islands with a tiny runway, terminal and balloon
  sceneIslands(ctx, r, x, y, t) {
    const isle = (ix, iy, w, h) => { ctx.fillStyle = 'rgba(30,80,140,0.15)'; U.roundRect(ctx, ix - w / 2 + 8, iy - h / 2 + 14, w, h, 30); ctx.fill(); ctx.fillStyle = '#fff'; for (let px = -w / 2; px <= w / 2; px += 32) { ctx.beginPath(); ctx.arc(ix + px, iy - h / 2 + 8, 20, 0, Math.PI * 2); ctx.arc(ix + px, iy + h / 2 - 8, 20, 0, Math.PI * 2); ctx.fill(); } for (let py = -h / 2; py <= h / 2; py += 28) { ctx.beginPath(); ctx.arc(ix - w / 2 + 8, iy + py, 20, 0, Math.PI * 2); ctx.arc(ix + w / 2 - 8, iy + py, 20, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#f4f8ff'; U.roundRect(ctx, ix - w / 2 + 6, iy - h / 2 + 6, w - 12, h - 12, 20); ctx.fill(); };
    const bob = Math.sin(t * 1.2) * 4;
    isle(x, y + bob, 260, 110); isle(x + 240, y - 90 - bob, 160, 80); isle(x - 60, y - 140 + bob * 0.5, 180, 70);
    ctx.fillStyle = '#8d94a3'; ctx.fillRect(x - 100, y - 8 + bob, 200, 22); ctx.fillStyle = '#fff'; for (let px = -86; px < 90; px += 24) ctx.fillRect(x + px, y + 2 + bob, 12, 3);
    ctx.fillStyle = '#cfe3f7'; ctx.fillRect(x - 110, y - 170 + bob * 0.5, 80, 30); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(x - 110, y - 170 + bob * 0.5, 80, 8);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x + 240, y - 140 - bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a8763e'; ctx.fillRect(x + 236, y - 118 - bob, 8, 6);
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 120, y - 10 + bob); ctx.quadraticCurveTo(x + 150, y - 30, x + 170, y - 60 - bob); ctx.stroke();
  },
  sceneBalloon(ctx, x, y, t) {
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 10, y + 50); ctx.lineTo(x - 24, y + 10); ctx.moveTo(x + 10, y + 50); ctx.lineTo(x + 24, y + 10); ctx.stroke();
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(x, y, 36, 42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, 36, 42, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 10, y - 50, 20, 100); ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - 30, y - 50, 8, 100); ctx.fillRect(x + 22, y - 50, 8, 100); ctx.restore();
    ctx.fillStyle = '#a8763e'; U.roundRect(ctx, x - 12, y + 50, 24, 16, 3); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y + 48, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 12, y + 36 + Math.sin(t * 6) * 3, 3, 0, Math.PI * 2); ctx.fill();
  },
  // the little plane seen from the side, flying to the right, the chef at the controls
  drawPlaneSide(r, g, x, y, s, pitch, t, c) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(pitch);
    const shade = 'rgba(0,0,0,0.18)';
    // far wing (behind the fuselage) and the tail
    ctx.fillStyle = c; U.roundRect(ctx, -26, -16, 64, 10, 5); ctx.fill(); ctx.fillStyle = shade; U.roundRect(ctx, -26, -16, 64, 10, 5); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-56, -20); ctx.lineTo(-74, -64); ctx.lineTo(-94, -64); ctx.lineTo(-86, -20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, -84, -58, 16, 10, 3); ctx.fill(); r.drawPizza(-76, -45, 7);
    ctx.fillStyle = c; U.roundRect(ctx, -100, -12, 40, 8, 4); ctx.fill();
    // fuselage
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(72, 0); ctx.quadraticCurveTo(72, -22, 42, -24); ctx.lineTo(-40, -22); ctx.quadraticCurveTo(-78, -20, -92, -6); ctx.lineTo(-92, 6); ctx.quadraticCurveTo(-78, 20, -40, 22); ctx.lineTo(42, 24); ctx.quadraticCurveTo(72, 22, 72, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(60, 8); ctx.lineTo(-80, 8); ctx.quadraticCurveTo(-70, 18, -40, 18); ctx.lineTo(40, 20); ctx.quadraticCurveTo(58, 18, 60, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(-60, -2, 110, 5);
    // cockpit with the chef
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 6, -40, 40, 22, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, 10, -38, 14, 6, 3); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(26, -26, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, 18, -42, 16, 8, 3); ctx.fill(); ctx.beginPath(); ctx.arc(22, -44, 5, 0, Math.PI * 2); ctx.arc(30, -44, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(28, -28, 2, 2); ctx.fillRect(32, -28, 2, 2); ctx.beginPath(); ctx.ellipse(30, -22, 3, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(40, -34 + Math.sin(t * 7) * 3, 3.5, 0, Math.PI * 2); ctx.fill();   // waving
    // near wing with a strut
    ctx.fillStyle = c; U.roundRect(ctx, -14, -2, 70, 12, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-10, 0, 62, 3);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, 10); ctx.lineTo(4, 22); ctx.stroke();
    // wheels
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, 22); ctx.lineTo(22, 36); ctx.moveTo(-50, 20); ctx.lineTo(-52, 32); ctx.stroke();
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(22, 38, 7, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-52, 34, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(22, 38, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-52, 34, 2.5, 0, Math.PI * 2); ctx.fill();
    // the propeller
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(76, 0, 5, 34, 0, 0, Math.PI * 2); ctx.fill();
    const b = Math.cos(t * 42) * 32;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(76, -b); ctx.lineTo(76, b); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(73, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
};
Game.ext.push(AirfieldExt);
Render.ext.push(AirfieldExt);
