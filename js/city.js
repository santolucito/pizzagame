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
  BUS: { first: [40, 70], every: [90, 150], dwell: 15, speed: 320, len: 150, warn: 20, callAfter: 10 },
  TOWN_STOP: { x: 500, y: 36 },           // north lane, the bus faces west
  TOWN_ARRIVE: { x: 500, y: -30 },
  RIDE: 7,
  // the Pizza Tower: walk in through the lobby door and ride the elevator. Each floor is one wide room,
  // drawn over the city in the middle of the map (the player is teleported into it); the elevator car is set
  // into the back wall and a row of numbered buttons in front of it picks the floor
  TOWER: {
    door: { x: 5115, y: 472 },
    ROOM: { x0: 5000, y0: 595, x1: 5600, y1: 865 },
    wall: 70, floors: 6,
    names: ['', 'Lobby', 'Pizza Party Office', 'Gym', 'Aquarium', 'Dentist', 'Rooftop Garden'],
    icons: ['', '🛎️', '🍕', '🏋️', '🐠', '🦷', '🌳'],
    wallColors: ['', '#e8d9c8', '#cfe3f7', '#ffe082', '#1e5a8a', '#b8f2c8', '#79c6f2'],
    ride: { close: 0.6, move: 1.8, open: 0.6, out: 0.5 },   // seconds: the ride is about three seconds whatever the distance
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
  viewing: null, // looking through the rooftop telescope: { t, x, y }

  // ---------- small helpers ----------
  hash(i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); },
  // how lit a window is (0..1): decided once per building/window, plus one window somewhere fading on and off every 2.5 s
  winLit(bi, wi, t) { const base = this.hash(bi * 101 + wi * 7 + 3) < 0.42 ? 1 : 0, slot = Math.floor(t / 2.5), pick = Math.floor(this.hash(slot * 17 + 1) * 97); if (((bi * 13 + wi) % 97) !== pick) return base; const k = (t / 2.5) % 1, fade = k < 0.3 ? k / 0.3 : k > 0.7 ? (1 - k) / 0.3 : 1; return base ? 1 - fade : fade; },
  shade(hex, f) { const n = parseInt(hex.slice(1), 16); const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; },
  nearTownStop(g) { const p = g.player, S = CFG.CITY.TOWN_STOP; return !g.driving && !g.onTrain && !g.ride && !g.fishing && p.x > S.x - 160 && p.x < S.x + 80 && p.y > -100 && p.y < 16; },   // the sign, the bus door and the shelter with its bench
  nearCityStop(g) { const p = g.player, S = CFG.CITY.STOP; return !g.driving && !g.onTrain && !this.floor && U.dist(p.x, p.y, S.x, S.y) < 95; },
  nearTowerDoor(g) { const p = g.player, D = CFG.CITY.TOWER.door; return !g.driving && !g.onTrain && !this.floor && U.dist(p.x, p.y, D.x, D.y) < 36; },
  liftSpot() { const R = CFG.CITY.TOWER.ROOM; return { x: (R.x0 + R.x1) / 2, y: R.y0 + 64 }; },
  exitSpot() { const R = CFG.CITY.TOWER.ROOM; return { x: (R.x0 + R.x1) / 2, y: R.y1 - 24 }; },
  telescope() { const R = CFG.CITY.TOWER.ROOM; return { x: R.x1 - 60, y: R.y1 - 56 }; },
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
      lift: null, panel: null, floorT: 0, seenTower: false, seenView: false, roofPigeons: [{ x: 60, y: 240 }, { x: 250, y: 150 }, { x: 470, y: 250 }].map((q) => ({ x: q.x, y: q.y, lift: 0, state: 'walk', facing: 1, flap: 0, t: 0 })),
    };
    this.floor = null; this.viewing = null;
    // a save made inside the Pizza Tower reloads onto the room's spot: put the chef back in the lobby
    const R = C.TOWER.ROOM, p = g.player;
    if (g.area === 'city' && p.x > R.x0 - 20 && p.x < R.x1 + 20 && p.y > R.y0 - 20 && p.y < R.y1 + 20) { this.floor = 1; this.st.seenTower = true; const e = this.exitSpot(); p.x = e.x; p.y = e.y - 14; }
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
      // waiting at the stop calls the bus: stand there ten seconds and it comes
      if (g.area === 'town' && this.nearTownStop(g) && !g.player.moving) {
        b.wait = (b.wait || 0) + dt;
        if (b.wait >= B.callAfter && b.timer > 1) { b.timer = 1; b.warned = true; g.floats.push({ x: g.player.x, y: g.player.y - 70, text: 'Here comes the bus! 🚌', color: '#ffe08a', t: 0, dur: 1.6, big: true }); }
      } else b.wait = 0;
      b.timer -= dt;
      // a heads-up like the train's, so there is time to walk to the stop
      if (!b.warned && b.timer <= B.warn && home) { b.warned = true; g.toast(`🚌 Bus in ${B.warn} seconds! Head to the bus stop!`, true, 'town'); Sfx.ding(); }
      if (b.timer <= 0) { b.state = 'arriving'; b.x = CFG.WORLD.x1 + 200; b.y = S.y; b.speed = B.speed; b.warned = false; }
    } else if (b.state === 'arriving') {
      const d = b.x - S.x;
      b.speed = U.clamp(d * 1.6, 40, B.speed); b.x -= b.speed * dt;
      if (d <= 2) {
        b.x = S.x; b.state = 'stopped'; b.dwell = B.dwell; b.honk = 1.2;
        if (home) { g.toast('🚌 The bus is here! It leaves in 15 seconds', true, 'town'); Sfx.ding(); }
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
    Haptics.tap();
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
    const bb = C.BUILDINGS.find((b) => b.billboard); if (bb) { const cx = (bb.x0 + bb.x1) / 2, y = bb.y0 + 2, on = Math.floor(t * 2) % 3; let i = 0; for (let x = cx - 60; x <= cx + 60; x += 12, i++) { ctx.fillStyle = (i % 3) === on ? '#ffe08a' : 'rgba(255,224,138,0.35)'; ctx.beginPath(); ctx.arc(x, y - 54, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + 6, 2.5, 0, Math.PI * 2); ctx.fill(); } }
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

  // ---------- the Pizza Tower: lobby door, an elevator with a real button panel, six floors, the rooftop telescope ----------
  enterTower(g) {
    const st = this.st, S = this.exitSpot();
    this.floor = 1; this.viewing = null; st.lift = null; st.panel = null; st.floorT = 0; st.seenTower = true;
    g.player.x = S.x; g.player.y = S.y - 14; g.player.moving = false; g.player.facing = 1; g.player.hasMoved = true; g.cameraSnap = true;
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: 'Welcome to the Pizza Tower!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Haptics.tap();
  },
  leaveTower(g) {
    const D = CFG.CITY.TOWER.door;
    this.floor = null; this.viewing = null; this.st.lift = null; this.st.panel = null;
    g.player.x = D.x; g.player.y = D.y + 6; g.player.moving = false; g.cameraSnap = true;
  },
  inCar(p) { const R = CFG.CITY.TOWER.ROOM, cx = (R.x0 + R.x1) / 2; return Math.abs(p.x - cx) < 80 && p.y < R.y0 + 78; },
  stepOut(g, dx = 0) { const sp = this.liftSpot(); this.st.panel = null; g.player.x = sp.x + dx; g.player.y = sp.y + 42; g.player.moving = false; },
  towerAction(g) {
    const st = this.st, p = g.player, T = CFG.CITY.TOWER, ex = this.exitSpot(), tl = this.telescope();
    if (this.viewing) return { label: '🚶 Done looking', run: () => { this.viewing = null; } };
    if (st.lift) return null;
    if (st.panel) return st.panel.sel === this.floor ? { label: '🚶 Step out', run: (gg) => this.stepOut(gg) } : { label: `🛗 Go to floor ${st.panel.sel}`, run: (gg) => this.ride(gg, st.panel.sel) };
    if (this.floor === 1 && U.dist(p.x, p.y, ex.x, ex.y) < 36) return { label: '🚪 Out to the street', run: (gg) => this.leaveTower(gg) };
    if (this.floor === T.floors && U.dist(p.x, p.y, tl.x, tl.y) < 52) return { label: '🔭 Look through the telescope', run: (gg) => { this.viewing = { t: 0, x: gg.player.x, y: gg.player.y, f: 0.14, vel: 0, bump: 0, bumpDir: 0 }; st.seenView = true; gg.player.moving = false; Haptics.tap(); } };
    return null;
  },
  ride(g, to) {
    if (to === this.floor) return;
    this.st.lift = { phase: 'closing', t: 0, from: this.floor, to, shown: this.floor };
    this.st.panel = null; g.player.moving = false; Haptics.tap();
  },
  updateTower(g, dt) {
    const st = this.st, L = st.lift, p = g.player, T = CFG.CITY.TOWER, R = T.ROOM, sp = this.liftSpot(), a = Input.axis();
    st.floorT += dt;
    if (this.viewing) {
      // eyes on the telescope: the chef stays put, the stick pans the view with easing, a soft bump at each end
      const v = this.viewing; v.t += dt; p.x = v.x; p.y = v.y; p.moving = false;
      v.vel = U.lerp(v.vel, a.x * 0.3, 1 - Math.pow(0.03, dt)); v.f += v.vel * dt;
      if (v.f < 0) { v.f = 0; if (v.vel < -0.08 && v.bump <= 0) { v.bump = 0.45; v.bumpDir = -1; } v.vel = 0; }
      if (v.f > 1) { v.f = 1; if (v.vel > 0.08 && v.bump <= 0) { v.bump = 0.45; v.bumpDir = 1; } v.vel = 0; }
      v.bump = Math.max(0, v.bump - dt);
      return;
    }
    if (L) {
      // the ride: doors close, the car hums between floors (counter ticks floor by floor), ding, doors open, the chef steps out
      p.x = sp.x; p.y = sp.y; p.moving = false; L.t += dt;
      const n = Math.abs(L.to - L.from), dir = L.to > L.from ? 1 : -1;
      if (L.phase === 'closing' && L.t >= T.ride.close) { L.phase = 'moving'; L.t = 0; }
      else if (L.phase === 'moving') {
        L.shown = L.from + dir * Math.min(n, Math.floor(L.t / (T.ride.move / n)));
        if (L.t >= T.ride.move) { this.floor = L.to; L.shown = L.to; L.phase = 'opening'; L.t = 0; st.floorT = 0; Sfx.ding(); }
      } else if (L.phase === 'opening' && L.t >= T.ride.open) { L.phase = 'out'; L.t = 0; }
      else if (L.phase === 'out') {
        p.y = sp.y + Math.min(1, L.t / T.ride.out) * 42; p.moving = L.t < T.ride.out; p.bob += dt * 14; p.facing = 1;
        if (L.t >= T.ride.out) { st.lift = null; p.moving = false; g.floats.push({ x: p.x, y: p.y - 64, text: `${T.icons[this.floor]} ${T.names[this.floor]}!`, color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
      }
      return;
    }
    // walking into the car opens the button panel; the stick moves the highlight, left/right steps back out
    if (st.panel) {
      p.x = sp.x; p.y = sp.y; p.moving = false;
      const P = st.panel;
      if (Math.abs(a.y) < 0.35) P.armed = true;
      else if (P.armed) { P.sel = U.clamp(P.sel + (a.y < 0 ? 1 : -1), 1, T.floors); P.armed = false; P.flash = 0.25; }
      P.flash = Math.max(0, (P.flash || 0) - dt);
      if (Math.abs(a.x) > 0.6) this.stepOut(g, a.x < 0 ? -70 : 70);
    } else if (this.inCar(p)) { st.panel = { sel: this.floor, armed: Math.abs(a.y) < 0.35, flash: 0 }; Haptics.tap(); }
    // rooftop pigeons scatter like the ones on the square
    if (this.floor === T.floors) for (const b of st.roofPigeons) {
      b.t -= dt; b.flap += dt * 24;
      const wx = R.x0 + b.x, wy = R.y0 + b.y, d = U.dist(wx, wy, p.x, p.y);
      if (b.state !== 'fly' && d < 60) { b.state = 'fly'; b.t = 1.2; const an = Math.atan2(wy - p.y, wx - p.x); b.tx = U.clamp(b.x + Math.cos(an) * 160, 24, R.x1 - R.x0 - 24); b.ty = U.clamp(b.y + Math.sin(an) * 60, 100, 220); }
      if (b.state === 'fly') { b.lift = Math.min(36, b.lift + dt * 90); if (U.moveToward(b, b.tx, b.ty, 220, dt) || b.t <= 0) b.state = 'land'; }
      else if (b.state === 'land') { b.lift = Math.max(0, b.lift - dt * 100); if (b.lift === 0) { b.state = 'walk'; b.t = U.rand(1, 3); } }
      else if (b.t <= 0) { b.tx = U.clamp(b.x + U.rand(-40, 40), 24, R.x1 - R.x0 - 24); b.ty = U.clamp(b.y + U.rand(-20, 20), 100, 220); b.t = U.rand(1.5, 4); }
      else if (!U.moveToward(b, b.tx, b.ty, 24, dt)) b.facing = b.tx < b.x ? -1 : 1;
    }
  },
  roomObstacles() {
    const T = CFG.CITY.TOWER, R = T.ROOM, w = R.x1 - R.x0, cx = (R.x0 + R.x1) / 2, o = [];
    const X = R.x0, Y = R.y0, box = (x, y, bw, bh) => o.push({ x: X + x, y: Y + y, w: bw, h: bh });
    // walls: the lintel over the elevator car, the back wall on both sides of the car, the sides and the front
    o.push({ x: R.x0 - 10, y: R.y0 - 10, w: w + 20, h: 26 }, { x: R.x0 - 10, y: R.y0, w: cx - 80 - (R.x0 - 10), h: T.wall }, { x: cx + 80, y: R.y0, w: R.x1 + 10 - (cx + 80), h: T.wall });
    o.push({ x: R.x0 - 10, y: R.y0, w: 18, h: R.y1 - R.y0 }, { x: R.x1 - 8, y: R.y0, w: 18, h: R.y1 - R.y0 }, { x: R.x0, y: R.y1 - 8, w: w, h: 18 });
    const f = this.floor;
    if (f === 1) { box(28, 160, 130, 30); box(164, 172, 22, 20); box(426, 180, 88, 34); box(336, 214, 90, 28); }                                   // desk, plant, fountain, sofa
    else if (f === 2) { box(18, 150, 72, 24); box(108, 150, 72, 24); box(400, 150, 72, 24); box(490, 150, 72, 24); box(270, 188, 60, 24); }         // desks, party table
    else if (f === 3) { box(30, 170, 58, 30); box(125, 170, 58, 30); box(390, 170, 58, 30); box(30, 238, 64, 12); box(548, 150, 24, 32); box(470, 236, 70, 18); }   // treadmills, rack, cooler, yoga mat
    else if (f === 4) { box(262, 184, 76, 14); box(60, 192, 36, 18); }                                                                              // bench, toy chest
    else if (f === 5) { box(28, 150, 136, 30); box(460, 165, 96, 32); box(380, 232, 30, 16); }                                                      // chairs, reception, toy box
    else if (f === 6) { const tl = this.telescope(); o.push({ x: tl.x - 12, y: tl.y - 10, w: 24, h: 18 }); box(28, 124, 72, 26); box(500, 124, 72, 26); box(73, 184, 34, 22); box(360, 196, 76, 22); }   // telescope, planters, tree tub, lounger
    return o;
  },
  towerHint(g) {
    const st = this.st, p = g.player, T = CFG.CITY.TOWER, f = this.floor, L = st.lift, tl = this.telescope();
    if (this.viewing) return { text: '◀ ▶ to look around', target: null };
    if (L) return { text: L.phase === 'moving' ? (L.to > L.from ? '🛗 Going up!' : '🛗 Going down!') : L.phase === 'opening' || L.phase === 'out' ? '🛗 Ding! Doors opening' : '🛗 Doors closing…', target: null };
    if (st.panel) return { text: st.panel.sel === f ? '▲ ▼ to choose a floor, ◀ ▶ to step out' : `Press the button to ride to ${T.names[st.panel.sel]} ${T.icons[st.panel.sel]}`, target: null };
    const car = this.liftSpot(), go = { text: 'Walk into the elevator to choose a floor 🛗', target: { x: car.x, y: car.y + 20 } };
    const early = st.floorT < 5;
    if (f === 1) return st.seenView ? { text: 'Walk out the door to the street', target: this.exitSpot() } : go;
    if (f === 2) return early ? { text: 'Everybody loves the pizza chef! 🍕', target: null } : go;
    if (f === 3) return early ? { text: 'Run, run, run! 🏃', target: null } : go;
    if (f === 4) return early ? { text: 'Look at all the fish! 🐠', target: null } : go;
    if (f === 5) return early ? { text: 'The shark is waiting for the dentist 🦈', target: null } : go;
    if (U.dist(p.x, p.y, tl.x, tl.y) < 52) return { text: 'Press the button to look through the telescope!', target: null };
    if (!st.seenView) return { text: 'Look through the telescope! 🔭', target: tl };
    return go;
  },

  // the room the chef is in, drawn over the whole view
  drawRoom(r, g) {
    const ctx = r.ctx, st = this.st, T = CFG.CITY.TOWER, R = T.ROOM, w = R.x1 - R.x0, h = R.y1 - R.y0, cx = (R.x0 + R.x1) / 2, f = this.floor, L = st.lift;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(r.camX - 200, r.camY - 200, r.viewW + 400, r.viewH + 400);
    ctx.save(); ctx.beginPath(); ctx.rect(R.x0, R.y0, w, h); ctx.clip();
    this.paintFloor(r, g, f);
    // the elevator car set into the back wall: lit interior, the chef, two sliding doors, frame and counter
    const open = !L || L.phase === 'out' ? 1 : 0;
    const ex = cx, ey = R.y0;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(ex - 88, ey, 176, T.wall + 4);
    ctx.fillStyle = '#6b5a4a'; ctx.fillRect(ex - 80, ey + 14, 160, T.wall - 14);
    ctx.fillStyle = '#d9b382'; ctx.fillRect(ex - 80, ey + 14, 160, 26); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(ex - 76, ey + 18, 152, 6);   // wood panel + strip light
    ctx.fillStyle = '#8d7b63'; ctx.fillRect(ex - 80, ey + 40, 160, T.wall - 40);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = -80; k < 80; k += 20) ctx.fillRect(ex + k, ey + 40, 1, T.wall - 40);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(ex + 60, ey + 18, 12, 30); for (let i = 0; i < 6; i++) { ctx.fillStyle = i + 1 === f ? '#ffd166' : '#9aa0a8'; ctx.beginPath(); ctx.arc(ex + 66, ey + 22 + i * 4.6, 1.6, 0, Math.PI * 2); ctx.fill(); }   // the little button panel on the car wall
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, ex - 70, ey + 38, 120, 3, 1.5); ctx.fill();   // handrail
    if (st.panel) { ctx.fillStyle = 'rgba(255,224,138,0.18)'; ctx.fillRect(ex - 80, ey + 14, 160, T.wall - 14); }
    r.drawPlayer(g);
    for (const b of this.bubbles) r.drawBubble(b.x, b.y, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(b.text, 0, 0); }, b.w);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(ex - 80, ey + 12, 80 * (1 - open), T.wall - 12); ctx.fillRect(ex + 80 - 80 * (1 - open), ey + 12, 80 * (1 - open), T.wall - 12);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(ex - 88, ey, 176, 14); ctx.fillRect(ex - 88, ey, 8, T.wall + 4); ctx.fillRect(ex + 80, ey, 8, T.wall + 4);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, ex - 30, ey + 1, 60, 12, 3); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(f), ex, ey + 7);
    // floor name plate in the corner
    ctx.font = r.font(10); const name = `Floor ${f} · ${T.names[f]}`, nw = ctx.measureText(name).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, R.x1 - 10 - nw, R.y1 - 26, nw, 18, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.fillText(name, R.x1 - 10 - nw / 2, R.y1 - 17);
    ctx.restore();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 6; ctx.strokeRect(R.x0, R.y0, w, h);
  },

  paintFloor(r, g, f) {
    const ctx = r.ctx, st = this.st, T = CFG.CITY.TOWER, R = T.ROOM, w = R.x1 - R.x0, h = R.y1 - R.y0, cx = (R.x0 + R.x1) / 2, t = g.time, wall = T.wall, p = g.player;
    const x0 = R.x0, y0 = R.y0, fy = y0 + wall, X = (v) => x0 + v, Y = (v) => y0 + v;
    this.bubbles = [];
    const bubble = (x, y, text, wd) => this.bubbles.push({ x: U.clamp(x, x0 + wd / 2 + 6, R.x1 - wd / 2 - 6), y: Math.max(y, y0 + 16), text, w: wd });
    const label = (x, y, text, col = '#ffe08a', bg = '#2b1d14') => { ctx.font = r.font(10); const tw = ctx.measureText(text).width + 16; ctx.fillStyle = bg; U.roundRect(ctx, x - tw / 2, y - 9, tw, 18, 4); ctx.fill(); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); };
    const near = (x, y, d) => U.dist(p.x, p.y, X(x), Y(y)) < d;
    const person = (x, y, o) => r.drawPerson(X(x), Y(y), o);
    const plant = (x, y) => { ctx.fillStyle = '#c62828'; U.roundRect(ctx, X(x) - 9, Y(y) - 12, 18, 20, 3); ctx.fill(); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(X(x), Y(y) - 24, 14, 0, Math.PI * 2); ctx.arc(X(x) - 10, Y(y) - 16, 9, 0, Math.PI * 2); ctx.arc(X(x) + 11, Y(y) - 16, 9, 0, Math.PI * 2); ctx.fill(); };
    const shadow = (x, y, rx, ry) => { ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(X(x), Y(y), rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
    if (f === 1) {
      // warm wood-panelled lobby with a marble floor
      ctx.fillStyle = '#e8d9c8'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#c9a279'; ctx.fillRect(x0, Y(44), w, wall - 44); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < w; k += 26) ctx.fillRect(X(k), Y(44), 2, wall - 44);
      for (let yy = 0; yy < h - wall; yy += 24) for (let xx = 0; xx < w; xx += 24) { ctx.fillStyle = (xx / 24 + yy / 24) % 2 ? '#f3efe3' : '#e0d8cc'; ctx.fillRect(X(xx), fy + yy, 24, 24); }
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x0, fy, w, 4);
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, X(22), Y(10), 130, 26, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 PIZZA TOWER', X(87), Y(23));
      // the directory board and a clock to the right of the elevator
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, X(408), Y(6), 140, 58, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'left';
      ['6 🌳 Roof garden', '5 🦷 Dentist', '4 🐠 Aquarium', '3 🏋️ Gym', '2 🍕 Party office'].forEach((s, i) => ctx.fillText(s, X(418), Y(15) + i * 11));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(572), Y(30), 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(572), Y(30)); ctx.lineTo(X(572), Y(21)); ctx.moveTo(X(572), Y(30)); ctx.lineTo(X(572) + Math.cos(t * 0.3) * 9, Y(30) + Math.sin(t * 0.3) * 9); ctx.stroke();
      // reception desk with the receptionist, a bell, a plant; the fountain on the right
      shadow(95, 194, 70, 10);
      person(92, 158, { shirt: '#3f6fb5', skin: '#e0ac69', hair: '#2b1d14', hairStyle: 1, facing: 1, moving: false, carry: 0 });
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, X(28), Y(160), 130, 30, 5); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.fillRect(X(28), Y(160), 130, 7);
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(140), Y(156), 5, Math.PI, 0); ctx.fill(); ctx.fillRect(X(134), Y(156), 12, 2);
      ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.fillText('RECEPTION', X(92), Y(178));
      if (near(92, 172, 110)) bubble(X(92), Y(102), 'Welcome, chef! 🛎️', 124);
      plant(175, 182);
      // a sofa to wait on
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(X(339), Y(218), 90, 28); ctx.fillStyle = '#c62828'; U.roundRect(ctx, X(336), Y(214), 90, 28, 6); ctx.fill(); ctx.fillStyle = '#e53935'; U.roundRect(ctx, X(342), Y(210), 38, 16, 5); ctx.fill(); U.roundRect(ctx, X(382), Y(210), 38, 16, 5); ctx.fill(); ctx.fillStyle = '#8e1c1c'; ctx.fillRect(X(336), Y(236), 90, 6);
      const F = { x: X(470), y: Y(198) };
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(F.x + 2, F.y + 5, 42, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 42, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6cc2ec'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 33, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9d968a'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 4, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(F.x - 3, F.y - 28, 6, 24);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 8; k++) { const ph = (t * 0.9 + k * 0.125) % 1, a = (k / 8) * Math.PI * 2; ctx.beginPath(); ctx.arc(F.x + Math.cos(a) * ph * 26, F.y - 26 - Math.sin(ph * Math.PI) * 20 + ph * 22, 2.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffd54a'; for (const [dx, dy] of [[-12, 2], [8, -3], [18, 4]]) { ctx.beginPath(); ctx.ellipse(F.x + dx, F.y + dy, 3, 2, 0, 0, Math.PI * 2); ctx.fill(); }   // wishing coins
      // a kid waiting with a balloon
      person(238, 238, { shirt: '#ffd166', skin: '#f1c27d', hair: '#d9a066', hairStyle: 2, facing: 1, moving: false, carry: 0 });
      ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(252), Y(222)); ctx.lineTo(X(258), Y(178) + Math.sin(t * 2) * 3); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(X(258), Y(168) + Math.sin(t * 2) * 3, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      if (near(238, 238, 70)) bubble(X(238), Y(180), 'Hi, chef!', 72);
      // the way out
      const e = this.exitSpot(); ctx.fillStyle = '#e4572e'; U.roundRect(ctx, e.x - 50, R.y1 - 26, 100, 18, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪 TO THE STREET', e.x, R.y1 - 17);
    } else if (f === 2) {
      // an office in party mode: windows, banner, confetti, desks with pizza boxes, dancing coworkers
      ctx.fillStyle = '#cfe3f7'; ctx.fillRect(x0, y0, w, wall);
      for (const wx of [40, 110, 490, 560]) { ctx.fillStyle = '#9fd8ff'; ctx.fillRect(X(wx) - 18, Y(14), 36, 34); ctx.fillStyle = '#fff'; ctx.fillRect(X(wx) - 18, Y(14), 36, 3); ctx.fillRect(X(wx) - 1, Y(14), 2, 34); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(X(wx) - 6, Y(26), 6, 0, Math.PI * 2); ctx.arc(X(wx) + 2, Y(23), 7, 0, Math.PI * 2); ctx.arc(X(wx) + 9, Y(27), 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#9fa8da'; ctx.fillRect(x0, fy, w, h - wall); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let yy = 0; yy < h - wall; yy += 16) ctx.fillRect(x0, fy + yy, w, 2);
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, X(10), Y(44), 160, 20, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎉 PIZZA PARTY! 🎉', X(90), Y(54));
      [['#ffd166', 420, 0], ['#3b7dd8', 442, 1.3], ['#2f9e44', 464, 2.1], ['#f06292', 486, 0.6], ['#e4572e', 508, 1.8]].forEach(([c, dx, ph]) => { const by = Y(54) + Math.sin(t * 2 + ph) * 3; ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(dx), by + 11); ctx.lineTo(X(dx) + 3, by + 32); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X(dx), by, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(X(dx) - 3, by - 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); });
      for (let i = 0; i < 26; i++) { const cy = (t * 26 + this.hash(i + 40) * 230) % (h - 10), cxx = this.hash(i) * (w - 20) + 10 + Math.sin(t * 3 + i) * 6; ctx.save(); ctx.translate(X(cxx), Y(cy)); ctx.rotate(t * 3 + i); ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166', '#2f9e44', '#f06292'][i % 5]; ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); }
      const desk = (dx) => { ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(X(dx) + 3, Y(154), 72, 24); ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, X(dx), Y(150), 72, 24, 4); ctx.fill(); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(X(dx) + 6, Y(132), 24, 18); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(X(dx) + 8, Y(134), 20, 14); ctx.fillStyle = '#d9b382'; ctx.fillRect(X(dx) + 38, Y(154), 28, 16); r.drawPizza(X(dx) + 52, Y(162), 9); };
      desk(18); desk(108); desk(400); desk(490);
      // the party table in the middle with a big pizza and a cake
      shadow(302, 216, 40, 10); ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(X(300), Y(200), 38, 16, 0, 0, Math.PI * 2); ctx.fill(); r.drawPizza(X(288), Y(198), 13);
      ctx.fillStyle = '#f8bbd0'; U.roundRect(ctx, X(310), Y(188), 20, 12, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(X(310), Y(188), 20, 3); ctx.fillStyle = '#ffd166'; ctx.fillRect(X(319), Y(180), 2, 8); ctx.fillStyle = Math.floor(t * 8) % 2 ? '#ff7a1a' : '#ffe08a'; ctx.beginPath(); ctx.arc(X(320), Y(178), 2.5, 0, Math.PI * 2); ctx.fill();
      const looks = [['#f28e2b', '#f1c27d', '#2b1d14', 0], ['#59a14f', '#c68642', '#5a3a1a', 2], ['#b07aa1', '#ffdbac', '#d9a066', 1], ['#e15759', '#8d5524', '#1a1a1a', 3]];
      [[62, 226], [150, 220], [430, 226], [520, 220]].forEach(([px, py], i) => {
        const [shirt, skin, hair, hs] = looks[i], yy = Y(py) + Math.sin(t * 6 + i) * 3, xx = X(px), fac = p.x < xx ? -1 : 1;
        r.drawPerson(xx, yy, { shirt, skin, hair, hairStyle: hs, facing: fac, moving: true, bob: t * 8 + i, carry: 0 });
        ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166', '#2f9e44'][i]; ctx.beginPath(); ctx.moveTo(xx - 8, yy - 46); ctx.lineTo(xx + 8, yy - 46); ctx.lineTo(xx, yy - 66); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(xx, yy - 66, 3, 0, Math.PI * 2); ctx.fill();
        r.drawPizza(xx + fac * 16, yy - 18, 6);
        if (near(px, py, 80)) bubble(xx, yy - 84 - (i % 2) * 26, ['It’s the pizza chef!!', 'Best pizza ever!', 'Can I get a selfie?', 'Hooray, chef!'][i], 120);   // staggered so neighbours' bubbles stay clear of each other
      });
    } else if (f === 3) {
      // the gym: mirror wall, punching bag, treadmills with runners, a rack of weights and a water cooler
      ctx.fillStyle = '#ffe082'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(X(16), Y(10), 180, 48); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(X(24), Y(14), 30, 40); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(X(16), Y(10), 180, 3); ctx.fillRect(X(16), Y(55), 180, 3);
      label(X(540), Y(24), '💪 GO GO GO!'); label(X(540), Y(46), 'PIZZA GYM', '#2b1d14', '#ffd166');
      ctx.fillStyle = '#607d8b'; ctx.fillRect(x0, fy, w, h - wall); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let xx = 0; xx < w; xx += 40) ctx.fillRect(X(xx), fy, 2, h - wall); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x0, fy + 110, w, 3);
      const sw = Math.sin(t * 1.6) * 5; ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(440), Y(0)); ctx.lineTo(X(440) + sw, Y(22)); ctx.stroke(); ctx.fillStyle = '#c62828'; U.roundRect(ctx, X(440) + sw - 10, Y(22), 20, 42, 6); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(X(440) + sw - 10, Y(44), 20, 4);
      for (let i = 0; i < 3; i++) {
        const tx = X([30, 125, 390][i]), ty = Y(170), ph = i * 1.3;
        ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(tx + 3, ty + 24, 58, 12);
        ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, tx, ty + 20, 58, 12, 4); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(tx + 52, ty - 12, 4, 38); ctx.fillRect(tx + 2, ty - 12, 4, 38); ctx.fillStyle = '#1e1e1e'; ctx.fillRect(tx + 42, ty - 16, 16, 8); ctx.fillStyle = '#44d36a'; ctx.fillRect(tx + 45, ty - 14, 3 + (Math.floor(t * 2 + i) % 3) * 3, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; const belt = (t * 120) % 12; for (let k = -12; k < 56; k += 12) ctx.fillRect(tx + 2 + k + belt, ty + 22, 6, 8);
        r.drawPerson(tx + 29, ty + 16 - Math.abs(Math.sin(t * 7 + ph)) * 4, { shirt: ['#e15759', '#4e79a7', '#59a14f'][i], skin: ['#f1c27d', '#8d5524', '#e0ac69'][i], hair: ['#2b1d14', '#1a1a1a', '#d9a066'][i], hairStyle: i, facing: 1, moving: true, bob: t * 14 + ph, carry: 0 });
        if (Math.floor(t * 1.5 + i) % 5 === 0) { ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(tx + 44, ty - 36 + ((t * 2) % 1) * 10, 2.2, 0, Math.PI * 2); ctx.fill(); }
        if (near([30, 125, 390][i] + 29, 184, 60)) bubble(tx + 29, ty - 58, ['Keep going!', 'Phew!', 'Pizza power!'][i], 92);
      }
      // a yoga mat with somebody stretching, the dumbbell rack, the water cooler
      ctx.fillStyle = '#8e5bd1'; U.roundRect(ctx, X(470), Y(236), 70, 18, 5); ctx.fill();
      r.drawPerson(X(505), Y(242) - Math.abs(Math.sin(t * 1.2)) * 8, { shirt: '#f06292', skin: '#e0ac69', hair: '#8c3b2f', hairStyle: 1, facing: -1, moving: false, carry: 0 });
      if (near(505, 242, 60)) bubble(X(505), Y(184), 'Stretch!', 70);
      ctx.fillStyle = '#5c6670'; ctx.fillRect(X(30), Y(240), 64, 8); ctx.fillRect(X(34), Y(248), 4, 8); ctx.fillRect(X(86), Y(248), 4, 8); for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166'][k]; ctx.fillRect(X(34) + k * 20, Y(230), 6, 10); ctx.fillRect(X(46) + k * 20, Y(230), 6, 10); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(X(40) + k * 20, Y(234), 6, 2); }
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, X(550), Y(150), 20, 18, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(X(548), Y(168), 24, 18); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(X(554), Y(172), 4, 5);
    } else if (f === 4) {
      // a wall-sized tank: fish, a turtle, an octopus and a treasure chest; a dark carpet with light spots
      const tank = ctx.createLinearGradient(0, y0, 0, fy); tank.addColorStop(0, '#1e5a8a'); tank.addColorStop(1, '#4aa3d8'); ctx.fillStyle = tank; ctx.fillRect(x0, y0, w, wall);
      ctx.fillStyle = '#d9b382'; ctx.fillRect(x0, Y(58), w, 12);
      ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 4; for (let k = 0; k < 8; k++) { const sx = X(26 + k * 66); ctx.beginPath(); ctx.moveTo(sx, Y(62)); ctx.quadraticCurveTo(sx + Math.sin(t * 1.5 + k) * 10, Y(36), sx + Math.sin(t * 1.2 + k) * 12, Y(14 + (k % 3) * 8)); ctx.stroke(); }
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, X(112), Y(46), 26, 16, 3); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.fillRect(X(112), Y(46), 26, 5); ctx.fillStyle = '#ffd166'; ctx.fillRect(X(118), Y(50), 14, 4); ctx.beginPath(); ctx.arc(X(125), Y(45), 4, 0, Math.PI * 2); ctx.fill();   // treasure chest
      ctx.fillStyle = '#ff8fab'; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(X(60), Y(60)); ctx.lineTo(X(60) + Math.cos(a) * 7, Y(60) + Math.sin(a) * 7); ctx.lineTo(X(60) + Math.cos(a + 0.6) * 3, Y(60) + Math.sin(a + 0.6) * 3); ctx.closePath(); ctx.fill(); }   // starfish
      const fish = [['#ff7a1a', 0, 0.7, 8], ['#ffd166', 1.1, 1, 18], ['#f06292', 2.4, 0.5, 34], ['#41b883', 3.6, 0.85, 4], ['#8e5bd1', 4.2, 1.3, 26], ['#3b7dd8', 5.5, 0.6, 42], ['#ffffff', 2.9, 0.45, 14]];
      fish.forEach(([col, ph, sp, dy]) => { const span = w - 60, u = ((t * sp * 40 + ph * 97) % (span * 2)); const fx = X(30) + (u < span ? u : span * 2 - u), dir = u < span ? 1 : -1, fyy = Y(12 + dy) + Math.sin(t * 2 + ph) * 3; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, fyy, 11, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - dir * 9, fyy); ctx.lineTo(fx - dir * 18, fyy - 6); ctx.lineTo(fx - dir * 18, fyy + 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx + dir * 5, fyy - 2, 2.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(fx + dir * 6, fyy - 2, 1.1, 0, Math.PI * 2); ctx.fill(); });
      const tu = X(70 + ((t * 12) % (w - 140))); ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.ellipse(tu, Y(52), 13, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(tu + 15, Y(52), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1f6e3e'; for (const [dx, dy] of [[-5, -2], [3, -3], [0, 3]]) ctx.fillRect(tu + dx, Y(52) + dy, 3, 3);
      const ox = X(452), oy = Y(30) + Math.sin(t * 1.3) * 4; ctx.strokeStyle = '#b07aa1'; ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = Math.PI * 0.2 + k * 0.32; ctx.beginPath(); ctx.moveTo(ox, oy + 6); ctx.quadraticCurveTo(ox + Math.cos(a) * 16 + Math.sin(t * 3 + k) * 4, oy + 18, ox + Math.cos(a) * 24, oy + 26 + Math.sin(t * 2.5 + k) * 3); ctx.stroke(); }
      ctx.fillStyle = '#b07aa1'; ctx.beginPath(); ctx.ellipse(ox, oy, 15, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox - 5, oy - 1, 4, 0, Math.PI * 2); ctx.arc(ox + 5, oy - 1, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(ox - 4, oy - 1, 1.8, 0, Math.PI * 2); ctx.arc(ox + 6, oy - 1, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox, oy + 3, 4, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 7; k++) { const bu = (t * 0.4 + k * 0.14) % 1; ctx.beginPath(); ctx.arc(X(50 + k * 68) + Math.sin(bu * 8) * 4, Y(60) - bu * 54, 1.5 + k % 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0, w, 5); ctx.fillStyle = '#5c6670'; ctx.fillRect(x0, fy - 2, w, 6);
      ctx.fillStyle = '#243447'; ctx.fillRect(x0, fy + 4, w, h - wall - 4); for (let k = 0; k < 9; k++) { const gl = ctx.createRadialGradient(X(40 + k * 56), Y(150), 2, X(40 + k * 56), Y(150), 40); gl.addColorStop(0, 'rgba(108,194,236,0.22)'); gl.addColorStop(1, 'rgba(108,194,236,0)'); ctx.fillStyle = gl; ctx.fillRect(X(k * 56), fy, 80, h - wall); }
      label(X(90), Y(252), '🐠 AQUARIUM', '#9fd8ff'); label(X(96), Y(12), 'please don’t tap the glass', '#2b1d14', '#fff');
      shadow(302, 200, 42, 8); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(X(262), Y(184), 76, 10); ctx.fillStyle = '#4a2d12'; ctx.fillRect(X(266), Y(194), 5, 8); ctx.fillRect(X(329), Y(194), 5, 8);
      person(80, 214, { shirt: '#ffd166', skin: '#f1c27d', hair: '#d9a066', hairStyle: 2, facing: 1, moving: false, carry: 0 }); if (near(80, 214, 80)) bubble(X(80), Y(158), 'A turtle! 🐢', 86);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, X(60), Y(192), 36, 18, 3); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(X(64), Y(196), 8, 6); ctx.fillStyle = '#e4572e'; ctx.fillRect(X(76), Y(198), 10, 6);   // toy chest
      person(520, 220, { shirt: '#4e79a7', skin: '#8d5524', hair: '#1a1a1a', hairStyle: 0, facing: -1, moving: false, carry: 0, hat: 'cap', capColor: '#2f9e44' }); if (near(520, 220, 80)) bubble(X(520), Y(164), 'Shh, the fish are sleepy', 150);
      // a glowing jellyfish drifts about the tank
      const jx = X(330) + Math.sin(t * 0.7) * 40, jy = Y(30) + Math.sin(t * 1.1) * 8; ctx.fillStyle = 'rgba(255,143,171,0.85)'; ctx.beginPath(); ctx.arc(jx, jy, 10, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,143,171,0.8)'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(jx + k * 6, jy); ctx.quadraticCurveTo(jx + k * 6 + Math.sin(t * 4 + k) * 4, jy + 10, jx + k * 6 + Math.sin(t * 3 + k) * 6, jy + 20); ctx.stroke(); } ctx.fillStyle = '#2b1d14'; ctx.fillRect(jx - 4, jy - 4, 2, 2); ctx.fillRect(jx + 2, jy - 4, 2, 2);
    } else if (f === 5) {
      // the dentist's waiting room: mint walls, a tooth poster, chairs, the kid, the shark with his magazine, the nurse
      ctx.fillStyle = '#b8f2c8'; ctx.fillRect(x0, y0, w, wall); ctx.fillStyle = '#9fe0b4'; ctx.fillRect(x0, Y(52), w, wall - 52);
      ctx.fillStyle = '#f3efe3'; ctx.fillRect(x0, fy, w, h - wall); ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let xx = 0; xx < w; xx += 32) for (let yy = 0; yy < h - wall; yy += 32) if ((xx / 32 + yy / 32) % 2) ctx.fillRect(X(xx), fy + yy, 32, 32);
      label(X(100), Y(26), '🦷 DR. MOLAR, DENTIST'); label(X(100), Y(48), 'everyone welcome, even sharks', '#2b1d14', '#fff');
      const tp = 82; ctx.fillStyle = '#fff'; U.roundRect(ctx, X(392 + tp), Y(8), 110, 50, 4); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BRUSH', X(466 + tp), Y(22)); ctx.fillText('TWICE A DAY!', X(466 + tp), Y(36));
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(406 + tp), Y(22)); ctx.quadraticCurveTo(X(406 + tp), Y(12), X(416 + tp), Y(13)); ctx.quadraticCurveTo(X(421 + tp), Y(16), X(426 + tp), Y(13)); ctx.quadraticCurveTo(X(436 + tp), Y(12), X(436 + tp), Y(22)); ctx.quadraticCurveTo(X(436 + tp), Y(38), X(430 + tp), Y(46)); ctx.lineTo(X(425 + tp), Y(36)); ctx.lineTo(X(417 + tp), Y(46)); ctx.quadraticCurveTo(X(406 + tp), Y(38), X(406 + tp), Y(22)); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(X(415 + tp), Y(24), 2, 2); ctx.fillRect(X(425 + tp), Y(24), 2, 2); ctx.strokeStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(X(421 + tp), Y(28), 3, 0.2, Math.PI - 0.2); ctx.stroke();
      // the chairs, the kid with a lollipop, the shark and his magazine
      for (let i = 0; i < 3; i++) { const sx = X(28 + i * 46); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(sx + 3, Y(156), 40, 30); ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, sx, Y(150), 40, 30, 5); ctx.fill(); ctx.fillStyle = '#2d5a8a'; ctx.fillRect(sx, Y(170), 40, 10); }
      person(48, 172, { shirt: '#ffd166', skin: '#f1c27d', hair: '#d9a066', hairStyle: 2, facing: 1, moving: false, carry: 0 });
      ctx.fillStyle = '#fff'; ctx.fillRect(X(64), Y(140), 2, 16); ctx.fillStyle = '#f06292'; ctx.beginPath(); ctx.arc(X(65), Y(138), 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(X(63), Y(136), 2, 0, Math.PI * 2); ctx.fill();
      const sh = { x: X(132), y: Y(164) + Math.sin(t * 1.5) * 1.5 };
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y - 10, 30, 18, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sh.x - 6, sh.y - 28); ctx.lineTo(sh.x + 4, sh.y - 46); ctx.lineTo(sh.x + 12, sh.y - 26); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sh.x - 28, sh.y - 14); ctx.lineTo(sh.x - 44, sh.y - 26); ctx.lineTo(sh.x - 42, sh.y - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8edf2'; ctx.beginPath(); ctx.ellipse(sh.x + 6, sh.y - 4, 20, 9, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sh.x + 14, sh.y - 16, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(sh.x + 15, sh.y - 16, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sh.x + 14, sh.y - 6, 10, 0.1, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(sh.x + 5 + k * 4, sh.y - 3); ctx.lineTo(sh.x + 7 + k * 4, sh.y + 2); ctx.lineTo(sh.x + 9 + k * 4, sh.y - 3); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#fff'; U.roundRect(ctx, sh.x + 18, sh.y - 2, 28, 20, 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; U.roundRect(ctx, sh.x + 18, sh.y - 2, 28, 20, 2); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.fillText('TEETH', sh.x + 32, sh.y + 5); ctx.fillText('WEEKLY', sh.x + 32, sh.y + 12);
      ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(sh.x + 16, sh.y + 6, 8, 4, 0.6, 0, Math.PI * 2); ctx.fill();
      if (near(132, 164, 90)) bubble(sh.x + 4, sh.y - 66, 'Just a check-up! 😁', 128);
      else if (near(48, 172, 60)) bubble(X(48), Y(114), 'No cavities!', 86);
      // reception window with the nurse, a toy box and a plant
      person(508, 163, { shirt: '#fff', skin: '#c68642', hair: '#1a1a1a', hairStyle: 2, facing: -1, moving: false, carry: 0 });
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(X(463), Y(169), 96, 32); ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, X(460), Y(165), 96, 32, 5); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.fillRect(X(460), Y(165), 96, 7);
      ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.fillText('CHECK-IN', X(496), Y(186));
      ctx.fillStyle = '#9fd8ff'; U.roundRect(ctx, X(536), Y(150), 14, 18, 4); ctx.fill(); ctx.fillStyle = '#f06292'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(X(540) + (k % 2) * 6, Y(156) + Math.floor(k / 2) * 7, 2.5, 0, Math.PI * 2); ctx.fill(); }   // lollipop jar
      if (near(508, 180, 90)) bubble(X(508), Y(106), 'Next, please!', 90);
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, X(380), Y(232), 30, 16, 3); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(X(388), Y(232), 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(X(396), Y(228), 9, 8);   // toy box
      plant(578, 246);
    } else {
      // the rooftop garden: skyline and sky behind a railing, planters, a tree in a tub, a sun lounger, pigeons, the telescope
      const sky = ctx.createLinearGradient(0, y0, 0, fy); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(1, '#d9f0ff'); ctx.fillStyle = sky; ctx.fillRect(x0, y0, w, wall);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(X(500), Y(18), 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (const [cxx, cy] of [[60, 14], [400, 10]]) { const mx = X(cxx) + ((t * 6) % 60); ctx.beginPath(); ctx.arc(mx, Y(cy), 7, 0, Math.PI * 2); ctx.arc(mx + 9, Y(cy) - 4, 9, 0, Math.PI * 2); ctx.arc(mx + 20, Y(cy), 6, 0, Math.PI * 2); ctx.fill(); }
      for (let k = 0; k < 19; k++) { const bh = 14 + this.hash(k) * 40, bx = X(k * 33); ctx.fillStyle = k % 2 ? '#9fb3c8' : '#b0c4d8'; ctx.fillRect(bx, Y(62) - bh, 27, bh); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let yy = Y(66) - bh; yy < Y(58); yy += 8) { ctx.fillRect(bx + 4, yy, 4, 4); ctx.fillRect(bx + 15, yy, 4, 4); } }
      const bxx = X(((t * 30) % (w + 60)) - 30), byy = Y(22) + Math.sin(t * 2) * 3; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bxx - 6, byy); ctx.quadraticCurveTo(bxx - 3, byy - 4, bxx, byy); ctx.quadraticCurveTo(bxx + 3, byy - 4, bxx + 6, byy); ctx.stroke();   // a bird
      ctx.fillStyle = '#b9b2a4'; ctx.fillRect(x0, fy, w, h - wall); ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let xx = 0; xx < w; xx += 40) { ctx.beginPath(); ctx.moveTo(X(xx) + 0.5, fy); ctx.lineTo(X(xx) + 0.5, R.y1); ctx.stroke(); }
      ctx.fillStyle = '#5c6670'; ctx.fillRect(x0, Y(62), w, 4); ctx.fillRect(x0, fy - 2, w, 4); for (let xx = 10; xx < w; xx += 22) ctx.fillRect(X(xx), Y(44), 3, 26);   // railing
      const planter = (px, py, i) => { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(X(px) + 3, Y(py) + 4, 72, 26); ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, X(px), Y(py), 72, 26, 4); ctx.fill(); ctx.fillStyle = '#3f9a4a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(X(px) + 10 + k * 13, Y(py) - 2, 7, 0, Math.PI * 2); ctx.fill(); } const cols = ['#ff8fab', '#ffd166', '#ff6b6b', '#9ad0ff', '#fff']; for (let k = 0; k < 5; k++) { ctx.fillStyle = cols[(k + i) % 5]; ctx.beginPath(); ctx.arc(X(px) + 10 + k * 13, Y(py) - 9 + Math.sin(t * 2 + k) * 1.5, 3.5, 0, Math.PI * 2); ctx.fill(); } };
      planter(28, 124, 0); planter(500, 124, 2);
      ctx.fillStyle = '#c62828'; U.roundRect(ctx, X(73), Y(184), 34, 22, 4); ctx.fill(); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(X(88), Y(150), 6, 36); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(X(91) + Math.sin(t * 1.2) * 2, Y(138), 22, 0, Math.PI * 2); ctx.arc(X(77) + Math.sin(t * 1.2) * 2, Y(150), 14, 0, Math.PI * 2); ctx.arc(X(107) + Math.sin(t * 1.2) * 2, Y(150), 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff6b6b'; for (const [dx, dy] of [[-8, -6], [6, 2], [12, -10]]) { ctx.beginPath(); ctx.arc(X(91) + dx, Y(140) + dy, 3, 0, Math.PI * 2); ctx.fill(); }   // a little apple tree
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(X(363), Y(202), 76, 20); for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#3b7dd8'; ctx.fillRect(X(360) + k * 13, Y(196), 13, 22); } ctx.fillStyle = '#5c6670'; ctx.fillRect(X(360), Y(218), 76, 3);
      person(386, 216, { shirt: '#e4572e', skin: '#e0ac69', hair: '#5a3a1a', hairStyle: 3, facing: 1, moving: false, carry: 0 }); ctx.fillStyle = '#ffd166'; ctx.fillRect(X(396), Y(194), 14, 10); ctx.fillStyle = '#2b1d14'; ctx.fillRect(X(398), Y(197), 10, 1); ctx.fillRect(X(398), Y(200), 10, 1);   // reading a book
      if (near(386, 216, 70)) bubble(X(386), Y(158), 'Lovely day up here!', 128);
      // a picnic blanket with a pizza box
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, X(200), Y(226), 60, 30, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 4; k++) ctx.fillRect(X(200), Y(230) + k * 8, 60, 2); r.drawPizza(X(230), Y(240), 10);
      for (const b of st.roofPigeons) { const bx = X(b.x), by = Y(b.y) - b.lift, fc = b.facing; ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(bx, Y(b.y) + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8f96a3'; ctx.beginPath(); ctx.ellipse(bx, by - 4, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b7480'; ctx.beginPath(); ctx.arc(bx + fc * 6, by - 7 + (b.state === 'walk' && Math.floor(t * 3) % 2 ? 2 : 0), 3.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c42'; ctx.fillRect(bx + fc * 8, by - 8, fc * 3, 2); if (b.lift > 0) { const wv = Math.sin(b.flap) * 7; ctx.fillStyle = '#b8c0cc'; ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx - 9, by - 9 - wv); ctx.lineTo(bx - 3, by - 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx + 9, by - 9 - wv); ctx.lineTo(bx + 3, by - 2); ctx.closePath(); ctx.fill(); } }
      const tl = this.telescope();
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(tl.x + 2, tl.y + 10, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tl.x, tl.y - 22); ctx.lineTo(tl.x - 13, tl.y + 8); ctx.moveTo(tl.x, tl.y - 22); ctx.lineTo(tl.x + 13, tl.y + 8); ctx.moveTo(tl.x, tl.y - 22); ctx.lineTo(tl.x, tl.y + 8); ctx.stroke();
      ctx.save(); ctx.translate(tl.x, tl.y - 26); ctx.rotate(-0.5); ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -12, -7, 38, 14, 6); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, 20, -9, 9, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-8, -5, 24, 3); ctx.restore();
      label(tl.x - 4, tl.y + 24, '🔭 LOOK!');
    }
  },

  // ---------- screen-space: the elevator button panel, the ride cut-scene, and the telescope view ----------
  screen(r, g) {
    const st = this.st; if (!st || g.area !== 'city' || !this.floor) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (this.viewing) { this.drawTelescope(r, g, W, H); return; }
    const L = st.lift;
    if (L && L.phase !== 'out') { this.drawLiftScene(r, g, W, H); return; }
    if (st.panel) this.drawPanel(r, g, W, H);
  },

  // a real elevator panel: round buttons 6 down to 1, the current floor lit, the highlight moved with the stick
  drawPanel(r, g, W, H) {
    const ctx = r.ctx, T = CFG.CITY.TOWER, P = this.st.panel, f = this.floor, wide = W >= 640, t = g.time;
    const pw = wide ? 236 : 150, rowH = wide ? 42 : 40, ph = 54 + rowH * T.floors + 40, px = W - pw - 12, py = Math.max(64, Math.min(H / 2 - ph / 2, H - ph - 90));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, px + 4, py + 6, pw, ph, 14); ctx.fill();
    const steel = ctx.createLinearGradient(px, 0, px + pw, 0); steel.addColorStop(0, '#8a9099'); steel.addColorStop(0.5, '#c9ccd2'); steel.addColorStop(1, '#8a9099');
    ctx.fillStyle = steel; U.roundRect(ctx, px, py, pw, ph, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; U.roundRect(ctx, px + 6, py + 6, pw - 12, ph - 12, 10); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, px + 14, py + 12, pw - 28, 30, 6); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.font = r.font(wide ? 13 : 11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`🛗 FLOOR ${f}`, px + pw / 2, py + 27);
    for (let i = T.floors; i >= 1; i--) {
      const cy = py + 54 + (T.floors - i) * rowH + rowH / 2, bx = px + 32, here = i === f, sel = i === P.sel, glow = sel && P.flash > 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(bx + 1, cy + 2, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = sel ? (glow ? '#fff3b0' : '#ffd166') : here ? '#ffb347' : '#e6e8eb'; ctx.beginPath(); ctx.arc(bx, cy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sel ? '#e4572e' : 'rgba(0,0,0,0.35)'; ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
      if (here) { ctx.strokeStyle = `rgba(255,122,26,${0.5 + 0.4 * Math.sin(t * 5)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, cy, 20, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.fillText(String(i), bx, cy + 1);
      ctx.font = r.font(wide ? 12 : 13); ctx.textAlign = 'left'; ctx.fillStyle = sel ? '#2b1d14' : '#3a3f45';
      ctx.fillText(wide ? `${T.icons[i]}  ${T.names[i]}` : T.icons[i], bx + 26, cy + 1);
      if (sel) { ctx.fillStyle = '#e4572e'; ctx.font = r.font(12); ctx.textAlign = 'right'; ctx.fillText('◀', px + pw - 14, cy + 1); }
      if (here && !sel && wide) { ctx.fillStyle = '#6f665c'; ctx.font = r.font(8); ctx.textAlign = 'right'; ctx.fillText('here', px + pw - 14, cy + 1); }
    }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(wide ? 10 : 9); ctx.textAlign = 'center'; ctx.fillText(wide ? '▲ ▼ choose  ·  ◀ ▶ step out' : '▲▼ choose · ◀▶ out', px + pw / 2, py + ph - 20);
  },

  // the ride, seen from inside the car: doors close, the counter ticks, the car hums and shakes, ding, doors open on the new floor
  drawLiftScene(r, g, W, H) {
    const ctx = r.ctx, T = CFG.CITY.TOWER, L = this.st.lift, t = g.time, Rd = T.ride, p = g.player;
    const cw = Math.min(W - 40, 560), ch = Math.min(H - 150, 380), cx = W / 2, cy = H / 2 + 10, x0 = cx - cw / 2, y0 = cy - ch / 2;
    const open = L.phase === 'closing' ? 1 - L.t / Rd.close : L.phase === 'opening' ? Math.min(1, L.t / Rd.open) : 0;
    const moving = L.phase === 'moving', shake = moving ? Math.sin(t * 43) * 1.6 + Math.sin(t * 29) * 0.8 : 0, dir = L.to > L.from ? 1 : -1;
    ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(shake, moving ? Math.cos(t * 37) * 1.2 : 0);
    // side walls, ceiling and floor in a little perspective; the far side is the door wall
    const inset = cw * 0.16, iy = ch * 0.16, ix0 = x0 + inset, ix1 = x0 + cw - inset, iy0 = y0 + iy, iy1 = y0 + ch - iy * 0.8;
    const wallGrad = (a, b, c) => { const gr = ctx.createLinearGradient(a, 0, b, 0); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); return gr; };
    ctx.fillStyle = wallGrad(x0, ix0, ['#6e7681', '#aeb4bb']); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ix0, iy0); ctx.lineTo(ix0, iy1); ctx.lineTo(x0, y0 + ch); ctx.closePath(); ctx.fill();
    ctx.fillStyle = wallGrad(ix1, x0 + cw, ['#aeb4bb', '#6e7681']); ctx.beginPath(); ctx.moveTo(x0 + cw, y0); ctx.lineTo(ix1, iy0); ctx.lineTo(ix1, iy1); ctx.lineTo(x0 + cw, y0 + ch); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cw, y0); ctx.lineTo(ix1, iy0); ctx.lineTo(ix0, iy0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3f45'; ctx.beginPath(); ctx.moveTo(x0, y0 + ch); ctx.lineTo(x0 + cw, y0 + ch); ctx.lineTo(ix1, iy1); ctx.lineTo(ix0, iy1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 10 + k * (ch - 20) / 14); ctx.lineTo(ix0, iy0 + 6 + k * (iy1 - iy0 - 12) / 14); ctx.lineTo(ix0, iy0 + 8 + k * (iy1 - iy0 - 12) / 14); ctx.lineTo(x0 + 6, y0 + 13 + k * (ch - 20) / 14); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x0 + cw - 6, y0 + 10 + k * (ch - 20) / 14); ctx.lineTo(ix1, iy0 + 6 + k * (iy1 - iy0 - 12) / 14); ctx.lineTo(ix1, iy0 + 8 + k * (iy1 - iy0 - 12) / 14); ctx.lineTo(x0 + cw - 6, y0 + 13 + k * (ch - 20) / 14); ctx.closePath(); ctx.fill(); }   // brushed metal
    ctx.fillStyle = '#fff8e6'; U.roundRect(ctx, cx - cw * 0.18, y0 + 8, cw * 0.36, 8, 4); ctx.fill();   // ceiling light
    // the door wall: the doors slide apart onto the floor we are leaving / arriving at
    const dw = ix1 - ix0, dh = iy1 - iy0, col = T.wallColors[L.phase === 'closing' ? L.from : L.to];
    ctx.fillStyle = col; ctx.fillRect(ix0, iy0, dw, dh); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(ix0, iy1 - dh * 0.3, dw, dh * 0.3);
    ctx.fillStyle = `rgba(255,255,255,${0.35 * open})`; ctx.fillRect(ix0, iy0, dw, dh);
    const half = dw / 2 * (1 - open);
    const door = (x, wdt) => { const gr = ctx.createLinearGradient(x, 0, x + wdt, 0); gr.addColorStop(0, '#b4bac1'); gr.addColorStop(0.5, '#d8dce1'); gr.addColorStop(1, '#b4bac1'); ctx.fillStyle = gr; ctx.fillRect(x, iy0, wdt, dh); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x, iy0, wdt, 4); ctx.fillRect(x, iy1 - 4, wdt, 4); };
    if (half > 0) { door(ix0, half); door(ix1 - half, half); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(ix0 + half - 2, iy0, 2, dh); ctx.fillRect(ix1 - half, iy0, 2, dh); }
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 6; ctx.strokeRect(ix0, iy0, dw, dh);
    // the indicator above the doors
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 50, iy0 - 30, 100, 24, 6); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const blink = moving && Math.floor(t * 4) % 2 === 0;
    ctx.fillText(`${moving ? (dir > 0 ? '▲' : '▼') : ''} ${L.shown}`, cx, iy0 - 18); if (blink) { ctx.fillStyle = 'rgba(255,122,26,0.35)'; ctx.fillText(dir > 0 ? '▲' : '▼', cx - 22, iy0 - 18); }
    // handrails on both side walls and the button panel on the right
    ctx.strokeStyle = '#e6e8eb'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + 10, y0 + ch * 0.56); ctx.lineTo(ix0 - 2, iy0 + dh * 0.56); ctx.moveTo(x0 + cw - 10, y0 + ch * 0.56); ctx.lineTo(ix1 + 2, iy0 + dh * 0.56); ctx.stroke(); ctx.lineCap = 'butt';
    const bpx = x0 + cw - inset * 0.55, bpy = y0 + ch * 0.26;
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, bpx - 14, bpy - 10, 28, 24 * 6 / 1.6 + 20, 6); ctx.fill();
    for (let i = T.floors; i >= 1; i--) { const by = bpy + (T.floors - i) * 15; const lit = i === L.to; ctx.fillStyle = lit ? '#ffd166' : i === L.from ? '#ffb347' : '#e6e8eb'; ctx.beginPath(); ctx.arc(bpx, by, 6, 0, Math.PI * 2); ctx.fill(); if (lit) { ctx.fillStyle = `rgba(255,209,102,${0.3 + 0.3 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(bpx, by, 10, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.fillText(String(i), bpx, by + 1); }
    // the chef standing in the car (bigger than life), bobbing a little with the ride
    const sc = Math.min(2.4, ch / 170), bob = moving ? Math.sin(t * 12) * 1.5 : 0;
    ctx.save(); ctx.translate(cx, iy1 + dh * 0.02 + bob); ctx.scale(sc, sc);
    r.drawPerson(0, 0, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: p.carry, pants: '#2d3a4a' });
    ctx.restore();
    ctx.restore();
    // what is happening
    const msg = L.phase === 'closing' ? '🛗 Doors closing…' : moving ? `🛗 Going ${dir > 0 ? 'up' : 'down'} to ${T.names[L.to]} ${T.icons[L.to]}` : `🛗 Ding! ${T.names[L.to]} ${T.icons[L.to]}`;
    const bw = Math.min(W - 24, 360);
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, cx - bw / 2, H - 110, bw, 40, 12); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 300 ? 13 : 16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, cx, H - 90);
  },

  // Through the telescope: a wide panorama laid out by the real geography. Left end looks north-west (the snowy
  // mountains and, far away, the pizza town), then west (Construction Town, nearest), south-west (the sea and
  // the Islands) and, at the right end, south over the open sea. The stick pans; near layers move more than far ones.
  drawTelescope(r, g, W, H) {
    const E = this, ctx = r.ctx, t = g.time, v = this.viewing, cx = W / 2, cy = H / 2, Rv = Math.min(W, H) * 0.46, D = Rv * 2, fade = Math.min(1, v.t / 0.5);
    const f = v.f, hz = cy + Rv * 0.05, S = Rv / 240;
    const bump = v.bump > 0 ? Math.sin(v.bump * 24) * 5 * v.bump * v.bumpDir : 0, bob = Math.cos(t * 0.37) * 2;
    // sx: where something that sits centred at pan fraction fc, on a layer with parallax k, lands on screen
    const sx = (fc, k) => cx + (fc - f) * 2 * D * k + bump * k;
    ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Rv, 0, Math.PI * 2); ctx.clip();
    ctx.translate(0, bob);
    const sky = ctx.createLinearGradient(0, cy - Rv, 0, hz); sky.addColorStop(0, '#5fb6ee'); sky.addColorStop(1, '#dff3ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // sky layer: the sun to the south, clouds, birds
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(sx(0.92, 0.3), cy - Rv * 0.5, Rv * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 9; i++) { const mx = sx(-0.3 + i * 0.2, 0.3) + ((t * 6 + i * 50) % 80), my = cy - Rv * (0.78 - (i % 3) * 0.14); ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.arc(mx + 14, my - 7, 15, 0, Math.PI * 2); ctx.arc(mx + 30, my, 11, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const bx = sx(0.55 + i * 0.12, 0.45) + ((t * 22 + i * 90) % 160) - 80, by = cy - Rv * (0.4 + (i % 3) * 0.08) + Math.sin(t * 3 + i) * 4, fl = Math.sin(t * 9 + i) * 3; ctx.beginPath(); ctx.moveTo(bx - 7, by); ctx.quadraticCurveTo(bx - 3, by - 4 - fl, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4 - fl, bx + 7, by); ctx.stroke(); }
    // far layer (k 0.7): the snowy mountains along the north, fading out towards the west
    const K1 = 0.7;
    ctx.fillStyle = '#7f8fb3'; ctx.beginPath(); ctx.moveTo(sx(-0.6, K1), hz); for (let i = 0; i <= 14; i++) { const fc = -0.6 + i * 0.065, hgt = Rv * (0.14 + 0.22 * Math.abs(Math.sin(i * 2.3))) * U.clamp((0.45 - fc) / 0.25, 0, 1); ctx.lineTo(sx(fc, K1), hz - 4); ctx.lineTo(sx(fc + 0.032, K1), hz - hgt); } ctx.lineTo(sx(0.6, K1), hz); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i <= 14; i++) { const fc = -0.6 + i * 0.065, hgt = Rv * (0.14 + 0.22 * Math.abs(Math.sin(i * 2.3))) * U.clamp((0.45 - fc) / 0.25, 0, 1); if (hgt < Rv * 0.1) continue; const px = sx(fc + 0.032, K1), peak = hz - hgt; ctx.beginPath(); ctx.moveTo(px, peak); ctx.lineTo(px + 12, peak + 14); ctx.lineTo(px + 3, peak + 11); ctx.lineTo(px - 3, peak + 15); ctx.lineTo(px - 12, peak + 14); ctx.closePath(); ctx.fill(); }
    // the land: green to the west, the sea from the south-west round to the south
    ctx.fillStyle = '#5fa84f'; ctx.fillRect(0, hz, W, H);
    ctx.fillStyle = '#6cb35a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(sx(-0.4 + i * 0.2, K1), hz + 4, Rv * 0.5, Rv * 0.1, 0, Math.PI, 0); ctx.fill(); }
    const seaX = sx(0.52, 0.85);
    ctx.fillStyle = '#4aa3d8'; ctx.fillRect(seaX, hz - 2, W + D * 3, H); ctx.fillStyle = '#2f86bd'; ctx.fillRect(seaX, hz - 2, W + D * 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 24; i++) { const wx = sx(0.5 + (i % 8) * 0.09, 0.85) + ((t * 10 + i * 37) % 60), wy = hz + 6 + Math.floor(i / 8) * Rv * 0.1 + (i % 3) * 6; if (wx > seaX) ctx.fillRect(wx, wy, 14, 2); }
    ctx.fillStyle = '#e8d49a'; ctx.beginPath(); ctx.moveTo(seaX - 14, hz - 2); ctx.lineTo(seaX + 2, hz - 2); for (let yy = hz; yy < H; yy += 20) ctx.lineTo(seaX + 2 + Math.sin(yy * 0.08 + t * 0.5) * 4, yy); ctx.lineTo(seaX - 14, H); ctx.closePath(); ctx.fill();   // a sandy shore where the land meets the sea
    // the pizza town, far away to the north-west on its hill: small and hazy
    { const ox = sx(0.14, K1), oy = hz - Rv * 0.05, s2 = S * 0.72; ctx.save(); ctx.globalAlpha = 0.82; ctx.translate(ox, oy); ctx.scale(s2, s2);
      ctx.fillStyle = '#8bc34a'; ctx.beginPath(); ctx.ellipse(0, 6, 190, 22, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; for (const dx of [-170, -140, 70, 100, 150]) { ctx.fillRect(dx - 2, -14, 4, 14); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(dx, -18, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b4a2b'; }
      ctx.fillStyle = '#b23a48'; ctx.fillRect(-122, -24, 30, 24); ctx.fillStyle = '#8a2a36'; ctx.beginPath(); ctx.moveTo(-125, -24); ctx.lineTo(-107, -36); ctx.lineTo(-89, -24); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-88, -40, 10, 40); ctx.beginPath(); ctx.arc(-83, -40, 5, Math.PI, 0); ctx.fill();   // barn + silo
      ctx.fillStyle = '#c98a4b'; ctx.fillRect(-62, -18, 28, 18); ctx.fillStyle = '#8a5527'; ctx.fillRect(-64, -22, 32, 5); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(-70, -6, 70, 3); ctx.fillStyle = '#c62828'; ctx.fillRect(-54 + ((t * 20) % 70), -12, 14, 6); ctx.fillStyle = '#2d8a5a'; ctx.fillRect(-70 + ((t * 20) % 70), -12, 14, 6);   // the station and a passing train
      ctx.fillStyle = '#f2c94c'; ctx.fillRect(-18, -30, 44, 30); ctx.fillStyle = '#c62828'; ctx.fillRect(-20, -36, 48, 6); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(-12, -22, 10, 8); ctx.fillRect(8, -22, 10, 8); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-1, -12, 8, 12);
      ctx.fillStyle = '#fff'; ctx.fillRect(-14, -48, 36, 12); ctx.fillStyle = '#e4572e'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA', 4, -42); r.drawPizza(24, -42, 5);   // the pizzeria and its sign
      ctx.fillStyle = '#f8bbd0'; ctx.fillRect(34, -24, 28, 24); ctx.fillStyle = '#c45c7a'; ctx.fillRect(32, -28, 32, 5); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(48, -34, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d9b382'; ctx.beginPath(); ctx.moveTo(44, -31); ctx.lineTo(52, -31); ctx.lineTo(48, -22); ctx.closePath(); ctx.fill();   // the ice cream shop with its cone
      ctx.restore(); }
    // the secret woods with the little cabin, at the town's far west end
    { const ox = sx(0.23, K1), oy = hz - Rv * 0.03, s2 = S * 0.7; ctx.save(); ctx.globalAlpha = 0.78; ctx.translate(ox, oy); ctx.scale(s2, s2);
      ctx.fillStyle = '#2f7a3e'; for (let i = 0; i < 9; i++) { const dx = -70 + i * 17, hgt = 26 + (i % 3) * 8; ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx + 8, -hgt); ctx.lineTo(dx + 16, 0); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(-10, -16, 24, 16); ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(-13, -16); ctx.lineTo(2, -26); ctx.lineTo(17, -16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(-4, -11, 5, 5); ctx.fillStyle = '#5c6670'; ctx.fillRect(7, -24, 4, 7);
      for (let i = 0; i < 3; i++) { const age = ((t * 0.5 + i * 0.33) % 1); ctx.fillStyle = `rgba(230,230,230,${0.6 * (1 - age)})`; ctx.beginPath(); ctx.arc(9 + age * 10 + Math.sin(age * 6) * 3, -26 - age * 22, 2 + age * 5, 0, Math.PI * 2); ctx.fill(); }   // chimney smoke
      ctx.restore(); }
    // mid layer (k 0.85): Construction Town due west, the nearest neighbour
    const K2 = 0.85;
    { const ox = sx(0.4, K2), oy = hz + Rv * 0.06; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      ctx.fillStyle = '#c9a46a'; ctx.beginPath(); ctx.ellipse(0, 4, 150, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7a1a'; for (let k = -140; k < 150; k += 24) ctx.fillRect(k, -2, 14, 4);
      for (const [mx, mr] of [[-100, 16], [60, 14], [120, 12]]) { ctx.fillStyle = '#7a4f2a'; ctx.beginPath(); ctx.ellipse(mx, -2, mr, mr * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#95643a'; ctx.beginPath(); ctx.ellipse(mx - 2, -6, mr * 0.6, mr * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#b9b5ad'; ctx.fillRect(-60, -34, 70, 34); ctx.fillStyle = '#b5543a'; ctx.fillRect(-60, -34, 70, 6); ctx.fillRect(-60, -34, 6, 34); ctx.fillRect(4, -34, 6, 34); ctx.fillStyle = '#9a9a9a'; for (let k = -56; k < 10; k += 16) ctx.fillRect(k, -48, 2, 16); ctx.fillRect(-56, -48, 64, 2); ctx.fillStyle = '#c99a5f'; ctx.fillRect(-54, -44, 60, 4);   // the half-built house with scaffolding
      ctx.fillStyle = '#f2b705'; ctx.fillRect(28, -96, 5, 96); ctx.save(); ctx.translate(30, -94); ctx.rotate(Math.sin(t * 0.25) * 0.35 - 0.15); ctx.fillRect(-16, -2, 70, 4); ctx.fillStyle = '#2b1d14'; for (let k = -12; k < 50; k += 10) ctx.fillRect(k, -1, 2, 2); ctx.restore(); ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff3b3b' : '#ffb3b3'; ctx.beginPath(); ctx.arc(30, -98, 3, 0, Math.PI * 2); ctx.fill();   // the crane
      const ex = -118 + Math.sin(t * 0.4) * 12, arm = Math.sin(t * 2) * 4; ctx.fillStyle = '#2b2b2b'; ctx.fillRect(ex - 14, -6, 28, 6); ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(ex, -12, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(ex + 4, -14 + arm, 18, 4); ctx.fillStyle = '#5c5c5c'; ctx.fillRect(ex + 20, -18 + arm, 6, 8);   // the excavator
      ctx.restore(); }
    // the Islands to the south-west: palms, the lighthouse with its beam, the ferry, a jet ski, a dolphin
    { const ox = sx(0.68, K2), oy = hz + Rv * 0.05; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      for (const [ix, iw] of [[-90, 50], [40, 60]]) { ctx.fillStyle = '#e8d49a'; ctx.beginPath(); ctx.ellipse(ix, 0, iw, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#79b85e'; ctx.beginPath(); ctx.ellipse(ix, -3, iw * 0.7, 8, 0, 0, Math.PI * 2); ctx.fill(); for (const dx of [-14, 12]) { ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix + dx, -4); ctx.quadraticCurveTo(ix + dx + 4, -18, ix + dx + 2, -30); ctx.stroke(); ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 2.5; for (let k = 0; k < 5; k++) { const an = -Math.PI / 2 + (k - 2) * 0.55 + Math.sin(t * 2 + k) * 0.05; ctx.beginPath(); ctx.moveTo(ix + dx + 2, -30); ctx.lineTo(ix + dx + 2 + Math.cos(an) * 14, -30 + Math.sin(an) * 14 + 6); ctx.stroke(); } } }
      const lx = 72, ly = -4; ctx.fillStyle = '#fff'; ctx.fillRect(lx - 5, ly - 34, 10, 34); ctx.fillStyle = '#e4572e'; ctx.fillRect(lx - 5, ly - 26, 10, 6); ctx.fillRect(lx - 5, ly - 14, 10, 6); ctx.fillStyle = '#2b1d14'; ctx.fillRect(lx - 6, ly - 40, 12, 7); ctx.fillStyle = `rgba(255,224,138,${0.7 + 0.3 * Math.sin(t * 2.5)})`; ctx.fillRect(lx - 4, ly - 39, 8, 5);
      const ba = t * 0.6; ctx.fillStyle = `rgba(255,224,138,${0.3 + 0.15 * Math.sin(t * 4)})`; ctx.beginPath(); ctx.moveTo(lx, ly - 37); ctx.lineTo(lx + Math.cos(ba) * 70, ly - 37 + Math.sin(ba) * 18 - 10); ctx.lineTo(lx + Math.cos(ba) * 70, ly - 37 + Math.sin(ba) * 18 + 10); ctx.closePath(); ctx.fill();   // the lighthouse and its sweeping beam
      const fu = (t * 0.12) % 2, fx = -200 + (fu < 1 ? fu : 2 - fu) * 150, fdir = fu < 1 ? 1 : -1; ctx.fillStyle = '#2d5a8a'; ctx.beginPath(); ctx.moveTo(fx - 22, 10); ctx.lineTo(fx + 22, 10); ctx.lineTo(fx + 16, 20); ctx.lineTo(fx - 16, 20); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(fx - 14, 0, 28, 10); ctx.fillStyle = '#e4572e'; ctx.fillRect(fx + fdir * 6 - 3, -8, 6, 8); for (let i = 0; i < 3; i++) { const age = ((t * 0.7 + i * 0.33) % 1); ctx.fillStyle = `rgba(235,235,235,${0.5 * (1 - age)})`; ctx.beginPath(); ctx.arc(fx + fdir * 6 - fdir * age * 14, -10 - age * 16, 2 + age * 4, 0, Math.PI * 2); ctx.fill(); }   // the ferry crossing
      const jx = -20 + Math.sin(t * 1.3) * 90, jdir = Math.cos(t * 1.3) > 0 ? 1 : -1, jy = 30 + Math.sin(t * 5) * 1.5; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(jx - jdir * 8, jy + 2); ctx.lineTo(jx - jdir * 40, jy - 2); ctx.lineTo(jx - jdir * 40, jy + 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(jx, jy, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(jx - jdir * 2, jy - 6, 3.5, 0, Math.PI * 2); ctx.fill();   // the jet ski zipping about
      const dph = (t * 0.5) % 1; if (dph < 0.5) { const k = dph / 0.5, dx = 120 + k * 50, dy = 26 - Math.sin(k * Math.PI) * 24; ctx.save(); ctx.translate(dx, dy); ctx.rotate((0.5 - k) * 1.2); ctx.fillStyle = '#6b7f99'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-18, -5); ctx.lineTo(-18, 5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, -9); ctx.lineTo(5, -3); ctx.closePath(); ctx.fill(); ctx.restore(); }   // a dolphin leaping
      ctx.restore(); }
    // the open sea to the south: a sailing boat and gulls on the water
    { const bx = sx(0.93, K2) + Math.sin(t * 0.3) * 10, by = hz + Rv * 0.16; ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.moveTo(bx - 16 * S, by); ctx.lineTo(bx + 16 * S, by); ctx.lineTo(bx + 11 * S, by + 7 * S); ctx.lineTo(bx - 11 * S, by + 7 * S); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(bx, by - 2); ctx.lineTo(bx, by - 30 * S); ctx.lineTo(bx + 14 * S, by - 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(bx - 2, by - 6); ctx.lineTo(bx - 2, by - 24 * S); ctx.lineTo(bx - 11 * S, by - 6); ctx.closePath(); ctx.fill(); }
    // the city's own rooftops in the foreground (they slide past fastest)
    const K3 = 1.25;
    for (let i = 0; i < 24; i++) { const bw = Rv * 0.26, bx = sx(-0.45 + i * 0.09, K3), bh = Rv * (0.28 + 0.22 * E.hash(i + 7)); ctx.fillStyle = i % 2 ? '#2d3a4a' : '#3a4a5c'; ctx.fillRect(bx, cy + Rv * 0.9 - bh, bw, bh + Rv); let row = 0; for (let yy = cy + Rv * 0.9 - bh + 10; yy < cy + Rv; yy += 14, row++) { let col = 0; for (let xx = bx + 8; xx < bx + bw - 8; xx += 16, col++) { const lit = E.winLit(i, row * 8 + col, t); if (lit > 0) { ctx.fillStyle = `rgba(255,224,138,${lit})`; ctx.fillRect(xx, yy, 6, 7); } } } }
    for (const fc of [0.05, 0.62, 1.1]) { const wx = sx(fc, K3); ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(wx, cy + Rv * 0.5, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(wx - 2, cy + Rv * 0.5, 4, 30); }   // water towers
    ctx.restore();
    // the eyepiece: black vignette, soft rim, crosshair, tick marks
    ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Rv, 0, Math.PI * 2, true); ctx.fill();
    const rim = ctx.createRadialGradient(cx, cy, Rv * 0.82, cx, cy, Rv); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, Rv, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - Rv, cy); ctx.lineTo(cx - 18, cy); ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + Rv, cy); ctx.moveTo(cx, cy - Rv); ctx.lineTo(cx, cy - 18); ctx.moveTo(cx, cy + 18); ctx.lineTo(cx, cy + Rv); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * (Rv - 10), cy + Math.sin(an) * (Rv - 10)); ctx.lineTo(cx + Math.cos(an) * Rv, cy + Math.sin(an) * Rv); ctx.stroke(); }
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, Rv + 3, 0, Math.PI * 2); ctx.stroke();
    // what is in the middle of the view, and the compass strip
    const spots = [[0, 'Snowy mountains ⛰️'], [0.14, 'There’s my pizza shop! 🍕'], [0.4, 'Construction Town! 🏗️'], [0.68, 'The Islands! 🏝️'], [0.93, 'The sea 🌊']];
    let best = null; for (const [fc, text] of spots) { const d = Math.abs(fc - f); if (d < 0.09 && (!best || d < best.d)) best = { d, text }; }
    const bw = Math.min(W - 24, 320);
    if (best) { ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, cx - bw / 2, H - 152, bw, 40, 12); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 300 ? 14 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(best.text, cx, H - 132); }
    const sw = Math.min(W - 40, 260), sy = H - 102;
    ctx.save(); ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, cx - sw / 2, sy - 13, sw, 26, 13); ctx.fill();
    ctx.beginPath(); ctx.rect(cx - sw / 2 + 24, sy - 13, sw - 48, 26); ctx.clip();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [fc, lab] of [[-0.08, 'N'], [0.14, 'NW'], [0.4, 'W'], [0.68, 'SW'], [0.93, 'S'], [1.18, 'SE']]) { const x = cx + (fc - f) * sw * 0.9; ctx.fillStyle = Math.abs(fc - f) < 0.08 ? '#ffe08a' : 'rgba(255,255,255,0.55)'; ctx.fillText(lab, x, sy + 1); }
    ctx.restore();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(cx - 5, sy - 13); ctx.lineTo(cx + 5, sy - 13); ctx.lineTo(cx, sy - 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f > 0.02 ? '#ffe08a' : 'rgba(255,255,255,0.3)'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.fillText('◀', cx - sw / 2 + 12, sy + 1); ctx.fillStyle = f < 0.98 ? '#ffe08a' : 'rgba(255,255,255,0.3)'; ctx.fillText('▶', cx + sw / 2 - 12, sy + 1);
    if (fade < 1) { ctx.fillStyle = `rgba(10,8,6,${1 - fade})`; ctx.fillRect(0, 0, W, H); }
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
      // to the City the bus drives right to left (as it does in town); home it drives left to right: mirror the scene
      const mirror = !home;
      const txt = (str, x, y) => { if (!mirror) { ctx.fillText(str, x, y); return; } ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.fillText(str, 0, 0); ctx.restore(); };
      ctx.save(); if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
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
          let wi = 0; for (let yy = gy - th + 24; yy < gy - 30; yy += 26) for (let xx = x + 18; xx < x + 150; xx += 28) { const lit = E.winLit(i, wi++, g.time); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(xx, yy, 16, 16); if (lit > 0) { ctx.fillStyle = `rgba(255,243,176,${lit})`; ctx.fillRect(xx, yy, 16, 16); } }
          for (let a = 0; a < 6; a++) { ctx.fillStyle = a % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(x + 36 + a * 15, gy - 30, 15, 8); }
          if (i % 4 === 1) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x + 120, gy - th - 26, 24, 26); ctx.beginPath(); ctx.moveTo(x + 118, gy - th - 26); ctx.lineTo(x + 132, gy - th - 40); ctx.lineTo(x + 146, gy - th - 26); ctx.fill(); }
        }
      });
      // the road under the bus: asphalt, a dashed centre line streaming past, kerb
      const ry = groundY + 30;
      ctx.fillStyle = '#474a50'; ctx.fillRect(0, ry, W, 70); ctx.fillStyle = '#cfc8b8'; ctx.fillRect(0, ry + 70, W, H - ry - 70); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, ry + 70, W, 3);
      layer(1, 44, (x, px, i, z) => { ctx.fillStyle = '#f2c94c'; ctx.fillRect(x, ry + 33, 24, 4); if (z === 2 && i % 9 === 0) { ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x, ry - 60, 4, 60); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 2, ry - 62, 6, 0, Math.PI * 2); ctx.fill(); } else if (z === 0 && i % 5 === 0) { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x, ry - 22, 5, 22); ctx.fillRect(x - 20, ry - 16, 46, 3); } });
      // a road sign goes by as the city comes into view
      layer(1, total + W, (x, px, i) => { if (i !== 0) return; const sx = x + total * 0.6; ctx.fillStyle = '#5c6670'; ctx.fillRect(sx, ry - 70, 5, 70); ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, sx - 50, ry - 96, 110, 30, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; txt(home ? 'PIZZA TOWN  ➜' : 'THE CITY  ➜', sx + 5, ry - 81); });
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
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -46, -124, 92, 20, 5); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; txt(home ? '🍕 PIZZA TOWN' : '🏙️ THE CITY', 0, -114);
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
      ctx.restore();
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
