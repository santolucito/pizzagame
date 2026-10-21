'use strict';
// The airfield east of the fire station and the flight to Cloud Harbor.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// The strip of town past the fire station is a little airfield: a north–south runway, a hangar with the
// chef's plane parked in front of it, a control tower, a windsock and an arrivals gate on the west edge
// (customers come out of it and walk to the shops). Hop in the plane, press the button and
// press the big button: the plane climbs through the clouds (side-on cut-scene) to CLOUD HARBOR, a map of
// floating cloud islands joined by rope bridges, with a sky terminal, a hot-air balloon to ride, a glider
// ramp, bouncy clouds, a café with a waving pilot (go inside for a Cloud Cocoa and a seat by the window),
// a blimp and parachute jumpers. The plane waiting on the cloud runway flies you home again and rolls up
// to the hangar.

// ---------- config ----------
CFG.AIRFIELD = {
  STRIP: { x0: 1540, y0: -170, x1: 2460, y1: 1330 },      // the part of the town map that is the airfield
  RUNWAY: { x0: 1760, y0: 150, x1: 1880, y1: 1250 },
  TAXIWAY: { x0: 2140, y0: 180, x1: 2190, y1: 1200 },     // parallel taxiway between the hangar and the main apron
  STUBS: [[180, 230], [1130, 1180]],                      // y ranges of the links between the runway and the taxiway (the hangar apron is the third)
  HANGAR_APRON: { x0: 1880, y0: 430, x1: 2140, y1: 560 },  // concrete from the runway edge to the hangar stand and the helipad
  APRON: { x0: 2190, y0: 300, x1: 2460, y1: 840 },        // the main apron: stands, the jet at its gate
  HANGAR: { x0: 1910, y0: 240, x1: 2110, y1: 420, bays: [1960, 2060], bayHalf: 42 },   // two bays, doors on the apron side
  SHED: { x0: 2250, y0: 200, x1: 2350, y1: 320 },         // the maintenance workshop
  FUEL_FARM: { x0: 2400, y0: 150, x1: 2460, y1: 270 },    // two big tanks behind a fence
  PLANE_HOME: { x: 1940, y: 480, angle: 0 },             // stand 1, in front of the hangar's first bay, right beside the runway
  LANDING: [{ x: 1820, y: 200 }, { x: 1820, y: 480 }, { x: 1940, y: 480 }],   // the landing roll: down the runway, then off onto the stand
  TERMINAL: { x0: 1600, y0: 540, x1: 1700, y1: 670, door: { x: 1590, y: 605 }, doorHalf: 20 },   // the arrivals gate: a hall you walk through, a viewing deck on the roof
  PLAZA: { x0: 1540, y0: 560, x1: 1600, y1: 700 },       // pavement in front of the gate joining the sidewalks (nothing solid here)
  PAD: { x0: 1600, y0: 520, x1: 1740, y1: 690 },         // concrete around the terminal
  CARPARK: { x0: 1600, y0: 700, x1: 1720, y1: 860 },
  TOWER: { x: 1640, y: 400 },
  WINDSOCK: { x: 1700, y: 250 },
  FUEL: { x: 2230, y: 380 },
  CART: { x: 2430, y: 700 },
  HELI: { x: 2080, y: 510 },                              // the helipad on the hangar apron
  PARKED: [{ x: 2260, y: 790, color: '#3b7dd8' }, { x: 2380, y: 790, color: '#e4572e' }],   // visitors' little planes on the stands
  JET: { x: 2300, y: 600 },                              // the passenger jet at its gate, nose to the taxiway
  GATE: { x0: 2400, y0: 560, x1: 2460, y1: 640 },        // the gate pier; a jet-bridge reaches the jet's door
  RADAR: { x: 2400, y: 1000 },
  HEDGE: { x0: 1560, y0: 106, x1: 2440, y1: 118 },
  BENCH: { x: 2200, y: 920 },
  SIGNS: [[2250, 926, '🔭 PLANE SPOTTING'], [1566, 530, '✈️ AIRFIELD'], [1660, 880, '🅿️ CAR PARK'], [2300, 362, '🔧 WORKSHOP'], [2430, 300, '⛽ FUEL FARM']],   // all walk-through
  CONES: [[1750, 132], [1892, 132], [1750, 1268], [1892, 1268], [1895, 418], [1895, 572], [2210, 850], [2320, 850], [2440, 850], [2205, 320]],
  FLIGHT: 8,                                            // seconds the flight takes
  coins: [{ x: 2250, y: 1000 }, { x: 1610, y: 1180 }, { x: 2440, y: 900 }],
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
  PLANE_HOME: { x: 7780, y: 690, angle: 0 },   // parked at the east end after the landing roll
  LANDING: [{ x: 7330, y: 690 }, { x: 7780, y: 690 }],
  WINDSOCK: { x: 7290, y: 600 },
  TERMINAL: { x0: 7300, y0: -90, x1: 7560, y1: 40 },
  BOARD: { x: 7430, y: 120 },
  CAFE: { x0: 7580, y0: 140, x1: 7700, y1: 240 },
  TABLES: [[7560, 310], [7700, 310]],
  PILOT: { x: 7596, y: 262 },
  GLIDER: { top: { x: 8120, y: 160 }, launch: { x: 8046, y: 218 }, p1: { x: 7900, y: 430 }, p2: { x: 7700, y: 600 }, dur: 3.4 },
  BALLOON: { x: 8420, y: 580 },
  PADS: [{ x: 8110, y: 760 }, { x: 8220, y: 830 }, { x: 8330, y: 760 }],   // bouncy clouds
  FLAGS: [[7290, -110], [7720, -110]],
  coins: [{ x: 7330, y: 300 }, { x: 7860, y: 820 }, { x: 8500, y: 520 }, { x: 8480, y: 80 }],
};
// Inside the Sky Café: its own little map (free space south of Cloud Harbor), a cosy room seen from above.
CFG.SKYCAFE = {
  WORLD: { x0: 7400, y0: 1500, x1: 7900, y1: 1850 },
  ROOM: { x0: 7430, y0: 1545, x1: 7870, y1: 1815 }, WALL: 22,
  WINDOWS: [[7452, 7566], [7596, 7710]],                 // the big windows in the top wall (the sky outside moves)
  MENU: { x0: 7728, y0: 1500, x1: 7862, y1: 1541 },     // the chalk menu board on the top wall
  COUNTER: { x0: 7450, y0: 1600, x1: 7610, y1: 1640 },
  BARISTA: { x: 7498, y: 1588 },
  PADS: { cocoa: { x: 7490, y: 1684 }, pie: { x: 7576, y: 1684 } },
  TABLES: [
    { x: 7690, y: 1710, chairs: [{ x: 7652, y: 1710 }, { x: 7728, y: 1710 }] },
    { x: 7800, y: 1620, chairs: [{ x: 7762, y: 1620 }, { x: 7838, y: 1620 }] },
    { x: 7800, y: 1760, chairs: [{ x: 7762, y: 1760 }, { x: 7838, y: 1760 }] },
  ],
  JUKEBOX: { x0: 7836, y0: 1676, x1: 7866, y1: 1712 },
  SHELF: { x0: 7434, y0: 1724, x1: 7462, y1: 1804 },
  EXIT: { x: 7650, y: 1800 },                            // the mat inside the door (the door is in the bottom wall)
  DOOR_OUT: { x: 7640, y: 258 },                         // where you stand at the café door in Cloud Harbor
  COCOA: 60, VIEW: 4.5,                                  // seconds a cocoa lasts; seconds the big window view shows
  MENU_ITEMS: [['Cloud Cocoa', 5], ['Sky Pie slice', 8], ['Lightning Lemonade', 4]],
};
CFG.AREAS.cloud = { WORLD: CFG.CLOUD.WORLD };
CFG.AREAS.skycafe = { WORLD: CFG.SKYCAFE.WORLD };
CFG.VEHICLES.plane = { speed: 300, radius: 20, label: '✈️ Taxi', exit: '🚶 Hop out' };
CFG.VEHICLES.heli = { speed: 380, radius: 20, label: '🚁 Fly', exit: '🛬 Land', flies: true };   // flies over everything in town
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
  // sitting in the plane is enough: pressing the button takes off straight away (kid-simple)
  readyToFly(g) {
    const v = this.planeOf(g);
    return !!v && g.driving && g.vehicle === v && !this.rt.roll;
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
  home(g) { const rt = this.rt; if (rt) { rt.ride = null; rt.roll = null; rt.cafe.seat = null; rt.cafe.view = 0; rt.cafe.fade = 0; } },
  build(g) {
    const A = CFG.AIRFIELD, C = CFG.CLOUD;
    this.rt = {
      plane: { kind: 'plane', x: A.PLANE_HOME.x, y: A.PLANE_HOME.y, angle: A.PLANE_HOME.angle, vx: 0, vy: 0, lift: 0 },
      cloudPlane: { kind: 'plane', x: C.PLANE_HOME.x, y: C.PLANE_HOME.y, angle: C.PLANE_HOME.angle, vx: 0, vy: 0, lift: 0 },
      balloon: { kind: 'balloonride', x: C.BALLOON.x, y: C.BALLOON.y, angle: 0, vx: 0, vy: 0 },
      heli: { kind: 'heli', x: A.HELI.x, y: A.HELI.y, angle: Math.PI, vx: 0, vy: 0, rotor: 0, rotorA: 0, lift: 0 },   // the helicopter: steered like the car, but it flies over everything
      heliUp: false,
      roll: null, ride: null,
      found: false, balloonRidden: false, glided: false, padLeft: true, rampLeft: true, wave: 0,
      jumpers: [], jumpT: 3, blimpX: C.WORLD.x0 + 300,
      townObs: null, townCarObs: null, cloudObs: null, void: null, land: null,
      cafe: { seat: null, view: 0, fade: 0, cocoa: 0, cocoaHand: 0, obs: null },   // the Sky Café: a chair you sit on, the big window view, a cocoa to carry
    };
    this.buildObstacles();
  },

  // Town: the hangar, the terminal (doors on both sides for people, solid for vehicles), the tower base, the
  // props. Cloud Harbor: the sky between the islands (cut into bands, like the islands' water) plus the buildings.
  buildObstacles() {
    const A = CFG.AIRFIELD, C = CFG.CLOUD, rt = this.rt;
    const T = A.TERMINAL, H = A.HANGAR, foot = [], car = [];
    const solid = (x0, y0, x1, y1) => { const o = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; foot.push(o); car.push(o); };
    // buildings: hangar, workshop, fuel farm, gate pier (with its jet-bridge), the tower base
    solid(H.x0, H.y0, H.x1, H.y1);
    solid(A.SHED.x0, A.SHED.y0, A.SHED.x1, A.SHED.y1);
    solid(A.FUEL_FARM.x0, A.FUEL_FARM.y0, A.FUEL_FARM.x1, A.FUEL_FARM.y1);
    solid(A.GATE.x0, A.GATE.y0, A.GATE.x1, A.GATE.y1); solid(A.JET.x + 70, A.JET.y - 14, A.GATE.x0, A.JET.y + 14);
    solid(A.TOWER.x - 22, A.TOWER.y - 20, A.TOWER.x + 22, A.TOWER.y + 12);
    // the arrivals hall: solid for vehicles; people walk through the corridor between its two doors
    car.push({ x: T.x0, y: T.y0, w: T.x1 - T.x0, h: T.y1 - T.y0 });
    foot.push({ x: T.x0, y: T.y0, w: T.x1 - T.x0, h: T.door.y - T.doorHalf - T.y0 }, { x: T.x0, y: T.door.y + T.doorHalf, w: T.x1 - T.x0, h: T.y1 - (T.door.y + T.doorHalf) });
    // parked aircraft and the small solid props (signs, benches, cones and cars are walk-through)
    solid(A.FUEL.x - 12, A.FUEL.y - 14, A.FUEL.x + 12, A.FUEL.y + 10);
    solid(A.CART.x - 22, A.CART.y - 12, A.CART.x + 22, A.CART.y + 10);
    for (const q of A.PARKED) solid(q.x - 46, q.y - 40, q.x + 46, q.y + 36);
    solid(A.JET.x - 86, A.JET.y - 86, A.JET.x + 86, A.JET.y + 86);
    solid(A.RADAR.x - 18, A.RADAR.y - 14, A.RADAR.x + 18, A.RADAR.y + 12);
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
    // the café: walls, the counter, the tables, the jukebox and the shelf (chairs are where you stand to sit)
    const SC = CFG.SKYCAFE, R = SC.ROOM, wl = SC.WALL, co = [];
    co.push({ x: R.x0 - wl, y: R.y0 - wl, w: R.x1 - R.x0 + 2 * wl, h: wl }, { x: R.x0 - wl, y: R.y1, w: R.x1 - R.x0 + 2 * wl, h: wl });
    co.push({ x: R.x0 - wl, y: R.y0, w: wl, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w: wl, h: R.y1 - R.y0 });
    co.push({ x: SC.COUNTER.x0, y: SC.COUNTER.y0 - 24, w: SC.COUNTER.x1 - SC.COUNTER.x0, h: SC.COUNTER.y1 - SC.COUNTER.y0 + 24 });   // counter plus the barista's side
    for (const tb of SC.TABLES) co.push({ x: tb.x - 22, y: tb.y - 20, w: 44, h: 40 });
    co.push({ x: SC.JUKEBOX.x0, y: SC.JUKEBOX.y0, w: SC.JUKEBOX.x1 - SC.JUKEBOX.x0, h: SC.JUKEBOX.y1 - SC.JUKEBOX.y0 });
    co.push({ x: SC.SHELF.x0, y: SC.SHELF.y0, w: SC.SHELF.x1 - SC.SHELF.x0, h: SC.SHELF.y1 - SC.SHELF.y0 });
    rt.cafe.obs = co;
  },

  obstacles(g, forCar) {
    const rt = this.rt; if (!rt) return [];
    if (g.area === 'town') return forCar ? rt.townCarObs : rt.townObs;
    if (g.area === 'skycafe') return rt.cafe.obs;
    if (g.area !== 'cloud') return [];
    if (forCar && g.driving && g.vehicle === rt.balloon) return [];   // the balloon floats over everything
    return rt.cloudObs;
  },
  vehicles(g) { return this.rt ? [this.rt.plane, this.rt.cloudPlane, this.rt.balloon, this.rt.heli] : []; },
  flyingHeli(g) { return !!this.rt && g.driving && g.vehicle === this.rt.heli; },

  action(g) {
    const rt = this.rt;
    if (!rt || rt.roll || g.travel) return null;
    if (this.readyToFly(g)) return { label: g.area === 'town' ? '🛫 Take off!' : '🛫 Fly home!', run: (gg) => this.takeOff(gg) };
    if (g.driving || g.onTrain || g.ride || rt.ride) return null;
    const p = g.player, K = CFG.SKYCAFE;
    if (g.area === 'cloud' && U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y) < 30) return { label: '☕ Go inside', run: (gg) => this.enterCafe(gg) };
    if (g.area !== 'skycafe') return null;
    if (rt.cafe.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, K.EXIT.x, K.EXIT.y) < 30) return { label: '☕ Go outside', run: (gg) => this.leaveCafe(gg) };
    const chair = this.nearChair(g); if (chair) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg, chair) };
    return null;
  },
  // ---------- the Sky Café ----------
  nearChair(g) { const p = g.player; for (const tb of CFG.SKYCAFE.TABLES) for (const c of tb.chairs) if (U.dist(p.x, p.y, c.x, c.y) < 22) return Object.assign({ table: tb }, c); return null; },
  enterCafe(g) {
    const K = CFG.SKYCAFE, p = g.player;
    g.area = 'skycafe'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.rt.cafe.fade = 0.45; Sfx.ding(); Haptics.tap();
  },
  leaveCafe(g) {
    const K = CFG.SKYCAFE, p = g.player;
    g.area = 'cloud'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.rt.cafe.seat = null; this.rt.cafe.view = 0; this.rt.cafe.fade = 0.45; Sfx.drop();
  },
  sitDown(g, chair) {
    const p = g.player, c = this.rt.cafe;
    c.seat = { x: chair.x, y: chair.y, facing: chair.table.x > chair.x ? 1 : -1 }; c.view = CFG.SKYCAFE.VIEW;
    p.x = chair.x; p.y = chair.y; p.moving = false; p.facing = c.seat.facing;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'What a view! ☁️', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.chime(); Haptics.tap();
  },
  standUp(g) { const c = this.rt.cafe; c.seat = null; c.view = 0; g.player.moving = false; Sfx.drop(); },
  cafeFree(x, y) {
    const R = CFG.SKYCAFE.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.rt.cafe.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  updateCafe(g, dt) {
    const c = this.rt.cafe, p = g.player, K = CFG.SKYCAFE;
    if (c.seat) { p.x = c.seat.x; p.y = c.seat.y; p.moving = false; p.facing = c.seat.facing; c.view = Math.max(0, c.view - dt); return; }
    // a save (or a push) that left the chef in the walls or inside furniture goes back onto the door mat
    if (!this.cafeFree(p.x, p.y)) { p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
  },
  pads(g) {
    if (g.area !== 'skycafe' || !this.rt) return [];
    const K = CFG.SKYCAFE;
    return [
      { key: 'cafeCocoa', label: 'Cloud Cocoa', ico: '☕', pos: K.PADS.cocoa, price: 5, sub: 'warm & sweet' },
      { key: 'cafePie', label: 'Sky Pie slice', ico: '🥧', pos: K.PADS.pie, price: 8, sub: 'a slice of heaven' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, c = this.rt.cafe;
    g.s.stats = g.s.stats || {};
    if (pad.key === 'cafeCocoa') { c.cocoa = CFG.SKYCAFE.COCOA; g.s.stats.cocoas = (g.s.stats.cocoas || 0) + 1; g.floats.push({ x: p.x, y: p.y - 60, text: 'Mmm, warm! ☕', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'cafePie') { g.s.stats.pies = (g.s.stats.pies || 0) + 1; g.floats.push({ x: p.x, y: p.y - 60, text: 'Yum! Sky Pie! 🥧', color: '#ffe08a', t: 0, dur: 1.5, big: true }); for (let i = 0; i < 6; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-20, 20), y0: p.y - 30 + U.rand(-20, 20), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 }); }
    Haptics.success();
  },
  takeOff(g) {
    // kid-simple: one press and you are in the air. No taxiing, no run-up, nothing to steer or run into.
    const v = this.planeOf(g), town = g.area === 'town';
    g.floats.push({ x: v.x, y: v.y - 60, text: town ? 'Up, up and away! ✈️' : 'Home we go! ✈️', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.tone(110, 1.1, 'sawtooth', 0.03, 260); Haptics.success();
    v.vx = 0; v.vy = 0; v.lift = 0;
    g.driving = false; g.vehicle = null;
    g.startTravel(town ? 'cloud' : 'town', 'flight', CFG.AIRFIELD.FLIGHT);
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
    rt.cafe.fade = Math.max(0, rt.cafe.fade - dt); rt.cafe.cocoa = Math.max(0, rt.cafe.cocoa - dt);
    // the helicopter: the rotor spins up when you fly it and winds down when it is parked
    const hl = rt.heli, flying = this.flyingHeli(g);
    hl.rotor = U.clamp(hl.rotor + (flying ? dt * 1.5 : -dt * 0.5), 0, 1); hl.rotorA += hl.rotor * 32 * dt; hl.lift = flying ? Math.min(40, hl.lift + 90 * dt) : Math.max(0, hl.lift - 90 * dt);
    if (flying && !rt.heliUp) { rt.heliUp = true; g.floats.push({ x: hl.x, y: hl.y - 60, text: 'Whirrr! 🚁', color: '#ffe08a', t: 0, dur: 1.3, big: true }); Haptics.tap(); }
    if (!flying) rt.heliUp = false;
    if (rt.roll) this.updateRoll(g, dt);
    else this.steerHelp(g, dt);
    // the chef stays in the plane while the flight plays (the core still reads the joystick)
    // (parked a little away from the plane, or the core would offer the vehicle button over the cut-scene)
    if (g.travel && g.travel.via === 'flight') { const v = g.travel.from === 'town' ? rt.plane : rt.cloudPlane; p.x = v.x; p.y = v.y - 120; p.moving = false; return; }
    if (g.area === 'town') {
      if (!rt.found && !g.onTrain && this.inStrip(p.x, p.y)) { rt.found = true; g.toast('✈️ You found the airfield!', true); Sfx.ding(); }
      return;
    }
    if (g.area === 'cloud') this.updateCloud(g, dt);
    else if (g.area === 'skycafe') this.updateCafe(g, dt);
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
    if (rt.roll) return { text: 'Touchdown! 🛬', target: null };
    if (g.area === 'town') {
      if (g.onTrain || g.fishing || g.ride) return undefined;
      if (this.flyingHeli(g)) return p.carry > 0 && g.houses.some((h) => h.order) ? undefined : { text: 'Whirrr! Fly anywhere you like 🚁', target: null };
      if (!g.driving && U.dist(p.x, p.y, rt.heli.x, rt.heli.y) < 120 && !(p.carry > 0 && g.houses.some((h) => h.order))) return { text: 'Fly the helicopter! 🚁', target: U.dist(p.x, p.y, rt.heli.x, rt.heli.y) < 70 ? null : rt.heli };
      if (!this.inStrip(p.x, p.y)) return undefined;
      if (g.driving) {
        if (g.vehicle !== rt.plane) return undefined;
        if (this.readyToFly(g)) return { text: '🛫 Press the button to take off!', target: null };
        return { text: '🛫 Press the button to take off!', target: null };
      }
      if (p.carry > 0 && g.houses.some((h) => h.order)) return undefined;   // a delivery is more urgent
      const coin = this.nearCoin(g, A.STRIP, 300); if (coin) return { text: 'Grab the shiny coin!', target: coin };
      return { text: 'Hop in the plane!', target: U.dist(p.x, p.y, rt.plane.x, rt.plane.y) < 70 ? null : rt.plane };
    }
    if (g.area === 'skycafe') {
      const K = CFG.SKYCAFE;
      if (rt.cafe.seat) return { text: 'Enjoy the view! ☁️', target: null };
      if (rt.cafe.cocoa <= 0) return { text: 'Try a Cloud Cocoa! ☕', target: K.PADS.cocoa };
      return { text: 'Have a seat by the window 🪑', target: K.TABLES[1].chairs[0] };
    }
    if (g.area !== 'cloud') return undefined;
    const rd = rt.ride;
    if (rd) return { text: rd.kind === 'glide' ? 'Wheee! Glide to the next cloud 🪂' : rd.kind === 'chute' ? 'Floating down… 🪂' : 'Boing!', target: null };
    if (g.driving) {
      if (g.vehicle === rt.balloon) return { text: 'Float around! Hop out over a cloud', target: null };
      if (g.vehicle !== rt.cloudPlane) return { text: 'Vroom!', target: null };
      if (this.readyToFly(g)) return { text: '🛫 Press the button to fly home!', target: null };
      return { text: '🛫 Press the button to fly home!', target: null };
    }
    if (U.dist(p.x, p.y, CFG.SKYCAFE.DOOR_OUT.x, CFG.SKYCAFE.DOOR_OUT.y) < 120) return { text: 'Go inside the Sky Café ☕', target: U.dist(p.x, p.y, CFG.SKYCAFE.DOOR_OUT.x, CFG.SKYCAFE.DOOR_OUT.y) < 30 ? null : CFG.SKYCAFE.DOOR_OUT };
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
    // fresh grass over the whole strip below Main Street (it covers the core's two stray sidewalk strips), mowed in stripes;
    // the plaza in front of the gate keeps the sidewalks that lead to it
    this.grass(ctx, 1600, 120, S.x1 - 1600, S.y1 - 120); this.grass(ctx, S.x0, 120, 60, 440); this.grass(ctx, S.x0, 700, 60, S.y1 - 700);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 1600; x < S.x1; x += 96) ctx.fillRect(x, 120, 48, S.y1 - 120);
    this.pave(ctx, A.PLAZA.x0, A.PLAZA.y0, A.PLAZA.x1 - A.PLAZA.x0, A.PLAZA.y1 - A.PLAZA.y0);
    // hedge along Main Street, flowers and bushes in the meadows
    for (let x = A.HEDGE.x0; x <= A.HEDGE.x1; x += 20) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, 112 + (x % 40 ? 2 : -2), 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 3, 109 + (x % 40 ? 2 : -2), 4, 0, Math.PI * 2); ctx.fill(); }
    const cols = ['#ff8fab', '#ffd166', '#fff', '#ff6b6b', '#9ad0ff'];
    for (let i = 0; i < 70; i++) { const x = 1560 + this.hash(i) * 880, y = 1150 + this.hash(i + 50) * 160; if (x > 1740 && x < 1900 && y < 1262) continue; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    for (const [x, y] of [[1570, 1300], [1950, 1290], [2100, 1250], [2430, 1300], [1570, 870], [1600, 450], [2300, 1100], [1720, 940], [2080, 1000], [2430, 760], [1700, 150], [2330, 950]]) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 8, 18, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.arc(x - 12, y + 6, 11, 0, Math.PI * 2); ctx.arc(x + 12, y + 6, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 4, y - 6, 7, 0, Math.PI * 2); ctx.fill(); }
    // concrete: the terminal pad, the car park, the apron, the taxiway loop; then the runway
    this.pave(ctx, A.PAD.x0, A.PAD.y0, A.PAD.x1 - A.PAD.x0, A.PAD.y1 - A.PAD.y0, '#c9c3b5');
    this.paintCarPark(r, g, A.CARPARK);
    ctx.fillStyle = '#7c8088'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 500; i++) ctx.fillRect(P.x0 + ((i * 97) % (P.x1 - P.x0)), P.y0 + ((i * 53) % (P.y1 - P.y0)), 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = P.x0 + 120; x < P.x1; x += 120) ctx.fillRect(x, P.y0, 2, P.y1 - P.y0); for (let y = P.y0 + 135; y < P.y1; y += 135) ctx.fillRect(P.x0, y, P.x1 - P.x0, 2);   // slab joints
    const HA = A.HANGAR_APRON; ctx.fillStyle = '#7c8088'; ctx.fillRect(HA.x0, HA.y0, HA.x1 - HA.x0, HA.y1 - HA.y0);
    ctx.fillStyle = '#6b7078'; ctx.fillRect(X.x0, X.y0, X.x1 - X.x0, X.y1 - X.y0);
    for (const [y0, y1] of A.STUBS) ctx.fillRect(R.x1 - 6, y0, X.x0 - R.x1 + 6, y1 - y0);
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo((X.x0 + X.x1) / 2, X.y0 + 20); ctx.lineTo((X.x0 + X.x1) / 2, X.y1 - 20); ctx.stroke();
    for (const [y0, y1] of A.STUBS.concat([[HA.y0 + 50, HA.y0 + 100]])) { const y = (y0 + y1) / 2; ctx.beginPath(); ctx.moveTo(R.x1 - 10, y); ctx.lineTo((X.x0 + X.x1) / 2, y); ctx.stroke(); ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(R.x1 + 10, y0 + 4); ctx.lineTo(R.x1 + 10, y1 - 4); ctx.stroke(); ctx.setLineDash([]); }   // hold-short lines
    ctx.setLineDash([]);
    // stands: the chef's plane in front of the hangar, the visitors' row, the helipad
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.strokeRect(A.PLANE_HOME.x - 46, A.PLANE_HOME.y - 50, 92, 100);
    for (const q of A.PARKED) ctx.strokeRect(q.x - 50, q.y - 46, 100, 92);
    ctx.strokeRect(A.JET.x - 110, A.JET.y - 100, 200, 200);
    ctx.fillStyle = '#f2c94c'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    A.PARKED.forEach((q, i) => ctx.fillText('STAND ' + (i + 2), q.x, q.y - 56)); ctx.fillText('STAND 1', A.PLANE_HOME.x, A.PLANE_HOME.y - 60);
    const HL = A.HELI; ctx.strokeStyle = '#f3efe3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(HL.x, HL.y, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(243,239,227,0.6)'; ctx.font = r.font(28); ctx.fillText('H', HL.x, HL.y + 1);
    this.paintRunway(r, R, true);
    for (const [x, y] of A.CONES) this.cone(ctx, x, y);
    this.paintHangar(r, g, H);
    this.paintShed(r, A.SHED);
    this.paintFuelFarm(r, A.FUEL_FARM);
    this.paintTerminal(r, g, A.TERMINAL);
    this.paintGate(r, g, A.GATE, A.JET);
    // fuel pump
    const F = A.FUEL;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(F.x - 10, F.y + 6, 24, 6);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, F.x - 11, F.y - 14, 22, 24, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(F.x - 7, F.y - 10, 14, 8); ctx.fillStyle = '#2b1d14'; ctx.fillRect(F.x - 5, F.y - 8, 10, 2); ctx.fillRect(F.x - 5, F.y - 5, 6, 2);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(F.x + 11, F.y - 8); ctx.quadraticCurveTo(F.x + 22, F.y - 10, F.x + 20, F.y + 4); ctx.stroke();
    ctx.font = r.font(11); ctx.fillStyle = '#2b1d14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛽', F.x, F.y - 26);
    // luggage cart with two suitcases
    const Ct = A.CART;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Ct.x - 18, Ct.y + 6, 40, 6);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(Ct.x - 18, Ct.y + 4, 8, 6); ctx.fillRect(Ct.x + 10, Ct.y + 4, 8, 6);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Ct.x - 22, Ct.y - 6, 44, 12, 3); ctx.fill(); ctx.fillRect(Ct.x + 20, Ct.y - 16, 3, 14);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Ct.x - 18, Ct.y - 16, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#f06292'; U.roundRect(ctx, Ct.x + 2, Ct.y - 18, 16, 14, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Ct.x - 12, Ct.y - 18, 6, 3); ctx.fillRect(Ct.x + 7, Ct.y - 20, 6, 3);
    // visitors' little planes and the helicopter on their stands
    for (const q of A.PARKED) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(-Math.PI / 2); r.drawVehicle('plane', g, q.color); ctx.restore(); }
    // the radar dish's base (the dish turns live), the plane spotting bench, signs (all walk-through)
    const Rd = A.RADAR;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Rd.x + 3, Rd.y + 10, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, Rd.x - 18, Rd.y - 12, 36, 22, 4); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.fillRect(Rd.x - 14, Rd.y - 8, 28, 4);
    ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.strokeRect(Rd.x - 34, Rd.y - 30, 68, 50); ctx.setLineDash([]);
    this.bench(ctx, A.BENCH.x, A.BENCH.y);
    for (const [x, y, text] of A.SIGNS) this.sign(r, x, y, text, text.includes('AIRFIELD') ? '#3b7dd8' : '#2b1d14', text.includes('AIRFIELD') ? '#fff' : '#ffe08a');
  },
  paintCarPark(r, g, C) {
    const ctx = r.ctx;
    ctx.fillStyle = '#5a5d63'; ctx.fillRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 80; i++) ctx.fillRect(C.x0 + ((i * 37) % (C.x1 - C.x0)), C.y0 + ((i * 53) % (C.y1 - C.y0)), 2, 2);
    ctx.strokeStyle = '#f3efe3'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { const y = C.y0 + 12 + k * 60; ctx.beginPath(); ctx.moveTo(C.x0 + 14, y); ctx.lineTo(C.x1 - 14, y); ctx.stroke(); }
    ctx.fillStyle = '#f3efe3'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', C.x1 - 16, C.y0 + 150);
    for (const [i, col] of [[0, '#41b883'], [1, '#8e5bd1']]) { ctx.save(); ctx.translate((C.x0 + C.x1) / 2, C.y0 + 42 + i * 60); r.drawVehicle('car', g, col); ctx.restore(); }
  },
  paintHangar(r, g, H) {
    const ctx = r.ctx, w = H.x1 - H.x0, h = H.y1 - H.y0, cx = (H.x0 + H.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(H.x0 + 6, H.y0 + 6, w, h);
    // two arched steel roofs side by side: darker at the sides, bright along each ridge, with ribs
    for (const bx of H.bays) { const grd = ctx.createLinearGradient(bx - 50, 0, bx + 50, 0); grd.addColorStop(0, '#7f8791'); grd.addColorStop(0.5, '#c3c8d0'); grd.addColorStop(1, '#7f8791'); ctx.fillStyle = grd; ctx.fillRect(bx - 50, H.y0, 100, h); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx - 4, H.y0, 8, h - 18); }
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = H.y0 + 12; y < H.y1 - 20; y += 14) ctx.fillRect(H.x0, y, w, 2);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(cx - 3, H.y0, 6, h);   // the gutter between the bays
    // the big doors on the apron side
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(H.x0, H.y1 - 18, w, 18);
    for (const bx of H.bays) {
      const bh = H.bayHalf;
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(bx - bh - 4, H.y1 - 18, bh * 2 + 8, 18);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#e4572e' : '#f2b134'; ctx.fillRect(bx - bh + i * (bh / 2), H.y1 - 16, bh / 2, 14); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx - bh, H.y1 - 4, bh * 2, 4);
    }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(H.x0 + 10, H.y1 - 30, 12, 18); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(H.x1 - 30, H.y1 - 32, 18, 12);
    // the sign on the roof
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 88, H.y0 + 54, 176, 36, 8); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA AIR ✈️', cx + 8, H.y0 + 72);
    r.drawPizza(cx - 68, H.y0 + 72, 11);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.fillText('HANGAR 1', H.bays[0], H.y0 + 118); ctx.fillText('HANGAR 2', H.bays[1], H.y0 + 118);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(H.x1 - 12, H.y0 + 8, 3, 30); ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(H.x1 - 9, H.y0 + 8); ctx.lineTo(H.x1 + 10, H.y0 + 13); ctx.lineTo(H.x1 - 9, H.y0 + 18); ctx.closePath(); ctx.fill();
  },
  paintShed(r, S) {
    const ctx = r.ctx, w = S.x1 - S.x0, h = S.y1 - S.y0, cx = (S.x0 + S.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(S.x0 + 5, S.y0 + 5, w, h);
    ctx.fillStyle = '#b98a55'; ctx.fillRect(S.x0, S.y0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = S.y0 + 10; y < S.y1 - 16; y += 12) ctx.fillRect(S.x0, y, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(S.x0, S.y0, w, 6);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x0, S.y1 - 16, w, 16);                       // front wall
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(cx - 30, S.y1 - 14, 60, 12); ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let x = cx - 26; x < cx + 30; x += 8) ctx.fillRect(x, S.y1 - 12, 2, 8);   // sliding door
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(S.x0 + 8, S.y1 - 13, 14, 9); ctx.fillRect(S.x1 - 22, S.y1 - 13, 14, 9);
    // a wrench and an oil drum painted on the roof as the shop's badge, drums by the wall
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔧', cx, S.y0 + 50);
    for (const [dx, col] of [[-30, '#3b7dd8'], [-14, '#e4572e']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(S.x1 + 14 + dx + 40, S.y1 - 30, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(S.x1 + 14 + dx + 40, S.y1 - 28, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  paintFuelFarm(r, F) {
    const ctx = r.ctx;
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeRect(F.x0 - 6, F.y0 - 6, F.x1 - F.x0 + 12, F.y1 - F.y0 + 12); ctx.setLineDash([]);
    ctx.fillStyle = '#7c8088'; ctx.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    for (const cy of [F.y0 + 32, F.y0 + 88]) {
      const cx = (F.x0 + F.x1) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(cx + 4, cy + 5, 26, 0, Math.PI * 2); ctx.fill();
      const grd = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 26); grd.addColorStop(0, '#f5f5f5'); grd.addColorStop(1, '#b8bec6');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(F.x0 + 10, F.y0 + 58, F.x1 - F.x0 - 20, 4);   // pipe between the tanks
  },
  paintTerminal(r, g, T) {
    const ctx = r.ctx, w = T.x1 - T.x0, h = T.y1 - T.y0, dh = T.doorHalf, dy = T.door.y;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(T.x0 + 4, T.y0 + 4, w, h);
    ctx.fillStyle = '#dfe3e8'; ctx.fillRect(T.x0, T.y0, w, h);
    // the arrivals hall is a corridor straight through the building: tiles, glass doors and mats at both ends
    for (let x = T.x0; x < T.x1; x += 18) { ctx.fillStyle = ((x - T.x0) / 18) % 2 ? '#e6edf5' : '#f6f9fc'; ctx.fillRect(x, dy - dh, Math.min(18, T.x1 - x), dh * 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(T.x0, dy - dh - 3, w, 3); ctx.fillRect(T.x0, dy + dh, w, 3);
    ctx.fillStyle = 'rgba(159,224,255,0.6)'; ctx.fillRect(T.x0, dy - dh, 4, dh * 2); ctx.fillRect(T.x1 - 4, dy - dh, 4, dh * 2);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(T.x0 - 12, dy - dh, 12, dh * 2); ctx.fillRect(T.x1, dy - dh, 12, dh * 2);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#3b7dd8'; ctx.fillRect(T.x0 - 14, dy - dh - 6 + i * 8, 6, 8); ctx.fillRect(T.x1 + 8, dy - dh - 6 + i * 8, 6, 8); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WELCOME', T.x0 + w / 2, dy);
    // the south roof: skylights
    ctx.fillStyle = '#9fe0ff'; for (let x = T.x0 + 12; x < T.x1 - 12; x += 22) ctx.fillRect(x, dy + dh + 12, 14, 20); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = T.x0 + 12; x < T.x1 - 12; x += 22) ctx.fillRect(x, dy + dh + 12, 14, 4);
    // the viewing deck on the north roof: railing, a telescope, an umbrella table and two little spotters
    ctx.fillStyle = '#c9c3b5'; ctx.fillRect(T.x0 + 4, T.y0 + 4, w - 8, dy - dh - 3 - T.y0 - 4);
    ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(T.x0 + 6, T.y0 + 8); ctx.lineTo(T.x1 - 6, T.y0 + 8); ctx.stroke(); for (let x = T.x0 + 6; x <= T.x1 - 6; x += 10) ctx.fillRect(x - 1, T.y0 + 6, 2, 7);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.fillText('VIEWING DECK', T.x0 + w / 2, dy - dh - 10);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#e4572e' : '#fff8ee'; ctx.beginPath(); ctx.moveTo(T.x1 - 22, T.y0 + 28); ctx.arc(T.x1 - 22, T.y0 + 28, 14, i * Math.PI / 4, (i + 1) * Math.PI / 4); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(T.x0 + 46, T.y0 + 12, 3, 16); ctx.fillStyle = '#5c6670'; ctx.save(); ctx.translate(T.x0 + 48, T.y0 + 12); ctx.rotate(-0.5); ctx.fillRect(-10, -3, 20, 6); ctx.restore();
    ctx.save(); ctx.translate(T.x0 + 22, T.y0 + 40); ctx.scale(0.55, 0.55); r.drawPerson(0, 0, { shirt: '#f28e2b', skin: '#f1c27d', hair: '#5a3a1a', hairStyle: 2, facing: 1, moving: false, bob: 0, carry: 0, pants: '#4a4a4a' }); ctx.restore();
    ctx.save(); ctx.translate(T.x0 + 64, T.y0 + 42); ctx.scale(0.55, 0.55); r.drawPerson(0, 0, { shirt: '#59a14f', skin: '#c68642', hat: 'cap', capColor: '#e4572e', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' }); ctx.restore();
    // sign facing the plaza
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x0 - 6, T.y0 - 24, w + 12, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈️ ARRIVALS', T.x0 + w / 2, T.y0 - 14);
  },
  // the gate pier on the apron's east edge, the jet-bridge and the passenger jet parked at it
  paintGate(r, g, G, J) {
    const ctx = r.ctx;
    this.paintJet(r, J.x, J.y, Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(J.x + 74, J.y - 10, G.x0 - J.x - 70, 24);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(J.x + 70, J.y - 14, G.x0 - J.x - 70, 28); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = J.x + 76; x < G.x0; x += 8) ctx.fillRect(x, J.y - 14, 2, 28);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(J.x + 72, J.y - 10, G.x0 - J.x - 74, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(G.x0 + 5, G.y0 + 5, G.x1 - G.x0, G.y1 - G.y0);
    ctx.fillStyle = '#cfe3f7'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, 14); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(G.x0 + 4, G.y0 + 22, G.x1 - G.x0 - 8, 30); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(G.x0 + 4, G.y0 + 22, G.x1 - G.x0 - 8, 6);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, G.x0 + 2, G.y1 - 22, G.x1 - G.x0 - 4, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GATE 1', (G.x0 + G.x1) / 2, G.y1 - 14);
  },
  paintJet(r, x, y, ang) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(4, 8, 88, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-30, -84); ctx.lineTo(-56, -84); ctx.lineTo(-36, 0); ctx.lineTo(-56, 84); ctx.lineTo(-30, 84); ctx.closePath(); ctx.fill();
    // swept wings with engines, the tailplane and the fin
    ctx.fillStyle = '#e6e9ee'; ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(-30, -86); ctx.lineTo(-54, -86); ctx.lineTo(-34, -6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(-30, 86); ctx.lineTo(-54, 86); ctx.lineTo(-34, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(-54, -86); ctx.lineTo(-50, -86); ctx.lineTo(-30, -6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-34, 6); ctx.lineTo(-54, 86); ctx.lineTo(-50, 86); ctx.lineTo(-30, 6); ctx.closePath(); ctx.fill();
    for (const sy of [-1, 1]) { ctx.fillStyle = '#5c6670'; U.roundRect(ctx, -22, sy * 44 - 8, 34, 16, 6); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(12, sy * 44, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e6e9ee'; ctx.beginPath(); ctx.moveTo(-66, -5); ctx.lineTo(-86, -40); ctx.lineTo(-96, -40); ctx.lineTo(-88, -5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-66, 5); ctx.lineTo(-86, 40); ctx.lineTo(-96, 40); ctx.lineTo(-88, 5); ctx.closePath(); ctx.fill();
    // fuselage with a blue cheat line, cockpit and a row of windows; the fin seen from above carries the pizza
    ctx.fillStyle = '#f7f8fa'; U.roundRect(ctx, -92, -13, 184, 26, 13); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-84, -2, 160, 4);
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.moveTo(90, -4); ctx.quadraticCurveTo(80, -11, 68, -11); ctx.lineTo(68, 11); ctx.quadraticCurveTo(80, 11, 90, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9fd8ff'; for (let wx = 52; wx > -70; wx -= 12) { ctx.fillRect(wx, -11, 5, 4); ctx.fillRect(wx, 7, 5, 4); }
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-64, -13, 8, 5);   // the door the jet-bridge reaches
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -98, -4, 34, 8, 3); ctx.fill(); r.drawPizza(-80, 0, 6);
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
    skycafe(r, g) { AirfieldExt.paintCafeRoom(r, g); },
  },
  // ---------- inside the Sky Café ----------
  paintCafeRoom(r, g) {
    const ctx = r.ctx, K = CFG.SKYCAFE, W = K.WORLD, R = K.ROOM, wl = K.WALL;
    ctx.fillStyle = '#2f6aa0'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // floor: warm planks and a round rug under the tables
    ctx.fillStyle = '#d9b48c'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let y = R.y0; y < R.y1; y += 22) ctx.fillRect(R.x0, y, R.x1 - R.x0, 2); for (let i = 0; i < 40; i++) ctx.fillRect(R.x0 + ((i * 131) % (R.x1 - R.x0)), R.y0 + 11 + Math.floor((i * 7) % 12) * 22, 2, 22);
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.ellipse(7760, 1690, 120, 90, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.ellipse(7760, 1690, 96, 68, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.arc(7760 + Math.cos(a) * 60, 1690 + Math.sin(a) * 44, 6, 0, Math.PI * 2); ctx.fill(); }
    // walls: wood panelling; the top wall holds the windows (the sky in them is drawn live) and the menu board
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - wl, R.y0 - wl, R.x1 - R.x0 + 2 * wl, wl); ctx.fillRect(R.x0 - wl, R.y1, R.x1 - R.x0 + 2 * wl, wl); ctx.fillRect(R.x0 - wl, R.y0, wl, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, wl, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - wl; x < R.x1 + wl; x += 16) { ctx.fillRect(x, R.y0 - wl, 2, wl); ctx.fillRect(x, R.y1, 2, wl); } for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - wl, y, wl, 2); ctx.fillRect(R.x1, y, wl, 2); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0 - wl, R.y0 - wl, R.x1 - R.x0 + 2 * wl, 4);   // the top of the back wall
    for (const [x0, x1] of K.WINDOWS) { ctx.fillStyle = '#fff8ee'; ctx.fillRect(x0 - 5, W.y0 - 2, x1 - x0 + 10, R.y0 - W.y0 + 2); }   // window frames (glass drawn live)
    // the chalk menu board
    const M = K.MENU; ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, M.x0 - 4, M.y0 - 2, M.x1 - M.x0 + 8, M.y1 - M.y0 + 4, 4); ctx.fill(); ctx.fillStyle = '#2f3b33'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☁️ MENU ☁️', (M.x0 + M.x1) / 2, M.y0 + 7);
    ctx.font = r.font(7); K.MENU_ITEMS.forEach(([name, price], i) => { ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(name, M.x0 + 6, M.y0 + 18 + i * 9); ctx.textAlign = 'right'; ctx.fillStyle = '#8ef0a0'; ctx.fillText('$' + price, M.x1 - 6, M.y0 + 18 + i * 9); });
    // the counter: wood front, light top, an espresso machine, cups, the pastry case
    const C = K.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8a5527'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 6); ctx.fill();
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0, C.y0 - 8, C.x1 - C.x0, 24, 6); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, C.x0 + 8, C.y0 - 6, 30, 20, 4); ctx.fill(); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(C.x0 + 12, C.y0 - 2, 22, 4); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(C.x0 + 30, C.y0 - 3, 2, 0, Math.PI * 2); ctx.fill();   // espresso machine
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166', '#41b883'][i]; U.roundRect(ctx, C.x0 + 44 + i * 9, C.y0 - 4, 7, 7, 2); ctx.fill(); }   // cups
    ctx.fillStyle = 'rgba(159,224,255,0.55)'; U.roundRect(ctx, C.x0 + 92, C.y0 - 8, 60, 22, 4); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; U.roundRect(ctx, C.x0 + 92, C.y0 - 8, 60, 22, 4); ctx.stroke();
    for (let i = 0; i < 4; i++) { const px = C.x0 + 100 + i * 14, py = C.y0 + 2; if (i % 2) { ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(px - 5, py + 4); ctx.lineTo(px + 5, py + 4); ctx.lineTo(px, py - 5); ctx.closePath(); ctx.fill(); } else { ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(px, py - 2, 2.5, 0, Math.PI * 2); ctx.fill(); } }   // pastries
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PASTRIES', C.x0 + 122, C.y0 + 20);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.fillText('ORDER HERE', C.x0 + 40, C.y0 + 30);
    // round tables with chairs and a little vase
    for (const tb of K.TABLES) {
      for (const c of tb.chairs) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(c.x + 2, c.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#b23a48'; U.roundRect(ctx, c.x - 10, c.y - 10, 20, 20, 5); ctx.fill(); ctx.fillStyle = '#8a2a36'; ctx.fillRect(c.x - 10, c.y - 12, 20, 5); }
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(tb.x + 3, tb.y + 8, 24, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a97a45'; ctx.beginPath(); ctx.ellipse(tb.x, tb.y + 4, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(tb.x, tb.y, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, tb.x - 3, tb.y - 8, 6, 9, 2); ctx.fill(); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(tb.x, tb.y - 11, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(tb.x, tb.y - 11, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    // the jukebox, the shelf of model planes, a potted plant, the door
    const J = K.JUKEBOX;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(J.x0 + 3, J.y0 + 4, J.x1 - J.x0, J.y1 - J.y0);
    ctx.fillStyle = '#8e5bd1'; U.roundRect(ctx, J.x0, J.y0, J.x1 - J.x0, J.y1 - J.y0, 8); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, J.x0 + 4, J.y0 + 4, J.x1 - J.x0 - 8, 10, 4); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc((J.x0 + J.x1) / 2, J.y0 + 24, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(J.x0 + 6, J.y1 - 8, 4, 4); ctx.fillStyle = '#41b883'; ctx.fillRect(J.x1 - 10, J.y1 - 8, 4, 4);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', (J.x0 + J.x1) / 2, J.y0 + 24);
    const Sh = K.SHELF;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Sh.x0, Sh.y0, Sh.x1 - Sh.x0, Sh.y1 - Sh.y0); ctx.fillStyle = '#8d5a2b'; for (let y = Sh.y0 + 6; y < Sh.y1; y += 26) ctx.fillRect(Sh.x0 + 2, y, Sh.x1 - Sh.x0 - 4, 20);
    [['#e4572e', 0], ['#3b7dd8', 1], ['#ffd166', 2]].forEach(([col, i]) => { ctx.save(); ctx.translate((Sh.x0 + Sh.x1) / 2, Sh.y0 + 16 + i * 26); ctx.scale(0.22, 0.22); r.drawVehicle('plane', g, col); ctx.restore(); });
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, R.x1 - 30, R.y0 + 8, 22, 18, 4); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(R.x1 - 19, R.y0 + 4, 12, 0, Math.PI * 2); ctx.arc(R.x1 - 28, R.y0 + 10, 8, 0, Math.PI * 2); ctx.arc(R.x1 - 10, R.y0 + 10, 8, 0, Math.PI * 2); ctx.fill();
    const E = K.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, wl); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 12, R.y1 + 11, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, E.x - 20, E.y - 8, 40, 14, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('EXIT', E.x, E.y - 1);
    // bunting across the room and a name plate
    const cols = ['#e4572e', '#ffd166', '#3b7dd8', '#41b883', '#ff8fab'];
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R.x0, R.y0 + 16); ctx.quadraticCurveTo((R.x0 + R.x1) / 2, R.y0 + 40, R.x1, R.y0 + 16); ctx.stroke();
    for (let i = 0; i < 16; i++) { const k = (i + 0.5) / 16, u = 1 - k, x = u * u * R.x0 + 2 * u * k * (R.x0 + R.x1) / 2 + k * k * R.x1, y = u * u * (R.y0 + 16) + 2 * u * k * (R.y0 + 40) + k * k * (R.y0 + 16); ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 10); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 50, R.y1 + 4, 100, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☕ SKY CAFÉ ☁️', (R.x0 + R.x1) / 2, R.y1 + 11);
  },
  // the café's map is smaller than most screens: everything around it is sky, so the café floats in the clouds
  drawCafeOutside(r, g) {
    const ctx = r.ctx, W = CFG.SKYCAFE.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    const sky = ctx.createLinearGradient(0, y0, 0, y1); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#bfe6fb'); ctx.fillStyle = sky;
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 14; i++) {
      const cx = W.x0 - 700 + this.hash(i) * 1900, cy = W.y0 - 500 + this.hash(i + 20) * 1400, sc = 0.8 + this.hash(i + 40) * 0.8;
      if (cx > W.x0 - 80 && cx < W.x1 + 20 && cy > W.y0 - 60 && cy < W.y1 + 20) continue;
      if (cx < x0 - 100 || cx > x1 + 100 || cy < y0 - 60 || cy > y1 + 60) continue;
      ctx.beginPath(); ctx.arc(cx, cy, 18 * sc, 0, Math.PI * 2); ctx.arc(cx + 20 * sc, cy - 10 * sc, 24 * sc, 0, Math.PI * 2); ctx.arc(cx + 46 * sc, cy, 17 * sc, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(30,80,140,0.18)'; U.roundRect(ctx, W.x0 + 16, W.y1 + 2, W.x1 - W.x0 - 20, 30, 20); ctx.fill();   // the café's shadow on the clouds below
  },
  // the sky outside the café windows: clouds drifting by, the blimp, a parachutist
  drawCafeWindows(r, g) {
    const ctx = r.ctx, K = CFG.SKYCAFE, W = K.WORLD, R = K.ROOM, t = g.time, top = W.y0 + 2, bottom = R.y0 - K.WALL + 4;
    for (const [x0, x1] of K.WINDOWS) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, bottom - top); ctx.clip();
      const sky = ctx.createLinearGradient(0, top, 0, bottom); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#bfe6fb'); ctx.fillStyle = sky; ctx.fillRect(x0, top, x1 - x0, bottom - top);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 3; i++) { const cx = x0 + (((i * 73 + t * 9) % (x1 - x0 + 60)) + x1 - x0 + 60) % (x1 - x0 + 60) - 30, cy = top + 10 + i * 12; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.arc(cx + 7, cy - 4, 8, 0, Math.PI * 2); ctx.arc(cx + 16, cy, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // the blimp crosses both windows (clipped to the glass), a parachutist floats down behind the second
    ctx.save(); ctx.beginPath(); for (const [x0, x1] of K.WINDOWS) ctx.rect(x0, top, x1 - x0, bottom - top); ctx.clip();
    const bx = K.WINDOWS[0][0] - 60 + ((t * 14) % (K.WINDOWS[1][1] - K.WINDOWS[0][0] + 160)), by = top + 16 + Math.sin(t * 0.8) * 3;
    ctx.fillStyle = '#cfe3f7'; ctx.beginPath(); ctx.ellipse(bx, by, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(bx - 20, by - 1); ctx.lineTo(bx - 27, by - 7); ctx.lineTo(bx - 18, by - 3); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 20, by + 1); ctx.lineTo(bx - 27, by + 7); ctx.lineTo(bx - 18, by + 3); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(bx - 5, by + 7, 10, 4);
    ctx.fillStyle = '#e4572e'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA AIR', bx, by + 0.5);
    const jx = K.WINDOWS[1][0] + 70 + Math.sin(t * 0.7) * 20, jy = top - 10 + ((t * 7) % 70);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(jx, jy, 7, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(jx - 6, jy); ctx.lineTo(jx, jy + 9); ctx.lineTo(jx + 6, jy); ctx.stroke(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(jx - 2, jy + 8, 4, 5);
    ctx.restore();
    // steam from the espresso machine
    const C = K.COUNTER; for (let i = 0; i < 3; i++) { const age = ((t * 0.8 + i * 0.33) % 1); ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - age)})`; ctx.beginPath(); ctx.arc(C.x0 + 22 + i * 4 + Math.sin(age * 6 + i) * 3, C.y0 - 10 - age * 22, 2.5 + age * 3, 0, Math.PI * 2); ctx.fill(); }
  },
  drawBarista(r, g) {
    const ctx = r.ctx, B = CFG.SKYCAFE.BARISTA, p = g.player, d = U.dist(p.x, p.y, B.x, B.y), t = g.time;
    r.drawPerson(B.x, B.y, { shirt: '#2d3a4a', skin: '#c68642', hat: 'cap', capColor: '#1f2a38', facing: p.x < B.x ? -1 : 1, moving: false, bob: 0, carry: 0, apron: '#e4572e', pants: '#2d3a4a' });
    if (d < 150) { ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(B.x + 18, B.y - 34 + Math.sin(t * 7) * 5, 3.5, 0, Math.PI * 2); ctx.fill(); }
    if (d < 110) r.drawBubble(B.x, B.y - 66 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Cocoa? ☕', 0, 0); }, 80);
  },
  // the steaming mug the chef carries after a Cloud Cocoa
  drawCocoa(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 5, y - 5, 10, 10, 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + f * 6, y, 3, -Math.PI / 2, Math.PI / 2, f < 0); ctx.stroke();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 4, y - 4, 8, 3); ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 5, y + 1, 10, 2);
    for (let i = 0; i < 3; i++) { const age = ((t * 0.9 + i * 0.33) % 1); ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - age)})`; ctx.beginPath(); ctx.arc(x - 3 + i * 3 + Math.sin(age * 6 + i) * 2, y - 8 - age * 16, 1.5 + age * 2.5, 0, Math.PI * 2); ctx.fill(); }
  },
  // sitting by the window: the view fills the screen for a few seconds
  drawCafeView(r, g, W, H) {
    const ctx = r.ctx, c = this.rt.cafe, t = g.time, k = c.view / CFG.SKYCAFE.VIEW, a = k > 0.85 ? (1 - k) / 0.15 : k < 0.15 ? k / 0.15 : 1;
    const pw = Math.min(W - 32, 520), ph = Math.min(H - 150, 300), px = W / 2 - pw / 2, py = Math.max(70, H / 2 - ph / 2);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(43,29,20,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, px - 10, py - 10, pw + 20, ph + 20, 16); ctx.fill();
    ctx.save(); U.roundRect(ctx, px, py, pw, ph, 10); ctx.clip();
    const sky = ctx.createLinearGradient(0, py, 0, py + ph); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#d9f0ff'); ctx.fillStyle = sky; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(px + pw * 0.8, py + 40, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 6; i++) { const cx = px + (((i * 137 + t * 22) % (pw + 120)) + pw + 120) % (pw + 120) - 60, cy = py + 40 + (i % 3) * 70 + Math.sin(t + i) * 4, s = 1 + (i % 2) * 0.5; ctx.beginPath(); ctx.arc(cx, cy, 18 * s, 0, Math.PI * 2); ctx.arc(cx + 20 * s, cy - 10 * s, 24 * s, 0, Math.PI * 2); ctx.arc(cx + 46 * s, cy, 17 * s, 0, Math.PI * 2); ctx.fill(); }
    const bx = px + pw + 90 - ((t * 60) % (pw + 260)), by = py + 70 + Math.sin(t * 0.8) * 6;
    ctx.fillStyle = '#cfe3f7'; ctx.beginPath(); ctx.ellipse(bx, by, 64, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(bx - 56, by - 2); ctx.lineTo(bx - 72, by - 18); ctx.lineTo(bx - 50, by - 8); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 56, by + 2); ctx.lineTo(bx - 72, by + 18); ctx.lineTo(bx - 50, by + 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, bx - 14, by + 20, 28, 10, 3); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA AIR', bx, by + 1);
    for (let i = 0; i < 3; i++) { const jx = px + 60 + i * pw * 0.3 + Math.sin(t * 0.7 + i) * 24, jy = py - 40 + ((t * 26 + i * 90) % (ph + 100)), col = ['#e4572e', '#ffd166', '#41b883'][i]; ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(jx - 14, jy); ctx.lineTo(jx - 3, jy + 24); ctx.moveTo(jx + 14, jy); ctx.lineTo(jx + 3, jy + 24); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(jx, jy, 16, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, jx - 4, jy + 24, 8, 10, 3); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(jx, jy + 20, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px + pw / 2, py); ctx.lineTo(px + pw / 2, py + ph); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, W / 2 - 110, py + ph + 18, 220, 30, 10); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☁️ What a view! ☕', W / 2, py + ph + 33);
    ctx.restore();
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
    ctx.fillStyle = '#e4572e'; ctx.fillRect(cx - 16, K.y1 + 12, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COME IN', cx, K.y1 + 17);   // the door mat outside
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
      // the radar dish turns round and round
      const Rd = CFG.AIRFIELD.RADAR, a = t * 0.8, sx = Math.cos(a);
      ctx.save(); ctx.translate(Rd.x, Rd.y - 20); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(-2, 0, 4, 10);
      ctx.rotate(a); ctx.fillStyle = '#e6e9ee'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(22, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff5252' : '#ffb3b3'; ctx.beginPath(); ctx.arc(Rd.x, Rd.y - 30, 2.5 + sx * 0, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (g.area === 'skycafe') { this.drawCafeWindows(r, g); return; }
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
      if (rt.cafe.cocoa > 0 && !g.driving) items.push({ y: g.player.y + 1, draw: () => this.drawCocoa(r, g) });
      if (!this.flyingHeli(g)) items.push({ y: rt.heli.y + 12, draw: () => this.drawHeli(r, g) });
      return;
    }
    if (rt.cafe.cocoa > 0 && !g.driving && !g.onTrain) items.push({ y: g.player.y + 1, draw: () => this.drawCocoa(r, g) });
    if (g.area === 'skycafe') { items.push({ y: CFG.SKYCAFE.BARISTA.y, draw: () => this.drawBarista(r, g) }); return; }
    if (g.area !== 'cloud') return;
    items.push({ y: rt.cloudPlane.y + 12, draw: () => this.drawPlaneTop(r, g, rt.cloudPlane) });
    items.push({ y: rt.balloon.y + 14, draw: () => this.drawBalloon(r, g, rt.balloon) });
    items.push({ y: CFG.CLOUD.PILOT.y, draw: () => this.drawPilot(r, g) });
    const rd = rt.ride, p = g.player;
    if (rd && rd.kind === 'glide') items.push({ y: p.y + 1, draw: () => { const ctx = r.ctx; ctx.save(); ctx.translate(p.x, p.y - 58); this.drawGliderWing(r); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-14, 40); ctx.moveTo(10, 6); ctx.lineTo(14, 40); ctx.stroke(); ctx.restore(); } });
    if (rd && rd.kind === 'chute') items.push({ y: p.y + 1, draw: () => this.drawChute(r, p.x, p.y) });
  },
  // parked (or just landing): a normal y-sorted entity; flying: drawn in the overlay, lifted, above the tree tops
  drawHeli(r, g) {
    const ctx = r.ctx, v = this.rt.heli;
    if (v.lift > 0) { ctx.fillStyle = `rgba(0,0,0,${0.22 - v.lift * 0.003})`; ctx.beginPath(); ctx.ellipse(v.x + v.lift * 0.4, v.y + 6 + v.lift * 0.9, 30 - v.lift * 0.2, 14 - v.lift * 0.1, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(0, -v.lift); r.drawSiteVehicle(g, v, 18); ctx.restore();
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
    const rt = this.rt; if (!rt) return;
    if (g.area === 'town') { if (this.flyingHeli(g)) this.drawHeli(r, g); return; }
    if (g.area === 'skycafe') { this.drawCafeOutside(r, g); return; }
    if (g.area !== 'cloud') return;
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
    const rt = this.rt; if (!rt || g.travel) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'skycafe' && rt.cafe.seat && rt.cafe.view > 0) this.drawCafeView(r, g, W, H);
    if (rt.cafe.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(rt.cafe.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },

  // ---------- vehicle art (drawn at the origin, nose +x) ----------
  vehicleArt: {
    // the helicopter, nose +x: skids, tail boom, cockpit glass, the main rotor turning as fast as it is spun up
    heli(r, g, color, v, h) {
      const ctx = r.ctx, c = color && color !== '#ffffff' ? color : '#41b883', lift = v ? v.lift || 0 : 0, rot = v ? v.rotorA || 0 : 0, spin = v ? v.rotor || 0 : 0;
      if (!lift) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 5, 30, 14, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(-20, -16, 36, 3); ctx.fillRect(-20, 13, 36, 3);   // skids
      ctx.fillStyle = c; U.roundRect(ctx, -46, -4, 34, 8, 3); ctx.fill();   // tail boom
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-50, -10, 6, 20); ctx.save(); ctx.translate(-48, 0); ctx.rotate(rot * 1.7); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-2, -13, 4, 26); ctx.restore();   // tail fin + rotor
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-4, -5, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.ellipse(12, 0, 9, 9, 0, 0, Math.PI * 2); ctx.fill();   // cockpit glass
      r.drawPizza(-8, 0, 5);
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      // main rotor: two crossed blades, blurred into a disc when spinning fast
      ctx.save(); ctx.rotate(rot); ctx.strokeStyle = `rgba(43,29,20,${0.75 - spin * 0.35})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.moveTo(0, -40); ctx.lineTo(0, 40); ctx.stroke(); ctx.restore();
      if (spin > 0.3) { ctx.fillStyle = `rgba(255,255,255,${(spin - 0.3) * 0.3})`; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill(); }
    },
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
