'use strict';
// The Aquarium: City building 18 (lower row, facing Harbour Street, the light-blue one with the water tower) gets a
// wavy '🐠 AQUARIUM' banner and a stream of bubbles by the door. Inside is a big, bright aquarium with wide galleries
// joined by open archways, all one loop: the LOBBY (the door, a touch pool with a starfish to pet, a glowing jellyfish
// column, the gift kiosk, the shell shelf and the diver mascot) → the REEF HALL (a big reef tank with a sea turtle and
// a shy octopus) → the glass FISH TUNNEL through a tank → the OCEAN HALL (a giant shark & ray tank and a seahorse) →
// the SWIM HALL (a huge walk-in lagoon to swim in with goggles and a snorkel, among schools of fish, a turtle, a friendly
// ray and jellyfish) → back to the lobby. Behind a glass fence in the swim hall lives the PENGUIN HABITAT: go in through
// the gate, the penguins follow you about, nuzzle you, slide down the ice slide into their pool, and gather round when
// you bring a fish from the bucket. Feeding the fish is physical: take a tub of fish food from a food station (the chef
// carries it), walk to the glowing ring under a tank's feeding hatch and drop the food in: it flies up into the hatch,
// the flakes sprinkle into the water and every fish rushes over to gobble them with bubbles and hearts.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.AQUARIUM = {
  BUILDING: 18,                                  // index in CFG.CITY.BUILDINGS: { x0: 5632, y0: 590, x1: 5770, y1: 876 }
  DOOR_OUT: { x: 5701, y: 890 },                 // on the Harbour Street sidewalk just below the door
  WORLD: { x0: 20200, y0: 5100, x1: 22100, y1: 6360 },   // a big free rectangle of its own (1900 × 1260)
  ROOM: { x0: 20240, y0: 5400, x1: 22060, y1: 6300 }, WALL: 24, BACK_TOP: 5112,   // the tall back wall holds the tank windows
  // the galleries
  REEF_HALL: { x0: 20240, y0: 5400, x1: 20800, y1: 5790 },
  OCEAN_HALL: { x0: 21040, y0: 5400, x1: 21524, y1: 5790 },
  LOBBY: { x0: 20240, y0: 5814, x1: 21000, y1: 6300 },
  SWIM_HALL: { x0: 21024, y0: 5814, x1: 22060, y1: 6300 },
  // the walls between them, with wide open archways
  PART_H: { x0: 20240, x1: 21524, y0: 5790, y1: 5814, gaps: [[20380, 20640], [21120, 21420]] },   // lobby↔reef, ocean↔swim hall
  PART_V: { x0: 21000, x1: 21024, y0: 5814, y1: 6300, gap: [5920, 6200] },                         // lobby↔swim hall
  // the tank windows in the back wall; `feed`: the feeding spot (a ring on the floor under the tank's feeding hatch)
  TANKS: [
    { id: 'octo', x0: 20262, y0: 5234, x1: 20372, y1: 5384, name: '🐙' },
    { id: 'reef', x0: 20392, y0: 5234, x1: 20782, y1: 5384, name: '🐠 REEF', feed: { x: 20588, y: 5440 } },
    { id: 'shark', x0: 21058, y0: 5234, x1: 21412, y1: 5384, name: '🦈 SHARKS & RAYS', feed: { x: 21236, y: 5440 } },
    { id: 'horse', x0: 21430, y0: 5234, x1: 21510, y1: 5384, name: '🌿' },
    { id: 'tback', x0: 20808, y0: 5134, x1: 21032, y1: 5384 },   // the back of the tunnel tank, up the wall
  ],
  STATIONS: [{ id: 'reef', x: 20318, y: 5700 }, { id: 'ocean', x: 21470, y: 5700 }],   // fish-food stands (a table with a bucket of food tubs)
  TUNNEL_TANK: { x0: 20800, y0: 5400, x1: 21040, y1: 5790 },   // the big tank between the reef and ocean halls...
  TUNNEL: { x0: 20800, y0: 5560, x1: 21040, y1: 5680 },        // ...and the glass tunnel walkway through it
  // the lobby
  EXIT: { x: 20620, y: 6282 },                   // the mat inside the door (the door is in the bottom wall)
  POOL: { x: 20380, y: 6090, rx: 74, ry: 38 }, STAR: { x: 20366, y: 6092 },   // the touch pool and its starfish
  JELLY: { x: 20860, y: 5990, r: 34 },           // the glowing jellyfish column
  KIOSK: { x0: 20790, y0: 6090, x1: 20970, y1: 6118 },   // the little gift counter
  PADS: { plush: { x: 20830, y: 6178 }, shell: { x: 20930, y: 6178 } },
  SHELF: { x0: 20270, y0: 6304, x1: 20410, y1: 6320 },   // the shell shelf on the bottom wall, left of the door
  RUG: { x: 20620, y: 6020, rx: 80, ry: 36 },    // a round fish mosaic in the middle of the lobby
  DIVER_PATH: [{ x: 20500, y: 5880 }, { x: 20700, y: 5872 }, { x: 20730, y: 6010 }, { x: 20520, y: 6000 }],
  // the swim hall
  LAGOON: { x0: 21220, y0: 5990, x1: 22060, y1: 6300 },   // the water (solid when walking)
  SWIM: { x0: 21250, y0: 6022, x1: 22048, y1: 6298 },     // where a swimmer can go (walls round it while swimming)
  STEPS: { x0: 21220, y0: 6086, x1: 21268, y1: 6214 },    // the steps down into the water
  STEP_OUT: { x: 21190, y: 6150 }, STEP_IN: { x: 21290, y: 6150 },
  RACK: { x0: 21120, y0: 6236, x1: 21180, y1: 6254 },     // the goggles and snorkels rack
  // the penguin habitat: snow, ice rocks, an ice slide, a pool, a fish bucket; a glass fence with a gate on the south
  HAB: { x0: 21540, y0: 5400, x1: 22060, y1: 5860 },
  GATE: { x0: 21760, x1: 21840 }, GATE_OUT: { x: 21800, y: 5904 }, GATE_IN: { x: 21800, y: 5830 },
  PPOOL: { x0: 21790, y0: 5470, x1: 22040, y1: 5612 },
  ROCKS: [{ x0: 21560, y0: 5414, x1: 21700, y1: 5500 }, { x0: 21566, y0: 5690, x1: 21630, y1: 5736 }, { x0: 21980, y0: 5704, x1: 22044, y1: 5764 }],
  SLIDE: { foot: { x: 21660, y: 5528 }, a: { x: 21704, y: 5456 }, b: { x: 21826, y: 5536 } },   // climb up the big rock at the foot, slide from a to b
  PBUCKET: { x: 21664, y: 5806 },
  COIN: { x: 20920, y: 5620 },                   // (the Pizza Coin sits in the fish tunnel)
  PLUSH: 30, NEAR_OCTO: 90, PET: 1.2,            // seconds the plush lasts; how close makes the octopus shy; the starfish wiggle
};
CFG.AREAS.aquarium = { WORLD: CFG.AQUARIUM.WORLD, place: 'city' };

const AquariumExt = {
  name: 'aquarium',
  st: null,
  defaults: { aquarium: { seen: false, tunnel: false, fed: 0, fedTanks: {}, pets: 0, penguins: false, plushes: 0, shells: 0, swims: 0, visits: 0, penguinFed: 0, nuzzles: 0 } },

  // ---------- state ----------
  build(g) {
    if (!g.s.aquarium) g.s.aquarium = {};
    const d = this.defaults.aquarium;
    for (const k of Object.keys(d)) if (g.s.aquarium[k] === undefined) g.s.aquarium[k] = JSON.parse(JSON.stringify(d[k]));
    const A = CFG.AQUARIUM;
    this.st = {
      mode: 'walk', carry: null,                 // mode: 'walk' | 'swim' | 'peng'; carry: null | 'food' | 'fish'
      fade: 0, plush: 0, star: 0, drip: 0, swimT: 0, last: { x: 0, y: 0 }, sv: { x: 0, y: 0 }, nuzzled: false,
      flakes: [], pours: [], tosses: [], parts: [], bubbles: [], bubbleT: 0,
      life: this.makeTankLife(),
      turtle: { x: 20500, y: 5330, dir: 1 },
      lag: this.makeLagoon(),
      pengs: this.makePenguins(),
      crab: { x: A.POOL.x, dir: -1 },
      diver: { x: A.DIVER_PATH[0].x, y: A.DIVER_PATH[0].y, leg: 1, facing: 1, moving: false, bob: 0, wave: 0, bubT: 0 },
      obs: this.makeObstacles(),
    };
  },
  tank(id) { return CFG.AQUARIUM.TANKS.find((k) => k.id === id); },
  makeTankLife() {
    const A = CFG.AQUARIUM, out = [], cols = ['#ff7043', '#ffd166', '#4dd0e1', '#ff8fab', '#9ccc65', '#ffab40', '#b388ff', '#fff176'];
    const add = (T, kind, n, sizes) => {
      for (let i = 0; i < n; i++) {
        const s = sizes[i % sizes.length], hw = kind === 'shark' ? 40 : kind === 'ray' ? 28 : s * 1.8, hh = kind === 'shark' ? 16 : kind === 'ray' ? 12 : s;
        out.push({ tank: T, kind, s, hw, hh, x: U.rand(T.x0 + hw + 4, T.x1 - hw - 4), y0: U.rand(T.y0 + 16 + hh, T.y1 - 16 - hh), y: 0, dir: Math.random() < 0.5 ? -1 : 1,
          sp: kind === 'shark' ? U.rand(18, 26) : kind === 'ray' ? 16 : U.rand(14, 30), w: U.rand(1.2, 2.6), ph: U.rand(0, 6.3), amp: U.rand(2, 6), col: cols[(i * 3 + Math.round(T.x0)) % cols.length], nom: 0 });
      }
    };
    add(this.tank('reef'), 'fish', 12, [8, 7, 10, 8, 9, 7]);
    add(this.tank('octo'), 'fish', 2, [6]);
    add(this.tank('shark'), 'shark', 2, [1]); add(this.tank('shark'), 'ray', 1, [1]); add(this.tank('shark'), 'fish', 6, [9, 8, 10]);
    add(this.tank('horse'), 'fish', 2, [5, 6]);
    add(this.tank('tback'), 'fish', 6, [9, 7, 11]);
    add(A.TUNNEL_TANK, 'fish', 12, [9, 8, 11, 7, 10]);
    for (const c of out) c.y = c.y0;
    return out;
  },
  makeLagoon() {
    const S = CFG.AQUARIUM.SWIM, sets = [['#ffd166', '#ffb703'], ['#4dd0e1', '#80deea'], ['#ff8fab', '#ff7043']], schools = [];
    for (let k = 0; k < 3; k++) {
      const cx = S.x0 + 160 + k * 240, cy = S.y0 + 60 + (k % 2) * 120, sc = { cx, cy, tx: cx, ty: cy, fish: [] };
      for (let i = 0; i < 9; i++) sc.fish.push({ ox: U.rand(-40, 40), oy: U.rand(-22, 22), ph: U.rand(0, 6.3), x: cx, y: cy, dir: 1, s: U.rand(6, 8.5), col: sets[k][i % 2], w: U.rand(1.5, 3), nom: 0 });
      schools.push(sc);
    }
    return {
      schools,
      turtle: { x: S.x0 + 520, y: S.y0 + 170, tx: S.x0 + 300, ty: S.y0 + 120, dir: -1 },
      ray: { x: 0, y: 0, a: 0, dir: 1, hi: 0 },
      jellies: [{ x: 21880, y: 6070, ph: 0 }, { x: 21960, y: 6190, ph: 2 }, { x: 21640, y: 6250, ph: 4 }],
    };
  },
  makePenguins() {
    const spots = [[21600, 5600], [21680, 5640], [21740, 5700], [21820, 5680], [21900, 5660], [21960, 5640], [21700, 5780]];
    return spots.map(([x, y], i) => ({ x, y, tx: x, ty: y, dir: i % 2 ? -1 : 1, mode: 'walk', bob: 0, wait: i * 0.4, t: 0, cool: 3 + i * 2.3, hop: 0, belly: false, moving: false,
      nuzzle: 0, eat: 0, flap: 0, stuck: 0, ph: i * 1.7, swimFor: 0 }));
  },
  makeObstacles() {
    const A = CFG.AQUARIUM, R = A.ROOM, w = A.WALL, walk = [], swim = [], peng = [];
    const box = (o, x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    box(walk, R.x0 - w, R.y0 - w, R.x1 + w, R.y0); box(walk, R.x0 - w, R.y1, R.x1 + w, R.y1 + w);
    box(walk, R.x0 - w, R.y0, R.x0, R.y1); box(walk, R.x1, R.y0, R.x1 + w, R.y1);
    const H = A.PART_H; let x = H.x0;
    for (const [a, b] of H.gaps) { box(walk, x, H.y0, a, H.y1); x = b; }
    box(walk, x, H.y0, H.x1, H.y1);
    const V = A.PART_V; box(walk, V.x0, V.y0, V.x1, V.gap[0]); box(walk, V.x0, V.gap[1], V.x1, V.y1);
    const TT = A.TUNNEL_TANK, TU = A.TUNNEL; box(walk, TT.x0, TT.y0, TT.x1, TU.y0); box(walk, TT.x0, TU.y1, TT.x1, TT.y1);
    const L = A.LAGOON; box(walk, L.x0, L.y0, L.x1, L.y1);
    const HB = A.HAB; box(walk, HB.x0 - 16, HB.y0, HB.x1, HB.y1 + 16);   // the habitat with its west glass wall and south fence
    const P = A.POOL; box(walk, P.x - P.rx, P.y - P.ry, P.x + P.rx, P.y + P.ry);
    const K = A.KIOSK; box(walk, K.x0, K.y0, K.x1, K.y1);
    const J = A.JELLY; box(walk, J.x - J.r, J.y - 16, J.x + J.r, J.y + 14);
    for (const S of A.STATIONS) box(walk, S.x - 22, S.y - 14, S.x + 22, S.y + 8);
    const RK = A.RACK; box(walk, RK.x0, RK.y0, RK.x1, RK.y1);
    const S = A.SWIM; box(swim, S.x0 - 40, S.y0 - 40, S.x1 + 40, S.y0); box(swim, S.x0 - 40, S.y1, S.x1 + 40, S.y1 + 40);
    box(swim, S.x0 - 40, S.y0, S.x0, S.y1); box(swim, S.x1, S.y0, S.x1 + 40, S.y1);
    box(peng, HB.x0 - 30, HB.y0 - 30, HB.x1 + 30, HB.y0); box(peng, HB.x0 - 30, HB.y1, HB.x1 + 30, HB.y1 + 30);
    box(peng, HB.x0 - 30, HB.y0, HB.x0, HB.y1); box(peng, HB.x1, HB.y0, HB.x1 + 30, HB.y1);
    for (const r of A.ROCKS) box(peng, r.x0, r.y0, r.x1, r.y1);
    const PP = A.PPOOL; box(peng, PP.x0, PP.y0, PP.x1, PP.y1);
    const B = A.PBUCKET; box(peng, B.x - 14, B.y - 12, B.x + 14, B.y + 6);
    return { walk, swim, peng };
  },
  obstacles(g) { return g.area === 'aquarium' && this.st ? this.st.obs[this.st.mode] : []; },
  inRect(x, y, R, m = 0) { return x > R.x0 - m && x < R.x1 + m && y > R.y0 - m && y < R.y1 + m; },
  // can the chef stand here, in the current mode?
  free(x, y) {
    const st = this.st, A = CFG.AQUARIUM, r = 12, B = st.mode === 'swim' ? A.SWIM : st.mode === 'peng' ? A.HAB : A.ROOM;
    if (x < B.x0 + r || x > B.x1 - r || y < B.y0 + r || y > B.y1 - r) return false;
    for (const o of st.obs[st.mode]) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.AQUARIUM.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  inTunnel(x, y) { return this.inRect(x, y, CFG.AQUARIUM.TUNNEL); },
  nearPool(g) { const P = CFG.AQUARIUM.POOL, p = g.player; return U.dist(p.x, p.y, P.x, P.y) < 70 + 20; },
  octoNear(g) { const T = this.tank('octo'), p = g.player; if (g.area !== 'aquarium' || this.st.mode !== 'walk') return 0; return U.clamp(1 - (U.dist(p.x, p.y, (T.x0 + T.x1) / 2, T.y1 + 36) - 30) / CFG.AQUARIUM.NEAR_OCTO, 0, 1); },
  stationNear(p, r = 56) { return CFG.AQUARIUM.STATIONS.find((S) => U.dist(p.x, p.y, S.x, S.y + 24) < r) || null; },
  feedTankNear(p, r = 46) { return CFG.AQUARIUM.TANKS.find((T) => T.feed && U.dist(p.x, p.y, T.feed.x, T.feed.y) < r) || null; },
  nearestOf(p, list) { let best = null, bd = Infinity; for (const q of list) { const d = U.dist(p.x, p.y, q.x, q.y); if (d < bd) { bd = d; best = q; } } return best; },
  nearestPenguin(p, r) { let best = null, bd = r; for (const pg of this.st.pengs) { if (pg.mode !== 'walk') continue; const d = U.dist(p.x, p.y, pg.x, pg.y); if (d < bd) { bd = d; best = pg; } } return best; },
  float(g, x, y, text, dur = 1.5) { g.floats.push({ x, y, text, color: '#ffe08a', t: 0, dur, big: true }); },
  heart(x, y) { this.st.parts.push({ k: 'heart', x, y, vx: U.rand(-8, 8), vy: -26, t: 0, dur: 1.1 }); },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'aquarium' || !this.onFoot(g)) return null;
    const p = g.player, A = CFG.AQUARIUM, st = this.st, near = (q, r) => U.dist(p.x, p.y, q.x, q.y) < r;
    if (st.mode === 'swim') return near(A.STEP_IN, 56) ? { label: '🚶 Climb out', run: (gg) => this.climbOut(gg) } : null;
    if (st.mode === 'peng') {
      if (near(A.GATE_IN, 34)) return { label: '🚪 Leave the penguins', run: (gg) => this.leavePenguins(gg) };
      if (st.carry === 'fish') { const pg = this.nearestPenguin(p, 84); if (pg) return { label: '🐟 Give the fish', run: (gg) => this.giveFish(gg, pg) }; }
      if (st.carry !== 'fish' && near(A.PBUCKET, 52)) return { label: '🐟 Take a fish', run: (gg) => this.takeFish(gg) };
      return null;
    }
    if (near(A.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (st.carry === 'food') { const T = this.feedTankNear(p); if (T) return { label: '🫳 Drop the food in', run: (gg) => this.dropFood(gg, T) }; }
    if (st.carry !== 'food') { const S = this.stationNear(p); if (S) return { label: '🐟 Take fish food', run: (gg) => this.takeFood(gg, S) }; }
    if (near(A.STEP_OUT, 40)) return { label: '🤿 Put on goggles and swim', run: (gg) => this.swimIn(gg) };
    if (near(A.GATE_OUT, 36)) return { label: '🐧 Visit the penguins', run: (gg) => this.visitPenguins(gg) };
    if (this.nearPool(g)) return { label: '⭐ Pet the starfish', run: (gg) => this.pet(gg) };
    return null;
  },
  enter(g) {
    const A = CFG.AQUARIUM, p = g.player, st = this.st;
    g.area = 'aquarium'; p.x = A.EXIT.x; p.y = A.EXIT.y - 16; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.mode = 'walk'; st.carry = null; st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.aquarium.seen) { g.s.aquarium.seen = true; g.toast('🐠 Welcome to the Aquarium!', true); }
  },
  leave(g) {
    const A = CFG.AQUARIUM, p = g.player, st = this.st;
    g.area = 'city'; p.x = A.DOOR_OUT.x; p.y = A.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.mode = 'walk'; st.carry = null; st.drip = 0; st.fade = 0.45; Sfx.drop();
  },
  takeFood(g, S) {
    const st = this.st, p = g.player;
    st.carry = 'food';
    this.float(g, p.x, p.y - 80, 'Fish food! 🐟');
    for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: S.x + U.rand(-14, 14), y0: S.y - 20 + U.rand(-8, 8), x1: 0, y1: 0, t: -i * 0.08, dur: 0.5 });
    Sfx.pickup(); Haptics.tap();
  },
  // the tub flies up into the tank's feeding hatch, tips over and sprinkles the flakes into the water
  dropFood(g, T) {
    const st = this.st, p = g.player, s = g.s.aquarium, f = p.facing || 1;
    st.carry = null;
    st.pours.push({ tank: T, x0: p.x + f * 18, y0: p.y - 28, x1: T.feed.x, y1: T.y0 - 4, t: 0, spawned: 0 });
    s.fed++; s.fedTanks[T.id] = true;
    this.float(g, T.feed.x, T.feed.y - 90, 'Nom nom! 🐟');
    Sfx.drop(); Haptics.success();
  },
  swimIn(g) {
    const st = this.st, p = g.player, A = CFG.AQUARIUM;
    st.carry = null; st.mode = 'swim'; st.drip = 0; st.swimT = 0;
    p.x = A.STEP_IN.x; p.y = A.STEP_IN.y; p.moving = false; p.facing = 1;
    st.last.x = p.x; st.last.y = p.y; st.sv.x = 0; st.sv.y = 0;
    g.s.aquarium.swims++;
    this.float(g, p.x, p.y - 60, 'Splash! 🌊');
    for (let i = 0; i < 10; i++) st.parts.push({ k: 'splash', x: p.x + U.rand(-16, 16), y: p.y - 12, vx: U.rand(-60, 60), vy: U.rand(-150, -70), t: 0, dur: 0.6 });
    Sfx.pickup(); Haptics.tap();
  },
  climbOut(g) {
    const st = this.st, p = g.player, A = CFG.AQUARIUM;
    st.mode = 'walk'; st.drip = 3;
    p.x = A.STEP_OUT.x; p.y = A.STEP_OUT.y; p.moving = false; p.facing = -1;
    this.float(g, p.x, p.y - 80, 'Drip drip! 💧');
    Sfx.drop(); Haptics.tap();
  },
  visitPenguins(g) {
    const st = this.st, p = g.player, A = CFG.AQUARIUM, s = g.s.aquarium;
    st.carry = null; st.mode = 'peng'; st.nuzzled = false;
    p.x = A.GATE_IN.x; p.y = A.GATE_IN.y; p.moving = false;
    s.visits++; s.penguins = true;
    this.float(g, p.x, p.y - 80, 'Hello penguins! 🐧');
    Sfx.pickup(); Haptics.tap();
  },
  leavePenguins(g) {
    const st = this.st, p = g.player, A = CFG.AQUARIUM;
    st.carry = null; st.mode = 'walk';
    p.x = A.GATE_OUT.x; p.y = A.GATE_OUT.y; p.moving = false;
    Sfx.drop(); Haptics.tap();
  },
  takeFish(g) {
    const st = this.st, p = g.player;
    st.carry = 'fish';
    this.float(g, p.x, p.y - 80, 'A fish for a penguin! 🐟');
    for (const pg of st.pengs) pg.flap = 0.8;
    Sfx.pickup(); Haptics.tap();
  },
  giveFish(g, pg) {
    const st = this.st, p = g.player, f = p.facing || 1;
    st.carry = null;
    st.tosses.push({ x0: p.x + f * 18, y0: p.y - 26, pg, t: 0 });
    pg.eat = 1.6; pg.dir = p.x < pg.x ? -1 : 1; pg.wait = 1.6;
    for (const q of st.pengs) if (q !== pg) q.flap = 1.2;
    g.s.aquarium.penguinFed++;
    this.float(g, pg.x, pg.y - 70, 'Gulp! 🐧💕');
    Sfx.pickup(); Haptics.success();
  },
  pet(g) {
    const st = this.st, S = CFG.AQUARIUM.STAR;
    st.star = CFG.AQUARIUM.PET; g.s.aquarium.pets++;
    this.float(g, S.x, S.y - 40, 'Squishy! ⭐');
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: S.x + U.rand(-18, 18), y0: S.y - 10 + U.rand(-10, 6), x1: 0, y1: 0, t: -i * 0.08, dur: 0.6 });
    Sfx.pickup(); Haptics.tap();
  },
  resetPenguins() {
    for (const pg of this.st.pengs) {
      if (pg.mode !== 'walk') { const P = CFG.AQUARIUM.PPOOL; pg.x = U.clamp(pg.x, P.x0 + 20, P.x1 - 20); pg.y = P.y1 + 18; }
      pg.mode = 'walk'; pg.tx = pg.x; pg.ty = pg.y; pg.hop = 0; pg.belly = false; pg.nuzzle = 0; pg.eat = 0; pg.flap = 0; pg.wait = 0.5;
    }
  },
  home(g) {
    if (!this.st) return;
    const st = this.st, D = CFG.AQUARIUM.DIVER_PATH[0];
    st.mode = 'walk'; st.carry = null; st.drip = 0; st.fade = 0; st.star = 0;
    st.flakes = []; st.pours = []; st.tosses = []; st.parts = []; st.sv.x = 0; st.sv.y = 0;
    st.diver.x = D.x; st.diver.y = D.y; st.diver.leg = 1; st.diver.moving = false; st.diver.wave = 0;
    this.resetPenguins();
  },
  // a save, a push or a teleport that left the chef somewhere they cannot stand: back to a free spot nearby
  rescue(g) {
    const p = g.player, A = CFG.AQUARIUM, st = this.st;
    if (this.free(p.x, p.y)) return false;
    if (st.mode === 'swim') {
      const S = A.SWIM; p.x = U.clamp(p.x, S.x0 + 14, S.x1 - 14); p.y = U.clamp(p.y, S.y0 + 14, S.y1 - 14);
      st.last.x = p.x; st.last.y = p.y; st.sv.x = 0; st.sv.y = 0;
      return true;
    }
    let to;
    if (st.mode === 'peng') to = A.GATE_IN;
    else if (this.inRect(p.x, p.y, A.LAGOON, 12)) to = A.STEP_OUT;
    else if (this.inRect(p.x, p.y, A.HAB, 12)) to = A.GATE_OUT;
    else to = { x: A.EXIT.x, y: A.EXIT.y - 16 };
    p.x = to.x; p.y = to.y; p.moving = false;
    this.float(g, p.x, p.y - 50, 'Oops! Back inside', 1.4);
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, A = CFG.AQUARIUM, s = g.s.aquarium;
    st.fade = Math.max(0, st.fade - dt);
    st.plush = Math.max(0, st.plush - dt);
    if (g.area !== 'aquarium') {
      if (st.mode !== 'walk' || st.carry) { st.mode = 'walk'; st.carry = null; this.resetPenguins(); }
      st.drip = 0;
      return;
    }
    if (st.mode === 'swim') { this.glide(g, dt); st.swimT += dt; }
    this.rescue(g);
    st.last.x = p.x; st.last.y = p.y;
    st.star = Math.max(0, st.star - dt);
    if (st.mode === 'walk' && !s.tunnel && this.inTunnel(p.x, p.y)) { s.tunnel = true; this.float(g, p.x, p.y - 80, 'Fish overhead! 🐟'); }
    this.updatePours(g, dt);
    this.updateTanks(g, dt);
    this.updateLagoon(g, dt);
    this.updatePenguins(g, dt);
    this.updateDiver(g, dt);
    // the crab scuttles sideways round the touch pool
    const c = st.crab; c.x += c.dir * 12 * dt; if (c.x > A.POOL.x + 36) c.dir = -1; else if (c.x < A.POOL.x - 40) c.dir = 1;
    // water drips off the chef for a while after a swim
    if (st.drip > 0) {
      st.drip = Math.max(0, st.drip - dt);
      if (Math.random() < dt * 14) st.parts.push({ k: 'drop', x: p.x + U.rand(-13, 13), y: p.y - U.rand(18, 50), vx: 0, vy: 20, t: 0, dur: 0.45 });
    }
    // swimming: little bubbles from the kicking feet
    if (st.mode === 'swim' && p.moving && Math.random() < dt * 5) st.parts.push({ k: 'bub', x: p.x - (p.facing || 1) * 30 + U.rand(-4, 4), y: p.y - 8, vx: 0, vy: -24, t: 0, dur: 0.8 });
    for (const q of st.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.k === 'drop' || q.k === 'splash') q.vy += 420 * dt; }
    st.parts = st.parts.filter((q) => q.t < q.dur);
    if (st.parts.length > 160) st.parts.splice(0, st.parts.length - 160);
    for (const q of st.tosses) q.t += dt;
    st.tosses = st.tosses.filter((q) => q.t < 0.4);
  },
  // swimming feels floaty: the chef glides a little slower than walking and drifts on when the stick is let go
  glide(g, dt) {
    const st = this.st, p = g.player, S = CFG.AQUARIUM.SWIM, dx = p.x - st.last.x, dy = p.y - st.last.y;
    if (Math.abs(dx) > 40 || Math.abs(dy) > 40) { st.sv.x = 0; st.sv.y = 0; return; }   // a teleport, not a stroke
    const k = 1 - Math.exp(-dt * 5);
    st.sv.x = U.lerp(st.sv.x, dx / dt * 0.72, k); st.sv.y = U.lerp(st.sv.y, dy / dt * 0.72, k);
    p.x = U.clamp(st.last.x + st.sv.x * dt, S.x0 + 13, S.x1 - 13);
    p.y = U.clamp(st.last.y + st.sv.y * dt, S.y0 + 13, S.y1 - 13);
  },
  updatePours(g, dt) {
    const st = this.st;
    for (const q of st.pours) {
      q.t += dt;
      // once the tub is over the hatch it tips and the flakes sprinkle into the water
      const want = q.t < 0.45 ? 0 : Math.min(14, Math.floor((q.t - 0.45) / 0.05));
      while (q.spawned < want) {
        q.spawned++;
        const T = q.tank;
        st.flakes.push({ tank: T, x: U.clamp(q.x1 + U.rand(-34, 34), T.x0 + 10, T.x1 - 10), y: T.y0 + 8 + U.rand(0, 6), vy: U.rand(12, 20), ph: U.rand(0, 6.3), t: 0, col: q.spawned % 3 ? '#ffd166' : '#ff8a65' });
      }
    }
    st.pours = st.pours.filter((q) => q.t < 1.3);
  },
  updateTanks(g, dt) {
    const st = this.st, A = CFG.AQUARIUM, t = g.time;
    for (const f of st.flakes) { f.t += dt; f.y = Math.min(f.tank.y1 - 12, f.y + f.vy * dt); f.x += Math.sin(t * 3 + f.ph) * 5 * dt; }
    for (const f of st.life) {
      const T = f.tank; let best = null, bd = Infinity;
      for (const fl of st.flakes) { if (fl.tank !== T || fl.eaten) continue; const d = U.dist(f.x, f.y, fl.x, fl.y); if (d < bd) { bd = d; best = fl; } }
      f.nom = Math.max(0, f.nom - dt);
      if (best) {
        const tx = U.clamp(best.x, T.x0 + f.hw, T.x1 - f.hw), ty = U.clamp(best.y, T.y0 + f.hh + 4, T.y1 - f.hh - 6);
        if (Math.abs(tx - f.x) > 3) f.dir = tx > f.x ? 1 : -1;
        U.moveToward(f, tx, ty, f.kind === 'fish' ? 95 : 70, dt);
        if (best.t > 0.7 && U.dist(f.x, f.y, best.x, best.y) < (f.kind === 'fish' ? f.s + 6 : 20)) {   // a moment to see the flakes fall first
          best.eaten = true; f.nom = 0.45;
          st.bubbles.push({ tank: T, x: f.x + f.dir * f.hw * 0.6, y: f.y - 4, r: 2, t: 0 });
          if (Math.random() < 0.6) this.heart(f.x, f.y - f.hh - 4);
        }
        f.y0 = f.y;
      } else {
        f.x += f.dir * f.sp * dt;
        if (f.x < T.x0 + f.hw) { f.x = T.x0 + f.hw; f.dir = 1; } else if (f.x > T.x1 - f.hw) { f.x = T.x1 - f.hw; f.dir = -1; }
        f.y0 = U.clamp(f.y0, T.y0 + f.hh + 10, T.y1 - f.hh - 12);
        f.y = f.y0 + Math.sin(t * f.w + f.ph) * f.amp;
      }
    }
    st.flakes = st.flakes.filter((f) => !f.eaten && f.t < 12);
    // the reef's sea turtle paddles slowly to and fro
    const tu = st.turtle, R = this.tank('reef'); tu.x += tu.dir * 10 * dt; tu.y = R.y0 + 60 + Math.sin(t * 0.8) * 8;
    if (tu.x > R.x1 - 34) tu.dir = -1; else if (tu.x < R.x0 + 34) tu.dir = 1;
    // bubbles rise in every tank
    st.bubbleT -= dt;
    if (st.bubbleT <= 0) {
      st.bubbleT = U.rand(0.15, 0.35);
      const T = U.pick(A.TANKS.concat([A.TUNNEL_TANK, A.LAGOON]));
      st.bubbles.push({ tank: T, x: U.rand(T.x0 + 10, T.x1 - 10), y: T === A.LAGOON ? U.rand(T.y0 + 40, T.y1 - 10) : T.y1 - 10, r: U.rand(1.5, 3.5), t: 0 });
    }
    for (const b of st.bubbles) { b.t += dt; b.y -= (14 + b.r * 4) * dt; }
    st.bubbles = st.bubbles.filter((b) => (b.tank === A.LAGOON ? b.t < 1.6 : b.y > b.tank.y0 + 6));
  },
  updateLagoon(g, dt) {
    const st = this.st, L = st.lag, S = CFG.AQUARIUM.SWIM, p = g.player, t = g.time, swim = st.mode === 'swim';
    const k = 1 - Math.exp(-dt * 3);
    for (const sc of L.schools) {
      if (U.dist(sc.cx, sc.cy, sc.tx, sc.ty) < 4) { sc.tx = U.rand(S.x0 + 70, S.x1 - 70); sc.ty = U.rand(S.y0 + 40, S.y1 - 40); }
      const o = { x: sc.cx, y: sc.cy }; U.moveToward(o, sc.tx, sc.ty, 26, dt); const vx = o.x - sc.cx; sc.cx = o.x; sc.cy = o.y;
      for (const f of sc.fish) {
        const a = t * 0.7 + f.ph;
        let hx = sc.cx + f.ox + Math.cos(a) * 12, hy = sc.cy + f.oy + Math.sin(a) * 7;
        if (swim) {   // they swirl away from the swimmer, then come back
          const d = U.dist(hx, hy, p.x, p.y - 12);
          if (d < 110) { const m = (110 - d) * 1.5 / Math.max(d, 1); hx += (hx - p.x) * m; hy += (hy - p.y + 12) * m; }
        }
        hx = U.clamp(hx, S.x0 + 8, S.x1 - 8); hy = U.clamp(hy, S.y0 - 10, S.y1 - 6);
        const nx = U.lerp(f.x, hx, k), ny = U.lerp(f.y, hy, k);
        if (Math.abs(nx - f.x) > 0.15) f.dir = nx > f.x ? 1 : -1; else if (Math.abs(vx) > 0.01) f.dir = vx > 0 ? 1 : -1;
        f.x = nx; f.y = ny;
      }
    }
    // the turtle paddles about; it turns to swim alongside a swimmer close by
    const tu = L.turtle;
    if (U.moveToward(tu, tu.tx, tu.ty, 16, dt)) { tu.tx = U.rand(S.x0 + 60, S.x1 - 60); tu.ty = U.rand(S.y0 + 30, S.y1 - 30); }
    if (Math.abs(tu.tx - tu.x) > 2) tu.dir = tu.tx > tu.x ? 1 : -1;
    // the friendly ray glides a big figure of eight and waves its wings
    const ray = L.ray, cx = (S.x0 + S.x1) / 2 + 40, cy = (S.y0 + S.y1) / 2 + 4; ray.a += dt * 0.2;
    const rx = cx + Math.cos(ray.a) * 300, ry = cy + Math.sin(ray.a * 2) * 70;
    ray.dir = rx >= ray.x ? 1 : -1; ray.x = rx; ray.y = ry;
    ray.hi = swim && U.dist(p.x, p.y, ray.x, ray.y) < 90 ? Math.min(1, ray.hi + dt * 2) : Math.max(0, ray.hi - dt);
  },
  // ---- penguins
  pFree(x, y, chef) {
    const A = CFG.AQUARIUM, H = A.HAB;
    if (x < H.x0 + 12 || x > H.x1 - 12 || y < H.y0 + 22 || y > H.y1 - 8) return false;
    for (const r of A.ROCKS) if (this.inRect(x, y, r, 6)) return false;
    if (this.inRect(x, y, A.PPOOL, 4)) return false;
    const B = A.PBUCKET; if (Math.abs(x - B.x) < 20 && Math.abs(y - B.y) < 14) return false;
    if (chef && U.dist(x, y, chef.x, chef.y) < 28) return false;
    return true;
  },
  pgMove(pg, tx, ty, sp, dt, chef) {
    const dx = tx - pg.x, dy = ty - pg.y, d = Math.hypot(dx, dy);
    if (d < 3) { pg.moving = false; return true; }
    const k = Math.min(1, sp * dt / d), x0 = pg.x, y0 = pg.y;
    if (this.pFree(pg.x + dx * k, pg.y, chef)) pg.x += dx * k;
    if (this.pFree(pg.x, pg.y + dy * k, chef)) pg.y += dy * k;
    if (pg.x === x0 && pg.y === y0) {   // blocked by a rock or the pool: step round it sideways
      const s = sp * dt / d, side = pg.ph > 3 ? 1 : -1;
      for (const sg of [side, -side]) { const nx = pg.x - dy * s * sg, ny = pg.y + dx * s * sg; if (this.pFree(nx, ny, chef)) { pg.x = nx; pg.y = ny; break; } }
    }
    if (Math.abs(dx) > 2) pg.dir = dx > 0 ? 1 : -1;
    const moved = Math.hypot(pg.x - x0, pg.y - y0);
    pg.moving = moved > 0.05; pg.bob += dt * (pg.belly ? 20 : 11);
    pg.stuck = moved < sp * dt * 0.2 ? pg.stuck + dt : 0;
    return d <= sp * dt + 0.5;
  },
  updatePenguins(g, dt) {
    const st = this.st, A = CFG.AQUARIUM, p = g.player, t = g.time, inside = st.mode === 'peng', SL = A.SLIDE, PP = A.PPOOL, H = A.HAB;
    let busy = st.pengs.some((q) => q.mode === 'toSlide' || q.mode === 'climb' || q.mode === 'slide');   // one penguin on the slide at a time
    st.pengs.forEach((pg, i) => {
      pg.t += dt; pg.nuzzle = Math.max(0, pg.nuzzle - dt); pg.eat = Math.max(0, pg.eat - dt); pg.flap = Math.max(0, pg.flap - dt);
      if (inside && st.carry === 'fish') pg.flap = Math.max(pg.flap, 0.2);
      if (pg.mode === 'toSlide') {
        pg.belly = false;
        if (this.pgMove(pg, SL.foot.x, SL.foot.y, 50, dt) || pg.stuck > 2) { pg.x = SL.foot.x; pg.y = SL.foot.y; pg.mode = 'climb'; pg.t = 0; }
      } else if (pg.mode === 'climb') {
        const k = Math.min(1, pg.t / 0.9);
        pg.x = U.lerp(SL.foot.x, SL.a.x, k); pg.y = U.lerp(SL.foot.y, SL.a.y, k); pg.hop = Math.abs(Math.sin(k * Math.PI * 3)) * 7; pg.dir = 1; pg.moving = true; pg.bob += dt * 11;
        if (k >= 1) { pg.mode = 'slide'; pg.t = 0; pg.hop = 0; }
      } else if (pg.mode === 'slide') {
        const k = Math.min(1, pg.t / 0.8), e = k * k;
        pg.x = U.lerp(SL.a.x, SL.b.x, e); pg.y = U.lerp(SL.a.y, SL.b.y, e); pg.dir = 1;
        if (Math.random() < dt * 10) st.parts.push({ k: 'snow', x: pg.x - 10, y: pg.y, vx: U.rand(-20, 0), vy: U.rand(-30, -10), t: 0, dur: 0.5 });
        if (k >= 1) {
          pg.mode = 'swim'; pg.t = 0; pg.swimFor = U.rand(3, 6); pg.tx = U.rand(PP.x0 + 30, PP.x1 - 20); pg.ty = U.rand(PP.y0 + 24, PP.y1 - 16);
          for (let j = 0; j < 8; j++) st.parts.push({ k: 'splash', x: pg.x + U.rand(-10, 10), y: pg.y, vx: U.rand(-50, 50), vy: U.rand(-120, -50), t: 0, dur: 0.5 });
        }
      } else if (pg.mode === 'swim') {
        if (U.moveToward(pg, pg.tx, pg.ty, 60, dt)) { pg.tx = U.rand(PP.x0 + 24, PP.x1 - 24); pg.ty = U.rand(PP.y0 + 24, PP.y1 - 16); }
        pg.dir = pg.tx > pg.x ? 1 : -1;
        if (pg.t > pg.swimFor || (inside && pg.t > 2)) { pg.mode = 'hop'; pg.t = 0; pg.hx0 = pg.x; pg.hy0 = pg.y; pg.hx1 = U.clamp(pg.x, PP.x0 + 24, PP.x1 - 24); pg.hy1 = PP.y1 + 18; }
      } else if (pg.mode === 'hop') {
        const k = Math.min(1, pg.t / 0.5);
        pg.x = U.lerp(pg.hx0, pg.hx1, k); pg.y = U.lerp(pg.hy0, pg.hy1, k); pg.hop = Math.sin(k * Math.PI) * 18;
        if (k >= 1) { pg.hop = 0; pg.mode = 'walk'; pg.wait = 0.4; pg.cool = U.rand(6, 14); pg.tx = pg.x; pg.ty = pg.y; }
      } else {
        // on the snow: waddle about, or (with the chef inside) follow the chef, waddle up and nuzzle
        pg.cool -= dt;
        if (!busy && pg.cool <= 0 && pg.eat <= 0 && !(inside && st.carry === 'fish')) { pg.mode = 'toSlide'; pg.belly = false; busy = true; return; }
        if (pg.eat > 0 || pg.nuzzle > 0) { pg.moving = false; pg.belly = false; return; }
        if (inside) {
          const n = st.pengs.length, a = (i / n) * Math.PI * 2 + t * 0.12, rad = st.carry === 'fish' ? 46 : 64 + (i % 3) * 18;
          let tx = p.x + Math.cos(a) * rad, ty = p.y + Math.sin(a) * rad * 0.6;
          tx = U.clamp(tx, H.x0 + 16, H.x1 - 16); ty = U.clamp(ty, H.y0 + 26, H.y1 - 10);
          const d = U.dist(pg.x, pg.y, tx, ty);
          pg.belly = d > 160 || (pg.belly && d > 60);   // far behind: flop on the belly and slide to catch up
          this.pgMove(pg, tx, ty, pg.belly ? 140 : 48, dt, p);
          if (pg.belly && Math.random() < dt * 8) st.parts.push({ k: 'snow', x: pg.x - pg.dir * 12, y: pg.y + 2, vx: -pg.dir * 20, vy: -20, t: 0, dur: 0.4 });
          if (!pg.belly && U.dist(pg.x, pg.y, p.x, p.y) < 66 && !p.moving && Math.random() < dt * 0.4) {
            pg.nuzzle = 1.3; pg.dir = p.x < pg.x ? -1 : 1; this.heart(pg.x + pg.dir * 6, pg.y - 44);
            g.s.aquarium.nuzzles++;
            if (!st.nuzzled) { st.nuzzled = true; this.float(g, pg.x, pg.y - 70, 'Nuzzle! 💕'); }
          }
        } else {
          pg.belly = false;
          if (pg.wait > 0) { pg.wait -= dt; pg.moving = false; return; }
          if (this.pgMove(pg, pg.tx, pg.ty, 26, dt) || pg.stuck > 1.5) {
            pg.wait = U.rand(0.8, 2.4); pg.stuck = 0;
            for (let k = 0; k < 8; k++) { const x = U.rand(H.x0 + 20, H.x1 - 20), y = U.rand(H.y0 + 140, H.y1 - 14); if (this.pFree(x, y)) { pg.tx = x; pg.ty = y; break; } }
          }
        }
      }
    });
  },
  updateDiver(g, dt) {
    const st = this.st, A = CFG.AQUARIUM, p = g.player, dv = st.diver, dNear = st.mode === 'walk' && U.dist(p.x, p.y, dv.x, dv.y) < 80;
    if (dNear) { dv.moving = false; dv.facing = p.x < dv.x ? -1 : 1; dv.wave += dt; }
    else { dv.wave = 0; const w = A.DIVER_PATH[dv.leg]; if (U.moveToward(dv, w.x, w.y, 34, dt)) dv.leg = (dv.leg + 1) % A.DIVER_PATH.length; else dv.facing = w.x < dv.x ? -1 : 1; }
    dv.bob = dv.moving ? dv.bob + dt * 10 : 0;
    dv.bubT -= dt; if (dv.bubT <= 0) { dv.bubT = U.rand(0.6, 1.4); st.parts.push({ k: 'bub', x: dv.x + dv.facing * 14, y: dv.y - 60, vx: 0, vy: -26, t: 0, dur: 0.9 }); }
  },
  pads(g) {
    if (g.area !== 'aquarium' || !this.st || this.st.mode !== 'walk') return [];
    const P = CFG.AQUARIUM.PADS, n = g.s.aquarium.shells;
    return [
      { key: 'aquaPlush', label: 'Fish plush', ico: '🐠', pos: P.plush, price: 5, sub: 'carry it!' },
      { key: 'aquaShell', label: 'Shell', ico: '🐚', pos: P.shell, price: 3, sub: n ? `${n} on the shelf` : 'for your shelf' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, s = g.s.aquarium;
    if (pad.key === 'aquaPlush') { this.st.plush = CFG.AQUARIUM.PLUSH; s.plushes++; this.float(g, p.x, p.y - 60, 'A fishy friend! 🐠'); Haptics.success(); }
    if (pad.key === 'aquaShell') { s.shells++; this.float(g, p.x, p.y - 60, 'A pretty shell! 🐚'); g.fx.push({ kind: 'sparkle', x0: CFG.AQUARIUM.SHELF.x0 + 12 + Math.min(s.shells - 1, 7) * 16, y0: CFG.AQUARIUM.SHELF.y0 + 4, x1: 0, y1: 0, t: 0, dur: 0.7 }); Haptics.success(); }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, A = CFG.AQUARIUM, st = this.st, s = g.s.aquarium;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, A.DOOR_OUT.x, A.DOOR_OUT.y);
      if (d < 70) return { text: 'Visit the aquarium! 🐠', target: d < 30 ? null : A.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'aquarium') return undefined;
    if (st.mode === 'swim') return { text: 'Swim with the fishes! 🐠', target: st.swimT > 40 ? A.STEP_IN : null };   // after a good swim, the arrow shows the way out
    if (st.mode === 'peng') {
      if (st.carry === 'fish') { const pg = this.nearestPenguin(p, Infinity); return { text: 'Give the fish to a penguin! 🐧', target: pg ? { x: pg.x, y: pg.y } : null }; }
      if (!s.penguinFed) return { text: 'Take a fish for the penguins! 🐟', target: A.PBUCKET };
      return { text: 'The penguins love you! 🐧', target: null };
    }
    if (st.carry === 'food') return { text: 'Drop the food in the tank! 🫳', target: this.nearestOf(p, A.TANKS.filter((T) => T.feed).map((T) => T.feed)) };
    if (this.inTunnel(p.x, p.y)) return { text: 'Look up! Fish are swimming over you 🐟', target: null };
    const target = !s.fed ? this.nearestOf(p, A.STATIONS.map((S) => ({ x: S.x, y: S.y + 24 }))) : !s.swims ? A.STEP_OUT : !s.visits ? A.GATE_OUT : null;
    return { text: 'Feed the fish, swim, or visit the penguins! 🐟🐧', target };
  },

  // ---------- the City outside: the wavy banner and the bubbles by the door ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.AQUARIUM.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🐠 AQUARIUM';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 26, x0 = cx - tw / 2, y0 = gy - 30;
    // a blue banner with a wavy bottom edge, like water
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 + 2, y0 + 2, tw, 22);
    ctx.fillStyle = '#1e88e5'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + tw, y0); ctx.lineTo(x0 + tw, y0 + 18);
    for (let x = x0 + tw; x >= x0; x -= 2) ctx.lineTo(x, y0 + 20 + Math.sin((x - x0) / 5) * 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0, y0, tw, 3);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, y0 + 10);
    for (const [dx, dy, rr] of [[-tw / 2 - 12, 4, 4], [-tw / 2 - 20, -8, 2.5], [tw / 2 + 12, 2, 4], [tw / 2 + 20, -10, 2.5]]) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx + dx, y0 + 10 + dy, rr, 0, Math.PI * 2); ctx.stroke(); }
    const D = CFG.AQUARIUM.DOOR_OUT;
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, D.x - 16, D.y - 6, 32, 11, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; this.wave(ctx, D.x - 13, D.x + 13, D.y - 1, 2, 3, 0);
  },

  // ---------- small drawing helpers ----------
  wave(ctx, x0, x1, y, amp, len, ph) { ctx.beginPath(); for (let x = x0; x <= x1; x += 2) { const yy = y + Math.sin((x - x0) / len + ph) * amp; if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); },
  sign(r, x, y, text, bg = '#2b1d14', fg = '#ffe08a', size = 10) {
    const ctx = r.ctx; ctx.font = r.font(size); const w = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - w / 2 + 2, y - size + 2, w, size * 2, 5); ctx.fill();
    ctx.fillStyle = bg; U.roundRect(ctx, x - w / 2, y - size, w, size * 2, 5); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
  },
  floor(ctx, B, c1, c2, tile = 40) {
    ctx.fillStyle = c1; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = c2;
    for (let y = B.y0; y < B.y1; y += tile) for (let x = B.x0 + (Math.round((y - B.y0) / tile) % 2) * tile; x < B.x1; x += tile * 2) ctx.fillRect(x, y, Math.min(tile, B.x1 - x), Math.min(tile, B.y1 - y));
  },
  drawHeart(ctx, x, y, s, col) {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9); ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s * 0.9, x, y - s * 0.3); ctx.bezierCurveTo(x + s * 0.7, y - s * 0.9, x + s * 1.3, y, x, y + s * 0.9); ctx.fill();
  },
  vis(r, x0, y0, x1, y1, m = 40) { return x1 > r.camX - m && x0 < r.camX + r.viewW + m && y1 > r.camY - m && y0 < r.camY + r.viewH + m; },

  // ---------- the interior, static ----------
  paint: { aquarium(r, g) { AquariumExt.paintHall(r, g); } },
  paintHall(r, g) {
    const ctx = r.ctx, A = CFG.AQUARIUM, W = A.WORLD, R = A.ROOM, w = A.WALL;
    ctx.fillStyle = '#0b1a2e'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // the back wall (tank windows go in it) with a wavy frieze along the top
    ctx.fillStyle = '#2a64a0'; ctx.fillRect(R.x0 - w, A.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - A.BACK_TOP);
    ctx.fillStyle = '#3f86c8'; ctx.fillRect(R.x0 - w, A.BACK_TOP, R.x1 - R.x0 + 2 * w, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; this.wave(ctx, R.x0 - w, R.x1 + w, A.BACK_TOP + 14, 3, 8, 0);
    ctx.fillStyle = '#1d4b7a'; ctx.fillRect(R.x0 - w, R.y0 - 8, R.x1 - R.x0 + 2 * w, 8);   // the ledge under the tanks
    // painted on the wall above the tanks: bubbles, a smiling whale over the reef, a wave over the ocean hall
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
    for (let i = 0; i < 46; i++) { const x = R.x0 + ((i * 89) % (R.x1 - R.x0)), y = A.BACK_TOP + 30 + ((i * 37) % 70); ctx.beginPath(); ctx.arc(x, y, 3 + (i % 4) * 2, 0, Math.PI * 2); ctx.stroke(); }
    this.paintWhale(ctx, 20560, 5172);
    ctx.fillStyle = '#3f86c8'; ctx.beginPath(); ctx.moveTo(21060, 5212);
    for (let x = 21060; x <= 21420; x += 6) ctx.lineTo(x, 5180 + Math.sin((x - 21060) / 40) * 16 - Math.sin((x - 21060) / 360 * Math.PI) * 18);
    ctx.lineTo(21420, 5212); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = 21070; x < 21420; x += 40) { ctx.beginPath(); ctx.arc(x, 5178 + Math.sin((x - 21060) / 40) * 16 - Math.sin((x - 21060) / 360 * Math.PI) * 18, 4, 0, Math.PI * 2); ctx.fill(); }
    // floors: aqua tiles in the reef hall, deeper blue in the ocean hall, warm sand in the lobby, a white pool deck
    this.floor(ctx, A.REEF_HALL, '#a8e2f2', '#9ad8ec');
    this.floor(ctx, A.OCEAN_HALL, '#9cccf2', '#8ec1ec');
    this.floor(ctx, A.LOBBY, '#f7e4b8', '#f0d9a6');
    this.floor(ctx, A.SWIM_HALL, '#eaf6fb', '#dcf0f8', 32);
    this.floor(ctx, A.TUNNEL, '#7fbfe6', '#74b5de', 30);
    // soft light from the tanks spills onto the floor
    for (const T of A.TANKS) { const gl = ctx.createLinearGradient(0, R.y0, 0, R.y0 + 90); gl.addColorStop(0, 'rgba(77,208,225,0.35)'); gl.addColorStop(1, 'rgba(77,208,225,0)'); ctx.fillStyle = gl; ctx.fillRect(T.x0 - 10, R.y0, T.x1 - T.x0 + 20, 90); }
    // the outer side and bottom walls
    ctx.fillStyle = '#1f4f80'; ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    ctx.fillStyle = '#16395e'; ctx.fillRect(R.x0 - w, R.y1 + w - 4, R.x1 - R.x0 + 2 * w, 4);
    for (const T of A.TANKS) this.paintWindow(r, T);
    this.paintTunnelTank(r);
    this.paintHabitat(r);
    this.paintLagoon(r);
    this.paintPartitions(r);
    this.paintLobby(r);
    // the feeding spots: a little blue step under each feeding hatch, and the food stations
    for (const T of A.TANKS) if (T.feed) this.paintFeedSpot(r, T);
    for (const S of A.STATIONS) this.paintStation(r, S);
  },
  paintWhale(ctx, x, y) {
    ctx.fillStyle = '#5aa6e0';
    ctx.beginPath(); ctx.moveTo(x - 70, y); ctx.lineTo(x - 104, y - 22); ctx.lineTo(x - 98, y); ctx.lineTo(x - 104, y + 18); ctx.closePath(); ctx.fill();   // tail
    ctx.beginPath(); ctx.ellipse(x, y, 80, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d6eefc'; ctx.beginPath(); ctx.ellipse(x + 10, y + 12, 62, 14, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + 46, y - 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + 54, y + 2, 12, 0.3, 1.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,130,160,0.6)'; ctx.beginPath(); ctx.arc(x + 36, y + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#bfe3ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';   // the spout
    for (const a of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(x + 20, y - 30); ctx.quadraticCurveTo(x + 20 + a * 20, y - 50, x + 20 + a * 34, y - 46); ctx.stroke(); }
  },
  paintPartitions(r) {
    const ctx = r.ctx, A = CFG.AQUARIUM, H = A.PART_H, V = A.PART_V;
    const wall = (x0, y0, x1, y1) => {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x0, y1, x1 - x0, 8);
      ctx.fillStyle = '#2a64a0'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = '#4b92d4'; ctx.fillRect(x0, y0, x1 - x0, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0 + 14; x < x1 - 8; x += 40) { ctx.beginPath(); ctx.arc(x, y0 + 15, 3, 0, Math.PI * 2); ctx.fill(); }
    };
    let x = H.x0;
    for (const [a, b] of H.gaps) { wall(x, H.y0, a, H.y1); x = b; }
    wall(x, H.y0, H.x1, H.y1);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(V.x1, V.y0, 8, V.gap[0] - V.y0); ctx.fillRect(V.x1, V.gap[1], 8, V.y1 - V.gap[1]);
    ctx.fillStyle = '#2a64a0'; ctx.fillRect(V.x0, V.y0, V.x1 - V.x0, V.gap[0] - V.y0); ctx.fillRect(V.x0, V.gap[1], V.x1 - V.x0, V.y1 - V.gap[1]);
    ctx.fillStyle = '#4b92d4'; ctx.fillRect(V.x0, V.y0, 6, V.gap[0] - V.y0); ctx.fillRect(V.x0, V.gap[1], 6, V.y1 - V.gap[1]);
    // round pillars either side of each archway, and a hanging sign saying where it goes
    const pillar = (px, py) => { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(px + 2, py + 6, 15, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(px - 4, py - 4, 6, 0, Math.PI * 2); ctx.fill(); };
    for (const [a, b] of H.gaps) { pillar(a, (H.y0 + H.y1) / 2); pillar(b, (H.y0 + H.y1) / 2); }
    pillar((V.x0 + V.x1) / 2, V.gap[0]); pillar((V.x0 + V.x1) / 2, V.gap[1]);
    this.sign(r, (H.gaps[0][0] + H.gaps[0][1]) / 2, H.y0 - 4, '🐠 REEF  ·  🦈 SHARKS', '#1e88e5', '#fff', 11);
    this.sign(r, (H.gaps[1][0] + H.gaps[1][1]) / 2, H.y0 - 4, '🤿 SWIM  ·  🐧 PENGUINS', '#1e88e5', '#fff', 11);
    this.sign(r, V.x0 - 56, V.gap[0] + 18, '🤿 SWIM →', '#1e88e5', '#fff', 11);
    this.sign(r, V.x1 + 60, V.gap[0] + 16, '← 🚪 EXIT', '#e4572e', '#fff', 10);
    // the welcome banner over the lobby: the three big things to do
    this.sign(r, 20820, H.y0 + 12, '🐟 FEED  ·  🤿 SWIM  ·  🐧 PENGUINS', '#e4572e', '#fff', 12);
  },
  paintWindow(r, T) {
    const ctx = r.ctx, cx = (T.x0 + T.x1) / 2, w = T.x1 - T.x0, h = T.y1 - T.y0;
    ctx.fillStyle = '#163f69'; U.roundRect(ctx, T.x0 - 8, T.y0 - 8, w + 16, h + 16, 10); ctx.fill();
    const gl = ctx.createLinearGradient(0, T.y0, 0, T.y1);
    if (T.id === 'shark') { gl.addColorStop(0, '#3aa7e0'); gl.addColorStop(1, '#0f5d9a'); } else { gl.addColorStop(0, '#5fd3f0'); gl.addColorStop(1, '#1d8fc8'); }
    ctx.fillStyle = gl; ctx.fillRect(T.x0, T.y0, w, h);
    // sun rays from the surface
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = T.x0 + 20; x < T.x1 - 10; x += 70) { ctx.beginPath(); ctx.moveTo(x, T.y0); ctx.lineTo(x + 24, T.y0); ctx.lineTo(x + 54, T.y1 - 10); ctx.lineTo(x + 26, T.y1 - 10); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(T.x0, T.y0 + 4, w, 2);   // the water's surface
    ctx.fillStyle = '#f1dea8'; ctx.beginPath(); ctx.moveTo(T.x0, T.y1); ctx.lineTo(T.x0, T.y1 - 12); for (let x = T.x0; x <= T.x1; x += 10) ctx.lineTo(x, T.y1 - 12 - Math.sin(x / 23) * 3); ctx.lineTo(T.x1, T.y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9c38a'; for (let x = T.x0 + 4; x < T.x1; x += 13) ctx.fillRect(x, T.y1 - 6, 3, 2);
    const weed = (x, hh, col) => { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, T.y1 - 8); for (let k = 1; k <= 5; k++) ctx.lineTo(x + Math.sin(k * 1.8 + x) * 5, T.y1 - 8 - k * hh / 5); ctx.stroke(); };
    const rock = (x, rw, rh, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, T.y1 - 10, rw, rh, 0, Math.PI, 0); ctx.fill(); };
    const coral = (x, col, s) => { ctx.strokeStyle = col; ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, T.y1 - 8); ctx.lineTo(x, T.y1 - 30 * s); ctx.moveTo(x, T.y1 - 18 * s); ctx.lineTo(x - 10 * s, T.y1 - 32 * s); ctx.moveTo(x, T.y1 - 22 * s); ctx.lineTo(x + 11 * s, T.y1 - 38 * s); ctx.stroke(); };
    if (T.id === 'reef') {
      rock(T.x0 + 70, 34, 22, '#7a8a96'); rock(T.x1 - 90, 40, 26, '#6b7a86');
      coral(T.x0 + 30, '#ff8fab', 1.2); coral(T.x0 + 120, '#ffab40', 1); coral(cx + 30, '#b388ff', 1.3); coral(T.x1 - 40, '#ff7043', 1.1);
      weed(T.x0 + 160, 60, '#2e9e5b'); weed(T.x0 + 176, 46, '#56b862'); weed(T.x1 - 140, 70, '#2e9e5b');
      for (const [x, col] of [[cx - 30, '#ff5c8a'], [cx + 80, '#ffd166'], [T.x1 - 70, '#4dd0e1']]) { ctx.fillStyle = col; for (let a = 0; a < 7; a++) { ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 6, T.y1 - 16 - Math.abs(Math.sin(a)) * 6, 3, 7, a, 0, Math.PI * 2); ctx.fill(); } }
    }
    if (T.id === 'octo') { rock(cx, 44, 34, '#6b7a86'); ctx.fillStyle = '#2b3a46'; ctx.beginPath(); ctx.ellipse(cx, T.y1 - 14, 18, 14, 0, Math.PI, 0); ctx.fill(); weed(T.x0 + 12, 40, '#56b862'); }
    if (T.id === 'shark') { rock(T.x0 + 60, 50, 30, '#5f6f7c'); rock(T.x1 - 70, 60, 36, '#6b7a86'); weed(cx - 20, 70, '#2e9e5b'); weed(cx - 6, 54, '#56b862'); weed(T.x1 - 16, 60, '#2e9e5b'); }
    if (T.id === 'tback') { rock(T.x0 + 60, 40, 46, '#6b7a86'); rock(T.x1 - 50, 34, 30, '#7a8a96'); coral(cx + 10, '#ff8fab', 1.4); weed(T.x0 + 20, 110, '#2e9e5b'); weed(T.x1 - 20, 140, '#56b862'); weed(cx - 40, 80, '#2e9e5b'); }
    if (T.id === 'horse') { weed(T.x0 + 12, 80, '#2e9e5b'); weed(T.x0 + 26, 64, '#56b862'); weed(T.x1 - 14, 90, '#2e9e5b'); weed(cx + 4, 50, '#56b862'); }
    // the glass: a soft sheen and a frame
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(T.x0 + 8, T.y0); ctx.lineTo(T.x0 + 34, T.y0); ctx.lineTo(T.x0 + 14, T.y1); ctx.lineTo(T.x0, T.y1); ctx.lineTo(T.x0, T.y0 + 20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#bfe3ff'; ctx.lineWidth = 3; ctx.strokeRect(T.x0, T.y0, w, h);
    if (T.name) this.sign(r, cx, T.y1 + 8, T.name, '#ffd166', '#2b1d14', 9);
    // a feeding hatch on top of the tanks you can feed
    if (T.feed) {
      const x = T.feed.x;
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x - 30, T.y0 - 22, 60, 20, 5); ctx.fill();
      ctx.fillStyle = '#e4a91f'; ctx.fillRect(x - 30, T.y0 - 6, 60, 5);
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐟 FEED', x, T.y0 - 13);
    }
  },
  paintFeedSpot(r, T) {
    const ctx = r.ctx, F = T.feed;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(F.x + 2, F.y + 4, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(F.x, F.y, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4fb3e8'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 2, 34, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🫳', F.x, F.y - 2);
    // a dotted line up the wall from the step to the hatch
    ctx.fillStyle = 'rgba(255,209,102,0.7)'; for (let y = T.y1 + 20; y < F.y - 20; y += 8) { ctx.beginPath(); ctx.arc(F.x, y, 2, 0, Math.PI * 2); ctx.fill(); }
  },
  paintStation(r, S) {
    const ctx = r.ctx, x = S.x, y = S.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 8, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
    // a little blue table
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, x - 24, y - 16, 48, 22, 5); ctx.fill();
    ctx.fillStyle = '#64b5f6'; U.roundRect(ctx, x - 24, y - 16, 48, 8, 4); ctx.fill();
    // a big red bucket full of yellow food tubs
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 16, y - 34); ctx.lineTo(x + 16, y - 34); ctx.lineTo(x + 12, y - 12); ctx.lineTo(x - 12, y - 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8a65'; ctx.fillRect(x - 16, y - 36, 32, 5);
    for (const [dx, dy] of [[-9, -42], [0, -46], [9, -41]]) { ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x + dx - 5, y + dy, 10, 12, 3); ctx.fill(); ctx.fillStyle = '#4fb3e8'; ctx.fillRect(x + dx - 5, y + dy + 5, 10, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x + dx - 5, y + dy, 10, 2); }
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 34, 15, Math.PI, 0); ctx.stroke();
    this.sign(r, x, y - 66, '🐟 FISH FOOD', '#ffd166', '#2b1d14', 9);
  },
  paintTunnelTank(r) {
    const ctx = r.ctx, A = CFG.AQUARIUM, TT = A.TUNNEL_TANK, TU = A.TUNNEL;
    // the water blocks either side of the walkway, seen from above
    for (const [y0, y1] of [[TT.y0, TU.y0], [TU.y1, TT.y1]]) {
      const gl = ctx.createLinearGradient(0, y0, 0, y1); gl.addColorStop(0, '#41b8e6'); gl.addColorStop(1, '#2a9fd6');
      ctx.fillStyle = gl; ctx.fillRect(TT.x0, y0, TT.x1 - TT.x0, y1 - y0);
      ctx.fillStyle = 'rgba(241,222,168,0.55)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(TT.x0 + 20 + k * 42, y0 + (y1 - y0) * (0.3 + (k % 3) * 0.2), 16, 7, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(46,158,91,0.6)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) { const x = TT.x0 + 30 + k * 60, yb = y0 + (y1 - y0) * 0.6; ctx.beginPath(); ctx.moveTo(x, yb); ctx.quadraticCurveTo(x + 8, yb - 14, x - 2, yb - 26); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) this.wave(ctx, TT.x0, TT.x1, y0 + 20 + k * (y1 - y0 - 30) / 2, 3, 12, k);
    }
    // the glass rims along the walkway
    ctx.fillStyle = '#d6eefc'; ctx.fillRect(TT.x0, TU.y0 - 6, TT.x1 - TT.x0, 6); ctx.fillRect(TT.x0, TU.y1, TT.x1 - TT.x0, 6);
    ctx.strokeStyle = '#163f69'; ctx.lineWidth = 3; ctx.strokeRect(TT.x0, TT.y0, TT.x1 - TT.x0, TT.y1 - TT.y0);
    this.sign(r, (TT.x0 + TT.x1) / 2, A.BACK_TOP + 6, '🐟 FISH TUNNEL', '#ffd166', '#2b1d14', 10);
  },
  paintLobby(r) {
    const ctx = r.ctx, A = CFG.AQUARIUM, R = A.ROOM, w = A.WALL;
    // the round fish mosaic in the middle
    const Rg = A.RUG;
    ctx.fillStyle = '#4fb3e8'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx, Rg.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx - 4, Rg.ry - 3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) this.wave(ctx, Rg.x - 56, Rg.x + 56, Rg.y + k * 12, 2, 5, k);
    this.drawFish(ctx, { x: Rg.x - 6, y: Rg.y, dir: 1, s: 18, col: '#ff7043', ph: 0, nom: 0 }, 0);
    // the touch pool: a low rock wall round shallow turquoise water with sand
    const P = A.POOL;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(P.x + 3, P.y + 6, P.rx + 6, P.ry + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d9aa5'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx + 6, P.ry + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a9b6c0'; for (let a = 0; a < Math.PI * 2; a += 0.42) { ctx.beginPath(); ctx.ellipse(P.x + Math.cos(a) * (P.rx + 2), P.y + Math.sin(a) * (P.ry + 2), 8, 5, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#f1dea8'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx - 5, P.ry - 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(77,208,225,0.55)'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx - 5, P.ry - 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(P.x + 40, P.y + 8, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#b388ff'; ctx.beginPath(); ctx.arc(P.x - 40, P.y - 10, 4.5, 0, Math.PI * 2); ctx.fill();
    this.sign(r, P.x, P.y - P.ry - 22, '⭐ TOUCH POOL', '#ffd166', '#2b1d14', 9);
    // the gift kiosk: a blue counter with plushes on display
    const K = A.KIOSK;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(K.x0 + 4, K.y0 + 6, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = K.x0 + 8; x < K.x1 - 6; x += 16) ctx.fillRect(x, K.y0 + 12, 8, K.y1 - K.y0 - 16);
    ctx.fillStyle = '#e3f2fd'; U.roundRect(ctx, K.x0 - 2, K.y0 - 8, K.x1 - K.x0 + 4, 18, 6); ctx.fill();
    for (let i = 0; i < 5; i++) this.drawFish(ctx, { x: K.x0 + 22 + i * 34, y: K.y0 - 4, dir: i % 2 ? -1 : 1, s: 7, col: ['#ffd166', '#ff7043', '#4dd0e1', '#ff8fab', '#9ccc65'][i], ph: 0, nom: 0 }, 0);
    this.sign(r, (K.x0 + K.x1) / 2, K.y0 - 26, '🎁 GIFTS');
    // the shell shelf on the bottom wall (the shells are drawn live, as they are bought)
    const S = A.SHELF;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, S.y0 + 10, S.x1 - S.x0, 5); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(S.x0, S.y0 + 15, S.x1 - S.x0, 2);
    // the door in the bottom wall, its mat and the name plate below
    const E = A.EXIT;
    ctx.fillStyle = '#0d2238'; ctx.fillRect(E.x - 26, R.y1, 52, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 20, R.y1 + 4, 40, 12); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 16, R.y1 + 18, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, E.x - 28, E.y - 14, 56, 22, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; this.wave(ctx, E.x - 24, E.x + 24, E.y + 3, 1.5, 3, 0);
    ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪 EXIT', E.x, E.y - 5);
    ctx.fillStyle = '#1e88e5'; U.roundRect(ctx, E.x - 60, R.y1 + w + 6, 120, 16, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.fillText('🐠 AQUARIUM 🐠', E.x, R.y1 + w + 14);
  },
  paintLagoon(r) {
    const ctx = r.ctx, A = CFG.AQUARIUM, L = A.LAGOON, ST = A.STEPS;
    // the tiled edge of the pool
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(L.x0 - 10, L.y0 - 10, L.x1 - L.x0 + 10, L.y1 - L.y0 + 10);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(L.x0 - 12, L.y0 - 12, L.x1 - L.x0 + 12, 12); ctx.fillRect(L.x0 - 12, L.y0 - 12, 12, L.y1 - L.y0 + 12);
    ctx.fillStyle = '#4fb3e8'; for (let x = L.x0 - 12; x < L.x1; x += 24) ctx.fillRect(x, L.y0 - 12, 12, 4); for (let y = L.y0; y < L.y1; y += 24) ctx.fillRect(L.x0 - 12, y, 4, 12);
    // the water, sand and rocks on the bottom, a little faded by the water above
    const gl = ctx.createLinearGradient(0, L.y0, 0, L.y1); gl.addColorStop(0, '#62d2f0'); gl.addColorStop(1, '#2fa6dc');
    ctx.fillStyle = gl; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    ctx.save(); ctx.beginPath(); ctx.rect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0); ctx.clip();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#f1dea8'; for (const [x, y, rx, ry] of [[21420, 6250, 120, 40], [21760, 6110, 150, 50], [21980, 6260, 110, 40], [21520, 6060, 70, 26]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#6b7a86'; for (const [x, y, rx, ry] of [[21600, 6190, 34, 20], [21900, 6040, 30, 16], [22020, 6170, 26, 30]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ff8fab'; for (const [x, y] of [[21580, 6170], [21880, 6060], [21470, 6270]]) for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 8, y + Math.sin(a) * 5, 5, 3, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#2e9e5b'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (const [x, y] of [[21360, 6280], [21700, 6280], [21940, 6110], [22030, 6280]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 20, x - 2, y - 42); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) this.wave(ctx, L.x0, L.x1, L.y0 + 20 + k * 34, 4, 18, k * 1.3);
    ctx.restore();
    // the steps down into the water, with handrails
    for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#e3f6ff', '#b5e6f7', '#86d4ee'][k]; ctx.fillRect(ST.x0 + k * 16, ST.y0, 16, ST.y1 - ST.y0); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 3; k++) ctx.fillRect(ST.x0 + k * 16, ST.y0, 2, ST.y1 - ST.y0);
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const y of [ST.y0 + 2, ST.y1 - 2]) { ctx.beginPath(); ctx.moveTo(ST.x0 - 20, y); ctx.lineTo(ST.x0 + 6, y); ctx.quadraticCurveTo(ST.x0 + 24, y, ST.x0 + 30, y + (y < ST.y1 - 10 ? 10 : -10)); ctx.stroke(); }
    // the goggles rack
    const RK = A.RACK;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(RK.x0 + 3, RK.y0 + 6, RK.x1 - RK.x0, RK.y1 - RK.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(RK.x0, RK.y0, RK.x1 - RK.x0, RK.y1 - RK.y0); ctx.fillRect(RK.x0 + 4, RK.y0 - 30, 4, 30); ctx.fillRect(RK.x1 - 8, RK.y0 - 30, 4, 30);
    ctx.fillRect(RK.x0, RK.y0 - 32, RK.x1 - RK.x0, 4);
    for (let i = 0; i < 3; i++) { const x = RK.x0 + 14 + i * 16, y = RK.y0 - 20; ctx.strokeStyle = ['#ff7043', '#ffd166', '#ab47bc'][i]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, RK.y0 - 28); ctx.lineTo(x, y - 4); ctx.stroke(); ctx.fillStyle = '#7fd6ff'; ctx.beginPath(); ctx.arc(x - 3, y, 3.2, 0, Math.PI * 2); ctx.arc(x + 3, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
    // a lifebuoy hung by the steps, and the sign
    ctx.lineWidth = 6; for (let k = 0; k < 4; k++) { ctx.strokeStyle = k % 2 ? '#fff' : '#e4572e'; ctx.beginPath(); ctx.arc(21080, 6120, 13, k * Math.PI / 2, (k + 1) * Math.PI / 2); ctx.stroke(); }
    this.sign(r, 21170, 5972, '🤿 SWIM', '#1e88e5', '#fff', 11);
    // beach towels and a beach ball on the deck
    for (const [x, y, c1, c2, a] of [[21360, 5936, '#ff7043', '#ffd166', -0.08], [21490, 5940, '#4fb3e8', '#ffffff', 0.06], [21990, 5936, '#ab47bc', '#ffd166', -0.05]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; U.roundRect(ctx, -34, -13, 72, 30, 4); ctx.fill();
      ctx.fillStyle = c1; U.roundRect(ctx, -36, -15, 72, 30, 4); ctx.fill();
      ctx.fillStyle = c2; for (let k = -24; k < 36; k += 16) ctx.fillRect(k, -15, 7, 30);
      ctx.restore();
    }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#e4572e', '#fff', '#4fb3e8', '#fff', '#ffd166', '#fff'][k]; ctx.beginPath(); ctx.moveTo(21640, 5940); ctx.arc(21640, 5940, 13, k * Math.PI / 3, (k + 1) * Math.PI / 3); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(21636, 5935, 3.5, 0, Math.PI * 2); ctx.fill();
    // a dotted swim line across the lagoon
    for (let x = L.x0 + 40; x < L.x1 - 20; x += 16) { ctx.fillStyle = (x / 16) % 2 < 1 ? '#ff7043' : '#fff'; ctx.beginPath(); ctx.arc(x, L.y0 + 4, 4, 0, Math.PI * 2); ctx.fill(); }
  },
  paintHabitat(r) {
    const ctx = r.ctx, A = CFG.AQUARIUM, H = A.HAB, PP = A.PPOOL, SL = A.SLIDE;
    // the back wall: a painted icy sky with icebergs
    const sky = ctx.createLinearGradient(0, A.BACK_TOP, 0, H.y0); sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(1, '#e3f6ff');
    ctx.fillStyle = sky; ctx.fillRect(H.x0 - 16, A.BACK_TOP + 10, H.x1 - H.x0 + 16, H.y0 - A.BACK_TOP - 10);
    ctx.fillStyle = '#fff6c2'; ctx.beginPath(); ctx.arc(H.x1 - 80, A.BACK_TOP + 50, 22, 0, Math.PI * 2); ctx.fill();
    for (const [x, hh, wd] of [[H.x0 + 40, 90, 120], [H.x0 + 170, 130, 150], [H.x0 + 330, 80, 120], [H.x0 + 450, 110, 120]]) {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - wd / 2, H.y0); ctx.lineTo(x - wd / 6, H.y0 - hh); ctx.lineTo(x + wd / 8, H.y0 - hh * 0.8); ctx.lineTo(x + wd / 2, H.y0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cdeaff'; ctx.beginPath(); ctx.moveTo(x + wd / 8, H.y0 - hh * 0.8); ctx.lineTo(x + wd / 2, H.y0); ctx.lineTo(x + wd / 10, H.y0); ctx.closePath(); ctx.fill();
    }
    // snow on the floor with soft blue drifts
    ctx.fillStyle = '#f6fcff'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#e2f2fc'; for (const [x, y, rx] of [[21620, 5780, 60], [21900, 5820, 80], [22010, 5660, 40], [21760, 5420, 50], [21640, 5620, 50]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(H.x0 + ((i * 97) % (H.x1 - H.x0)), H.y0 + 20 + ((i * 53) % (H.y1 - H.y0 - 30)), 2, 0, Math.PI * 2); ctx.fill(); }
    // the pool: icy rim, deep teal water
    ctx.fillStyle = '#d0ecfb'; U.roundRect(ctx, PP.x0 - 8, PP.y0 - 8, PP.x1 - PP.x0 + 16, PP.y1 - PP.y0 + 16, 18); ctx.fill();
    const gl = ctx.createLinearGradient(0, PP.y0, 0, PP.y1); gl.addColorStop(0, '#4cc3ea'); gl.addColorStop(1, '#1b84c0');
    ctx.fillStyle = gl; U.roundRect(ctx, PP.x0, PP.y0, PP.x1 - PP.x0, PP.y1 - PP.y0, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) this.wave(ctx, PP.x0 + 10, PP.x1 - 10, PP.y0 + 30 + k * 34, 3, 12, k);
    ctx.fillStyle = '#ffffff'; for (const [x, y, rx] of [[PP.x0 + 70, PP.y0 + 40, 18], [PP.x1 - 50, PP.y1 - 34, 22]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }   // ice floes
    // the ice rocks: a lighter top and a shaded front
    for (const k of A.ROCKS) {
      const hgt = Math.min(30, (k.y1 - k.y0) * 0.45);
      ctx.fillStyle = 'rgba(80,140,190,0.25)'; ctx.beginPath(); ctx.ellipse((k.x0 + k.x1) / 2 + 4, k.y1 + 2, (k.x1 - k.x0) / 2 + 6, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a9d6f5'; U.roundRect(ctx, k.x0, k.y0, k.x1 - k.x0, k.y1 - k.y0, 12); ctx.fill();
      ctx.fillStyle = '#e8f6ff'; U.roundRect(ctx, k.x0 + 3, k.y0 + 2, k.x1 - k.x0 - 6, k.y1 - k.y0 - hgt, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(k.x0 + 12, k.y0 + 6, (k.x1 - k.x0) * 0.3, 4);
    }
    // the ice slide from the big rock into the pool, with a little ladder up the rock
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6fb6e6'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(SL.a.x - 6, SL.a.y + 6); ctx.quadraticCurveTo(SL.b.x - 60, SL.a.y + 10, SL.b.x - 4, SL.b.y + 4); ctx.stroke();
    ctx.strokeStyle = '#cfeeff'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(SL.a.x - 6, SL.a.y + 4); ctx.quadraticCurveTo(SL.b.x - 60, SL.a.y + 8, SL.b.x - 4, SL.b.y + 2); ctx.stroke();
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SL.foot.x - 8, SL.foot.y); ctx.lineTo(SL.a.x - 16, SL.a.y + 2); ctx.moveTo(SL.foot.x + 8, SL.foot.y); ctx.lineTo(SL.a.x - 2, SL.a.y + 4); ctx.stroke();
    for (let k = 1; k < 5; k++) { const u = k / 5; ctx.beginPath(); ctx.moveTo(U.lerp(SL.foot.x - 8, SL.a.x - 16, u), U.lerp(SL.foot.y, SL.a.y + 2, u)); ctx.lineTo(U.lerp(SL.foot.x + 8, SL.a.x - 2, u), U.lerp(SL.foot.y, SL.a.y + 4, u)); ctx.stroke(); }
    // the fish bucket
    const B = A.PBUCKET;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(B.x + 2, B.y + 6, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e88e5'; ctx.beginPath(); ctx.moveTo(B.x - 15, B.y - 20); ctx.lineTo(B.x + 15, B.y - 20); ctx.lineTo(B.x + 11, B.y + 4); ctx.lineTo(B.x - 11, B.y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#64b5f6'; ctx.fillRect(B.x - 15, B.y - 22, 30, 5);
    for (const [dx, a] of [[-7, -0.5], [1, 0.1], [8, 0.6]]) { ctx.save(); ctx.translate(B.x + dx, B.y - 24); ctx.rotate(a); ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-5, -9); ctx.lineTo(5, -9); ctx.closePath(); ctx.fill(); ctx.restore(); }
    this.sign(r, B.x, B.y - 44, '🐟', '#ffd166', '#2b1d14', 9);
    // the west glass wall onto the ocean hall
    ctx.fillStyle = 'rgba(190,230,255,0.75)'; ctx.fillRect(H.x0 - 16, H.y0, 16, H.y1 - H.y0 + 16);
    ctx.fillStyle = '#9aa0a8'; for (let y = H.y0; y <= H.y1 + 16; y += 60) ctx.fillRect(H.x0 - 16, y - 3, 16, 6);
  },

  // ---------- creatures ----------
  mix(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(U.lerp(v, pb[i], k))).join(',')})`;
  },
  drawFish(ctx, f, t) {
    const d = f.dir, s = f.s, wag = Math.sin(t * 9 + f.ph) * 0.35;
    ctx.fillStyle = f.col;
    ctx.beginPath(); ctx.moveTo(f.x - d * s * 0.9, f.y); ctx.lineTo(f.x - d * s * 1.7, f.y - s * 0.7 + wag * s); ctx.lineTo(f.x - d * s * 1.7, f.y + s * 0.7 + wag * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(f.x, f.y, s * 1.1, s * 0.65, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(f.x - s * 0.2, f.y - s * 0.6, s * 0.35, s * 1.2);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x + d * s * 0.55, f.y - s * 0.15, s * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(f.x + d * s * 0.62, f.y - s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
    if (f.nom > 0) { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(f.x + d * s * 1.0, f.y + s * 0.15, s * 0.18, 0, Math.PI * 2); ctx.stroke(); }
  },
  drawShark(ctx, c, t) {
    const d = c.dir, x = c.x, y = c.y, wag = Math.sin(t * 5 + c.ph) * 4;
    ctx.fillStyle = '#7f9cb5';
    ctx.beginPath(); ctx.moveTo(x - d * 30, y); ctx.lineTo(x - d * 46, y - 14 + wag); ctx.lineTo(x - d * 42, y + wag * 0.3); ctx.lineTo(x - d * 46, y + 12 + wag); ctx.closePath(); ctx.fill();   // tail
    ctx.beginPath(); ctx.moveTo(x - d * 4, y - 10); ctx.lineTo(x - d * 12, y - 26); ctx.lineTo(x + d * 8, y - 10); ctx.closePath(); ctx.fill();   // dorsal fin
    ctx.beginPath(); ctx.ellipse(x, y, 36, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + d * 30, y - 6); ctx.quadraticCurveTo(x + d * 44, y, x + d * 30, y + 6); ctx.fill();   // nose
    ctx.fillStyle = '#eef4f8'; ctx.beginPath(); ctx.ellipse(x + d * 4, y + 5, 28, 7, 0, 0, Math.PI); ctx.fill();   // white belly
    ctx.fillStyle = '#6a879f'; ctx.beginPath(); ctx.moveTo(x + d * 6, y + 6); ctx.lineTo(x - d * 4, y + 18); ctx.lineTo(x - d * 10, y + 6); ctx.closePath(); ctx.fill();   // side fin
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + d * 24, y - 4, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + d * 25, y - 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + d * 28, y + 3, 5, d > 0 ? 0.2 : Math.PI - 1.4, d > 0 ? 1.4 : Math.PI - 0.2); ctx.stroke();   // a friendly smile
    ctx.fillStyle = 'rgba(255,140,170,0.6)'; ctx.beginPath(); ctx.arc(x + d * 19, y + 3, 3, 0, Math.PI * 2); ctx.fill();
    if (c.nom > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + d * 40, y - 4, 3, 0, Math.PI * 2); ctx.stroke(); }
  },
  // a ray seen from above: a diamond with gently flapping wings, a long tail and a smile
  drawRay(ctx, x, y, d, t, s, col = '#8e7cc3', hi = 0) {
    const flap = Math.sin(t * 2.4) * 0.35;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * d, s);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-34, Math.sin(t * 3) * 6, -48, Math.sin(t * 3 + 1) * 4); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(20, 0); ctx.quadraticCurveTo(6, -30 * (1 + flap), -16, -22 * (1 + flap)); ctx.quadraticCurveTo(-12, 0, -16, 22 * (1 - flap)); ctx.quadraticCurveTo(6, 30 * (1 - flap), 20, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (const [px, py] of [[-4, -10], [2, 8], [-8, 4]]) { ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, -5, 3, 0, Math.PI * 2); ctx.arc(10, 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(11, -5, 1.6, 0, Math.PI * 2); ctx.arc(11, 5, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(13, 0, 3 + hi * 1.5, -1.2, 1.2); ctx.stroke();
    ctx.restore();
  },
  drawTurtle(ctx, tu, t, sc = 1) {
    const d = tu.dir, pad = Math.sin(t * 4) * 4;
    ctx.save(); ctx.translate(tu.x, tu.y); ctx.scale(sc, sc);
    ctx.fillStyle = '#5a8f3a';
    for (const [dx, dy] of [[-12, -6], [-12, 6], [10, -7], [10, 7]]) { ctx.beginPath(); ctx.ellipse(dx * d, dy + (dx < 0 ? pad : -pad) * 0.5, 7, 3.5, dy < 0 ? -0.5 : 0.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(d * 18, -1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(d * 20, -2.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d2a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6fae4a'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3f7d2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke();
    ctx.restore();
  },
  drawOctopus(r, g) {
    const ctx = r.ctx, T = this.tank('octo'), cx = (T.x0 + T.x1) / 2, t = g.time, k = this.octoNear(g);
    const col = this.mix('#c2559a', '#6b7a86', k), y = T.y1 - 50 - (1 - k) * Math.sin(t * 1.5) * 4 + k * 12;
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const sx = cx + (i - 2.5) * 6; ctx.beginPath(); ctx.moveTo(sx, y + 8); ctx.quadraticCurveTo(sx + (i - 2.5) * 8, y + 20 + Math.sin(t * 3 + i) * 4 * (1 - k * 0.7), sx + (i - 2.5) * 12, y + 30 - k * 8 + Math.sin(t * 2.5 + i * 1.3) * 3); ctx.stroke(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, y, 19, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx - 6, y - 7, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    for (const d of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx + d * 7, y + 2, 4.2, 4.2 - k * 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx + d * 7 + (g.player.x < cx ? -1 : 1), y + 2.4, 1.9 - k * 0.8, 0, Math.PI * 2); ctx.fill(); }
    if (k > 0.5) { ctx.fillStyle = 'rgba(255,120,150,0.5)'; ctx.beginPath(); ctx.arc(cx - 11, y + 7, 3, 0, Math.PI * 2); ctx.arc(cx + 11, y + 7, 3, 0, Math.PI * 2); ctx.fill(); }
  },
  drawJelly(ctx, x, y0, ph, t, s = 1) {
    const pulse = Math.sin(t * 3 + ph), rr = (9 + pulse * 2) * s, y = y0 + Math.sin(t * 1.2 + ph) * 7 - pulse * 2;
    ctx.strokeStyle = 'rgba(255,170,220,0.8)'; ctx.lineWidth = 1.5 * s; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const sx = x + (-6 + i * 4) * s; ctx.beginPath(); ctx.moveTo(sx, y + 2); ctx.quadraticCurveTo(sx + Math.sin(t * 2 + i) * 4 * s, y + 12 * s, sx + Math.sin(t * 2.5 + i * 1.7) * 5 * s, y + (20 + pulse * 3) * s); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,150,210,0.25)'; ctx.beginPath(); ctx.arc(x, y, rr + 5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,170,220,0.9)'; ctx.beginPath(); ctx.arc(x, y, rr, Math.PI, 0); ctx.lineTo(x + rr, y + 3 * s); ctx.lineTo(x - rr, y + 3 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x - 3 * s, y - 4 * s, 3 * s, 2 * s, 0, 0, Math.PI * 2); ctx.fill();
  },
  drawSeahorse(ctx, t) {
    const T = this.tank('horse'), x = (T.x0 + T.x1) / 2 + 4, y = T.y1 - 70 + Math.sin(t * 1.6) * 6;
    ctx.save(); ctx.translate(x, y); ctx.scale(1.4, 1.4);
    ctx.strokeStyle = '#ffab40'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, 8, 3, 18); ctx.quadraticCurveTo(-2, 26, 6, 27); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, 27, 3, 0, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(-11, 1); ctx.stroke();
    ctx.fillStyle = '#ffd166'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(4 + i * 1.5, -4 + i * 5); ctx.lineTo(9 + i * 1.5, -3 + i * 5); ctx.lineTo(4 + i * 1.5, -1 + i * 5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-1.5, -3, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,102,0.8)'; ctx.beginPath(); ctx.ellipse(7 + Math.sin(t * 12) * 1.5, 6, 3, 2, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawStarfish(ctx, t, wig) {
    const S = CFG.AQUARIUM.STAR, a0 = wig > 0 ? Math.sin(t * 18) * 0.25 : 0;
    ctx.save(); ctx.translate(S.x, S.y); ctx.rotate(a0); ctx.scale(1.3, 1.3);
    ctx.fillStyle = '#ff8a3d'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 5 : 13; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.8); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb380'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 7, Math.sin(a) * 5.5, 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-2, -1, 1, 0, Math.PI * 2); ctx.arc(2, -1, 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 1, 2, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    if (wig > 0) this.drawHeart(ctx, S.x + 14, S.y - 14 - (CFG.AQUARIUM.PET - wig) * 12, 5, '#ff5c8a');
  },
  drawCrab(ctx, c, t) {
    const P = CFG.AQUARIUM.POOL, y = P.y + 14, leg = Math.sin(t * 12) * 2;
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; for (const d of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(c.x + d * 4, y + i * 1.5 - 1); ctx.lineTo(c.x + d * (9 + i), y + 3 + i * 1.5 + (i % 2 ? leg : -leg)); ctx.stroke(); }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(c.x, y, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - 8, y - 3, 2.5, 0, Math.PI * 2); ctx.arc(c.x + 8, y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c.x - 2, y - 4, 1.3, 0, Math.PI * 2); ctx.arc(c.x + 2, y - 4, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(c.x - 2, y - 4, 0.6, 0, Math.PI * 2); ctx.arc(c.x + 2, y - 4, 0.6, 0, Math.PI * 2); ctx.fill();
  },
  drawPenguin(ctx, pg, t) {
    if (pg.mode === 'swim') return this.drawPenguinSwim(ctx, pg, t);
    const d = pg.dir, belly = pg.mode === 'slide' || (pg.mode === 'walk' && pg.belly), hop = pg.hop || 0;
    ctx.fillStyle = 'rgba(40,80,120,0.18)'; ctx.beginPath(); ctx.ellipse(pg.x, pg.y + 3, belly ? 18 : 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(pg.x, pg.y - hop); ctx.scale(1.3, 1.3);
    if (belly) {
      // on its belly, head first, flippers out
      ctx.rotate(pg.mode === 'slide' ? Math.PI / 2 + 0.6 : d * (Math.PI / 2) + Math.sin(pg.bob) * 0.05); ctx.translate(0, 6);
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(0, -12, 9, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -10, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(-11, -10, 3, 7, -0.6, 0, Math.PI * 2); ctx.ellipse(11, -10, 3, 7, 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -27, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.moveTo(-3, -31); ctx.lineTo(3, -31); ctx.lineTo(0, -38); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-4, 3, 4, 2, 0, 0, Math.PI * 2); ctx.ellipse(4, 3, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -28, 2, 0, Math.PI * 2); ctx.arc(3, -28, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-3, -28, 1, 0, Math.PI * 2); ctx.arc(3, -28, 1, 0, Math.PI * 2); ctx.fill();
    } else {
      const rock = pg.moving ? Math.sin(pg.bob) * 0.14 : 0, step = pg.moving ? Math.sin(pg.bob) * 2 : 0;
      const lean = pg.nuzzle > 0 ? d * 0.32 * Math.sin(Math.min(1, pg.nuzzle / 1.3) * Math.PI) : 0, eat = pg.eat > 0;
      ctx.rotate(rock + lean);
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.ellipse(-4, 2 + step, 4.5, 2, 0, 0, Math.PI * 2); ctx.ellipse(4, 2 - step, 4.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(0, -11, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(d * 1, -9, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
      const fl = pg.flap > 0 ? Math.sin(t * 22 + pg.ph) * 0.7 : 0;
      ctx.fillStyle = '#263238';
      ctx.save(); ctx.translate(-8, -16); ctx.rotate(0.25 + fl); ctx.beginPath(); ctx.ellipse(0, 6, 2.6, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(8, -16); ctx.rotate(-0.25 - fl); ctx.beginPath(); ctx.ellipse(0, 6, 2.6, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const hy = eat ? -26 : -24;
      ctx.beginPath(); ctx.arc(0, hy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d * 2 - 3, hy - 1, 2.2, 0, Math.PI * 2); ctx.arc(d * 2 + 3, hy - 1, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14';
      if (eat || pg.nuzzle > 0) { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; for (const e of [-3, 3]) { ctx.beginPath(); ctx.arc(d * 2 + e, hy - 0.5, 1.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }   // happy closed eyes
      else { ctx.beginPath(); ctx.arc(d * 2.6 - 3, hy - 1, 1.1, 0, Math.PI * 2); ctx.arc(d * 2.6 + 3, hy - 1, 1.1, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,130,160,0.55)'; ctx.beginPath(); ctx.arc(d * 2 - 5, hy + 3, 1.8, 0, Math.PI * 2); ctx.arc(d * 2 + 5, hy + 3, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffab40';
      if (eat && pg.eat > 0.8) {   // gulping the fish down: beak up, tail sticking out
        ctx.beginPath(); ctx.moveTo(d * 3, hy - 3); ctx.lineTo(d * 9, hy - 10); ctx.lineTo(d * 6, hy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(d * 8, hy - 9); ctx.lineTo(d * 12, hy - 16); ctx.lineTo(d * 14, hy - 10); ctx.closePath(); ctx.fill();
      } else { ctx.beginPath(); ctx.moveTo(d * 4, hy + 1); ctx.lineTo(d * 11, hy + 3); ctx.lineTo(d * 4, hy + 5); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  },
  drawPenguinSwim(ctx, pg, t) {
    const d = pg.dir, under = Math.sin(pg.t * 1.6 + pg.ph) > 0.35;
    if (under) {   // diving: a dark shape under the water and a trail of bubbles
      ctx.fillStyle = 'rgba(20,50,80,0.45)'; ctx.beginPath(); ctx.ellipse(pg.x, pg.y + 4, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(pg.x - d * (16 + k * 6), pg.y - 2 - ((t * 20 + k * 7) % 14), 1.6 + k * 0.4, 0, Math.PI * 2); ctx.stroke(); }
      return;
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(pg.x, pg.y + 2, 20, 6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.ellipse(pg.x - d * 2, pg.y, 15, 6, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(pg.x + d * 13, pg.y - 5, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pg.x + d * 15, pg.y - 6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(pg.x + d * 15.5, pg.y - 6, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.moveTo(pg.x + d * 18, pg.y - 5); ctx.lineTo(pg.x + d * 25, pg.y - 3); ctx.lineTo(pg.x + d * 18, pg.y - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(80,190,235,0.5)'; ctx.fillRect(pg.x - 18, pg.y, 36, 4);
  },
  drawDiver(r, g) {
    const ctx = r.ctx, dv = this.st.diver, t = g.time, f = dv.facing, bob = dv.moving ? Math.sin(dv.bob) * 2 : 0, x = dv.x, y = dv.y - (dv.wave > 0 ? Math.abs(Math.sin(t * 7)) * 3 : 0);
    r.drawPerson(x, y, { shirt: '#1b4f72', skin: '#e0ac69', hat: 'cap', capColor: '#1b4f72', facing: f, moving: dv.moving, bob: dv.bob, carry: 0, pants: '#1b4f72', belt: true });
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(x - 6 + f * 3, y + 5, 8, 2.5, 0, 0, Math.PI * 2); ctx.ellipse(x + 6 + f * 3, y + 5, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x - 6 - f * 12, y - 32 + bob, 8, 22, 4); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x - 3 - f * 12, y - 35 + bob, 2, 4);
    ctx.fillStyle = 'rgba(154,208,255,0.75)'; U.roundRect(ctx, x - 9, y - 43 + bob, 18, 9, 4); ctx.fill(); ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.5; U.roundRect(ctx, x - 9, y - 43 + bob, 18, 9, 4); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 3 - 3, y - 38.5 + bob, 1.2, 0, Math.PI * 2); ctx.arc(x + f * 3 + 3, y - 38.5 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + f * 9, y - 40 + bob); ctx.lineTo(x + f * 13, y - 40 + bob); ctx.lineTo(x + f * 13, y - 54 + bob); ctx.stroke();
    if (dv.wave > 0) { ctx.save(); ctx.translate(x + f * 24, y - 50 + bob); ctx.rotate(Math.sin(t * 10) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore(); }
  },
  drawPlush(r, g, side) {
    const ctx = r.ctx, p = g.player, f = (p.facing || 1) * side, x = p.x + f * 17, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time, wag = Math.sin(t * 6) * 2;
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(x - f * 7, y); ctx.lineTo(x - f * 13, y - 5 + wag); ctx.lineTo(x - f * 13, y + 5 + wag); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 6, 3, 12); ctx.fillRect(x + f * 4 - 1, y - 5, 2.5, 10);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 5, y - 1.5, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.stroke();
  },
  // a yellow tub of fish food with a blue fish label (rot: tipping it over the hatch)
  drawFoodTub(ctx, x, y, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, -7, -9, 16, 20, 4); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, -8, -10, 16, 20, 4); ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, -9, -13, 18, 5, 2); ctx.fill();
    ctx.fillStyle = '#4fb3e8'; ctx.fillRect(-8, -3, 16, 8);
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.ellipse(1, 1, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-3, 1); ctx.lineTo(-6, -1.5); ctx.lineTo(-6, 3.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  drawCarryFish(ctx, x, y, t) {
    const sw = Math.sin(t * 5) * 0.2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2 + sw);
    ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-16, -5); ctx.lineTo(-16, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#78909c'; ctx.fillRect(-6, -5, 12, 2);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -1, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(6.4, -1, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawCarried(r, g) {
    const ctx = r.ctx, p = g.player, st = this.st, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    if (st.carry === 'food') {
      const x = p.x + f * 19, y = p.y - 22 + bob;
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x - f * 4, y + 6, 3.5, 0, Math.PI * 2); ctx.fill();   // the hand holding it
      this.drawFoodTub(ctx, x, y);
    } else if (st.carry === 'fish') {
      this.drawCarryFish(ctx, p.x + f * 19, p.y - 14 + bob, g.time);
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(p.x + f * 17, p.y - 26 + bob, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // just out of the water: goggles pushed up on the forehead and a little puddle
    if (st.drip > 0 && st.mode === 'walk') {
      const y = p.y - 46 + bob;
      ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x - 11, y + 2); ctx.lineTo(p.x + 11, y + 2); ctx.stroke();
      for (const e of [-5, 5]) { ctx.fillStyle = '#7fd6ff'; ctx.beginPath(); ctx.arc(p.x + e, y, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + e - 1.5, y - 1.5, 1.2, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  // the chef swimming: lying in the water with goggles and a snorkel, kicking, the water line across the shoulders
  drawSwimmer(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, t = g.time, mv = p.moving || Math.hypot(this.st.sv.x, this.st.sv.y) > 20;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1.25, 1.25); ctx.translate(-p.x, -p.y);   // a little bigger: the chef is the star
    const x = p.x, y = p.y - 12 + Math.sin(t * 3) * 1.8, kick = Math.sin(t * (mv ? 13 : 5)), stroke = t * (mv ? 6 : 2);
    // ripples spreading round the swimmer
    for (let i = 0; i < 2; i++) { const k = (t * 0.7 + i * 0.5) % 1; ctx.strokeStyle = `rgba(255,255,255,${(0.65 * (1 - k)).toFixed(2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 6, 30 + k * 30, 10 + k * 10, 0, 0, Math.PI * 2); ctx.stroke(); }
    // under the water: kicking legs and the body
    ctx.fillStyle = '#2d3a4a';
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(x - f * 14, y + 3 + s * 3); ctx.rotate(f * (kick * s * 0.25)); U.roundRect(ctx, f > 0 ? -22 : 0, -3.5, 22, 7, 3); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(-f * 24, 0, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2d3a4a'; ctx.restore(); }   // with yellow flippers
    ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 17, y - 8, 34, 17, 8); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 12 + f * 2, y - 5, 18, 12, 4); ctx.fill();
    // arms doing the front crawl
    ctx.fillStyle = '#f1c27d';
    for (const s of [0, Math.PI]) { const a = stroke + s, ax = x + f * (14 + Math.cos(a) * 12), ay = y + Math.sin(a) * 6 - (Math.cos(a) > 0 ? 4 : 0); ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill(); }
    // the water over everything below the surface
    ctx.fillStyle = 'rgba(60,180,230,0.5)'; ctx.beginPath(); ctx.ellipse(x - f * 6, y + 5, 44, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; this.wave(ctx, x - 40, x + 36, y - 1, 1.6, 4, t * 4);
    // the head above the water: chef's hat, goggles, snorkel
    const hx = x + f * 22, hy = y - 10;
    ctx.fillStyle = '#f1c27d'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, hx - 8, hy - 16, 16, 8, 3); ctx.fill(); ctx.beginPath(); ctx.arc(hx - 4, hy - 18, 5, 0, Math.PI * 2); ctx.arc(hx + 4, hy - 18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx - 10, hy - 3); ctx.lineTo(hx + 10, hy - 3); ctx.stroke();
    for (const e of [-4.5, 4.5]) { const ex = hx + f * 2 + e; ctx.fillStyle = '#7fd6ff'; ctx.beginPath(); ctx.arc(ex, hy - 3, 4.3, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(ex + f * 0.8, hy - 2.5, 1.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 1.5, hy - 4.5, 1.1, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(hx + f * 1 - 3, hy + 4, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(hx + f * 1 + 3, hy + 4, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffab40'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + f * 3, hy + 6); ctx.lineTo(hx - f * 12, hy + 6); ctx.lineTo(hx - f * 12, hy - 22); ctx.stroke();
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(hx - f * 12, hy - 23, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  // ---------- moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.AQUARIUM.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#0b1a2e';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  // a pulsing ring on the floor that says "here!"
  ring(ctx, x, y, t, col, on) {
    const k = on ? 0.5 + 0.5 * Math.sin(t * 6) : 0.3, rx = 42 + (on ? Math.sin(t * 6) * 3 : 0);
    ctx.strokeStyle = col; ctx.globalAlpha = on ? 0.45 + 0.5 * k : 0.35; ctx.lineWidth = on ? 5 : 3;
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.46, 0, 0, Math.PI * 2); ctx.stroke();
    if (on) { ctx.globalAlpha = 0.18 * k; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx + 8, (rx + 8) * 0.46, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time, st = this.st, A = CFG.AQUARIUM;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40;
      for (let i = 0; i < 4; i++) { const k = (t * 0.35 + i * 0.25) % 1; ctx.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx - 40 + Math.sin(k * 7 + i) * 5, gy + 30 - k * 60, 2 + k * 3, 0, Math.PI * 2); ctx.stroke(); }
      return;
    }
    if (g.area !== 'aquarium') return;
    this.drawOutside(r, g);
    const vis = (B, m) => this.vis(r, B.x0, B.y0, B.x1, B.y1, m);
    // drifting caustic light on the hall floors under the tanks
    for (const H of [A.REEF_HALL, A.OCEAN_HALL]) {
      if (!vis(H, 0)) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      for (let i = 0; i < 6; i++) { const x = H.x0 + 30 + ((i * 97 + t * 14) % (H.x1 - H.x0 - 60)), y = H.y0 + 30 + ((i * 61 + Math.sin(t * 0.5 + i) * 30 + 300) % 150); ctx.beginPath(); ctx.ellipse(x, y, 30 + Math.sin(t + i) * 8, 11, 0.3, 0, Math.PI * 2); ctx.fill(); }
    }
    // the tank windows
    for (const T of A.TANKS) {
      if (!vis(T, 20)) continue;
      ctx.save(); ctx.beginPath(); ctx.rect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0); ctx.clip();
      if (T.id === 'octo') this.drawOctopus(r, g);
      if (T.id === 'horse') this.drawSeahorse(ctx, t);
      if (T.id === 'reef') this.drawTurtle(ctx, st.turtle, t, 1.5);
      for (const f of st.life) if (f.tank === T) { if (f.kind === 'shark') this.drawShark(ctx, f, t); else if (f.kind === 'ray') this.drawRay(ctx, f.x, f.y, f.dir, t, 0.8, '#9c8bd0'); else this.drawFish(ctx, f, t); }
      for (const fl of st.flakes) if (fl.tank === T) { ctx.fillStyle = fl.col; ctx.fillRect(fl.x - 2, fl.y - 1.5, 4, 3); }
      for (const b of st.bubbles) if (b.tank === T) { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.t * 5) * 1.5, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    }
    // the tunnel tank (the fish crossing over the walkway are drawn in overlay, over the chef)
    const TT = A.TUNNEL_TANK, TU = A.TUNNEL;
    if (vis(TT, 20)) {
      for (const f of st.life) if (f.tank === TT && !(f.y > TU.y0 - 8 && f.y < TU.y1 + 8)) this.drawFish(ctx, f, t);
      for (const b of st.bubbles) if (b.tank === TT && !(b.y > TU.y0 && b.y < TU.y1)) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    }
    // the feeding rings glow when the chef has food; the food stations glow when the chef has none
    const p = g.player;
    if (st.mode === 'walk') {
      for (const T of A.TANKS) if (T.feed && this.vis(r, T.feed.x - 50, T.feed.y - 30, T.feed.x + 50, T.feed.y + 30)) this.ring(ctx, T.feed.x, T.feed.y, t, '#ffd166', st.carry === 'food');
      for (const S of A.STATIONS) if (this.vis(r, S.x - 50, S.y, S.x + 50, S.y + 50)) this.ring(ctx, S.x, S.y + 26, t, '#ff8a65', st.carry !== 'food' && !g.s.aquarium.fed);
      this.ring(ctx, A.STEP_OUT.x, A.STEP_OUT.y + 4, t, '#4fb3e8', false);
      this.ring(ctx, A.GATE_OUT.x, A.GATE_OUT.y + 4, t, '#9ad0ff', false);
    }
    // the touch pool, the starfish and the crab
    const P = A.POOL;
    if (this.vis(r, P.x - 90, P.y - 50, P.x + 90, P.y + 50)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; for (let i = 0; i < 2; i++) { const k = (t * 0.4 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(P.x, P.y, 10 + k * 50, 5 + k * 25, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
      this.drawStarfish(ctx, t, st.star);
      this.drawCrab(ctx, st.crab, t);
    }
    // the shells on the shelf
    const S = A.SHELF, n = Math.min(g.s.aquarium.shells, 8), scols = ['#ff8fab', '#ffd166', '#fff', '#b388ff', '#4dd0e1', '#ff7043', '#9ccc65', '#ffab40'];
    for (let i = 0; i < n; i++) { const x = S.x0 + 12 + i * 16, y = S.y0 + 8; ctx.fillStyle = scols[i]; ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.arc(x, y - 1, 5.5, Math.PI * 0.15, Math.PI * 0.85, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + k * 3.5, y - 5); ctx.stroke(); } }
    // the lagoon: caustics, its creatures and bubbles
    const L = A.LAGOON;
    if (vis(L, 30)) {
      ctx.save(); ctx.beginPath(); ctx.rect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      for (let i = 0; i < 10; i++) { const x = L.x0 + ((i * 131 + t * 16) % (L.x1 - L.x0)), y = L.y0 + 20 + ((i * 47 + Math.sin(t * 0.4 + i) * 40 + 400) % (L.y1 - L.y0 - 30)); ctx.beginPath(); ctx.ellipse(x, y, 36 + Math.sin(t + i) * 10, 12, 0.25, 0, Math.PI * 2); ctx.fill(); }
      const lag = st.lag;
      for (const j of lag.jellies) this.drawJelly(ctx, j.x + Math.sin(t * 0.3 + j.ph) * 24, j.y, j.ph, t, 1.5);
      this.drawRay(ctx, lag.ray.x, lag.ray.y, lag.ray.dir, t, 1.25, '#8e7cc3', lag.ray.hi);
      this.drawTurtle(ctx, lag.turtle, t, 1.6);
      for (const sc of lag.schools) for (const f of sc.fish) this.drawFish(ctx, f, t);
      for (const b of st.bubbles) if (b.tank === L) { ctx.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - b.t / 1.6)).toFixed(2)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.t * 5) * 2, b.y, b.r + 1, 0, Math.PI * 2); ctx.stroke(); }
      // the surface glitters
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 14; i++) { const k = (t * 0.5 + i * 0.37) % 1; if (k > 0.5) continue; ctx.fillRect(L.x0 + ((i * 173) % (L.x1 - L.x0)), L.y0 + ((i * 89) % (L.y1 - L.y0)), 6 * (1 - k * 2), 2); }
      ctx.restore();
    }
    // the penguins' pool ripples and the swimming penguins
    const PP = A.PPOOL;
    if (vis(PP, 30)) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const k = (t * 0.3 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(PP.x0 + 90 + i * 50, PP.y0 + 60, 10 + k * 40, 4 + k * 14, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
      for (const pg of st.pengs) if (pg.mode === 'swim') this.drawPenguinSwim(ctx, pg, t);
    }
    // a little puddle where the wet chef stands
    if (st.drip > 0 && st.mode === 'walk') { ctx.fillStyle = `rgba(80,180,230,${(0.35 * Math.min(1, st.drip)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 22, 8, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, A = CFG.AQUARIUM;
    if (st.plush > 0 && !g.driving && !g.onTrain && st.mode !== 'swim') items.push({ y: p.y + 1, draw: () => this.drawPlush(r, g, st.carry ? -1 : 1) });
    if (g.area !== 'aquarium') return;
    if (st.mode === 'swim') {
      // the core's chef standing up is swapped for the swimming chef
      const i = items.findIndex((it) => it.y === p.y && /drawPlayer\(/.test(String(it.draw)));
      if (i >= 0) items.splice(i, 1);
      items.push({ y: p.y, draw: () => this.drawSwimmer(r, g) });
    } else if (st.carry || st.drip > 0) items.push({ y: p.y + 0.5, draw: () => this.drawCarried(r, g) });
    for (const pg of st.pengs) if (pg.mode !== 'swim' && this.vis(r, pg.x - 30, pg.y - 50, pg.x + 30, pg.y + 10)) items.push({ y: pg.y, draw: () => this.drawPenguin(r.ctx, pg, g.time) });
    if (this.vis(r, st.diver.x - 40, st.diver.y - 80, st.diver.x + 40, st.diver.y + 10)) items.push({ y: st.diver.y, draw: () => this.drawDiver(r, g) });
    const J = A.JELLY;
    if (this.vis(r, J.x - 50, J.y - 150, J.x + 50, J.y + 20)) items.push({ y: J.y + 10, draw: () => this.drawJellyColumn(r, g) });
    const H = A.HAB;
    if (this.vis(r, H.x0 - 20, H.y1 - 80, H.x1 + 20, H.y1 + 30)) items.push({ y: H.y1 + 12, draw: () => this.drawFence(r, g) });
  },
  // the round glowing jellyfish column in the lobby
  drawJellyColumn(r, g) {
    const ctx = r.ctx, J = CFG.AQUARIUM.JELLY, t = g.time, x = J.x, y = J.y, hgt = 120;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 6, J.r + 8, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d4b7a'; ctx.beginPath(); ctx.ellipse(x, y, J.r + 6, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - J.r - 6, y - 12, 2 * J.r + 12, 12);
    ctx.fillStyle = '#2a64a0'; ctx.beginPath(); ctx.ellipse(x, y - 12, J.r + 6, 13, 0, 0, Math.PI * 2); ctx.fill();
    const gl = ctx.createLinearGradient(x - J.r, 0, x + J.r, 0); gl.addColorStop(0, '#3c2a78'); gl.addColorStop(0.5, '#6a4cc2'); gl.addColorStop(1, '#3c2a78');
    ctx.fillStyle = gl; ctx.fillRect(x - J.r, y - 12 - hgt, 2 * J.r, hgt); ctx.beginPath(); ctx.ellipse(x, y - 12, J.r, 11, 0, 0, Math.PI); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(x - J.r, y - 12 - hgt, 2 * J.r, hgt + 10); ctx.clip();
    for (let i = 0; i < 3; i++) this.drawJelly(ctx, x - 14 + i * 14, y - 40 - hgt * 0.25 - ((t * 8 + i * 40) % (hgt - 50)), i * 2.1, t, 1.1);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - J.r + 6, y - 12 - hgt, 7, hgt);
    ctx.fillStyle = '#2a64a0'; ctx.beginPath(); ctx.ellipse(x, y - 12 - hgt, J.r + 4, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4b92d4'; ctx.beginPath(); ctx.ellipse(x, y - 14 - hgt, J.r, 7, 0, 0, Math.PI * 2); ctx.fill();
  },
  // the low glass fence along the front of the penguin habitat, with the gate
  drawFence(r, g) {
    const ctx = r.ctx, A = CFG.AQUARIUM, H = A.HAB, G = A.GATE, y = H.y1 + 14, hgt = 34;
    ctx.fillStyle = 'rgba(190,230,255,0.38)';
    ctx.fillRect(H.x0 - 16, y - hgt, G.x0 - H.x0 + 16, hgt); ctx.fillRect(G.x1, y - hgt, H.x1 - G.x1, hgt);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(H.x0 - 16, y - hgt - 4, G.x0 - H.x0 + 16, 5); ctx.fillRect(G.x1, y - hgt - 4, H.x1 - G.x1, 5);
    ctx.fillStyle = '#9aa0a8'; for (let x = H.x0 - 16; x <= H.x1; x += 52) if (x < G.x0 - 4 || x > G.x1 + 4) ctx.fillRect(x - 2, y - hgt - 4, 4, hgt + 4);
    // the gate: two little doors under an arch with a penguin sign
    const gx = (G.x0 + G.x1) / 2;
    ctx.fillStyle = '#4b92d4'; ctx.fillRect(G.x0 - 5, y - hgt - 26, 6, hgt + 26); ctx.fillRect(G.x1 - 1, y - hgt - 26, 6, hgt + 26);
    ctx.strokeStyle = '#4b92d4'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(gx, y - hgt - 20, (G.x1 - G.x0) / 2 + 2, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,209,102,0.55)'; ctx.fillRect(G.x0 + 2, y - 22, (G.x1 - G.x0) / 2 - 4, 22); ctx.fillRect(gx + 2, y - 22, (G.x1 - G.x0) / 2 - 4, 22);
    this.sign(r, gx, y - hgt - 46, '🐧 PENGUINS', '#ffd166', '#2b1d14', 10);
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'aquarium') return;
    const ctx = r.ctx, st = this.st, A = CFG.AQUARIUM, TU = A.TUNNEL, TT = A.TUNNEL_TANK, t = g.time;
    // the water over the tunnel walkway: a glass arch the chef walks under, fish swimming across above the chef
    if (this.vis(r, TU.x0, TU.y0, TU.x1, TU.y1, 60)) {
      const gl = ctx.createLinearGradient(0, TU.y0, 0, TU.y1); gl.addColorStop(0, 'rgba(41,170,226,0.5)'); gl.addColorStop(0.5, 'rgba(41,170,226,0.18)'); gl.addColorStop(1, 'rgba(41,170,226,0.5)');
      ctx.fillStyle = gl; ctx.fillRect(TU.x0, TU.y0 - 6, TU.x1 - TU.x0, TU.y1 - TU.y0 + 12);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) this.wave(ctx, TU.x0, TU.x1, TU.y0 + 18 + k * 40, 3, 14, t * 1.5 + k * 2);
      for (const f of st.life) if (f.tank === TT && f.y > TU.y0 - 8 && f.y < TU.y1 + 8) this.drawFish(ctx, f, t);
      for (const b of st.bubbles) if (b.tank === TT && b.y > TU.y0 && b.y < TU.y1) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(TU.x0, TU.y0 - 6, TU.x1 - TU.x0, 2); ctx.fillRect(TU.x0, TU.y1 + 4, TU.x1 - TU.x0, 2);
      ctx.strokeStyle = 'rgba(214,238,252,0.8)'; ctx.lineWidth = 3; for (let x = TU.x0 + 30; x < TU.x1; x += 60) { ctx.beginPath(); ctx.moveTo(x, TU.y0 - 6); ctx.lineTo(x, TU.y1 + 6); ctx.stroke(); }   // the arch ribs
    }
    // the food tub flying up to the hatch, tipping and sprinkling
    for (const q of st.pours) {
      const u = Math.min(1, q.t / 0.45), x = U.lerp(q.x0, q.x1, u), y = U.lerp(q.y0, q.y1, u) - Math.sin(u * Math.PI) * 50;
      const rot = q.t < 0.45 ? 0 : Math.min(2.3, (q.t - 0.45) * 8) + Math.sin(q.t * 30) * 0.15, fade = q.t > 1.1 ? 1 - (q.t - 1.1) / 0.2 : 1;
      ctx.globalAlpha = Math.max(0, fade); this.drawFoodTub(ctx, x, y, rot); ctx.globalAlpha = 1;
      if (q.t > 0.45 && q.t < 1.1) { ctx.fillStyle = '#ffd166'; for (let k = 0; k < 5; k++) { const yy = y + 10 + ((q.t * 120 + k * 9) % 30); ctx.fillRect(x + 8 + Math.sin(k * 2 + q.t * 9) * 5, yy, 3, 3); } }
    }
    // a fish tossed to a penguin
    for (const q of st.tosses) { const u = Math.min(1, q.t / 0.35), x = U.lerp(q.x0, q.pg.x, u), y = U.lerp(q.y0, q.pg.y - 34, u) - Math.sin(u * Math.PI) * 30; this.drawCarryFish(ctx, x, y, t * 3); }
    // hearts, bubbles, splashes, drips and snow spray
    for (const q of st.parts) {
      const k = q.t / q.dur;
      if (q.k === 'heart') { ctx.globalAlpha = 1 - k * k; this.drawHeart(ctx, q.x, q.y, 5, '#ff5c8a'); }
      else if (q.k === 'bub') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q.x + Math.sin(q.t * 8) * 2, q.y, 2 + k * 2, 0, Math.PI * 2); ctx.stroke(); }
      else if (q.k === 'splash' || q.k === 'drop') { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 2, 3, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    if (!this.st) return;
    const st = this.st, ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    // in the water: a soft blue edge round the screen (four thin strips, not a full-screen pass)
    if (g.area === 'aquarium' && st.mode === 'swim') {
      const e = 26, a = 0.22 + Math.sin(g.time * 1.5) * 0.04;
      ctx.fillStyle = `rgba(40,160,220,${a.toFixed(3)})`; ctx.fillRect(0, 0, W, e); ctx.fillRect(0, H - e, W, e); ctx.fillRect(0, e, e, H - 2 * e); ctx.fillRect(W - e, e, e, H - 2 * e);
    }
    if (st.fade <= 0) return;
    ctx.fillStyle = `rgba(6,14,30,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(AquariumExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(AquariumExt);
