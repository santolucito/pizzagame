'use strict';
// Inside the island buildings. Every building on the Islands has a door you can walk through ('🚪 Go inside'):
//  - the Lighthouse (from the tower's door or the keeper's cottage): a round stone room with the bearded keeper in his
//    rocking chair (say hi), his cat (pet it) and a spiral staircase; climb it ('🪜 Climb the stairs') to the lamp room
//    at the top, where the big lamp turns and throws its beams round the room and a telescope looks out to sea (ships,
//    the islands, the rocket);
//  - the Crab Shack: a seafood shack with a crab tank (wave at the crabs), nets and buoys, a cook at the counter, a
//    $4 circle for a crab-shaped cookie and a jukebox that plays a tune;
//  - the Coconut Hut: two hammocks to lie in (they sway, Zzz), a $3 coconut drink, tiki masks whose eyes follow you
//    and a ukulele that plays a chord each press;
//  - Mission Control on Rocket Island: a big screen showing the rocket being built, two consoles with workers in
//    headsets, and a big red button that starts a countdown… "Not yet! 🚧".
// The huts still order pizza: their doors are the delivery spots, and delivering happens on the doorstep as before.
// Reads its door spots from CFG.ISLANDS (js/islands.js, loaded first). The telescope uses the City's shared telescope
// helpers (CityExt.scopeStart / scopeUpdate / scopeBegin / scopeEnd).
// Extension module: registered with Game.ext (first, so its doors beat the islands' hints) and Render.ext.

CFG.ISLE_IN = {
  WALL: 24, FADE: 0.45, DOOR_R: 30, HINT_R: 70, NEAR: 40,
  ROOMS: {
    lighthouse: {
      name: 'Lighthouse', toast: '🗼 Welcome to the lighthouse!',
      WORLD: { x0: 6000, y0: 4000, x1: 6600, y1: 4400 }, ROOM: { x0: 6060, y0: 4110, x1: 6540, y1: 4340 }, BACK_TOP: 4020,
      EXIT: { x: 6250, y: 4322 },
      STAIRS: { x: 6140, y: 4160, r: 50 }, FOOT: { x: 6140, y: 4238 },        // the same spot on both floors
      KEEPER: { x: 6466, y: 4172 }, STOVE: { x: 6518, y: 4132 },
      TABLE: { x: 6300, y: 4150, w: 76, h: 40 }, RUG: { x: 6400, y: 4290 },
      CAT_SPOTS: [{ x: 6400, y: 4292 }, { x: 6350, y: 4250 }, { x: 6460, y: 4270 }, { x: 6300, y: 4300 }],
      ROPE: { x: 6086, y: 4314 },
      LAMP: { x: 6330, y: 4214 }, SCOPE: { x: 6494, y: 4152 },
      CLIMB: 1.3, KEEPER_LINES: ['Ahoy, chef! ⚓', 'The light keeps ships safe! 💡', 'Climb up and see the lamp!', 'My cat loves fish 🐟', 'Look! A rocket on that island! 🚀'],
    },
    crabshack: {
      name: 'Crab Shack', toast: '🦀 Welcome to the Crab Shack!',
      WORLD: { x0: 7000, y0: 4000, x1: 7600, y1: 4400 }, ROOM: { x0: 7040, y0: 4110, x1: 7560, y1: 4340 }, BACK_TOP: 4020,
      EXIT: { x: 7310, y: 4322 },
      TANK: { x0: 7062, y0: 4112, x1: 7212, y1: 4170 }, TANK_SPOT: { x: 7137, y: 4202 },
      COUNTER: { x0: 7300, y0: 4150, x1: 7536, y1: 4186 }, COOK: { x0: 7330, x1: 7500, y: 4140 },
      PAD: { x: 7418, y: 4240 }, PRICE: 4,
      JUKEBOX: { x0: 7506, y0: 4234, x1: 7556, y1: 4300 }, JUKE_SPOT: { x: 7482, y: 4282 },
      TABLES: [{ x: 7100, y: 4276 }, { x: 7220, y: 4296 }], SAILOR: { x: 7100, y: 4256 },
      JUKE_T: 6,
    },
    coconuthut: {
      name: 'Coconut Hut', toast: '🥥 Welcome to the Coconut Hut!',
      WORLD: { x0: 8000, y0: 4000, x1: 8600, y1: 4400 }, ROOM: { x0: 8040, y0: 4110, x1: 8560, y1: 4340 }, BACK_TOP: 4020,
      EXIT: { x: 8320, y: 4322 },
      HAMMOCKS: [{ x: 8150, y: 4172 }, { x: 8150, y: 4262 }], HALF: 62,
      BAR: { x0: 8384, y0: 4150, x1: 8540, y1: 4186 }, OWNER: { x: 8462, y: 4140 },
      PAD: { x: 8462, y: 4240 }, PRICE: 3,
      UKE: { x: 8296, y: 4156 }, UKE_SPOT: { x: 8296, y: 4206 },
      MASKS: [{ x: 8222, y: 4062, c: '#b86f2d' }, { x: 8292, y: 4058, c: '#8d5a2b' }, { x: 8362, y: 4062, c: '#a0522d' }],
      PLANTS: [{ x: 8072, y: 4318 }, { x: 8530, y: 4318 }],
      CHORDS: [[262, 330, 392], [349, 440, 523], [392, 494, 587], [220, 262, 330]],
    },
    missionctl: {
      name: 'Mission Control', toast: '🛰️ Welcome to Mission Control!',
      WORLD: { x0: 9000, y0: 4000, x1: 9600, y1: 4400 }, ROOM: { x0: 9040, y0: 4110, x1: 9560, y1: 4340 }, BACK_TOP: 4016,
      EXIT: { x: 9180, y: 4322 },
      SCREEN: { x0: 9160, y0: 4026, x1: 9440, y1: 4100 },
      DESKS: [{ x: 9140, y: 4170 }, { x: 9460, y: 4170 }], DESK_W: 130,
      BUTTON: { x: 9300, y: 4236 }, BTN_SPOT: { x: 9300, y: 4282 },
      MODEL: { x: 9522, y: 4300 }, COOLER: { x: 9070, y: 4296 },
      COUNT_T: 3.8,
    },
  },
};
for (const k of Object.keys(CFG.ISLE_IN.ROOMS)) CFG.AREAS[k] = { WORLD: CFG.ISLE_IN.ROOMS[k].WORLD };
// the doors outside, on the Islands map: just below each hut's door (where its pizzas are delivered), the lighthouse
// tower's door, and mission control's door on Rocket Island
CFG.ISLE_IN.DOORS = (() => {
  const I = CFG.ISLANDS, isle = (k) => I.ISLANDS.find((s) => s.key === k), M = I.ROCKET.MISSION, out = [];
  const lh = isle('lighthouse');
  out.push({ room: 'lighthouse', x: lh.tower.x, y: lh.tower.y + 23, text: 'Go inside the lighthouse! 🗼' });
  out.push({ room: 'lighthouse', x: lh.hut.x, y: lh.hut.y + 54, hut: 'lighthouse', text: 'Visit the lighthouse keeper! 🗼' });
  const cr = isle('crab'); out.push({ room: 'crabshack', x: cr.hut.x, y: cr.hut.y + 54, hut: 'crab', text: 'Go inside the Crab Shack! 🦀' });
  const co = isle('coconut'); out.push({ room: 'coconuthut', x: co.hut.x, y: co.hut.y + 54, hut: 'coconut', text: 'Go inside the Coconut Hut! 🥥' });
  out.push({ room: 'missionctl', x: M.x, y: M.y + M.h / 2 + 20, text: 'Go inside Mission Control! 🛰️' });
  return out;
})();

// what the lighthouse telescope shows across its view (left = south-west, right = east), and its compass strip
const LH_SCOPE_SPOTS = [[0.04, 'Pizza Island! 🍕'], [0.24, 'A big ship! 🚢'], [0.44, 'The Crab Shack! 🦀'], [0.64, 'Rocket Island! 🚀'], [0.84, 'A sailboat! ⛵'], [1.02, 'A whale! 🐳']];
const LH_SCOPE_COMPASS = [[-0.12, 'W'], [0.2, 'SW'], [0.5, 'S'], [0.8, 'SE'], [1.12, 'E']];

const IslandsInsideExt = {
  name: 'islandsInside',
  defaults: { isleIn: { seen: {}, hellos: 0, pets: 0, climbs: 0, looks: 0, waves: 0, cookies: 0, songs: 0, naps: 0, drinks: 0, strums: 0, presses: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    if (!g.s.isleIn) g.s.isleIn = JSON.parse(JSON.stringify(this.defaults.isleIn));
    for (const [k, v] of Object.entries(this.defaults.isleIn)) if (g.s.isleIn[k] === undefined) g.s.isleIn[k] = JSON.parse(JSON.stringify(v));
    const L = CFG.ISLE_IN.ROOMS.lighthouse;
    this.st = {
      fade: 0, from: -1,
      // lighthouse: on the top floor?, climbing the stairs { t, up }, the keeper's bubble, the cat, the telescope
      up: false, climb: null, viewing: null, keeper: null, keeperN: 0,
      cat: { x: L.CAT_SPOTS[0].x, y: L.CAT_SPOTS[0].y, to: 0, wait: 2, facing: 1, moving: false, purr: 0 },
      // crab shack: crabs in the tank, the cook, the jukebox
      tankWave: 0, cook: { x: 7420, dir: 1, fry: 0 }, juke: 0, notes: [],
      crabs: [0, 1, 2].map((i) => ({ x: 7080 + i * 44, dir: i % 2 ? -1 : 1, step: 0 })),
      // coconut hut: lying in a hammock { i, t }, the ukulele
      lie: null, strum: 0, strumN: 0,
      // mission control: the countdown on the big screen
      count: null,
      obs: {},
    };
    for (const k of Object.keys(CFG.ISLE_IN.ROOMS)) this.st.obs[k] = this.roomObstacles(k, false);
    this.st.obs.lamproom = this.roomObstacles('lighthouse', true);
  },
  room(g) { return CFG.ISLE_IN.ROOMS[g.area] ? g.area : null; },
  roomObstacles(k, up) {
    const R = CFG.ISLE_IN.ROOMS[k], A = R.ROOM, w = CFG.ISLE_IN.WALL, o = [];
    const box = (x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    o.push({ x: A.x0 - w, y: A.y0 - w, w: A.x1 - A.x0 + 2 * w, h: w }, { x: A.x0 - w, y: A.y1, w: A.x1 - A.x0 + 2 * w, h: w });
    o.push({ x: A.x0 - w, y: A.y0, w, h: A.y1 - A.y0 }, { x: A.x1, y: A.y0, w, h: A.y1 - A.y0 });
    if (k === 'lighthouse') {
      const S = R.STAIRS;
      box(S.x - S.r, A.y0, S.x + S.r, S.y + S.r);                                   // the staircase / the stairwell's railing
      if (up) {
        box(R.LAMP.x - 46, R.LAMP.y - 50, R.LAMP.x + 46, R.LAMP.y + 18);           // the lamp on its pedestal
        box(R.SCOPE.x - 12, R.SCOPE.y - 12, R.SCOPE.x + 12, R.SCOPE.y + 8);        // the telescope's tripod
      } else {
        const K = R.KEEPER, T = R.TABLE;
        box(K.x - 24, K.y - 26, K.x + 24, K.y + 16);                                // the keeper's rocking chair
        box(R.STOVE.x - 20, A.y0, R.STOVE.x + 20, R.STOVE.y + 20);                  // the stove
        box(T.x - T.w / 2, T.y - T.h / 2, T.x + T.w / 2, T.y + T.h / 2);            // the table
        box(R.ROPE.x - 18, R.ROPE.y - 12, R.ROPE.x + 18, R.ROPE.y + 12);            // a coil of rope and the anchor
      }
    } else if (k === 'crabshack') {
      const T = R.TANK, C = R.COUNTER, J = R.JUKEBOX;
      box(T.x0, A.y0, T.x1, T.y1); box(C.x0, A.y0, C.x1, C.y1); box(J.x0, J.y0, J.x1, J.y1);
      for (const t of R.TABLES) box(t.x - 26, t.y - 16, t.x + 26, t.y + 14);
    } else if (k === 'coconuthut') {
      const B = R.BAR, U2 = R.UKE;
      for (const h of R.HAMMOCKS) box(h.x - R.HALF - 6, h.y - 10, h.x + R.HALF + 6, h.y + 8);
      box(B.x0, A.y0, B.x1, B.y1); box(U2.x - 16, U2.y - 16, U2.x + 16, U2.y + 18);
      for (const p of R.PLANTS) box(p.x - 14, p.y - 14, p.x + 14, p.y + 12);
    } else if (k === 'missionctl') {
      for (const d of R.DESKS) box(d.x - R.DESK_W / 2, A.y0, d.x + R.DESK_W / 2, d.y + 16);
      const B = R.BUTTON; box(B.x - 18, B.y - 14, B.x + 18, B.y + 14);
      box(R.MODEL.x - 16, R.MODEL.y - 16, R.MODEL.x + 16, R.MODEL.y + 14); box(R.COOLER.x - 14, R.COOLER.y - 16, R.COOLER.x + 14, R.COOLER.y + 14);
    }
    return o;
  },
  curObs(g) { const k = this.room(g); if (!k || !this.st) return []; return k === 'lighthouse' && this.st.up ? this.st.obs.lamproom : this.st.obs[k]; },
  free(g, x, y) {
    const k = this.room(g); if (!k) return true;
    const A = CFG.ISLE_IN.ROOMS[k].ROOM, r = 12;
    if (x < A.x0 + r || x > A.x1 - r || y < A.y0 + r || y > A.y1 - r) return false;
    return !this.curObs(g).some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h);
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  near(g, s, r) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < (r || CFG.ISLE_IN.NEAR); },
  doorAt(g, r) {
    if (g.area !== 'islands' || !this.onFoot(g)) return -1;
    const p = g.player; let best = -1, bd = r;
    CFG.ISLE_IN.DOORS.forEach((d, i) => { const dd = U.dist(p.x, p.y, d.x, d.y); if (dd < bd) { bd = dd; best = i; } });
    return best;
  },
  // a hut waiting for pizza that the chef is carrying: its delivery hint is more important than the door's
  hutWants(g, d) {
    if (!d.hut || g.player.carry <= 0 || typeof IslandsExt === 'undefined' || !IslandsExt.rt) return false;
    const h = IslandsExt.rt.huts.find((q) => q.key === d.hut); return !!(h && h.order);
  },
  busy() { const st = this.st; return !!(st.climb || st.viewing || st.lie); },

  // ---------- game hooks ----------
  obstacles(g) { return this.curObs(g); },
  action(g) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player;
    const di = this.doorAt(g, CFG.ISLE_IN.DOOR_R);
    if (di >= 0) return { label: '🚪 Go inside', run: (gg) => this.enter(gg, di) };
    const k = this.room(g); if (!k || !this.onFoot(g)) return null;
    const R = CFG.ISLE_IN.ROOMS[k];
    if (st.climb) return null;
    if (st.viewing) return { label: '🚶 Done looking', run: () => { st.viewing = null; Haptics.tap(); } };
    if (st.lie) return { label: '🚶 Get up', run: (gg) => this.getUp(gg) };
    if (!(k === 'lighthouse' && st.up) && this.near(g, R.EXIT, CFG.ISLE_IN.DOOR_R)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (k === 'lighthouse') {
      if (this.near(g, R.FOOT, 36)) return st.up ? { label: '🪜 Go down the stairs', run: (gg) => this.startClimb(gg, false) } : { label: '🪜 Climb the stairs', run: (gg) => this.startClimb(gg, true) };
      if (st.up) { if (this.near(g, R.SCOPE, 48) && typeof CityExt !== 'undefined' && CityExt.scopeStart) return { label: '🔭 Look through the telescope', run: (gg) => this.look(gg) }; return null; }
      if (this.near(g, R.KEEPER, 58)) return { label: '👋 Say hi to the keeper', run: (gg) => this.sayHi(gg) };
      if (this.near(g, st.cat, 44)) return { label: '🐱 Pet the cat', run: (gg) => this.petCat(gg) };
    } else if (k === 'crabshack') {
      if (this.near(g, R.TANK_SPOT, 40)) return { label: '🦀 Wave at the crabs', run: (gg) => this.waveCrabs(gg) };
      if (this.near(g, R.JUKE_SPOT, 40)) return { label: '🎵 Play the jukebox', run: (gg) => this.playJuke(gg) };
    } else if (k === 'coconuthut') {
      const hi = R.HAMMOCKS.findIndex((h) => U.dist(p.x, p.y, h.x, h.y + 28) < 44);
      if (hi >= 0) return { label: '🌴 Lie in the hammock', run: (gg) => this.lieDown(gg, hi) };
      if (this.near(g, R.UKE_SPOT, 40)) return { label: '🎶 Play the ukulele', run: (gg) => this.strum(gg) };
    } else if (k === 'missionctl') {
      if (this.near(g, R.BTN_SPOT, 40) && !st.count) return { label: '🔴 Press the big red button', run: (gg) => this.pressButton(gg) };
    }
    return null;
  },
  enter(g, i) {
    const d = CFG.ISLE_IN.DOORS[i], R = CFG.ISLE_IN.ROOMS[d.room], p = g.player, st = this.st;
    g.area = d.room; p.x = R.EXIT.x; p.y = R.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.from = i; st.fade = CFG.ISLE_IN.FADE; this.resetRoom();
    Sfx.ding(); Haptics.tap();
    if (!g.s.isleIn.seen[d.room]) { g.s.isleIn.seen[d.room] = true; g.toast(R.toast, true); }
  },
  leave(g) {
    const st = this.st, k = this.room(g), doors = CFG.ISLE_IN.DOORS;
    const d = st.from >= 0 && doors[st.from].room === k ? doors[st.from] : doors.find((q) => q.room === k), p = g.player;
    g.area = 'islands'; p.x = d.x; p.y = d.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = CFG.ISLE_IN.FADE; this.resetRoom(); Sfx.drop();
  },
  resetRoom() { const st = this.st; st.up = false; st.climb = null; st.viewing = null; st.lie = null; st.count = null; st.keeper = null; st.juke = 0; st.strum = 0; },
  home(g) { if (!this.st) return; this.resetRoom(); this.st.fade = 0; this.st.from = -1; this.st.notes = []; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat (or the stair top)
  rescue(g) {
    const p = g.player, k = this.room(g);
    if (!k || this.free(g, p.x, p.y)) return false;
    const R = CFG.ISLE_IN.ROOMS[k], spot = k === 'lighthouse' && this.st.up ? R.FOOT : { x: R.EXIT.x, y: R.EXIT.y - 8 };
    p.x = spot.x; p.y = spot.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },

  // ---------- the lighthouse ----------
  startClimb(g, up) { const st = this.st, p = g.player; st.climb = { t: 0, up, swapped: false, x: p.x, y: p.y }; p.moving = false; Sfx.pickup(); Haptics.tap(); },
  look(g) { const p = g.player; p.moving = false; p.facing = 1; this.st.viewing = CityExt.scopeStart(p.x, p.y, 0.44); g.s.isleIn.looks++; Sfx.ding(); Haptics.tap(); },
  sayHi(g) {
    const st = this.st, L = CFG.ISLE_IN.ROOMS.lighthouse.KEEPER_LINES;
    st.keeper = { t: 0, line: L[st.keeperN % L.length] }; st.keeperN++; g.s.isleIn.hellos++;
    g.player.facing = 1; Sfx.ding(); Haptics.tap();
  },
  petCat(g) {
    const c = this.st.cat, p = g.player; c.purr = 2.2; c.wait = Math.max(c.wait, 2.5); c.facing = p.x < c.x ? -1 : 1; g.s.isleIn.pets++;
    g.floats.push({ x: c.x, y: c.y - 34, text: 'Purr… 💕', color: '#ff8fab', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  // ---------- the crab shack ----------
  waveCrabs(g) {
    const st = this.st, T = CFG.ISLE_IN.ROOMS.crabshack.TANK; st.tankWave = 2; g.s.isleIn.waves++;
    g.floats.push({ x: (T.x0 + T.x1) / 2, y: T.y0 - 40, text: 'The crabs wave back! 🦀', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.ding(); Haptics.tap();
  },
  playJuke(g) {
    const st = this.st; st.juke = CFG.ISLE_IN.ROOMS.crabshack.JUKE_T; g.s.isleIn.songs++;
    g.floats.push({ x: g.player.x, y: g.player.y - 64, text: 'Dance time! 🎵', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    // a little sea-shanty jingle
    const notes = [392, 440, 494, 392, 523, 494, 440, 392];
    notes.forEach((f, i) => setTimeout(() => { if (typeof Sfx.tone === 'function') Sfx.tone(f, 0.22, 'triangle', 0.05); }, i * 260));
    Haptics.tap();
  },
  // ---------- the coconut hut ----------
  lieDown(g, i) { this.st.lie = { i, t: 0 }; g.player.moving = false; g.s.isleIn.naps++; Sfx.pickup(); Haptics.tap(); },
  getUp(g) {
    const st = this.st, R = CFG.ISLE_IN.ROOMS.coconuthut; if (!st.lie) return;
    const h = R.HAMMOCKS[st.lie.i], p = g.player; st.lie = null;
    p.x = h.x; p.y = h.y + 28; p.moving = false; Sfx.drop();
  },
  strum(g) {
    const st = this.st, R = CFG.ISLE_IN.ROOMS.coconuthut, ch = R.CHORDS[st.strumN % R.CHORDS.length];
    st.strum = 1.6; st.strumN++; g.s.isleIn.strums++;
    ch.forEach((f, i) => setTimeout(() => { if (typeof Sfx.tone === 'function') Sfx.tone(f, 0.5, 'triangle', 0.045); }, i * 60));
    for (let k = 0; k < 3; k++) st.notes.push({ x: R.UKE.x + U.rand(-16, 16), y: R.UKE.y - 30, ch: U.pick(['♪', '♫', '♩']), t: -k * 0.15 });
    g.floats.push({ x: R.UKE.x, y: R.UKE.y - 60, text: ['Strum! 🎶', 'Aloha! 🌺', 'Plink plonk! 🎵', 'Hula time! 🌴'][(st.strumN - 1) % 4], color: '#ffe08a', t: 0, dur: 1.3, big: true });
    Haptics.tap();
  },
  // ---------- mission control ----------
  pressButton(g) { this.st.count = { t: 0 }; g.s.isleIn.presses++; Sfx.ding(); Haptics.tap(); },

  pads(g) {
    const k = this.room(g); if (!k) return [];
    const R = CFG.ISLE_IN.ROOMS[k], tr = typeof IslandsExt !== 'undefined' && IslandsExt.rt && IslandsExt.rt.treat;
    if (k === 'crabshack') return [{ key: 'crabCookie', label: 'Crab cookie', ico: '🦀', pos: R.PAD, price: R.PRICE, sub: 'crunchy!', maxed: !!(tr && tr.kind === 'cookie') }];
    if (k === 'coconuthut') return [{ key: 'coconutDrink', label: 'Coconut drink', ico: '🥥', pos: R.PAD, price: R.PRICE, sub: 'slurp!', maxed: !!(tr && tr.kind === 'coconut') }];
    return [];
  },
  onPad(g, pad) {
    const p = g.player;
    if (pad.key === 'crabCookie') {
      this.st.cook.fry = 1.2; g.s.isleIn.cookies++;
      if (typeof IslandsExt !== 'undefined') IslandsExt.giveTreat(g, 'cookie', 30);
      g.floats.push({ x: p.x, y: p.y - 64, text: 'A crab cookie! 🦀🍪', color: '#ffe08a', t: 0, dur: 1.6, big: true }); Haptics.success();
    } else if (pad.key === 'coconutDrink') {
      g.s.isleIn.drinks++;
      if (typeof IslandsExt !== 'undefined') IslandsExt.giveTreat(g, 'coconut', 30);
      g.floats.push({ x: p.x, y: p.y - 64, text: 'Slurp! A coconut drink 🥥', color: '#ffe08a', t: 0, dur: 1.6, big: true }); Haptics.success();
    }
  },

  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, k = this.room(g);
    st.fade = Math.max(0, st.fade - dt);
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.8);
    if (!k) { if (this.busy() || st.up || st.count) this.resetRoom(); return; }
    const R = CFG.ISLE_IN.ROOMS[k];
    if (k === 'lighthouse') this.updateLighthouse(g, dt, R);
    else if (k === 'crabshack') this.updateCrab(g, dt, R);
    else if (k === 'coconuthut') this.updateCoconut(g, dt, R);
    else if (k === 'missionctl' && st.count) {
      const c = st.count, prev = c.t; c.t += dt;
      if (prev < 2.4 && c.t >= 2.4) { g.floats.push({ x: p.x, y: p.y - 70, text: 'Not yet! Coming soon! 🚧', color: '#ffe08a', t: 0, dur: 1.8, big: true }); Haptics.success(); }
      if (c.t > R.COUNT_T) st.count = null;
    }
    if (!this.busy()) this.rescue(g);
  },
  updateLighthouse(g, dt, R) {
    const st = this.st, p = g.player, c = st.cat;
    if (st.climb) {
      const cl = st.climb; cl.t += dt; p.moving = false;
      if (!cl.swapped) { p.x = cl.x; p.y = cl.y; }
      if (!cl.swapped && cl.t >= R.CLIMB / 2) {
        cl.swapped = true; st.up = cl.up; p.x = R.FOOT.x; p.y = R.FOOT.y; p.facing = 1; g.cameraSnap = true;
        if (cl.up) g.s.isleIn.climbs++;
        g.floats.push({ x: p.x, y: p.y - 60, text: cl.up ? 'The lamp room! 💡' : 'Back downstairs!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
      }
      if (cl.t >= R.CLIMB) { st.climb = null; Haptics.tap(); }
      return;
    }
    if (st.viewing) { if (!st.up) st.viewing = null; else { CityExt.scopeUpdate(g, st.viewing, dt); return; } }
    if (st.keeper) { st.keeper.t += dt; if (st.keeper.t > 2.8) st.keeper = null; }
    // the cat pads from spot to spot, sits a while, and stays put to be petted
    c.purr = Math.max(0, c.purr - dt);
    if (st.up) return;
    if (U.dist(p.x, p.y, c.x, c.y) < 50) { c.moving = false; c.wait = Math.max(c.wait, 1); return; }
    if (c.wait > 0) { c.wait -= dt; c.moving = false; return; }
    const to = R.CAT_SPOTS[c.to], x0 = c.x;
    if (U.moveToward(c, to.x, to.y, 34, dt)) { c.to = (c.to + 1 + Math.floor(Math.random() * 2)) % R.CAT_SPOTS.length; c.wait = U.rand(2, 5); c.moving = false; }
    else { c.moving = true; if (Math.abs(c.x - x0) > 0.01) c.facing = c.x > x0 ? 1 : -1; }
  },
  updateCrab(g, dt, R) {
    const st = this.st, T = R.TANK, ck = st.cook;
    st.tankWave = Math.max(0, st.tankWave - dt);
    for (const c of st.crabs) { if (st.tankWave > 0) continue; c.x += c.dir * 16 * dt; c.step += dt * 12; if (c.x < T.x0 + 18 || c.x > T.x1 - 18) { c.x = U.clamp(c.x, T.x0 + 18, T.x1 - 18); c.dir *= -1; } }
    // the cook shuffles along the counter; frying a cookie, they stay at the griddle
    ck.fry = Math.max(0, ck.fry - dt);
    const C = R.COOK;
    if (ck.fry > 0) ck.x = U.lerp(ck.x, C.x1, 0.2);
    else { ck.x += ck.dir * 30 * dt; if (ck.x < C.x0 || ck.x > C.x1) { ck.x = U.clamp(ck.x, C.x0, C.x1); ck.dir *= -1; } }
    if (st.juke > 0) {
      st.juke = Math.max(0, st.juke - dt);
      if (Math.random() < dt * 4) { const J = R.JUKEBOX; st.notes.push({ x: (J.x0 + J.x1) / 2 + U.rand(-14, 14), y: J.y0 - 30, ch: U.pick(['♪', '♫', '♩']), t: 0 }); }
    }
  },
  updateCoconut(g, dt, R) {
    const st = this.st, p = g.player;
    st.strum = Math.max(0, st.strum - dt);
    if (st.lie) {
      const h = R.HAMMOCKS[st.lie.i]; st.lie.t += dt;
      p.x = h.x + Math.sin(st.lie.t * 1.6) * 5; p.y = h.y + 6; p.moving = false; p.facing = 1;
      if (Math.floor(st.lie.t / 1.1) !== Math.floor((st.lie.t - dt) / 1.1) && st.lie.t > 1) g.floats.push({ x: p.x + 14, y: p.y - 46, text: 'z', color: '#9ad0ff', t: 0, dur: 1.4 });
    }
  },
  hint(g) {
    if (!this.st) return undefined;
    const st = this.st, p = g.player;
    if (g.area === 'islands') {
      const di = this.doorAt(g, CFG.ISLE_IN.HINT_R);
      if (di < 0) return undefined;
      const d = CFG.ISLE_IN.DOORS[di];
      if (this.hutWants(g, d)) return undefined;   // the delivery hint is more urgent
      const at = U.dist(p.x, p.y, d.x, d.y) < CFG.ISLE_IN.DOOR_R;
      return { text: d.text, target: at ? null : { x: d.x, y: d.y } };
    }
    const k = this.room(g); if (!k) return undefined;
    const R = CFG.ISLE_IN.ROOMS[k], s = g.s.isleIn;
    if (k === 'lighthouse') {
      if (st.climb) return { text: st.climb.up ? 'Up, up, up the stairs! 🪜' : 'Down, down, down! 🪜', target: null };
      if (st.viewing) return null;
      if (st.up) {
        if (this.near(g, R.SCOPE, 48)) return { text: 'Look through the telescope! 🔭', target: null };
        if (!s.looks) return { text: 'Look out to sea with the telescope! 🔭', target: { x: R.SCOPE.x - 30, y: R.SCOPE.y + 30 } };
        if (this.near(g, R.FOOT, 36)) return { text: 'Press the button to go back down 🪜', target: null };
        return { text: 'Watch the big lamp turn! 💡', target: null };
      }
      if (this.near(g, R.FOOT, 36)) return { text: 'Climb the stairs to the lamp! 🪜', target: null };
      if (st.keeper) return { text: 'The keeper says hi! ⚓', target: null };
      if (!s.hellos) return { text: 'Say hi to the lighthouse keeper! 👋', target: { x: R.KEEPER.x - 40, y: R.KEEPER.y + 30 } };
      if (!s.climbs) return { text: 'Climb the stairs to the lamp room! 🪜', target: R.FOOT };
      if (!s.pets) return { text: 'Pet the keeper’s cat! 🐱', target: st.cat };
      return { text: 'A cosy lighthouse 🗼', target: null };
    }
    if (k === 'crabshack') {
      if (st.juke > 0) return { text: 'Dance to the music! 🎵', target: null };
      if (!s.waves) return { text: 'Say hi to the crabs in the tank! 🦀', target: R.TANK_SPOT };
      const tr = typeof IslandsExt !== 'undefined' && IslandsExt.rt && IslandsExt.rt.treat;
      if (!s.cookies && g.s.cash + (g.s.padPaid.crabCookie || 0) >= R.PRICE) return { text: 'Buy a crab cookie! 🦀🍪', target: R.PAD };
      if (tr && tr.kind === 'cookie') return { text: 'Crunch! A crab cookie 🍪', target: null };
      if (!s.songs) return { text: 'Play the jukebox! 🎵', target: R.JUKE_SPOT };
      return { text: 'Yummy seafood smells! 🦀', target: null };
    }
    if (k === 'coconuthut') {
      if (st.lie) return { text: 'Swing, swing… Press the button to get up', target: null };
      if (!s.naps) return { text: 'Lie in a hammock! 🌴', target: { x: R.HAMMOCKS[0].x, y: R.HAMMOCKS[0].y + 28 } };
      if (!s.strums) return { text: 'Play the ukulele! 🎶', target: R.UKE_SPOT };
      const tr = typeof IslandsExt !== 'undefined' && IslandsExt.rt && IslandsExt.rt.treat;
      if (!s.drinks && g.s.cash + (g.s.padPaid.coconutDrink || 0) >= R.PRICE) return { text: 'Get a coconut drink! 🥥', target: R.PAD };
      if (tr && tr.kind === 'coconut') return { text: 'Slurp! Coconut drink 🥥', target: null };
      return { text: 'Aloha! 🌺', target: null };
    }
    if (k === 'missionctl') {
      if (st.count) return { text: st.count.t < 2.4 ? 'Countdown! 🚀' : 'Not yet! The rocket is still being built 🚧', target: null };
      if (this.near(g, R.BTN_SPOT, 40)) return { text: 'Press the big red button! 🔴', target: null };
      return { text: 'Press the big red button! 🔴', target: R.BTN_SPOT };
    }
    return undefined;
  },
  bgKey(g) { return g.area === 'lighthouse' && this.st && this.st.up ? 'lhUp' : ''; },

  // ---------- painting: the parts every room shares ----------
  paint: {
    lighthouse(r, g) { const E = IslandsInsideExt; if (E.st && E.st.up) E.paintLampRoom(r, g); else E.paintLighthouse(r, g); },
    crabshack(r, g) { IslandsInsideExt.paintCrab(r, g); },
    coconuthut(r, g) { IslandsInsideExt.paintCoconut(r, g); },
    missionctl(r, g) { IslandsInsideExt.paintMission(r, g); },
  },
  // backdrop, floor, the tall back wall, side and bottom walls, the exit door with its mat and the name plate
  shell(r, k, o) {
    const ctx = r.ctx, R = CFG.ISLE_IN.ROOMS[k], W = R.WORLD, A = R.ROOM, w = CFG.ISLE_IN.WALL;
    ctx.fillStyle = o.out; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(A.x0 - w + 8, R.BACK_TOP + 10, A.x1 - A.x0 + 2 * w, A.y1 + w - R.BACK_TOP);
    o.floor(ctx, A);
    ctx.fillStyle = o.back; ctx.fillRect(A.x0 - w, R.BACK_TOP, A.x1 - A.x0 + 2 * w, A.y0 - R.BACK_TOP);
    if (o.backArt) { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - w, R.BACK_TOP, A.x1 - A.x0 + 2 * w, A.y0 - R.BACK_TOP); ctx.clip(); o.backArt(ctx, A, R); ctx.restore(); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(A.x0 - w, A.y0 - 6, A.x1 - A.x0 + 2 * w, 6);
    ctx.fillStyle = o.wall; ctx.fillRect(A.x0 - w, A.y1, A.x1 - A.x0 + 2 * w, w); ctx.fillRect(A.x0 - w, A.y0, w, A.y1 - A.y0); ctx.fillRect(A.x1, A.y0, w, A.y1 - A.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = A.x0 - w; x < A.x1 + w; x += 16) ctx.fillRect(x, A.y1, 2, w); for (let y = A.y0; y < A.y1; y += 16) { ctx.fillRect(A.x0 - w, y, w, 2); ctx.fillRect(A.x1, y, w, 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(A.x0 - w, A.y1, A.x1 - A.x0 + 2 * w, 3); ctx.fillRect(A.x0 - w, A.y0, 3, A.y1 - A.y0); ctx.fillRect(A.x1 + w - 3, A.y0, 3, A.y1 - A.y0);
    if (!o.noDoor) {
      const E = R.EXIT;
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, A.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, A.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, A.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.mat || '#e4572e'; U.roundRect(ctx, E.x - 21, E.y - 8, 42, 14, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    }
    ctx.font = r.font(8); const tw = ctx.measureText(o.title).width + 20;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (A.x0 + A.x1) / 2 - tw / 2, A.y1 + w + 4, tw, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.title, (A.x0 + A.x1) / 2, A.y1 + w + 11);
  },
  planks(col, dark) { return (ctx, A) => { ctx.fillStyle = col; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); ctx.fillStyle = dark; for (let y = A.y0; y < A.y1; y += 18) { ctx.fillRect(A.x0, y, A.x1 - A.x0, 2); for (let x = A.x0 + ((y / 18) % 3) * 40; x < A.x1; x += 120) ctx.fillRect(x, y, 2, 18); } }; },
  // a sea view through a window: sky, sea, a sail on the horizon
  window(ctx, x, y, w, h, frame) {
    ctx.fillStyle = frame; U.roundRect(ctx, x - 5, y - 5, w + 10, h + 10, 6); ctx.fill();
    const sk = ctx.createLinearGradient(0, y, 0, y + h); sk.addColorStop(0, '#79c6f2'); sk.addColorStop(0.55, '#d9f0ff'); sk.addColorStop(0.56, '#5cb8ea'); sk.addColorStop(1, '#3390cf');
    ctx.fillStyle = sk; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + w * 0.7, y + h * 0.53); ctx.lineTo(x + w * 0.7, y + h * 0.3); ctx.lineTo(x + w * 0.8, y + h * 0.53); ctx.closePath(); ctx.fill();
    ctx.fillStyle = frame; ctx.fillRect(x + w / 2 - 2, y, 4, h); ctx.fillRect(x, y + h / 2 - 2, w, 4);
  },
  drawPlant(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, x - 11, y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 12, y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x, y - 8); ctx.rotate(-1.2 + k * 0.6); ctx.beginPath(); ctx.ellipse(0, -14, 5, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  },

  // ---------- the lighthouse: the keeper's round stone room ----------
  paintLighthouse(r, g) {
    const R = CFG.ISLE_IN.ROOMS.lighthouse, E = this;
    this.shell(r, 'lighthouse', {
      out: '#2d3a4a', back: '#e9e2d0', wall: '#9aa2ad', title: '🗼 LIGHTHOUSE', mat: '#3b7dd8',
      floor: (ctx, A) => {   // round flagstones
        ctx.fillStyle = '#c9c2b0'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
        for (let y = A.y0, j = 0; y < A.y1; y += 30, j++) for (let x = A.x0 + (j % 2) * 22, i = 0; x < A.x1; x += 44, i++) { ctx.fillStyle = (i + j) % 3 ? '#d6cfbd' : '#bdb5a2'; U.roundRect(ctx, x + 2, y + 2, 40, 26, 7); ctx.fill(); }
      },
      backArt: (ctx, A) => {
        // curved stone courses, a round window to the sea, a ship's wheel, a lifebuoy, a shelf with a ship in a bottle
        ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = R.BACK_TOP + 14; y < A.y0; y += 16) for (let x = A.x0 - 24 + ((y / 16) % 2) * 20; x < A.x1 + 24; x += 40) { ctx.beginPath(); ctx.ellipse(x + 18, y, 18, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#3b7dd8'; ctx.fillRect(A.x0 - 24, R.BACK_TOP, A.x1 - A.x0 + 48, 6);
        ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(6300, 4052, 26, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(6300, 4052, 21, 0, Math.PI * 2); ctx.clip(); E.window(ctx, 6279, 4031, 42, 42, '#5c6670'); ctx.restore();
        ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(6410, 4060, 20, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(6410 + Math.cos(a) * 6, 4060 + Math.sin(a) * 6); ctx.lineTo(6410 + Math.cos(a) * 28, 4060 + Math.sin(a) * 28); ctx.stroke(); }
        ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(6410, 4060, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6210, 4060, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 6; ctx.setLineDash([9, 7.5]); ctx.beginPath(); ctx.arc(6210, 4060, 13, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#e9e2d0'; ctx.beginPath(); ctx.arc(6210, 4060, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8d5a2b'; ctx.fillRect(6460, 4078, 64, 5);
        ctx.fillStyle = 'rgba(159,224,255,0.6)'; U.roundRect(ctx, 6468, 4062, 30, 14, 6); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(6496, 4066, 6, 6); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(6480, 4074); ctx.lineTo(6480, 4064); ctx.lineTo(6487, 4074); ctx.closePath(); ctx.fill();   // ship in a bottle
        ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(6512, 4070, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(6512, 4070, 5, 0, Math.PI * 2); ctx.fill();   // barometer
        ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, 6096, 4040, 50, 36, 3); ctx.fill(); ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3; U.roundRect(ctx, 6096, 4040, 50, 36, 3); ctx.stroke();
        ctx.fillStyle = '#5cb8ea'; ctx.fillRect(6100, 4060, 42, 12); ctx.fillStyle = '#f5f5f5'; ctx.fillRect(6116, 4046, 8, 18); ctx.fillStyle = '#e4572e'; ctx.fillRect(6116, 4052, 8, 4); ctx.fillStyle = '#ffe08a'; ctx.fillRect(6116, 4042, 8, 4);   // a picture of the lighthouse
      },
    });
    const ctx = r.ctx, A = R.ROOM, S = R.STAIRS, K = R.KEEPER, T = R.TABLE;
    // the rag rug the cat likes, a pot-belly stove, the table with a lantern and a chart
    ctx.fillStyle = '#c96a3f'; ctx.beginPath(); ctx.ellipse(R.RUG.x, R.RUG.y, 60, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(R.RUG.x, R.RUG.y, 46, 20, 0, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(R.RUG.x, R.RUG.y, 30, 12, 0, 0, Math.PI * 2); ctx.stroke();
    const St = R.STOVE;
    ctx.fillStyle = '#3e424a'; ctx.fillRect(St.x - 4, R.BACK_TOP + 20, 8, St.y - R.BACK_TOP - 30);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(St.x, St.y, 18, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, St.x - 8, St.y + 2, 16, 10, 3); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(St.x - 5, St.y + 6, 10, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x - T.w / 2 + 4, T.y - T.h / 2 + 6, T.w, T.h);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, T.x - T.w / 2, T.y - T.h / 2, T.w, T.h, 5); ctx.fill();
    ctx.fillStyle = '#f6e7cf'; ctx.fillRect(T.x - 30, T.y - 12, 34, 22); ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(T.x - 26, T.y + 4); ctx.quadraticCurveTo(T.x - 14, T.y - 10, T.x, T.y + 2); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.fillText('✕', T.x - 8, T.y - 4);   // a treasure map
    ctx.fillStyle = '#5c6670'; ctx.fillRect(T.x + 14, T.y - 12, 16, 18); ctx.fillStyle = '#ffe08a'; ctx.fillRect(T.x + 17, T.y - 8, 10, 10);   // lantern
    ctx.fillStyle = '#fff'; U.roundRect(ctx, T.x + 6, T.y + 6, 8, 8, 2); ctx.fill();   // mug
    // a coil of rope and a little anchor by the door
    const Rp = R.ROPE;
    ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 4; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(Rp.x, Rp.y, 16 - k * 5, 10 - k * 3, 0, 0, Math.PI * 2); ctx.stroke(); }
    // the spiral staircase: wedge steps winding round a post, up through a hole in the ceiling
    this.drawSpiral(ctx, S.x, S.y, S.r, false);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⬆ UP', S.x, S.y + S.r + 14);
  },
  drawSpiral(ctx, x, y, rr, hole) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(x + 3, y + 4, rr + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hole ? '#1a1410' : '#5c6670'; ctx.beginPath(); ctx.arc(x, y, rr + 2, 0, Math.PI * 2); ctx.fill();
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI / 2 + (k / n) * Math.PI * 2 * 0.92, a1 = a0 + (Math.PI * 2 * 0.92) / n, lit = hole ? 0.25 + (1 - k / n) * 0.6 : 0.45 + (k / n) * 0.55;
      ctx.fillStyle = `rgba(${Math.round(150 * lit + 60)},${Math.round(110 * lit + 50)},${Math.round(70 * lit + 30)},1)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, rr, a0, a1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); ctx.stroke();
    }
    ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.5, 0, Math.PI * 2); ctx.fill(); }   // railing posts
  },
  // ---------- the lighthouse lamp room, up top: glass all round, the sea outside ----------
  paintLampRoom(r, g) {
    const R = CFG.ISLE_IN.ROOMS.lighthouse, E = this;
    this.shell(r, 'lighthouse', {
      out: '#79c6f2', back: '#3390cf', wall: '#5c6670', title: '💡 THE LAMP ROOM', noDoor: true,
      floor: (ctx, A) => {   // iron grating
        ctx.fillStyle = '#7d8591'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; for (let x = A.x0; x < A.x1; x += 12) { ctx.beginPath(); ctx.moveTo(x, A.y0); ctx.lineTo(x, A.y1); ctx.stroke(); } for (let y = A.y0; y < A.y1; y += 12) { ctx.beginPath(); ctx.moveTo(A.x0, y); ctx.lineTo(A.x1, y); ctx.stroke(); }
        ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(R.LAMP.x, R.LAMP.y - 10, 80, 0, Math.PI * 2); ctx.stroke();
      },
      backArt: (ctx, A) => {   // big panes all along: sky, sea and a far island with the rocket
        for (let x = A.x0 - 24; x < A.x1 + 24; x += 82) E.window(ctx, x + 6, R.BACK_TOP + 8, 72, A.y0 - R.BACK_TOP - 22, '#2d3a4a');
        ctx.fillStyle = '#f6e4ad'; ctx.beginPath(); ctx.ellipse(6420, 4072, 36, 8, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f5f7fa'; ctx.fillRect(6416, 4040, 6, 30); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(6416, 4040); ctx.lineTo(6419, 4032); ctx.lineTo(6422, 4040); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c62828'; ctx.fillRect(A.x0 - 24, A.y0 - 14, A.x1 - A.x0 + 48, 8);   // the red gallery rail outside
      },
    });
    const ctx = r.ctx, S = R.STAIRS;
    this.drawSpiral(ctx, S.x, S.y, S.r, true);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⬇ DOWN', S.x, S.y + S.r + 14);
    // the lamp's round pedestal
    const L = R.LAMP;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(L.x + 4, L.y + 8, 50, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.ellipse(L.x, L.y, 46, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(L.x - 46, L.y - 20, 92, 20); ctx.fillStyle = '#3e4a5a'; ctx.beginPath(); ctx.ellipse(L.x, L.y - 20, 46, 16, 0, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- the crab shack ----------
  paintCrab(r, g) {
    const R = CFG.ISLE_IN.ROOMS.crabshack, E = this;
    this.shell(r, 'crabshack', {
      out: '#2b4a5c', back: '#b5773a', wall: '#8d5a2b', title: '🦀 CRAB SHACK 🦀', mat: '#3b7dd8',
      floor: this.planks('#d9a66b', 'rgba(0,0,0,0.12)'),
      backArt: (ctx, A) => {
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = A.x0 - 24; x < A.x1 + 24; x += 22) ctx.fillRect(x, R.BACK_TOP, 2, A.y0 - R.BACK_TOP);
        // a fishing net draped across the wall with floats in it
        ctx.strokeStyle = 'rgba(245,240,220,0.75)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 16; i++) { const x = 7180 + i * 8; ctx.beginPath(); ctx.moveTo(x, R.BACK_TOP + 8); ctx.quadraticCurveTo(x + 10, R.BACK_TOP + 50, x + 4, R.BACK_TOP + 70); ctx.stroke(); }
        for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.moveTo(7180, R.BACK_TOP + 10 + j * 11); ctx.quadraticCurveTo(7244, R.BACK_TOP + 22 + j * 11, 7310, R.BACK_TOP + 10 + j * 11); ctx.stroke(); }
        for (const [x, y, c] of [[7196, 4050, '#e4572e'], [7240, 4070, '#ffd166'], [7290, 4046, '#e4572e']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 7, y - 1.5, 14, 3); }
        // a big blue fish on a plaque, crossed oars, a life ring and the menu over the counter
        ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, 7074, 4034, 84, 40, 6); ctx.fill();
        ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(7112, 4054, 26, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(7136, 4054); ctx.lineTo(7150, 4044); ctx.lineTo(7150, 4064); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7096, 4051, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(7096, 4051, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(7330, 4030); ctx.lineTo(7372, 4092); ctx.moveTo(7372, 4030); ctx.lineTo(7330, 4092); ctx.stroke();
        ctx.fillStyle = '#d9b27c'; for (const [x, y] of [[7326, 4094], [7376, 4094]]) { ctx.beginPath(); ctx.ellipse(x, y, 6, 10, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 7396, 4030, 120, 58, 6); ctx.fill(); ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 3; U.roundRect(ctx, 7396, 4030, 120, 58, 6); ctx.stroke();
        ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MENU', 7456, 4042);
        ctx.font = r.font(9); ctx.fillStyle = '#fff'; ctx.fillText('🦀🍪 crab cookie  $4', 7456, 4060); ctx.fillText('🐟🌮 fish taco  soon!', 7456, 4076);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7538, 4060, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 5; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(7538, 4060, 11, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#b5773a'; ctx.beginPath(); ctx.arc(7538, 4060, 6.5, 0, Math.PI * 2); ctx.fill();
      },
    });
    const ctx = r.ctx, T = R.TANK, J = R.JUKEBOX;
    // the tank's wooden stand (the glass and its crabs are drawn live)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 4, T.y1 - 4, T.x1 - T.x0, 10);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(T.x0 - 4, T.y1 - 10, T.x1 - T.x0 + 8, 12);
    // the jukebox: a rounded top with rainbow tubes (they light up live when it plays)
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(J.x0 - 4, J.y1 - 2, J.x1 - J.x0, 8);
    ctx.fillStyle = '#8d2b2b'; U.roundRect(ctx, J.x0, J.y0, J.x1 - J.x0, J.y1 - J.y0, 16); ctx.fill();
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, J.x0 + 6, J.y0 + 22, J.x1 - J.x0 - 12, 18, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(J.x0 + 9 + k * 9, J.y0 + 46, 6, 14);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', (J.x0 + J.x1) / 2, J.y0 + 31);
  },
  // ---------- the coconut hut ----------
  paintCoconut(r, g) {
    const R = CFG.ISLE_IN.ROOMS.coconuthut, E = this;
    this.shell(r, 'coconuthut', {
      out: '#2e5a3a', back: '#d9b55a', wall: '#a67c3d', title: '🥥 COCONUT HUT 🥥', mat: '#41b883',
      floor: (ctx, A) => {   // a woven palm mat
        ctx.fillStyle = '#e8cf8f'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
        for (let y = A.y0, j = 0; y < A.y1; y += 14, j++) for (let x = A.x0 + (j % 2) * 14, i = 0; x < A.x1; x += 28, i++) { ctx.fillStyle = 'rgba(141,90,43,0.16)'; ctx.fillRect(x, y, 14, 14); }
      },
      backArt: (ctx, A) => {
        // bamboo poles, a shell garland, a window to the beach, a surfboard and the drinks menu
        for (let x = A.x0 - 24; x < A.x1 + 24; x += 14) { ctx.fillStyle = (x / 14) % 2 ? '#c9a24a' : '#d9b55a'; ctx.fillRect(x, R.BACK_TOP, 12, A.y0 - R.BACK_TOP); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = R.BACK_TOP + 20; y < A.y0; y += 30) ctx.fillRect(x, y, 12, 2); }
        ctx.fillStyle = '#b8923f'; ctx.fillRect(A.x0 - 24, R.BACK_TOP, A.x1 - A.x0 + 48, 8);
        ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8060, 4034); ctx.quadraticCurveTo(8300, 4060, 8540, 4034); ctx.stroke();
        for (let k = 0; k < 14; k++) { const x = 8076 + k * 34, y = 4036 + Math.sin((k / 13) * Math.PI) * 13; ctx.fillStyle = ['#ff8fab', '#fff3e0', '#ffd166'][k % 3]; ctx.beginPath(); ctx.arc(x, y + 4, 4, 0, Math.PI * 2); ctx.fill(); }
        E.window(ctx, 8090, 4054, 60, 40, '#8d5a2b');
        ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 8410, 4044, 110, 50, 6); ctx.fill();
        ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🥥 DRINKS', 8465, 4058); ctx.font = r.font(9); ctx.fillStyle = '#fff'; ctx.fillText('coconut  $3', 8465, 4076);
      },
    });
    const ctx = r.ctx;
    // a big rug in the middle, the plants, the hammock posts (the hammocks sway live), the ukulele's stool
    ctx.fillStyle = '#41b883'; U.roundRect(ctx, 8250, 4232, 110, 64, 10); ctx.fill(); ctx.fillStyle = '#ffd166'; for (let k = 0; k < 4; k++) ctx.fillRect(8258 + k * 26, 4240, 10, 48);
    for (const p of R.PLANTS) this.drawPlant(ctx, p.x, p.y);
    for (const h of R.HAMMOCKS) for (const d of [-1, 1]) {
      const px = h.x + d * R.HALF;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(px + 2, h.y + 4, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(px - 4, h.y - 40, 8, 44); ctx.fillStyle = '#a66a2c'; ctx.fillRect(px - 4, h.y - 40, 3, 44);
    }
    const Uk = R.UKE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Uk.x + 2, Uk.y + 14, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(Uk.x, Uk.y + 2, 14, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(Uk.x - 12, Uk.y + 2, 4, 12); ctx.fillRect(Uk.x + 8, Uk.y + 2, 4, 12);
  },
  // ---------- mission control ----------
  paintMission(r, g) {
    const R = CFG.ISLE_IN.ROOMS.missionctl;
    this.shell(r, 'missionctl', {
      out: '#141a2e', back: '#2d3a4a', wall: '#5c6670', title: '🛰️ MISSION CONTROL', mat: '#e4572e',
      floor: (ctx, A) => { ctx.fillStyle = '#9aa0a8'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = A.y0; y < A.y1; y += 32) for (let x = A.x0 + ((y / 32) % 2) * 16; x < A.x1; x += 32) ctx.fillRect(x + 1, y + 1, 30, 30); },
      backArt: (ctx, A) => {
        // a big world map on either side of the screen, round clocks, a rocket poster
        const S = R.SCREEN;
        ctx.fillStyle = '#1a2233'; U.roundRect(ctx, S.x0 - 8, S.y0 - 6, S.x1 - S.x0 + 16, S.y1 - S.y0 + 12, 6); ctx.fill();
        for (const [x, lab] of [[9062, 'HOME'], [9538, 'ROCKET']]) { ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(x, 4050, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 4050); ctx.lineTo(x, 4040); ctx.moveTo(x, 4050); ctx.lineTo(x + 7, 4053); ctx.stroke(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, x, 4076); }
        ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, 9092, 4034, 32, 52, 4); ctx.fill(); ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚀', 9108, 4058);
        ctx.fillStyle = '#41b883'; U.roundRect(ctx, 9476, 4034, 32, 52, 4); ctx.fill(); ctx.font = r.font(16); ctx.fillText('🌍', 9492, 4058);
      },
    });
    const ctx = r.ctx;
    // the water cooler, the stripe on the floor to the button
    const C = R.COOLER;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(C.x + 3, C.y + 14, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8edf2'; U.roundRect(ctx, C.x - 12, C.y - 14, 24, 28, 4); ctx.fill(); ctx.fillStyle = 'rgba(77,208,225,0.7)'; U.roundRect(ctx, C.x - 10, C.y - 36, 20, 24, 8); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(C.x - 3, C.y - 4, 6, 4);
    ctx.fillStyle = '#ffd166'; for (let y = R.BUTTON.y + 20; y < R.ROOM.y1 - 4; y += 16) ctx.fillRect(R.BUTTON.x - 3, y, 6, 9);
  },

  // ---------- live art ----------
  drawOutside(r, g, col) {
    const k = this.room(g), ctx = r.ctx, W = CFG.ISLE_IN.ROOMS[k].WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = col;
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  dynamic(r, g) {
    if (!this.st) return;
    const k = this.room(g); if (!k) return;
    const ctx = r.ctx, t = g.time, st = this.st, R = CFG.ISLE_IN.ROOMS[k];
    this.drawOutside(r, g, { lighthouse: st.up ? '#79c6f2' : '#2d3a4a', crabshack: '#2b4a5c', coconuthut: '#2e5a3a', missionctl: '#141a2e' }[k]);
    if (k === 'lighthouse' && st.up) {
      // waves and a gull outside the panes
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 7; i++) { const x = R.ROOM.x0 + ((i * 83 + t * 14) % (R.ROOM.x1 - R.ROOM.x0)), y = 4070 + (i % 3) * 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 3, x + 10, y); ctx.stroke(); }
      const gx = 6100 + ((t * 30) % 420), gy = 4046 + Math.sin(t * 2) * 6, fl = Math.sin(t * 9) * 3; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(gx - 8, gy + fl); ctx.quadraticCurveTo(gx - 4, gy - 3, gx, gy); ctx.quadraticCurveTo(gx + 4, gy - 3, gx + 8, gy + fl); ctx.stroke();
    }
    if (k === 'lighthouse' && !st.up) {
      // the stove's fire flickers
      const S = R.STOVE, fl = 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 5.3); ctx.fillStyle = `rgba(255,140,66,${(0.25 + fl * 0.3).toFixed(2)})`; ctx.beginPath(); ctx.arc(S.x, S.y + 8, 14 + fl * 4, 0, Math.PI * 2); ctx.fill();
    }
    if (k === 'crabshack') this.drawTank(r, g, R);
    if (k === 'missionctl') this.drawScreen(r, g, R);
  },
  // the crab tank: water, sand, seaweed, bubbles and three crabs (they wave both claws when you wave)
  drawTank(r, g, R) {
    const ctx = r.ctx, T = R.TANK, t = g.time, st = this.st, top = T.y0 - 54, h = T.y1 - 10 - top;
    const wg = ctx.createLinearGradient(0, top, 0, top + h); wg.addColorStop(0, '#9fe6f0'); wg.addColorStop(1, '#2fa3b8');
    ctx.fillStyle = wg; ctx.fillRect(T.x0, top, T.x1 - T.x0, h);
    ctx.fillStyle = '#f2dea2'; ctx.fillRect(T.x0, top + h - 12, T.x1 - T.x0, 12);
    ctx.strokeStyle = '#2e8b57'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { const sx = T.x0 + 14 + k * 38; ctx.beginPath(); ctx.moveTo(sx, top + h - 8); ctx.quadraticCurveTo(sx + Math.sin(t * 1.5 + k) * 8, top + h - 30, sx + Math.sin(t + k) * 4, top + h - 44); ctx.stroke(); }
    for (let k = 0; k < 6; k++) { const q = ((t * 0.4 + k / 6) % 1), bx = T.x0 + 20 + ((k * 47) % (T.x1 - T.x0 - 40)) + Math.sin(t * 3 + k) * 3; ctx.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - q)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, top + h - 14 - q * (h - 18), 2.5 + q * 2, 0, Math.PI * 2); ctx.stroke(); }
    const wave = st.tankWave > 0;
    for (const c of st.crabs) {
      const x = c.x, y = top + h - 12, legs = wave ? 0 : Math.sin(c.step) * 2, claw = wave ? Math.abs(Math.sin(t * 10)) * 8 : 0;
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const ly = y - 3 + k * 2.5, l = k % 2 ? legs : -legs; ctx.beginPath(); ctx.moveTo(x - 6, ly); ctx.lineTo(x - 12, ly + 4 + l); ctx.moveTo(x + 6, ly); ctx.lineTo(x + 12, ly + 4 - l); ctx.stroke(); }
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(x, y - 4, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 11, y - 9 - claw, 3.5, 0, Math.PI * 2); ctx.arc(x + 11, y - 9 - claw, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, y - 11, 2.2, 0, Math.PI * 2); ctx.arc(x + 3, y - 11, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 3 + c.dir * 0.8, y - 11, 1, 0, Math.PI * 2); ctx.arc(x + 3 + c.dir * 0.8, y - 11, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(T.x0 + 8, top + 4, 10, h - 20);
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 4; ctx.strokeRect(T.x0, top, T.x1 - T.x0, h);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(T.x0 - 3, top - 4, T.x1 - T.x0 + 6, 6);
  },
  // mission control's big screen: the rocket on its pad, live, the countdown, a status line
  drawScreen(r, g, R) {
    const ctx = r.ctx, S = R.SCREEN, t = g.time, st = this.st, w = S.x1 - S.x0, h = S.y1 - S.y0;
    ctx.save(); ctx.beginPath(); ctx.rect(S.x0, S.y0, w, h); ctx.clip();
    const sk = ctx.createLinearGradient(0, S.y0, 0, S.y1); sk.addColorStop(0, '#5fb6ee'); sk.addColorStop(1, '#bfe3ff'); ctx.fillStyle = sk; ctx.fillRect(S.x0, S.y0, w, h);
    ctx.fillStyle = '#79b85e'; ctx.fillRect(S.x0, S.y1 - 12, w, 12); ctx.fillStyle = '#b9bcc2'; ctx.fillRect(S.x0 + 100, S.y1 - 12, 80, 6);
    if (typeof RocketExt !== 'undefined') RocketExt.drawRocket(ctx, S.x0 + 140, S.y1 - 8, t, 0.24);
    // a little scaffold and crane, the hook bobbing
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.strokeRect(S.x0 + 152, S.y1 - 58, 14, 50);
    ctx.strokeStyle = '#f2b705'; ctx.beginPath(); ctx.moveTo(S.x0 + 200, S.y1 - 8); ctx.lineTo(S.x0 + 200, S.y1 - 70); ctx.lineTo(S.x0 + 130, S.y1 - 70); ctx.stroke();
    const hk = S.y1 - 60 + Math.sin(t * 0.8) * 14; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(S.x0 + 160, S.y1 - 70); ctx.lineTo(S.x0 + 160, hk); ctx.stroke(); ctx.fillStyle = '#ff8c42'; ctx.fillRect(S.x0 + 155, hk, 10, 6);
    // the side panel: status and the countdown
    ctx.fillStyle = 'rgba(20,26,46,0.85)'; ctx.fillRect(S.x0 + 210, S.y0 + 4, 64, h - 8);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const c = st.count;
    if (c && c.t < 2.4) { const n = 3 - Math.floor(c.t / 0.8); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(34); ctx.fillText(String(n), S.x0 + 242, S.y0 + h / 2 + 2); }
    else if (c) { ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff6b6b' : '#ffe08a'; ctx.font = r.font(11); ctx.fillText('NOT', S.x0 + 242, S.y0 + 24); ctx.fillText('YET!', S.x0 + 242, S.y0 + 38); ctx.font = r.font(16); ctx.fillText('🚧', S.x0 + 242, S.y0 + 58); }
    else { ctx.fillStyle = '#8ef0a0'; ctx.font = r.font(8); ctx.fillText('STATUS', S.x0 + 242, S.y0 + 16); ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#ffe08a' : '#ff8c42'; ctx.font = r.font(9); ctx.fillText('BUILDING', S.x0 + 242, S.y0 + 32); ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.fillText('T- ??:??', S.x0 + 242, S.y0 + 50); ctx.fillText('🔧🔩', S.x0 + 242, S.y0 + 62); }
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = S.y0; y < S.y1; y += 3) ctx.fillRect(S.x0, y, w, 1);   // scanlines
    ctx.restore();
    // red alarm lamps either side flash during the countdown
    for (const x of [S.x0 - 22, S.x1 + 22]) { const on = c && Math.floor(t * 6) % 2; ctx.fillStyle = on ? '#ff3b3b' : '#7a1a1a'; ctx.beginPath(); ctx.arc(x, S.y0 + 10, 7, 0, Math.PI * 2); ctx.fill(); if (on) { ctx.fillStyle = 'rgba(255,59,59,0.3)'; ctx.beginPath(); ctx.arc(x, S.y0 + 10, 16, 0, Math.PI * 2); ctx.fill(); } }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const k = this.room(g); if (!k) return;
    const st = this.st, R = CFG.ISLE_IN.ROOMS[k], t = g.time;
    if (k === 'lighthouse' && !st.up) {
      items.push({ y: R.KEEPER.y, draw: () => this.drawKeeper(r, g, R) });
      items.push({ y: st.cat.y, draw: () => this.drawCat(r, g, st.cat) });
    } else if (k === 'lighthouse') {
      items.push({ y: R.LAMP.y + 2, draw: () => this.drawLamp(r, g, R) });
      items.push({ y: R.SCOPE.y + 6, draw: () => this.drawScope(r, g, R) });
    } else if (k === 'crabshack') {
      const ck = st.cook, dance = st.juke > 0;
      items.push({ y: R.COOK.y, draw: () => r.drawPerson(ck.x, R.COOK.y - (dance ? Math.abs(Math.sin(t * 8)) * 4 : 0), { shirt: '#fff', skin: '#c68642', hat: 'bandana', facing: st.cook.fry > 0 ? 1 : ck.dir, moving: dance || st.cook.fry <= 0, bob: t * 10, carry: 0, pants: '#3a3f5c', apron: '#3b7dd8' }) });
      items.push({ y: R.COUNTER.y1, draw: () => this.drawCrabCounter(r, g, R) });
      items.push({ y: R.SAILOR.y, draw: () => r.drawPerson(R.SAILOR.x, R.SAILOR.y, { shirt: '#fff', stripes: true, skin: '#f1c27d', hat: 'cap', capColor: '#2d3a4a', beard: '#8d5a2b', facing: 1, moving: dance, bob: t * 10, carry: 0, pants: '#2d5a8a' }) });
      for (const tb of R.TABLES) items.push({ y: tb.y + 14, draw: () => this.drawTable(r, g, tb) });
      items.push({ y: R.JUKEBOX.y1, draw: () => this.drawJukeLights(r, g, R) });
    } else if (k === 'coconuthut') {
      R.HAMMOCKS.forEach((h, i) => items.push({ y: h.y + 8, draw: () => this.drawHammock(r, g, h, i) }));
      items.push({ y: R.OWNER.y, draw: () => r.drawPerson(R.OWNER.x + Math.sin(t * 0.8) * 30, R.OWNER.y, { shirt: '#ff8fab', skin: '#8d5524', hair: '#2b1d14', hairStyle: 1, facing: 1, moving: false, bob: 0, carry: 0, pants: '#41b883' }) });
      items.push({ y: R.BAR.y1, draw: () => this.drawBar(r, g, R) });
      items.push({ y: R.UKE.y + 16, draw: () => this.drawUke(r, g, R) });
      items.push({ y: R.ROOM.y0 - 30, draw: () => this.drawMasks(r, g, R) });
    } else if (k === 'missionctl') {
      R.DESKS.forEach((d, i) => { items.push({ y: d.y - 14, draw: () => this.drawOperator(r, g, d, i) }); items.push({ y: d.y + 16, draw: () => this.drawDesk(r, g, d, i, R) }); });
      items.push({ y: R.BUTTON.y + 14, draw: () => this.drawButton(r, g, R) });
      items.push({ y: R.MODEL.y + 14, draw: () => this.drawModel(r, g, R) });
    }
  },
  drawKeeper(r, g, R) {
    const ctx = r.ctx, K = R.KEEPER, t = g.time, rock = Math.sin(t * 1.4) * 0.06;
    ctx.save(); ctx.translate(K.x, K.y); ctx.rotate(rock);
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -40, 50, Math.PI * 0.38, Math.PI * 0.62); ctx.stroke();   // the rockers
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, -20, -50, 40, 34, 6); ctx.fill(); ctx.fillStyle = '#c96a3f'; U.roundRect(ctx, -16, -46, 32, 26, 5); ctx.fill();   // the chair back with a cushion
    r.drawPerson(0, 0, { shirt: '#2d5a8a', skin: '#f1c27d', hat: 'cap', capColor: '#2d3a4a', beard: '#f5f5f5', facing: -1, moving: false, bob: 0, carry: 0, pants: '#5c6670' });
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, -22, -18, 44, 10, 4); ctx.fill();   // the seat's front
    // a pipe with a puff now and then
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-12, -32, 6, 3); ctx.fillRect(-14, -36, 3, 6);
    ctx.restore();
    const q = (t * 0.5) % 1; ctx.fillStyle = `rgba(240,240,240,${(0.6 * (1 - q)).toFixed(2)})`; ctx.beginPath(); ctx.arc(K.x - 14 - q * 6, K.y - 40 - q * 24, 2 + q * 5, 0, Math.PI * 2); ctx.fill();
    const st = this.st;
    if (st.keeper) {
      ctx.font = r.font(13); const tw = ctx.measureText(st.keeper.line).width + 22;
      r.drawBubble(K.x - Math.max(0, tw / 2 - 60), K.y - 82 + Math.sin(st.keeper.t * 5) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(st.keeper.line, 0, 0); }, tw);
    }
  },
  drawCat(r, g, c) {
    const ctx = r.ctx, x = c.x, y = c.y, f = c.facing, t = g.time, walk = c.moving ? Math.sin(t * 12) * 2 : 0, sit = !c.moving;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.strokeStyle = '#f2a541'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - f * 10, y - 6); ctx.quadraticCurveTo(x - f * 20, y - 10, x - f * 18, y - 22 + Math.sin(t * 3) * 3); ctx.stroke();   // tail
    if (!sit) { ctx.fillRect(x - 8, y - 4 + walk, 3, 6); ctx.fillRect(x + 5, y - 4 - walk, 3, 6); }
    ctx.beginPath(); ctx.ellipse(x, y - 8, sit ? 9 : 12, sit ? 9 : 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + f * 9, y - (sit ? 18 : 14), 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + f * 4, y - (sit ? 22 : 18)); ctx.lineTo(x + f * 5, y - (sit ? 29 : 25)); ctx.lineTo(x + f * 9, y - (sit ? 24 : 20)); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + f * 10, y - (sit ? 24 : 20)); ctx.lineTo(x + f * 13, y - (sit ? 30 : 26)); ctx.lineTo(x + f * 15, y - (sit ? 22 : 18)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c97a1f'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 6 + k * 5, y - 15 + (sit ? 0 : 4), 2, 5);   // stripes
    const purr = c.purr > 0;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2;
    if (purr) { for (const d of [-2, 3]) { ctx.beginPath(); ctx.arc(x + f * 9 + d, y - (sit ? 19 : 15), 1.5, Math.PI, 0); ctx.stroke(); } }
    else { ctx.fillStyle = '#2b1d14'; for (const d of [-2, 3]) { ctx.beginPath(); ctx.arc(x + f * 9 + d, y - (sit ? 19 : 15), 1, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(x + f * 12, y - (sit ? 16 : 12), 1.2, 0, Math.PI * 2); ctx.fill();
    if (purr) { const q = (g.time * 1.2) % 1; ctx.globalAlpha = 1 - q; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💕', x + f * 4, y - 32 - q * 16); ctx.globalAlpha = 1; }
    else if (!c.moving && c.wait > 3.5) { ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#9ad0ff'; ctx.fillText('z', x + 10, y - 34 - Math.sin(t * 2) * 3); }
  },
  // the lamp: a tall glass lens on the pedestal; the beams themselves sweep in the overlay
  drawLamp(r, g, R) {
    const ctx = r.ctx, L = R.LAMP, t = g.time, x = L.x, y = L.y - 20;
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 30, y - 86, 60, 6); ctx.fillRect(x - 3, y - 96, 6, 12);
    const lg = ctx.createLinearGradient(x - 26, 0, x + 26, 0); lg.addColorStop(0, 'rgba(255,247,194,0.7)'); lg.addColorStop(0.5, '#fffbe0'); lg.addColorStop(1, 'rgba(255,224,138,0.75)');
    ctx.fillStyle = lg; U.roundRect(ctx, x - 26, y - 80, 52, 80, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(184,134,44,0.8)'; ctx.lineWidth = 1.5; for (let k = 1; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x - 26, y - k * 11.5); ctx.lineTo(x + 26, y - k * 11.5); ctx.stroke(); }
    // the bulb turns: a bright spot slides round
    const a = t * 1.1, bx = x + Math.cos(a) * 16; ctx.fillStyle = Math.sin(a) > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(bx, y - 40, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,247,194,0.25)'; ctx.beginPath(); ctx.arc(x, y - 40, 44 + Math.sin(t * 3) * 4, 0, Math.PI * 2); ctx.fill();
  },
  drawScope(r, g, R) {
    const ctx = r.ctx, S = R.SCOPE;
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S.x, S.y - 26); ctx.lineTo(S.x - 12, S.y + 6); ctx.moveTo(S.x, S.y - 26); ctx.lineTo(S.x + 12, S.y + 6); ctx.moveTo(S.x, S.y - 26); ctx.lineTo(S.x, S.y + 8); ctx.stroke();
    ctx.save(); ctx.translate(S.x, S.y - 30); ctx.rotate(-0.5);
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, -22, -6, 44, 12, 5); ctx.fill(); ctx.fillStyle = '#b8862c'; ctx.fillRect(-24, -7, 8, 14); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(18, -4, 6, 8);
    ctx.restore();
  },
  drawCrabCounter(r, g, R) {
    const ctx = r.ctx, C = R.COUNTER, t = g.time, st = this.st;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, C.x0, C.y0 - 2, C.x1 - C.x0, C.y1 - C.y0 + 2, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = C.x0 + 10; x < C.x1; x += 20) ctx.fillRect(x, C.y0 + 8, 10, C.y1 - C.y0 - 12);
    ctx.fillStyle = '#e8cf8f'; U.roundRect(ctx, C.x0 - 3, C.y0 - 10, C.x1 - C.x0 + 6, 14, 5); ctx.fill();
    // the griddle, sizzling when a cookie is on
    ctx.fillStyle = '#3e424a'; U.roundRect(ctx, C.x1 - 54, C.y0 - 16, 46, 12, 3); ctx.fill();
    if (st.cook.fry > 0) { ctx.fillStyle = '#d98e3f'; ctx.beginPath(); ctx.ellipse(C.x1 - 31, C.y0 - 12, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); for (let k = 0; k < 3; k++) { const q = (t * 1.5 + k / 3) % 1; ctx.fillStyle = `rgba(240,240,240,${(0.7 * (1 - q)).toFixed(2)})`; ctx.beginPath(); ctx.arc(C.x1 - 40 + k * 9, C.y0 - 20 - q * 22, 3 + q * 4, 0, Math.PI * 2); ctx.fill(); } }
    // a bowl of lemons, a ketchup bottle and a tray of crab cookies under a glass dome
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(C.x0 + 24, C.y0 - 8, 14, 6, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#ffd166'; for (const dx of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(C.x0 + 24 + dx, C.y0 - 10, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, C.x0 + 48, C.y0 - 26, 8, 18, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(C.x0 + 50, C.y0 - 30, 4, 5);
    ctx.fillStyle = '#d98e3f'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(C.x0 + 82 + k * 12, C.y0 - 10, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(200,235,255,0.45)'; ctx.beginPath(); ctx.arc(C.x0 + 94, C.y0 - 8, 22, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(C.x0 + 94, C.y0 - 8, 22, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, (C.x0 + C.x1) / 2 - 26, C.y0 + 8, 52, 16, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ORDER HERE', (C.x0 + C.x1) / 2, C.y0 + 16);
  },
  drawTable(r, g, tb) {
    const ctx = r.ctx, x = tb.x, y = tb.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 14, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 3, y, 6, 14);
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, 30, 14, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = -4; i < 4; i++) for (let j = -2; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#e4572e'; ctx.fillRect(x + i * 8, y + j * 8, 8, 8); }
    ctx.restore();
    // a basket of fish and chips
    ctx.fillStyle = '#d9b27c'; ctx.beginPath(); ctx.ellipse(x - 4, y - 2, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 10 + k * 3, y - 7, 2, 6); ctx.fillStyle = '#c97a1f'; ctx.beginPath(); ctx.ellipse(x + 2, y - 3, 5, 3, 0.3, 0, Math.PI * 2); ctx.fill();
  },
  drawJukeLights(r, g, R) {
    const ctx = r.ctx, J = R.JUKEBOX, t = g.time, on = this.st.juke > 0, cols = ['#e4572e', '#ffd166', '#41b883', '#3b7dd8', '#ff8fab'];
    for (let k = 0; k < 5; k++) { ctx.fillStyle = on ? cols[(k + Math.floor(t * 6)) % 5] : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc((J.x0 + J.x1) / 2 + Math.cos(Math.PI + (k / 4) * Math.PI) * 18, J.y0 + 16 + Math.sin(Math.PI + (k / 4) * Math.PI) * 10, 3.5, 0, Math.PI * 2); ctx.fill(); }
    if (on) { ctx.fillStyle = `rgba(255,224,138,${(0.15 + 0.1 * Math.sin(t * 8)).toFixed(2)})`; ctx.beginPath(); ctx.arc((J.x0 + J.x1) / 2, J.y0 + 30, 44, 0, Math.PI * 2); ctx.fill(); }
  },
  // a hammock: a striped cloth sagging between the two posts; with the chef in it, it hugs him and sways
  drawHammock(r, g, h, i) {
    const ctx = r.ctx, R = CFG.ISLE_IN.ROOMS.coconuthut, st = this.st, lying = st.lie && st.lie.i === i, sw = lying ? Math.sin(st.lie.t * 1.6) * 5 : Math.sin(g.time * 0.9 + i) * 1.5;
    const x0 = h.x - R.HALF + 16, x1 = h.x + R.HALF - 16, ytop = h.y - 36;
    // the cloth's top and bottom edges, as curves through the middle at these heights (a quadratic's control
    // point sits at twice the middle height minus the ends)
    const midTop = lying ? h.y - 18 : h.y - 22, midBot = lying ? h.y + 14 : h.y - 8, cTop = 2 * midTop - ytop, cBot = 2 * midBot - ytop;
    ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 16, ytop - 6); ctx.lineTo(x0, ytop); ctx.moveTo(x1 + 16, ytop - 6); ctx.lineTo(x1, ytop); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0, ytop); ctx.quadraticCurveTo(h.x + sw, cBot, x1, ytop); ctx.quadraticCurveTo(h.x + sw, cTop, x0, ytop); ctx.closePath(); ctx.clip();
    const cols = i ? ['#ff8fab', '#fff', '#3b7dd8'] : ['#41b883', '#fff', '#ffd166'];
    for (let k = 0; k < 14; k++) { ctx.fillStyle = cols[k % 3]; ctx.fillRect(x0 + k * 8, ytop - 4, 8, cBot - ytop + 8); }
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x0, midTop + 6, x1 - x0, 60);
    ctx.restore();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, ytop); ctx.quadraticCurveTo(h.x + sw, cBot, x1, ytop); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(x0, ytop); ctx.quadraticCurveTo(h.x + sw, cTop, x1, ytop); ctx.stroke();
    if (lying) { ctx.fillStyle = '#2b1d14'; for (const d of [0, 7]) { ctx.beginPath(); ctx.ellipse(h.x + sw + 34 + d, h.y - 12 - d * 0.6, 5, 3.5, -0.4, 0, Math.PI * 2); ctx.fill(); } }   // the chef's shoes poking out
  },
  drawBar(r, g, R) {
    const ctx = r.ctx, B = R.BAR;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0, B.y0 - 2, B.x1 - B.x0, B.y1 - B.y0 + 2, 5); ctx.fill();
    ctx.fillStyle = '#a66a2c'; for (let x = B.x0 + 4; x < B.x1 - 4; x += 10) ctx.fillRect(x, B.y0 + 4, 6, B.y1 - B.y0 - 8);   // bamboo front
    ctx.fillStyle = '#d9b55a'; U.roundRect(ctx, B.x0 - 3, B.y0 - 10, B.x1 - B.x0 + 6, 14, 5); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; for (const [dx, dy] of [[14, -14], [24, -14], [19, -22], [34, -14]]) { ctx.beginPath(); ctx.arc(B.x0 + dx, B.y0 + dy, 6, 0, Math.PI * 2); ctx.fill(); }   // coconuts
    ctx.fillStyle = 'rgba(200,235,255,0.6)'; U.roundRect(ctx, B.x1 - 40, B.y0 - 34, 16, 24, 4); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.fillRect(B.x1 - 38, B.y0 - 22, 12, 10); ctx.fillStyle = '#5c6670'; ctx.fillRect(B.x1 - 42, B.y0 - 12, 20, 6);   // blender
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(B.x0 + 70, B.y0 - 12, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(B.x0 + 82, B.y0 - 12, 5, 0, Math.PI * 2); ctx.fill();   // fruit
  },
  drawUke(r, g, R) {
    const ctx = r.ctx, U2 = R.UKE, st = this.st, k = st.strum / 1.6, wob = Math.sin(g.time * 30) * 2 * k;
    ctx.save(); ctx.translate(U2.x + wob, U2.y - 6); ctx.rotate(-0.35 + wob * 0.02);
    ctx.fillStyle = '#c97a1f'; ctx.beginPath(); ctx.ellipse(0, 6, 11, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -6, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-2, -34, 4, 26); ctx.fillRect(-4, -40, 8, 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.6; for (const d of [-1.2, 0, 1.2]) { ctx.beginPath(); ctx.moveTo(d, -34); ctx.lineTo(d, 10); ctx.stroke(); }
    ctx.restore();
  },
  // three tiki masks on the back wall: eyes follow the chef, and they bob along with the ukulele
  drawMasks(r, g, R) {
    const ctx = r.ctx, p = g.player, st = this.st, dance = st.strum > 0;
    R.MASKS.forEach((m, i) => {
      const bob = dance ? Math.sin(g.time * 10 + i) * 3 : 0, x = m.x, y = m.y + bob;
      ctx.fillStyle = m.c; U.roundRect(ctx, x - 16, y - 26, 32, 52, 10); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 16, y - 4, 32, 3);
      ctx.fillStyle = '#41b883'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 12 + k * 12, y - 26); ctx.lineTo(x - 6 + k * 12, y - 38); ctx.lineTo(x + k * 12, y - 26); ctx.closePath(); ctx.fill(); }
      const ex = U.clamp((p.x - x) / 120, -1, 1) * 2, ey = U.clamp((p.y - y) / 200, -1, 1) * 2;
      for (const d of [-7, 7]) { ctx.fillStyle = dance ? '#ffe08a' : '#fff8ee'; ctx.beginPath(); ctx.ellipse(x + d, y - 12, 5, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + d + ex, y - 12 + ey, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 10, y + 4, 20, dance ? 14 : 9, 3); ctx.fill();
      ctx.fillStyle = '#fff8ee'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 8 + k * 4.5, y + 4, 3, 3);
      ctx.fillStyle = m.c; ctx.fillRect(x - 3, y - 8, 6, 10);
    });
  },
  drawOperator(r, g, d, i) {
    const ctx = r.ctx, st = this.st, t = g.time, cheer = st.count && st.count.t > 2.4;
    r.drawPerson(d.x + (i ? -24 : 24), d.y - 14, { shirt: i ? '#ff8fab' : '#4dd0e1', skin: i ? '#c68642' : '#f1c27d', hair: i ? '#2b1d14' : '#e0b44c', hairStyle: i ? 2 : 1, facing: i ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#3a3f5c' });
    // headset
    const x = d.x + (i ? -24 : 24), y = d.y - 14;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 40, 11, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 11, y - 37, 3, 0, Math.PI * 2); ctx.arc(x + 11, y - 37, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + (i ? -11 : 11), y - 36); ctx.quadraticCurveTo(x + (i ? -10 : 10), y - 30, x + (i ? -4 : 4), y - 30); ctx.stroke();
    if (cheer) { ctx.font = r.font(12); const line = i ? 'Not yet, chef! 😄' : 'Soon! 🚀'; const tw = ctx.measureText(line).width + 20; r.drawBubble(x, y - 72, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(line, 0, 0); }, tw); }
  },
  drawDesk(r, g, d, i, R) {
    const ctx = r.ctx, t = g.time, w = R.DESK_W;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(d.x - w / 2 + 4, d.y + 14, w, 6);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, d.x - w / 2, d.y - 10, w, 26, 4); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, d.x - w / 2 - 2, d.y - 16, w + 4, 10, 4); ctx.fill();
    // two monitors with blinking lines and a row of buttons
    for (const dx of [-34, 22]) {
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, d.x + dx - 2, d.y - 50, 36, 30, 3); ctx.fill(); ctx.fillRect(d.x + dx + 13, d.y - 22, 6, 8);
      ctx.fillStyle = '#0f1a2a'; ctx.fillRect(d.x + dx + 1, d.y - 47, 30, 22);
      for (let k = 0; k < 4; k++) { const on = Math.sin(t * (1.5 + k * 0.7) + dx + i * 3) > -0.2; ctx.fillStyle = on ? ['#8ef0a0', '#4dd0e1', '#ffd166', '#ff8fab'][k] : 'rgba(255,255,255,0.1)'; ctx.fillRect(d.x + dx + 4, d.y - 44 + k * 5, 6 + ((k * 7 + i * 5) % 18), 2.5); }
    }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = Math.sin(t * 3 + k + i) > 0 ? ['#e4572e', '#ffd166', '#41b883'][k % 3] : '#3e424a'; ctx.beginPath(); ctx.arc(d.x - 40 + k * 16, d.y + 4, 3, 0, Math.PI * 2); ctx.fill(); }
  },
  // a model of the rocket on a little stand in the corner
  drawModel(r, g, R) {
    const ctx = r.ctx, M = R.MODEL;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(M.x + 3, M.y + 12, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, M.x - 15, M.y - 2, 30, 14, 3); ctx.fill();
    if (typeof RocketExt !== 'undefined') RocketExt.drawRocket(ctx, M.x, M.y, g.time, 0.2);
  },
  drawButton(r, g, R) {
    const ctx = r.ctx, B = R.BUTTON, st = this.st, down = st.count && st.count.t < 0.3 ? 3 : 0, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(B.x + 3, B.y + 14, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 16, B.y - 12, 32, 26, 4); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(B.x - 16, B.y + 4, 32, 4); ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(B.x - 14 + k * 8, B.y + 4, 4, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(B.x, B.y - 14, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.ellipse(B.x, B.y - 16 + down, 12, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(B.x - 12, B.y - 22 + down, 24, 6);
    ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.ellipse(B.x, B.y - 22 + down, 12, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(B.x - 4, B.y - 24 + down, 4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    if (!st.count) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PUSH', B.x, B.y - 36); ctx.globalAlpha = 1; }
  },
  overlay(r, g) {
    if (!this.st) return;
    const k = this.room(g); if (!k) return;
    const ctx = r.ctx, st = this.st, t = g.time;
    if (k === 'lighthouse' && st.up) {
      // the beams: two bright wedges sweeping round the room from the lamp
      const L = CFG.ISLE_IN.ROOMS.lighthouse.LAMP, a = t * 1.1, A = CFG.ISLE_IN.ROOMS.lighthouse.ROOM;
      ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - 24, CFG.ISLE_IN.ROOMS.lighthouse.BACK_TOP, A.x1 - A.x0 + 48, A.y1 + 24 - CFG.ISLE_IN.ROOMS.lighthouse.BACK_TOP); ctx.clip();
      for (const d of [0, Math.PI]) {
        const gr = ctx.createRadialGradient(L.x, L.y - 60, 10, L.x, L.y - 60, 420); gr.addColorStop(0, 'rgba(255,251,224,0.55)'); gr.addColorStop(1, 'rgba(255,251,224,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(L.x, L.y - 60); ctx.arc(L.x, L.y - 60, 420, a + d - 0.16, a + d + 0.16); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of st.notes) {
      if (n.t < 0) continue;
      const q = n.t / 1.8; ctx.globalAlpha = 1 - q; ctx.font = r.font(12 + q * 6); ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883'][n.ch === '♪' ? 0 : n.ch === '♫' ? 1 : 2];
      ctx.fillText(n.ch, n.x + Math.sin(n.t * 4) * 6, n.y - q * 44);
    }
    ctx.globalAlpha = 1;
  },

  // ---------- screen space: the stair climb, the telescope, the door fade ----------
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, st = this.st;
    if (g.area === 'lighthouse' && st.climb) this.drawClimb(r, g, W, H);
    else if (g.area === 'lighthouse' && st.viewing) this.drawView(r, g, W, H);
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / CFG.ISLE_IN.FADE).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
  // climbing the spiral: a cut-away of the tower with the chef going round and round, up or down
  drawClimb(r, g, W, H) {
    const ctx = r.ctx, cl = this.st.climb, k = U.clamp(cl.t / CFG.ISLE_IN.ROOMS.lighthouse.CLIMB, 0, 1), cx = W / 2, cy = H / 2;
    const alpha = Math.min(1, Math.min(k, 1 - k) * 6);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(0, 0, W, H);
    const th = Math.min(H * 0.7, 420), tw = th * 0.36, top = cy - th / 2;
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(cx - tw / 2, top + th); ctx.lineTo(cx + tw / 2, top + th); ctx.lineTo(cx + tw * 0.36, top); ctx.lineTo(cx - tw * 0.36, top); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(cx - tw * 0.4, top + th * 0.3, tw * 0.8, th * 0.1); ctx.fillRect(cx - tw * 0.45, top + th * 0.65, tw * 0.9, th * 0.1);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx, top - 14, 16, 0, Math.PI * 2); ctx.fill();
    // the steps zig-zag up the middle
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const yy = top + th - 10 - (i / 24) * (th - 20), xx = cx + Math.sin(i * 0.8) * tw * 0.28; if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
    ctx.stroke();
    const q = cl.up ? k : 1 - k, i = q * 24, yy = top + th - 10 - q * (th - 20), xx = cx + Math.sin(i * 0.8) * tw * 0.28;
    ctx.save(); ctx.translate(xx, yy); ctx.scale(0.8, 0.8);
    r.drawPerson(0, 0, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: Math.cos(i * 0.8) >= 0 ? 1 : -1, moving: true, bob: cl.t * 16, carry: 0, pants: '#2d3a4a' });
    ctx.restore();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cl.up ? 'Up, up, up! 🪜' : 'Down, down, down! 🪜', cx, top + th + 34);
    ctx.restore();
  },
  // Through the lamp-room telescope: the sea from the lighthouse, west round to east: Pizza Island far away, a big
  // ship, the Crab Shack's island, Rocket Island with its crane, a sailboat, a whale. Near layers move more.
  drawView(r, g, W, H) {
    const ctx = r.ctx, t = g.time, v = this.st.viewing, G = CityExt.scopeBegin(r, g, v, W, H), { cx, cy, Rv, S, hz, sx } = G;
    const sky = ctx.createLinearGradient(0, cy - Rv, 0, hz); sky.addColorStop(0, '#5fb6ee'); sky.addColorStop(1, '#dff3ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(sx(0.5, 0.3), cy - Rv * 0.55, Rv * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 8; i++) { const mx = sx(-0.2 + i * 0.2, 0.3) + ((t * 5 + i * 50) % 80), my = cy - Rv * (0.78 - (i % 3) * 0.13); ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.arc(mx + 14, my - 7, 15, 0, Math.PI * 2); ctx.arc(mx + 30, my, 11, 0, Math.PI * 2); ctx.fill(); }
    // the sea, with wave strokes moving past
    const sea = ctx.createLinearGradient(0, hz, 0, cy + Rv); sea.addColorStop(0, '#5cb8ea'); sea.addColorStop(1, '#2b6fb0'); ctx.fillStyle = sea; ctx.fillRect(0, hz, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const fc = -0.3 + (i % 20) * 0.08, row = Math.floor(i / 20), k = 0.8 + row * 0.5, x = sx(fc, k) + ((t * (10 + row * 8)) % 40), y = hz + Rv * (0.08 + row * 0.25 + (i % 3) * 0.05); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 3, x + 12, y); ctx.stroke(); }
    const isle = (fc, k, w, h, palms) => { const x = sx(fc, k), s = S * k; ctx.fillStyle = '#f6e4ad'; ctx.beginPath(); ctx.ellipse(x, hz + 2, w * s, h * s, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#79b85e'; ctx.beginPath(); ctx.ellipse(x, hz, w * 0.7 * s, h * 0.7 * s, 0, Math.PI, 0); ctx.fill(); for (const [dx, ph] of palms) { ctx.strokeStyle = '#a66a2c'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(x + dx * s, hz - 4 * s); ctx.lineTo(x + (dx + 6) * s, hz - ph * s); ctx.stroke(); ctx.fillStyle = '#3f9a4a'; for (let q = 0; q < 5; q++) { ctx.save(); ctx.translate(x + (dx + 6) * s, hz - ph * s); ctx.rotate(-0.4 + q * 0.5 - Math.PI * 0.75); ctx.beginPath(); ctx.ellipse(12 * s, 0, 13 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } } return { x, s }; };
    // far: Pizza Island with the pizza stand's roof and a flag
    { const { x, s } = isle(0.04, 0.7, 150, 34, [[-90, 50], [70, 60]]); ctx.fillStyle = '#d9b55a'; ctx.fillRect(x - 20 * s, hz - 34 * s, 44 * s, 18 * s); ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 20 * s, hz - 18 * s, 44 * s, 6 * s); r.drawPizza(x + 2 * s, hz - 46 * s, 9 * s); }
    // the big ship, chugging slowly from side to side
    { const x = sx(0.24 + Math.sin(t * 0.08) * 0.03, 0.85), s = S * 0.9, y = hz + 6 * s; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(-90, -14); ctx.lineTo(96, -14); ctx.lineTo(80, 6); ctx.lineTo(-80, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(-90, -24, 186, 10);
      ['#3b7dd8', '#ffd166', '#41b883', '#e4572e', '#ff8fab', '#3b7dd8'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-70 + i * 22, -42, 20, 18); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-70 + i * 22, -34, 20, 2); });   // containers
      ctx.fillStyle = '#fff'; ctx.fillRect(66, -56, 24, 32); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(69, -52, 18, 6); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(72, -70, 8, 14);
      for (let i = 0; i < 3; i++) { const q = (t * 0.4 + i / 3) % 1; ctx.fillStyle = `rgba(235,235,235,${(0.6 * (1 - q)).toFixed(2)})`; ctx.beginPath(); ctx.arc(76 - q * 30, -76 - q * 26, 5 + q * 8, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore(); }
    // the Crab Shack's island, nearer
    { const { x, s } = isle(0.44, 1, 120, 30, [[-80, 52], [74, 46]]); ctx.fillStyle = '#c96a3f'; ctx.fillRect(x - 24 * s, hz - 36 * s, 48 * s, 30 * s); ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.moveTo(x - 32 * s, hz - 36 * s); ctx.lineTo(x, hz - 58 * s); ctx.lineTo(x + 32 * s, hz - 36 * s); ctx.closePath(); ctx.fill(); ctx.font = r.font(14 * s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🦀', x, hz - 20 * s); }
    // Rocket Island: the rocket in its scaffold, the crane's hook going up and down
    { const { x, s } = isle(0.64, 1.1, 150, 32, [[-120, 44], [118, 40]]);
      ctx.fillStyle = '#b9bcc2'; ctx.fillRect(x - 50 * s, hz - 10 * s, 100 * s, 8 * s);
      if (typeof RocketExt !== 'undefined') RocketExt.drawRocket(ctx, x - 10 * s, hz - 6 * s, t, 0.42 * s);
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2 * s; ctx.strokeRect(x + 4 * s, hz - 90 * s, 22 * s, 82 * s);
      ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x + 60 * s, hz - 6 * s); ctx.lineTo(x + 60 * s, hz - 130 * s); ctx.lineTo(x - 30 * s, hz - 130 * s); ctx.stroke();
      const hk = hz - 110 * s + Math.sin(t * 0.7) * 30 * s; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(x + 20 * s, hz - 130 * s); ctx.lineTo(x + 20 * s, hk); ctx.stroke(); ctx.fillStyle = '#ff8c42'; ctx.fillRect(x + 14 * s, hk, 12 * s, 8 * s);
      if (Math.sin(t * 6) > 0) { ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(x + 2 * s, hz - 50 * s, 3 * s, 0, Math.PI * 2); ctx.fill(); } }
    // a sailboat tacking along, near
    { const x = sx(0.84 + Math.sin(t * 0.15) * 0.04, 1.25), s = S * 1.1, y = hz + Rv * 0.1; ctx.save(); ctx.translate(x, y + Math.sin(t * 1.6) * 2 * s); ctx.scale(s, s);
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(34, -6); ctx.lineTo(24, 8); ctx.lineTo(-24, 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-30, -6, 60, 3);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-2, -70, 3, 64); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(2, -68); ctx.quadraticCurveTo(30, -40, 32, -10); ctx.lineTo(2, -10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(-3, -58); ctx.quadraticCurveTo(-20, -36, -22, -12); ctx.lineTo(-3, -12); ctx.closePath(); ctx.fill();
      ctx.restore(); }
    // a whale far out on the right, blowing a spout now and then
    { const x = sx(1.02, 0.9), s = S * 0.9, y = hz + 10 * s; ctx.fillStyle = '#4a6f8f'; ctx.beginPath(); ctx.ellipse(x, y, 46 * s, 12 * s, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 40 * s, y - 2 * s); ctx.lineTo(x + 62 * s, y - 16 * s); ctx.lineTo(x + 58 * s, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 30 * s, y - 5 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
      const q = (t * 0.35) % 1; if (q < 0.5) { ctx.fillStyle = `rgba(255,255,255,${(0.9 * (1 - q * 2)).toFixed(2)})`; for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(x - 18 * s + d * 8 * s * q * 2, y - 14 * s - q * 60 * s, (4 + q * 6) * s, 0, Math.PI * 2); ctx.fill(); } } }
    // gulls
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const gx = sx(0.1 + i * 0.28, 0.6) + Math.sin(t * 0.5 + i) * 40, gy = cy - Rv * (0.35 + (i % 2) * 0.1), fl = Math.sin(t * 8 + i) * 3; ctx.beginPath(); ctx.moveTo(gx - 8, gy + fl); ctx.quadraticCurveTo(gx - 4, gy - 3, gx, gy); ctx.quadraticCurveTo(gx + 4, gy - 3, gx + 8, gy + fl); ctx.stroke(); }
    CityExt.scopeEnd(r, g, v, W, H, G, LH_SCOPE_SPOTS, LH_SCOPE_COMPASS);
  },
};
Game.ext.unshift(IslandsInsideExt);   // first in line so the doors' buttons and hints beat the islands' own
Render.ext.push(IslandsInsideExt);
