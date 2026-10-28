'use strict';
// The river, the ferry and the islands.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// A river runs along the south edge of town, behind the houses. A wooden dock beside River House has a
// little ferry moored at it: stand on the dock and press the big button to sail to the Islands, a map of
// water with a few islands. On the main island you set up a pizza stand (a pad); it bakes pizzas on its
// own. Huts on the other islands order pizza now and then; hop on the jet ski parked at the beach and
// deliver to their doors. The ferry at the island dock brings you home.
//
// South of Pizza Island a sandbar leads to Sunny Beach (a volleyball game to join, a shaved-ice kiosk), a rope bridge to
// Starfish Cove (tide pools to peek into, a little marina whose pier reaches Treasure Isle) and another rope bridge to
// Rocket Island (js/rocket.js: a rocket under construction). The huts, the lighthouse and the rocket's mission control
// can be entered (js/islands-inside.js); both files read their spots from CFG.ISLANDS and load after this one.
// The two sailboats moored at the marina can be sailed ('⛵ Sail'): they stay on the water, the sail fills and leans as
// they turn, and '⚓ Dock' only lets the chef off beside a beach or a pier ("Sail to the shore to get off! ⛵"); they stay
// wherever they were docked (not saved). On Sunny Beach a palm-thatched beach hut with a bed to sleep in (inside: js/islands-inside.js).

CFG.AREAS.islands = { WORLD: { x0: 2600, y0: 1400, x1: 4600, y1: 2950 } };   // y 3000+ belongs to the City's interiors
CFG.VEHICLES.jetski = { speed: 420, radius: 16, label: '🚤 Ride', exit: '🚶 Hop off' };
CFG.VEHICLES.sailboat = { speed: 180, radius: 24, label: '⛵ Sail', exit: '⚓ Dock' };
CFG.ISLANDS = {
  WORLD: CFG.AREAS.islands.WORLD,
  // ---- in town: the river across the whole south edge, the dock behind River House
  RIVER: { x0: -1320, y0: 1200, x1: 1520, y1: 1300 },
  TOWN_DOCK: { x0: -30, y0: 1172, x1: 50, y1: 1268 },      // planks from the grass out over the water, in the gap west of River House
  TOWN_FERRY: { x: 130, y: 1247 },                         // moored on the east side of the dock
  TOWN_CRATE: { x: -14, y: 1252 },                          // pizzas wait here while you are away
  TOWN_ARRIVE: { x: 18, y: 1228 },
  SIGN: { x: -60, y: 1180 }, BENCH: { x: 90, y: 1182 },
  LILIES: [[-900, 1270, 1], [-860, 1282, 0], [-420, 1230, 0], [760, 1278, 1], [800, 1265, 0], [1180, 1240, 1]],
  REEDS: [-1200, -1030, -640, -230, 200, 440, 880, 1060, 1400],
  ROCKS: [[-1100, 1296, 14], [-560, 1204, 11], [-120, 1298, 16], [340, 1206, 12], [660, 1300, 12], [990, 1208, 10], [1330, 1296, 14]],
  // ---- the Islands map
  ISLANDS: [
    { key: 'main', name: 'Pizza Island', x0: 2720, y0: 1960, x1: 3280, y1: 2440, palms: [[2770, 2020], [3230, 2010], [2760, 2410], [3080, 2425], [3250, 2330]] },
    { key: 'coconut', name: 'Coconut Hut', x0: 3480, y0: 1500, x1: 3780, y1: 1760, hut: { x: 3630, y: 1660 }, palms: [[3520, 1545], [3740, 1550], [3545, 1735]] },
    { key: 'lighthouse', name: 'Lighthouse', x0: 4140, y0: 1480, x1: 4400, y1: 1720, hut: { x: 4320, y: 1620 }, tower: { x: 4210, y: 1645 }, palms: [[4165, 1525]] },
    { key: 'crab', name: 'Crab Shack', x0: 4100, y0: 2150, x1: 4420, y1: 2420, hut: { x: 4260, y: 2325 }, palms: [[4135, 2195], [4395, 2190], [4400, 2405]] },
    { key: 'treasure', name: 'Treasure Isle', x0: 3560, y0: 2300, x1: 3720, y1: 2430, palms: [[3695, 2335]], chest: { x: 3592, y: 2404 } },
    { key: 'turtle', name: 'Turtle Rock', x0: 3860, y0: 1860, x1: 3980, y1: 1960, rock: true },
    // ---- the southern islands, joined to Pizza Island on foot (see LINKS)
    { key: 'sunny', name: 'Sunny Beach', x0: 2700, y0: 2580, x1: 3260, y1: 2900, sand: true, toast: '🏖️ Sunny Beach! Play volleyball!', palms: [[2735, 2618], [3225, 2618], [2728, 2868], [3232, 2872]] },
    { key: 'cove', name: 'Starfish Cove', x0: 3400, y0: 2590, x1: 3700, y1: 2880, sand: true, toast: '⭐ Starfish Cove! Peek in the tide pools', palms: [[3428, 2622], [3676, 2862]] },
    { key: 'rocket', name: 'Rocket Island', x0: 3840, y0: 2540, x1: 4460, y1: 2900, toast: '🚀 Rocket Island! A rocket is being built!', palms: [[3872, 2578], [4432, 2578], [4436, 2876]] },
  ],
  // walkable strips over the water between islands: [kind] sand = a sandbar, bridge = a rope bridge, pier = planks on posts
  LINKS: [
    { key: 'sandbar', kind: 'sand', x0: 2980, y0: 2424, x1: 3050, y1: 2596 },      // Pizza Island ↔ Sunny Beach
    { key: 'bridge1', kind: 'bridge', x0: 3244, y0: 2700, x1: 3416, y1: 2756 },    // Sunny Beach ↔ Starfish Cove
    { key: 'bridge2', kind: 'bridge', x0: 3684, y0: 2700, x1: 3856, y1: 2756 },    // Starfish Cove ↔ Rocket Island
    { key: 'pier', kind: 'pier', x0: 3600, y0: 2414, x1: 3644, y1: 2604 },         // the marina pier: Starfish Cove ↔ Treasure Isle
  ],
  // Sunny Beach: a volleyball court with two players (the chef can take the left side), a shaved-ice kiosk
  SUNNY: {
    COURT: { x0: 2740, y0: 2680, x1: 2960, y1: 2810 }, NET: { x: 2850, y0: 2684, y1: 2806 },
    PLAYERS: [{ x: 2786, y: 2745 }, { x: 2914, y: 2745 }], ASIDE: { x: 2770, y: 2836 },   // the left player steps aside here when the chef plays
    KIOSK: { x: 3140, y: 2808, w: 120 }, PAD: { x: 3140, y: 2862 }, PRICE: 3,
    UMBRELLAS: [[2806, 2632, '#3b7dd8'], [3058, 2650, '#ff8fab']], TOWELS: [[2784, 2656, '#ffd166'], [3036, 2672, '#41b883']],
    CASTLE: { x: 2960, y: 2872 }, FLIGHT: 1.05,
  },
  // Starfish Cove: rock-ringed tide pools with things living in them, a marina with two sailboats along the pier
  COVE: {
    POOLS: [{ x: 3476, y: 2814, rx: 42, ry: 24 }, { x: 3606, y: 2828, rx: 34, ry: 20 }, { x: 3486, y: 2642, rx: 32, ry: 19 }],
    CRITTERS: [['A starfish! ⭐', '⭐'], ['A hermit crab! 🐚', '🐚'], ['A little fish! 🐟', '🐟'], ['A sea snail! 🐌', '🐌'], ['An octopus! 🐙', '🐙']],
    BOATS: [{ x: 3566, y: 2520, hull: '#3b7dd8', sail: '#fff8ee', flag: '#e4572e' }, { x: 3680, y: 2528, hull: '#e4572e', sail: '#ffe08a', flag: '#3b7dd8' }],
    SAIL_LOOP: { x: 2990, y: 1640, rx: 250, ry: 120, period: 70 },   // a sailboat cruising round the open water up north
    DOCK_R: [40, 52, 64, 76],                                          // how far from a sailboat the chef may step ashore
  },
  // Sunny Beach's beach hut: (x, y) is the middle of its porch's front edge; the back stands over the shallows
  BEACHHUT: { x: 3130, y: 2600, door: { x: 3130, y: 2622 } },
  // Rocket Island (js/rocket.js paints and animates it; js/islands-inside.js owns mission control's inside)
  ROCKET: {
    PAD: { x0: 4060, y0: 2630, x1: 4300, y1: 2850 },
    BASE: { x: 4180, y: 2768 },                       // the rocket's feet
    SCAFFOLD: { x0: 4222, x1: 4286, y: 2770, h: 200 },
    CRANE: { x: 4372, y: 2690, h: 228 },
    TRUCK: { x: 3992, y: 2850 },
    MISSION: { x: 3960, y: 2640, w: 120, h: 80 },     // the hut; its door faces south
    SIGN: { x: 3940, y: 2800 },
    PARTS: { x: 4382, y: 2842 },
    ASK: { x: 4180, y: 2812 },
  },
  DOCK: { x0: 2970, y0: 1850, x1: 3030, y1: 1975 },         // ferry dock on the north shore of Pizza Island
  FERRY: { x: 3100, y: 1895 },
  ARRIVE: { x: 3000, y: 1905 },
  STAND: { x: 2880, y: 2130, oven: { x: 2975, y: 2140 }, pile: { x: 2975, y: 2200 }, pad: { x: 2905, y: 2225 }, price: 400 },
  JETSKI: { x: 3312, y: 2200 },
  BUOY: { x: 3400, y: 1720 },
  CRABS: [[3050, 3200, 1984], [4140, 4370, 2398], [3500, 3620, 1515], [2770, 2900, 2886], [3420, 3540, 2872]],       // [x0, x1, y] beach runs
  DOLPHIN_SPOTS: [[3000, 1600], [3350, 2020], [3900, 1620], [3820, 2250], [2800, 1760], [4480, 1950], [3330, 1560], [3330, 2870], [3770, 2860], [2660, 2700]],
  BAKE: 6, PILE_MAX: 6, TAKE_RADIUS: 56,
  ORDER_EVERY: [30, 50], ORDER_MAX: 2, ORDER_WAIT: 120, FIRST_ORDER: 10,
  TRAVEL: 7,
};
// a shiny coin on the main island's beach and the treasure chest's coin (the core draws and collects coins)
CFG.COINS.push({ x: 2790, y: 2300 }, { x: CFG.ISLANDS.ISLANDS[4].chest.x, y: CFG.ISLANDS.ISLANDS[4].chest.y - 4 });

const IslandsExt = {
  name: 'islands',
  defaults: { islands: { standOwned: false, pile: 0, dockPizzas: 0, seen: {}, rally: 0, peeks: 0, snacks: 0 } },
  rt: null,   // runtime (not saved): huts, jet ski, sailboats, crabs, dolphin, wake, timers, the volleyball, the tide pools, a treat in hand

  // ======================= game hooks =======================
  build(g) {
    const I = CFG.ISLANDS;
    if (!g.s.islands) g.s.islands = JSON.parse(JSON.stringify(this.defaults.islands));
    const st = g.s.islands;
    if (st.dockPizzas === undefined) st.dockPizzas = 0;
    if (st.pile === undefined) st.pile = 0;
    if (!st.seen) st.seen = {};
    for (const k of ['rally', 'peeks', 'snacks']) if (st[k] === undefined) st[k] = 0;
    const huts = I.ISLANDS.filter((s) => s.hut).map((s) => ({ key: s.key, name: s.name, hut: s.hut, door: { x: s.hut.x, y: s.hut.y + 44 }, order: null, happy: 0 }));
    this.rt = {
      huts,
      jetski: { kind: 'jetski', x: I.JETSKI.x, y: I.JETSKI.y, angle: -Math.PI / 2, vx: 0, vy: 0 },
      // the marina's sailboats: rideable, they stay wherever they were docked until the game reloads
      boats: I.COVE.BOATS.map((B) => ({ kind: 'sailboat', x: B.x, y: B.y, angle: -Math.PI / 2, vx: 0, vy: 0, B, fill: 0, lean: 0, side: 1, pa: -Math.PI / 2 })),
      bakeT: 0, orderT: I.FIRST_ORDER, lastVeh: null, wakeT: 0, wake: [], dockT: 0, canDock: false,
      crabs: I.CRABS.map(([x0, x1, y], i) => ({ x: U.rand(x0, x1), y, x0, x1, dir: i % 2 ? 1 : -1, t: U.rand(0, 2), pause: 0, step: 0 })),
      dolphin: { t: -U.rand(3, 7), x: 3000, y: 1600, dir: 1 },
      water: null, carObs: null, statics: null, river: null,
      // volleyball: the ball flies between the two players (or the chef, who takes the left side): { from, to, t, by }
      vb: { ball: null, chef: false, wait: false, cheer: 0, rally: 0, hitT: [0, 0], who: [0, 0] },
      peek: null, peekN: 0,      // a tide pool showing what lives in it: { i, t, k }
      treat: null,               // something tasty in the chef's hand: { kind, t }
    };
    const SU = I.SUNNY, rt = this.rt;
    rt.vb.who = SU.PLAYERS.map((q) => ({ x: q.x, y: q.y, facing: q.x < SU.NET.x ? 1 : -1, moving: false, bob: 0, arm: 0 }));
    rt.vb.ball = { from: { x: SU.PLAYERS[0].x, y: SU.PLAYERS[0].y }, to: { x: SU.PLAYERS[1].x, y: SU.PLAYERS[1].y }, t: 0, by: 0 };
    this.buildObstacles();
  },

  // Water for people, land for the jet ski. Land is the island rectangles (the art is rounder, so the
  // rectangles are inset a little and the chef always has sand under his feet). Water is the complement,
  // cut into horizontal bands between island edges: a few dozen rectangles for the whole map.
  buildObstacles() {
    const I = CFG.ISLANDS, W = I.WORLD, rt = this.rt;
    const land = I.ISLANDS.map((s) => ({ x0: s.x0 + 8, y0: s.y0 + 8, x1: s.x1 - 8, y1: s.y1 - 8 }));
    land.push({ x0: I.DOCK.x0, y0: I.DOCK.y0, x1: I.DOCK.x1, y1: I.DOCK.y1 });
    for (const L of I.LINKS) land.push({ x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1 });
    const ys = [...new Set(land.flatMap((l) => [l.y0, l.y1]).concat([W.y0, W.y1]))].sort((a, b) => a - b);
    const water = [];
    for (let i = 0; i < ys.length - 1; i++) {
      const ya = ys[i], yb = ys[i + 1];
      const row = land.filter((l) => l.y0 < yb && l.y1 > ya).sort((a, b) => a.x0 - b.x0);
      let x = W.x0;
      for (const l of row) { if (l.x0 > x) water.push({ x, y: ya, w: l.x0 - x, h: yb - ya }); x = Math.max(x, l.x1); }
      if (x < W.x1) water.push({ x, y: ya, w: W.x1 - x, h: yb - ya });
    }
    // merge rectangles stacked on top of each other with the same span
    const merged = [];
    for (const r of water) { const m = merged.find((o) => o.x === r.x && o.w === r.w && o.y + o.h === r.y); if (m) m.h += r.h; else merged.push(r); }
    rt.water = this.chunk(merged, 400);
    // solid things on land for people: huts, the lighthouse tower, the ferry sign
    const statics = [];
    for (const s of I.ISLANDS) {
      if (s.hut) statics.push({ x: s.hut.x - 48, y: s.hut.y - 40, w: 96, h: 78 });
      if (s.tower) statics.push({ x: s.tower.x - 16, y: s.tower.y - 16, w: 32, h: 22 });
      if (s.chest) statics.push({ x: s.chest.x - 14, y: s.chest.y - 4, w: 28, h: 4 });
    }
    // Sunny Beach: the net and its posts, the kiosk, the beach hut; Starfish Cove: the tide pools
    const SU = I.SUNNY, K = SU.KIOSK, N = SU.NET, BH = I.BEACHHUT;
    statics.push({ x: N.x - 4, y: N.y0, w: 8, h: N.y1 - N.y0 });
    statics.push({ x: K.x - K.w / 2, y: K.y - 38, w: K.w, h: 60 });
    statics.push({ x: BH.x - 60, y: BH.y - 110, w: 120, h: 114 });
    for (const P of I.COVE.POOLS) statics.push({ x: P.x - P.rx * 0.8, y: P.y - P.ry * 0.7, w: P.rx * 1.6, h: P.ry * 1.4 });
    rt.statics = statics;
    const S = I.STAND;
    rt.standObs = [{ x: S.x - 58, y: S.y - 46, w: 116, h: 66 }, { x: S.oven.x - 22, y: S.oven.y - 22, w: 44, h: 36 }];
    // the jet ski noses up onto the beaches but cannot cross an island; the dock and the ferry are solid
    rt.carObs = I.ISLANDS.map((s) => ({ x: s.x0 + 20, y: s.y0 + 20, w: s.x1 - s.x0 - 40, h: s.y1 - s.y0 - 40 }));
    rt.carObs.push({ x: I.DOCK.x0, y: I.DOCK.y0, w: I.DOCK.x1 - I.DOCK.x0, h: I.DOCK.y1 - I.DOCK.y0 });
    rt.carObs.push({ x: I.FERRY.x - 60, y: I.FERRY.y - 24, w: 120, h: 48 });
    const hutObs = { x: BH.x - 70, y: BH.y - 112, w: 140, h: 118 };
    rt.carObs.push(hutObs);
    // a sailboat stays on the water: every bit of land (as the chef walks it), the sandbar, bridges and pier, the ferry
    rt.sailObs = land.map((l) => ({ x: l.x0, y: l.y0, w: l.x1 - l.x0, h: l.y1 - l.y0 }));
    rt.sailObs.push({ x: I.FERRY.x - 60, y: I.FERRY.y - 24, w: 120, h: 48 }, hutObs);
  },
  // the other boats (and the jet ski) bump a vehicle that is not themselves
  boatObs(g, self) {
    const rt = this.rt, out = [];
    for (const b of rt.boats) if (b !== self) out.push({ x: b.x - 20, y: b.y - 20, w: 40, h: 40 });
    if (self && self !== rt.jetski) out.push({ x: rt.jetski.x - 16, y: rt.jetski.y - 16, w: 32, h: 32 });
    return out;
  },
  isSail(v) { return !!(v && v.kind === 'sailboat' && this.rt && this.rt.boats.includes(v)); },

  // Wide rectangles cut into pieces no wider than `max`: the core pushes a thing that overlaps a
  // rectangle out to its nearest side, so a short piece can never fling it far.
  chunk(rects, max) {
    const out = [];
    for (const r of rects) { const n = Math.ceil(r.w / max), w = r.w / n; for (let i = 0; i < n; i++) out.push({ x: r.x + i * w, y: r.y, w, h: r.h }); }
    return out;
  },
  riverObstacles(forCar) {
    const I = CFG.ISLANDS, R = I.RIVER, D = I.TOWN_DOCK;
    if (forCar) return this.chunk([{ x: R.x0, y: R.y0, w: R.x1 - R.x0, h: R.y1 - R.y0 }], 300);
    const o = this.chunk([
      { x: R.x0, y: R.y0, w: D.x0 - R.x0, h: R.y1 - R.y0 },           // water west of the dock
      { x: D.x1, y: R.y0, w: R.x1 - D.x1, h: R.y1 - R.y0 },           // water east of the dock
    ], 300);
    o.push({ x: D.x0, y: D.y1, w: D.x1 - D.x0, h: R.y1 - D.y1 });     // water past the end of the dock
    o.push({ x: I.SIGN.x - 4, y: I.SIGN.y - 4, w: 8, h: 8 });   // the bench by the ferry stop is walk-through
    return o;
  },
  obstacles(g, forCar) {
    if (!this.rt) return [];
    if (g.area === 'town') {
      if (!this.rt.river) this.rt.river = { car: this.riverObstacles(true), foot: this.riverObstacles(false) };
      return forCar ? this.rt.river.car : this.rt.river.foot;
    }
    if (g.area !== 'islands' || !this.rt) return [];
    if (forCar) { const v = g.driving ? g.vehicle : null; return (this.isSail(v) ? this.rt.sailObs : this.rt.carObs).concat(this.boatObs(g, v)); }
    return g.s.islands.standOwned ? this.rt.water.concat(this.rt.statics, this.rt.standObs) : this.rt.water.concat(this.rt.statics);
  },

  vehicles(g) { return this.rt ? [this.rt.jetski].concat(this.rt.boats) : []; },

  pads(g) {
    const S = CFG.ISLANDS.STAND, SU = CFG.ISLANDS.SUNNY, out = [], p = g.player;
    if (!g.s.islands.standOwned) out.push({ key: 'islandStand', label: 'Island Pizza Stand', ico: '🏝️', pos: S.pad, price: S.price });
    // the kiosk's circle only shows to someone at the kiosk (it can be bought again and again, so it never "completes")
    if (g.area === 'islands' && U.dist(p.x, p.y, SU.PAD.x, SU.PAD.y) < 150) out.push({ key: 'sunnySnack', label: 'Shaved ice', ico: '🍧', pos: SU.PAD, price: SU.PRICE, sub: 'so cold!', maxed: !!(this.rt && this.rt.treat && this.rt.treat.kind === 'snowcone') });
    return out;
  },
  onPad(g, pad) {
    if (pad.key === 'sunnySnack') { g.s.islands.snacks++; this.giveTreat(g, 'snowcone'); g.floats.push({ x: g.player.x, y: g.player.y - 64, text: 'Shaved ice! 🍧', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); return; }
    if (pad.key !== 'islandStand') return;
    g.s.islands.standOwned = true; this.rt.bakeT = CFG.ISLANDS.BAKE - 2;
    Sfx.unlock(); Haptics.success();
    g.toast('🏝️ Your island pizza stand is open!', true);
  },
  bgKey(g) { return 'isl' + (g.s.islands && g.s.islands.standOwned ? 1 : 0); },

  onTownDock(p) { const D = CFG.ISLANDS.TOWN_DOCK; return p.x > D.x0 && p.x < D.x1 && p.y > D.y0 + 26 && p.y < D.y1 + 6; },
  onIslandDock(p) { const D = CFG.ISLANDS.DOCK; return p.x > D.x0 - 2 && p.x < D.x1 + 2 && p.y > D.y0 - 6 && p.y < D.y1 - 18; },

  action(g) {
    if (g.driving || g.onTrain || g.fishing || g.ride) return null;
    const p = g.player;
    if (g.area === 'town' && this.onTownDock(p)) return { label: '⛴️ Ride the ferry', run: (gg) => this.boardFerry(gg, 'islands') };
    if (g.area === 'islands' && this.onIslandDock(p)) return { label: '⛴️ Ferry home', run: (gg) => this.boardFerry(gg, 'town') };
    if (g.area !== 'islands' || g.travel || !this.rt) return null;
    if (this.atCourt(g)) return { label: '🏐 Hit the ball!', run: (gg) => this.hitBall(gg) };
    const pool = this.nearPool(g);
    if (pool >= 0) return { label: '⭐ Peek in the tide pool', run: (gg) => this.peekPool(gg, pool) };
    return null;
  },
  // ---- Sunny Beach volleyball: stand on the left side of the net and press to hit the ball over
  atCourt(g) {
    const p = g.player, C = CFG.ISLANDS.SUNNY.COURT, N = CFG.ISLANDS.SUNNY.NET;
    return !g.driving && p.x > C.x0 - 30 && p.x < N.x - 16 && p.y > C.y0 - 20 && p.y < C.y1 + 24;
  },
  // the ball flies from one side to the other: a lob over the net, landing where the other player stands
  serve(fromX, fromY, toX, toY, by) {
    const vb = this.rt.vb;
    vb.ball = { from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, t: 0, by };
    vb.wait = false;
  },
  hitBall(g) {
    const vb = this.rt.vb, p = g.player, SU = CFG.ISLANDS.SUNNY, B = vb.who[1];
    vb.chef = true; vb.rally++; g.s.islands.rally = Math.max(g.s.islands.rally, vb.rally);
    this.serve(p.x + 6, p.y, B.x, U.rand(SU.COURT.y0 + 26, SU.COURT.y1 - 26), 'chef');
    vb.hitT[0] = 0.3; p.facing = 1;
    const words = ['Bump! 🏐', 'Nice hit!', 'Over the net!', 'Spike! 💥', 'Super!'];
    g.floats.push({ x: p.x, y: p.y - 70, text: vb.rally > 1 ? `${words[vb.rally % words.length]} ×${vb.rally}` : 'Bump! 🏐', color: '#ffe08a', t: 0, dur: 1.1, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  ballPos(g) {
    const vb = this.rt.vb, b = vb.ball, SU = CFG.ISLANDS.SUNNY;
    if (vb.wait) { const p = g.player, k = Math.abs(Math.sin(g.time * 3.2)); return { x: p.x + 8, y: p.y, h: 70 + k * 26 }; }
    const k = U.clamp(b.t / SU.FLIGHT, 0, 1);
    return { x: U.lerp(b.from.x, b.to.x, k), y: U.lerp(b.from.y, b.to.y, k), h: 40 + Math.sin(k * Math.PI) * 120 };
  },
  updateVolleyball(g, dt) {
    const vb = this.rt.vb, SU = CFG.ISLANDS.SUNNY, p = g.player, [A, B] = vb.who, b = vb.ball;
    vb.hitT[0] = Math.max(0, vb.hitT[0] - dt); vb.hitT[1] = Math.max(0, vb.hitT[1] - dt); vb.cheer += dt;
    if (vb.chef && !this.atCourt(g)) {
      // the chef wandered off: the left player takes over again
      vb.chef = false; vb.rally = 0;
      if (vb.wait || b.to.x < SU.NET.x) this.serve(B.x, B.y, A.x, A.y, 'B');
    }
    // the players shuffle to where the ball will land; the left one waits aside while the chef plays
    const aim = (who, x, y) => { const moved = !U.moveToward(who, x, y, 90, dt); who.bob = moved ? who.bob + dt * 14 : 0; };
    if (vb.chef) aim(A, SU.ASIDE.x, SU.ASIDE.y); else aim(A, SU.PLAYERS[0].x, b.to.x < SU.NET.x ? b.to.y : SU.PLAYERS[0].y);
    aim(B, SU.PLAYERS[1].x, b.to.x > SU.NET.x ? b.to.y : SU.PLAYERS[1].y);
    A.facing = vb.chef ? (p.x < A.x ? -1 : 1) : 1; B.facing = -1;
    if (vb.wait) return;
    b.t += dt;
    if (b.t < SU.FLIGHT) return;
    // landed at someone: they bump it straight back (the chef gets it bouncing above the head, waiting for the button)
    if (b.to.x > SU.NET.x) {
      vb.hitT[1] = 0.3;
      if (vb.chef) { this.serve(B.x - 6, B.y, p.x, p.y, 'B'); }
      else this.serve(B.x - 6, B.y, A.x, U.rand(SU.COURT.y0 + 26, SU.COURT.y1 - 26), 'B');
    } else if (vb.chef) { vb.wait = true; b.t = 0; }
    else { vb.hitT[0] = 0.3; this.serve(A.x + 6, A.y, B.x, U.rand(SU.COURT.y0 + 26, SU.COURT.y1 - 26), 'A'); }
  },
  // ---- Starfish Cove: peek into a tide pool and something living there pops up
  nearPool(g) {
    if (g.driving) return -1;
    const p = g.player;
    return CFG.ISLANDS.COVE.POOLS.findIndex((P) => Math.abs(p.x - P.x) < P.rx + 24 && Math.abs(p.y - P.y) < P.ry + 26);
  },
  peekPool(g, i) {
    const rt = this.rt, C = CFG.ISLANDS.COVE, P = C.POOLS[i], c = C.CRITTERS[rt.peekN % C.CRITTERS.length];
    rt.peekN++; g.s.islands.peeks++;
    rt.peek = { i, t: 0, k: (rt.peekN - 1) % C.CRITTERS.length };
    g.floats.push({ x: P.x, y: P.y - 50, text: c[0], color: '#ffe08a', t: 0, dur: 1.6, big: true });
    for (let k = 0; k < 4; k++) g.fx.push({ kind: 'sparkle', x0: P.x + U.rand(-P.rx * 0.6, P.rx * 0.6), y0: P.y + U.rand(-6, 6), x1: 0, y1: 0, t: -k * 0.06, dur: 0.5 });
    Sfx.ding(); Haptics.tap();
  },
  // ---- a treat in the chef's hand (the kiosk's shaved ice, the Crab Shack's cookie, the Coconut Hut's drink)
  giveTreat(g, kind, secs) { if (this.rt) this.rt.treat = { kind, t: secs || 30 }; },
  home(g) {
    if (!this.rt) return;
    const vb = this.rt.vb, SU = CFG.ISLANDS.SUNNY;
    this.rt.treat = null; this.rt.peek = null;
    vb.chef = false; vb.wait = false; vb.rally = 0;
    this.serve(SU.PLAYERS[0].x, SU.PLAYERS[0].y, SU.PLAYERS[1].x, SU.PLAYERS[1].y, 'A');
  },
  horn() { Sfx.tone(170, 0.5, 'sawtooth', 0.045); setTimeout(() => Sfx.tone(170, 0.7, 'sawtooth', 0.045), 650); },
  boardFerry(g, to) {
    const p = g.player, st = g.s.islands, C = CFG.ISLANDS.TOWN_CRATE;
    if (to === 'islands' && p.carry > 0) {
      // the town's pizzas stay in a crate on the dock and come back with you
      for (let i = 0; i < Math.min(p.carry, 8); i++) g.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: C.x, y1: C.y - 14, t: -i * 0.05, dur: 0.3 });
      st.dockPizzas += p.carry; p.carry = 0;
      g.toast('Pizzas stay on the dock!');
    }
    this.horn(); Haptics.tap();
    g.startTravel(to, 'ferry', CFG.ISLANDS.TRAVEL);
  },
  arrive(g, travel) {
    if (travel.via !== 'ferry') return;
    const I = CFG.ISLANDS, p = g.player, st = g.s.islands;
    p.moving = false; p.hasMoved = true;
    if (travel.to === 'islands') {
      p.x = I.ARRIVE.x; p.y = I.ARRIVE.y; p.facing = 1;
      this.rt.orderT = Math.min(this.rt.orderT, I.FIRST_ORDER);
      g.toast('🏝️ Welcome to the Islands!', true);
    } else {
      p.x = I.TOWN_ARRIVE.x; p.y = I.TOWN_ARRIVE.y; p.facing = -1;
      g.toast('🍕 Home sweet home!', true);
      if (st.dockPizzas > 0) {
        const take = Math.min(st.dockPizzas, Math.max(0, g.playerCap() - p.carry));
        for (let i = 0; i < Math.min(take, 8); i++) g.fx.push({ kind: 'pizza', x0: I.TOWN_CRATE.x, y0: I.TOWN_CRATE.y - 14, x1: p.x, y1: p.y - 30, t: -i * 0.05, dur: 0.3 });
        p.carry += take; st.dockPizzas -= take;
        g.floats.push({ x: p.x, y: p.y - 70, text: 'Your pizzas are back!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      }
    }
    Haptics.success();
  },

  update(g, dt) {
    const I = CFG.ISLANDS, st = g.s.islands, rt = this.rt, p = g.player, s = g.s;
    if (!rt) return;
    const near = (pos, r) => U.dist(p.x, p.y, pos.x, pos.y) < r;
    // the stand bakes by itself, up to a small pile
    if (st.standOwned && st.pile < I.PILE_MAX) {
      rt.bakeT += dt;
      if (rt.bakeT >= I.BAKE) { rt.bakeT = 0; st.pile++; g.fx.push({ kind: 'pizza', x0: I.STAND.oven.x, y0: I.STAND.oven.y - 10, x1: I.STAND.pile.x, y1: I.STAND.pile.y - 10, t: 0, dur: 0.35 }); }
    }
    const inIslands = g.area === 'islands' && !g.travel;
    // take pizzas from the stand, one at a time, standing by the oven
    if (inIslands && !g.driving && st.pile > 0 && near(I.STAND.pile, I.TAKE_RADIUS) && p.carry < g.playerCap() && p.xferCd <= 0) {
      st.pile--; p.carry++; p.xferCd = CFG.XFER_DELAY;
      g.fx.push({ kind: 'pizza', x0: I.STAND.pile.x, y0: I.STAND.pile.y - 10, x1: p.x, y1: p.y - 30, t: 0, dur: 0.15 });
      Sfx.pickup();
    }
    // the crate on the town dock gives back any pizzas left there
    if (g.area === 'town' && !g.travel && !g.driving && st.dockPizzas > 0 && near(I.TOWN_CRATE, 44) && p.carry < g.playerCap() && p.xferCd <= 0) {
      st.dockPizzas--; p.carry++; p.xferCd = CFG.XFER_DELAY;
      g.fx.push({ kind: 'pizza', x0: I.TOWN_CRATE.x, y0: I.TOWN_CRATE.y - 14, x1: p.x, y1: p.y - 30, t: 0, dur: 0.15 });
      Sfx.pickup();
    }
    // hut orders (only while you are on the islands, so nobody waits for nothing)
    if (inIslands) {
      rt.orderT -= dt;
      if (rt.orderT <= 0) {
        rt.orderT = U.rand(I.ORDER_EVERY[0], I.ORDER_EVERY[1]);
        const open = rt.huts.filter((h) => !h.order);
        if (open.length && rt.huts.filter((h) => h.order).length < I.ORDER_MAX) {
          const h = U.pick(open);
          h.order = { want: U.randInt(1, 3), have: 0, t: I.ORDER_WAIT };
          g.toast(`🏝️ ${h.name} wants pizza!`, true);
        }
      }
    }
    for (const h of rt.huts) {
      h.happy = Math.max(0, h.happy - dt);
      if (!h.order) continue;
      h.order.t -= dt;
      if (h.order.t <= 0) { h.order = null; g.floats.push({ x: h.door.x, y: h.door.y - 40, text: 'Maybe next time', color: '#8a7a6a', t: 0, dur: 1.5 }); continue; }
      // deliver: on the jet ski nosed up to the beach, or on foot at the door
      if (inIslands && p.carry > 0 && near(h.door, 80) && p.xferCd <= 0) {
        p.carry--; h.order.have++; p.xferCd = CFG.XFER_DELAY * 2;
        const amt = Math.round(g.price() * CFG.DELIVERY_TIP);
        s.cash += amt; s.stats.earned += amt;
        g.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: h.door.x, y1: h.door.y - 10, t: 0, dur: 0.25 });
        g.floats.push({ x: h.door.x, y: h.door.y - 30, text: '+' + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
        Sfx.cash();
        if (h.order.have >= h.order.want) { h.order = null; h.happy = 3; s.stats.delivered++; g.floats.push({ x: h.door.x, y: h.door.y - 56, text: 'Thank you!', color: '#ff6b8a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
      }
    }
    // the wake behind the jet ski or a sailboat
    const js = rt.jetski, veh = g.driving && (g.vehicle === js || this.isSail(g.vehicle)) ? g.vehicle : null;
    for (const w of rt.wake) w.t += dt;
    rt.wake = rt.wake.filter((w) => w.t < 1.1);
    if (veh) {
      const speed = Math.hypot(veh.vx, veh.vy), sail = veh !== js, back = sail ? 32 : 24;
      rt.wakeT -= dt;
      if (speed > (sail ? 40 : 60) && rt.wakeT <= 0) { rt.wakeT = sail ? 0.09 : 0.06; rt.wake.push({ x: veh.x - Math.cos(veh.angle) * back, y: veh.y - Math.sin(veh.angle) * back, t: 0, big: sail }); if (rt.wake.length > 40) rt.wake.shift(); }
    }
    this.updateBoats(g, dt);
    // stepping off: off the jet ski in open water the chef swims to the nearest beach; a sailboat only docks by the shore
    const left = rt.lastVeh;
    if (left && !g.driving && g.area === 'islands') { if (this.isSail(left)) this.afterDock(g, left); else this.swimToShore(g); }
    rt.lastVeh = g.driving && (g.vehicle === js || this.isSail(g.vehicle)) ? g.vehicle : null;
    if (rt.treat) { rt.treat.t -= dt; if (rt.treat.t <= 0) rt.treat = null; }
    if (!inIslands) return;
    // the first time the chef sets foot on one of the new islands, a friendly welcome
    for (const sI of I.ISLANDS) {
      if (!sI.toast || st.seen[sI.key] || g.driving || p.x < sI.x0 || p.x > sI.x1 || p.y < sI.y0 || p.y > sI.y1) continue;
      st.seen[sI.key] = true; g.toast(sI.toast, true);
    }
    this.updateVolleyball(g, dt);
    if (rt.peek) { rt.peek.t += dt; if (rt.peek.t > 2.2) rt.peek = null; }
    // crabs scuttle sideways along their beach, pausing now and then
    for (const c of rt.crabs) {
      if (c.pause > 0) { c.pause -= dt; continue; }
      c.x += c.dir * 38 * dt; c.step += dt * 16;
      if (c.x < c.x0 || c.x > c.x1) { c.x = U.clamp(c.x, c.x0, c.x1); c.dir *= -1; c.pause = U.rand(0.5, 2); }
      else if (Math.random() < dt * 0.3) { c.pause = U.rand(0.4, 1.5); }
    }
    // a dolphin jumps somewhere in open water now and then
    const d = rt.dolphin; d.t += dt;
    if (d.t > 1.6) { d.t = -U.rand(5, 12); const sp = U.pick(I.DOLPHIN_SPOTS); d.x = sp[0]; d.y = sp[1]; d.dir = Math.random() < 0.5 ? -1 : 1; }
  },
  // the sails fill with speed and the boat leans into a turn; while sailing, now and then check for a place to step ashore
  updateBoats(g, dt) {
    const rt = this.rt;
    for (const b of rt.boats) {
      const sailing = g.driving && g.vehicle === b, sp = Math.hypot(b.vx, b.vy);
      let d = b.angle - b.pa; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      b.pa = b.angle;
      const turn = dt > 0 ? d / dt : 0, k = Math.min(1, dt * 4);
      b.fill = U.lerp(b.fill, sailing ? U.clamp(sp / CFG.VEHICLES.sailboat.speed, 0, 1) : 0, Math.min(1, dt * 2.5));
      b.lean = U.lerp(b.lean, sailing ? U.clamp(-turn * 0.35, -0.7, 0.7) : 0, k);
      if (Math.abs(b.lean) > 0.18) b.side = b.lean > 0 ? 1 : -1;
    }
    rt.dockT -= dt;
    if (this.isSail(g.vehicle) && g.driving && rt.dockT <= 0) { rt.dockT = 0.15; rt.canDock = !!this.dockSpot(g, g.vehicle, null); }
  },
  // where the chef can step ashore from a sailboat: free ground (not water, not a hut) a short hop from the hull
  dockSpot(g, b, prefer) {
    const W = g.bounds(), obs = g.obstacles();
    const ok = (x, y) => x > W.x0 + 16 && x < W.x1 - 16 && y > W.y0 + 16 && y < W.y1 - 16 && !obs.some((o) => g.hitRect(x, y, 12, o));
    if (prefer && U.dist(prefer.x, prefer.y, b.x, b.y) < 60 && ok(prefer.x, prefer.y)) return { x: prefer.x, y: prefer.y };
    for (const d of CFG.ISLANDS.COVE.DOCK_R) {
      for (let i = 0; i < 16; i++) {
        const a = b.angle + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8), x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d;
        if (ok(x, y)) return { x, y };
      }
    }
    return null;
  },
  // the core has just let the chef off the sailboat: onto the shore beside it, or (no shore here) straight back aboard
  afterDock(g, b) {
    const p = g.player;
    if (U.dist(p.x, p.y, b.x, b.y) > 60) return;   // moved somewhere else entirely (Take-me-home, a ride): nothing to do
    const spot = this.dockSpot(g, b, { x: p.x, y: p.y });
    b.vx = 0; b.vy = 0;
    if (spot) { p.x = spot.x; p.y = spot.y; p.moving = false; p.facing = spot.x < b.x ? -1 : 1; return; }
    g.vehicle = b; g.driving = true; p.x = b.x; p.y = b.y;
    g.floats.push({ x: b.x, y: b.y - 84, text: 'Sail to the shore to get off! ⛵', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.error(); Haptics.tap();
  },
  swimToShore(g) {
    const p = g.player, rt = this.rt;
    if (!rt.water.some((o) => g.hitRect(p.x, p.y, 6, o))) return;
    let best = null, bd = Infinity;
    for (const s of CFG.ISLANDS.ISLANDS) {
      const x = U.clamp(p.x, s.x0 + 26, s.x1 - 26), y = U.clamp(p.y, s.y0 + 26, s.y1 - 26), dd = U.dist(p.x, p.y, x, y);
      if (dd < bd) { bd = dd; best = { x, y }; }
    }
    if (!best) return;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Splash! 💦', color: '#bfe9f7', t: 0, dur: 1.2, big: true });
    // the jet ski floats along to that beach too, so it is never left out of reach
    const dx = p.x - best.x, dy = p.y - best.y, d = Math.hypot(dx, dy) || 1, js = rt.jetski;
    js.x = best.x + (dx / d) * 44; js.y = best.y + (dy / d) * 44; js.angle = Math.atan2(-dy, -dx); js.vx = 0; js.vy = 0;
    p.x = best.x; p.y = best.y;
  },

  hint(g) {
    const I = CFG.ISLANDS, p = g.player, st = g.s.islands, rt = this.rt;
    if (!rt) return undefined;
    if (g.area === 'town') {
      if (g.driving || g.onTrain || g.fishing || g.ride) return undefined;
      const D = I.TOWN_DOCK, dx = (D.x0 + D.x1) / 2;
      if (U.dist(p.x, p.y, dx, D.y0) > 200) return undefined;
      if (p.carry > 0 && g.houses.some((h) => h.order)) return undefined;   // a delivery is more urgent
      if (this.onTownDock(p)) return { text: 'Press the button to ride the ferry! ⛴️', target: null };
      return { text: 'Ride the ferry to the islands!', target: { x: dx, y: D.y0 + 50 } };
    }
    if (g.area !== 'islands') return undefined;
    const order = rt.huts.find((h) => h.order), js = rt.jetski;
    if (g.driving) {
      if (this.isSail(g.vehicle)) {
        if (order && p.carry > 0) return { text: `Sail to ${order.name}! ⛵`, target: order.door };
        return rt.canDock ? { text: 'Press ⚓ Dock to hop off here', target: null } : { text: 'Sailing! ⛵ Sail to a beach or the pier', target: null };
      }
      if (order && p.carry > 0) return { text: `Deliver to ${order.name}!`, target: order.door };
      if (p.carry === 0 && st.pile > 0) return { text: 'Park at the beach and grab pizzas', target: I.STAND.pile };
      return { text: 'Zoom! Ride around the islands', target: null };
    }
    if (!(p.carry > 0 && order)) { const loc = this.localHint(g); if (loc) return loc; }
    if (!st.standOwned) {
      const need = I.STAND.price - (g.s.padPaid.islandStand || 0) - g.s.cash;
      return need > 0 ? { text: `Save up ${U.money(need)} more for the pizza stand`, target: I.STAND.pad } : { text: 'Set up the pizza stand', target: I.STAND.pad };
    }
    if (p.carry > 0 && order) return U.dist(p.x, p.y, js.x, js.y) < 70 ? { text: 'Hop on the jet ski!', target: null } : { text: `Deliver to ${order.name}! 🚤`, target: js };
    if (st.pile > 0 && p.carry < g.playerCap()) return { text: 'Grab pizzas from the stand', target: I.STAND.pile };
    if (this.onIslandDock(p)) return { text: 'Hop on the ferry to go home 🍕', target: null };
    if (p.carry > 0) return { text: 'Hop on the jet ski and find a hungry hut!', target: js };
    if (order) return { text: 'Pizzas are baking… get ready!', target: I.STAND.pile };
    return U.dist(p.x, p.y, js.x, js.y) < 70 ? { text: 'Hop on the jet ski!', target: null } : { text: 'Hop on the jet ski!', target: js };
  },

  // the things to do on Sunny Beach and Starfish Cove, when the chef is right there
  localHint(g) {
    const I = CFG.ISLANDS, p = g.player, rt = this.rt, SU = I.SUNNY;
    if (this.atCourt(g)) return rt.vb.wait ? { text: 'Hit the ball back over the net! 🏐', target: null } : { text: 'Press the button to hit the ball! 🏐', target: null };
    const C = SU.COURT;
    if (p.x > C.x0 - 80 && p.x < C.x1 + 60 && p.y > C.y0 - 70 && p.y < C.y1 + 60) return { text: 'Play volleyball! 🏐', target: { x: SU.PLAYERS[0].x - 20, y: SU.PLAYERS[0].y + 40 } };
    const dk = U.dist(p.x, p.y, SU.PAD.x, SU.PAD.y);
    if (dk < 110) {
      if (rt.treat && rt.treat.kind === 'snowcone') return { text: 'Yum, shaved ice! 🍧', target: null };
      return g.s.cash + (g.s.padPaid.sunnySnack || 0) >= SU.PRICE ? { text: 'Stand on the circle for a shaved ice! 🍧', target: dk < 30 ? null : SU.PAD } : { text: 'Shaved ice costs $3 🍧', target: null };
    }
    if (this.nearPool(g) >= 0) return { text: 'Peek in the tide pool! ⭐', target: null };
    for (const P of I.COVE.POOLS) if (U.dist(p.x, p.y, P.x, P.y) < 110) return { text: 'Peek in the tide pools! ⭐', target: { x: P.x, y: P.y + P.ry + 14 } };
    if (rt.boats.some((b) => U.dist(p.x, p.y, b.x, b.y) < 70)) return { text: 'Go sailing! ⛵', target: null };
    return null;
  },

  // ======================= render hooks =======================
  // ---- town: the river behind the houses, the dock, the ferry stop
  paintTown(r, g) {
    const ctx = r.ctx, I = CFG.ISLANDS, R = I.RIVER, D = I.TOWN_DOCK;
    // banks: a muddy edge, then water
    ctx.fillStyle = '#9c8b5a'; ctx.fillRect(R.x0, R.y0 - 8, R.x1 - R.x0, R.y1 - R.y0 + 16);
    const wg = ctx.createLinearGradient(0, R.y0, 0, R.y1); wg.addColorStop(0, '#6fc3ec'); wg.addColorStop(1, '#3a8fcc');
    ctx.fillStyle = wg; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 3);
    // ripples and a gentle current
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 140; i++) {
      const x = R.x0 + ((i * 197) % (R.x1 - R.x0)), y = R.y0 + 12 + ((i * 61) % (R.y1 - R.y0 - 24));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 9, y - 4, x + 18, y); ctx.stroke();
    }
    // rocks on the banks
    for (const [x, y, rr] of I.ROCKS) { ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a4acb6'; ctx.beginPath(); ctx.ellipse(x - rr * 0.25, y - rr * 0.2, rr * 0.45, rr * 0.25, 0, 0, Math.PI * 2); ctx.fill(); }
    // reeds in clumps by the north bank
    for (const x of I.REEDS) {
      for (let k = 0; k < 5; k++) {
        const rx = x + k * 6 - 12, h = 22 + (k % 3) * 6, lean = (k - 2) * 2;
        ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, R.y0 + 8); ctx.quadraticCurveTo(rx + lean, R.y0 - h / 2, rx + lean * 2, R.y0 + 8 - h); ctx.stroke();
        if (k % 2) { ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, rx + lean * 2 - 2, R.y0 + 2 - h, 4, 9, 2); ctx.fill(); }
      }
    }
    // lily pads, some with a flower
    for (const [x, y, fl] of I.LILIES) {
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 11, 0.3, Math.PI * 2 - 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(x - 3, y - 3, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
      if (fl) { ctx.fillStyle = '#ff8fab'; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + 1 + Math.cos(a) * 3, y - 2 + Math.sin(a) * 3, 3, 1.8, a, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 1, y - 2, 1.5, 0, Math.PI * 2); ctx.fill(); }
    }
    // the dock: posts in the water, planks on top
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(D.x0 + 5, D.y0 + 6, D.x1 - D.x0, D.y1 - D.y0);
    ctx.fillStyle = '#4a2d12'; for (const [px, py] of [[D.x0 + 4, D.y0 + 40], [D.x1 - 4, D.y0 + 40], [D.x0 + 4, D.y1 - 3], [D.x1 - 4, D.y1 - 3]]) { ctx.beginPath(); ctx.ellipse(px, py + 6, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    this.drawPlanks(ctx, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, false);
    ctx.fillStyle = '#6b4a2b'; for (const [px, py] of [[D.x0 + 4, D.y0 + 40], [D.x1 - 4, D.y0 + 40], [D.x0 + 4, D.y1 - 3], [D.x1 - 4, D.y1 - 3]]) { ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); }
    // mooring cleat and rope to the ferry
    ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x1 - 6, D.y1 - 22); ctx.quadraticCurveTo(D.x1 + 10, D.y1 - 8, I.TOWN_FERRY.x - 54, I.TOWN_FERRY.y + 4); ctx.stroke();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, D.x1 - 12, D.y1 - 26, 10, 6, 2); ctx.fill();
    // ferry stop sign and a bench on the grass
    const S = I.SIGN;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x - 3, S.y - 40, 6, 44);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, S.x - 34, S.y - 62, 68, 26, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛴️ FERRY', S.x, S.y - 49);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, S.x - 28, S.y - 36, 56, 12, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('TO THE ISLANDS', S.x, S.y - 30);
    const B = I.BENCH;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x - 20, B.y - 8, 40, 7); ctx.fillRect(B.x - 20, B.y + 1, 40, 6); ctx.fillStyle = '#4a2d12'; ctx.fillRect(B.x - 16, B.y + 7, 4, 8); ctx.fillRect(B.x + 12, B.y + 7, 4, 8);
    // a little lamp at the end of the dock
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(D.x0 + 10, D.y1 - 36, 3, 26); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(D.x0 + 11.5, D.y1 - 38, 5, 0, Math.PI * 2); ctx.fill();
  },
  drawPlanks(ctx, x, y, w, h, across) {
    ctx.fillStyle = '#b98a55'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    if (across) for (let xx = x; xx < x + w; xx += 12) ctx.fillRect(xx, y, 1.5, h);
    else for (let yy = y; yy < y + h; yy += 12) ctx.fillRect(x, yy, w, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x, y, 3, h); ctx.fillRect(x + w - 3, y, 3, h);
  },

  // ---- the Islands map
  paint: {
    islands(r, g) {
      const ctx = r.ctx, I = CFG.ISLANDS, W = I.WORLD, E = IslandsExt;
      const wg = ctx.createLinearGradient(0, W.y0, 0, W.y1); wg.addColorStop(0, '#5cb8ea'); wg.addColorStop(1, '#3390cf');
      ctx.fillStyle = wg; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
      // wave strokes all over the water
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 420; i++) {
        const x = W.x0 + ((i * 193) % (W.x1 - W.x0)), y = W.y0 + 10 + ((i * 97) % (W.y1 - W.y0 - 20));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 20, y); ctx.stroke();
      }
      // deeper patches
      ctx.fillStyle = 'rgba(30,90,160,0.18)';
      for (const [x, y, rx, ry] of [[2800, 1550, 120, 60], [3900, 2050, 150, 70], [4400, 1900, 90, 50], [3300, 2520, 160, 50]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
      // islands: shallows, sand, grass
      for (const s of I.ISLANDS) E.paintIsland(r, s);
      // the ferry dock and its sign
      const D = I.DOCK;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(D.x0 + 5, D.y0 + 6, D.x1 - D.x0, D.y1 - D.y0);
      E.drawPlanks(ctx, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, false);
      ctx.fillStyle = '#6b4a2b'; for (const [px, py] of [[D.x0 + 4, D.y0 + 4], [D.x1 - 4, D.y0 + 4], [D.x0 + 4, D.y0 + 64], [D.x1 - 4, D.y0 + 64]]) { ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x1 - 6, D.y0 + 40); ctx.quadraticCurveTo(D.x1 + 14, D.y0 + 50, I.FERRY.x - 54, I.FERRY.y + 4); ctx.stroke();
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(D.x0 - 44, D.y1 - 10, 6, 40);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, D.x0 - 74, D.y1 - 32, 66, 26, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛴️ FERRY', D.x0 - 41, D.y1 - 19);
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, D.x0 - 70, D.y1 - 6, 58, 12, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('HOME THIS WAY', D.x0 - 41, D.y1);
      // the pizza stand (or the spot where it will go)
      E.paintStand(r, g);
      // huts, the lighthouse base, the treasure chest, beach bits
      for (const s of I.ISLANDS) {
        if (s.hut) E.paintHut(r, s);
        if (s.chest) E.paintChest(ctx, s.chest.x, s.chest.y);
      }
      // beach bits on the main island: towel + umbrella, a sandcastle, shells and starfish
      ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, 3150, 2240, 46, 28, 4); ctx.fill(); ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) ctx.fillRect(3150, 2246 + k * 8, 46, 3);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(3210, 2210, 3, 40);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#e4572e'; ctx.beginPath(); ctx.moveTo(3211, 2210); ctx.arc(3211, 2210, 30, Math.PI + (k / 6) * Math.PI, Math.PI + ((k + 1) / 6) * Math.PI); ctx.closePath(); ctx.fill(); }
      E.paintSandcastle(ctx, 2840, 2380);
      ctx.fillStyle = '#ff9f43'; for (const [x, y] of [[3240, 2150], [2760, 2230], [4180, 2380], [3700, 2415], [3700, 1740]]) { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 5, 2.2, a, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = '#fff3e0'; for (const [x, y] of [[3200, 2300], [2900, 2410], [3560, 1620], [4350, 2200], [4160, 1660], [3620, 2405]]) { ctx.beginPath(); ctx.ellipse(x, y, 6, 4, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 1, y - 3, 1.5, 6); ctx.fillStyle = '#fff3e0'; }
      // a welcome sign on the main island
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(2817, 2010, 6, 34);
      ctx.fillStyle = '#f2b705'; U.roundRect(ctx, 2760, 1980, 120, 34, 6); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏝️ PIZZA ISLAND', 2820, 1992); ctx.font = r.font(8); ctx.fillText('jet ski at the beach →', 2820, 2006);
      // the way south: sandbar, rope bridges, the marina pier; then what is on Sunny Beach and Starfish Cove
      for (const L of I.LINKS) E.paintLink(r, L);
      E.paintSunny(r, g);
      E.paintBeachHut(r);
      E.paintCove(r, g);
      E.signpost(r, 2928, 2408, '🏖️ SUNNY BEACH', 'walk across the sand ↓');
      E.signpost(r, 3226, 2694, '⭐ STARFISH COVE', 'over the bridge →');
      E.signpost(r, 3655, 2694, '🚀 ROCKET ISLAND', 'over the bridge →');
    },
  },
  signpost(r, x, y, title, sub) {
    const ctx = r.ctx; ctx.font = r.font(10); const w = Math.max(ctx.measureText(title).width, 70) + 18;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 2, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 3, y - 30, 6, 32);
    ctx.fillStyle = '#f2b705'; U.roundRect(ctx, x - w / 2, y - 58, w, 32, 6); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(title, x, y - 48); ctx.font = r.font(7); ctx.fillText(sub, x, y - 35);
  },
  // the sandbar (wet sand with puddles), a rope bridge (planks, posts and sagging ropes) or the marina pier
  paintLink(r, L) {
    const ctx = r.ctx, w = L.x1 - L.x0, h = L.y1 - L.y0;
    if (L.kind === 'sand') {
      ctx.fillStyle = '#c6ecf8'; U.roundRect(ctx, L.x0 - 18, L.y0, w + 36, h, 22); ctx.fill();
      ctx.fillStyle = '#e8cf8f'; U.roundRect(ctx, L.x0 - 6, L.y0, w + 12, h, 18); ctx.fill();
      ctx.fillStyle = '#f2dea2'; U.roundRect(ctx, L.x0 + 2, L.y0, w - 4, h, 14); ctx.fill();
      ctx.fillStyle = 'rgba(111,195,236,0.55)'; for (const [dx, dy, rx] of [[12, 40, 9], [50, 76, 7], [20, 120, 11], [56, 150, 6]]) { ctx.beginPath(); ctx.ellipse(L.x0 + dx, L.y0 + dy, rx, rx * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 7; k++) { const fy = L.y0 + 22 + k * 22, fx = L.x0 + w / 2 + (k % 2 ? 7 : -7); ctx.beginPath(); ctx.ellipse(fx, fy, 3, 5, 0, 0, Math.PI * 2); ctx.fill(); }   // footprints
      ctx.fillStyle = '#ff9f43'; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(L.x0 + 14 + Math.cos(a) * 4, L.y0 + 98 + Math.sin(a) * 4, 5, 2.2, a, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    if (L.kind === 'pier') {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(L.x0 + 5, L.y0 + 6, w, h);
      this.drawPlanks(ctx, L.x0, L.y0, w, h, false);
      ctx.fillStyle = '#6b4a2b'; for (let y = L.y0 + 30; y < L.y1 - 10; y += 46) for (const x of [L.x0 + 4, L.x1 - 4]) { ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#5c6670'; for (const [x, y] of [[L.x0 + 2, L.y0 + 86], [L.x1 - 12, L.y0 + 104]]) { U.roundRect(ctx, x, y, 10, 6, 2); ctx.fill(); }   // cleats for the boats' ropes
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, L.x0 - 6, L.y1 - 46, w + 12, 16, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛵ MARINA', (L.x0 + L.x1) / 2, L.y1 - 38);
      return;
    }
    // a rope bridge running east-west: shadow on the water, planks across, a post at each end and rope rails
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(L.x0 + 4, L.y0 + 10, w, h);
    ctx.fillStyle = '#b98a55'; ctx.fillRect(L.x0, L.y0 + 6, w, h - 12);
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let x = L.x0; x < L.x1; x += 11) ctx.fillRect(x, L.y0 + 6, 2, h - 12);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(L.x0, L.y0 + 6, w, 2);
    for (const ry of [L.y0 + 4, L.y1 - 4]) {
      ctx.strokeStyle = '#d9b27c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.x0, ry); ctx.quadraticCurveTo((L.x0 + L.x1) / 2, ry + 7, L.x1, ry); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L.x0, ry + 2); ctx.quadraticCurveTo((L.x0 + L.x1) / 2, ry + 9, L.x1, ry + 2); ctx.stroke();
      ctx.fillStyle = '#6b4a2b'; for (const px of [L.x0 + 4, L.x0 + w / 3, L.x0 + (2 * w) / 3, L.x1 - 4]) { ctx.beginPath(); ctx.arc(px, ry + (px === L.x0 + 4 || px === L.x1 - 4 ? 0 : 5), 4.5, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  // Sunny Beach: court lines, the net's shadow, beach towels and umbrellas, a sandcastle, the kiosk's back and roof
  paintSunny(r, g) {
    const ctx = r.ctx, SU = CFG.ISLANDS.SUNNY, C = SU.COURT, N = SU.NET, K = SU.KIOSK;
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0);
    ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 4; ctx.strokeRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(N.x - 2, N.y0 + 6, 18, N.y1 - N.y0 - 8);   // the net's shadow
    for (const [x, y, col] of SU.TOWELS) { ctx.fillStyle = col; U.roundRect(ctx, x - 22, y - 13, 44, 26, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 22, y - 8 + k * 8, 44, 2.5); }
    for (const [x, y, col] of SU.UMBRELLAS) {
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(x + 12, y + 30, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 1.5, y - 10, 3, 40);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff' : col; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.arc(x, y - 10, 28, Math.PI + (k / 6) * Math.PI, Math.PI + ((k + 1) / 6) * Math.PI); ctx.closePath(); ctx.fill(); }
    }
    this.paintSandcastle(ctx, SU.CASTLE.x, SU.CASTLE.y);
    ctx.fillStyle = '#fff3e0'; for (const [x, y] of [[2760, 2650], [3000, 2700], [3210, 2760], [2820, 2860], [3080, 2880]]) { ctx.beginPath(); ctx.ellipse(x, y, 6, 4, 0.4, 0, Math.PI * 2); ctx.fill(); }
    // the kiosk: thatched roof behind the counter (the counter and the seller are drawn live), a big sign
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, K.x - K.w / 2 + 4, K.y - 66, K.w, 92, 12); ctx.fill();
    ctx.fillStyle = '#8fd6f2'; ctx.fillRect(K.x - K.w / 2 + 6, K.y - 46, K.w - 12, 40);   // the back wall, sky blue
    ctx.fillStyle = '#d9b55a'; U.roundRect(ctx, K.x - K.w / 2 - 4, K.y - 74, K.w + 8, 34, 12); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = K.y - 68; y < K.y - 44; y += 7) ctx.fillRect(K.x - K.w / 2, y, K.w, 2);
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#ff8fab'; const x = K.x - K.w / 2 - 4 + i * (K.w + 8) / 10; ctx.fillRect(x, K.y - 44, (K.w + 8) / 10, 8); ctx.beginPath(); ctx.arc(x + (K.w + 8) / 20, K.y - 36, (K.w + 8) / 20, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, K.x - 50, K.y - 96, 100, 20, 6); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍧 SHAVED ICE', K.x, K.y - 86);
  },
  // Sunny Beach's beach hut: a bamboo bungalow on short stilts with a shaggy palm-thatch roof, its back over the shallows,
  // a porch with two steps down to the sand, shuttered windows, a flower garland over the door and a surfboard
  paintBeachHut(r) {
    const ctx = r.ctx, H = CFG.ISLANDS.BEACHHUT, x = H.x, y = H.y;
    // stilts in the water at the back corners, with ripples, and the hut's shadow
    for (const dx of [-58, 58]) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + dx, y - 92, 10, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + dx - 4, y - 104, 8, 14); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, x - 60, y - 100, 132, 112, 16); ctx.fill();
    // the porch: planks on posts, two steps in the middle
    ctx.fillStyle = '#6b4a2b'; for (const dx of [-54, -20, 20, 54]) ctx.fillRect(x + dx - 3, y - 2, 6, 10);
    ctx.fillStyle = '#b98a55'; ctx.fillRect(x - 60, y - 14, 120, 14); ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let xx = x - 60; xx < x + 60; xx += 12) ctx.fillRect(xx, y - 14, 1.5, 14);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 60, y - 2, 120, 3);
    ctx.fillStyle = '#c99a62'; ctx.fillRect(x - 16, y, 32, 6); ctx.fillStyle = '#d9b27c'; ctx.fillRect(x - 16, y + 6, 32, 6); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 16, y + 5, 32, 1.5);
    // the bamboo front wall
    for (let xx = x - 50, i = 0; xx < x + 50; xx += 8, i++) { ctx.fillStyle = i % 2 ? '#c9a24a' : '#dcb95e'; ctx.fillRect(xx, y - 58, 8, 44); ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(xx, y - 44 + (i % 2) * 6, 8, 2); ctx.fillRect(xx + 7, y - 58, 1, 44); }
    // shuttered windows with the sea-blue inside, and the door with a shell knob and a flower garland
    for (const dx of [-36, 36]) {
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x + dx - 11, y - 50, 22, 18); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x + dx - 8, y - 47, 16, 12);
      ctx.fillStyle = '#41b883'; ctx.fillRect(x + dx - 18, y - 51, 7, 20); ctx.fillRect(x + dx + 11, y - 51, 7, 20);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 4; k++) { ctx.fillRect(x + dx - 18, y - 48 + k * 5, 7, 1.5); ctx.fillRect(x + dx + 11, y - 48 + k * 5, 7, 1.5); }
    }
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 11, y - 50, 22, 36, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 11, y - 46 + k * 7, 22, 2);
    ctx.fillStyle = '#ff9fb6'; ctx.beginPath(); ctx.arc(x + 6, y - 31, 2.5, 0, Math.PI * 2); ctx.fill();
    ['#ff8fab', '#ffd166', '#fff', '#ff8fab', '#e4572e', '#ffd166', '#fff'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x - 15 + k * 5, y - 53 + Math.sin((k / 6) * Math.PI) * 4, 3, 0, Math.PI * 2); ctx.fill(); });
    // the roof: a big rounded thatch with a shaggy fringe, palm fronds laid over the ridge, a little sign
    ctx.fillStyle = '#b8923f'; U.roundRect(ctx, x - 70, y - 118, 140, 66, 22); ctx.fill();
    ctx.fillStyle = '#d9b55a'; U.roundRect(ctx, x - 66, y - 122, 132, 60, 20); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let yy = y - 112; yy < y - 66; yy += 9) ctx.fillRect(x - 62, yy, 124, 2);
    for (let i = 0; i < 18; i++) { const fx = x - 68 + i * 8; ctx.fillStyle = i % 2 ? '#c9a24a' : '#b8923f'; ctx.beginPath(); ctx.moveTo(fx, y - 64); ctx.lineTo(fx + 8, y - 64); ctx.lineTo(fx + 4, y - 52 - (i % 3) * 2); ctx.closePath(); ctx.fill(); }
    for (const [dx, dy, ang, c] of [[-34, -104, -0.5, '#56b862'], [-10, -112, -0.1, '#3f9a4a'], [18, -108, 0.3, '#56b862'], [42, -100, 0.6, '#3f9a4a'], [0, -96, 0.05, '#41b883']]) {
      ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(ang); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = '#6b4a2b'; for (const [dx, dy] of [[-4, -118], [5, -116]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 4.5, 0, Math.PI * 2); ctx.fill(); }   // two coconuts on the ridge
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 38, y - 80, 76, 15, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌴 BEACH HUT', x, y - 72);
    // a surfboard against the wall and a starfish on the porch
    ctx.save(); ctx.translate(x + 62, y - 30); ctx.rotate(0.12); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-6, -2, 12, 4); ctx.restore();
    this.drawStar(ctx, x - 44, y - 7, 5, '#ff9f43');
  },
  // the kiosk's counter front with the syrup bottles, drawn over the seller's legs
  drawKioskFront(r, g) {
    const ctx = r.ctx, K = CFG.ISLANDS.SUNNY.KIOSK;
    ctx.fillStyle = '#8a5527'; U.roundRect(ctx, K.x - K.w / 2, K.y - 10, K.w, 32, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = K.x - K.w / 2 + 8; x < K.x + K.w / 2; x += 14) ctx.fillRect(x, K.y - 4, 2, 24);
    ctx.fillStyle = '#d9b27c'; U.roundRect(ctx, K.x - K.w / 2 - 2, K.y - 16, K.w + 4, 12, 5); ctx.fill();
    ['#e4572e', '#3b7dd8', '#ffd166', '#41b883'].forEach((col, i) => { const x = K.x - 44 + i * 12; ctx.fillStyle = col; U.roundRect(ctx, x, K.y - 32, 8, 18, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, K.y - 37, 4, 6); });
    // an ice block and a few cones on the counter
    ctx.fillStyle = '#e3f6ff'; U.roundRect(ctx, K.x + 14, K.y - 30, 22, 16, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(K.x + 17, K.y - 28, 6, 3);
    for (let k = 0; k < 2; k++) this.drawSnowcone(ctx, K.x + 46 + k * 10, K.y - 18, ['#e4572e', '#3b7dd8'][k], 0.7);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, K.x - 22, K.y + 2, 44, 14, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$3 🍧', K.x, K.y + 9);
  },
  drawSnowcone(ctx, x, y, col, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -4); ctx.lineTo(3, 10); ctx.lineTo(-3, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(6, -4); ctx.lineTo(3, 10); ctx.lineTo(-3, 10); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -6, 7, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(-3, -7, 3.5, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(3.5, -7, 3, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-1, -10, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // Starfish Cove: boulders, the tide pools with starfish and anemones (fish swim in them live)
  paintCove(r, g) {
    const ctx = r.ctx, C = CFG.ISLANDS.COVE;
    for (const [x, y, rr] of [[3420, 2740, 14], [3690, 2800, 12], [3560, 2610, 10], [3530, 2870, 11]]) { ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa2ad'; ctx.beginPath(); ctx.ellipse(x - rr * 0.25, y - rr * 0.2, rr * 0.5, rr * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    C.POOLS.forEach((P, i) => {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(P.x + 3, P.y + 4, P.rx + 10, P.ry + 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d949e'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx + 9, P.ry + 7, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; ctx.fillStyle = k % 2 ? '#7d8591' : '#a4acb6'; ctx.beginPath(); ctx.ellipse(P.x + Math.cos(a) * (P.rx + 5), P.y + Math.sin(a) * (P.ry + 4), 7, 4.5, a, 0, Math.PI * 2); ctx.fill(); }
      const wg = ctx.createRadialGradient(P.x - P.rx * 0.3, P.y - P.ry * 0.3, 2, P.x, P.y, P.rx); wg.addColorStop(0, '#9fe6f0'); wg.addColorStop(1, '#2fa3b8');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, Math.PI * 2); ctx.fill();
      // seaweed, anemones and a starfish on the bottom
      ctx.strokeStyle = '#2e8b57'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const sx = P.x - P.rx * 0.6 + k * 9; ctx.beginPath(); ctx.moveTo(sx, P.y + P.ry * 0.6); ctx.quadraticCurveTo(sx + 5, P.y + 2, sx - 2, P.y - 4); ctx.stroke(); }
      ctx.fillStyle = '#ff8fab'; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(P.x + P.rx * 0.45 + k * 8, P.y + P.ry * 0.35 - k * 5, 3.5, 0, Math.PI * 2); ctx.fill(); }
      this.drawStar(ctx, P.x + P.rx * 0.15, P.y - P.ry * 0.2, 7, ['#ff9f43', '#e4572e', '#ffd166'][i % 3]);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(P.x - P.rx * 0.4, P.y - P.ry * 0.45, P.rx * 0.3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    });
    // starfish on the sand too
    for (const [x, y, col] of [[3440, 2700, '#ff9f43'], [3650, 2770, '#e4572e'], [3540, 2860, '#ffd166']]) this.drawStar(ctx, x, y, 6, col);
  },
  drawStar(ctx, x, y, rr, col) {
    ctx.fillStyle = col; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2, d = k % 2 ? rr * 0.45 : rr; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x, y, rr * 0.18, 0, Math.PI * 2); ctx.fill();
  },
  paintIsland(r, s) {
    const ctx = r.ctx, w = s.x1 - s.x0, h = s.y1 - s.y0, rad = Math.min(56, w / 2.4, h / 2.4);
    ctx.fillStyle = '#8fd6f2'; U.roundRect(ctx, s.x0 - 30, s.y0 - 30, w + 60, h + 60, rad + 30); ctx.fill();
    ctx.fillStyle = '#c6ecf8'; U.roundRect(ctx, s.x0 - 12, s.y0 - 12, w + 24, h + 24, rad + 12); ctx.fill();
    if (s.rock) {
      ctx.fillStyle = '#7d8591'; U.roundRect(ctx, s.x0, s.y0, w, h, rad); ctx.fill();
      ctx.fillStyle = '#9aa2ad'; U.roundRect(ctx, s.x0 + 14, s.y0 + 10, w - 36, h - 34, rad * 0.7); ctx.fill();
      ctx.fillStyle = '#6b7380'; ctx.beginPath(); ctx.ellipse(s.x0 + w * 0.65, s.y0 + h * 0.6, 18, 10, 0.3, 0, Math.PI * 2); ctx.fill();
      // a turtle sunbathing
      const tx = s.x0 + w * 0.4, ty = s.y0 + h * 0.5;
      ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(tx, ty, 14, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(tx + 16, ty, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.ellipse(tx, ty, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(tx + 18, ty - 2, 1.2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = '#e8cf8f'; U.roundRect(ctx, s.x0 - 2, s.y0 - 2, w + 4, h + 4, rad); ctx.fill();   // wet sand edge
    ctx.fillStyle = '#f6e4ad'; U.roundRect(ctx, s.x0, s.y0, w, h, rad); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < w * h / 900; i++) { const x = s.x0 + 8 + ((i * 193) % (w - 16)), y = s.y0 + 8 + ((i * 101) % (h - 16)); ctx.beginPath(); ctx.ellipse(x, y, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill(); }
    if (w > 200 && h > 160 && !s.sand) {
      const gx = s.x0 + 40, gy = s.y0 + 40, gw = w - 80, gh = h - 80;
      ctx.fillStyle = '#79b85e'; U.roundRect(ctx, gx, gy, gw, gh, rad * 0.8); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let i = 0; i < gw * gh / 1400; i++) { const x = gx + 6 + ((i * 193) % (gw - 12)), y = gy + 6 + ((i * 101) % (gh - 12)); ctx.beginPath(); ctx.ellipse(x, y, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
      // a few bushes and flowers
      ctx.fillStyle = '#56b862'; for (let k = 0; k < 4; k++) { const x = gx + 20 + ((k * 173) % (gw - 40)), y = gy + 20 + ((k * 89) % (gh - 40)); ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.arc(x + 9, y + 3, 7, 0, Math.PI * 2); ctx.fill(); }
      for (let k = 0; k < 7; k++) { const x = gx + 30 + ((k * 211) % (gw - 60)), y = gy + 30 + ((k * 131) % (gh - 60)); ctx.fillStyle = k % 2 ? '#ff8fab' : '#ffe08a'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    // a couple of rocks at the water's edge
    ctx.fillStyle = '#9aa2ad'; ctx.beginPath(); ctx.ellipse(s.x0 + 18, s.y1 - 16, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(s.x1 - 22, s.y0 + 18, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
  },
  paintHut(r, s) {
    const ctx = r.ctx, hx = s.hut.x, hy = s.hut.y;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, hx - 48, hy - 36, 100, 84, 12); ctx.fill();
    // front wall with the door and windows (the door faces the water)
    ctx.fillStyle = s.key === 'crab' ? '#c96a3f' : s.key === 'lighthouse' ? '#f5f5f5' : '#c9975f';
    ctx.fillRect(hx - 42, hy + 4, 84, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = hy + 8; y < hy + 42; y += 7) ctx.fillRect(hx - 42, y, 84, 1.5);
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, hx - 10, hy + 14, 20, 28, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(hx + 6, hy + 29, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(hx - 36, hy + 12, 16, 14); ctx.fillRect(hx + 20, hy + 12, 16, 14);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(hx - 36, hy + 12, 16, 14); ctx.strokeRect(hx + 20, hy + 12, 16, 14);
    // thatched roof seen from above
    ctx.fillStyle = s.key === 'crab' ? '#b23a48' : '#d9b55a'; U.roundRect(ctx, hx - 52, hy - 42, 104, 54, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = hy - 36; y < hy + 8; y += 8) ctx.fillRect(hx - 50, y, 100, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; U.roundRect(ctx, hx - 48, hy - 38, 96, 8, 4); ctx.fill();
    ctx.fillStyle = s.key === 'crab' ? '#8e1c1c' : '#b8923f'; U.roundRect(ctx, hx - 6, hy - 46, 12, 62, 4); ctx.fill();   // ridge
    if (s.key === 'crab') { ctx.fillStyle = '#ff6b6b'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🦀', hx + 30, hy - 20); }
    if (s.key === 'coconut') { ctx.fillStyle = '#6b4a2b'; for (const [dx, dy] of [[-30, -22], [-22, -14], [30, -24]]) { ctx.beginPath(); ctx.arc(hx + dx, hy + dy, 5, 0, Math.PI * 2); ctx.fill(); } }
    // name plate under the door, like the town houses
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, hx - 44, hy + 46, 88, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.name.toUpperCase(), hx, hy + 53);
    // a doormat / path down to the beach
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(hx - 12, hy + 42, 24, 30);
  },
  paintStand(r, g) {
    const ctx = r.ctx, S = CFG.ISLANDS.STAND, sx = S.x, sy = S.y, O = S.oven;
    if (!g.s.islands.standOwned) {
      // a dashed outline shows where the stand will go, with a little sign
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); U.roundRect(ctx, sx - 60, sy - 50, 120, 70, 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; U.roundRect(ctx, sx - 60, sy - 50, 120, 70, 12); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(sx - 3, sy - 70, 6, 30);
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, sx - 40, sy - 92, 80, 26, 4); ctx.fill(); ctx.strokeStyle = '#b23a48'; ctx.lineWidth = 2; U.roundRect(ctx, sx - 40, sy - 92, 80, 26, 4); ctx.stroke();
      ctx.fillStyle = '#b23a48'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FOR SALE', sx, sy - 79);
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, sx - 56, sy - 42, 120, 72, 12); ctx.fill();
    // counter at the front, thatched roof behind, striped awning between
    ctx.fillStyle = '#8a5527'; U.roundRect(ctx, sx - 56, sy + 2, 112, 22, 6); ctx.fill();
    ctx.fillStyle = '#d9b27c'; U.roundRect(ctx, sx - 56, sy - 4, 112, 16, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = sx - 50; x < sx + 54; x += 14) ctx.fillRect(x, sy - 4, 1.5, 16);
    ctx.fillStyle = '#d9b55a'; U.roundRect(ctx, sx - 60, sy - 50, 120, 50, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = sy - 44; y < sy - 4; y += 8) ctx.fillRect(sx - 58, y, 116, 2);
    ctx.fillStyle = '#b8923f'; U.roundRect(ctx, sx - 6, sy - 54, 12, 54, 4); ctx.fill();
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e4572e'; ctx.fillRect(sx - 60 + i * 12, sy - 8, 12, 10); ctx.beginPath(); ctx.arc(sx - 54 + i * 12, sy + 2, 6, 0, Math.PI); ctx.fill(); }
    // menu board and a big sign
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, sx - 50, sy - 78, 100, 20, 6); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 ISLAND PIZZA', sx, sy - 68);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, sx + 30, sy + 4, 22, 16, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.fillText('MENU', sx + 41, sy + 12);
    // stone oven with a glowing mouth, and a little table for the pile
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(O.x + 3, O.y + 10, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d8d8d'; ctx.beginPath(); ctx.ellipse(O.x, O.y - 4, 24, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(O.x - 24, O.y - 4, 48, 16);
    ctx.fillStyle = '#a9a9a9'; for (const [dx, dy] of [[-12, -14], [4, -18], [14, -8], [-16, 0], [8, 2], [-2, -6]]) { ctx.beginPath(); ctx.ellipse(O.x + dx, O.y + dy, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(O.x, O.y + 6, 10, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.arc(O.x, O.y + 6, 6, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#5c5c5c'; ctx.fillRect(O.x + 10, O.y - 34, 8, 16);
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, S.pile.x - 22, S.pile.y - 6, 44, 14, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, S.pile.x - 22, S.pile.y - 10, 44, 10, 4); ctx.fill();
  },
  paintChest(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 8, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 14, y - 8, 28, 16, 3); ctx.fill();
    ctx.fillStyle = '#a66a2c'; U.roundRect(ctx, x - 14, y - 16, 28, 10, 5); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.fillRect(x - 14, y - 7, 28, 3); ctx.fillRect(x - 3, y - 16, 6, 24); ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 2, y - 4, 4, 4);
  },
  paintSandcastle(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 6, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3c57f'; ctx.fillRect(x - 22, y - 14, 44, 20);
    for (const dx of [-20, 10]) { ctx.fillRect(x + dx, y - 30, 10, 18); for (let k = 0; k < 2; k++) ctx.fillRect(x + dx + k * 6, y - 35, 4, 6); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 4, y - 6, 8, 12, 3); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 15, y - 46, 1.5, 16); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 14, y - 46); ctx.lineTo(x - 5, y - 43); ctx.lineTo(x - 14, y - 40); ctx.closePath(); ctx.fill();
  },

  // ---- things that move, under the people
  dynamic(r, g) {
    const ctx = r.ctx, I = CFG.ISLANDS, t = g.time;
    if (g.area === 'town') {
      this.drawFerryTop(r, g, I.TOWN_FERRY.x, I.TOWN_FERRY.y, -1, 0);
      // pizzas waiting in a crate on the dock
      const C = I.TOWN_CRATE, n = g.s.islands.dockPizzas;
      ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x - 14, C.y - 12, 28, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x - 14, C.y - 4, 28, 2); ctx.fillRect(C.x - 14, C.y + 1, 28, 2);
      if (n > 0) { r.drawPizzaStack(C.x, C.y - 14, n); r.drawCountBadge(C.x + 20, C.y - 24 - Math.min(n, 30) * 4, n, 99); }
      // a duck paddling along the river
      const dx = 600 + Math.sin(t * 0.12) * 260, dy = 1250 + Math.cos(t * 0.3) * 14, df = Math.cos(t * 0.12) < 0 ? -1 : 1;
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(dx, dy + 4, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.ellipse(dx, dy, 9, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(dx + df * 7, dy - 6, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(dx + (df < 0 ? -14 : 10), dy - 7, 4.5, 2.5);
      return;
    }
    if (g.area !== 'islands' || !this.rt) return;
    const rt = this.rt;
    // moving sparkles on the water, only the ones on screen
    const x0 = r.camX - 20, x1 = r.camX + r.viewW + 20, y0 = r.camY - 20, y1 = r.camY + r.viewH + 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const x = I.WORLD.x0 + ((i * 331) % 2000), y = I.WORLD.y0 + ((i * 173) % 1200);
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const k = (Math.sin(t * 1.5 + i) + 1) / 2; if (k < 0.3) continue;
      ctx.globalAlpha = (k - 0.3) / 0.7; ctx.beginPath(); ctx.moveTo(x - 6 * k, y); ctx.lineTo(x + 6 * k, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the jet ski's wake
    for (const w of rt.wake) { const k = w.t / 1.1; ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - k)})`; ctx.beginPath(); ctx.arc(w.x, w.y, (w.big ? 6 : 4) + k * (w.big ? 16 : 11), 0, Math.PI * 2); ctx.fill(); }
    this.drawFerryTop(r, g, I.FERRY.x, I.FERRY.y, 1, 1.3);
    // buoy bobbing
    const B = I.BUOY, bob = Math.sin(t * 2) * 2, tilt = Math.sin(t * 1.4) * 0.12;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(B.x, B.y + 6, 16 + bob, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.save(); ctx.translate(B.x, B.y + bob); ctx.rotate(tilt);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-11, -2, 22, 3);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(-4, -24, 8, 22); ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffe08a' : '#f2b134'; ctx.beginPath(); ctx.arc(0, -26, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    this.drawCoveLive(r, g);
    this.drawCruiser(r, g);
    // the volleyball's shadow on the sand
    { const b = this.ballPos(g); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 7 - Math.min(4, b.h / 50), 3, 0, 0, Math.PI * 2); ctx.fill(); }
    // the dolphin's jump
    const d = rt.dolphin;
    if (d.t >= 0 && d.t <= 1.6) this.drawDolphin(ctx, d, t);
    // crabs on the beaches
    for (const c of rt.crabs) this.drawCrab(ctx, c);
    // the stand's pile of pizzas and the oven's smoke
    if (g.s.islands.standOwned) {
      const P = I.STAND.pile, O = I.STAND.oven, n = g.s.islands.pile;
      for (let i = 0; i < 3; i++) { const age = ((t * 0.6 + i * 0.33) % 1); ctx.fillStyle = `rgba(230,230,230,${0.5 * (1 - age)})`; ctx.beginPath(); ctx.arc(O.x + 14 + age * 8, O.y - 36 - age * 26, 3 + age * 7, 0, Math.PI * 2); ctx.fill(); }
      if (n > 0) { for (let i = 0; i < n; i++) { ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(P.x, P.y - 12 - i * 4 + 2, 11, 0, Math.PI * 2); ctx.fill(); r.drawPizza(P.x, P.y - 12 - i * 4, 11); } r.drawCountBadge(P.x + 18, P.y - 22 - n * 4, n, I.PILE_MAX); }
      else { const k = rt.bakeT / I.BAKE; r.drawProgressBar(P.x, P.y - 18, 36, k, '#f2b134'); }
    }
    // hut order bubbles
    for (const h of rt.huts) {
      const hy = h.hut.y - 48;
      if (h.order) {
        const left = h.order.want - h.order.have, bb = Math.sin(t * 4) * 3;
        r.drawBubble(h.hut.x, hy - 10 + bb, () => { r.drawPizza(-10, 0, 8); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(13); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('×' + left, 2, 1); }, 46);
        r.drawProgressBar(h.hut.x, hy + 8 + bb, 40, h.order.t / I.ORDER_WAIT, '#f2b134');
      } else if (h.happy > 0) {
        r.drawBubble(h.hut.x, hy - 10, () => { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('😋', 0, 0); }, 30);
      }
    }
  },
  // a beach player: shorts and a tank top, arms up when they hit the ball
  drawPlayerVB(r, g, w, i) {
    const ctx = r.ctx, vb = this.rt.vb, hit = vb.hitT[i] > 0, cheer = i === 0 && vb.chef;
    r.drawPerson(w.x, w.y, { shirt: i ? '#ff8fab' : '#ffd166', skin: i ? '#8d5524' : '#f1c27d', hair: i ? '#2b1d14' : '#e0b44c', hairStyle: i ? 2 : 1, facing: w.facing, moving: w.bob > 0, bob: w.bob, carry: 0, pants: i ? '#3b7dd8' : '#41b883' });
    if (hit || cheer) {
      const up = cheer ? Math.abs(Math.sin(g.time * 6)) * 6 : 0;
      ctx.fillStyle = i ? '#8d5524' : '#f1c27d';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(w.x + d * 9, w.y - 52 - up, 4, 0, Math.PI * 2); ctx.fill(); }
      if (cheer && Math.sin(g.time * 3) > 0.6) { ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Go chef!', w.x, w.y - 70); }
    }
  },
  // the net seen from the front-ish: two poles and a mesh band between their tops
  drawNet(r, g) {
    const ctx = r.ctx, N = CFG.ISLANDS.SUNNY.NET, H = 34;
    ctx.fillStyle = '#5c6670'; for (const y of [N.y0, N.y1]) { ctx.fillRect(N.x - 2.5, y - H - 6, 5, H + 6); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(N.x, y, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5c6670'; }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(N.x - 2, N.y0 - H, 4, N.y1 - N.y0);
    ctx.strokeStyle = 'rgba(43,29,20,0.55)'; ctx.lineWidth = 1;
    for (let y = N.y0 - H; y < N.y1 - H; y += 6) { ctx.beginPath(); ctx.moveTo(N.x - 3, y); ctx.lineTo(N.x + 3, y + 6); ctx.moveTo(N.x + 3, y); ctx.lineTo(N.x - 3, y + 6); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.fillRect(N.x - 3, N.y0 - H - 2, 6, 3); ctx.fillRect(N.x - 3, N.y1 - H - 2, 6, 3);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(N.x, N.y0 - H); ctx.lineTo(N.x, N.y1 - H); ctx.stroke();
  },
  // a sailboat seen from above with its sail standing up: angle is the heading
  drawSailboat(r, g, x, y, angle, B, phase) {
    const ctx = r.ctx, t = g.time + phase, bob = Math.sin(t * 1.7) * 1.5;
    this.drawHull(ctx, x, y, angle, B, bob);
    // the mast and sail stand up off the deck, flapping a little
    const mx = x + Math.cos(angle) * 6, my = y + bob + Math.sin(angle) * 6, sw = Math.sin(t * 2.3) * 3;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(mx - 1.5, my - 62, 3, 62);
    ctx.fillStyle = B.sail; ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx + 2, my - 60); ctx.quadraticCurveTo(mx + 22 + sw, my - 32, mx + 28, my - 6); ctx.lineTo(mx + 2, my - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx - 2, my - 50); ctx.quadraticCurveTo(mx - 14 + sw * 0.5, my - 30, mx - 16, my - 10); ctx.lineTo(mx - 2, my - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = B.flag; ctx.beginPath(); ctx.moveTo(mx, my - 62); ctx.lineTo(mx + 12, my - 59 + sw * 0.5); ctx.lineTo(mx, my - 56); ctx.closePath(); ctx.fill();
  },
  // the hull seen from above: foam, shadow, painted hull, wooden deck and a little white hatch at the stern
  drawHull(ctx, x, y, angle, B, bob) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(3, 4, 34, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = B.hull; ctx.beginPath(); ctx.moveTo(36, 0); ctx.quadraticCurveTo(22, -13, -6, -12); ctx.lineTo(-30, -10); ctx.quadraticCurveTo(-34, 0, -30, 10); ctx.lineTo(-6, 12); ctx.quadraticCurveTo(22, 13, 36, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9b27c'; ctx.beginPath(); ctx.moveTo(28, 0); ctx.quadraticCurveTo(18, -9, -4, -8); ctx.lineTo(-26, -7); ctx.quadraticCurveTo(-29, 0, -26, 7); ctx.lineTo(-4, 8); ctx.quadraticCurveTo(18, 9, 28, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = -20; k < 24; k += 7) ctx.fillRect(k, -7, 1.5, 14);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, -24, -5, 12, 10, 3); ctx.fill();
    ctx.restore();
  },
  // A rideable sailboat (moored or sailing). The mainsail hangs from the mast along a boom that swings out to one side;
  // it billows as the boat speeds up (b.fill) and the mast heels over in a turn (b.lean). The chef stands at the tiller.
  drawBoat(r, g, b, phase) {
    const ctx = r.ctx, t = g.time + phase, B = b.B, a = b.angle, ca = Math.cos(a), sa = Math.sin(a);
    const riding = g.driving && g.vehicle === b, bob = Math.sin(t * (riding ? 3 : 1.7)) * (riding ? 2 : 1.5);
    this.drawHull(ctx, b.x, b.y, a, B, bob);
    const mx = b.x + ca * 6, my = b.y + bob + sa * 6, heel = b.lean * 16, top = { x: mx + heel, y: my - 64 };
    // the boom swings out to one side; slack sails flap a little
    const flap = (1 - b.fill) * Math.sin(t * 5) * 0.12, ba = a + Math.PI + b.side * (0.7 + 0.2 * (1 - b.fill)) + flap;
    const foot = { x: mx, y: my - 8 }, clew = { x: mx + Math.cos(ba) * 36 + heel * 0.3, y: my + Math.sin(ba) * 36 - 10 };
    const bow = { x: b.x + ca * 34, y: b.y + bob + sa * 34 - 4 }, jibTop = { x: mx + heel * 0.85, y: my - 52 };
    const jibClew = { x: mx + Math.cos(ba) * 12 + ca * 8, y: my + Math.sin(ba) * 12 + sa * 8 - 8 };
    // a sail: a triangle whose free edge bellies out away from the luff by `belly`
    const sail = (p0, p1, p2, belly, col) => {
      const mxp = (p1.x + p2.x) / 2, myp = (p1.y + p2.y) / 2, dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
      let nx = dy / len, ny = -dx / len; if ((mxp - p0.x) * nx + (myp - p0.y) * ny < 0) { nx = -nx; ny = -ny; }
      ctx.fillStyle = col; ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.quadraticCurveTo(mxp + nx * belly, myp + ny * belly, p2.x, p2.y); ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    const stern = { x: b.x - ca * 18, y: b.y + bob - sa * 18 };
    const chef = () => {
      if (!riding) return;
      ctx.save(); ctx.translate(stern.x, stern.y); ctx.scale(0.64, 0.64);
      r.drawPerson(0, 0, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: ca < -0.2 ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
      ctx.restore();
    };
    if (stern.y < my) chef();
    const rig = () => {
      ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(top.x, top.y); ctx.stroke();                    // mast
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(foot.x, foot.y); ctx.lineTo(clew.x, clew.y); ctx.stroke();   // boom
      ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bow.x, bow.y); ctx.stroke();   // forestay
    };
    const main = () => sail(foot, top, clew, 3 + b.fill * 13, B.sail);
    const jib = () => sail(jibClew, jibTop, bow, 2 + b.fill * 8, B.sail);
    // whichever sail is further away is drawn first
    if (sa > 0) { rig(); main(); jib(); } else { jib(); rig(); main(); }
    ctx.lineCap = 'butt';
    // a stripe on the mainsail and the flag at the masthead, streaming back
    ctx.fillStyle = B.flag; const fw = Math.sin(t * 7) * 2;
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(top.x - ca * 13 + 2, top.y + 3 + fw); ctx.lineTo(top.x, top.y + 6); ctx.closePath(); ctx.fill();
    if (stern.y >= my) chef();
    r.drawRidingExtras(g, b, 30);
  },
  // a sailboat cruising round the open water up north, with a little wake
  drawCruiser(r, g) {
    const L = CFG.ISLANDS.COVE.SAIL_LOOP, a = (g.time / L.period) * Math.PI * 2;
    const x = L.x + Math.cos(a) * L.rx, y = L.y + Math.sin(a) * L.ry;
    if (x < r.camX - 90 || x > r.camX + r.viewW + 90 || y < r.camY - 90 || y > r.camY + r.viewH + 90) return;
    const ctx = r.ctx, head = Math.atan2(Math.cos(a) * L.ry, -Math.sin(a) * L.rx);
    for (let k = 1; k < 6; k++) { const b = a - k * 0.03, wx = L.x + Math.cos(b) * L.rx, wy = L.y + Math.sin(b) * L.ry; ctx.fillStyle = `rgba(255,255,255,${(0.5 - k * 0.08).toFixed(2)})`; ctx.beginPath(); ctx.arc(wx, wy, 4 + k * 2, 0, Math.PI * 2); ctx.fill(); }
    this.drawSailboat(r, g, x, y, head, { hull: '#fff8ee', sail: '#ff8fab', flag: '#41b883' }, 1.7);
  },
  // the tide pools come alive: little fish dart about, and whatever you peeked at pops up with a splash
  drawCoveLive(r, g) {
    const ctx = r.ctx, C = CFG.ISLANDS.COVE, t = g.time, rt = this.rt;
    C.POOLS.forEach((P, i) => {
      for (let k = 0; k < 2; k++) {
        const a = t * (0.9 + k * 0.4) + i * 2 + k * 3, fx = P.x + Math.cos(a) * P.rx * 0.55, fy = P.y + Math.sin(a * 1.3) * P.ry * 0.45, dir = -Math.sin(a) >= 0 ? 1 : -1;
        ctx.fillStyle = k ? '#ffd166' : '#ff8c42'; ctx.beginPath(); ctx.ellipse(fx, fy, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(fx - dir * 4, fy); ctx.lineTo(fx - dir * 9, fy - 3); ctx.lineTo(fx - dir * 9, fy + 3); ctx.closePath(); ctx.fill();
      }
      const ring = (t * 0.5 + i * 0.3) % 1; ctx.strokeStyle = `rgba(255,255,255,${(0.4 * (1 - ring)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(P.x + P.rx * 0.2, P.y, 4 + ring * P.rx * 0.5, 2 + ring * P.ry * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    });
    const pk = rt.peek;
    if (pk) {
      const P = C.POOLS[pk.i], k = Math.min(1, pk.t / 0.35), out = pk.t < 1.8 ? k : Math.max(0, 1 - (pk.t - 1.8) / 0.4);
      for (let j = 0; j < 2; j++) { const q = (pk.t * 1.2 + j * 0.4) % 1; ctx.strokeStyle = `rgba(255,255,255,${(0.7 * (1 - q)).toFixed(2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(P.x, P.y, 6 + q * P.rx, 3 + q * P.ry, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.font = r.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = out; ctx.fillText(C.CRITTERS[pk.k][1], P.x, P.y - 8 - out * 16 + Math.sin(pk.t * 8) * 2); ctx.globalAlpha = 1;
    }
  },
  // the treat in the chef's hand, held out to the side
  drawTreat(r, g, kind) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 17, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    if (kind === 'snowcone') { this.drawSnowcone(ctx, x, y - 2, '#e4572e', 1); return; }
    if (kind === 'cookie') {   // a crab-shaped cookie with icing eyes
      ctx.fillStyle = '#d98e3f'; ctx.beginPath(); ctx.ellipse(x, y, 9, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 9, y - 6, 3.5, 0, Math.PI * 2); ctx.arc(x + 9, y - 6, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d98e3f'; ctx.lineWidth = 2; for (const d of [-1, 1]) for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(x + d * 7, y + 2 + k * 3); ctx.lineTo(x + d * 12, y + 6 + k * 3); ctx.stroke(); }
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(x, y + 1, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 2, 0, Math.PI * 2); ctx.arc(x + 3, y - 4, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 0.9, 0, Math.PI * 2); ctx.arc(x + 3, y - 4, 0.9, 0, Math.PI * 2); ctx.fill();
      return;
    }
    // a coconut with a straw and a tiny umbrella
    ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f0dc'; ctx.beginPath(); ctx.ellipse(x, y - 4, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff8fab'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 2, y - 4); ctx.lineTo(x + 6, y - 16); ctx.stroke();
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 2, y - 4); ctx.lineTo(x - 5, y - 15); ctx.stroke();
    ctx.fillStyle = '#41b883'; ctx.beginPath(); ctx.moveTo(x - 5, y - 15); ctx.arc(x - 5, y - 15, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - 3, y + 2, 2, 0, Math.PI * 2); ctx.fill();
    if (Math.sin(t * 2) > 0.7) { ctx.fillStyle = 'rgba(159,224,255,0.8)'; ctx.beginPath(); ctx.arc(x + 6, y - 18 - ((t * 20) % 6), 1.5, 0, Math.PI * 2); ctx.fill(); }
  },
  drawDolphin(ctx, d, t) {
    const q = d.t / 1.6, px = d.x + d.dir * (q * 130 - 65), py = d.y - Math.sin(q * Math.PI) * 60 + 6;
    const ang = Math.atan2(-Math.cos(q * Math.PI) * Math.PI * 60, d.dir * 130);
    if (q < 0.2 || q > 0.8) { const k = q < 0.2 ? q / 0.2 : (1 - q) / 0.2; ctx.fillStyle = `rgba(255,255,255,${0.8 * k})`; const sx = q < 0.2 ? d.x - d.dir * 60 : d.x + d.dir * 60; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(sx + i * 10, d.y + 4 - k * 10 - Math.abs(i) * 4, 4 + k * 4, 0, Math.PI * 2); ctx.fill(); } }
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); if (d.dir < 0) ctx.scale(1, -1);
    ctx.fillStyle = '#6f8fa8'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-22, -2); ctx.lineTo(-34, -10); ctx.lineTo(-30, 0); ctx.lineTo(-34, 10); ctx.lineTo(-22, 2); ctx.closePath(); ctx.fill();   // tail
    ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(0, -18); ctx.lineTo(6, -7); ctx.closePath(); ctx.fill();   // fin
    ctx.fillStyle = '#c9d8e4'; ctx.beginPath(); ctx.ellipse(2, 3, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6f8fa8'; ctx.beginPath(); ctx.ellipse(24, 1, 8, 4, 0, 0, Math.PI * 2); ctx.fill();   // beak
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(14, -3, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawCrab(ctx, c) {
    const x = c.x, y = c.y, legs = c.pause > 0 ? 0 : Math.sin(c.step) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ly = y - 2 + k * 3, l = (k % 2 ? legs : -legs); ctx.beginPath(); ctx.moveTo(x - 7, ly); ctx.lineTo(x - 14, ly + 4 + l); ctx.moveTo(x + 7, ly); ctx.lineTo(x + 14, ly + 4 - l); ctx.stroke(); }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 11, y - 5, 3.5, 0, Math.PI * 2); ctx.arc(x + 11, y - 5, 3.5, 0, Math.PI * 2); ctx.fill();   // claws
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, y - 7, 2.2, 0, Math.PI * 2); ctx.arc(x + 3, y - 7, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 3 + c.dir, y - 7, 1, 0, Math.PI * 2); ctx.arc(x + 3 + c.dir, y - 7, 1, 0, Math.PI * 2); ctx.fill();
  },
  // The ferry seen from above, moored and bobbing. dir: +1 nose east, -1 nose west.
  drawFerryTop(r, g, x, y, dir, phase) {
    const ctx = r.ctx, t = g.time + phase, bob = Math.sin(t * 1.6) * 1.5, tilt = Math.sin(t * 1.1) * 0.015;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(tilt); ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(0, 4, 66, 30, 0, 0, Math.PI * 2); ctx.fill();
    const hull = (ox, oy) => { ctx.beginPath(); ctx.moveTo(58 + ox, oy); ctx.quadraticCurveTo(52 + ox, -22 + oy, 20 + ox, -22 + oy); ctx.lineTo(-50 + ox, -22 + oy); ctx.quadraticCurveTo(-58 + ox, -22 + oy, -58 + ox, -14 + oy); ctx.lineTo(-58 + ox, 14 + oy); ctx.quadraticCurveTo(-58 + ox, 22 + oy, -50 + ox, 22 + oy); ctx.lineTo(20 + ox, 22 + oy); ctx.quadraticCurveTo(52 + ox, 22 + oy, 58 + ox, oy); ctx.closePath(); };
    ctx.fillStyle = '#2d5a8a'; hull(2, 4); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; hull(0, 0); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-50, -22, 68, 3); ctx.fillRect(-50, 19, 68, 3);
    ctx.fillStyle = '#d9b27c'; U.roundRect(ctx, -50, -16, 98, 32, 8); ctx.fill();   // deck
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let k = -44; k < 46; k += 9) ctx.fillRect(k, -16, 1.5, 32);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, -32, -13, 50, 26, 6); ctx.fill();   // cabin
    ctx.fillStyle = '#bfe3ff'; for (let k = -26; k < 14; k += 10) { ctx.fillRect(k, -12, 6, 4); ctx.fillRect(k, 8, 6, 4); }
    ctx.fillStyle = '#5a9ae8'; U.roundRect(ctx, -26, -7, 38, 14, 5); ctx.fill();   // cabin roof
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-22, -1, 30, 2);
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(-42, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-42, 0, 5.5, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-42, 0, 2.5, 0, Math.PI * 2); ctx.fill();   // funnel
    ctx.fillStyle = '#fff'; for (const ly of [-19, 19]) { ctx.beginPath(); ctx.arc(28, ly, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(28, ly, 3.5, 0, Math.PI * 2); ctx.stroke(); }   // lifebuoys
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(50, 0, 3, 0, Math.PI * 2); ctx.fill();
    const wave = Math.sin(t * 6) * 2;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-54, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(-68, -5 + wave); ctx.lineTo(-68, 5 + wave); ctx.closePath(); ctx.fill();   // pennant
    ctx.restore();
    // smoke from the funnel
    for (let i = 0; i < 3; i++) { const age = ((t * 0.5 + i * 0.33) % 1); ctx.fillStyle = `rgba(235,235,235,${0.55 * (1 - age)})`; ctx.beginPath(); ctx.arc(x - dir * 42 + age * 10, y - 8 - age * 28, 3 + age * 8, 0, Math.PI * 2); ctx.fill(); }
  },

  // ---- y-sorted things: the jet ski, palms, the lighthouse
  entities(r, g, items) {
    if (!this.rt) return;
    const p = g.player, tr = this.rt.treat;
    if (tr && !g.driving && !g.onTrain && !g.travel) items.push({ y: p.y + 1, draw: () => this.drawTreat(r, g, tr.kind) });
    if (g.area !== 'islands') return;
    const js = this.rt.jetski, SU = CFG.ISLANDS.SUNNY, K = SU.KIOSK, vb = this.rt.vb;
    vb.who.forEach((w, i) => items.push({ y: w.y, draw: () => this.drawPlayerVB(r, g, w, i) }));
    items.push({ y: SU.NET.y0, draw: () => this.drawNet(r, g) });
    items.push({ y: K.y + 4, draw: () => r.drawPerson(K.x + Math.sin(g.time * 0.7) * 18, K.y + 4, { shirt: '#4dd0e1', skin: '#c68642', hair: '#2b1d14', hairStyle: 1, facing: 1, moving: false, bob: 0, carry: 0, pants: '#3a3f5c', apron: '#fff' }) });
    items.push({ y: K.y + 22, draw: () => this.drawKioskFront(r, g) });
    this.rt.boats.forEach((b, i) => items.push({ y: b.y + 20, draw: () => this.drawBoat(r, g, b, 0.5 + i * 1.3) }));
    items.push({ y: js.y + 8, draw: () => r.drawSiteVehicle(g, js, 24) });
    for (const s of CFG.ISLANDS.ISLANDS) {
      if (s.palms) for (const [px, py] of s.palms) items.push({ y: py, draw: () => this.drawPalm(r, g, px, py) });
      if (s.tower) items.push({ y: s.tower.y, draw: () => this.drawLighthouse(r, g, s.tower.x, s.tower.y) });
    }
  },
  drawPalm(r, g, x, y) {
    const ctx = r.ctx, sway = Math.sin(g.time * 1.3 + x) * 0.05, lean = ((x * 7) % 3 - 1) * 10;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 3, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a66a2c'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.4, y - 40, x + lean, y - 68); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2; for (let k = 1; k < 5; k++) { const q = k / 5, bx = x + lean * (2 * q * (1 - q) * 0.4 + q * q), by = y - 68 * q; ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.lineTo(bx + 3, by); ctx.stroke(); }
    const tx = x + lean, ty = y - 68;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(sway);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      ctx.fillStyle = k % 2 ? '#3f9a4a' : '#56b862';
      ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(16, 0, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#6b4a2b'; for (const [dx, dy] of [[-5, 3], [4, 4], [0, -4]]) { ctx.beginPath(); ctx.arc(dx, dy, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawLighthouse(r, g, x, y) {
    const ctx = r.ctx, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 4, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI * 2); ctx.fill();   // rock base
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x + 17, y); ctx.lineTo(x + 11, y - 92); ctx.lineTo(x - 11, y - 92); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (const k of [0, 2]) { const ya = y - 14 - k * 28, yb = ya - 14, wa = 17 - (y - ya) * 0.065, wb = 17 - (y - yb) * 0.065; ctx.beginPath(); ctx.moveTo(x - wa, ya); ctx.lineTo(x + wa, ya); ctx.lineTo(x + wb, yb); ctx.lineTo(x - wb, yb); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 5, y - 26, 10, 18, 3); ctx.fill();   // door
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x - 4, y - 60, 8, 8);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 16, y - 96, 32, 5);   // gallery
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(x - 10, y - 112, 20, 16); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 1.5, y - 112, 3, 16);
    ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#fff7c2' : '#f2b134'; ctx.beginPath(); ctx.arc(x, y - 104, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 14, y - 112); ctx.lineTo(x + 14, y - 112); ctx.lineTo(x, y - 128); ctx.closePath(); ctx.fill();
    // the beam sweeps slowly
    const a = t * 0.8;
    ctx.save(); ctx.translate(x, y - 104); ctx.rotate(a); ctx.fillStyle = 'rgba(255,247,194,0.28)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(120, -16); ctx.lineTo(120, 16); ctx.closePath(); ctx.fill(); ctx.restore();
  },

  // ---- gulls over everything
  overlay(r, g) {
    if (g.area !== 'islands') return;
    const ctx = r.ctx, t = g.time;
    // the volleyball, high over the net
    if (this.rt) { const b = this.ballPos(g), y = b.y - b.h; ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(b.x, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, y, 8, 0.2, 1.6); ctx.stroke(); ctx.strokeStyle = '#ffd166'; ctx.beginPath(); ctx.arc(b.x, y, 8, 2.3, 3.8); ctx.stroke(); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, y, 8, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const cx = 3600 + (i % 2) * 500, cy = 1800 + Math.floor(i / 2) * 400, a = t * 0.35 + i * 1.7;
      const x = cx + Math.cos(a) * (220 + i * 40), y = cy + Math.sin(a) * 110 + Math.sin(t * 2 + i) * 8;
      if (x < r.camX - 30 || x > r.camX + r.viewW + 30 || y < r.camY - 30 || y > r.camY + r.viewH + 30) continue;
      const flap = Math.sin(t * 9 + i) * 4;
      ctx.beginPath(); ctx.moveTo(x - 10, y + flap); ctx.quadraticCurveTo(x - 5, y - 4, x, y); ctx.quadraticCurveTo(x + 5, y - 4, x + 10, y + flap); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 60, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
  },

  // ---- the jet ski, nose +x (and a sailboat's hull, in case anything draws one with Render.drawVehicle)
  vehicleArt: {
    sailboat(r, g, color, v) { IslandsExt.drawHull(r.ctx, 0, 0, 0, (v && v.B) || CFG.ISLANDS.COVE.BOATS[0], 0); },
    jetski(r, g, color, v, helpers) {
      const ctx = r.ctx, c = color || '#ff5a5f';
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-2, 2, 32, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(2, 4, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(32, 0); ctx.quadraticCurveTo(28, -12, 8, -12); ctx.lineTo(-20, -11); ctx.quadraticCurveTo(-29, -11, -29, 0); ctx.quadraticCurveTo(-29, 11, -20, 11); ctx.lineTo(8, 12); ctx.quadraticCurveTo(28, 12, 32, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; U.roundRect(ctx, -24, -6, 40, 12, 5); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -23, -5, 24, 10, 4); ctx.fill();   // seat
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(8, -11, 3, 22); ctx.fillStyle = '#2b1d14'; ctx.fillRect(7, -13, 5, 4); ctx.fillRect(7, 9, 5, 4);   // handlebars
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(20, -4, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(26, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -32, -5, 6, 10, 2); ctx.fill();   // jet nozzle
    },
  },

  // ---- the ferry ride, side on, full screen
  travel: {
    ferry(r, g, W, H) {
      const ctx = r.ctx, tr = g.travel, t = g.time, E = IslandsExt;
      const k = tr.t / tr.dur, ease = k < 0.12 ? k / 0.12 : k > 0.88 ? (1 - k) / 0.12 : 1;
      const dist = (tr.t < 1.2 ? tr.t * tr.t / 2.4 : tr.t - 0.6) * 260;
      const toIslands = tr.to === 'islands';
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(0.55, '#d9f0ff'); sky.addColorStop(1, '#eaf7ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.16, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();
      const waterY = H * 0.6;
      const layer = (speed, draw) => { const off = (dist * speed) % 2000; for (let q = -1; q <= Math.ceil(W / 2000) + 1; q++) draw(q * 2000 - off); };
      layer(0.08, (ox) => { ctx.fillStyle = 'rgba(255,255,255,0.92)'; for (let i = 0; i < 5; i++) { const cx = ox + i * 410 + 60, cy = H * (0.1 + (i % 3) * 0.08); ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.arc(cx + 20, cy - 10, 24, 0, Math.PI * 2); ctx.arc(cx + 46, cy, 17, 0, Math.PI * 2); ctx.fill(); } });
      // far shore: a green hilly line that fades away
      layer(0.2, (ox) => { ctx.fillStyle = '#9fd0b2'; ctx.beginPath(); ctx.moveTo(ox, waterY); for (let x = 0; x <= 2000; x += 120) { ctx.quadraticCurveTo(ox + x + 60, waterY - 34 - 20 * Math.abs(Math.sin(x * 0.013)), ox + x + 120, waterY); } ctx.lineTo(ox + 2000, waterY); ctx.closePath(); ctx.fill(); });
      // the sea
      const wg = ctx.createLinearGradient(0, waterY, 0, H); wg.addColorStop(0, '#5cb8ea'); wg.addColorStop(1, '#2b6fb0');
      ctx.fillStyle = wg; ctx.fillRect(0, waterY, W, H - waterY);
      // where we came from slides off to the left; where we are going rises ahead on the right
      const fromX = W * 0.12 - k * W * 1.3, toX = W * 1.25 - k * W * 0.95;
      const town = (x) => E.sceneTown(ctx, r, x, waterY), isles = (x) => E.sceneIslands(ctx, r, x, waterY, t);
      if (toIslands) { town(fromX); isles(toX); } else { isles(fromX); town(toX); }
      // a lighthouse and buoys pass by
      const lx = W * 1.3 - k * W * 1.9; E.sceneLighthouse(ctx, lx, waterY - 4, t);
      for (let i = 0; i < 3; i++) { const bx = ((W * 1.1 + i * 520 - dist * 1.1) % (W + 400) + W + 400) % (W + 400) - 200; E.sceneBuoy(ctx, bx, waterY + 30 + i * 24, t + i); }
      // waves rolling past
      for (let row = 0; row < 5; row++) {
        const y = waterY + 14 + row * ((H - waterY) / 5), amp = 3 + row, sp = 0.6 + row * 0.25;
        ctx.strokeStyle = `rgba(255,255,255,${0.25 + row * 0.08})`; ctx.lineWidth = 2 + row * 0.5; ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 16) { const yy = y + Math.sin((x + dist * sp) * 0.04 + row) * amp; if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
        ctx.stroke();
      }
      // a dolphin jumps alongside halfway through
      if (k > 0.38 && k < 0.52) { const q = (k - 0.38) / 0.14; E.sceneDolphin(ctx, W * 0.22 + q * 140, waterY + 36 - Math.sin(q * Math.PI) * 70, Math.atan2(-Math.cos(q * Math.PI) * 70 * Math.PI, 140)); }
      // the ferry
      const scale = Math.min(1.1, W / 760), fx = W * 0.5, fy = waterY + 28 + Math.sin(t * 1.8) * 3;
      E.drawFerrySide(r, g, fx, fy, scale, t, dist);
      // gulls
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const gx = ((W * 0.3 + i * 300 - dist * 0.5) % (W + 200) + W + 200) % (W + 200) - 100, gy = H * (0.18 + i * 0.07) + Math.sin(t * 1.5 + i) * 10, flap = Math.sin(t * 8 + i) * 4; ctx.beginPath(); ctx.moveTo(gx - 10, gy + flap); ctx.quadraticCurveTo(gx - 5, gy - 4, gx, gy); ctx.quadraticCurveTo(gx + 5, gy - 4, gx + 10, gy + flap); ctx.stroke(); }
      // banner and progress bar, like the train ride
      const msg = toIslands ? '⛴️ Next stop: the Islands! 🏝️' : '⛴️ Next stop: home! 🍕';
      ctx.fillStyle = 'rgba(43,29,20,0.85)'; const bw = Math.min(W - 24, 360); U.roundRect(ctx, W / 2 - bw / 2, 60, bw, 44, 12); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 300 ? 14 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 82);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, bw - 32, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, (bw - 32) * U.clamp(k, 0, 1), 6, 3); ctx.fill();
      if (ease < 1) { ctx.fillStyle = `rgba(43,29,20,${1 - ease})`; ctx.fillRect(0, 0, W, H); }
    },
  },
  sceneTown(ctx, r, x, wy) {
    // the three houses on the river bank, seen from the water
    ctx.fillStyle = '#6cb35a'; U.roundRect(ctx, x - 40, wy - 30, 420, 40, 16); ctx.fill();
    const houses = [['#f2d6a0', '#b23a48'], ['#cfe3f7', '#2d5a8a'], ['#e8f2cf', '#5a8a2d']];
    houses.forEach(([wall, roof], i) => {
      const hx = x + 20 + i * 130;
      ctx.fillStyle = wall; ctx.fillRect(hx, wy - 90, 90, 64);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(hx - 8, wy - 90); ctx.lineTo(hx + 45, wy - 124); ctx.lineTo(hx + 98, wy - 90); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9fe0ff'; ctx.fillRect(hx + 12, wy - 76, 18, 16); ctx.fillRect(hx + 60, wy - 76, 18, 16); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(hx + 37, wy - 56, 16, 30);
    });
    ctx.fillStyle = '#b98a55'; ctx.fillRect(x + 150, wy - 26, 70, 10); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + 154, wy - 16, 5, 14); ctx.fillRect(x + 212, wy - 16, 5, 14);
    for (const tx of [x - 10, x + 380]) { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(tx - 4, wy - 60, 8, 36); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(tx, wy - 72, 24, 0, Math.PI * 2); ctx.fill(); }
  },
  sceneIslands(ctx, r, x, wy, t) {
    const isle = (ix, w, h, palms) => {
      ctx.fillStyle = '#f6e4ad'; ctx.beginPath(); ctx.ellipse(ix, wy - 2, w, h, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#79b85e'; ctx.beginPath(); ctx.ellipse(ix, wy - 6, w * 0.7, h * 0.7, 0, Math.PI, 0); ctx.fill();
      for (const [px, ph] of palms) {
        ctx.strokeStyle = '#a66a2c'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ix + px, wy - 8); ctx.quadraticCurveTo(ix + px + 6, wy - 8 - ph / 2, ix + px + 12, wy - 8 - ph); ctx.stroke();
        ctx.fillStyle = '#3f9a4a'; for (let k = 0; k < 5; k++) { const a = -0.4 + k * 0.5 + Math.sin(t + k) * 0.05; ctx.save(); ctx.translate(ix + px + 12, wy - 8 - ph); ctx.rotate(a - Math.PI * 0.75); ctx.beginPath(); ctx.ellipse(14, 0, 16, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      }
    };
    isle(x, 160, 44, [[-70, 60], [40, 74], [100, 50]]);
    isle(x + 300, 90, 30, [[-20, 56], [40, 44]]);
    // a hut on the big island
    ctx.fillStyle = '#c9975f'; ctx.fillRect(x - 30, wy - 48, 50, 40); ctx.fillStyle = '#d9b55a'; ctx.beginPath(); ctx.moveTo(x - 40, wy - 48); ctx.lineTo(x - 5, wy - 76); ctx.lineTo(x + 30, wy - 48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 12, wy - 30, 12, 22);
  },
  sceneLighthouse(ctx, x, y, t) {
    ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(x, y, 40, 14, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(x - 16, y - 4); ctx.lineTo(x + 16, y - 4); ctx.lineTo(x + 10, y - 90); ctx.lineTo(x - 10, y - 90); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (const k of [0, 2]) { const ya = y - 18 - k * 28, yb = ya - 14, wa = 16 - (y - ya) * 0.065, wb = 16 - (y - yb) * 0.065; ctx.beginPath(); ctx.moveTo(x - wa, ya); ctx.lineTo(x + wa, ya); ctx.lineTo(x + wb, yb); ctx.lineTo(x - wb, yb); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 15, y - 94, 30, 5); ctx.fillStyle = '#ffe08a'; ctx.fillRect(x - 9, y - 110, 18, 16);
    ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#fff7c2' : '#f2b134'; ctx.beginPath(); ctx.arc(x, y - 102, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 13, y - 110); ctx.lineTo(x + 13, y - 110); ctx.lineTo(x, y - 126); ctx.closePath(); ctx.fill();
  },
  sceneBuoy(ctx, x, y, t) {
    const bob = Math.sin(t * 2) * 3;
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 12, y + bob); ctx.lineTo(x + 12, y + bob); ctx.lineTo(x + 4, y - 26 + bob); ctx.lineTo(x - 4, y - 26 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 8, y - 12 + bob, 16, 5); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 29 + bob, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 4, 18, 5, 0, 0, Math.PI * 2); ctx.stroke();
  },
  sceneDolphin(ctx, x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = '#6f8fa8'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-24, -2); ctx.lineTo(-36, -11); ctx.lineTo(-32, 0); ctx.lineTo(-36, 11); ctx.lineTo(-24, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(0, -20); ctx.lineTo(7, -8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9d8e4'; ctx.beginPath(); ctx.ellipse(2, 3, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6f8fa8'; ctx.beginPath(); ctx.ellipse(26, 1, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(15, -3, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // The ferry seen from the side, sailing to the right, the chef on deck.
  drawFerrySide(r, g, x, y, s, t, dist) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.3) * 0.02);
    // wake and bow spray
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 6; i++) { const age = ((dist * 0.01 + i * 0.17) % 1); ctx.globalAlpha = 0.7 * (1 - age); ctx.beginPath(); ctx.arc(-90 - age * 120, 10 + Math.sin(i) * 4, 6 + age * 14, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) { const age = ((t * 0.9 + i * 0.25) % 1); ctx.globalAlpha = 0.8 * (1 - age); ctx.beginPath(); ctx.arc(96 + age * 14, 2 - age * 22, 3 + age * 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // hull
    ctx.fillStyle = '#2d5a8a'; ctx.beginPath(); ctx.moveTo(-84, -4); ctx.lineTo(92, -4); ctx.lineTo(72, 18); ctx.lineTo(-70, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(-86, -26); ctx.lineTo(100, -26); ctx.lineTo(92, -4); ctx.lineTo(-84, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(-88, -40); ctx.lineTo(104, -40); ctx.lineTo(100, -26); ctx.lineTo(-86, -26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(-85, -8, 176, 3);
    for (let px = -70; px < 90; px += 32) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(px, -16, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(px, -16, 3.5, 0, Math.PI * 2); ctx.fill(); }   // portholes
    // railing along the deck
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-84, -52); ctx.lineTo(100, -52); ctx.stroke(); for (let px = -80; px < 100; px += 16) { ctx.beginPath(); ctx.moveTo(px, -40); ctx.lineTo(px, -52); ctx.stroke(); }
    // cabin and wheelhouse
    ctx.fillStyle = '#fff'; U.roundRect(ctx, -56, -92, 96, 52, 6); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-56, -92, 96, 8);
    ctx.fillStyle = '#bfe3ff'; for (let px = -46; px < 30; px += 20) U.roundRect(ctx, px, -80, 14, 16, 3), ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, -30, -120, 56, 30, 6); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-30, -120, 56, 6);
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, -22, -112, 40, 16, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-18, -108, 3, 3); ctx.fillRect(-6, -110, 3, 3);   // captain's eyes peeking
    // funnel with smoke, mast and flag
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, -52, -126, 18, 36, 4); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(-52, -118, 18, 6); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-52, -128, 18, 4);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(12, -150, 3, 32);
    const wave = Math.sin(t * 7) * 3;
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(15, -150); ctx.lineTo(40, -144 + wave); ctx.lineTo(15, -136); ctx.closePath(); ctx.fill();
    // lifebuoy on the cabin wall
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-66, -66, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-66, -66, 5.5, 0, Math.PI * 2); ctx.stroke();
    // the chef on the bow deck, waving
    ctx.save(); ctx.translate(66, -40); ctx.scale(0.95, 0.95);
    r.drawPerson(0, 0, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(16, -34 + Math.sin(t * 6) * 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
    // smoke drifting back
    for (let i = 0; i < 6; i++) { const age = ((t * 1.1 + i * 0.5) % 3) / 3; const sx = x - 43 * s - age * 180, sy = y - 128 * s - age * 60; r.ctx.fillStyle = `rgba(240,240,240,${0.7 * (1 - age)})`; r.ctx.beginPath(); r.ctx.arc(sx, sy, (5 + age * 18) * s, 0, Math.PI * 2); r.ctx.fill(); }
  },
};
Game.ext.push(IslandsExt);
Render.ext.push(IslandsExt);
