'use strict';
// The bus to the City.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// A city bus comes along Main Street every couple of minutes and stops at the BUS sign on the far
// sidewalk. Hop on and it carries you (side-on, past farms and suburbs) to the City: a little downtown
// with a grid of streets, tall buildings, a park square, taxis, pigeons and a bus waiting to take you home.

// ---------- config ----------
CFG.CITY = {
  WORLD: { x0: 4600, y0: -170, x1: 6200, y1: 1100 },
  // three streets and three avenues; blocks between them hold the buildings, one block is the park square
  ROADS: [
    { x0: 4600, y0: 40, x1: 6200, y1: 120 },     // Bus Street (top)
    { x0: 4600, y0: 480, x1: 6200, y1: 560 },    // Market Street
    { x0: 4600, y0: 900, x1: 6200, y1: 980 },    // Harbour Street
    { x0: 4920, y0: -170, x1: 5000, y1: 1100 },  // 1st Avenue
    { x0: 5360, y0: -170, x1: 5440, y1: 1100 },  // 2nd Avenue
    { x0: 5800, y0: -170, x1: 5880, y1: 1100 },  // 3rd Avenue
  ],
  WALK: 24,
  // buildings: solid; facades face the street below them, flat roofs at the top
  BUILDINGS: [
    // top row (facing Bus Street)
    { x0: 4610, y0: -160, x1: 4740, y1: 0, color: '#e8a0bf', awn: '#c45c7a', sign: 'TOYS' },
    { x0: 4752, y0: -120, x1: 4890, y1: 0, color: '#7fc8f8', awn: '#3b7dd8' },
    { x0: 5030, y0: -150, x1: 5170, y1: 0, color: '#f6c453', awn: '#e4572e', sign: 'BAKERY' },
    { x0: 5182, y0: -165, x1: 5330, y1: 0, color: '#b39ddb', awn: '#8e5bd1', billboard: true },
    { x0: 5470, y0: -140, x1: 5590, y1: 0, color: '#ef8a62', awn: '#b8401c' },
    { x0: 5602, y0: -160, x1: 5770, y1: 0, color: '#90caf9', awn: '#2d5a8a', sign: 'HOTEL', tower: true },
    { x0: 5910, y0: -130, x1: 6050, y1: 0, color: '#a5d6a7', awn: '#2f9e44', sign: 'BOOKS' },
    { x0: 6062, y0: -160, x1: 6190, y1: 0, color: '#f48fb1', awn: '#c45c7a' },
    // middle row (facing Market Street); the park square takes the third block
    { x0: 4610, y0: 170, x1: 4760, y1: 456, color: '#80cbc4', awn: '#2f9e9e', cat: true },
    { x0: 4772, y0: 200, x1: 4890, y1: 456, color: '#ffcc80', awn: '#e4572e', sign: 'MUSIC' },
    { x0: 5030, y0: 150, x1: 5200, y1: 456, color: '#9fa8da', awn: '#3b7dd8', sign: 'PIZZA TOWER', elevator: true },
    { x0: 5212, y0: 190, x1: 5330, y1: 456, color: '#ffab91', awn: '#b8401c' },
    { x0: 5910, y0: 150, x1: 6040, y1: 456, color: '#c5e1a5', awn: '#2f9e44', sign: 'CINEMA' },
    { x0: 6052, y0: 180, x1: 6190, y1: 456, color: '#f8bbd0', awn: '#c45c7a', sign: 'FLOWERS' },
    // lower row (facing Harbour Street)
    { x0: 4610, y0: 600, x1: 4750, y1: 876, color: '#ffe082', awn: '#e4572e' },
    { x0: 4762, y0: 640, x1: 4890, y1: 876, color: '#b0bec5', awn: '#607d8b', sign: 'POST' },
    { x0: 5140, y0: 610, x1: 5330, y1: 876, color: '#ce93d8', awn: '#8e5bd1', sign: 'SCHOOL' },
    { x0: 5470, y0: 620, x1: 5620, y1: 876, color: '#ffcc80', awn: '#b8401c', sign: 'CAFE' },
    { x0: 5632, y0: 590, x1: 5770, y1: 876, color: '#81d4fa', awn: '#2d5a8a', tower: true },
    { x0: 5910, y0: 650, x1: 6060, y1: 876, color: '#ef9a9a', awn: '#c62828', sign: 'FIRE DEPT' },
    { x0: 6072, y0: 600, x1: 6190, y1: 876, color: '#aed581', awn: '#2f9e44' },
  ],
  SQUARE: { x0: 5464, y0: 144, x1: 5776, y1: 456 },
  FOUNTAIN: { x: 5620, y: 340 },
  STATUE: { x: 5620, y: 222 },
  TREES: [
    { x: 5490, y: 180, s: 0.9 }, { x: 5750, y: 180, s: 0.9 }, { x: 5490, y: 430, s: 1 }, { x: 5750, y: 430, s: 1 },
    { x: 4660, y: 1070, s: 1 }, { x: 4840, y: 1060, s: 0.9 }, { x: 5100, y: 1075, s: 1.05 }, { x: 5300, y: 1060, s: 0.9 },
    { x: 5560, y: 1070, s: 1 }, { x: 5720, y: 1060, s: 0.9 }, { x: 5980, y: 1075, s: 1 }, { x: 6140, y: 1060, s: 0.9 },
    { x: 5080, y: 640, s: 0.85 },
  ],
  STOP: { x: 5200, y: 60 },           // the bus home waits here, north lane of Bus Street
  SHELTER: { x: 5100, y: 2 },         // on the wide north sidewalk, west of where the bus door stops
  ARRIVE: { x: 5200, y: 28 },         // where you step off
  TAXI: { x: 5500, y: 470 },          // parked by the square
  TAXI_LOOP: [{ x: 4980, y: 102 }, { x: 5820, y: 102 }, { x: 5820, y: 922 }, { x: 4980, y: 922 }],
  SUBWAY: { x: 5090, y: 580 },
  HOTDOG: { x: 5720, y: 132 },
  BALLOONS: { x: 5746, y: 466 },
  MUSICIAN: { x: 5700, y: 410 },
  CAT: { x: 4700, y: 436 },
  LAMPS: [[4900, 140], [5020, 460], [5340, 140], [5460, 580], [5780, 460], [5900, 140], [4900, 580], [5340, 1000], [5780, 1000], [5900, 580]],
  BENCHES: [[5530, 300], [5710, 300], [5620, 420], [4700, 1030], [5900, 1030], [5240, 30]],
  HYDRANTS: [[4910, 470], [5450, 890], [5790, 30]],
  // the bus in the pizza town: timetable, where it stops, where you land when you come home
  BUS: { first: [40, 70], every: [90, 150], dwell: 15, speed: 320, len: 150 },
  TOWN_STOP: { x: 500, y: 36 },           // north lane, the bus faces west
  TOWN_ARRIVE: { x: 500, y: -30 },
  RIDE: 7,
  // the Pizza Tower: walk in through the lobby door and ride the elevator. Each floor is one wide room,
  // drawn over the city (the room sits at the top of the map; the player is teleported into it)
  TOWER: {
    door: { x: 5115, y: 472 },
    ROOM: { x0: 4960, y0: -165, x1: 5400, y1: 0 },
    wall: 44, floors: 6,
    names: ['', 'Lobby', 'Pizza Party Office', 'Gym', 'Aquarium', 'Dentist', 'Rooftop Garden'],
  },
  coins: [{ x: 5560, y: 390 }, { x: 4760, y: 132 }, { x: 6040, y: 992 }, { x: 5200, y: 572 }, { x: 4700, y: 1050 }, { x: 5620, y: 1050 }],
};
CFG.AREAS.city = { WORLD: CFG.CITY.WORLD };
CFG.VEHICLES.taxi = { speed: 380, radius: 22, label: '🚕 Drive', exit: '🚶 Get out' };
CFG.COINS.push(...CFG.CITY.coins);

const CityExt = {
  name: 'city',
  st: null,
  floor: null,   // which floor of the Pizza Tower the chef is on (null = outside)

  // ---------- small helpers ----------
  hash(i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); },
  shade(hex, f) { const n = parseInt(hex.slice(1), 16); const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; },
  nearTownStop(g) { const p = g.player, S = CFG.CITY.TOWN_STOP; return !g.driving && !g.onTrain && !g.ride && !g.fishing && p.x > S.x - 80 && p.x < S.x + 80 && p.y > -100 && p.y < 16; },
  nearCityStop(g) { const p = g.player, S = CFG.CITY.STOP; return !g.driving && !g.onTrain && !this.floor && U.dist(p.x, p.y, S.x, S.y) < 95; },
  nearTowerDoor(g) { const p = g.player, D = CFG.CITY.TOWER.door; return !g.driving && !g.onTrain && !this.floor && U.dist(p.x, p.y, D.x, D.y) < 36; },
  liftSpot() { const R = CFG.CITY.TOWER.ROOM; return { x: (R.x0 + R.x1) / 2, y: R.y0 + 62 }; },
  upPad() { const R = CFG.CITY.TOWER.ROOM; return { x: (R.x0 + R.x1) / 2 - 48, y: R.y0 + 92 }; },
  downPad() { const R = CFG.CITY.TOWER.ROOM; return { x: (R.x0 + R.x1) / 2 + 48, y: R.y0 + 92 }; },
  exitSpot() { const R = CFG.CITY.TOWER.ROOM; return { x: (R.x0 + R.x1) / 2, y: R.y1 - 22 }; },
  telescope() { const R = CFG.CITY.TOWER.ROOM; return { x: R.x1 - 70, y: R.y0 + 110 }; },
  busDoor(bus) { return { x: bus.x - 44, y: bus.y - 28 }; },   // westbound: the front door is on the sidewalk side near the nose

  // ---------- game hooks ----------
  build(g) {
    const C = CFG.CITY;
    const look = () => ({ shirt: U.pick(COLORS.shirts), skin: U.pick(COLORS.skins), hair: U.pick(['#2b1d14', '#5a3a1a', '#d9a066', '#1a1a1a', '#8c3b2f']), hairStyle: U.randInt(0, 3), stripes: Math.random() < 0.3, hat: Math.random() < 0.25 ? 'cap' : undefined, capColor: U.pick(['#e4572e', '#3b7dd8', '#2f9e44']), carry: 0 });
    // sidewalk lines the pedestrians stroll along
    const lines = [];
    for (const y of [28, 132, 468, 572, 888, 992]) lines.push({ h: true, y, a: 4620, b: 6180 });
    for (const x of [4908, 5012, 5348, 5452, 5788, 5892]) lines.push({ h: false, x, a: -150, b: 1080 });
    const peds = [];
    for (let i = 0; i < 10; i++) {
      const ln = lines[i % lines.length], t = U.rand(ln.a + 40, ln.b - 40);
      peds.push(Object.assign({ ln, dir: Math.random() < 0.5 ? -1 : 1, x: ln.h ? t : ln.x, y: ln.h ? ln.y : t, speed: U.rand(50, 85), pause: 0, moving: true, facing: 1, bob: Math.random() * 6 }, look()));
    }
    const taxis = [];
    for (let i = 0; i < 3; i++) { const a = C.TAXI_LOOP[i], b = C.TAXI_LOOP[(i + 1) % 4]; taxis.push({ x: U.lerp(a.x, b.x, 0.5), y: U.lerp(a.y, b.y, 0.5), angle: Math.atan2(b.y - a.y, b.x - a.x), wp: (i + 1) % 4, speed: U.rand(200, 240) }); }
    const pigeons = [];
    for (let i = 0; i < 7; i++) pigeons.push({ x: U.rand(C.SQUARE.x0 + 40, C.SQUARE.x1 - 40), y: U.rand(C.SQUARE.y0 + 50, C.SQUARE.y1 - 40), tx: 0, ty: 0, state: 'walk', t: U.rand(0, 2), facing: 1, lift: 0, flap: Math.random() * 6 });
    this.st = {
      bus: { x: CFG.WORLD.x1 + 200, y: C.TOWN_STOP.y, angle: Math.PI, state: 'away', timer: U.rand(C.BUS.first[0], C.BUS.first[1]), speed: 0, dwell: 0, honk: 0 },
      cityBus: { x: C.STOP.x, y: C.STOP.y, angle: Math.PI, state: 'stopped' },
      taxi: { kind: 'taxi', x: C.TAXI.x, y: C.TAXI.y, angle: 0, vx: 0, vy: 0 },
      taxis, peds, pigeons, boarding: null, taxiDriven: false, scattered: 0, notes: [],
      lift: null, floorT: 0, seenTower: false, seenView: false, roofPigeons: [{ x: 60, y: 80 }, { x: 120, y: 95 }, { x: 330, y: 70 }].map((q) => ({ x: q.x, y: q.y, lift: 0, state: 'walk', facing: 1, flap: 0, t: 0 })),
    };
    this.floor = null;
    // a save made inside the Pizza Tower reloads onto the room's spot: put the chef back in the lobby
    const R = C.TOWER.ROOM, p = g.player;
    if (g.area === 'city' && p.x > R.x0 - 20 && p.x < R.x1 + 20 && p.y > R.y0 - 20 && p.y < R.y1 + 20) { this.floor = 1; this.st.seenTower = true; const e = this.exitSpot(); p.x = e.x; p.y = e.y - 10; }
  },

  update(g, dt) {
    const st = this.st, C = CFG.CITY;
    if (!st) return;
    this.updateTownBus(g, dt);
    // climbing aboard: the chef stands at the door for a moment, then the ride begins
    if (st.boarding) {
      const b = st.boarding, bus = b.to === 'city' ? st.bus : st.cityBus, door = this.busDoor(bus);
      g.player.x = door.x; g.player.y = door.y; g.player.moving = false; g.player.facing = 1;
      b.t += dt;
      if (b.t >= 0.9) {
        st.boarding = null;
        g.startTravel(b.to, 'bus', C.RIDE);
        if (b.to === 'city') { st.bus.state = 'leaving'; st.bus.speed = 0; }
      }
    }
    // keep the chef put while the ride plays (the core still reads the joystick)
    if (g.travel && g.travel.via === 'bus') { const S = g.travel.from === 'town' ? C.TOWN_ARRIVE : C.ARRIVE; g.player.x = S.x; g.player.y = S.y; g.player.moving = false; }
    if (g.area !== 'city') return;
    if (g.driving && g.vehicle === st.taxi) st.taxiDriven = true;
    if (this.floor) this.updateTower(g, dt);
    // pedestrians stroll up and down their sidewalk, pausing now and then
    for (const p of st.peds) {
      if (p.pause > 0) { p.pause -= dt; p.moving = false; continue; }
      if (Math.random() < dt * 0.08) { p.pause = U.rand(1, 3); continue; }
      p.moving = true; p.bob += dt * 10;
      const ln = p.ln, step = p.speed * dt * p.dir;
      if (ln.h) { p.x += step; p.facing = p.dir; if (p.x < ln.a || p.x > ln.b) { p.dir *= -1; p.x = U.clamp(p.x, ln.a, ln.b); } }
      else { p.y += step; if (p.y < ln.a || p.y > ln.b) { p.dir *= -1; p.y = U.clamp(p.y, ln.a, ln.b); } }
    }
    // taxis loop around the blocks
    for (const t of st.taxis) {
      const wp = C.TAXI_LOOP[t.wp];
      const ang = Math.atan2(wp.y - t.y, wp.x - t.x);
      let d = ang - t.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; t.angle += d * Math.min(1, dt * 6);
      if (U.moveToward(t, wp.x, wp.y, t.speed, dt)) t.wp = (t.wp + 1) % C.TAXI_LOOP.length;
    }
    // pigeons peck about the square and scatter when you come close
    const p = g.player;
    for (const b of st.pigeons) {
      b.t -= dt; b.flap += dt * 24;
      const d = U.dist(b.x, b.y, p.x, p.y);
      if (b.state !== 'fly' && d < 75) {
        b.state = 'fly'; b.t = U.rand(1.4, 2.2);
        const a = Math.atan2(b.y - p.y, b.x - p.x) + U.rand(-0.6, 0.6);
        b.tx = U.clamp(b.x + Math.cos(a) * U.rand(140, 220), C.SQUARE.x0 + 20, C.SQUARE.x1 - 20); b.ty = U.clamp(b.y + Math.sin(a) * U.rand(140, 220), C.SQUARE.y0 + 30, C.SQUARE.y1 - 20);
        if (st.scattered <= 0) { g.floats.push({ x: b.x, y: b.y - 30, text: 'Flap flap!', color: '#ffe08a', t: 0, dur: 1.1 }); st.scattered = 2.5; }
      }
      if (b.state === 'fly') {
        b.lift = Math.min(40, b.lift + dt * 90);
        if (U.moveToward(b, b.tx, b.ty, 230, dt) || b.t <= 0) { b.state = 'land'; b.t = 0.5; }
      } else if (b.state === 'land') {
        b.lift = Math.max(0, b.lift - dt * 110);
        if (b.lift === 0) { b.state = 'walk'; b.t = U.rand(0.5, 2); }
      } else {
        if (b.t <= 0) { b.tx = U.clamp(b.x + U.rand(-50, 50), C.SQUARE.x0 + 20, C.SQUARE.x1 - 20); b.ty = U.clamp(b.y + U.rand(-30, 30), C.SQUARE.y0 + 30, C.SQUARE.y1 - 20); b.t = U.rand(1.5, 4); b.state = 'walk'; }
        if (b.state === 'walk' && !U.moveToward(b, b.tx, b.ty, 28, dt)) b.facing = b.tx < b.x ? -1 : 1;
      }
    }
    st.scattered -= dt;
    // the musician's notes
    if (Math.random() < dt * 1.6) st.notes.push({ x: C.MUSICIAN.x + U.rand(-10, 10), y: C.MUSICIAN.y - 40, t: 0, ch: U.pick(['♪', '♫', '♩']) });
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 2);
  },

  updateTownBus(g, dt) {
    const st = this.st, b = st.bus, B = CFG.CITY.BUS, S = CFG.CITY.TOWN_STOP, home = g.area === 'town' && !g.onTrain;
    b.honk = Math.max(0, b.honk - dt);
    if (b.state === 'away') {
      b.timer -= dt;
      if (b.timer <= 0) { b.state = 'arriving'; b.x = CFG.WORLD.x1 + 200; b.y = S.y; b.speed = B.speed; }
    } else if (b.state === 'arriving') {
      const d = b.x - S.x;
      b.speed = U.clamp(d * 1.6, 40, B.speed); b.x -= b.speed * dt;
      if (d <= 2) {
        b.x = S.x; b.state = 'stopped'; b.dwell = B.dwell; b.honk = 1.2;
        if (home) { g.toast('🚌 The bus is here!', true); Sfx.ding(); }
      }
    } else if (b.state === 'stopped') {
      if (!(st.boarding && st.boarding.to === 'city')) b.dwell -= dt;   // the driver waits for someone climbing on
      if (b.dwell <= 0 && !st.boarding) { b.state = 'leaving'; b.speed = 0; }
    } else if (b.state === 'leaving') {
      b.speed = Math.min(B.speed, b.speed + 200 * dt); b.x -= b.speed * dt;
      if (b.x < CFG.WORLD.x0 - 250) { b.state = 'away'; b.timer = U.rand(B.every[0], B.every[1]); }
    }
  },

  obstacles(g, forCar) {
    const C = CFG.CITY, o = [];
    if (this.floor && !forCar) return this.roomObstacles();
    for (const b of C.BUILDINGS) o.push({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    const F = C.FOUNTAIN; o.push({ x: F.x - 54, y: F.y - 26, w: 108, h: 54 });
    const T = C.STATUE; o.push({ x: T.x - 22, y: T.y - 14, w: 44, h: 30 });
    const H = C.HOTDOG; o.push({ x: H.x - 22, y: H.y - 14, w: 44, h: 26 });
    const SB = C.SUBWAY; o.push({ x: SB.x - 32, y: SB.y - 16, w: 64, h: 40 });
    const BL = C.BALLOONS; o.push({ x: BL.x - 12, y: BL.y - 10, w: 24, h: 20 });
    return o;
  },
  vehicles(g) { return this.st ? [this.st.taxi] : []; },

  action(g) {
    const st = this.st;
    if (!st || st.boarding || g.driving || g.onTrain || g.travel || g.fishing || g.ride) return null;
    if (g.area === 'town' && st.bus.state === 'stopped' && this.nearTownStop(g)) return { label: '🚌 Ride the bus', run: (gg) => this.board(gg, 'city') };
    if (g.area === 'city' && this.nearCityStop(g)) return { label: '🚌 Ride the bus home', run: (gg) => this.board(gg, 'town') };
    if (g.area === 'city' && this.nearTowerDoor(g)) return { label: '🛗 Ride the elevator', run: (gg) => this.enterTower(gg) };
    if (g.area === 'city' && this.floor) return this.towerAction(g);
    return null;
  },
  board(g, to) {
    this.st.boarding = { to, t: 0 };
    g.player.moving = false; g.player.hasMoved = true;
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: 'Ding ding!', color: '#ffe08a', t: 0, dur: 1, big: true });
    Sfx.ding(); Haptics.tap();
  },

  arrive(g, tr) {
    if (tr.via !== 'bus') return;
    const C = CFG.CITY, p = g.player;
    if (tr.to === 'city') {
      p.x = C.ARRIVE.x; p.y = C.ARRIVE.y;
      g.toast('🏙️ Welcome to the City!', true);
    } else {
      p.x = C.TOWN_ARRIVE.x; p.y = C.TOWN_ARRIVE.y;
      // the bus that brought you home pulls away down Main Street
      const b = this.st.bus; b.x = C.TOWN_STOP.x; b.y = C.TOWN_STOP.y; b.state = 'leaving'; b.speed = 0;
      g.toast('🍕 Home sweet home!', true);
    }
    p.moving = false; p.hasMoved = true; p.facing = 1;
    Sfx.ding();
  },

  hint(g) {
    const st = this.st, C = CFG.CITY, p = g.player;
    if (!st) return undefined;
    if (st.boarding) return { text: '🚌 All aboard!', target: null };
    if (g.area === 'town') {
      const b = st.bus, S = C.TOWN_STOP;
      if (b.state !== 'stopped' || g.driving || g.onTrain || U.dist(p.x, p.y, S.x, S.y) > 500) return undefined;
      if (this.nearTownStop(g)) return { text: 'Hop on the bus to the City! 🏙️', target: null };
      return { text: `🚌 Bus leaves in ${Math.ceil(b.dwell)}s!`, target: { x: S.x, y: S.y - 40 } };
    }
    if (g.area !== 'city') return undefined;
    if (this.floor) return this.towerHint(g);
    const coin = g.coins.filter((c) => !c.taken && c.x >= C.WORLD.x0).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
    if (g.driving) return coin && U.dist(p.x, p.y, coin.x, coin.y) < 500 ? { text: 'Drive over the shiny coin!', target: coin } : { text: 'Honk honk! Drive around the City', target: null };
    if (this.nearCityStop(g)) return { text: 'Hop on the bus to go home 🍕', target: null };
    if (coin && U.dist(p.x, p.y, coin.x, coin.y) < 420) return { text: 'Grab the shiny coin!', target: coin };
    if (this.nearTowerDoor(g)) return { text: 'Press the button to ride the elevator! 🛗', target: null };
    if (!st.taxiDriven) return { text: 'Hop in the taxi!', target: st.taxi };
    if (!st.seenTower) return { text: 'Visit the Pizza Tower! 🛗', target: C.TOWER.door };
    const sq = C.SQUARE, inSquare = p.x > sq.x0 && p.x < sq.x1 && p.y > sq.y0 && p.y < sq.y1;
    if (!inSquare && st.pigeons.some((b) => b.state === 'walk') && U.dist(p.x, p.y, C.FOUNTAIN.x, C.FOUNTAIN.y) < 600) return { text: 'Sneak up on the pigeons!', target: C.FOUNTAIN };
    return { text: 'Bus stop to go home 🏠', target: { x: C.STOP.x, y: C.STOP.y - 30 } };
  },

  // ---------- static art ----------
  // a little shelter and bench next to the BUS sign on the far sidewalk of Main Street
  paintTown(r, g) {
    const ctx = r.ctx, S = CFG.CITY.TOWN_STOP;
    const x = S.x - 110, y = -40;   // a little west of the sign post, clear of the bus bubble
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 30, y + 30, 64, 6);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 32, y, 4, 36); ctx.fillRect(x + 28, y, 4, 36);
    ctx.fillStyle = 'rgba(159,224,255,0.55)'; ctx.fillRect(x - 30, y + 2, 60, 10);                  // glass back
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 24, y + 16, 48, 8); ctx.fillStyle = '#4a2d12'; ctx.fillRect(x - 20, y + 24, 4, 8); ctx.fillRect(x + 16, y + 24, 4, 8);   // bench
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - 36, y - 10, 72, 14, 5); ctx.fill();            // roof
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 32, y - 8, 64, 3);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TO THE CITY', x, y - 3);
    // yellow bus bay markings on the road
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.strokeRect(S.x - 90, CFG.ROAD.y1 + 4, 180, 48); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = r.font(10); ctx.fillText('BUS', S.x + 60, CFG.ROAD.y1 + 28);
  },

  paint: {
    city(r, g) {
      const E = CityExt, ctx = r.ctx, C = CFG.CITY, W = C.WORLD;
      // pavement everywhere, with a faint tile grid
      ctx.fillStyle = '#cfc8b8'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
      const walk = (x, y, w, h) => {
        ctx.fillStyle = '#d2cbbb'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 1;
        for (let xx = x; xx <= x + w; xx += 48) { ctx.beginPath(); ctx.moveTo(xx + 0.5, y); ctx.lineTo(xx + 0.5, y + h); ctx.stroke(); }
        for (let yy = y; yy <= y + h; yy += 48) { ctx.beginPath(); ctx.moveTo(x, yy + 0.5); ctx.lineTo(x + w, yy + 0.5); ctx.stroke(); }
      };
      const streets = C.ROADS.filter((rd) => rd.x1 - rd.x0 > rd.y1 - rd.y0), aves = C.ROADS.filter((rd) => rd.x1 - rd.x0 <= rd.y1 - rd.y0);
      for (const rd of streets) { walk(W.x0, rd.y0 - C.WALK, W.x1 - W.x0, C.WALK); walk(W.x0, rd.y1, W.x1 - W.x0, C.WALK); }
      walk(W.x0, 0, W.x1 - W.x0, 40);   // the wide sidewalk by the bus shelter
      for (const rd of aves) { walk(rd.x0 - C.WALK, W.y0, C.WALK, W.y1 - W.y0); walk(rd.x1, W.y0, C.WALK, W.y1 - W.y0); }
      // a green strip along the bottom of town
      ctx.fillStyle = '#79b85e'; ctx.fillRect(W.x0, 1004, W.x1 - W.x0, W.y1 - 1004);
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.ellipse(W.x0 + ((i * 193) % 1600), 1010 + ((i * 101) % 90), 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
      // roads
      for (const rd of C.ROADS) {
        ctx.fillStyle = '#474a50'; ctx.fillRect(rd.x0, rd.y0, rd.x1 - rd.x0, rd.y1 - rd.y0);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 300; i++) ctx.fillRect(rd.x0 + ((i * 97) % (rd.x1 - rd.x0)), rd.y0 + ((i * 53) % (rd.y1 - rd.y0)), 2, 2);
      }
      // curbs
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (const rd of streets) { ctx.fillRect(rd.x0, rd.y0 - 2, rd.x1 - rd.x0, 2); ctx.fillRect(rd.x0, rd.y1, rd.x1 - rd.x0, 2); }
      for (const rd of aves) { ctx.fillRect(rd.x0 - 2, rd.y0, 2, rd.y1 - rd.y0); ctx.fillRect(rd.x1, rd.y0, 2, rd.y1 - rd.y0); }
      for (const rd of aves) { ctx.fillStyle = '#474a50'; for (const s of streets) ctx.fillRect(rd.x0 - 2, s.y0, rd.x1 - rd.x0 + 4, s.y1 - s.y0); }
      // lane lines between the intersections
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([22, 16]);
      for (const s of streets) {
        const y = (s.y0 + s.y1) / 2, xs = [s.x0].concat(aves.flatMap((a) => [a.x0, a.x1]), [s.x1]);
        for (let i = 0; i < xs.length; i += 2) { ctx.beginPath(); ctx.moveTo(xs[i] + 30, y); ctx.lineTo(xs[i + 1] - 30, y); ctx.stroke(); }
      }
      for (const a of aves) {
        const x = (a.x0 + a.x1) / 2, ys = [a.y0].concat(streets.flatMap((s) => [s.y0, s.y1]), [a.y1]);
        for (let i = 0; i < ys.length; i += 2) { ctx.beginPath(); ctx.moveTo(x, ys[i] + 30); ctx.lineTo(x, ys[i + 1] - 30); ctx.stroke(); }
      }
      ctx.setLineDash([]);
      // crosswalks on every side of every intersection; the stripes run with the traffic
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const s of streets) for (const a of aves) {
        for (const cx of [a.x0 - 12, a.x1 + 12]) for (let k = 0; k < 5; k++) ctx.fillRect(cx - 12, s.y0 + 8 + k * 14, 24, 8);
        for (const cy of [s.y0 - 12, s.y1 + 12]) for (let k = 0; k < 5; k++) ctx.fillRect(a.x0 + 8 + k * 14, cy - 12, 8, 24);
      }
      // bus bay by the shelter
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.strokeRect(C.STOP.x - 90, C.ROADS[0].y0 + 4, 180, 48); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BUS', C.STOP.x + 60, C.ROADS[0].y0 + 28);
      E.paintSquare(r, g);
      for (const b of C.BUILDINGS) E.paintBuilding(r, g, b);
      E.paintFurniture(r, g);
    },
  },

  paintBuilding(r, g, b) {
    const ctx = r.ctx, w = b.x1 - b.x0, h = b.y1 - b.y0, roofH = 24, cx = (b.x0 + b.x1) / 2, seed = b.x0 * 7 + b.y0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(b.x0 + 6, b.y0 + 6, w, h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x0, b.y0, w, h);
    // flat roof with gravel, a parapet and a couple of air-con boxes
    ctx.fillStyle = this.shade(b.color, 0.62); ctx.fillRect(b.x0, b.y0, w, roofH);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < w / 4; i++) ctx.fillRect(b.x0 + ((i * 37) % w), b.y0 + 3 + ((i * 11) % (roofH - 6)), 2, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(b.x0, b.y0 + roofH - 3, w, 3);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, b.x0 + 10, b.y0 + 6, 14, 10, 2); ctx.fill(); ctx.fillStyle = '#6b7480'; ctx.fillRect(b.x0 + 13, b.y0 + 8, 8, 2); ctx.fillRect(b.x0 + 13, b.y0 + 12, 8, 2);
    // rows of windows, some lit
    const cols = Math.max(2, Math.floor((w - 16) / 28)), rows = Math.max(1, Math.floor((h - roofH - 52) / 30)), ox = b.x0 + (w - cols * 28) / 2 + 6;
    for (let rI = 0; rI < rows; rI++) for (let c = 0; c < cols; c++) {
      const x = ox + c * 28, y = b.y0 + roofH + 10 + rI * 30, lit = this.hash(seed + rI * 31 + c * 7) < 0.3;
      ctx.fillStyle = lit ? '#fff3b0' : '#9fd8ff'; ctx.fillRect(x, y, 16, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x, y, 16, 2); ctx.fillRect(x + 7, y, 2, 18);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y + 18, 16, 2);
    }
    // ground floor: shop windows, a door with a round knob, a striped awning
    const gy = b.y1 - 40;
    ctx.fillStyle = this.shade(b.color, 0.85); ctx.fillRect(b.x0, gy, w, 40);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(b.x0 + 10, gy + 8, cx - 22 - b.x0, 24); ctx.fillRect(cx + 12, gy + 8, b.x1 - 10 - cx - 12, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(b.x0 + 10, gy + 8, cx - 22 - b.x0, 3); ctx.fillRect(cx + 12, gy + 8, b.x1 - 10 - cx - 12, 3);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(cx - 11, gy + 10, 22, 30); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx + 6, gy + 26, 2, 0, Math.PI * 2); ctx.fill();
    const aw = Math.min(w - 16, 120), stripes = 6, sw = aw / stripes;
    for (let i = 0; i < stripes; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : b.awn; ctx.fillRect(cx - aw / 2 + i * sw, gy - 2, sw + 0.5, 12); ctx.beginPath(); ctx.arc(cx - aw / 2 + i * sw + sw / 2, gy + 10, sw / 2, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(cx - aw / 2, gy + 10, aw, 3);
    if (b.sign) {
      ctx.font = r.font(10); const tw = ctx.measureText(b.sign).width + 18;
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.sign, cx, gy - 13);
    }
    if (b.tower) this.paintWaterTower(r, b.x1 - 34, b.y0 + 12);
    if (b.billboard) this.paintBillboard(r, cx, b.y0 + 2);
    if (b.elevator) { ctx.fillStyle = '#5c6670'; ctx.fillRect(cx - 24, gy + 4, 48, 36); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(cx - 20, gy + 8, 18, 32); ctx.fillRect(cx + 2, gy + 8, 18, 32); ctx.fillStyle = '#ffe08a'; ctx.fillRect(cx - 2, gy + 8, 4, 32); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛗', cx, gy - 32); ctx.fillStyle = '#e4572e'; ctx.fillRect(cx - 40, b.y1, 80, 2); }
    if (b.cat) { const c = CFG.CITY.CAT; ctx.fillStyle = this.shade(b.color, 0.7); ctx.fillRect(c.x - 18, c.y + 2, 36, 5); }   // a window ledge for the cat
  },

  paintWaterTower(r, x, y) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 5, y + 6, 17, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; for (const [dx, dy] of [[-13, 9], [13, 9], [-13, -7], [13, -7]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 1.5, y + dy * 1.5); ctx.stroke(); }
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#a86b36'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2d12'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
  },

  paintBillboard(r, cx, y) {
    const ctx = r.ctx;
    ctx.fillStyle = '#5c5c5c'; ctx.fillRect(cx - 50, y + 6, 5, 14); ctx.fillRect(cx + 45, y + 6, 5, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx - 62, y - 50, 128, 62);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(cx - 66, y - 54, 132, 62);
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 4; ctx.strokeRect(cx - 64, y - 52, 128, 58);
    r.drawPizza(cx - 38, y - 23, 20);
    ctx.fillStyle = '#b8401c'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('NAPLES STREET', cx + 14, y - 36); ctx.fillText('PIZZA', cx + 14, y - 22);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.fillText('best in town!', cx + 14, y - 8);
  },

  paintSquare(r, g) {
    const ctx = r.ctx, C = CFG.CITY, S = C.SQUARE, F = C.FOUNTAIN, T = C.STATUE;
    ctx.fillStyle = '#79b85e'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 80; i++) { ctx.beginPath(); ctx.ellipse(S.x0 + ((i * 193) % (S.x1 - S.x0)), S.y0 + ((i * 101) % (S.y1 - S.y0)), 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 3; ctx.strokeRect(S.x0 + 1.5, S.y0 + 1.5, S.x1 - S.x0 - 3, S.y1 - S.y0 - 3);   // hedge border
    // paths in a cross
    ctx.fillStyle = '#d9b382'; ctx.fillRect(F.x - 16, S.y0, 32, S.y1 - S.y0); ctx.fillRect(S.x0, F.y - 16, S.x1 - S.x0, 32);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 60; i++) { ctx.fillRect(F.x - 14 + ((i * 29) % 28), S.y0 + ((i * 53) % (S.y1 - S.y0)), 3, 2); ctx.fillRect(S.x0 + ((i * 97) % (S.x1 - S.x0)), F.y - 14 + ((i * 31) % 28), 3, 2); }
    // fountain basin
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(F.x + 2, F.y + 6, 54, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 54, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cc2ec'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 44, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9d968a'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 6, 13, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(F.x - 4, F.y - 30, 8, 24);
    // statue of the pizza chef on a plinth
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(T.x - 18, T.y - 8, 40, 24);
    ctx.fillStyle = '#b9b2a4'; ctx.fillRect(T.x - 22, T.y - 12, 44, 26); ctx.fillStyle = '#d2cbbb'; ctx.fillRect(T.x - 22, T.y - 12, 44, 5);
    ctx.save(); ctx.translate(0, -6); r.drawPerson(T.x, T.y - 6, { shirt: '#9aa0a8', apron: '#8a9096', skin: '#b0b6bd', hat: 'chef', pants: '#7c838b', facing: 1 }); ctx.restore();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x - 28, T.y + 16, 56, 14, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OUR PIZZA HERO', T.x, T.y + 23);
    // flower beds in the corners
    const bed = (x, y) => {
      ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(x, y, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
      const cols = ['#ff8fab', '#ffd166', '#fff', '#ff6b6b', '#9ad0ff'];
      for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x - 26 + i * 6.5, y + Math.sin(i * 1.7) * 7, 3, 0, Math.PI * 2); ctx.fill(); }
    };
    bed(S.x0 + 70, S.y0 + 80); bed(S.x1 - 70, S.y0 + 80); bed(S.x0 + 70, S.y1 - 60); bed(S.x1 - 70, S.y1 - 60);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, F.x - 52, S.y0 + 2, 104, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.fillText('🌳 PIZZA SQUARE', F.x, S.y0 + 11);
  },

  paintFurniture(r, g) {
    const ctx = r.ctx, C = CFG.CITY;
    // benches
    for (const [x, y] of C.BENCHES) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 24, y + 6, 50, 6);
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 26, y - 4, 52, 10); ctx.fillRect(x - 26, y - 16, 52, 7);
      ctx.fillStyle = '#4a2d12'; ctx.fillRect(x - 22, y + 6, 5, 8); ctx.fillRect(x + 17, y + 6, 5, 8);
    }
    // tree trunks + shadows
    for (const t of C.TREES) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(t.x + 4, t.y + 6, 30 * t.s, 12 * t.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, t.x - 7 * t.s, t.y - 30 * t.s, 14 * t.s, 36 * t.s, 4); ctx.fill();
    }
    // lamp posts and traffic light poles (the lamps blink live)
    for (const [x, y] of C.LAMPS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 2, y - 60, 4, 60); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 62, 7, 0, Math.PI * 2); ctx.fill();
    }
    for (const [x, y] of this.lightPoles()) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 2, y - 44, 4, 44); }
    // fire hydrants
    for (const [x, y] of C.HYDRANTS) { ctx.fillStyle = '#e53935'; U.roundRect(ctx, x - 5, y - 18, 10, 18, 3); ctx.fill(); ctx.fillRect(x - 8, y - 12, 16, 4); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y - 18, 4, 0, Math.PI * 2); ctx.fill(); }
    // bus shelter: glass back, roof, bench, sign
    const S = C.SHELTER, x = S.x, y = S.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 38, y + 30, 80, 6);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 40, y, 4, 34); ctx.fillRect(x + 36, y, 4, 34);
    ctx.fillStyle = 'rgba(159,224,255,0.55)'; ctx.fillRect(x - 38, y + 2, 76, 10);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 30, y + 14, 60, 8); ctx.fillStyle = '#4a2d12'; ctx.fillRect(x - 26, y + 22, 4, 8); ctx.fillRect(x + 22, y + 22, 4, 8);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - 44, y - 12, 88, 16, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 40, y - 10, 80, 3);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚌 BUS HOME', x, y - 4);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x + 60, y - 10, 4, 44); ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x + 48, y - 24, 28, 18, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('BUS', x + 62, y - 15);
    // subway entrance: steps going down between two railings, a round sign on a post
    const SB = C.SUBWAY;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(SB.x - 26, SB.y - 12, 56, 40);
    for (let k = 0; k < 6; k++) { const f = 1 - k / 6; ctx.fillStyle = `rgb(${Math.round(60 + 110 * f)},${Math.round(70 + 110 * f)},${Math.round(84 + 100 * f)})`; ctx.fillRect(SB.x - 24, SB.y - 14 + k * 6, 48, 6); }
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(SB.x - 24, SB.y + 22, 48, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(SB.x - 30, SB.y - 16, 6, 42); ctx.fillRect(SB.x + 24, SB.y - 16, 6, 42);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(SB.x - 36, SB.y - 26, 4, 24); ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(SB.x - 34, SB.y - 32, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.fillText('M', SB.x - 34, SB.y - 31);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, SB.x - 28, SB.y - 30, 56, 12, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('SUBWAY', SB.x, SB.y - 24);
    // hot dog cart with a striped umbrella
    const H = C.HOTDOG;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(H.x + 2, H.y + 10, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(H.x - 14, H.y + 8, 5, 0, Math.PI * 2); ctx.arc(H.x + 14, H.y + 8, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; U.roundRect(ctx, H.x - 22, H.y - 12, 44, 22, 4); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.fillRect(H.x - 22, H.y - 4, 44, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(H.x - 16, H.y - 10, 20, 8); ctx.fillStyle = '#ffd166'; ctx.fillRect(H.x - 14, H.y - 8, 16, 4);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(H.x + 14, H.y - 40, 3, 30);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e53935'; ctx.beginPath(); ctx.moveTo(H.x + 15, H.y - 40); ctx.arc(H.x + 15, H.y - 40, 26, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, H.x - 26, H.y + 12, 52, 12, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🌭 HOT DOGS', H.x, H.y + 18);
    // balloon cart
    const BL = C.BALLOONS;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(BL.x + 2, BL.y + 10, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(BL.x - 8, BL.y + 8, 4, 0, Math.PI * 2); ctx.arc(BL.x + 8, BL.y + 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, BL.x - 14, BL.y - 8, 28, 18, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.fillText('BALLOONS', BL.x, BL.y + 1);
    // the green strip: a few flower beds and a kiosk
    const bed = (x, y) => {
      ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(x, y, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
      const cols = ['#ff8fab', '#ffd166', '#fff', '#ff6b6b', '#9ad0ff'];
      for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x - 26 + i * 6.5, y + Math.sin(i * 1.7) * 7, 3, 0, Math.PI * 2); ctx.fill(); }
    };
    bed(4760, 1070); bed(5200, 1070); bed(5640, 1070); bed(6060, 1070);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 5340, 1082, 120, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.fillText('🌼 RIVERSIDE GARDENS', 5400, 1089);
  },

  lightPoles() { const C = CFG.CITY, out = []; for (const s of C.ROADS.slice(0, 3)) for (const a of C.ROADS.slice(3)) out.push([a.x1 + 10, s.y0 - 8]); return out; },

  // ---------- live art ----------
  dynamic(r, g) {
    const st = this.st; if (!st || g.area !== 'city' || this.floor) return;
    const ctx = r.ctx, C = CFG.CITY, t = g.time;
    // fountain water
    const F = C.FOUNTAIN;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let k = 0; k < 10; k++) { const ph = (t * 0.9 + k * 0.1) % 1, a = (k / 10) * Math.PI * 2, rr = ph * 32, h = Math.sin(ph * Math.PI) * 26; ctx.beginPath(); ctx.arc(F.x + Math.cos(a) * rr, F.y - 28 - h + ph * 24, 2.5, 0, Math.PI * 2); ctx.fill(); }
    // traffic lights: streets and avenues take turns; the walk sign blinks
    const ph = t % 9, street = ph < 4 ? 'g' : ph < 5 ? 'y' : 'r';
    for (const [x, y] of this.lightPoles()) {
      ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, x - 6, y - 60, 12, 30, 3); ctx.fill();
      const cols = [['#ff3b3b', street === 'r'], ['#ffd166', street === 'y'], ['#44d36a', street === 'g']];
      cols.forEach(([c, on], i) => { ctx.fillStyle = on ? c : 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(x, y - 53 + i * 9, 3.2, 0, Math.PI * 2); ctx.fill(); });
      const walk = street === 'r' ? '#fff' : (Math.floor(t * 3) % 2 ? '#ff7a1a' : 'rgba(255,255,255,0.15)');
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x + 7, y - 44, 9, 9); ctx.fillStyle = walk; ctx.fillRect(x + 9, y - 42, 5, 5);
    }
    // chasing bulbs around the pizza billboard
    const bb = C.BUILDINGS.find((b) => b.billboard); if (bb) { const cx = (bb.x0 + bb.x1) / 2, y = bb.y0 + 2, on = Math.floor(t * 6) % 3; let i = 0; for (let x = cx - 60; x <= cx + 60; x += 12, i++) { ctx.fillStyle = (i % 3) === on ? '#ffe08a' : 'rgba(255,224,138,0.35)'; ctx.beginPath(); ctx.arc(x, y - 54, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + 6, 2.5, 0, Math.PI * 2); ctx.fill(); } }
    // steam from the hot dog cart
    const H = C.HOTDOG; for (let i = 0; i < 3; i++) { const age = ((t * 0.8 + i * 0.33) % 1); ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - age)})`; ctx.beginPath(); ctx.arc(H.x - 6 + i * 6 + Math.sin(age * 6 + i) * 3, H.y - 14 - age * 26, 3 + age * 4, 0, Math.PI * 2); ctx.fill(); }
    // the cat on its windowsill, tail swishing
    const cat = C.CAT, sw = Math.sin(t * 2.2) * 8;
    ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cat.x + 8, cat.y); ctx.quadraticCurveTo(cat.x + 18, cat.y - 2 + sw, cat.x + 16, cat.y - 12 + sw); ctx.stroke();
    ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.ellipse(cat.x, cat.y - 4, 11, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cat.x - 8, cat.y - 12, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cat.x - 13, cat.y - 15); ctx.lineTo(cat.x - 12, cat.y - 22); ctx.lineTo(cat.x - 8, cat.y - 17); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(cat.x - 4, cat.y - 17); ctx.lineTo(cat.x - 3, cat.y - 22); ctx.lineTo(cat.x - 7, cat.y - 17); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; const blink = (t % 4) > 3.8; ctx.fillRect(cat.x - 11, cat.y - 13, 2, blink ? 1 : 2); ctx.fillRect(cat.x - 7, cat.y - 13, 2, blink ? 1 : 2); ctx.fillStyle = '#ff8fab'; ctx.fillRect(cat.x - 9, cat.y - 10, 2, 1.5);
    // pigeons
    for (const b of st.pigeons) {
      const y = b.y - b.lift, f = b.facing;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 7 - b.lift * 0.08, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(b.x, y - 4, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b7480'; ctx.beginPath(); ctx.arc(b.x + f * 6, y - 7, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(b.x + f * 8, y - 8, f * 3, 2);
      if (b.lift > 0) { const w = Math.sin(b.flap) * 7; ctx.fillStyle = '#b8c0cc'; ctx.beginPath(); ctx.moveTo(b.x, y - 5); ctx.lineTo(b.x - 9, y - 9 - w); ctx.lineTo(b.x - 3, y - 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(b.x, y - 5); ctx.lineTo(b.x + 9, y - 9 - w); ctx.lineTo(b.x + 3, y - 2); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = '#b8c0cc'; ctx.beginPath(); ctx.ellipse(b.x - f * 2, y - 5, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c42'; const stepP = b.state === 'walk' ? Math.sin(t * 16) * 1.5 : 0; ctx.fillRect(b.x - 2 + stepP, y - 1, 1.5, 3); ctx.fillRect(b.x + 1 - stepP, y - 1, 1.5, 3); }
    }
  },

  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const C = CFG.CITY;
    if (g.area === 'town') {
      const b = st.bus;
      if (b.state !== 'away') items.push({ y: b.y + 20, draw: () => this.drawBus(r, g, b, b.state === 'stopped' && !st.boarding ? `Leaves in ${Math.ceil(b.dwell)}s` : null) });
      return;
    }
    if (g.area !== 'city' || this.floor) return;
    items.push({ y: st.cityBus.y + 20, draw: () => this.drawBus(r, g, st.cityBus, !st.boarding && !g.driving ? 'Hop on to go home!' : null) });
    items.push({ y: st.taxi.y + 10, draw: () => r.drawSiteVehicle(g, st.taxi, 30) });
    for (const t of st.taxis) items.push({ y: t.y + 10, draw: () => { r.ctx.save(); r.ctx.translate(t.x, t.y); r.ctx.rotate(t.angle); r.drawVehicle('taxi', g, '#ffd60a'); r.ctx.restore(); } });
    for (const p of st.peds) items.push({ y: p.y, draw: () => r.drawPerson(p.x, p.y, p) });
    const M = C.MUSICIAN;
    items.push({ y: M.y, draw: () => {
      const ctx = r.ctx, strum = Math.sin(g.time * 9) * 2;
      r.drawPerson(M.x, M.y, { shirt: '#8e5bd1', skin: '#c68642', hat: 'cap', capColor: '#e4572e', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
      ctx.fillStyle = '#8d5a2b'; ctx.save(); ctx.translate(M.x + 2, M.y - 18); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(6, -2 + strum, 20, 4); ctx.restore();
      ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(M.x + 24, M.y + 4, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(M.x + 22, M.y + 2, 2, 0, Math.PI * 2); ctx.arc(M.x + 27, M.y + 3, 2, 0, Math.PI * 2); ctx.fill();   // hat with coins
    } });
  },

  // things that float above everybody: tree canopies, balloons, music notes
  overlay(r, g) {
    const st = this.st; if (!st || g.area !== 'city') return;
    if (this.floor) { this.drawRoom(r, g); return; }
    const ctx = r.ctx, C = CFG.CITY, t = g.time;
    for (const tr of C.TREES) {
      const sway = Math.sin(t * 1.2 + tr.x) * 2;
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(tr.x + sway, tr.y - 44 * tr.s, 30 * tr.s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tr.x - 18 * tr.s + sway, tr.y - 30 * tr.s, 22 * tr.s, 0, Math.PI * 2); ctx.arc(tr.x + 18 * tr.s + sway, tr.y - 30 * tr.s, 22 * tr.s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(tr.x - 8 * tr.s + sway, tr.y - 52 * tr.s, 14 * tr.s, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // balloons on strings, one of them a pizza
    const BL = C.BALLOONS;
    [['#e4572e', -22, 0], ['#3b7dd8', -8, 1.3], ['#ffd166', 8, 2.1], ['pizza', 24, 0.7]].forEach(([col, dx, phs]) => {
      const bx = BL.x + dx + Math.sin(t * 1.5 + phs) * 4, by = BL.y - 62 - Math.sin(t * 2 + phs) * 5 + Math.abs(dx) * 0.3;
      ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(BL.x, BL.y - 8); ctx.quadraticCurveTo(bx, by + 30, bx, by + 12); ctx.stroke();
      if (col === 'pizza') { ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(bx + 1, by + 1, 13, 0, Math.PI * 2); ctx.fill(); r.drawPizza(bx, by, 12); }
      else { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by, 10, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(bx - 3, by - 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    });
    // music notes drifting up from the musician
    ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of st.notes) { ctx.globalAlpha = 1 - n.t / 2; ctx.fillStyle = '#8e5bd1'; ctx.fillText(n.ch, n.x + Math.sin(n.t * 4) * 6, n.y - n.t * 28); }
    ctx.globalAlpha = 1;
  },

  // ---------- the Pizza Tower: lobby door, elevator, six floors ----------
  enterTower(g) {
    const st = this.st, S = this.exitSpot();
    this.floor = 1; st.lift = null; st.floorT = 0; st.seenTower = true;
    g.player.x = S.x; g.player.y = S.y - 10; g.player.moving = false; g.player.facing = 1; g.player.hasMoved = true; g.cameraSnap = true;
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: 'Welcome to the Pizza Tower!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.ding(); Haptics.tap();
  },
  leaveTower(g) {
    const D = CFG.CITY.TOWER.door;
    this.floor = null; this.st.lift = null;
    g.player.x = D.x; g.player.y = D.y + 6; g.player.moving = false; g.cameraSnap = true;
    Sfx.drop();
  },
  towerAction(g) {
    const st = this.st, p = g.player, T = CFG.CITY.TOWER;
    if (st.lift) return null;
    const up = this.upPad(), down = this.downPad(), ex = this.exitSpot();
    if (this.floor === 1 && U.dist(p.x, p.y, ex.x, ex.y) < 34) return { label: '🚪 Out to the street', run: (gg) => this.leaveTower(gg) };
    if (this.floor < T.floors && U.dist(p.x, p.y, up.x, up.y) < 30) return { label: '🛗 Up a floor', run: (gg) => this.ride(gg, this.floor + 1) };
    if (this.floor > 1 && U.dist(p.x, p.y, down.x, down.y) < 30) return { label: '🛗 Down a floor', run: (gg) => this.ride(gg, this.floor - 1) };
    return null;
  },
  ride(g, to) {
    this.st.lift = { phase: 'closing', t: 0, from: this.floor, to, shown: this.floor };
    g.player.moving = false; Sfx.buy(); Haptics.tap();
  },
  updateTower(g, dt) {
    const st = this.st, L = st.lift, p = g.player, T = CFG.CITY.TOWER;
    st.floorT += dt;
    if (L) {
      const sp = this.liftSpot();
      // slide into the doorway, then the doors close, the counter ticks, ding, the doors open on the new floor
      p.x = U.lerp(p.x, sp.x, Math.min(1, dt * 10)); p.y = U.lerp(p.y, sp.y, Math.min(1, dt * 10)); p.moving = false;
      L.t += dt;
      if (L.phase === 'closing' && L.t >= 0.7) { L.phase = 'moving'; L.t = 0; }
      else if (L.phase === 'moving') {
        const dir = L.to > L.from ? 1 : -1, n = Math.abs(L.to - L.from);
        L.shown = L.from + dir * Math.min(n, Math.floor(L.t / 0.45));
        if (L.t >= n * 0.45 + 0.3) { this.floor = L.to; L.shown = L.to; L.phase = 'opening'; L.t = 0; st.floorT = 0; Sfx.ding(); }
      } else if (L.phase === 'opening' && L.t >= 0.7) {
        st.lift = null; p.x = sp.x; p.y = sp.y;
        g.floats.push({ x: p.x, y: p.y - 64, text: `${this.floor === T.floors ? '🌤️' : '🛗'} ${T.names[this.floor]}!`, color: '#ffe08a', t: 0, dur: 1.5, big: true });
      }
      return;
    }
    // the rooftop view through the telescope
    if (this.floor === T.floors && U.dist(p.x, p.y, this.telescope().x, this.telescope().y) < 50 && !st.seenView) { st.seenView = true; Sfx.unlock(); }
    // rooftop pigeons scatter like the ones on the square
    const R = T.ROOM;
    for (const b of st.roofPigeons) {
      b.t -= dt; b.flap += dt * 24;
      const wx = R.x0 + b.x, wy = R.y0 + b.y, d = U.dist(wx, wy, p.x, p.y);
      if (b.state !== 'fly' && d < 60) { b.state = 'fly'; b.t = 1.2; const a = Math.atan2(wy - p.y, wx - p.x); b.tx = U.clamp(b.x + Math.cos(a) * 160, 30, R.x1 - R.x0 - 30); b.ty = U.clamp(b.y + Math.sin(a) * 60, 60, 150); }
      if (b.state === 'fly') { b.lift = Math.min(36, b.lift + dt * 90); if (U.moveToward(b, b.tx, b.ty, 220, dt) || b.t <= 0) b.state = 'land'; }
      else if (b.state === 'land') { b.lift = Math.max(0, b.lift - dt * 100); if (b.lift === 0) { b.state = 'walk'; b.t = U.rand(1, 3); } }
      else if (b.t <= 0) { b.tx = U.clamp(b.x + U.rand(-40, 40), 30, R.x1 - R.x0 - 30); b.ty = U.clamp(b.y + U.rand(-20, 20), 60, 150); b.t = U.rand(1.5, 4); }
      else if (!U.moveToward(b, b.tx, b.ty, 24, dt)) b.facing = b.tx < b.x ? -1 : 1;
    }
  },
  roomObstacles() {
    const T = CFG.CITY.TOWER, R = T.ROOM, w = R.x1 - R.x0, cx = (R.x0 + R.x1) / 2, o = [];
    o.push({ x: R.x0 - 10, y: R.y0 - 10, w: w + 20, h: T.wall + 10 }, { x: R.x0 - 10, y: R.y0, w: 18, h: R.y1 - R.y0 }, { x: R.x1 - 8, y: R.y0, w: 18, h: R.y1 - R.y0 }, { x: R.x0, y: R.y1 - 8, w: w, h: 18 });
    const f = this.floor;
    if (f === 1) o.push({ x: R.x0 + 40, y: R.y0 + 60, w: 90, h: 26 }, { x: R.x1 - 110, y: R.y0 + 70, w: 70, h: 36 });                // desk, fountain
    else if (f === 2) for (let i = 0; i < 3; i++) o.push({ x: R.x0 + 50 + i * 130, y: R.y0 + 64, w: 70, h: 24 });                  // desks
    else if (f === 3) for (let i = 0; i < 3; i++) o.push({ x: R.x0 + 60 + i * 110, y: R.y0 + 58, w: 56, h: 30 });                   // treadmills
    else if (f === 4) o.push({ x: cx - 40, y: R.y0 + 120, w: 80, h: 14 });                                                           // bench
    else if (f === 5) o.push({ x: R.x0 + 30, y: R.y0 + 60, w: 130, h: 26 }, { x: R.x1 - 100, y: R.y0 + 54, w: 70, h: 30 });          // chairs, reception
    else if (f === 6) { const tl = this.telescope(); o.push({ x: tl.x - 12, y: tl.y - 10, w: 24, h: 18 }); for (let i = 0; i < 3; i++) o.push({ x: R.x0 + 40 + i * 140, y: R.y0 + 60, w: 60, h: 20 }); }
    return o;
  },
  towerHint(g) {
    const st = this.st, p = g.player, T = CFG.CITY.TOWER, f = this.floor, L = st.lift, up = this.upPad(), down = this.downPad();
    if (L) return { text: L.phase === 'moving' ? (L.to > L.from ? '🛗 Going up!' : '🛗 Going down!') : L.phase === 'opening' ? '🛗 Ding! Doors opening' : '🛗 Doors closing…', target: null };
    const goUp = { text: 'Stand on ▲ and go up!', target: up }, goDown = { text: 'Stand on ▼ to go down', target: down };
    const early = st.floorT < 5;
    if (f === 1) return st.seenView ? { text: 'Walk out the door to the street', target: this.exitSpot() } : goUp;
    if (f === 2) return early ? { text: 'Everybody loves the pizza chef! 🍕', target: null } : goUp;
    if (f === 3) return early ? { text: 'Run, run, run! 🏃', target: null } : goUp;
    if (f === 4) return early ? { text: 'Look at all the fish! 🐠', target: null } : goUp;
    if (f === 5) return early ? { text: 'The shark is waiting for the dentist 🦈', target: null } : goUp;
    const tl = this.telescope();
    if (!st.seenView) return { text: 'Look through the telescope! 🔭', target: tl };
    if (U.dist(p.x, p.y, tl.x, tl.y) < 50) return { text: 'You can see the pizza shop from here!', target: null };
    return goDown;
  },

  // the room the chef is in, drawn over the whole view
  drawRoom(r, g) {
    const ctx = r.ctx, st = this.st, T = CFG.CITY.TOWER, R = T.ROOM, w = R.x1 - R.x0, h = R.y1 - R.y0, cx = (R.x0 + R.x1) / 2, f = this.floor, t = g.time, L = st.lift;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(r.camX - 200, r.camY - 200, r.viewW + 400, r.viewH + 400);
    ctx.save(); ctx.beginPath(); ctx.rect(R.x0, R.y0, w, h); ctx.clip();
    this.paintFloor(r, g, f);
    // the elevator on the back wall: frame, dark car, the two sliding doors, a floor counter above
    const open = !L ? 1 : L.phase === 'closing' ? 1 - L.t / 0.7 : L.phase === 'opening' ? Math.min(1, L.t / 0.7) : 0;
    const ex = cx, ey = R.y0 + 2;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(ex - 38, ey, 76, 68);
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(ex - 32, ey + 4, 64, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(ex - 32, ey + 4, 64, 20);
    // the chef inside the car (drawn here so the doors can close over them)
    if (!L || L.phase !== 'moving') r.drawPlayer(g);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(ex - 32, ey + 4, 32 * (1 - open), 60); ctx.fillRect(ex + 32 - 32 * (1 - open), ey + 4, 32 * (1 - open), 60);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; if (open < 1) { ctx.fillRect(ex - 32 + 32 * (1 - open) - 2, ey + 4, 2, 60); ctx.fillRect(ex + 32 - 32 * (1 - open), ey + 4, 2, 60); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, ex - 22, ey - 2, 44, 14, 3); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${L && L.phase === 'moving' ? (L.to > L.from ? '▲ ' : '▼ ') : ''}${L ? L.shown : f}`, ex, ey + 5);
    // call pads on the floor
    const pad = (q, label, on) => { ctx.fillStyle = on ? 'rgba(255,224,138,0.9)' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 26, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = on ? '#2b1d14' : 'rgba(43,29,20,0.5)'; ctx.font = r.font(11); ctx.fillText(label, q.x, q.y); };
    pad(this.upPad(), '▲ UP', f < T.floors); pad(this.downPad(), '▼ DOWN', f > 1);
    if (!L && f === 1) { const e = this.exitSpot(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y, 30, 13, 0, 0, Math.PI * 2); ctx.fill(); }
    // floor name plate on the wall
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, R.x0 + 12, R.y1 - 26, 150, 18, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'left'; ctx.fillText(`Floor ${f} · ${T.names[f]}`, R.x0 + 20, R.y1 - 17);
    ctx.restore();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 6; ctx.strokeRect(R.x0, R.y0, w, h);
  },

  paintFloor(r, g, f) {
    const ctx = r.ctx, st = this.st, T = CFG.CITY.TOWER, R = T.ROOM, w = R.x1 - R.x0, h = R.y1 - R.y0, cx = (R.x0 + R.x1) / 2, t = g.time, wall = T.wall, p = g.player;
    const x0 = R.x0, y0 = R.y0, fy = y0 + wall;   // fy: where the floor starts
    const bubble = (x, y, text, wd) => r.drawBubble(x, y, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, wd);
    const label = (x, y, text, col = '#ffe08a') => { ctx.font = r.font(10); const tw = ctx.measureText(text).width + 16; ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - tw / 2, y - 8, tw, 16, 4); ctx.fill(); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); };
    const near = (x, y, d) => U.dist(p.x, p.y, x, y) < d;
    if (f === 1) {
      ctx.fillStyle = '#d7ccc8'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#bcaaa4'; ctx.fillRect(x0, fy - 6, w, 6);
      for (let yy = fy; yy < R.y1; yy += 24) for (let xx = x0; xx < R.x1; xx += 24) { ctx.fillStyle = ((xx - x0) / 24 + (yy - fy) / 24) % 2 ? '#f3efe3' : '#e0d8cc'; ctx.fillRect(xx, yy, 24, 24); }
      label(x0 + 300, y0 + 20, '🍕 PIZZA TOWER');
      // reception desk + receptionist, a plant, a little fountain, the way out
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x0 + 40, fy + 16, 90, 26, 5); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.fillRect(x0 + 40, fy + 16, 90, 6);
      r.drawPerson(x0 + 85, fy + 14, { shirt: '#3f6fb5', skin: '#e0ac69', hair: '#2b1d14', hairStyle: 1, facing: 1, moving: false, carry: 0 });
      if (near(x0 + 85, fy + 30, 90)) bubble(x0 + 85, fy - 48, 'Welcome, chef!', 100);
      ctx.fillStyle = '#c62828'; U.roundRect(ctx, x0 + 150, fy + 24, 18, 20, 3); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x0 + 159, fy + 12, 14, 0, Math.PI * 2); ctx.arc(x0 + 149, fy + 20, 9, 0, Math.PI * 2); ctx.arc(x0 + 170, fy + 20, 9, 0, Math.PI * 2); ctx.fill();
      const F = { x: R.x1 - 75, y: fy + 44 };
      ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 36, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6cc2ec'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 28, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9d968a'; ctx.fillRect(F.x - 3, F.y - 24, 6, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 8; k++) { const ph = (t * 0.9 + k * 0.125) % 1, a = (k / 8) * Math.PI * 2; ctx.beginPath(); ctx.arc(F.x + Math.cos(a) * ph * 22, F.y - 22 - Math.sin(ph * Math.PI) * 18 + ph * 18, 2.2, 0, Math.PI * 2); ctx.fill(); }
      const e = this.exitSpot(); ctx.fillStyle = '#e4572e'; U.roundRect(ctx, e.x - 44, R.y1 - 22, 88, 16, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪 TO THE STREET', e.x, R.y1 - 14);
    } else if (f === 2) {
      ctx.fillStyle = '#cfe3f7'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#9fa8da'; ctx.fillRect(x0, fy, w, h - wall); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let yy = fy; yy < R.y1; yy += 16) ctx.fillRect(x0, yy, w, 2);
      // party banner and balloons on the wall
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x0 + 262, y0 + 8, 170, 20, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎉 PIZZA PARTY! 🎉', x0 + 347, y0 + 18);
      [['#ffd166', 150], ['#3b7dd8', 168], ['#2f9e44', 30]].forEach(([c, dx], i) => { const by = y0 + 18 + Math.sin(t * 2 + i) * 3; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x0 + dx, by, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + dx, by + 11); ctx.lineTo(x0 + dx + 3, by + 30); ctx.stroke(); });
      // desks with monitors and pizza boxes, coworkers in party hats
      const looks = [['#f28e2b', '#f1c27d', '#2b1d14', 0], ['#59a14f', '#c68642', '#5a3a1a', 2], ['#b07aa1', '#ffdbac', '#d9a066', 1], ['#e15759', '#8d5524', '#1a1a1a', 3]];
      for (let i = 0; i < 3; i++) {
        const dx = x0 + 50 + i * 130, dy = fy + 20;
        ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, dx, dy, 70, 24, 4); ctx.fill(); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(dx + 6, dy - 14, 22, 16); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(dx + 8, dy - 12, 18, 12);
        ctx.fillStyle = '#d9b382'; ctx.fillRect(dx + 36, dy + 2, 28, 18); r.drawPizza(dx + 50, dy + 11, 10);
      }
      const dance = (i) => Math.sin(t * 6 + i) * 3;
      [[x0 + 70, fy + 70], [x0 + 135, fy + 64], [x0 + 300, fy + 72], [x0 + 390, fy + 60]].forEach(([px, py], i) => {
        const [shirt, skin, hair, hs] = looks[i], yy = py + dance(i), fac = p.x < px ? -1 : 1;
        r.drawPerson(px, yy, { shirt, skin, hair, hairStyle: hs, facing: fac, moving: true, bob: t * 8 + i, carry: 0 });
        ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166', '#2f9e44'][i]; ctx.beginPath(); ctx.moveTo(px - 8, yy - 46); ctx.lineTo(px + 8, yy - 46); ctx.lineTo(px, yy - 66); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, yy - 66, 3, 0, Math.PI * 2); ctx.fill();
        r.drawPizza(px + fac * 16, yy - 18, 6);
        if (near(px, py, 80)) bubble(px, yy - 80, ['It’s the pizza chef!!', 'Best pizza ever!', 'Can I get a selfie?', 'Hooray, chef!'][i], 118);
      });
    } else if (f === 3) {
      ctx.fillStyle = '#ffe082'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(x0 + 60, y0 + 6, 200, 32); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0 + 70, y0 + 10, 30, 24);   // mirror
      ctx.fillStyle = '#607d8b'; ctx.fillRect(x0, fy, w, h - wall); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let xx = x0; xx < R.x1; xx += 40) ctx.fillRect(xx, fy, 2, h - wall);
      label(x0 + 392, y0 + 22, '💪 GO GO GO!');
      for (let i = 0; i < 3; i++) {
        const tx = x0 + 60 + i * 110, ty = fy + 14, ph = i * 1.3;
        ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, tx, ty + 20, 56, 12, 4); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(tx + 50, ty - 10, 4, 36); ctx.fillRect(tx + 2, ty - 10, 4, 36); ctx.fillStyle = '#1e1e1e'; ctx.fillRect(tx + 40, ty - 14, 16, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; const belt = (t * 120) % 12; for (let k = -12; k < 56; k += 12) ctx.fillRect(tx + 2 + k + belt, ty + 22, 6, 8);
        r.drawPerson(tx + 28, ty + 16 + Math.abs(Math.sin(t * 7 + ph)) * -4, { shirt: ['#e15759', '#4e79a7', '#59a14f'][i], skin: ['#f1c27d', '#8d5524', '#e0ac69'][i], hair: '#2b1d14', hairStyle: i, facing: 1, moving: true, bob: t * 14 + ph, carry: 0 });
        if (Math.floor(t + i) % 4 === 0) { ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(tx + 42, ty - 20 + ((t * 2) % 1) * 8, 2, 0, Math.PI * 2); ctx.fill(); }
      }
      // dumbbell rack and a water cooler
      ctx.fillStyle = '#5c6670'; ctx.fillRect(R.x1 - 90, fy + 60, 60, 8); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#1e1e1e'; ctx.fillRect(R.x1 - 86 + k * 20, fy + 50, 6, 10); ctx.fillRect(R.x1 - 74 + k * 20, fy + 50, 6, 10); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(R.x1 - 80 + k * 20, fy + 54, 6, 2); }
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, x0 + 14, fy + 20, 18, 26, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + 12, fy + 46, 22, 30);
    } else if (f === 4) {
      // the back wall is one big tank
      const tank = ctx.createLinearGradient(0, y0, 0, fy + 40); tank.addColorStop(0, '#1e5a8a'); tank.addColorStop(1, '#4aa3d8'); ctx.fillStyle = tank; ctx.fillRect(x0, y0, w, wall + 40);
      ctx.fillStyle = '#d9b382'; ctx.fillRect(x0, fy + 30, w, 10);
      ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 4; for (let k = 0; k < 7; k++) { const sx = x0 + 30 + k * 65; ctx.beginPath(); ctx.moveTo(sx, fy + 34); ctx.quadraticCurveTo(sx + Math.sin(t * 1.5 + k) * 10, fy + 10, sx + Math.sin(t * 1.2 + k) * 14, y0 + 20 + (k % 3) * 8); ctx.stroke(); }
      const fish = [['#ff7a1a', 0, 0.7, 14], ['#ffd166', 1.1, 1, 22], ['#f06292', 2.4, 0.5, 40], ['#41b883', 3.6, 0.85, 8], ['#8e5bd1', 4.2, 1.3, 30], ['#3b7dd8', 5.5, 0.6, 50]];
      fish.forEach(([col, ph, sp, dy]) => { const span = w - 60, u = ((t * sp * 40 + ph * 97) % (span * 2)); const fx = x0 + 30 + (u < span ? u : span * 2 - u), dir = u < span ? 1 : -1, fyy = y0 + 16 + dy + Math.sin(t * 2 + ph) * 4; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, fyy, 12, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - dir * 10, fyy); ctx.lineTo(fx - dir * 20, fyy - 7); ctx.lineTo(fx - dir * 20, fyy + 7); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx + dir * 6, fyy - 2, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(fx + dir * 7, fyy - 2, 1.2, 0, Math.PI * 2); ctx.fill(); });
      // a slow turtle along the sand
      const tu = x0 + 60 + ((t * 12) % (w - 120)); ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.ellipse(tu, fy + 24, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(tu + 16, fy + 24, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 6; k++) { const bu = (t * 0.4 + k * 0.17) % 1; ctx.beginPath(); ctx.arc(x0 + 80 + k * 70 + Math.sin(bu * 8) * 4, fy + 30 - bu * (wall + 30), 2 + k % 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0, w, 6); ctx.fillStyle = '#5c6670'; ctx.fillRect(x0, fy + 38, w, 6);   // glass shine + frame
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x0, fy + 44, w, h - wall - 44); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let xx = x0; xx < R.x1; xx += 30) ctx.fillRect(xx, fy + 44, 1, h);
      label(cx + 80, R.y1 - 17, '🐠 AQUARIUM', '#9fd8ff');
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(cx - 40, fy + 76, 80, 10); ctx.fillStyle = '#4a2d12'; ctx.fillRect(cx - 36, fy + 86, 5, 8); ctx.fillRect(cx + 31, fy + 86, 5, 8);
    } else if (f === 5) {
      ctx.fillStyle = '#b8f2c8'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#f3efe3'; ctx.fillRect(x0, fy, w, h - wall); ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let xx = x0; xx < R.x1; xx += 32) for (let yy = fy; yy < R.y1; yy += 32) if (((xx - x0) / 32 + (yy - fy) / 32) % 2) ctx.fillRect(xx, yy, 32, 32);
      label(x0 + 110, y0 + 22, '🦷 DR. MOLAR, DENTIST');
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x0 + 280, y0 + 6, 70, 34, 4); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BRUSH', x0 + 330, y0 + 14); ctx.fillText('TWICE!', x0 + 330, y0 + 24); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x0 + 302, y0 + 24, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x0 + 302, y0 + 24, 8, 0, Math.PI * 2); ctx.stroke();
      // reception window with a nurse
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, R.x1 - 100, fy + 10, 70, 30, 5); ctx.fill(); r.drawPerson(R.x1 - 65, fy + 8, { shirt: '#fff', skin: '#c68642', hair: '#1a1a1a', hairStyle: 2, facing: -1, moving: false, carry: 0 });
      // a row of blue chairs: a kid with a lollipop, and the shark reading a magazine
      for (let i = 0; i < 3; i++) { const sx = x0 + 30 + i * 46; ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, sx, fy + 16, 38, 26, 5); ctx.fill(); ctx.fillStyle = '#2d5a8a'; ctx.fillRect(sx, fy + 34, 38, 8); }
      r.drawPerson(x0 + 49, fy + 30, { shirt: '#ffd166', skin: '#f1c27d', hair: '#d9a066', hairStyle: 2, facing: 1, moving: false, carry: 0 });
      ctx.fillStyle = '#fff'; ctx.fillRect(x0 + 65, fy + 4, 2, 14); ctx.fillStyle = '#f06292'; ctx.beginPath(); ctx.arc(x0 + 66, fy + 2, 6, 0, Math.PI * 2); ctx.fill();
      const sh = { x: x0 + 128, y: fy + 24 + Math.sin(t * 1.5) * 1.5 };
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y - 10, 30, 18, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sh.x - 6, sh.y - 28); ctx.lineTo(sh.x + 4, sh.y - 46); ctx.lineTo(sh.x + 12, sh.y - 26); ctx.closePath(); ctx.fill();   // dorsal fin
      ctx.beginPath(); ctx.moveTo(sh.x - 28, sh.y - 14); ctx.lineTo(sh.x - 44, sh.y - 26); ctx.lineTo(sh.x - 42, sh.y - 2); ctx.closePath(); ctx.fill();     // tail
      ctx.fillStyle = '#e8edf2'; ctx.beginPath(); ctx.ellipse(sh.x + 6, sh.y - 4, 20, 9, -0.2, 0, Math.PI * 2); ctx.fill();   // belly
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sh.x + 14, sh.y - 16, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(sh.x + 15, sh.y - 16, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sh.x + 14, sh.y - 6, 10, 0.1, Math.PI - 0.3); ctx.stroke();   // big smile
      ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(sh.x + 5 + k * 4, sh.y - 3); ctx.lineTo(sh.x + 7 + k * 4, sh.y + 2); ctx.lineTo(sh.x + 9 + k * 4, sh.y - 3); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#fff'; U.roundRect(ctx, sh.x + 18, sh.y - 2, 26, 18, 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; U.roundRect(ctx, sh.x + 18, sh.y - 2, 26, 18, 2); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.font = r.font(6); ctx.fillText('TEETH', sh.x + 31, sh.y + 4); ctx.fillText('WEEKLY', sh.x + 31, sh.y + 11);
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(sh.x + 16, sh.y + 4, 8, 4, 0.6, 0, Math.PI * 2); ctx.fill();   // fin holding the magazine
      if (near(sh.x, sh.y, 90)) bubble(sh.x + 10, y0 + 22, 'Just a check-up! 😁', 126);
      else if (near(x0 + 49, fy + 30, 60)) bubble(x0 + 60, y0 + 22, 'No cavities!', 86);
    } else {
      // rooftop: sky and the skyline, a railing, planters, pigeons and a telescope
      const sky = ctx.createLinearGradient(0, y0, 0, fy + 20); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(1, '#d9f0ff'); ctx.fillStyle = sky; ctx.fillRect(x0, y0, w, wall + 20);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(x0 + 380, y0 + 16, 10, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 14; k++) { const bh = 14 + this.hash(k) * 36, bx = x0 + k * 32; ctx.fillStyle = k % 2 ? '#9fb3c8' : '#b0c4d8'; ctx.fillRect(bx, fy + 14 - bh, 26, bh); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let yy = fy + 18 - bh; yy < fy + 8; yy += 8) ctx.fillRect(bx + 4, yy, 4, 4), ctx.fillRect(bx + 14, yy, 4, 4); }
      ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x0, fy + 14, w, h - wall - 14); ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let xx = x0; xx < R.x1; xx += 40) { ctx.beginPath(); ctx.moveTo(xx + 0.5, fy + 14); ctx.lineTo(xx + 0.5, R.y1); ctx.stroke(); }
      ctx.fillStyle = '#5c6670'; ctx.fillRect(x0, fy + 10, w, 4); for (let xx = x0 + 10; xx < R.x1; xx += 22) ctx.fillRect(xx, fy - 10, 3, 24);   // railing
      for (let i = 0; i < 3; i++) { const px = x0 + 40 + i * 140, py = fy + 16; ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, px, py, 60, 20, 4); ctx.fill(); ctx.fillStyle = '#3f9a4a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(px + 10 + k * 13, py - 2, 7, 0, Math.PI * 2); ctx.fill(); } const cols = ['#ff8fab', '#ffd166', '#ff6b6b', '#9ad0ff']; for (let k = 0; k < 4; k++) { ctx.fillStyle = cols[(k + i) % 4]; ctx.beginPath(); ctx.arc(px + 10 + k * 13, py - 8 + Math.sin(t * 2 + k) * 1.5, 3.5, 0, Math.PI * 2); ctx.fill(); } }
      for (const b of st.roofPigeons) { const bx = x0 + b.x, by = y0 + b.y - b.lift, fc = b.facing; ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(bx, y0 + b.y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(bx, by - 4, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b7480'; ctx.beginPath(); ctx.arc(bx + fc * 6, by - 7 + (b.state === 'walk' && Math.floor(t * 3) % 2 ? 2 : 0), 3.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c42'; ctx.fillRect(bx + fc * 8, by - 8, fc * 3, 2); if (b.lift > 0) { const wv = Math.sin(b.flap) * 7; ctx.fillStyle = '#b8c0cc'; ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx - 9, by - 9 - wv); ctx.lineTo(bx - 3, by - 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx + 9, by - 9 - wv); ctx.lineTo(bx + 3, by - 2); ctx.closePath(); ctx.fill(); } }
      const tl = this.telescope();
      ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.moveTo(tl.x, tl.y - 20); ctx.lineTo(tl.x - 12, tl.y + 8); ctx.moveTo(tl.x, tl.y - 20); ctx.lineTo(tl.x + 12, tl.y + 8); ctx.moveTo(tl.x, tl.y - 20); ctx.lineTo(tl.x, tl.y + 8); ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(tl.x, tl.y - 24); ctx.rotate(-0.5); ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -10, -6, 34, 12, 5); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, 18, -8, 8, 16, 3); ctx.fill(); ctx.restore();
      label(tl.x, tl.y + 20, '🔭 LOOK!');
      if (near(tl.x, tl.y, 50)) bubble(tl.x - 30, tl.y - 58, 'I can see the pizza shop! 🍕', 170);
    }
  },

  // the city bus seen from above (via Render.drawVehicle so the core's shadow/wheel/light helpers apply)
  vehicleArt: {
    citybus(r, g, color, v, h) {
      const ctx = r.ctx, stopped = v && v.state === 'stopped';
      h.shadow(150, 22); h.wheels([-50, -20, 48], 14, 9, 22);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, -75, -22, 150, 44, 10); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(-70, -19, 140, 3); ctx.fillRect(-70, 16, 140, 3);          // yellow stripe
      ctx.fillStyle = '#bfe3ff'; for (let k = -62; k < 36; k += 16) { U.roundRect(ctx, k, -21, 11, 7, 2); ctx.fill(); U.roundRect(ctx, k, 14, 11, 7, 2); ctx.fill(); }
      ctx.fillStyle = stopped ? '#ffe08a' : '#2d5a8a'; U.roundRect(ctx, 40, 13, 18, 9, 2); ctx.fill(); U.roundRect(ctx, -30, 13, 14, 9, 2); ctx.fill();   // doors (lit when open)
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 64, -16, 8, 32, 3); ctx.fill();                       // windshield
      ctx.fillStyle = '#4f8fe0'; U.roundRect(ctx, -66, -12, 126, 24, 8); ctx.fill();                    // roof
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-60, -1, 114, 2);
      ctx.fillStyle = '#2d5a8a'; for (const x of [-46, -10, 26]) { U.roundRect(ctx, x, -6, 12, 12, 3); ctx.fill(); }   // roof vents
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, 44, -7, 14, 14, 3); ctx.fill();                         // destination board glow
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(51, 0); ctx.rotate(Math.PI / 2); ctx.fillText('CITY', 0, 0); ctx.restore();
      h.lights(150, 22);
    },
  },

  drawBus(r, g, b, bubble) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle); r.drawVehicle('citybus', g, '#3b7dd8', b); ctx.restore();
    if (b.honk > 0) { ctx.fillStyle = '#2b1d14'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Beep beep!', b.x - 110, b.y - 30 - (1.2 - b.honk) * 16); }
    if (bubble) {
      const n = b.dwell, urgent = b.state === 'stopped' && b.dwell !== undefined && n <= 5 && g.area === 'town';
      r.drawBubble(b.x, b.y - 48 + (urgent ? Math.sin(g.time * 12) * 3 : Math.sin(g.time * 4) * 3), () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = urgent ? '#e4572e' : '#2b1d14'; ctx.fillText(bubble, 0, 0); }, bubble.length > 14 ? 130 : 96);
    }
  },

  // ---------- the ride: a side-on bus rolling from the fields into the big city (or back) ----------
  travel: {
    bus(r, g, W, H) {
      const E = CityExt, ctx = r.ctx, tr = g.travel, home = tr.to === 'town';
      const k = tr.t / tr.dur, ease = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
      const SPEED = 440, dist = (tr.t < 1.2 ? tr.t * tr.t / 2.4 : tr.t - 0.6) * SPEED, total = (tr.dur - 0.6) * SPEED;
      // which scenery an item shows depends on when it passes the middle of the screen: farm, then suburbs, then city
      const zone = (px, s) => { let f = U.clamp((px - W / 2) / (total * s), 0, 1); if (home) f = 1 - f; return f < 0.34 ? 0 : f < 0.62 ? 1 : 2; };
      const layer = (s, step, draw) => { const off = dist * s; const i0 = Math.floor((off - 300) / step), i1 = Math.ceil((off + W + 300) / step); for (let i = Math.max(0, i0); i <= i1; i++) draw(i * step - off, i * step, i, zone(i * step, s)); };
      const groundY = H * 0.72;
      // sky, sun, clouds
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(0.6, '#d9f0ff'); sky.addColorStop(1, '#eaf7ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.16, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();
      layer(0.08, 410, (x, px, i) => { const cy = H * (0.1 + (i % 3) * 0.07); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(x, cy, 18, 0, Math.PI * 2); ctx.arc(x + 20, cy - 10, 24, 0, Math.PI * 2); ctx.arc(x + 46, cy, 17, 0, Math.PI * 2); ctx.fill(); });
      // far layer: hills, then rooftops, then a tall skyline
      layer(0.25, 150, (x, px, i, z) => {
        const hh = E.hash(i);
        if (z === 0) { ctx.fillStyle = '#9ccc8a'; ctx.beginPath(); ctx.ellipse(x + 75, groundY, 130, 50 + hh * 50, 0, Math.PI, 0); ctx.fill(); }
        else if (z === 1) { ctx.fillStyle = '#a8bfd6'; ctx.fillRect(x + 20, groundY - 40 - hh * 30, 110, 40 + hh * 30); ctx.fillStyle = '#8fa6bf'; ctx.beginPath(); ctx.moveTo(x + 10, groundY - 40 - hh * 30); ctx.lineTo(x + 75, groundY - 70 - hh * 30); ctx.lineTo(x + 140, groundY - 40 - hh * 30); ctx.closePath(); ctx.fill(); }
        else { const th = 120 + hh * H * 0.35; ctx.fillStyle = '#9fb3c8'; ctx.fillRect(x + 10, groundY - th, 130, th); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let yy = groundY - th + 12; yy < groundY - 10; yy += 18) for (let xx = x + 20; xx < x + 130; xx += 22) ctx.fillRect(xx, yy, 8, 10); }
      });
      // ground: fields, lawns, pavement
      ctx.fillStyle = '#6cb35a'; ctx.fillRect(0, groundY - 4, W, H - groundY + 4);
      layer(1, 200, (x, px, i, z) => { ctx.fillStyle = z === 0 ? (i % 2 ? '#8bc34a' : '#c9b25a') : z === 1 ? '#6cb35a' : '#cfc8b8'; ctx.fillRect(x - 1, groundY - 4, 202, H - groundY + 4); });
      // mid layer: barns, cows and trees / houses / tall colourful buildings
      layer(0.6, 190, (x, px, i, z) => {
        const hh = E.hash(i * 3 + 1), gy = groundY + 6;
        if (z === 0) {
          if (i % 3 === 0) { ctx.fillStyle = '#b23a48'; ctx.fillRect(x, gy - 60, 90, 60); ctx.fillStyle = '#8a2a36'; ctx.beginPath(); ctx.moveTo(x - 6, gy - 60); ctx.lineTo(x + 45, gy - 90); ctx.lineTo(x + 96, gy - 60); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x + 32, gy - 36, 26, 36); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x + 34, gy - 34, 22, 32); ctx.beginPath(); ctx.moveTo(x + 34, gy - 34); ctx.lineTo(x + 56, gy - 2); ctx.moveTo(x + 56, gy - 34); ctx.lineTo(x + 34, gy - 2); ctx.stroke(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x + 100, gy - 80, 28, 80); ctx.beginPath(); ctx.arc(x + 114, gy - 80, 14, Math.PI, 0); ctx.fill(); }
          else if (i % 3 === 1) { for (let c = 0; c < 2; c++) { const cx = x + 30 + c * 70, cy = gy - 10; ctx.fillStyle = '#fff'; U.roundRect(ctx, cx - 18, cy - 16, 36, 20, 8); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx - 6, cy - 8, 5, 0, Math.PI * 2); ctx.arc(cx + 8, cy - 4, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 20, cy - 14, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f8bbd0'; ctx.fillRect(cx + 20, cy - 12, 8, 5); ctx.fillStyle = '#2b1d14'; ctx.fillRect(cx - 14, cy + 2, 4, 8); ctx.fillRect(cx + 8, cy + 2, 4, 8); } ctx.fillStyle = '#e4b04a'; for (let b = 0; b < 2; b++) { ctx.beginPath(); ctx.arc(x + 150 + b * 24, gy - 10, 10, 0, Math.PI * 2); ctx.fill(); } }
          else { const tx = x + 60 + hh * 60; ctx.fillStyle = '#6b4a2b'; ctx.fillRect(tx - 5, gy - 34, 10, 34); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(tx, gy - 48, 26, 0, Math.PI * 2); ctx.arc(tx - 18, gy - 34, 18, 0, Math.PI * 2); ctx.arc(tx + 18, gy - 34, 18, 0, Math.PI * 2); ctx.fill(); }
        } else if (z === 1) {
          const col = ['#f2d6a0', '#cfe3f7', '#e8f2cf', '#ffd6e3'][i % 4], roof = ['#b23a48', '#2d5a8a', '#5a8a2d', '#8e5bd1'][i % 4];
          ctx.fillStyle = col; ctx.fillRect(x + 10, gy - 70, 110, 70); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x, gy - 70); ctx.lineTo(x + 65, gy - 110); ctx.lineTo(x + 130, gy - 70); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x + 22, gy - 56, 22, 20); ctx.fillRect(x + 80, gy - 56, 22, 20); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x + 54, gy - 34, 22, 34);
          ctx.fillStyle = '#fff'; for (let f = 0; f < 5; f++) ctx.fillRect(x + 130 + f * 12, gy - 18, 5, 18); ctx.fillRect(x + 130, gy - 12, 56, 3);
          if (i % 2) { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + 160, gy - 30, 8, 30); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x + 164, gy - 42, 20, 0, Math.PI * 2); ctx.fill(); }
        } else {
          const col = ['#e8a0bf', '#7fc8f8', '#f6c453', '#b39ddb', '#ef8a62', '#a5d6a7'][i % 6], th = 110 + hh * 130;
          ctx.fillStyle = col; ctx.fillRect(x + 6, gy - th, 150, th); ctx.fillStyle = E.shade(col, 0.65); ctx.fillRect(x + 6, gy - th, 150, 14);
          for (let yy = gy - th + 24; yy < gy - 30; yy += 26) for (let xx = x + 18; xx < x + 150; xx += 28) { ctx.fillStyle = E.hash(xx + yy) < 0.3 ? '#fff3b0' : '#9fd8ff'; ctx.fillRect(xx, yy, 16, 16); }
          for (let a = 0; a < 6; a++) { ctx.fillStyle = a % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(x + 36 + a * 15, gy - 30, 15, 8); }
          if (i % 4 === 1) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x + 120, gy - th - 26, 24, 26); ctx.beginPath(); ctx.moveTo(x + 118, gy - th - 26); ctx.lineTo(x + 132, gy - th - 40); ctx.lineTo(x + 146, gy - th - 26); ctx.fill(); }
        }
      });
      // the road under the bus: asphalt, a dashed centre line streaming past, kerb
      const ry = groundY + 30;
      ctx.fillStyle = '#474a50'; ctx.fillRect(0, ry, W, 70); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(0, ry + 70, W, H - ry - 70); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, ry + 70, W, 3);
      layer(1, 44, (x, px, i, z) => { ctx.fillStyle = '#f2c94c'; ctx.fillRect(x, ry + 33, 24, 4); if (z === 2 && i % 9 === 0) { ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x, ry - 60, 4, 60); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 2, ry - 62, 6, 0, Math.PI * 2); ctx.fill(); } else if (z === 0 && i % 5 === 0) { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x, ry - 22, 5, 22); ctx.fillRect(x - 20, ry - 16, 46, 3); } });
      // a road sign goes by as the city comes into view
      layer(1, total + W, (x, px, i) => { if (i !== 0) return; const sx = x + total * 0.6; ctx.fillStyle = '#5c6670'; ctx.fillRect(sx, ry - 70, 5, 70); ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, sx - 50, ry - 96, 110, 30, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(home ? 'PIZZA TOWN  ➜' : 'THE CITY  ➜', sx + 5, ry - 81); });
      // the bus, side on, rolling along with its wheels turning and the chef waving from a window
      const sc = Math.min(1.1, W / 720), bx = W / 2, by = ry + 40 + Math.sin(g.time * 9) * 1.2;
      ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 10, 150, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, -140, -100, 280, 92, 14); ctx.fill();
      ctx.fillStyle = '#2d5a8a'; ctx.fillRect(-140, -30, 280, 16); ctx.fillStyle = '#ffd166'; ctx.fillRect(-140, -34, 280, 5);
      ctx.fillStyle = '#4f8fe0'; U.roundRect(ctx, -134, -106, 268, 12, 6); ctx.fill();
      ctx.fillStyle = '#bfe3ff'; for (let i = 0; i < 6; i++) { U.roundRect(ctx, -124 + i * 34, -88, 26, 30, 4); ctx.fill(); }
      U.roundRect(ctx, 86, -88, 24, 68, 4); ctx.fill(); ctx.fillStyle = 'rgba(43,29,20,0.3)'; ctx.fillRect(97, -86, 2, 64);   // door
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 114, -92, 24, 40, 6); ctx.fill();                                      // windshield
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -46, -124, 92, 20, 5); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(home ? '🍕 PIZZA TOWN' : '🏙️ THE CITY', 0, -114);
      // passengers: a few round heads, and the chef waving in the third window
      const heads = [['#2b1d14', 0], ['#d9a066', 1], ['#8c3b2f', 4], ['#1a1a1a', 5]];
      for (const [hair, w] of heads) { const hx = -111 + w * 34; ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(hx, -68, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(hx, -70, 8.5, Math.PI, 0); ctx.fill(); }
      const chx = -111 + 2 * 34, wave = Math.sin(g.time * 8) * 6;
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(chx, -68, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(chx + 12, -80 + wave, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, chx - 8, -84, 16, 8, 3); ctx.fill(); ctx.beginPath(); ctx.arc(chx - 4, -86, 5, 0, Math.PI * 2); ctx.arc(chx + 4, -86, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(chx - 2, -64, 2.5, 1.2, 0, 0, Math.PI * 2); ctx.ellipse(chx + 3, -64, 2.5, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(136, -42, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(-136, -42, 5, 0, Math.PI * 2); ctx.fill();
      const wheel = (x) => { ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(x, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(x, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; const a = dist / 20; for (let s = 0; s < 3; s++) { ctx.beginPath(); ctx.moveTo(x + Math.cos(a + s) * 11, Math.sin(a + s) * 11); ctx.lineTo(x - Math.cos(a + s) * 11, -Math.sin(a + s) * 11); ctx.stroke(); } };
      wheel(-92); wheel(92);
      ctx.restore();
      for (let i = 0; i < 4; i++) { const age = ((g.time * 1.4 + i * 0.5) % 2) / 2; ctx.fillStyle = `rgba(200,200,200,${0.45 * (1 - age)})`; ctx.beginPath(); ctx.arc(bx - 146 * sc - age * 90, by - 16 * sc - age * 30, (4 + age * 12) * sc, 0, Math.PI * 2); ctx.fill(); }
      // destination banner and progress bar
      const msg = home ? '🚌 Next stop: home! 🍕' : '🚌 Next stop: the City! 🏙️';
      ctx.fillStyle = 'rgba(43,29,20,0.85)'; const bw = Math.min(W - 24, 360); U.roundRect(ctx, W / 2 - bw / 2, 60, bw, 44, 12); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 300 ? 14 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 82);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, bw - 32, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, (bw - 32) * U.clamp(k, 0, 1), 6, 3); ctx.fill();
      if (ease < 1) { ctx.fillStyle = `rgba(43,29,20,${1 - ease})`; ctx.fillRect(0, 0, W, H); }
    },
  },
};
Game.ext.push(CityExt);
Render.ext.push(CityExt);
