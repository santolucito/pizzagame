'use strict';
// The subway: down the stairs in the City to an underground station, a ride to the Columbia campus (with Barnard across the street), and back.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// One station map serves both ends of the line: `SubwayExt.st.end` ('city' | 'campus') decides the signage and where
// the stairs lead back up. The train rolls in along the track at the bottom every ~20 s (sooner when somebody is waiting),
// opens its doors for ten seconds, and the ride between the ends is a cut-scene seen from inside the car.

// ---------- config ----------
CFG.SUBWAY = {
  EVERY: 20, CALL: 3, DWELL: 10, RIDE: 6, DOOR_T: 0.5,
  LINE: '1', COLOR: '#e4572e', BLUE: '#1f3b63',
  STATION: {
    WORLD: { x0: 6400, y0: 2100, x1: 7300, y1: 2500 },
    wallTop: 2144, wallSide: 30,
    floor: { x0: 6430, y0: 2144, x1: 7270, y1: 2404 },
    stairs: { x0: 6456, y0: 2144, x1: 6534, y1: 2218, foot: { x: 6495, y: 2234 } },
    booth: { x0: 6590, y0: 2152, x1: 6700, y1: 2214, clerk: { x: 6645, y: 2210 } },
    board: { x0: 6760, y0: 2150, x1: 6910, y1: 2196 },
    snack: { x0: 7110, y0: 2152, x1: 7230, y1: 2214, vendor: { x: 7170, y: 2210 } },
    turnstiles: { y: 2290, xs: [6600, 6680, 6760, 6840, 6920, 7000, 7080] },
    pillars: [[6620, 2342], [6820, 2342], [7020, 2342], [7220, 2342]],
    benches: [[6720, 2356], [6920, 2356], [7120, 2356]],
    bin: { x: 6560, y: 2332 }, clock: { x: 6580, y: 2122 },
    edge: 2404, track: { y0: 2418, y1: 2500 }, trackY: 2460,
    stopX: 6850, cars: 3, carLen: 150, gap: 10,
    stand: { x: 6850, y: 2388 },
  },
  CAMPUS: {
    WORLD: { x0: 9000, y0: -170, x1: 10700, y1: 1100 },
    BW: { x0: 9660, x1: 9890, walk: 30, laneW: [9690, 9740], laneE: [9810, 9860], median: [9740, 9810], cross: { y0: 466, y1: 534 } },
    SUBWAY: { x: 9775, y: 580 }, ARRIVE: { x: 9775, y: 606 },
    TAXI_LOOP: [{ x: 9835, y: 1140 }, { x: 9835, y: -210 }, { x: 9715, y: -210 }, { x: 9715, y: 1140 }],
    planters: [[9775, 300], [9775, 820]],
    lamps: [[9676, 380], [9876, 380], [9676, 640], [9876, 640], [9676, 120], [9876, 120], [9676, 900], [9876, 900]],
    CU: {
      fence: { x0: 9892, x1: 9906, gate: { y0: 464, y1: 536 } },
      walk: { y0: 476, y1: 524 },
      axis: { x0: 10272, x1: 10328 },
      low: { x0: 10140, y0: -170, x1: 10460, y1: 90, steps: { x0: 10110, y0: 90, x1: 10490, y1: 172 } },
      alma: { x: 10300, y: 130 },
      fountains: [{ x: 10040, y: 250 }, { x: 10560, y: 250 }],
      sundial: { x: 10300, y: 330 },
      lion: { x: 10470, y: 404 },
      prof: { x: 10130, y: 406 },
      lawns: [[10000, 560, 10272, 690], [10328, 560, 10600, 690], [10000, 770, 10272, 860], [10328, 770, 10600, 860]],
      cross: { y0: 700, y1: 760 },
      butler: { x0: 10110, y0: 900, x1: 10490, y1: 1100, steps: { y0: 878, y1: 900 } },
      bookstore: { x0: 10600, y0: 580, x1: 10700, y1: 690 },
      cart: { x: 10650, y: 820 },
      slice: { x: 9985, y: 960, reach: 64 },
      readers: [{ x: 10190, y: 160, f: 1 }, { x: 10420, y: 152, f: -1 }, { x: 10240, y: 892, f: 1 }],
      trees: [[9960, 430], [9960, 572], [10060, 430], [10060, 572], [10540, 430], [10540, 572], [10640, 430], [10640, 572], [10060, 1040], [10560, 910], [10660, 1000], [9960, 760], [10660, 220], [9970, 160]],
      benches: [[10020, 330], [10580, 330], [10040, 740], [10560, 740]],
      beds: [[10200, 250], [10400, 250]],
    },
    BC: {
      fence: { x0: 9644, x1: 9658, gate: { y0: 464, y1: 536 } },
      walk: { y0: 476, y1: 524, x0: 9050 },
      axisN: { x0: 9180, x1: 9220 }, axisS: { x0: 9306, x1: 9354 },
      lib: { x0: 9060, y0: -170, x1: 9380, y1: 130 },
      green: { x0: 9440, y0: -170, x1: 9600, y1: 60 },
      bear: { x: 9330, y: 392 },
      lawn: { x0: 9090, y0: 580, x1: 9560, y1: 900 },
      bigTree: { x: 9330, y: 740 },
      dance: { x0: 9040, y0: 940, x1: 9290, y1: 1100 },
      trees: [[9110, 440], [9560, 440], [9080, 760], [9600, 760], [9440, 960], [9570, 1010], [9620, 160], [9020, 300]],
      benches: [[9200, 410], [9460, 410], [9400, 940]],
      beds: [[9280, 300], [9430, 300]],
    },
  },
  STOPS: ['CITY', 'PIZZA ST', 'MUSEUM', 'CATHEDRAL PKWY', 'COLUMBIA'],
};
CFG.AREAS.subway = { WORLD: CFG.SUBWAY.STATION.WORLD };
CFG.AREAS.campus = { WORLD: CFG.SUBWAY.CAMPUS.WORLD };

const SubwayExt = {
  name: 'subway',
  st: null,
  defaults: { subway: { seenCampus: false, end: 'city' } },

  // ---------- small helpers ----------
  hash(i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.fishing && !g.travel; },
  // the City's own subway entrance (painted by city.js) and the campus one, with the spot you stand on just south of the steps
  cityEntrance() { const E = CFG.CITY.SUBWAY; return { x: E.x, y: E.y + 26 }; },
  campusEntrance() { const E = CFG.SUBWAY.CAMPUS.SUBWAY; return { x: E.x, y: E.y + 26 }; },
  nearCityEntrance(g) { const p = g.player, e = this.cityEntrance(); return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && CityExt.floor) && U.dist(p.x, p.y, e.x, e.y) < 40; },
  nearCampusEntrance(g) { const p = g.player, e = this.campusEntrance(); return g.area === 'campus' && this.onFoot(g) && U.dist(p.x, p.y, e.x, e.y) < 40; },
  nearStairs(g) { const p = g.player, f = CFG.SUBWAY.STATION.stairs.foot; return g.area === 'subway' && this.onFoot(g) && U.dist(p.x, p.y, f.x, f.y) < 40; },
  // the train: its centre x, each car's left edge, and the platform spots in front of its doors
  carX(i, cx = this.st.train.x) { const S = CFG.SUBWAY.STATION, total = S.cars * S.carLen + (S.cars - 1) * S.gap; return cx - total / 2 + i * (S.carLen + S.gap); },
  doorSpots(cx) {
    const S = CFG.SUBWAY.STATION, out = [];
    for (let i = 0; i < S.cars; i++) { const x = this.carX(i, cx); out.push({ x: x + 35, y: S.edge - 14 }, { x: x + 115, y: S.edge - 14 }); }
    return out;
  },
  nearestDoor(g) { const p = g.player; let best = null, bd = 1e9; for (const d of this.doorSpots()) { const dd = U.dist(p.x, p.y, d.x, d.y); if (dd < bd) { bd = dd; best = d; } } return { door: best, d: bd }; },
  canBoard(g) { const t = this.st.train; if (g.area !== 'subway' || !this.onFoot(g) || this.st.boarding || this.st.alight || t.state !== 'stopped' || t.doors < 1) return false; return this.nearestDoor(g).d < 60; },
  otherEnd() { return this.st.end === 'city' ? 'campus' : 'city'; },
  stationName() { return this.st.end === 'city' ? 'CITY STATION' : 'COLUMBIA – 116 ST'; },

  // ---------- game hooks ----------
  build(g) {
    const C = CFG.SUBWAY.CAMPUS, S = CFG.SUBWAY.STATION;
    if (!g.s.subway) g.s.subway = { seenCampus: false, end: 'city' };
    const look = () => ({ shirt: U.pick(COLORS.shirts), skin: U.pick(COLORS.skins), hair: U.pick(['#2b1d14', '#5a3a1a', '#d9a066', '#1a1a1a', '#8c3b2f']), hairStyle: U.randInt(0, 3), stripes: Math.random() < 0.25, hat: Math.random() < 0.2 ? 'cap' : undefined, capColor: U.pick(['#9ecbff', '#e4572e', '#1f4e9a']), carry: 0, pack: Math.random() < 0.75 ? U.pick(['#e4572e', '#3b7dd8', '#2f9e44', '#8e5bd1', '#f2b134']) : null });
    // students stroll along the paths of both campuses and the sidewalks of Broadway
    const lines = [
      { h: true, y: 500, a: 9920, b: 10680 }, { h: false, x: 10285, a: 420, b: 870 }, { h: true, y: 730, a: 10010, b: 10590 }, { h: false, x: 10360, a: 190, b: 450 }, { h: false, x: 10660, a: -150, b: 400 },
      { h: true, y: 500, a: 9070, b: 9630 }, { h: false, x: 9450, a: 100, b: 900 }, { h: false, x: 9200, a: 150, b: 460 },
      { h: false, x: 9675, a: -150, b: 1080 }, { h: false, x: 9875, a: -150, b: 1080 },
    ];
    const peds = [];
    for (let i = 0; i < 12; i++) {
      const ln = lines[i % lines.length], t = U.rand(ln.a + 40, ln.b - 40);
      peds.push(Object.assign({ ln, dir: Math.random() < 0.5 ? -1 : 1, x: ln.h ? t : ln.x, y: ln.h ? ln.y : t, speed: U.rand(50, 85), pause: 0, moving: true, facing: 1, bob: Math.random() * 6 }, look()));
    }
    const taxis = [];
    for (let i = 0; i < 3; i++) { const a = C.TAXI_LOOP[i], b = C.TAXI_LOOP[(i + 1) % 4]; taxis.push({ x: U.lerp(a.x, b.x, 0.5), y: U.lerp(a.y, b.y, 0.5), angle: Math.atan2(b.y - a.y, b.x - a.x), wp: (i + 1) % 4, speed: U.rand(190, 230) }); }
    // commuters wait on the platform, climb aboard when the train is in, and new ones come up the stairs
    const commuters = [];
    for (let i = 0; i < 3; i++) commuters.push(Object.assign({ state: 'wait', x: U.rand(6600, 7200), y: U.rand(2376, 2392), tx: 0, ty: 0, t: U.rand(0.5, 3), moving: false, facing: 1, bob: 0, hidden: false, paper: i === 0, phones: i === 1 }, look(), { pack: i === 2 ? '#3b7dd8' : null }));
    this.st = {
      end: g.s.subway.end === 'campus' ? 'campus' : 'city',
      train: { x: S.WORLD.x0 - 400, state: 'away', timer: U.rand(6, 12), speed: 0, dwell: 0, doors: 0, rumble: 0 },
      boarding: null, alight: null, fade: 0, justArrived: false, arrivedAt: 0,
      commuters, riders: [], rat: { on: false, x: 0, dir: 1, t: U.rand(6, 14) },
      peds, taxis, squirrel: { tree: 0, to: null, t: U.rand(1, 3), x: C.CU.trees[0][0], y: C.CU.trees[0][1], facing: 1, hop: 0 },
      notes: [], sliceT: 0, sliceCd: 0, goals: { lion: false, slice: false, bear: false }, welcomed: false,
    };
    // a save made inside a wall or a building (an old layout, say) reloads onto the stairs or the campus entrance
    if (g.area === 'subway' || g.area === 'campus') this.rescue(g);
  },
  rescue(g) {
    const st = this.st, p = g.player, W = CFG.AREAS[g.area].WORLD;
    if (st.boarding || st.alight) return false;
    const bad = p.x < W.x0 + 4 || p.x > W.x1 - 4 || p.y < W.y0 + 4 || p.y > W.y1 - 4 || this.obstacles(g).some((o) => p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h);
    if (!bad) return false;
    const spot = g.area === 'subway' ? CFG.SUBWAY.STATION.stairs.foot : CFG.SUBWAY.CAMPUS.ARRIVE;
    p.x = spot.x; p.y = spot.y; p.moving = false; return true;
  },
  home(g) { const st = this.st; if (!st) return; st.boarding = null; st.alight = null; st.fade = 0; st.justArrived = false; },

  obstacles(g) {
    const o = [];
    if (g.area === 'subway') {
      const S = CFG.SUBWAY.STATION, W = S.WORLD;
      o.push({ x: W.x0, y: W.y0, w: W.x1 - W.x0, h: S.wallTop - W.y0 }, { x: W.x0, y: W.y0, w: S.wallSide, h: W.y1 - W.y0 }, { x: W.x1 - S.wallSide, y: W.y0, w: S.wallSide, h: W.y1 - W.y0 });
      o.push({ x: W.x0, y: S.track.y0 - 4, w: W.x1 - W.x0, h: W.y1 - S.track.y0 + 4 });   // nobody walks on the track
      const rect = (q) => ({ x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 });
      o.push(rect(S.stairs), rect(S.booth), rect(S.board), rect(S.snack));
      for (const [x, y] of S.pillars) o.push({ x: x - 13, y: y - 13, w: 26, h: 26 });
      for (const [x, y] of S.benches) o.push({ x: x - 26, y: y - 10, w: 52, h: 20 });
      o.push({ x: S.bin.x - 9, y: S.bin.y - 12, w: 18, h: 20 });
    } else if (g.area === 'campus') {
      const C = CFG.SUBWAY.CAMPUS, W = C.WORLD, CU = C.CU, BC = C.BC;
      const rect = (q) => ({ x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 });
      for (const F of [CU.fence, BC.fence]) {
        o.push({ x: F.x0, y: W.y0, w: F.x1 - F.x0, h: F.gate.y0 - W.y0 }, { x: F.x0, y: F.gate.y1, w: F.x1 - F.x0, h: W.y1 - F.gate.y1 });
        o.push({ x: F.x0 - 8, y: F.gate.y0 - 24, w: F.x1 - F.x0 + 16, h: 24 }, { x: F.x0 - 8, y: F.gate.y1, w: F.x1 - F.x0 + 16, h: 24 });   // gate posts
      }
      const SB = C.SUBWAY; o.push({ x: SB.x - 32, y: SB.y - 16, w: 64, h: 40 });
      for (const [x, y] of C.planters) o.push({ x: x - 22, y: y - 12, w: 44, h: 24 });
      o.push(rect(CU.low), rect(CU.butler), rect(CU.bookstore), rect(BC.lib), rect(BC.green), rect(BC.dance));
      o.push({ x: CU.alma.x - 22, y: CU.alma.y - 16, w: 44, h: 30 });
      for (const F of CU.fountains) o.push({ x: F.x - 54, y: F.y - 26, w: 108, h: 54 });
      o.push({ x: CU.sundial.x - 15, y: CU.sundial.y - 15, w: 30, h: 30 });
      o.push({ x: CU.lion.x - 26, y: CU.lion.y - 14, w: 52, h: 30 });
      o.push({ x: BC.bear.x - 22, y: BC.bear.y - 14, w: 44, h: 30 });
      o.push({ x: CU.cart.x - 22, y: CU.cart.y - 14, w: 44, h: 26 });
      o.push({ x: CU.slice.x - 36, y: CU.slice.y - 14, w: 72, h: 28 });
      o.push({ x: BC.bigTree.x - 12, y: BC.bigTree.y - 10, w: 24, h: 20 });
      for (const [x, y] of CU.benches.concat(BC.benches)) o.push({ x: x - 26, y: y - 10, w: 52, h: 20 });
      for (const [x, y] of CU.trees.concat(BC.trees)) o.push({ x: x - 8, y: y - 8, w: 16, h: 16 });
    }
    return o;
  },

  action(g) {
    const st = this.st;
    if (!st || st.boarding || st.alight || !this.onFoot(g)) return null;
    if (this.nearCityEntrance(g)) return { label: '🚇 Go down to the subway', run: (gg) => this.goDown(gg, 'city') };
    if (this.nearCampusEntrance(g)) return { label: '🚇 Go down to the subway', run: (gg) => this.goDown(gg, 'campus') };
    if (g.area !== 'subway') return null;
    if (this.nearStairs(g)) return { label: '🚶 Go up the stairs', run: (gg) => this.goUp(gg) };
    if (this.canBoard(g)) return { label: '🚇 Ride the subway', run: (gg) => this.board(gg) };
    return null;
  },
  goDown(g, end) {
    const st = this.st, S = CFG.SUBWAY.STATION, p = g.player;
    st.end = end; g.s.subway.end = end; st.justArrived = false;
    g.area = 'subway'; p.x = S.stairs.foot.x; p.y = S.stairs.foot.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; Sfx.drop(); Haptics.tap();
    const t = st.train; if (t.state === 'away' && t.timer > CFG.SUBWAY.CALL + 2) t.timer = CFG.SUBWAY.CALL + 2;
  },
  goUp(g) {
    const st = this.st, p = g.player;
    const e = st.end === 'campus' ? CFG.SUBWAY.CAMPUS.ARRIVE : { x: CFG.CITY.SUBWAY.x, y: CFG.CITY.SUBWAY.y + 26 };
    g.area = st.end === 'campus' ? 'campus' : 'city'; p.x = e.x; p.y = e.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.justArrived = false; Sfx.pickup(); Haptics.tap();
    if (g.area === 'campus' && !g.s.subway.seenCampus) { g.s.subway.seenCampus = true; g.toast('🎓 Columbia campus! Find the lion and the bear 🦁🐻', true); }
  },
  board(g) {
    const d = this.nearestDoor(g).door;
    this.st.boarding = { t: 0, x: d.x, y0: g.player.y, y1: CFG.SUBWAY.STATION.edge + 18 };
    this.st.justArrived = false;
    g.player.moving = false; g.player.hasMoved = true;
    this.chime(g); Haptics.tap();
  },
  chime(g) { if (g.area !== 'subway' && !(g.travel && g.travel.via === 'subway')) return; if (!Sfx.throttle('subchime', 1500)) return; Sfx.tone(784, 0.22, 'sine', 0.05); setTimeout(() => Sfx.tone(659, 0.34, 'sine', 0.05), 240); },

  update(g, dt) {
    const st = this.st; if (!st) return;
    const S = CFG.SUBWAY.STATION, K = CFG.SUBWAY, t = st.train, p = g.player;
    st.fade = Math.max(0, st.fade - dt);
    // climbing aboard: the chef walks into the lit doorway, then the ride begins
    if (st.boarding) {
      const b = st.boarding; b.t += dt;
      const k = Math.min(1, b.t / 0.6);
      p.x = b.x; p.y = U.lerp(b.y0, b.y1, k); p.moving = k < 1; p.bob += dt * 14; p.facing = 1;
      if (b.t >= 0.85) {
        st.boarding = null;
        g.startTravel(this.otherEnd(), 'subway', K.RIDE);
        t.state = 'leaving'; t.speed = 0; t.doors = 0;
        for (const c of st.commuters) if (c.state === 'board') { c.hidden = true; c.state = 'gone'; c.t = U.rand(5, 12); }
      }
    }
    // keep the chef put while the ride plays (the core still reads the joystick)
    if (g.travel && g.travel.via === 'subway') {
      p.x = S.stopX; p.y = S.edge + 18; p.moving = false;
      t.rumble -= dt; if (t.rumble <= 0) { Sfx.chuff(0.5); t.rumble = 0.16; }
      return;
    }
    // stepping out of the train onto the platform
    if (st.alight) {
      const a = st.alight; a.t += dt; const k = Math.min(1, a.t / 0.55);
      p.x = a.x; p.y = U.lerp(S.edge + 18, S.edge - 14, k); p.moving = k < 1; p.bob += dt * 14;
      if (k >= 1) { st.alight = null; p.moving = false; }
    }
    this.updateTrain(g, dt);
    if (g.area === 'subway') { this.updateStation(g, dt); return; }
    if (g.area === 'campus') this.updateCampus(g, dt);
  },

  // the train: timetable, pulling in, doors, countdown, pulling out
  updateTrain(g, dt) {
    const st = this.st, t = st.train, S = CFG.SUBWAY.STATION, K = CFG.SUBWAY, here = g.area === 'subway', p = g.player;
    if (t.state === 'away') {
      t.timer -= dt;
      // a kid waiting on the platform never waits long
      if (here && p.y > 2300 && this.onFoot(g) && t.timer > K.CALL) t.timer = K.CALL;
      if (t.timer <= 0) { t.state = 'arriving'; t.x = S.WORLD.x0 - 400; t.speed = 320; t.doors = 0; if (here) g.floats.push({ x: p.x, y: p.y - 64, text: 'Rrrumble… here it comes! 🚇', color: '#ffe08a', t: 0, dur: 1.6, big: true }); }
    } else if (t.state === 'arriving') {
      const d = S.stopX - t.x;
      t.speed = U.clamp(d * 1.4, 40, 340); t.x += t.speed * dt;
      if (here) { t.rumble -= dt; if (t.rumble <= 0) { Sfx.chuff(0.6); t.rumble = t.speed > 200 ? 0.14 : 0.24; } }
      if (d <= 2) { t.x = S.stopX; t.state = 'stopped'; t.dwell = K.DWELL; t.doors = 0; this.chime(g); this.spawnRiders(g); }
    } else if (t.state === 'stopped') {
      if (t.doors < 1 && !(t.dwell <= 0)) t.doors = Math.min(1, t.doors + dt / K.DOOR_T);
      if (!st.boarding && !st.alight) t.dwell -= dt;
      if (t.dwell <= 0) { t.doors = Math.max(0, t.doors - dt / K.DOOR_T); if (t.doors <= 0 && !st.boarding) { t.state = 'leaving'; t.speed = 0; if (here) this.chime(g); } }
    } else if (t.state === 'leaving') {
      t.speed = Math.min(380, t.speed + 170 * dt); t.x += t.speed * dt;
      if (here) { t.rumble -= dt; if (t.rumble <= 0) { Sfx.chuff(0.6); t.rumble = t.speed > 200 ? 0.14 : 0.24; } }
      if (t.x > S.WORLD.x1 + 400) { t.state = 'away'; t.timer = K.EVERY; }
    }
  },
  // a couple of riders step off every train and head for the stairs; the waiting commuters climb on
  spawnRiders(g) {
    const st = this.st, S = CFG.SUBWAY.STATION, doors = this.doorSpots(S.stopX);
    const look = () => ({ shirt: U.pick(COLORS.shirts), skin: U.pick(COLORS.skins), hair: U.pick(['#2b1d14', '#5a3a1a', '#d9a066', '#1a1a1a']), hairStyle: U.randInt(0, 3), carry: 0, pack: Math.random() < 0.5 ? U.pick(['#e4572e', '#3b7dd8', '#2f9e44']) : null });
    for (let i = 0; i < 2; i++) { const d = U.pick(doors); st.riders.push(Object.assign({ x: d.x + U.rand(-4, 4), y: S.edge + 18, phase: 0, wait: 0.6 + i * 0.5, moving: false, facing: -1, bob: 0 }, look())); }
    for (const c of st.commuters) if (c.state === 'wait') { let best = doors[0]; for (const d of doors) if (Math.abs(d.x - c.x) < Math.abs(best.x - c.x)) best = d; c.state = 'board'; c.tx = best.x; c.ty = best.y; c.t = U.rand(0.8, 2.5); }
  },
  updateStation(g, dt) {
    const st = this.st, S = CFG.SUBWAY.STATION, t = st.train;
    this.rescue(g);
    // commuters: pace about, board when the doors open, come back down the stairs later
    for (const c of st.commuters) {
      c.bob += dt * 10;
      if (c.state === 'wait') {
        c.t -= dt; if (c.t <= 0) { c.tx = U.rand(6580, 7230); c.ty = U.rand(2376, 2394); c.t = U.rand(2, 6); }
        if (U.moveToward(c, c.tx, c.ty, 40, dt)) c.moving = false;
      } else if (c.state === 'board') {
        c.t -= dt; if (c.t > 0) { c.moving = false; continue; }
        if (t.state !== 'stopped' || t.doors < 1) { c.state = 'wait'; c.t = 1; continue; }
        if (U.moveToward(c, c.tx, c.ty, 70, dt)) { c.state = 'in'; }
      } else if (c.state === 'in') {
        c.y += 60 * dt; c.moving = true;
        if (c.y >= S.edge + 18) { c.hidden = true; c.state = 'gone'; c.t = U.rand(6, 14); }
      } else if (c.state === 'gone') {
        c.t -= dt; if (c.t <= 0) { c.hidden = false; c.x = S.stairs.foot.x; c.y = S.stairs.foot.y; c.state = 'wait'; c.tx = U.rand(6600, 7200); c.ty = U.rand(2378, 2392); c.t = 0.1; }
      }
    }
    for (const r of st.riders) {
      r.bob += dt * 10;
      if (r.wait > 0) { r.wait -= dt; r.moving = false; continue; }
      if (r.phase === 0) { r.y -= 60 * dt; r.moving = true; if (r.y <= S.edge - 16) r.phase = 1; }
      else if (r.phase === 1) { if (U.moveToward(r, r.x, 2300, 75, dt)) r.phase = 2; }
      else if (r.phase === 2) { if (U.moveToward(r, S.stairs.foot.x, S.stairs.foot.y, 75, dt)) r.phase = 3; }
    }
    st.riders = st.riders.filter((r) => r.phase < 3);
    // the rat with its slice scurries along the track now and then
    const rat = st.rat;
    if (!rat.on) { rat.t -= dt; if (rat.t <= 0 && t.state === 'away') { rat.on = true; rat.dir = Math.random() < 0.5 ? 1 : -1; rat.x = rat.dir > 0 ? S.WORLD.x0 + 40 : S.WORLD.x1 - 40; rat.pause = 0; } }
    else {
      if (rat.pause > 0) rat.pause -= dt;
      else { rat.x += rat.dir * 170 * dt; if (Math.random() < dt * 0.5) rat.pause = U.rand(0.3, 0.8); }
      if (t.state !== 'away' || rat.x < S.WORLD.x0 + 30 || rat.x > S.WORLD.x1 - 30) { rat.on = false; rat.t = U.rand(12, 26); }
    }
  },
  updateCampus(g, dt) {
    const st = this.st, C = CFG.SUBWAY.CAMPUS, CU = C.CU, BC = C.BC, p = g.player;
    this.rescue(g);
    for (const q of st.peds) {
      if (q.pause > 0) { q.pause -= dt; q.moving = false; continue; }
      if (Math.random() < dt * 0.08) { q.pause = U.rand(1, 3); continue; }
      q.moving = true; q.bob += dt * 10;
      const ln = q.ln, step = q.speed * dt * q.dir;
      if (ln.h) { q.x += step; q.facing = q.dir; if (q.x < ln.a || q.x > ln.b) { q.dir *= -1; q.x = U.clamp(q.x, ln.a, ln.b); } }
      else { q.y += step; if (q.y < ln.a || q.y > ln.b) { q.dir *= -1; q.y = U.clamp(q.y, ln.a, ln.b); } }
    }
    for (const t of st.taxis) {
      const wp = C.TAXI_LOOP[t.wp], ang = Math.atan2(wp.y - t.y, wp.x - t.x);
      let d = ang - t.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; t.angle += d * Math.min(1, dt * 6);
      if (U.moveToward(t, wp.x, wp.y, t.speed, dt)) t.wp = (t.wp + 1) % C.TAXI_LOOP.length;
    }
    // the squirrel hops from tree to tree along College Walk
    const sq = st.squirrel, trees = CU.trees;
    if (sq.to === null) { sq.t -= dt; sq.hop = 0; if (sq.t <= 0) { let j = sq.tree; while (j === sq.tree) j = U.randInt(0, 7); sq.to = j; sq.facing = trees[j][0] < sq.x ? -1 : 1; sq.phase = 0; } }
    else { sq.phase += dt * 9; sq.hop = Math.abs(Math.sin(sq.phase)) * 12; if (U.moveToward(sq, trees[sq.to][0] + (sq.facing > 0 ? -14 : 14), trees[sq.to][1] + 6, 150, dt)) { sq.tree = sq.to; sq.to = null; sq.t = U.rand(1.5, 4); } }
    // music from the dance studio
    if (Math.random() < dt * 1.5) st.notes.push({ x: U.rand(BC.dance.x0 + 40, BC.dance.x1 - 40), y: BC.dance.y0 + 40, t: 0, ch: U.pick(['♪', '♫', '♩']) });
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 2);
    // Giant Slice: stand still by the stand for a moment and a hot slice is yours
    st.sliceCd = Math.max(0, st.sliceCd - dt);
    const near = U.dist(p.x, p.y, CU.slice.x, CU.slice.y) < CU.slice.reach && this.onFoot(g) && !p.moving;
    if (near && st.sliceCd <= 0) {
      st.sliceT += dt;
      if (st.sliceT >= 1.2) {
        st.sliceT = 0; st.sliceCd = 7; st.goals.slice = true;
        g.fx.push({ kind: 'pizza', x0: CU.slice.x, y0: CU.slice.y - 24, x1: p.x, y1: p.y - 34, t: 0, dur: 0.4 });
        g.floats.push({ x: p.x, y: p.y - 66, text: '🍕 Giant slice! Yum!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
        g.fx.push({ kind: 'sparkle', x0: p.x, y0: p.y - 30, x1: p.x, y1: p.y - 30, t: 0, dur: 0.6 });
        Sfx.pickup(); Haptics.success();
      }
    } else st.sliceT = 0;
    if (U.dist(p.x, p.y, CU.lion.x, CU.lion.y) < 80 && !st.goals.lion) { st.goals.lion = true; g.floats.push({ x: CU.lion.x, y: CU.lion.y - 50, text: 'Roar! 🦁', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
    if (U.dist(p.x, p.y, BC.bear.x, BC.bear.y) < 80 && !st.goals.bear) { st.goals.bear = true; g.floats.push({ x: BC.bear.x, y: BC.bear.y - 50, text: 'Hello, bear! 🐻', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
  },

  arrive(g, tr) {
    if (tr.via !== 'subway') return;
    const st = this.st, S = CFG.SUBWAY.STATION, t = st.train, p = g.player;
    st.end = tr.to === 'campus' ? 'campus' : 'city'; g.s.subway.end = st.end;
    g.area = 'subway'; g.cameraSnap = true;
    t.state = 'stopped'; t.x = S.stopX; t.dwell = CFG.SUBWAY.DWELL; t.doors = 1; t.speed = 0;
    const doors = this.doorSpots(S.stopX), d = doors[3];
    st.alight = { t: 0, x: d.x }; p.x = d.x; p.y = S.edge + 18; p.moving = false; p.facing = 1; p.hasMoved = true;
    st.justArrived = true; st.boarding = null; st.fade = 0.45;
    for (const c of st.commuters) if (c.state === 'wait') { c.state = 'board'; c.tx = d.x; c.ty = d.y; c.t = U.rand(1.5, 3); }
    g.toast(st.end === 'campus' ? '🎓 Welcome to Columbia!' : '🏙️ Back in the City!', true);
    this.chime(g); Haptics.success();
  },

  hint(g) {
    const st = this.st, p = g.player; if (!st) return undefined;
    if (st.boarding) return { text: '🚇 All aboard!', target: null };
    if (g.area === 'city') {
      if (typeof CityExt !== 'undefined' && CityExt.floor) return undefined;
      const e = this.cityEntrance(); if (!this.onFoot(g) || U.dist(p.x, p.y, e.x, e.y) > 150) return undefined;
      return { text: 'Go down to the subway! 🚇', target: U.dist(p.x, p.y, e.x, e.y) < 40 ? null : e };
    }
    if (g.area === 'subway') {
      const t = st.train, S = CFG.SUBWAY.STATION;
      if (st.justArrived) return { text: st.end === 'campus' ? 'Up the stairs to the campus 🎓' : 'Up the stairs to the City 🏙️', target: this.nearStairs(g) ? null : S.stairs.foot };
      if (t.state === 'stopped' && t.doors > 0 && t.dwell > 0) { const nd = this.nearestDoor(g); return { text: `🚇 Subway leaves in ${Math.ceil(t.dwell)}s!`, target: nd.d < 60 ? null : nd.door }; }
      return { text: 'Wait on the platform for the subway', target: p.y > 2340 ? null : S.stand };
    }
    if (g.area === 'campus') {
      const C = CFG.SUBWAY.CAMPUS, e = this.campusEntrance();
      if (!this.onFoot(g)) return null;
      if (U.dist(p.x, p.y, e.x, e.y) < 60) return { text: 'Subway home 🚇', target: null };
      if (!st.goals.lion) return { text: 'Explore the campus! 🎓', target: C.CU.lion };
      if (!st.goals.slice) return { text: 'Grab a giant slice! 🍕', target: C.CU.slice };
      if (!st.goals.bear) return { text: 'Visit Barnard across the street 🐻', target: C.BC.bear };
      return { text: 'Subway home 🚇', target: e };
    }
    return undefined;
  },

  // ======================= static art =======================
  bgKey(g) { return 'sub:' + (this.st ? this.st.end : ''); },
  paint: {
    subway(r, g) { SubwayExt.paintStation(r, g); },
    campus(r, g) { SubwayExt.paintCampus(r, g); },
  },
  // a dark board with gold letters, like the signs all over town
  sign(r, x, y, text, size = 9, pad = 16) {
    const ctx = r.ctx; ctx.font = r.font(size); const w = ctx.measureText(text).width + pad, h = size + 9;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - w / 2, y - h / 2, w, h, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
  },
  // a mosaic plaque: little tiles in a dark field with a coloured border and white letters
  mosaic(r, x, y, text, size = 11, color = CFG.SUBWAY.COLOR) {
    const ctx = r.ctx; ctx.font = r.font(size); const w = ctx.measureText(text).width + 26, h = size + 16;
    ctx.fillStyle = color; ctx.fillRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8);
    ctx.fillStyle = CFG.SUBWAY.BLUE; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let yy = y - h / 2; yy < y + h / 2; yy += 6) for (let xx = x - w / 2; xx < x + w / 2; xx += 6) if ((xx + yy) % 12 === 0) ctx.fillRect(xx, yy, 5, 5);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
  },
  bench(r, x, y) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 24, y + 6, 50, 6);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 26, y - 4, 52, 10); ctx.fillRect(x - 26, y - 16, 52, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 26, y + 1, 52, 2); ctx.fillStyle = '#4a2d12'; ctx.fillRect(x - 22, y + 6, 5, 8); ctx.fillRect(x + 17, y + 6, 5, 8);
  },
  treeBase(r, x, y, s = 1) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 6, 30 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, x - 7 * s, y - 30 * s, 14 * s, 36 * s, 4); ctx.fill();
  },
  lamp(r, x, y) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 2, y - 60, 4, 60); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 62, 7, 0, Math.PI * 2); ctx.fill();
  },
  bed(r, x, y) {
    const ctx = r.ctx;
    ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(x, y, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
    const cols = ['#ff8fab', '#ffd166', '#fff', '#ff6b6b', '#9ad0ff'];
    for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x - 26 + i * 6.5, y + Math.sin(i * 1.7) * 7, 3, 0, Math.PI * 2); ctx.fill(); }
  },
  // the subway entrance: steps going down between two railings, a round line sign on a post, a name board
  entrance(r, x, y, name) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 26, y - 12, 56, 40);
    for (let k = 0; k < 6; k++) { const f = 1 - k / 6; ctx.fillStyle = `rgb(${Math.round(60 + 110 * f)},${Math.round(70 + 110 * f)},${Math.round(84 + 100 * f)})`; ctx.fillRect(x - 24, y - 14 + k * 6, 48, 6); }
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 24, y + 22, 48, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 30, y - 16, 6, 42); ctx.fillRect(x + 24, y - 16, 6, 42);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 36, y - 26, 4, 24); ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(x - 34, y - 32, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('M', x - 34, y - 31);
    this.sign(r, x, y - 24, name, 8, 12);
  },

  // ---------- the station ----------
  paintStation(r, g) {
    const E = this, ctx = r.ctx, S = CFG.SUBWAY.STATION, W = S.WORLD, F = S.floor, K = CFG.SUBWAY, toCampus = this.st && this.st.end === 'city';
    // white tiled walls all round, a coloured tile band and the station name in mosaic
    ctx.fillStyle = '#f3efe4'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 1;
    for (let yy = W.y0; yy <= W.y1; yy += 10) { ctx.beginPath(); ctx.moveTo(W.x0, yy + 0.5); ctx.lineTo(W.x1, yy + 0.5); ctx.stroke(); }
    for (let xx = W.x0; xx <= W.x1; xx += 20) { ctx.beginPath(); ctx.moveTo(xx + 0.5, W.y0); ctx.lineTo(xx + 0.5, W.y1); ctx.stroke(); }
    ctx.fillStyle = K.COLOR; ctx.fillRect(W.x0, 2110, W.x1 - W.x0, 12); ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let xx = W.x0; xx < W.x1; xx += 12) ctx.fillRect(xx + 1, 2111, 5, 5);
    ctx.fillStyle = K.COLOR; ctx.fillRect(W.x0, 2110, 10, W.y1 - W.y0 - 10); ctx.fillRect(W.x1 - 22, 2110, 12, W.y1 - W.y0 - 10);
    // the floor: two-tone tiles, light pools from the ceiling lamps
    ctx.fillStyle = '#d8d2c4'; ctx.fillRect(F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0);
    for (let yy = F.y0; yy < F.y1; yy += 32) for (let xx = F.x0; xx < F.x1; xx += 32) { if (((xx - F.x0) / 32 + (yy - F.y0) / 32) % 2 === 0) { ctx.fillStyle = '#cfc8b8'; ctx.fillRect(xx, yy, Math.min(32, F.x1 - xx), Math.min(32, F.y1 - yy)); } }
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    for (let xx = F.x0; xx <= F.x1; xx += 32) { ctx.beginPath(); ctx.moveTo(xx + 0.5, F.y0); ctx.lineTo(xx + 0.5, F.y1); ctx.stroke(); }
    for (let yy = F.y0; yy <= F.y1; yy += 32) { ctx.beginPath(); ctx.moveTo(F.x0, yy + 0.5); ctx.lineTo(F.x1, yy + 0.5); ctx.stroke(); }
    for (const yy of [2210, 2330]) for (let xx = F.x0 + 90; xx < F.x1; xx += 180) { const gr = ctx.createRadialGradient(xx, yy, 4, xx, yy, 90); gr.addColorStop(0, 'rgba(255,240,190,0.35)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(xx, yy, 90, 0, Math.PI * 2); ctx.fill(); }
    // a coloured tile stripe across the floor marks the fare line; arrows show the way to the platform
    ctx.fillStyle = 'rgba(228,87,46,0.35)'; ctx.fillRect(F.x0, S.turnstiles.y + 18, F.x1 - F.x0, 6);
    ctx.fillStyle = 'rgba(43,29,20,0.35)'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const xx of [6640, 6840, 7040]) ctx.fillText('▼ TRAINS ▼', xx, S.turnstiles.y + 36);
    // the station name (twice, so the hint bubble never hides it), posters and a clock on the top wall
    E.mosaic(r, 6700, 2124, this.stationName(), 12); E.mosaic(r, 7010, 2124, this.stationName(), 12);
    const poster = (x, y, w, h, col, a, b) => { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 2, y + 2, w, h); ctx.fillStyle = '#fff8ee'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w, 9); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a, x + w / 2, y + 4.5); ctx.fillStyle = col; ctx.font = r.font(9); ctx.fillText(b, x + w / 2, y + h - 11); };
    poster(6826, 2104, 60, 34, '#e4572e', 'PIZZA TOWN', '🍕 YUM!'); poster(7130, 2104, 50, 34, '#1f4e9a', 'COLUMBIA', '🎓 LEARN');
    const CK = S.clock; ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(CK.x, CK.y, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(CK.x, CK.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(CK.x, CK.y); ctx.lineTo(CK.x, CK.y - 7); ctx.moveTo(CK.x, CK.y); ctx.lineTo(CK.x + 5, CK.y + 2); ctx.stroke();
    // the stairs up: an opening in the wall, steps lit from the top (daylight), railings either side
    const ST = S.stairs;
    ctx.fillStyle = '#3b2f26'; ctx.fillRect(ST.x0, W.y0 + 6, ST.x1 - ST.x0, ST.y0 - W.y0 - 6);
    ctx.fillStyle = '#9fd8ff'; ctx.fillRect(ST.x0 + 8, W.y0 + 8, ST.x1 - ST.x0 - 16, 14);
    const n = 8, sh = (ST.y1 - ST.y0) / n;
    for (let k = 0; k < n; k++) { const f = k / n; ctx.fillStyle = `rgb(${Math.round(120 + 90 * f)},${Math.round(118 + 90 * f)},${Math.round(125 + 80 * f)})`; ctx.fillRect(ST.x0, ST.y0 + k * sh, ST.x1 - ST.x0, sh); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(ST.x0, ST.y0 + (k + 1) * sh - 2, ST.x1 - ST.x0, 2); }
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(ST.x0 - 6, ST.y0 - 2, 6, ST.y1 - ST.y0 + 6); ctx.fillRect(ST.x1, ST.y0 - 2, 6, ST.y1 - ST.y0 + 6);
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(ST.x0, ST.y1 - 3, ST.x1 - ST.x0, 3);
    E.sign(r, (ST.x0 + ST.x1) / 2, W.y0 + 34, toCampus ? '⬆ CITY STREET' : '⬆ 116 ST · CAMPUS', 8, 12);
    // ticket booth: steel body, glass window, a counter and a sign
    const B = S.booth;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(B.x0 + 8, B.y0 + 8, B.x1 - B.x0 - 16, 30); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(B.x0 + 8, B.y0 + 8, B.x1 - B.x0 - 16, 4);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x0 - 4, B.y1 - 14, B.x1 - B.x0 + 8, 14); ctx.fillStyle = '#2b1d14'; ctx.fillRect(B.x0 + 40, B.y1 - 10, 30, 3);
    E.sign(r, (B.x0 + B.x1) / 2, B.y0 + 2, '🎫 TICKETS', 8, 12);
    // route map board on the wall side of the concourse
    const M = S.board;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(M.x0 + 3, M.y0 + 3, M.x1 - M.x0, M.y1 - M.y0);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0); ctx.fillStyle = '#fff8ee'; ctx.fillRect(M.x0 + 4, M.y0 + 4, M.x1 - M.x0 - 8, M.y1 - M.y0 - 8);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🗺️ LINE 1', (M.x0 + M.x1) / 2, M.y0 + 11);
    ctx.strokeStyle = K.COLOR; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(M.x0 + 16, M.y0 + 28); ctx.lineTo(M.x1 - 16, M.y0 + 28); ctx.stroke();
    K.STOPS.forEach((nm, i) => { const x = M.x0 + 16 + i * (M.x1 - M.x0 - 32) / 4; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, M.y0 + 28, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = K.COLOR; ctx.lineWidth = 2; ctx.stroke(); if (i === 0 || i === 4) { ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.fillText(nm, x + (i === 0 ? 12 : -14), M.y0 + 39); } });
    const hereX = M.x0 + 16 + (toCampus ? 0 : 4) * (M.x1 - M.x0 - 32) / 4; ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.moveTo(hereX, M.y0 + 22); ctx.lineTo(hereX - 5, M.y0 + 15); ctx.lineTo(hereX + 5, M.y0 + 15); ctx.closePath(); ctx.fill();
    // snack stand: red counter, striped awning, bottles on a shelf and a slice sign
    const N = S.snack;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(N.x0 + 4, N.y0 + 4, N.x1 - N.x0, N.y1 - N.y0);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(N.x0 - 4, N.y1 - 14, N.x1 - N.x0 + 8, 14);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(N.x0 + 8, N.y0 + 12, N.x1 - N.x0 - 16, 24);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#3b7dd8', '#2f9e44', '#f2b134', '#ff6b6b', '#8e5bd1', '#3b7dd8'][i]; U.roundRect(ctx, N.x0 + 14 + i * 16, N.y0 + 16, 9, 16, 3); ctx.fill(); }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(N.x0 - 4 + i * 16, N.y0 - 4, 16, 10); ctx.beginPath(); ctx.arc(N.x0 + 4 + i * 16, N.y0 + 6, 8, 0, Math.PI); ctx.fill(); }
    r.drawPizza(N.x1 - 14, N.y1 - 6, 10);
    E.sign(r, (N.x0 + N.x1) / 2 - 8, N.y0 - 12, '🍕 SLICE & SODA', 8, 12);
    // turnstiles: steel posts with chrome tripod arms, a railing at each end of the row
    const T = S.turnstiles;
    for (const x of T.xs) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 22, T.y + 8, 52, 5);
      ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, x - 22, T.y - 14, 10, 26, 3); ctx.fill(); U.roundRect(ctx, x + 12, T.y - 14, 10, 26, 3); ctx.fill();
      ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 20, T.y - 12, 6, 6); ctx.fillStyle = '#44d36a'; ctx.fillRect(x - 19, T.y - 11, 4, 4);
      ctx.strokeStyle = '#d7dbe0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const a of [-0.6, 0.6, 1.9]) { ctx.beginPath(); ctx.moveTo(x, T.y); ctx.lineTo(x + Math.cos(a) * 11, T.y + Math.sin(a) * 11); ctx.stroke(); }
      ctx.lineCap = 'butt'; ctx.fillStyle = '#e6e8eb'; ctx.beginPath(); ctx.arc(x, T.y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(F.x0, T.y - 3, T.xs[0] - 30 - F.x0, 5); ctx.fillRect(T.xs[T.xs.length - 1] + 30, T.y - 3, F.x1 - T.xs[T.xs.length - 1] - 30, 5);
    // pillars holding up the street, benches, a bin
    for (const [x, y] of S.pillars) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 11, y - 9, 28, 28);
      ctx.fillStyle = '#e8e3d8'; ctx.fillRect(x - 13, y - 13, 26, 26); ctx.fillStyle = K.COLOR; ctx.fillRect(x - 13, y - 3, 26, 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 13, y - 13, 26, 26);
    }
    for (const [x, y] of S.benches) E.bench(r, x, y);
    const BN = S.bin; ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, BN.x - 9, BN.y - 12, 18, 22, 4); ctx.fill(); ctx.fillStyle = '#1f6e3e'; ctx.fillRect(BN.x - 10, BN.y - 14, 20, 5); ctx.fillStyle = '#2b1d14'; ctx.fillRect(BN.x - 4, BN.y - 10, 8, 3);
    // the platform edge: yellow safety line with bumps, then the drop into the track pit
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(F.x0, S.edge, F.x1 - F.x0, 8); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let xx = F.x0 + 4; xx < F.x1; xx += 8) ctx.fillRect(xx, S.edge + 3, 2, 2);
    ctx.fillStyle = 'rgba(43,29,20,0.45)'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const xx of [6560, 6850, 7140]) ctx.fillText('STAND BEHIND THE YELLOW LINE', xx, S.edge - 7);
    ctx.fillStyle = '#8a8378'; ctx.fillRect(W.x0 + 10, S.edge + 8, W.x1 - W.x0 - 32, S.track.y0 - S.edge - 8);
    const TR = S.track;
    ctx.fillStyle = '#3a3d42'; ctx.fillRect(W.x0 + 10, TR.y0, W.x1 - W.x0 - 32, TR.y1 - TR.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(W.x0 + 10, TR.y0, W.x1 - W.x0 - 32, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 400; i++) ctx.fillRect(W.x0 + 10 + ((i * 97) % (W.x1 - W.x0 - 32)), TR.y0 + 10 + ((i * 53) % (TR.y1 - TR.y0 - 10)), 2, 2);
    ctx.fillStyle = '#5b4a3a'; for (let xx = W.x0 + 16; xx < W.x1 - 22; xx += 24) ctx.fillRect(xx, S.trackY - 24, 12, 48);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(W.x0 + 10, S.trackY - 19, W.x1 - W.x0 - 32, 4); ctx.fillRect(W.x0 + 10, S.trackY + 15, W.x1 - W.x0 - 32, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(W.x0 + 10, S.trackY - 19, W.x1 - W.x0 - 32, 1); ctx.fillRect(W.x0 + 10, S.trackY + 15, W.x1 - W.x0 - 32, 1);
    // tunnel mouths at both ends of the track
    for (const [x, dir] of [[W.x0 + 10, 1], [W.x1 - 22, -1]]) { const gr = ctx.createLinearGradient(x, 0, x + dir * 90, 0); gr.addColorStop(0, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(Math.min(x, x + dir * 90), TR.y0, 90, TR.y1 - TR.y0); }
  },

  // ---------- the campus ----------
  paintCampus(r, g) {
    const E = this, ctx = r.ctx, C = CFG.SUBWAY.CAMPUS, W = C.WORLD, CU = C.CU, BC = C.BC, BW = C.BW;
    // paving everywhere with a faint grid; the lawns and brick paths go on top
    ctx.fillStyle = '#d9d3c4'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
    for (let xx = W.x0; xx <= W.x1; xx += 48) { ctx.beginPath(); ctx.moveTo(xx + 0.5, W.y0); ctx.lineTo(xx + 0.5, W.y1); ctx.stroke(); }
    for (let yy = W.y0; yy <= W.y1; yy += 48) { ctx.beginPath(); ctx.moveTo(W.x0, yy + 0.5); ctx.lineTo(W.x1, yy + 0.5); ctx.stroke(); }
    const lawn = (x0, y0, x1, y1) => {
      ctx.fillStyle = '#79b85e'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let yy = y0; yy < y1; yy += 32) ctx.fillRect(x0, yy, x1 - x0, 16);   // mower stripes
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < (x1 - x0) * (y1 - y0) / 1800; i++) { ctx.beginPath(); ctx.ellipse(x0 + ((i * 193) % (x1 - x0)), y0 + ((i * 101) % (y1 - y0)), 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 3; ctx.strokeRect(x0 + 1.5, y0 + 1.5, x1 - x0 - 3, y1 - y0 - 3);   // hedge border
    };
    const brick = (x0, y0, x1, y1) => {
      ctx.fillStyle = '#c4653f'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let yy = y0; yy < y1; yy += 12) for (let xx = x0 + ((yy - y0) / 12 % 2) * 12; xx < x1; xx += 24) ctx.fillRect(xx, yy, 11, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, y0, x1 - x0, 2); ctx.fillRect(x0, y1 - 2, x1 - x0, 2);
    };
    // ---- Broadway: sidewalks, two carriageways, a planted median with the subway entrance, a crosswalk
    ctx.fillStyle = '#cfc8b8'; ctx.fillRect(BW.x0, W.y0, BW.x1 - BW.x0, W.y1 - W.y0);
    for (const [a, b] of [BW.laneW, BW.laneE]) { ctx.fillStyle = '#474a50'; ctx.fillRect(a, W.y0, b - a, W.y1 - W.y0); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 200; i++) ctx.fillRect(a + ((i * 97) % (b - a)), W.y0 + ((i * 53) % (W.y1 - W.y0)), 2, 2); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(a - 2, W.y0, 2, W.y1 - W.y0); ctx.fillRect(b, W.y0, 2, W.y1 - W.y0); }
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([22, 16]);
    for (const [a, b] of [BW.laneW, BW.laneE]) { ctx.beginPath(); ctx.moveTo((a + b) / 2, W.y0); ctx.lineTo((a + b) / 2, BW.cross.y0 - 20); ctx.moveTo((a + b) / 2, BW.cross.y1 + 20); ctx.lineTo((a + b) / 2, W.y1); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (const [a, b] of [BW.laneW, BW.laneE]) for (let k = 0; k < 4; k++) ctx.fillRect(a + 6 + k * 12, BW.cross.y0 + 10, 8, BW.cross.y1 - BW.cross.y0 - 20);
    const [m0, m1] = BW.median;
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(m0, W.y0, m1 - m0, W.y1 - W.y0); ctx.fillStyle = '#79b85e'; ctx.fillRect(m0 + 8, W.y0 + 10, m1 - m0 - 16, BW.cross.y0 - 30 - W.y0); ctx.fillRect(m0 + 8, BW.cross.y1 + 20, m1 - m0 - 16, W.y1 - BW.cross.y1 - 30);
    ctx.fillStyle = '#cfc8b8'; ctx.fillRect(m0, BW.cross.y0 - 20, m1 - m0, BW.cross.y1 - BW.cross.y0 + 40); ctx.fillRect(m0, 550, m1 - m0, 90);
    for (const [x, y] of C.planters) { ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 22, y - 12, 44, 24, 4); ctx.fill(); E.bed(r, x, y); }
    E.entrance(r, C.SUBWAY.x, C.SUBWAY.y, '116 ST');
    for (const [x, y] of C.lamps) E.lamp(r, x, y);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(9682, 560, 3, 40); ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, 9660, 548, 48, 14, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BROADWAY', 9684, 555);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(9874, 560, 3, 40); ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, 9852, 548, 48, 14, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('W 116 ST', 9876, 555);
    // ---- Columbia
    for (const [a, b, c, d] of CU.lawns) lawn(a, b, c, d);
    brick(CU.fence.x1, CU.walk.y0, W.x1, CU.walk.y1);
    brick(CU.axis.x0, CU.low.steps.y1, CU.axis.x1, CU.butler.steps.y0);
    brick(10000, CU.cross.y0, 10600, CU.cross.y1);
    brick(10000, 540, 10600, 560); brick(10000, 860, 10600, 878);
    E.paintLow(r, CU); E.paintButler(r, CU);
    for (const F of CU.fountains) E.paintFountainBasin(r, F);
    E.paintSundial(r, CU.sundial); E.paintLion(r, CU.lion); E.paintAlma(r, CU.alma);
    E.paintBookstore(r, CU.bookstore); E.paintCart(r, CU.cart); E.paintSliceStand(r, CU.slice);
    for (const [x, y] of CU.trees) E.treeBase(r, x, y);
    for (const [x, y] of CU.benches) E.bench(r, x, y);
    for (const [x, y] of CU.beds) E.bed(r, x, y);
    E.paintGate(r, CU.fence, 'COLUMBIA UNIVERSITY', '#9ecbff', '🦁');
    // ---- Barnard
    lawn(BC.lawn.x0, BC.lawn.y0, BC.lawn.x1, BC.lawn.y1);
    brick(BC.walk.x0, BC.walk.y0, BC.fence.x0, BC.walk.y1);
    brick(BC.axisN.x0, BC.lib.y1, BC.axisN.x1, BC.walk.y0); brick(BC.axisS.x0, BC.walk.y1, BC.axisS.x1, BC.lawn.y0);
    brick(BC.lawn.x0, BC.lawn.y1, BC.lawn.x1, BC.lawn.y1 + 18);
    E.paintBarnardLib(r, BC.lib); E.paintGreenhouse(r, BC.green); E.paintDance(r, BC.dance); E.paintBear(r, BC.bear);
    E.treeBase(r, BC.bigTree.x, BC.bigTree.y, 1.6);
    for (const [x, y] of BC.trees) E.treeBase(r, x, y);
    for (const [x, y] of BC.benches) E.bench(r, x, y);
    for (const [x, y] of BC.beds) E.bed(r, x, y);
    E.paintGate(r, BC.fence, 'BARNARD COLLEGE', '#1f4e9a', '🐻');
  },
  // a low brick wall with iron railings, two stone gate posts with lamps, the gates swung open and an arched name sign
  paintGate(r, F, name, color, ico) {
    const ctx = r.ctx, W = CFG.SUBWAY.CAMPUS.WORLD, x0 = F.x0, x1 = F.x1, cx = (x0 + x1) / 2;
    for (const [a, b] of [[W.y0, F.gate.y0 - 24], [F.gate.y1 + 24, W.y1]]) {
      ctx.fillStyle = '#8a4a3a'; ctx.fillRect(x0, a, x1 - x0, b - a); ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let yy = a; yy < b; yy += 12) ctx.fillRect(x0, yy, x1 - x0, 5);
      ctx.fillStyle = '#2b2b2b'; for (let yy = a + 4; yy < b; yy += 10) ctx.fillRect(cx - 1.5, yy, 3, 6);
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x0 - 1, a, x1 - x0 + 2, 2); ctx.fillRect(x0 - 1, b - 2, x1 - x0 + 2, 2);
    }
    for (const y of [F.gate.y0 - 24, F.gate.y1]) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 - 5, y + 3, x1 - x0 + 16, 24);
      ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x0 - 8, y, x1 - x0 + 16, 24); ctx.fillStyle = '#d2cbbb'; ctx.fillRect(x0 - 8, y, x1 - x0 + 16, 6);
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(cx - 2, y - 26, 4, 26); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx, y - 28, 6, 0, Math.PI * 2); ctx.fill();
    }
    // the open gates: iron bars angled inward from each post
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 3;
    for (const [y, dir] of [[F.gate.y0, -1], [F.gate.y1, 1]]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + 26, y - dir * 22); ctx.stroke(); ctx.lineWidth = 1.5; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 5, y - dir * k * 4.2); ctx.lineTo(cx + k * 5, y + dir * 6 - dir * k * 4.2 - dir * 8); ctx.stroke(); } ctx.lineWidth = 3; }
  },
  // the arched name sign over a gate (drawn in the overlay so the trees never hide it)
  gateSign(r, F, name, color, ico) {
    const ctx = r.ctx, cx = (F.x0 + F.x1) / 2;
    ctx.font = r.font(10); const w = ctx.measureText(`${ico} ${name} ${ico}`).width + 24;
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - w / 2 + 10, F.gate.y0 - 30); ctx.quadraticCurveTo(cx, F.gate.y0 - 110, cx + w / 2 - 10, F.gate.y0 - 30); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, cx - w / 2 + 2, F.gate.y0 - 78, w, 22, 8); ctx.fill();
    ctx.fillStyle = color; U.roundRect(ctx, cx - w / 2, F.gate.y0 - 80, w, 22, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${ico} ${name} ${ico}`, cx, F.gate.y0 - 69);
  },
  // Low Library: a stone block with a green copper dome, columns and a wide flight of steps in front
  paintLow(r, CU) {
    const ctx = r.ctx, B = CU.low, S = B.steps, cx = (B.x0 + B.x1) / 2, w = B.x1 - B.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 6, B.y0 + 6, w, B.y1 - B.y0);
    ctx.fillStyle = '#e8dcc5'; ctx.fillRect(B.x0, B.y0, w, B.y1 - B.y0);
    ctx.fillStyle = '#d4c6ab'; ctx.fillRect(B.x0, B.y0, w, B.y1 - B.y0 - 54);
    ctx.fillStyle = '#c9b899'; ctx.fillRect(B.x0 + 40, B.y0, w - 80, B.y1 - B.y0 - 54);
    // the dome
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(cx + 6, B.y0 + 100, 92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fa893'; ctx.beginPath(); ctx.arc(cx, B.y0 + 96, 92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8fb8a3'; ctx.beginPath(); ctx.arc(cx, B.y0 + 96, 72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a3cbb6'; ctx.beginPath(); ctx.arc(cx - 10, B.y0 + 86, 40, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 20, B.y0 + 96 + Math.sin(a) * 20); ctx.lineTo(cx + Math.cos(a) * 90, B.y0 + 96 + Math.sin(a) * 90); ctx.stroke(); }
    ctx.fillStyle = '#e8dcc5'; ctx.beginPath(); ctx.arc(cx, B.y0 + 96, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, B.y0 + 96, 6, 0, Math.PI * 2); ctx.fill();
    // the colonnade across the front and the dark entrance
    ctx.fillStyle = '#efe5d0'; ctx.fillRect(B.x0, B.y1 - 54, w, 54); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(B.x0, B.y1 - 54, w, 6);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 18, B.y1 - 40, 36, 40); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx, B.y1 - 24, 5, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 10; k++) { const x = B.x0 + 24 + k * (w - 48) / 9; if (Math.abs(x - cx) < 26) continue; ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 6, B.y1 - 46, 12, 46, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x + 2, B.y1 - 44, 4, 44); ctx.fillStyle = '#d4c6ab'; ctx.fillRect(x - 8, B.y1 - 48, 16, 5); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5b4a3a'; ctx.fillText('LOW LIBRARY', cx, B.y1 - 50 + 3);
    // the steps: wide, stone, lighter at the top
    for (let k = 0; k < 6; k++) { const f = k / 6; ctx.fillStyle = `rgb(${Math.round(226 - 24 * f)},${Math.round(216 - 26 * f)},${Math.round(194 - 30 * f)})`; ctx.fillRect(S.x0 + k * 4, S.y0 + k * (S.y1 - S.y0) / 6, S.x1 - S.x0 - k * 8, (S.y1 - S.y0) / 6 + 1); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(S.x0 + k * 4, S.y0 + (k + 1) * (S.y1 - S.y0) / 6 - 2, S.x1 - S.x0 - k * 8, 2); }
  },
  // Butler Library across the lawn: a long colonnade facing north with names carved along the top
  paintButler(r, CU) {
    const ctx = r.ctx, B = CU.butler, w = B.x1 - B.x0, cx = (B.x0 + B.x1) / 2;
    for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(0,0,0,${0.08 + k * 0.03})`; ctx.fillRect(B.x0, B.steps.y0 + k * 7, w, 8); ctx.fillStyle = '#e2d8c2'; ctx.fillRect(B.x0, B.steps.y0 + k * 7, w, 6); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 6, B.y0 + 6, w, B.y1 - B.y0);
    ctx.fillStyle = '#e8dcc5'; ctx.fillRect(B.x0, B.y0, w, B.y1 - B.y0);
    ctx.fillStyle = '#efe5d0'; ctx.fillRect(B.x0, B.y0, w, 60);
    for (let k = 0; k < 14; k++) { const x = B.x0 + 18 + k * (w - 36) / 13; ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 6, B.y0 + 10, 12, 50, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x + 2, B.y0 + 12, 4, 48); }
    ctx.fillStyle = '#5b4a3a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HOMER · PLATO · SHAKESPEARE · PIZZA', cx, B.y0 + 6);
    ctx.fillStyle = '#d4c6ab'; ctx.fillRect(B.x0, B.y0 + 60, w, B.y1 - B.y0 - 60);
    for (let row = 0; row < 3; row++) for (let c = 0; c < 10; c++) { const x = B.x0 + 24 + c * (w - 48) / 9, y = B.y0 + 76 + row * 36; ctx.fillStyle = '#9fd8ff'; ctx.fillRect(x - 8, y, 16, 22); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 8, y, 16, 3); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 16, B.y0 + 24, 32, 36);
    this.sign(r, cx, B.y0 - 16, '📚 BUTLER LIBRARY', 9);
  },
  paintFountainBasin(r, F) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(F.x + 2, F.y + 6, 54, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 54, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cc2ec'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 44, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9d968a'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 6, 13, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(F.x - 4, F.y - 30, 8, 24);
  },
  paintSundial(r, D) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(D.x + 3, D.y + 12, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9d968a'; ctx.fillRect(D.x - 16, D.y - 2, 32, 14); ctx.fillStyle = '#b9b2a4'; ctx.fillRect(D.x - 18, D.y - 6, 36, 6);
    ctx.fillStyle = '#6f7a86'; ctx.beginPath(); ctx.arc(D.x, D.y - 14, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8c97a3'; ctx.beginPath(); ctx.arc(D.x - 4, D.y - 18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☀ SUNDIAL', D.x, D.y + 20);
  },
  // the lion mascot on a stone plinth
  paintLion(r, L) {
    const ctx = r.ctx, x = L.x, y = L.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 22, y - 8, 52, 24);
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x - 26, y - 14, 52, 30); ctx.fillStyle = '#d2cbbb'; ctx.fillRect(x - 26, y - 14, 52, 5);
    ctx.fillStyle = '#c98a3c'; ctx.beginPath(); ctx.ellipse(x + 4, y - 24, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a86b2d'; ctx.beginPath(); ctx.arc(x - 14, y - 30, 14, 0, Math.PI * 2); ctx.fill();   // mane
    ctx.fillStyle = '#e0a455'; ctx.beginPath(); ctx.arc(x - 14, y - 30, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 17, y - 32, 1.4, 0, Math.PI * 2); ctx.arc(x - 11, y - 32, 1.4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 15, y - 28, 3, 2);
    ctx.strokeStyle = '#c98a3c'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 20, y - 24); ctx.quadraticCurveTo(x + 32, y - 30, x + 30, y - 40); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#c98a3c'; for (const dx of [-6, 2, 10]) ctx.fillRect(x + dx, y - 18, 5, 6);
    this.sign(r, x, y + 24, '🦁 ROAR!', 8, 12);
  },
  // Alma Mater: a seated bronze lady on the library steps, arms open, a book on her lap
  paintAlma(r, A) {
    const ctx = r.ctx, x = A.x, y = A.y, bronze = '#6d8b74', dark = '#55705c';
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 20, y - 10, 44, 24);
    ctx.fillStyle = '#9d968a'; ctx.fillRect(x - 22, y - 16, 44, 30); ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x - 22, y - 16, 44, 5);
    ctx.fillStyle = dark; U.roundRect(ctx, x - 16, y - 30, 32, 22, 6); ctx.fill();   // the throne
    ctx.fillStyle = bronze; U.roundRect(ctx, x - 12, y - 44, 24, 30, 8); ctx.fill();   // robe
    ctx.fillStyle = dark; ctx.fillRect(x - 9, y - 22, 18, 6);                          // the book on her lap
    ctx.fillStyle = bronze; ctx.beginPath(); ctx.arc(x, y - 52, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(x, y - 55, 9, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 7, y - 62, 14, 3);   // crown
    ctx.strokeStyle = bronze; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 10, y - 36); ctx.lineTo(x - 22, y - 44); ctx.moveTo(x + 10, y - 36); ctx.lineTo(x + 22, y - 44); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x + 23, y - 46, 2.5, 0, Math.PI * 2); ctx.fill();
    this.sign(r, x, y + 22, 'ALMA MATER', 7, 10);
  },
  paintBookstore(r, B) {
    const ctx = r.ctx, w = B.x1 - B.x0, h = B.y1 - B.y0, cx = (B.x0 + B.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 6, B.y0 + 6, w, h);
    ctx.fillStyle = '#90caf9'; ctx.fillRect(B.x0, B.y0, w, h); ctx.fillStyle = '#5a93c4'; ctx.fillRect(B.x0, B.y0, w, 22);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(B.x0 + 8, B.y1 - 36, 30, 24); ctx.fillRect(B.x1 - 38, B.y1 - 36, 30, 24);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#e4572e', '#2f9e44', '#f2b134', '#8e5bd1'][i]; ctx.fillRect(B.x0 + 11 + i * 7, B.y1 - 28, 5, 14); ctx.fillRect(B.x1 - 35 + i * 7, B.y1 - 30 + i * 2, 5, 14); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 11, B.y1 - 34, 22, 34);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#1f4e9a'; ctx.fillRect(cx - 42 + i * 14, B.y1 - 44, 14, 10); }
    this.sign(r, cx, B.y1 - 54, '📚 BOOKSTORE', 8, 12);
  },
  paintCart(r, H) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(H.x + 2, H.y + 10, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(H.x - 14, H.y + 8, 5, 0, Math.PI * 2); ctx.arc(H.x + 14, H.y + 8, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; U.roundRect(ctx, H.x - 22, H.y - 12, 44, 22, 4); ctx.fill(); ctx.fillStyle = '#2f9e44'; ctx.fillRect(H.x - 22, H.y - 4, 44, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(H.x - 16, H.y - 10, 20, 8); ctx.fillStyle = '#ffd166'; ctx.fillRect(H.x - 14, H.y - 8, 16, 4);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(H.x + 14, H.y - 40, 3, 30);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#2f9e44'; ctx.beginPath(); ctx.moveTo(H.x + 15, H.y - 40); ctx.arc(H.x + 15, H.y - 40, 26, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); }
    this.sign(r, H.x, H.y + 18, '🥨 SNACKS', 8, 12);
  },
  // the famous giant-slice stand: a counter, a huge slice on a pole and a bright sign
  paintSliceStand(r, P) {
    const ctx = r.ctx, x = P.x, y = P.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 32, y - 8, 72, 24);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 36, y - 14, 72, 28); ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - 30, y - 10, 60, 12);
    for (let i = 0; i < 3; i++) r.drawPizza(x - 18 + i * 18, y - 4, 7);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 38, y + 8, 76, 6);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x + 34, y - 60, 4, 48);
    ctx.save(); ctx.translate(x + 36, y - 70); ctx.rotate(-0.3);
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(-18, -14); ctx.lineTo(18, -14); ctx.lineTo(0, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.lineTo(0, 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; for (const [dx, dy] of [[-6, -3], [5, -2], [0, 7]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    this.sign(r, x - 14, y - 74, '🍕 Giant Slice!', 9, 14);
  },
  paintBarnardLib(r, B) {
    const ctx = r.ctx, w = B.x1 - B.x0, h = B.y1 - B.y0, cx = (B.x0 + B.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 6, B.y0 + 6, w, h);
    ctx.fillStyle = '#f2e6d0'; ctx.fillRect(B.x0, B.y0, w, h); ctx.fillStyle = '#d9c9a8'; ctx.fillRect(B.x0, B.y0, w, 24);
    for (let row = 0; row < 3; row++) for (let c = 0; c < 6; c++) { const x = B.x0 + 20 + c * (w - 40) / 6, y = B.y0 + 34 + row * 30; ctx.fillStyle = row === 2 ? '#9fd8ff' : (c + row) % 3 ? '#9fd8ff' : '#fff3b0'; ctx.fillRect(x, y, (w - 40) / 6 - 8, row === 2 ? 60 : 22); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x, y, (w - 40) / 6 - 8, 3); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 14, B.y1 - 34, 28, 34); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx + 6, B.y1 - 18, 2, 0, Math.PI * 2); ctx.fill();
    this.sign(r, cx, B.y1 - 46, '📖 BARNARD LIBRARY', 8, 12);
  },
  paintGreenhouse(r, B) {
    const ctx = r.ctx, w = B.x1 - B.x0, h = B.y1 - B.y0, cx = (B.x0 + B.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 5, B.y0 + 5, w, h);
    ctx.fillStyle = '#d7f3ea'; ctx.fillRect(B.x0, B.y0, w, h);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#3f9a4a', '#56b862', '#2f7f3a', '#ff8fab', '#ffd166'][i % 5]; ctx.beginPath(); ctx.arc(B.x0 + 20 + (i * 37) % (w - 40), B.y0 + 30 + (i * 53) % (h - 50), 9 + (i % 3) * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(B.x0, B.y0, w, h);
    ctx.strokeStyle = '#e6e8eb'; ctx.lineWidth = 3; ctx.strokeRect(B.x0 + 1.5, B.y0 + 1.5, w - 3, h - 3);
    for (let xx = B.x0 + w / 4; xx < B.x1 - 4; xx += w / 4) { ctx.beginPath(); ctx.moveTo(xx, B.y0); ctx.lineTo(xx, B.y1); ctx.stroke(); }
    for (let yy = B.y0 + 36; yy < B.y1 - 4; yy += 36) { ctx.beginPath(); ctx.moveTo(B.x0, yy); ctx.lineTo(B.x1, yy); ctx.stroke(); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 10, B.y1 - 26, 20, 26);
    this.sign(r, cx, B.y1 - 38, '🌱 GREENHOUSE', 8, 12);
  },
  paintDance(r, B) {
    const ctx = r.ctx, w = B.x1 - B.x0, h = B.y1 - B.y0, cx = (B.x0 + B.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 6, B.y0 + 6, w, h);
    ctx.fillStyle = '#f8bbd0'; ctx.fillRect(B.x0, B.y0, w, h); ctx.fillStyle = '#c45c7a'; ctx.fillRect(B.x0, B.y0, w, 22);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(B.x0 + 12, B.y0 + 34, w - 24, 44);   // the big studio window: a mirror and a barre
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(B.x0 + 12, B.y0 + 34, w - 24, 5); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x0 + 20, B.y0 + 62, w - 40, 3);
    for (let i = 0; i < 3; i++) { const dx = B.x0 + 50 + i * 60; ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(dx, B.y0 + 44); ctx.lineTo(dx - 7, B.y0 + 62); ctx.lineTo(dx + 7, B.y0 + 62); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(dx, B.y0 + 42, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 12, B.y0 + 90, 24, 40);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#c45c7a'; ctx.fillRect(cx - 56 + i * 14, B.y0 + 86, 14, 8); }
    this.sign(r, cx, B.y0 + 26 - 32 + 30, '💃 DANCE STUDIO', 8, 12);
  },
  // the Barnard bear: a bronze dancing bear on a plinth
  paintBear(r, Bz) {
    const ctx = r.ctx, x = Bz.x, y = Bz.y, br = '#7a5230', dk = '#5b3a1a';
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 18, y - 8, 44, 24);
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x - 22, y - 14, 44, 30); ctx.fillStyle = '#d2cbbb'; ctx.fillRect(x - 22, y - 14, 44, 5);
    ctx.fillStyle = br; U.roundRect(ctx, x - 13, y - 44, 26, 32, 10); ctx.fill();
    ctx.fillStyle = '#c9a16b'; ctx.beginPath(); ctx.ellipse(x, y - 24, 8, 9, 0, 0, Math.PI * 2); ctx.fill();   // tummy
    ctx.fillStyle = br; ctx.beginPath(); ctx.arc(x, y - 52, 11, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x - 9, y - 60, 4.5, 0, Math.PI * 2); ctx.arc(x + 9, y - 60, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a16b'; ctx.beginPath(); ctx.ellipse(x, y - 48, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 4, y - 54, 1.5, 0, Math.PI * 2); ctx.arc(x + 4, y - 54, 1.5, 0, Math.PI * 2); ctx.arc(x, y - 49, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = br; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 12, y - 38); ctx.lineTo(x - 22, y - 50); ctx.moveTo(x + 12, y - 38); ctx.lineTo(x + 22, y - 50); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = dk; ctx.fillRect(x - 11, y - 16, 8, 6); ctx.fillRect(x + 3, y - 16, 8, 6);
    this.sign(r, x, y + 24, '🐻 MILLIE THE BEAR', 7, 10);
  },

  // ======================= live art =======================
  // the view is often bigger than the little station: paint earth around it (and over the core's sky above it)
  dynamic(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'subway') {
      const W = CFG.SUBWAY.STATION.WORLD, vx0 = r.camX - 10, vy0 = r.camY - 10, vx1 = r.camX + r.viewW + 10, vy1 = r.camY + r.viewH + 10;
      ctx.fillStyle = '#4a3627';
      if (vy0 < W.y0) ctx.fillRect(vx0, vy0, vx1 - vx0, W.y0 - vy0);
      if (vy1 > W.y1) ctx.fillRect(vx0, W.y1, vx1 - vx0, vy1 - W.y1);
      if (vx0 < W.x0) ctx.fillRect(vx0, W.y0, W.x0 - vx0, W.y1 - W.y0);
      if (vx1 > W.x1) ctx.fillRect(W.x1, W.y0, vx1 - W.x1, W.y1 - W.y0);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 160; i++) { const x = vx0 + ((i * 193) % (vx1 - vx0 + 1)), y = vy0 + ((i * 101) % (vy1 - vy0 + 1)); if (x > W.x0 && x < W.x1 && y > W.y0 && y < W.y1) continue; ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); }
      // buried treasures in the earth: a bone, a worm that wriggles, an old pizza box
      ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🦴', W.x0 + 180, W.y1 + 70); ctx.fillText('🐛', W.x1 - 140 + Math.sin(t * 2) * 4, W.y1 + 120); ctx.fillText('🍕', W.x0 + 560, W.y1 + 150); ctx.fillText('💎', W.x1 + 40, W.y0 + 260);
      // the arrow signs blink green while a train is in; the clock ticks
      const T = CFG.SUBWAY.STATION.turnstiles, on = st.train.state === 'stopped' && Math.floor(t * 2) % 2 === 0;
      for (const x of T.xs) { ctx.fillStyle = on ? '#44d36a' : '#1f6e3e'; ctx.fillRect(x - 19, T.y - 11, 4, 4); }
      const CK = CFG.SUBWAY.STATION.clock, a = (t % 60) / 60 * Math.PI * 2 - Math.PI / 2; ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(CK.x, CK.y); ctx.lineTo(CK.x + Math.cos(a) * 9, CK.y + Math.sin(a) * 9); ctx.stroke();
      return;
    }
    if (g.area !== 'campus') return;
    // fountain water
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const F of CFG.SUBWAY.CAMPUS.CU.fountains) for (let k = 0; k < 10; k++) { const ph = (t * 0.9 + k * 0.1) % 1, a = (k / 10) * Math.PI * 2, rr = ph * 32, h = Math.sin(ph * Math.PI) * 26; ctx.beginPath(); ctx.arc(F.x + Math.cos(a) * rr, F.y - 28 - h + ph * 24, 2.5, 0, Math.PI * 2); ctx.fill(); }
  },

  entities(r, g, items) {
    const st = this.st; if (!st) return;
    if (g.area === 'subway') { this.stationEntities(r, g, items); return; }
    if (g.area === 'campus') this.campusEntities(r, g, items);
  },
  // a person with a backpack slung over one shoulder
  drawStudent(r, q) {
    const ctx = r.ctx, f = q.facing || 1;
    if (q.pack) { ctx.fillStyle = q.pack; U.roundRect(ctx, q.x - f * 22, q.y - 34, 14, 20, 4); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, q.x - f * 22, q.y - 34, 14, 7, 3); ctx.fill(); }
    r.drawPerson(q.x, q.y, q);
    if (q.pack) { ctx.strokeStyle = q.pack; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x - f * 8, q.y - 30); ctx.lineTo(q.x - f * 14, q.y - 16); ctx.stroke(); }
  },
  stationEntities(r, g, items) {
    const st = this.st, S = CFG.SUBWAY.STATION, ctx = r.ctx, t = g.time;
    // the clerk waving from the booth, the vendor at the snack stand
    items.push({ y: S.booth.clerk.y, draw: () => { const c = S.booth.clerk; r.drawPerson(c.x, c.y, { shirt: '#1f4e9a', skin: '#c68642', hat: 'cap', capColor: '#1f4e9a', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' }); const w = Math.sin(t * 6) * 5; ctx.fillStyle = '#c68642'; ctx.beginPath(); ctx.arc(c.x + 18, c.y - 34 + w, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.booth.x0 - 4, S.booth.y1 - 14, S.booth.x1 - S.booth.x0 + 8, 14); } });
    items.push({ y: S.snack.vendor.y, draw: () => { const v = S.snack.vendor; r.drawPerson(v.x, v.y, { shirt: '#e4572e', apron: '#fff', skin: '#f1c27d', hat: 'cap', capColor: '#e4572e', facing: -1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' }); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.snack.x0 - 4, S.snack.y1 - 14, S.snack.x1 - S.snack.x0 + 8, 14); r.drawPizza(S.snack.x1 - 14, S.snack.y1 - 6, 10); } });
    for (const c of st.commuters) if (!c.hidden) items.push({ y: c.y, draw: () => { this.drawStudent(r, c); if (c.paper && !c.moving) { ctx.fillStyle = '#fff'; ctx.fillRect(c.x - 12, c.y - 26, 24, 14); ctx.fillStyle = 'rgba(0,0,0,0.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(c.x - 9, c.y - 23 + k * 4, 18, 1.5); } } });
    for (const q of st.riders) items.push({ y: q.y, draw: () => this.drawStudent(r, q) });
    // the rat with its slice
    if (st.rat.on) items.push({ y: S.trackY + 30, draw: () => this.drawRat(r, g, st.rat) });
    if (st.train.state !== 'away') items.push({ y: S.trackY + 26, draw: () => this.drawSubwayTrain(r, g, st.train) });
  },
  drawRat(r, g, rat) {
    const ctx = r.ctx, x = rat.x, y = CFG.SUBWAY.STATION.trackY + 6, f = rat.dir, t = g.time, wig = Math.sin(t * 18) * 3;
    ctx.strokeStyle = '#e8a0bf'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - f * 8, y); ctx.quadraticCurveTo(x - f * 16, y + wig, x - f * 22, y - 3 + wig); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#8c97a3'; ctx.beginPath(); ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + f * 9, y - 1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a0bf'; ctx.beginPath(); ctx.arc(x + f * 7, y - 6, 2.5, 0, Math.PI * 2); ctx.arc(x + f * 11, y - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 11, y - 2, 1, 0, Math.PI * 2); ctx.arc(x + f * 14, y, 1.2, 0, Math.PI * 2); ctx.fill();
    // the slice held out in front
    ctx.save(); ctx.translate(x + f * 20, y - 2); ctx.rotate(f > 0 ? 1.3 : -1.3 + Math.PI);
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(6, -5); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, 1, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // the subway train seen from above: silver cars with a red stripe, windows along both sides, doors lit when open, a route bullet
  drawSubwayTrain(r, g, tr) {
    const ctx = r.ctx, S = CFG.SUBWAY.STATION, K = CFG.SUBWAY, y = S.trackY, open = tr.doors, stopped = tr.state === 'stopped';
    const car = (x, len, front, back) => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, x + 4, y - 20, len, 48, 8); ctx.fill();
      ctx.fillStyle = '#1e1e1e'; for (const bx of [x + 16, x + len - 32]) { U.roundRect(ctx, bx, y - 27, 16, 6, 2); ctx.fill(); U.roundRect(ctx, bx, y + 21, 16, 6, 2); ctx.fill(); }
      const steel = ctx.createLinearGradient(0, y - 24, 0, y + 24); steel.addColorStop(0, '#9aa0a8'); steel.addColorStop(0.5, '#dfe3e8'); steel.addColorStop(1, '#9aa0a8');
      ctx.fillStyle = steel; U.roundRect(ctx, x, y - 24, len, 48, front || back ? 12 : 6); ctx.fill();
      ctx.fillStyle = K.COLOR; ctx.fillRect(x + 4, y - 21, len - 8, 3); ctx.fillRect(x + 4, y + 18, len - 8, 3);
      // windows between the doors, both sides
      ctx.fillStyle = stopped ? '#fff3b0' : '#bfe3ff';
      for (const wx of [x + 8, x + 52, x + 72, x + 92, x + 132]) { if (wx + 12 > x + len - 4) continue; ctx.fillRect(wx, y - 23, 12, 6); ctx.fillRect(wx, y + 17, 12, 6); }
      // the doors on the platform side slide apart; the far side stays shut
      for (const dx of [x + 28, x + 108]) {
        const half = 7 * (1 - open);
        ctx.fillStyle = stopped ? '#ffe08a' : '#2d3a4a'; ctx.fillRect(dx, y - 24, 14, 8);
        if (open > 0) { ctx.fillStyle = '#fff3b0'; ctx.fillRect(dx + half, y - 24, 14 - half * 2, 8); }
        ctx.fillStyle = '#7f8791'; ctx.fillRect(dx, y - 24, half, 8); ctx.fillRect(dx + 14 - half, y - 24, half, 8);
        ctx.fillStyle = '#7f8791'; ctx.fillRect(dx, y + 16, 14, 8); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(dx + 6.5, y + 16, 1, 8);
      }
      ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x + 6, y - 12, len - 12, 24, 6); ctx.fill();   // roof
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 10, y - 1, len - 20, 2);
      ctx.fillStyle = '#8c97a3'; for (let k = 24; k < len - 24; k += 30) { U.roundRect(ctx, x + k, y - 6, 12, 12, 3); ctx.fill(); }   // air-con boxes
      if (front) { ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x + len - 10, y - 20, 8, 40); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(x + len - 9, y - 16, 5, 32); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x + len - 2, y - 14, 4, 0, Math.PI * 2); ctx.arc(x + len - 2, y + 14, 4, 0, Math.PI * 2); ctx.fill(); }
      if (back) { ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(x + 2, y - 14, 3.5, 0, Math.PI * 2); ctx.arc(x + 2, y + 14, 3.5, 0, Math.PI * 2); ctx.fill(); }
    };
    for (let i = 0; i < S.cars; i++) {
      const x = this.carX(i, tr.x);
      if (i > 0) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - S.gap - 2, y - 4, S.gap + 4, 8); }
      car(x, S.carLen, i === S.cars - 1, i === 0);
    }
    // the route bullet on the front car's roof
    const fx = this.carX(S.cars - 1, tr.x) + S.carLen / 2;
    ctx.fillStyle = K.COLOR; ctx.beginPath(); ctx.arc(fx, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(K.LINE, fx, y + 1);
    // countdown while it waits
    if (stopped && !this.st.boarding && !g.travel) {
      const n = Math.max(0, Math.ceil(tr.dwell)), urgent = n <= 4;
      r.drawBubble(fx, y - 52 + (urgent ? Math.sin(g.time * 12) * 3 : 0), () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = urgent ? '#e4572e' : '#2b1d14'; ctx.fillText(tr.dwell > 0 ? `Leaves in ${n}s` : 'Doors closing!', 0, 0); }, 100);
    }
  },
  campusEntities(r, g, items) {
    const st = this.st, C = CFG.SUBWAY.CAMPUS, CU = C.CU, ctx = r.ctx, t = g.time;
    for (const tx of st.taxis) items.push({ y: tx.y + 10, draw: () => { ctx.save(); ctx.translate(tx.x, tx.y); ctx.rotate(tx.angle); r.drawVehicle('taxi', g, '#ffd60a'); ctx.restore(); } });
    for (const q of st.peds) items.push({ y: q.y, draw: () => this.drawStudent(r, q) });
    // students reading on the steps
    for (const R of CU.readers) items.push({ y: R.y, draw: () => {
      const x = R.x, y = R.y, f = R.f, i = CU.readers.indexOf(R), shirt = ['#f28e2b', '#76b7b2', '#b07aa1'][i], skin = ['#f1c27d', '#8d5524', '#e0ac69'][i];
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a3f5c'; U.roundRect(ctx, x - 4, y - 10, 20, 8, 4); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + 16, y - 5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shirt; U.roundRect(ctx, x - 12, y - 30, 22, 24, 8); ctx.fill();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x - 1, y - 36, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = ['#2b1d14', '#1a1a1a', '#d9a066'][i]; ctx.beginPath(); ctx.arc(x - 1, y - 38, 9, Math.PI, 0); ctx.fill();
      ctx.fillStyle = ['#e4572e', '#2f9e44', '#3b7dd8'][i]; ctx.save(); ctx.translate(x + 4, y - 16); ctx.rotate(-0.4); ctx.fillRect(-9, -6, 18, 12); ctx.fillStyle = '#fff8ee'; ctx.fillRect(-7, -4, 6, 8); ctx.fillRect(1, -4, 6, 8); ctx.restore();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + 1, y - 35, 1.3, 0, Math.PI * 2); ctx.arc(x - 4, y - 35, 1.3, 0, Math.PI * 2); ctx.fill();
      if (Math.floor(t * 0.5 + i) % 4 === 0) { ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📖', x + 14, y - 44); }
    } });
    // the professor with a wobbly stack of books
    items.push({ y: CU.prof.y, draw: () => {
      const P = CU.prof, lean = Math.sin(t * 1.6) * 2;
      r.drawPerson(P.x, P.y, { shirt: '#9c755f', skin: '#f1c27d', hair: '#d9d9d9', hairStyle: 3, beard: '#d9d9d9', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', bowtie: '#e4572e' });
      for (let k = 0; k < 5; k++) { ctx.fillStyle = ['#e4572e', '#3b7dd8', '#2f9e44', '#f2b134', '#8e5bd1'][k]; ctx.fillRect(P.x + 10 + lean * k * 0.3, P.y - 22 - k * 6, 18, 5); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(P.x + 10 + lean * k * 0.3, P.y - 22 - k * 6, 18, 1.5); }
    } });
    // the squirrel
    const sq = st.squirrel;
    items.push({ y: sq.y, draw: () => {
      const x = sq.x, y = sq.y - sq.hop, f = sq.facing;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(sq.x, sq.y + 2, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a86b36'; ctx.beginPath(); ctx.ellipse(x - f * 8, y - 8, 6, 9, f * 0.5, 0, Math.PI * 2); ctx.fill();   // bushy tail
      ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.ellipse(x, y - 4, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + f * 7, y - 8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 9, y - 9, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.arc(x + f * 5, y - 12, 1.8, 0, Math.PI * 2); ctx.fill();
    } });
    // the slice vendor behind the counter
    items.push({ y: CU.slice.y - 16, draw: () => { r.drawPerson(CU.slice.x - 6, CU.slice.y - 18, { shirt: '#fff', apron: '#e4572e', skin: '#c68642', hat: 'cap', capColor: '#e4572e', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' }); ctx.fillStyle = '#e4572e'; ctx.fillRect(CU.slice.x - 36, CU.slice.y - 14, 72, 28); ctx.fillStyle = '#fff8ee'; ctx.fillRect(CU.slice.x - 30, CU.slice.y - 10, 60, 12); for (let i = 0; i < 3; i++) r.drawPizza(CU.slice.x - 18 + i * 18, CU.slice.y - 4, 7); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(CU.slice.x - 38, CU.slice.y + 8, 76, 6); } });
    if (st.sliceT > 0.2) items.push({ y: CU.slice.y + 1, draw: () => r.drawBubble(CU.slice.x, CU.slice.y - 70 + Math.sin(t * 5) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🍕 Hot slice coming!', 0, 0); }, 130) });
  },
  // tree canopies, the big Barnard tree, dance-studio music notes: things that float above everybody
  overlay(r, g) {
    const st = this.st; if (!st || g.area !== 'campus') return;
    const ctx = r.ctx, C = CFG.SUBWAY.CAMPUS, t = g.time;
    const canopy = (x, y, s, sway) => {
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x + sway, y - 44 * s, 30 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 18 * s + sway, y - 30 * s, 22 * s, 0, Math.PI * 2); ctx.arc(x + 18 * s + sway, y - 30 * s, 22 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 8 * s + sway, y - 52 * s, 14 * s, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    };
    for (const [x, y] of C.CU.trees.concat(C.BC.trees)) canopy(x, y, 1, Math.sin(t * 1.2 + x) * 2);
    canopy(C.BC.bigTree.x, C.BC.bigTree.y, 1.9, Math.sin(t * 0.9) * 3);
    this.gateSign(r, C.CU.fence, 'COLUMBIA UNIVERSITY', '#3b7dd8', '🦁'); this.gateSign(r, C.BC.fence, 'BARNARD COLLEGE', '#1f4e9a', '🐻');
    ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of st.notes) { ctx.globalAlpha = 1 - n.t / 2; ctx.fillStyle = '#c45c7a'; ctx.fillText(n.ch, n.x + Math.sin(n.t * 4) * 6, n.y - n.t * 28); }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    const st = this.st; if (!st || st.fade <= 0 || g.travel) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },

  // ======================= the ride: inside the car, looking out of the windows =======================
  travel: {
    subway(r, g, W, H) {
      const E = SubwayExt, ctx = r.ctx, tr = g.travel, t = g.time, toCampus = tr.to === 'campus', K = CFG.SUBWAY;
      const k = tr.t / tr.dur, ease = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1;
      // speed ramps up over the first second and down over the last
      const SPEED = 900, dur = tr.dur, tt = tr.t, ramp = Math.min(1, dur / 2);
      const d = (x) => x < ramp ? x * x / (2 * ramp) : x < dur - ramp ? x - ramp / 2 : (dur - ramp) - ramp / 2 + ((x - (dur - ramp)) - (x - (dur - ramp)) * (x - (dur - ramp)) / (2 * ramp));
      const dist = d(tt) * SPEED, total = d(dur) * SPEED, speed = (tt < ramp ? tt / ramp : tt > dur - ramp ? (dur - tt) / ramp : 1);
      const sway = (Math.sin(t * 2.1) * 3 + Math.sin(t * 5.3) * 1.2) * speed, shake = Math.sin(t * 41) * 1.2 * speed;
      const narrow = W < 560, sc = Math.min(2.4, Math.max(1.3, W / 460));
      const winTop = Math.max(H * 0.22, 160), winBot = H * 0.6, seatY = winBot + 24, floorY = winBot + 70;
      ctx.save(); ctx.translate(0, shake);
      // ---- out of the windows: the tunnel streaming past, lights whooshing by, now and then a lit station
      ctx.fillStyle = '#16161e'; ctx.fillRect(0, winTop, W, winBot - winTop);
      ctx.fillStyle = '#23232e'; ctx.fillRect(0, winTop, W, (winBot - winTop) * 0.22);
      ctx.fillStyle = '#2d2d3a'; for (let i = 0; i < 3; i++) ctx.fillRect(0, winTop + 6 + i * 7, W, 3);   // pipes and cables
      const layer = (s, step, draw) => { const off = dist * s; const i0 = Math.floor((off - 400) / step), i1 = Math.ceil((off + W + 400) / step); for (let i = Math.max(0, i0); i <= i1; i++) draw(W - (i * step - off), i); };
      layer(1, 260, (x, i) => { const glow = 40 + 80 * speed; const gr = ctx.createLinearGradient(x - glow, 0, x + 10, 0); gr.addColorStop(0, 'rgba(255,230,160,0)'); gr.addColorStop(1, 'rgba(255,230,160,0.45)'); ctx.fillStyle = gr; ctx.fillRect(x - glow, winTop + 20, glow + 10, 12); ctx.fillStyle = '#fff3b0'; ctx.fillRect(x, winTop + 22, 8, 8); ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 3, winTop + 12, 14, 10); if (i % 3 === 0) { ctx.fillStyle = '#2d2d3a'; ctx.fillRect(x + 40, winTop + 30, 60, winBot - winTop - 30); ctx.fillStyle = '#44445a'; ctx.fillRect(x + 48, winTop + 50, 44, 60); } });
      ctx.fillStyle = '#3a3a48'; ctx.fillRect(0, winBot - 18, W, 18); ctx.fillStyle = '#5c5c70'; layer(1, 36, (x) => ctx.fillRect(x, winBot - 14, 16, 4));
      // the stations we rush through, lit and tiled, with a mosaic name and people waiting
      const names = toCampus ? K.STOPS.slice(1, 4) : K.STOPS.slice(1, 4).reverse();
      names.forEach((nm, i) => {
        const cx = W / 2 + (total * (i + 1) / 4 - dist), sw = 760; if (cx < -sw || cx > W + sw) return;
        const x0 = cx - sw / 2;
        ctx.fillStyle = '#f3efe4'; ctx.fillRect(x0, winTop, sw, winBot - winTop);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let yy = winTop; yy < winBot; yy += 10) { ctx.beginPath(); ctx.moveTo(x0, yy + 0.5); ctx.lineTo(x0 + sw, yy + 0.5); ctx.stroke(); }
        ctx.fillStyle = K.COLOR; ctx.fillRect(x0, winTop + 10, sw, 10);
        ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x0, winBot - 40, sw, 22); ctx.fillStyle = '#f2c94c'; ctx.fillRect(x0, winBot - 24, sw, 6);
        for (let p = 0; p < 4; p++) { const px = x0 + 90 + p * 180, col = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759'][p]; ctx.fillStyle = col; U.roundRect(ctx, px - 9, winBot - 72, 18, 32, 7); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(px, winBot - 80, 8, 0, Math.PI * 2); ctx.fill(); }
        for (let p = 0; p < 4; p++) { const px = x0 + 100 + p * 200; ctx.fillStyle = '#e8e3d8'; ctx.fillRect(px - 10, winTop + 20, 20, winBot - winTop - 60); ctx.fillStyle = K.COLOR; ctx.fillRect(px - 10, winTop + 60, 20, 5); }
        E.mosaic(r, cx, winTop + 46, nm, 14);
        const gr = ctx.createLinearGradient(0, winTop, 0, winBot); gr.addColorStop(0, 'rgba(255,255,230,0.15)'); gr.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gr; ctx.fillRect(x0, winTop, sw, winBot - winTop);
      });
      // a touch of reflection on the glass
      const refl = ctx.createLinearGradient(0, winTop, 0, winBot); refl.addColorStop(0, 'rgba(180,220,255,0.18)'); refl.addColorStop(0.5, 'rgba(180,220,255,0.02)'); refl.addColorStop(1, 'rgba(180,220,255,0.1)'); ctx.fillStyle = refl; ctx.fillRect(0, winTop, W, winBot - winTop);
      // ---- the car: ceiling with lights, window frames, the wall and the long bench
      const steel = (y0, y1, a, b) => { const gr = ctx.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
      ctx.fillStyle = steel(0, winTop, '#b8bec6', '#dfe3e8'); ctx.fillRect(0, 0, W, winTop);
      ctx.fillStyle = '#fff8e6'; U.roundRect(ctx, W * 0.1, 10, W * 0.8, 8, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,248,230,0.35)'; U.roundRect(ctx, W * 0.08, 6, W * 0.84, 16, 8); ctx.fill();
      const nWin = narrow ? 2 : 4, fw = W / nWin;
      ctx.fillStyle = '#9aa0a8'; for (let i = 0; i <= nWin; i++) ctx.fillRect(i * fw - 6, winTop - 4, 12, winBot - winTop + 8);
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(0, winTop - 6, W, 6); ctx.fillRect(0, winBot, W, 6);
      ctx.fillStyle = steel(winBot, floorY, '#dfe3e8', '#b8bec6'); ctx.fillRect(0, winBot + 6, W, floorY - winBot - 6);
      ctx.fillStyle = '#f28e2b'; U.roundRect(ctx, 0, seatY, W, 22, 6); ctx.fill(); ctx.fillStyle = '#ffb347'; ctx.fillRect(0, seatY + 22, W, 18); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < W; x += 60 * sc / 1.5) ctx.fillRect(x, seatY + 22, 2, 18);
      ctx.fillStyle = '#6b7480'; ctx.fillRect(0, floorY, W, H - floorY); ctx.fillStyle = 'rgba(255,255,255,0.07)'; for (let i = 0; i < 160; i++) ctx.fillRect((i * 97) % W, floorY + ((i * 53) % (H - floorY)), 3, 3);
      ctx.fillStyle = '#5c6670'; ctx.fillRect(0, floorY + 24, W, 6); ctx.fillStyle = '#f2c94c'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, H - 26, 20, 5);   // a metal strip and the yellow stripe by the far doors
      // ---- the route map above the windows: the stops light up as we go
      const stops = toCampus ? K.STOPS : K.STOPS.slice().reverse(), mw = Math.min(W - 40, 620), mx = W / 2 - mw / 2, my = winTop - 24;
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, mx, my - 14, mw, 28, 8); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; U.roundRect(ctx, mx, my - 14, mw, 28, 8); ctx.stroke();
      ctx.strokeStyle = K.COLOR; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx + 30, my); ctx.lineTo(mx + mw - 30, my); ctx.stroke();
      stops.forEach((nm, i) => {
        const sx = mx + 30 + i * (mw - 60) / 4, next = Math.min(4, Math.floor(k * 4) + 1), lit = i === next && Math.floor(t * 3) % 2 === 0, passed = i * 0.25 <= k;
        ctx.fillStyle = lit ? '#ffd166' : passed ? K.COLOR : '#fff'; ctx.beginPath(); ctx.arc(sx, my, lit ? 7 : 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = K.COLOR; ctx.lineWidth = 2; ctx.stroke();
        if (!narrow || i === 0 || i === 4) { ctx.fillStyle = '#2b1d14'; ctx.font = r.font(narrow ? 7 : 8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(nm, sx, my + (i % 2 ? -9 : 9) * (narrow ? 0 : 1) + (narrow ? 9 : 0)); }
      });
      const trainX = mx + 30 + U.clamp(k, 0, 1) * (mw - 60); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚇', trainX, my - 1);
      // ---- poles, and hand straps hanging from the window rail, swinging with the car
      ctx.fillStyle = '#e6e8eb'; for (const px of [W * 0.3, W * 0.7]) ctx.fillRect(px - 3, 0, 6, floorY);
      for (let x = W * 0.08; x < W; x += W * 0.14) { const a = sway * 0.04 + Math.sin(t * 2.3 + x) * 0.04 * speed; ctx.save(); ctx.translate(x, winTop - 2); ctx.rotate(a); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-1.5, 0, 3, 22); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 28, 7, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      // ---- the passengers on the bench, swaying with the ride: a student, the chef, a grandma, a kid with a balloon
      const py = floorY + 10, people = [
        { x: W * 0.17, s: sc, look: { shirt: '#4e79a7', skin: '#8d5524', hair: '#1a1a1a', hairStyle: 2, facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', pack: '#2f9e44' }, extra: 'student' },
        { x: W * 0.4, s: sc, look: { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: g.player.carry, pants: '#2d3a4a' }, extra: 'chef' },
        { x: W * 0.63, s: sc, look: { shirt: '#b07aa1', skin: '#ffdbac', hair: '#e6e6e6', hairStyle: 2, facing: -1, moving: false, bob: 0, carry: 0, pants: '#9c755f' }, extra: 'grandma' },
        { x: W * 0.84, s: sc * 0.75, look: { shirt: '#edc948', skin: '#e0ac69', hair: '#8c3b2f', hairStyle: 1, facing: -1, moving: false, bob: 0, carry: 0, pants: '#3b7dd8', hat: 'cap', capColor: '#3b7dd8' }, extra: 'kid' },
      ];
      for (const P of people) {
        const dx = sway * (0.6 + P.s * 0.2);
        ctx.save(); ctx.translate(P.x + dx, py); ctx.scale(P.s, P.s);
        if (P.extra === 'student') { ctx.fillStyle = P.look.pack; U.roundRect(ctx, -26, -36, 14, 22, 4); ctx.fill(); }
        r.drawPerson(0, 0, P.look);
        if (P.extra === 'student') { ctx.fillStyle = '#2f9e44'; ctx.fillRect(-7, -22, 16, 10); ctx.fillStyle = '#fff8ee'; ctx.fillRect(-5, -20, 5, 6); ctx.fillRect(2, -20, 5, 6); }
        if (P.extra === 'grandma') { ctx.fillStyle = '#c9975f'; ctx.fillRect(16, -20, 18, 22); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(18, -24, 14, 4); ctx.fillStyle = '#f2b134'; ctx.fillRect(22, -34, 5, 14); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(28, -30, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-6, -44, 12, 2); ctx.beginPath(); ctx.arc(-4, -41, 3, 0, Math.PI * 2); ctx.arc(4, -41, 3, 0, Math.PI * 2); ctx.stroke(); }
        if (P.extra === 'kid') { const bx = 18 + Math.sin(t * 1.7) * 4 - dx * 0.3, by = -80 + Math.sin(t * 2.2) * 3; ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, -16); ctx.quadraticCurveTo(bx, by + 30, bx, by + 12); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(bx, by, 10, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(bx - 3, by - 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); }
        if (P.extra === 'chef') { const w = Math.sin(t * 7) * 4; ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(20, -36 + w, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      ctx.restore();
      // ---- destination banner and progress bar, like the other rides
      const msg = toCampus ? '🚇 Next stop: Columbia campus! 🎓' : '🚇 Next stop: the City! 🏙️';
      ctx.fillStyle = 'rgba(43,29,20,0.85)'; const bw = Math.min(W - 24, 380); U.roundRect(ctx, W / 2 - bw / 2, 60, bw, 44, 12); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 300 ? 13 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 82);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, bw - 32, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, (bw - 32) * U.clamp(k, 0, 1), 6, 3); ctx.fill();
      if (ease < 1) { ctx.fillStyle = `rgba(43,29,20,${1 - ease})`; ctx.fillRect(0, 0, W, H); }
    },
  },
};
// The City's own hint hook always answers inside the City, so this extension goes first in the game hook list to be able
// to point at the subway entrance (every other hook returns undefined/null outside its own maps). Render hooks keep their order.
Game.ext.unshift(SubwayExt);
Render.ext.push(SubwayExt);
