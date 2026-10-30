'use strict';
// The Pizza Mine: a Stardew-style mine you reach from Construction Town. North of the gravel road, east of the site
// block, a rocky hillside holds a mine shaft (a wooden frame, a cart track, a lantern), a little elevator cage, a rock
// collection shelf and a friendly old miner who hands the chef a pickaxe and buys the rocks he brings back.
// Inside: twenty floors in four themes (brown earth caves, icy blue caves, glowing crystal caves, cheesy pizza caves with
// pepperoni rocks), each one generated from its floor number (so a floor looks the same each time you go in): walls and
// pillars, 15-30 rocks (some hold copper, iron, gold or gems), a couple of crates (sometimes with a pizza snack inside),
// a few slow, bouncy slimes, and one rock hides the ladder down. One button does everything: '⛏️ Mine', '🪜 Go down',
// '🛗 Elevator'; slimes need no button: when one comes within reach the chef bonks it all by himself (every
// AUTO_BONK s, two bonks pop it). A slime bump still costs a heart (5 of them, top-left); at no hearts the chef just gets sleepy and
// wakes at the entrance with all his loot. Every fifth floor has an elevator; the one outside picks any floor reached.
// Floor 20 has a treasure chest with the golden pizza trophy.
// Extension module: registered with Game.ext (first, so the door beats the site's own hints) and Render.ext (see js/EXTENSIONS.md).
CFG.MINES = {
  // ---- outside, in Construction Town: the hillside on the grass between the railway and the gravel road
  HILL: { x0: 4122, x1: 4452, top: -122, base: 8 },             // the painted hill
  HILL_BOX: { x: 4140, y: -116, w: 290, h: 120 },                 // what is solid (y -116..4)
  SHAFT: { x: 4300, half: 26, top: -50, base: 4 },
  DOOR: { x: 4300, y: 26 },                                       // stand here: '⛏️ Go into the mine'
  MINER: { x: 4214, y: 14 }, MINER_SPOT: { x: 4250, y: 30 }, GIFT_R: 100,   // the chef talks to him from beside him
  ELEV: { x: 4396, y: 26 }, CAGE: { x0: 4374, x1: 4418, top: -66, base: 4 },
  SHELF: { x0: 4146, x1: 4204, y0: -44, y1: 0 },
  CART: { x: 4353, y: -6 }, LANTERN: { x: 4334, y: -44 },
  // ---- the mine: one map, regenerated for each floor on a grid of 50 px tiles
  WORLD: { x0: 3500, y0: 5000, x1: 4700, y1: 5800 },
  TILE: 50, COLS: 24, ROWS: 16, FLOORS: 20,
  REACH: 74, BONK_R: 66, TOUCH_R: 28, HEARTS: 5, LADDER_BY: 7,
  AUTO_BONK: 0.5, SLIME_HOP: 0.7, SLIME_WAIT: [1.0, 2.2], SLIME_CHASE: 0.3,   // auto attack every 0.5 s; gentle, slow slimes   // the 7th rock broken always shows the ladder if it hid so far
  ORES: {
    copper: { ico: '🟤', col: '#d9773a', hi: '#ffb37a', price: 1, hp: 2 },
    iron: { ico: '⚪', col: '#dfe4ea', hi: '#ffffff', price: 2, hp: 2 },
    gold: { ico: '🟡', col: '#ffcf33', hi: '#fff3a0', price: 5, hp: 3 },
    gem: { ico: '💎', col: '#4fe8ff', hi: '#d8fbff', price: 10, hp: 3 },
  },
  GOO: { ico: '🟢', col: '#7bd36b', price: 1 },
  THEMES: [
    { key: 'earth', ico: '🟫', hello: '⛏️ The brown caves!', wall: '#7a5636', wallHi: '#9a7048', wallLo: '#4e3622', floor: '#b38d62', floor2: '#a58058',
      rock: '#9a8878', rockHi: '#bdae9f', rockLo: '#6e5f52', slime: '#6fd36b', dark: '18,10,4', ores: { copper: 85, iron: 15 } },
    { key: 'ice', ico: '❄️', hello: '❄️ The icy caves!', wall: '#5a8cb8', wallHi: '#9cc9ec', wallLo: '#3a6086', floor: '#d8edf9', floor2: '#c6e2f4',
      rock: '#a9c9e0', rockHi: '#eef8ff', rockLo: '#6e95b5', slime: '#5cbcff', dark: '6,14,32', ores: { copper: 40, iron: 50, gold: 10 } },
    { key: 'crystal', ico: '💎', hello: '💎 The crystal caves!', wall: '#4b3a78', wallHi: '#7c66b6', wallLo: '#2e2250', floor: '#76669e', floor2: '#6c5c93',
      rock: '#9686c6', rockHi: '#cbc0f0', rockLo: '#62548f', slime: '#ff86d6', dark: '14,6,28', ores: { iron: 30, gold: 40, gem: 30 } },
    { key: 'pizza', ico: '🍕', hello: '🍕 The pizza caves!', wall: '#d48d32', wallHi: '#f4b860', wallLo: '#9c6420', floor: '#ffd966', floor2: '#f7cd55',
      rock: '#cc4b38', rockHi: '#ea7a62', rockLo: '#8f2f1f', slime: '#ff9a3c', dark: '30,14,2', ores: { gold: 50, gem: 50 } },
  ],
};
CFG.AREAS.mines = { WORLD: CFG.MINES.WORLD, noSky: true };

const MinesExt = {
  name: 'mines',
  st: null,
  dom: null,
  defaults: { mines: { seen: false, pickaxe: false, sword: false, deepest: 0, cur: 0, elevators: [], ores: { copper: 0, iron: 0, gold: 0, gem: 0 }, goo: 0, found: {}, trophy: false, sold: 0, rocks: 0, slimes: 0, sleeps: 0 } },
  DIRS: [[1, 0], [-1, 0], [0, 1], [0, -1]],

  // ---------- state ----------
  build(g) {
    const d = JSON.parse(JSON.stringify(this.defaults.mines));
    const s = Object.assign(d, g.s.mines || {});
    s.ores = Object.assign({ copper: 0, iron: 0, gold: 0, gem: 0 }, s.ores || {});
    s.found = Object.assign({}, s.found || {});
    s.elevators = Array.isArray(s.elevators) ? s.elevators.filter((n) => n % 5 === 0 && n >= 5 && n <= CFG.MINES.FLOORS) : [];
    g.s.mines = s;
    this.closePanel();
    this.st = {
      floor: null, obs: [], hearts: CFG.MINES.HEARTS, invuln: 0, blink: 0, push: null, sleep: null, fade: 0, act: null, bonkCd: 0,
      bits: [], splats: [], heartPop: null, panel: null, minerHop: 0, minerSay: null, lastTheme: -1,
    };
    // a reload inside the mine starts again at the top of the floor you were on
    if (g.area === 'mines') this.enterFloor(g, s.cur || 1, true);
  },
  save(g) { if (!g.s.mines || !this.st) this.build(g); return g.s.mines; },
  theme(n) { return CFG.MINES.THEMES[Math.min(3, Math.floor((Math.max(1, n) - 1) / 5))]; },
  themeIndex(n) { return Math.min(3, Math.floor((Math.max(1, n) - 1) / 5)); },
  // a small seeded random generator (mulberry32): the same floor number always builds the same floor
  rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },
  tileCenter(c, r) { const M = CFG.MINES; return { x: M.WORLD.x0 + c * M.TILE + M.TILE / 2, y: M.WORLD.y0 + r * M.TILE + M.TILE / 2 }; },

  // ---------- the floor generator ----------
  // Grid cells: 0 floor, 1 wall, 2 rock, 3 crate, 4 chest. Every rock, crate and the chest must touch a floor tile the
  // chef can walk to from the arrival spot without breaking anything (flood fill); otherwise it rolls again.
  generate(n) {
    const M = CFG.MINES, C = M.COLS, R = M.ROWS, rnd = this.rng(n * 9973 + 1234567), th = this.theme(n);
    const at = (c, r) => r * C + c, DIRS = this.DIRS;
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    for (let attempt = 0; attempt < 120; attempt++) {
      const plain = attempt > 60;   // (never needed so far) a floor without pillars always works out
      const grid = new Array(C * R).fill(0), keep = new Array(C * R).fill(0);
      for (let c = 0; c < C; c++) { grid[at(c, 0)] = 1; grid[at(c, R - 1)] = 1; }
      for (let r = 0; r < R; r++) { grid[at(0, r)] = 1; grid[at(C - 1, r)] = 1; }
      const ax = 3 + Math.floor(rnd() * (C - 6));
      for (let c = ax - 1; c <= ax + 1; c++) for (let r = 1; r <= 4; r++) keep[at(c, r)] = 1;   // the arrival corner stays clear (and slime-free)
      let ex = -1;
      if (n % 5 === 0) { ex = ax + 3 <= C - 3 ? ax + 3 : ax - 3; for (let c = Math.min(ax, ex); c <= Math.max(ax, ex); c++) { keep[at(c, 1)] = 1; keep[at(c, 2)] = 1; } }
      let chest = null;
      if (n === M.FLOORS) { chest = { c: Math.floor(C / 2), r: Math.floor(R / 2) }; for (let c = chest.c - 1; c <= chest.c + 1; c++) for (let r = chest.r - 1; r <= chest.r + 1; r++) keep[at(c, r)] = 1; }
      if (!plain) {
        // little bumps along the cave walls, and a few pillars
        const nb = 6 + Math.floor(rnd() * 7);
        for (let i = 0; i < nb; i++) {
          const side = Math.floor(rnd() * 4);
          const c = side === 2 ? 1 : side === 3 ? C - 2 : 1 + Math.floor(rnd() * (C - 2));
          const r = side === 0 ? 1 : side === 1 ? R - 2 : side >= 2 ? 1 + Math.floor(rnd() * (R - 2)) : 1;
          if (!keep[at(c, r)]) grid[at(c, r)] = 1;
        }
        const np = 3 + Math.floor(rnd() * 4);
        for (let i = 0; i < np; i++) {
          const c0 = 3 + Math.floor(rnd() * (C - 7)), r0 = 4 + Math.floor(rnd() * (R - 8)), w = 1 + Math.floor(rnd() * 2), h = 1 + Math.floor(rnd() * 2);
          for (let c = c0; c < c0 + w; c++) for (let r = r0; r < r0 + h; r++) if (!keep[at(c, r)]) grid[at(c, r)] = 1;
        }
      }
      if (chest) grid[at(chest.c, chest.r)] = 4;
      // rocks, partly in clumps
      const nr = U.clamp(15 + Math.floor(n * 0.6) + Math.floor(rnd() * 6), 15, 30);
      const rocks = [];
      for (let tries = 0; rocks.length < nr && tries < 800; tries++) {
        let c, r;
        if (rocks.length && rnd() < 0.45) { const b = pick(rocks), d = pick(DIRS); c = b.c + d[0]; r = b.r + d[1]; }
        else { c = 1 + Math.floor(rnd() * (C - 2)); r = 1 + Math.floor(rnd() * (R - 2)); }
        if (c < 1 || r < 1 || c > C - 2 || r > R - 2 || grid[at(c, r)] || keep[at(c, r)]) continue;
        grid[at(c, r)] = 2; rocks.push({ c, r });
      }
      const crates = [];
      for (let tries = 0; crates.length < 2 && tries < 400; tries++) {
        const c = 1 + Math.floor(rnd() * (C - 2)), r = 2 + Math.floor(rnd() * (R - 3));
        if (grid[at(c, r)] || keep[at(c, r)]) continue;
        grid[at(c, r)] = 3; crates.push({ c, r });
      }
      // flood fill from the arrival spot over open floor
      const seen = new Array(C * R).fill(0), q = [[ax, 3]]; seen[at(ax, 3)] = 1;
      while (q.length) {
        const [c, r] = q.pop();
        for (const [dx, dy] of DIRS) { const nc = c + dx, nr2 = r + dy; if (nc < 0 || nr2 < 0 || nc >= C || nr2 >= R) continue; const k = at(nc, nr2); if (!seen[k] && grid[k] === 0) { seen[k] = 1; q.push([nc, nr2]); } }
      }
      const touch = (o) => DIRS.some(([dx, dy]) => seen[at(o.c + dx, o.r + dy)]);
      if (rocks.length < 15 || !rocks.every(touch) || !crates.every(touch) || (chest && !touch(chest)) || (ex >= 0 && !seen[at(ex, 1)])) continue;
      const open = [];
      for (let r = 1; r < R - 1; r++) for (let c = 1; c < C - 1; c++) if (seen[at(c, r)] && !keep[at(c, r)] && Math.abs(c - ax) + Math.abs(r - 3) >= 6) open.push({ c, r });
      if (open.length < 10) continue;
      // slimes
      const ns = Math.min(5, 2 + Math.floor((n - 1) / 5) + (rnd() < 0.5 ? 1 : 0));
      const slimes = [];
      for (let tries = 0; slimes.length < ns && tries < 200; tries++) { const o = pick(open); if (!slimes.some((s) => s.c === o.c && s.r === o.r)) slimes.push({ c: o.c, r: o.r }); }
      // the ladder hides in a rock far from the arrival spot (none on the last floor)
      let ladderRock = null;
      if (n < M.FLOORS) { const far = rocks.filter((o) => Math.abs(o.c - ax) + Math.abs(o.r - 3) >= 7); ladderRock = pick(far.length ? far : rocks); }
      // what each rock holds and how hard it is
      const ores = Object.keys(th.ores), total = ores.reduce((a, k) => a + th.ores[k], 0);
      const pickOre = () => { let v = rnd() * total; for (const k of ores) { v -= th.ores[k]; if (v <= 0) return k; } return ores[0]; };
      const outRocks = rocks.map((o, i) => {
        const ore = (i === 0 || rnd() < 0.42) ? pickOre() : null;
        const hp = ore ? M.ORES[ore].hp : (n <= 5 ? 1 : 1 + (rnd() < 0.5 ? 1 : 0));
        const p = this.tileCenter(o.c, o.r);
        const shape = []; for (let k = 0; k < 8; k++) shape.push(0.84 + rnd() * 0.24);
        const specks = []; for (let k = 0; k < 4; k++) specks.push({ dx: (rnd() - 0.5) * 22, dy: -6 - rnd() * 14, s: 2.5 + rnd() * 2 });
        return { kind: 'rock', id: i, c: o.c, r: o.r, x: p.x, y: p.y, ore, hp, max: hp, ladder: o === ladderRock, shape, specks, shake: 0 };
      });
      const outCrates = crates.map((o, i) => { const p = this.tileCenter(o.c, o.r); return { kind: 'crate', id: i, c: o.c, r: o.r, x: p.x, y: p.y, hp: 1, max: 1, snack: i === 0 || rnd() < 0.5, shake: 0 }; });
      const outSlimes = slimes.map((o, i) => { const p = this.tileCenter(o.c, o.r); return { id: i, c: o.c, r: o.r, x: p.x, y: p.y, z: 0, hop: null, wait: 0.6 + rnd() * 1.4, hp: 2, stun: 0, squish: 0, face: rnd() < 0.5 ? -1 : 1, phase: rnd() * 6 }; });
      const arrival = this.tileCenter(ax, 3), up = this.tileCenter(ax, 1);   // you arrive a little below the ladder up (clear of the HUD on a phone)
      let elevator = null;
      if (ex >= 0) { const e = this.tileCenter(ex, 1); elevator = { c: ex, x: e.x, y: M.WORLD.y0 + M.TILE + 18 }; }
      let outChest = null;
      if (chest) { const p = this.tileCenter(chest.c, chest.r); outChest = { c: chest.c, r: chest.r, x: p.x, y: p.y, open: false, spot: { x: p.x, y: p.y + M.TILE } }; }
      return {
        n, theme: th, themeIndex: this.themeIndex(n), grid, keep, ax, arrival, up: { x: up.x, y: M.WORLD.y0 + M.TILE + 16 },
        elevator, chest: outChest, rocks: outRocks, crates: outCrates, slimes: outSlimes, ladder: null, broken: 0, snacks: [], attempt,
      };
    }
    return null;
  },
  // the walls, the rocks, the crates and the chest
  buildObs(f) {
    const M = CFG.MINES, W = M.WORLD, T = M.TILE, C = M.COLS, R = M.ROWS, o = [];
    o.push({ x: W.x0, y: W.y0, w: C * T, h: T }, { x: W.x0, y: W.y0 + (R - 1) * T, w: C * T, h: T });
    o.push({ x: W.x0, y: W.y0, w: T, h: R * T }, { x: W.x0 + (C - 1) * T, y: W.y0, w: T, h: R * T });
    for (let r = 1; r < R - 1; r++) for (let c = 1; c < C - 1; c++) if (f.grid[r * C + c] === 1) o.push({ x: W.x0 + c * T, y: W.y0 + r * T, w: T, h: T });
    for (const k of f.rocks.concat(f.crates)) o.push({ x: k.x - 18, y: k.y - 14, w: 36, h: 28 });
    if (f.chest) o.push({ x: f.chest.x - 22, y: f.chest.y - 14, w: 44, h: 28 });
    return o;
  },
  // can a slime hop onto this tile?
  slimeTile(f, c, r) {
    const M = CFG.MINES;
    if (c < 1 || r < 1 || c > M.COLS - 2 || r > M.ROWS - 2) return false;
    const k = r * M.COLS + c;
    return f.grid[k] === 0 && !f.keep[k] && !f.slimes.some((s) => (s.c === c && s.r === r) || (s.hop && s.hop.c === c && s.hop.r === r));
  },

  // ---------- helpers ----------
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  near(g, s, d) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < d; },
  lootValue(g) {
    const s = this.save(g), O = CFG.MINES.ORES;
    return Object.keys(O).reduce((a, k) => a + (s.ores[k] || 0) * O[k].price, 0) + (s.goo || 0) * CFG.MINES.GOO.price;
  },
  // which of the outside spots the chef stands at (nearest first)
  siteSpot(g) {
    if (g.area !== 'site' || !this.onFoot(g)) return null;
    const M = CFG.MINES, p = g.player;
    let best = null, bd = 30;
    for (const [k, s] of [['door', M.DOOR], ['miner', M.MINER_SPOT], ['elev', M.ELEV]]) { const d = U.dist(p.x, p.y, s.x, s.y); if (d < bd) { bd = d; best = k; } }
    return best;
  },
  nearestSlime(g, r) {
    const f = this.st && this.st.floor, p = g.player; if (!f) return null;
    let best = null, bd = r || CFG.MINES.BONK_R;
    for (const s of f.slimes) { const d = U.dist(p.x, p.y, s.x, s.y); if (d < bd) { bd = d; best = s; } }
    return best;
  },
  nearestBreakable(g, reach) {
    const f = this.st && this.st.floor, p = g.player; if (!f) return null;
    let best = null, bd = reach || CFG.MINES.REACH;
    for (const k of f.rocks.concat(f.crates)) { const d = U.dist(p.x, p.y - 8, k.x, k.y); if (d < bd) { bd = d; best = k; } }
    return best;
  },
  // move the chef by (dx, dy) without entering anything solid
  tryMove(g, dx, dy) {
    const p = g.player, obs = g.obstacles(), W = g.bounds();
    const nx = U.clamp(p.x + dx, W.x0 + 16, W.x1 - 16);
    if (!obs.some((o) => g.hitRect(nx, p.y, 12, o))) p.x = nx;
    const ny = U.clamp(p.y + dy, W.y0 + 16, W.y1 - 16);
    if (!obs.some((o) => g.hitRect(p.x, ny, 12, o))) p.y = ny;
  },
  say(g, x, y, text, color, big = true, dur = 1.4) { g.floats.push({ x, y, text, color: color || '#ffe08a', t: 0, dur, big }); },

  // ---------- game hooks ----------
  obstacles(g) {
    if (!this.st) this.build(g);
    if (g.area === 'site') return [CFG.MINES.HILL_BOX];
    if (g.area === 'mines') return this.st.obs;
    return [];
  },
  action(g) {
    if (!this.st) this.build(g);
    const st = this.st, M = CFG.MINES;
    if (g.area === 'site') {
      const spot = this.siteSpot(g);
      if (spot === 'door') return { label: '⛏️ Go into the mine', run: (gg) => this.enter(gg) };
      if (spot === 'elev') return { label: '🛗 Elevator', run: (gg) => this.togglePanel(gg) };
      if (spot === 'miner' && this.lootValue(g) > 0) return { label: '💰 Sell your rocks', run: (gg) => this.sell(gg) };
      return null;
    }
    if (g.area !== 'mines') return null;
    const f = st.floor; if (!f || st.sleep) return null;
    if (f.ladder && this.near(g, f.ladder, 32)) return { label: '🪜 Go down', run: (gg) => this.goDown(gg) };
    if (f.chest && !f.chest.open && this.near(g, f.chest, 64)) return { label: '🎁 Open the chest', run: (gg) => this.openChest(gg) };
    if (f.elevator && this.near(g, f.elevator, 30)) return { label: '🛗 Elevator', run: (gg) => this.togglePanel(gg) };
    if (this.near(g, f.up, 28)) return { label: '☀️ Go outside', run: (gg) => this.leave(gg) };
    const k = this.nearestBreakable(g);
    if (k) return { label: '⛏️ Mine', run: (gg) => this.whack(gg, k) };
    return null;
  },
  hint(g) {
    if (!this.st) return undefined;
    const M = CFG.MINES, p = g.player, st = this.st;
    if (g.area === 'site') {
      if (!this.onFoot(g)) return undefined;
      const s = g.s.mines, cand = [];
      const dd = U.dist(p.x, p.y, M.DOOR.x, M.DOOR.y), dm = U.dist(p.x, p.y, M.MINER_SPOT.x, M.MINER_SPOT.y), de = U.dist(p.x, p.y, M.ELEV.x, M.ELEV.y);
      if (dd < 70) cand.push([dd, { text: 'Go into the mine! ⛏️', target: dd < 30 ? null : M.DOOR }]);
      if (dm < 70 && this.lootValue(g) > 0) cand.push([dm, { text: 'Sell your rocks to the miner! 💰', target: dm < 30 ? null : M.MINER_SPOT }]);
      if (de < 70 && s.elevators.length) cand.push([de, { text: 'Ride the elevator! 🛗', target: de < 30 ? null : M.ELEV }]);
      if (!cand.length) return undefined;
      cand.sort((a, b) => a[0] - b[0]);
      return cand[0][1];
    }
    if (g.area !== 'mines') return undefined;
    const f = st.floor; if (!f) return null;
    if (st.sleep) return { text: 'Time for a rest! 😴', target: null };
    if (st.panel) return { text: 'Pick a floor! 🛗', target: null };
    if (this.nearestSlime(g, 130)) return { text: 'Walk up to the slime: bonk bonk! 🗡️', target: null };
    if (f.chest && !f.chest.open) return { text: 'Open the treasure chest! 🎁', target: f.chest.spot };
    if (f.ladder) return { text: 'Go down the ladder! 🪜', target: f.ladder };
    if (f.n >= M.FLOORS) return { text: 'You found the treasure! 🏆', target: null };
    const k = this.nearestBreakable(g, 9999);
    if (k) return { text: 'Mine the rocks to find the ladder! 🪜', target: { x: k.x, y: k.y } };
    return null;
  },
  home(g) {
    if (!this.st) return;
    const st = this.st;
    this.closePanel();
    st.floor = null; st.obs = []; st.sleep = null; st.push = null; st.act = null; st.bits = []; st.splats = []; st.fade = 0; st.invuln = 0; st.blink = 0; st.bonkCd = 0;
    st.hearts = CFG.MINES.HEARTS; st.lastTheme = -1;
    if (g.s.mines) g.s.mines.cur = 0;
  },

  // ---------- going in, down and out ----------
  givePickaxe(g) {
    const s = this.save(g), M = CFG.MINES, st = this.st;
    if (s.pickaxe) return;
    s.pickaxe = true; st.minerHop = 1.4; st.minerSay = { text: 'Here\'s a pickaxe! ⛏️', t: 3.2 };
    const p = g.player;
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-16, 16), y0: p.y - 40 + U.rand(-10, 10), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
    this.say(g, M.MINER.x, M.MINER.y - 92, '⛏️', '#ffe08a', true, 1.6);
    Sfx.pickup(); Haptics.success();
  },
  enter(g) { this.givePickaxe(g); this.enterFloor(g, 1); },
  enterFloor(g, n, quiet) {
    if (!this.st) this.build(g);
    const M = CFG.MINES, st = this.st, s = g.s.mines, p = g.player;
    n = U.clamp(Math.round(n) || 1, 1, M.FLOORS);
    const f = this.generate(n);
    if (!f) return;
    this.closePanel();
    const W = M.WORLD;
    g.floats = g.floats.filter((x) => !(x.x > W.x0 && x.x < W.x1 && x.y > W.y0 - 200 && x.y < W.y1));   // the last floor's words stay behind
    st.floor = f; st.obs = this.buildObs(f); st.bits = []; st.splats = []; st.push = null; st.act = null; st.invuln = 0.8; st.blink = 0;
    if (s.trophy && f.chest) f.chest.open = true;
    g.area = 'mines'; p.x = f.arrival.x; p.y = f.arrival.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = quiet ? 0 : 0.45;
    s.cur = n; s.deepest = Math.max(s.deepest || 0, n);
    if (quiet) { st.lastTheme = f.themeIndex; return; }
    let dy = 0;
    const line = (text, color) => { this.say(g, p.x, p.y - 80 - dy, text, color, true, 2); dy += 24; };
    if (f.themeIndex !== st.lastTheme) line(f.theme.hello, '#ffe08a');
    st.lastTheme = f.themeIndex;
    if (n % 5 === 0 && !s.elevators.includes(n)) { s.elevators.push(n); s.elevators.sort((a, b) => a - b); line('🛗 Elevator!', '#9fe0ff'); }
    if (n >= 2 && !s.sword) { s.sword = true; line('A pizza sword! 🍕', '#ffd166'); }
    if (!s.seen) { s.seen = true; g.toast('⛏️ The Pizza Mine!', true); }
    Sfx.drop(); Haptics.tap();
    if (g.save) g.save();
  },
  goDown(g) {
    const f = this.st.floor; if (!f || !f.ladder) return;
    this.enterFloor(g, f.n + 1);
  },
  leave(g) {
    const M = CFG.MINES, p = g.player;
    this.home(g);
    g.area = 'site'; p.x = M.DOOR.x; p.y = M.DOOR.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.drop();
    if (g.save) g.save();
  },

  // ---------- mining, bonking, eating ----------
  whack(g, k) {
    const st = this.st, f = st.floor, p = g.player, th = f.theme;
    p.facing = k.x < p.x ? -1 : 1;
    st.act = { t: 0, kind: 'pick' };
    k.hp--; k.shake = 0.25;
    const cols = k.kind === 'crate' ? ['#c58a4a', '#9a6632', '#e0b070'] : [th.rock, th.rockHi, th.rockLo].concat(k.ore ? [CFG.MINES.ORES[k.ore].col] : []);
    for (let i = 0; i < 6; i++) st.bits.push({ x: k.x + U.rand(-10, 10), y: k.y + 6, z: 14 + U.rand(0, 10), vx: U.rand(-90, 90), vy: U.rand(-30, 40), vz: U.rand(90, 200), col: U.pick(cols), t: 0, life: U.rand(0.5, 0.8), s: U.rand(3, 5) });
    Sfx.tone(160 + Math.random() * 60, 0.06, 'square', 0.03, -40); Haptics.tap();
    if (k.hp <= 0) this.breakIt(g, k);
  },
  breakIt(g, k) {
    const st = this.st, f = st.floor, s = g.s.mines, M = CFG.MINES;
    f.grid[k.r * M.COLS + k.c] = 0;
    for (let i = 0; i < 8; i++) st.bits.push({ x: k.x + U.rand(-12, 12), y: k.y + U.rand(-4, 8), z: 10 + U.rand(0, 14), vx: U.rand(-140, 140), vy: U.rand(-50, 60), vz: U.rand(120, 260), col: k.kind === 'crate' ? U.pick(['#c58a4a', '#9a6632']) : U.pick([f.theme.rock, f.theme.rockHi, f.theme.rockLo]), t: 0, life: U.rand(0.6, 0.9), s: U.rand(3, 6) });
    let dy = 0;
    const line = (text, color, big = true) => { this.say(g, k.x, k.y - 40 - dy, text, color, big, 1.6); dy += 24; };
    if (k.kind === 'crate') {
      f.crates = f.crates.filter((c) => c !== k);
      if (k.snack) { f.snacks.push({ x: k.x, y: k.y + 4, t: 0 }); line('🍕', '#ffd166'); }
      else line('Crack!', '#ffe08a', false);
    } else {
      f.rocks = f.rocks.filter((r) => r !== k);
      f.broken++; s.rocks = (s.rocks || 0) + 1;
      if (k.ore) { s.ores[k.ore] = (s.ores[k.ore] || 0) + 1; s.found[k.ore] = true; const O = M.ORES[k.ore]; line(`+1 ${O.ico} ${k.ore}`, O.hi); }
      if (!f.ladder && f.n < M.FLOORS && (k.ladder || f.broken >= M.LADDER_BY)) {
        f.ladder = { x: k.x, y: k.y };
        line('🪜 A ladder!', '#9fe0ff');
        for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: k.x + U.rand(-14, 14), y0: k.y + U.rand(-12, 6), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
        Sfx.ding(); Haptics.success();
      }
    }
    st.obs = this.buildObs(f);
  },
  bonk(g, sl) {
    const st = this.st, f = st.floor, s = g.s.mines, p = g.player;
    p.facing = sl.x < p.x ? -1 : 1;
    st.act = { t: 0, kind: s.sword ? 'sword' : 'pick' };
    if (sl.hop) { sl.c = sl.hop.c; sl.r = sl.hop.r; const c = this.tileCenter(sl.c, sl.r); sl.x = c.x; sl.y = c.y; sl.hop = null; sl.z = 0; }
    sl.hp--; sl.stun = 0.9; sl.squish = 0.6; sl.wait = 1.2;
    if (sl.hp > 0) { this.say(g, sl.x, sl.y - 44, 'Bonk!', '#ffe08a', false, 1); Sfx.tone(420, 0.08, 'triangle', 0.04, 160); Haptics.tap(); return; }
    // pop! into a puddle of goo, which the chef scoops up
    f.slimes = f.slimes.filter((x) => x !== sl);
    st.splats.push({ x: sl.x, y: sl.y, t: 0, col: f.theme.slime });
    for (let i = 0; i < 8; i++) st.bits.push({ x: sl.x + U.rand(-8, 8), y: sl.y, z: 10, vx: U.rand(-120, 120), vy: U.rand(-40, 40), vz: U.rand(100, 220), col: f.theme.slime, t: 0, life: 0.7, s: U.rand(3, 5), round: true });
    s.goo = (s.goo || 0) + 1; s.found.goo = true; s.slimes = (s.slimes || 0) + 1;
    this.say(g, sl.x, sl.y - 46, 'Boing!', '#ffe08a', true, 1.4);
    this.say(g, sl.x, sl.y - 70, `+1 ${CFG.MINES.GOO.ico} goo`, '#b8f5a8', true, 1.6);
    Sfx.tone(300, 0.25, 'sine', 0.05, 500); Haptics.success();
  },
  hurt(g, sl) {
    const st = this.st, p = g.player;
    if (st.invuln > 0 || st.sleep || st.hearts <= 0) return;
    st.hearts--; st.invuln = 1.6; st.blink = 1.6; st.heartPop = { i: st.hearts, t: 0 };
    let dx = p.x - sl.x, dy = p.y - sl.y; const d = Math.hypot(dx, dy) || 1; if (d < 2) { dx = 0; dy = 1; } else { dx /= d; dy /= d; }
    st.push = { vx: dx * 280, vy: dy * 280, t: 0.18 };
    sl.stun = 1.2; sl.squish = 0.5;
    this.say(g, p.x, p.y - 74, 'Oof! 💥', '#ffb3a8', true, 1.2);
    Sfx.drop(); Haptics.tap();
    if (st.hearts <= 0) st.sleep = { t: 0, x: p.x, y: p.y, moved: false };
  },
  // no hearts left: the chef gets sleepy, and wakes up outside the mine with every rock still in his pockets
  wakeOutside(g) {
    const M = CFG.MINES, st = this.st, s = g.s.mines, p = g.player;
    this.closePanel();
    st.floor = null; st.obs = []; st.bits = []; st.splats = []; st.push = null; st.act = null; st.lastTheme = -1;
    st.hearts = M.HEARTS; st.invuln = 0; st.blink = 0; s.cur = 0; s.sleeps = (s.sleeps || 0) + 1;
    g.area = 'site'; p.x = M.DOOR.x; p.y = M.DOOR.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    if (g.save) g.save();
  },
  openChest(g) {
    const st = this.st, f = st.floor, s = g.s.mines;
    if (!f.chest || f.chest.open) return;
    f.chest.open = true; s.trophy = true;
    const c = f.chest;
    this.say(g, c.x, c.y - 70, '🏆 The golden pizza!', '#ffe066', true, 2.4);
    for (let i = 0; i < 8; i++) g.fx.push({ kind: 'sparkle', x0: c.x + U.rand(-26, 26), y0: c.y - 30 + U.rand(-20, 10), x1: 0, y1: 0, t: -i * 0.08, dur: 0.7 });
    st.act = { t: 0, kind: 'chest' };
    Sfx.unlock(); Haptics.success();
    if (g.save) g.save();
  },
  sell(g) {
    const s = g.s.mines, M = CFG.MINES, v = this.lootValue(g), p = g.player, st = this.st;
    if (v <= 0) return;
    s.ores = { copper: 0, iron: 0, gold: 0, gem: 0 }; s.goo = 0; s.sold = (s.sold || 0) + v;
    g.s.cash += v; g.s.stats.earned += v;
    for (let i = 0; i < Math.min(8, 2 + v); i++) g.fx.push({ kind: 'cash', x0: M.MINER.x + U.rand(-8, 8), y0: M.MINER.y - 30, x1: p.x, y1: p.y - 10, follow: true, t: -i * 0.06, dur: 0.6 });
    p.facing = M.MINER.x < p.x ? -1 : 1;
    this.say(g, p.x + 34, p.y - 70, '+' + U.money(v) + ' 💰', '#ffe066', true, 2);
    st.minerHop = 1.2; st.minerSay = { text: 'Thank you! 💰', t: 2.2 };
    Sfx.cash(); Haptics.success();
    if (g.save) g.save();
  },

  // ---------- the elevator panel (DOM, screen space) ----------
  buildPanel() {
    if (this.dom || typeof document === 'undefined' || !document.body) return;
    const host = document.getElementById('app') || document.body;
    const style = document.createElement('style');
    style.textContent = `
      #mines-panel { position: absolute; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 6;
        display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 22px;
        background: rgba(43, 29, 20, 0.92); box-shadow: 0 6px 18px rgba(0,0,0,0.4); width: max-content; max-width: calc(100vw - 24px); box-sizing: border-box; }
      #mines-panel.mp-hidden { display: none; }
      #mines-panel .mp-cage { font-size: 26px; padding: 0 2px; }
      #mines-panel button { width: 58px; height: 58px; border: 0; border-radius: 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 1px; font: 900 22px "Trebuchet MS", "Segoe UI", system-ui, sans-serif; line-height: 1; color: #2b1d14; box-shadow: 0 3px 0 rgba(0,0,0,0.35); -webkit-tap-highlight-color: transparent; }
      #mines-panel button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.35); }
      #mines-panel .mp-i { font-size: 15px; }
      #mines-panel .mp-t0 { background: #d9b48a; } #mines-panel .mp-t1 { background: #bfe6ff; } #mines-panel .mp-t2 { background: #d9c6ff; } #mines-panel .mp-t3 { background: #ffd966; }
      #mines-panel .mp-top { background: #9fe0a0; font-size: 28px; }
      #mines-panel .mp-x { background: #fff8ee; font-size: 24px; }
      #mines-panel .mp-here { box-shadow: 0 0 0 3px #fff, 0 3px 0 rgba(0,0,0,0.35); }
      @media (max-width: 480px) { #mines-panel { gap: 6px; padding: 8px; } #mines-panel button { width: 52px; height: 52px; font-size: 20px; } #mines-panel .mp-cage { display: none; } }
    `;
    document.head.appendChild(style);
    const el = document.createElement('div');
    el.id = 'mines-panel'; el.className = 'mp-hidden';
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) this.pickFloor(Game, b.dataset.f); });
    host.appendChild(el);
    this.dom = { el };
  },
  panelFloors(g) {
    const s = this.save(g);
    return [1].concat(s.elevators.filter((n) => n > 1)).filter((n, i, a) => a.indexOf(n) === i).sort((a, b) => a - b);
  },
  togglePanel(g) { if (this.st.panel) this.closePanel(); else this.openPanel(g); },
  openPanel(g) {
    this.buildPanel();
    const st = this.st, p = g.player, inside = g.area === 'mines', cur = inside && st.floor ? st.floor.n : 0;
    st.panel = { area: g.area, x: p.x, y: p.y };
    if (!this.dom) return;
    const btns = ['<span class="mp-cage">🛗</span>'];
    if (inside) btns.push('<button type="button" data-f="0" class="mp-top" aria-label="Outside">☀️</button>');
    for (const n of this.panelFloors(g)) btns.push(`<button type="button" data-f="${n}" class="mp-f mp-t${this.themeIndex(n)}${n === cur ? ' mp-here' : ''}" aria-label="Floor ${n}"><span class="mp-i">${this.theme(n).ico}</span>${n}</button>`);
    btns.push('<button type="button" data-f="x" class="mp-x" aria-label="Close">✕</button>');
    this.dom.el.innerHTML = btns.join('');
    this.dom.el.classList.remove('mp-hidden');
    Sfx.pickup(); Haptics.tap();
  },
  closePanel() {
    if (this.st) this.st.panel = null;
    if (this.dom) this.dom.el.classList.add('mp-hidden');
  },
  pickFloor(g, f) {
    if (f === 'x' || f === undefined) { this.closePanel(); return; }
    const n = Number(f);
    this.closePanel();
    if (n === 0) this.leave(g);
    else if (n >= 1) this.enterFloor(g, n);
  },

  // ---------- update ----------
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, M = CFG.MINES, p = g.player, s = g.s.mines;
    st.fade = Math.max(0, st.fade - dt); st.blink = Math.max(0, (st.blink || 0) - dt);
    st.minerHop = Math.max(0, st.minerHop - dt);
    if (st.minerSay) { st.minerSay.t -= dt; if (st.minerSay.t <= 0) st.minerSay = null; }
    if (st.act) { st.act.t += dt; if (st.act.t > 0.32) st.act = null; }
    if (st.heartPop) { st.heartPop.t += dt; if (st.heartPop.t > 0.6) st.heartPop = null; }
    this.stepBits(dt);
    // the elevator panel closes when you walk away from the elevator or the map changes
    if (st.panel && (g.area !== st.panel.area || U.dist(p.x, p.y, st.panel.x, st.panel.y) > 50)) this.closePanel();
    // sleepy time runs across the map change
    if (st.sleep) {
      const sl = st.sleep; sl.t += dt;
      if (!sl.moved) { p.x = sl.x; p.y = sl.y; p.moving = false; }
      if (!sl.moved && sl.t >= 1.2) { sl.moved = true; this.wakeOutside(g); }
      if (sl.t >= 2.6) { st.sleep = null; if (g.area === 'site') this.say(g, p.x, p.y - 80, 'Good morning! ☀️', '#ffe08a', true, 1.8); }
      return;
    }
    if (g.area !== 'mines') {
      if (st.floor) { st.floor = null; st.obs = []; st.hearts = M.HEARTS; st.splats = []; st.lastTheme = -1; if (s.cur) s.cur = 0; }   // left some other way: hearts refill
      if (g.area === 'site' && this.onFoot(g)) {
        if (!s.pickaxe && U.dist(p.x, p.y, M.MINER.x, M.MINER.y) < M.GIFT_R) this.givePickaxe(g);
        // a reload or a push that left the chef inside the hill puts him on the mat
        const B = M.HILL_BOX;
        if (p.x > B.x + 6 && p.x < B.x + B.w - 6 && p.y > B.y + 6 && p.y < B.y + B.h - 6) { p.x = M.DOOR.x; p.y = M.DOOR.y; p.moving = false; }
      }
      return;
    }
    if (!st.floor) this.enterFloor(g, s.cur || 1, true);
    const f = st.floor; if (!f) return;
    st.invuln = Math.max(0, st.invuln - dt);
    // the knock-back from a slime
    if (st.push) { st.push.t -= dt; this.tryMove(g, st.push.vx * dt, st.push.vy * dt); if (st.push.t <= 0) st.push = null; }
    // rescue: never inside a rock or a wall
    if (st.obs.some((o) => g.hitRect(p.x, p.y, 11, o))) {
      p.x = f.arrival.x; p.y = f.arrival.y; p.moving = false; st.push = null;
      this.say(g, p.x, p.y - 70, 'Oops! 🪜', '#ffe08a', true, 1.2);
    }
    for (const k of f.rocks) k.shake = Math.max(0, k.shake - dt);
    for (const k of f.crates) k.shake = Math.max(0, k.shake - dt);
    for (const sl of f.slimes) this.stepSlime(g, f, sl, dt);
    this.autoBonk(g, dt);
    // snacks: walk over one to eat it (a heart back)
    for (const sn of f.snacks) sn.t += dt;
    const ate = f.snacks.find((sn) => sn.t > 0.4 && U.dist(p.x, p.y, sn.x, sn.y) < 28);
    if (ate) {
      f.snacks = f.snacks.filter((x) => x !== ate);
      st.hearts = Math.min(M.HEARTS, st.hearts + 1);
      this.say(g, p.x, p.y - 80, 'Yum! ❤️', '#ffb3c8', true, 1.4);
      Sfx.pickup(); Haptics.tap();
    }
    for (const sp of st.splats) sp.t += dt;
    st.splats = st.splats.filter((sp) => sp.t < 2.5);
  },
  // auto attack: a slime within reach gets bonked on its own, every AUTO_BONK seconds (pickaxe or sword in hand)
  autoBonk(g, dt) {
    const st = this.st, s = g.s.mines;
    st.bonkCd = Math.max(0, (st.bonkCd || 0) - dt);
    if (st.bonkCd > 0 || st.sleep || !st.floor || !(s.pickaxe || s.sword) || !this.onFoot(g)) return;
    const sl = this.nearestSlime(g);
    if (!sl) return;
    st.bonkCd = CFG.MINES.AUTO_BONK;
    this.bonk(g, sl);
  },
  stepSlime(g, f, sl, dt) {
    const p = g.player, st = this.st;
    sl.phase += dt; sl.stun = Math.max(0, sl.stun - dt); sl.squish = Math.max(0, sl.squish - dt * 2.5);
    if (sl.hop) {
      const h = sl.hop; h.t += dt; const k = Math.min(1, h.t / h.dur);
      sl.x = U.lerp(h.x0, h.x1, k); sl.y = U.lerp(h.y0, h.y1, k); sl.z = Math.sin(k * Math.PI) * 18;
      if (k >= 1) { sl.c = h.c; sl.r = h.r; sl.hop = null; sl.z = 0; sl.squish = 0.45; sl.wait = U.rand(CFG.MINES.SLIME_WAIT[0], CFG.MINES.SLIME_WAIT[1]); }
    } else if (sl.stun <= 0) {
      sl.wait -= dt;
      if (sl.wait <= 0) {
        const dirs = this.DIRS.slice().sort(() => Math.random() - 0.5);
        if (U.dist(p.x, p.y, sl.x, sl.y) < 220 && Math.random() < CFG.MINES.SLIME_CHASE) dirs.sort((a, b) => U.dist(p.x, p.y, sl.x + a[0] * 50, sl.y + a[1] * 50) - U.dist(p.x, p.y, sl.x + b[0] * 50, sl.y + b[1] * 50));
        const d = dirs.find(([dx, dy]) => this.slimeTile(f, sl.c + dx, sl.r + dy));
        if (d) { const to = this.tileCenter(sl.c + d[0], sl.r + d[1]); sl.hop = { t: 0, dur: CFG.MINES.SLIME_HOP, x0: sl.x, y0: sl.y, x1: to.x, y1: to.y, c: sl.c + d[0], r: sl.r + d[1] }; if (d[0]) sl.face = d[0]; }
        else sl.wait = 0.6;
      }
    }
    // a bump: the chef bounces back and loses a heart (never while the slime is dizzy from a bonk)
    if (sl.z < 8 && sl.stun <= 0 && st.invuln <= 0 && U.dist(p.x, p.y, sl.x, sl.y) < CFG.MINES.TOUCH_R) this.hurt(g, sl);
  },
  stepBits(dt) {
    const st = this.st;
    for (const b of st.bits) {
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= 620 * dt;
      if (b.z < 0) { b.z = 0; b.vz = -b.vz * 0.3; b.vx *= 0.5; b.vy *= 0.5; }
    }
    st.bits = st.bits.filter((b) => b.t < b.life);
  },

  // ======================= render: outside (the hillside in Construction Town) =======================
  paintAfter(r, g, area) { if (area === 'site') this.paintHill(r); },
  paintHill(r) {
    const ctx = r.ctx, M = CFG.MINES, H = M.HILL, S = M.SHAFT;
    const pts = [[H.x0, H.base], [H.x0 + 8, -40], [4168, -88], [4222, -114], [4296, H.top], [4366, -112], [4418, -84], [H.x1 - 6, -38], [H.x1, H.base]];
    const hillPath = (ox, oy) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
      for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0] + ox, pts[i][1] + oy, mx + ox, my + oy); }
      ctx.lineTo(pts[pts.length - 1][0] + ox, pts[pts.length - 1][1] + oy); ctx.closePath();
    };
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; hillPath(6, 8); ctx.fill();
    ctx.fillStyle = '#8f7b67'; hillPath(0, 0); ctx.fill();
    ctx.save(); hillPath(0, 0); ctx.clip();
    // grass on the top, rocks and shading on the face
    ctx.fillStyle = '#6fae55'; ctx.fillRect(H.x0, H.top - 4, H.x1 - H.x0, H.base - H.top + 8);
    ctx.fillStyle = '#8f7b67'; hillPath(0, 12); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(H.x0, -30, H.x1 - H.x0, 40);
    const blobs = [[4150, -20, 16], [4184, -60, 20], [4236, -86, 18], [4250, -30, 14], [4338, -86, 20], [4396, -64, 16], [4430, -18, 14], [4196, -12, 12], [4356, -40, 12], [4290, -96, 16]];
    for (const [x, y, rr] of blobs) {
      ctx.fillStyle = '#6f5f50'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, rr, rr * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8927c'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x - rr * 0.3, y - rr * 0.3, rr * 0.4, rr * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // grass tufts along the ridge
    ctx.fillStyle = '#5f9c48';
    for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i]; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 9 - 4, y + 8); ctx.lineTo(x + k * 9, y - 2); ctx.lineTo(x + k * 9 + 4, y + 8); ctx.closePath(); ctx.fill(); } }
    // the cart track from inside the shaft down to the road
    ctx.fillStyle = '#7a5230'; for (let y = S.top + 14; y < 40; y += 9) ctx.fillRect(S.x - 15, y, 30, 4);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(S.x - 11, S.top + 10, 3, 40 - S.top - 10); ctx.fillRect(S.x + 8, S.top + 10, 3, 40 - S.top - 10);
    // the shaft: a dark opening in a wooden frame
    const sx0 = S.x - S.half, sx1 = S.x + S.half;
    ctx.fillStyle = '#1d140d'; ctx.beginPath(); ctx.moveTo(sx0, S.base); ctx.lineTo(sx0, S.top + 12); ctx.quadraticCurveTo(S.x, S.top - 8, sx1, S.top + 12); ctx.lineTo(sx1, S.base); ctx.closePath(); ctx.fill();
    const glow = ctx.createLinearGradient(0, S.top, 0, S.base); glow.addColorStop(0, 'rgba(0,0,0,0)'); glow.addColorStop(1, 'rgba(255,190,90,0.18)');
    ctx.fillStyle = glow; ctx.fillRect(sx0, S.top, sx1 - sx0, S.base - S.top);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(S.x - 11, S.top + 10, 3, S.base - S.top - 10); ctx.fillRect(S.x + 8, S.top + 10, 3, S.base - S.top - 10);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(sx0 - 6, S.top - 2, 8, S.base - S.top + 2); ctx.fillRect(sx1 - 2, S.top - 2, 8, S.base - S.top + 2);
    ctx.fillStyle = '#a86d36'; ctx.fillRect(sx0 - 12, S.top - 10, sx1 - sx0 + 24, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(sx0 - 12, S.top - 2, sx1 - sx0 + 24, 2); ctx.fillRect(sx0 - 6, S.top, 2, S.base - S.top); ctx.fillRect(sx1 + 4, S.top, 2, S.base - S.top);
    // a sign over the frame: a pickaxe and a slice
    ctx.fillStyle = '#e0b070'; U.roundRect(ctx, S.x - 22, S.top - 30, 44, 20, 4); ctx.fill();
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('⛏️🍕', S.x, S.top - 19);
    // the lantern hanging on the frame (its glow pulses live)
    const L = M.LANTERN;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L.x - 4, S.top - 4); ctx.lineTo(L.x, L.y - 8); ctx.stroke();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(L.x - 5, L.y - 9, 10, 3); ctx.fillRect(L.x - 5, L.y + 7, 10, 3);
    ctx.fillStyle = '#ffd36a'; U.roundRect(ctx, L.x - 4, L.y - 6, 8, 13, 2); ctx.fill();
    // a little mine cart full of shiny rocks on a siding
    const K = M.CART;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(K.x + 2, K.y + 8, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(K.x - 10, K.y + 6, 4, 0, Math.PI * 2); ctx.arc(K.x + 10, K.y + 6, 4, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy, c] of [[-8, -12, '#d9773a'], [2, -14, '#ffcf33'], [10, -11, '#4fe8ff'], [-2, -10, '#9a8878']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(K.x + dx, K.y + dy, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#6b7783'; ctx.beginPath(); ctx.moveTo(K.x - 18, K.y - 10); ctx.lineTo(K.x + 18, K.y - 10); ctx.lineTo(K.x + 14, K.y + 4); ctx.lineTo(K.x - 14, K.y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8c97a3'; ctx.fillRect(K.x - 18, K.y - 10, 36, 3);
    // the elevator cage: a yellow frame, grey doors with a window, an arrow light
    const E = M.CAGE, ew = E.x1 - E.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(E.x0 + 4, E.top + 4, ew, E.base - E.top);
    ctx.fillStyle = '#f2b705'; ctx.fillRect(E.x0, E.top, ew, E.base - E.top);
    ctx.fillStyle = '#2b1d14'; for (let x = E.x0; x < E.x1; x += 10) ctx.fillRect(x, E.top, 5, 6);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(E.x0 + 5, E.top + 12, ew - 10, E.base - E.top - 12);
    ctx.fillStyle = '#7c8691'; ctx.fillRect(E.x0 + ew / 2 - 1, E.top + 12, 2, E.base - E.top - 12);
    ctx.fillStyle = '#bfe6ff'; ctx.fillRect(E.x0 + 9, E.top + 18, 10, 12); ctx.fillRect(E.x1 - 19, E.top + 18, 10, 12);
    ctx.fillStyle = '#5c6670'; for (let y = E.top + 36; y < E.base - 4; y += 6) ctx.fillRect(E.x0 + 7, y, ew - 14, 1.5);
    // the rock collection shelf (its rocks are drawn live) and a pickaxe leaning on the hill
    const SH = M.SHELF;
    ctx.fillStyle = '#7a5230'; ctx.fillRect(SH.x0, SH.y0, SH.x1 - SH.x0, SH.y1 - SH.y0);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(SH.x0 + 3, SH.y0 + 3, SH.x1 - SH.x0 - 6, SH.y1 - SH.y0 - 6);
    ctx.fillStyle = '#c58a4a'; ctx.fillRect(SH.x0, SH.y0 + 19, SH.x1 - SH.x0, 3); ctx.fillRect(SH.x0, SH.y1 - 3, SH.x1 - SH.x0, 3);
    ctx.save(); ctx.translate(4240, -4); ctx.rotate(-0.35);
    ctx.fillStyle = '#a86d36'; ctx.fillRect(-2, -26, 4, 28);
    ctx.fillStyle = '#8c97a3'; ctx.beginPath(); ctx.moveTo(-14, -22); ctx.quadraticCurveTo(0, -32, 14, -22); ctx.lineTo(12, -20); ctx.quadraticCurveTo(0, -27, -12, -20); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  // the rock collection: one of each thing ever found, and the golden pizza once the chest is open
  drawShelf(r, g) {
    const ctx = r.ctx, M = CFG.MINES, SH = M.SHELF, s = g.s.mines, O = M.ORES;
    const slots = [['copper', O.copper.col], ['iron', O.iron.col], ['gold', O.gold.col], ['gem', O.gem.col], ['goo', M.GOO.col], ['trophy', '#ffcf33']];
    slots.forEach(([k, col], i) => {
      const x = SH.x0 + 11 + (i % 3) * 18, y = SH.y0 + 14 + Math.floor(i / 3) * 20;
      const got = k === 'trophy' ? s.trophy : s.found[k];
      if (!got) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); return; }
      if (k === 'gem') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 6, y - 1); ctx.lineTo(x, y + 5); ctx.lineTo(x - 6, y - 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 2, y - 4, 2, 3); return; }
      if (k === 'goo') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 6, y + 4); ctx.quadraticCurveTo(x - 6, y - 7, x, y - 7); ctx.quadraticCurveTo(x + 6, y - 7, x + 6, y + 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 3, y - 2, 1.5, 2); ctx.fillRect(x + 2, y - 2, 1.5, 2); return; }
      if (k === 'trophy') { this.drawGoldenPizza(ctx, x, y - 1, 7, g.time); return; }
      ctx.fillStyle = '#7d6d60'; ctx.beginPath(); ctx.ellipse(x, y, 7, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - 2, y - 1, 2.4, 0, Math.PI * 2); ctx.arc(x + 3, y + 1, 2, 0, Math.PI * 2); ctx.fill();
    });
  },
  drawGoldenPizza(ctx, x, y, rad, t) {
    ctx.fillStyle = '#c99a1e'; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y, rad * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a20c'; for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rad * 0.45, y + Math.sin(a) * rad * 0.45, rad * 0.16, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = `rgba(255,255,255,${(0.5 + 0.4 * Math.sin(t * 3)).toFixed(2)})`; ctx.beginPath(); ctx.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.18, 0, Math.PI * 2); ctx.fill();
  },
  drawMiner(r, g) {
    const ctx = r.ctx, M = CFG.MINES, st = this.st, t = g.time, p = g.player;
    const hop = st.minerHop > 0 ? Math.abs(Math.sin(t * 8)) * 5 : 0, x = M.MINER.x, y = M.MINER.y - hop;
    const facing = g.area === 'site' && p.x < x - 6 ? -1 : 1;
    r.drawPerson(x, y, { shirt: '#3b7dd8', apron: '#8d5a2b', skin: '#f1c27d', hat: 'cap', capColor: '#f2b705', beard: '#e8e2d8', facing, moving: false, bob: 0, carry: 0, pants: '#5b4636' });
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x + facing * 4, y - 46, 3, 0, Math.PI * 2); ctx.fill();   // the head lamp on his hard hat
    ctx.fillStyle = 'rgba(255,240,150,0.25)'; ctx.beginPath(); ctx.arc(x + facing * 4, y - 46, 7, 0, Math.PI * 2); ctx.fill();
    if (st.minerSay) {
      const text = st.minerSay.text;
      r.drawBubble(x, M.MINER.y - 76, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, Math.max(60, text.length * 7));
    } else if (this.lootValue(g) > 0 && U.dist(p.x, p.y, x, M.MINER.y) < 160) {
      r.drawBubble(x, M.MINER.y - 76 + Math.sin(t * 4) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('💰', 0, 0); }, 30);
    }
  },

  // ======================= render: the mine floor (static background per floor) =======================
  bgKey(g) { return g.area === 'mines' && this.st && this.st.floor ? 'mines' + this.st.floor.n : ''; },
  paint: { mines(r, g) { MinesExt.paintMine(r, g); } },
  paintMine(r, g) {
    const ctx = r.ctx, M = CFG.MINES, W = M.WORLD, T = M.TILE, C = M.COLS, R = M.ROWS, f = this.st && this.st.floor;
    const th = f ? f.theme : M.THEMES[0];
    ctx.fillStyle = th.wallLo; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    if (!f) return;
    const rnd = this.rng(f.n * 31 + 7), wall = (c, r2) => c < 0 || r2 < 0 || c >= C || r2 >= R || f.grid[r2 * C + c] === 1;
    // the floor: soft patches of two tones, pebbles and specks
    ctx.fillStyle = th.floor; ctx.fillRect(W.x0 + T, W.y0 + T, (C - 2) * T, (R - 2) * T);
    ctx.fillStyle = th.floor2; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.ellipse(W.x0 + T + rnd() * (C - 2) * T, W.y0 + T + rnd() * (R - 2) * T, 30 + rnd() * 50, 18 + rnd() * 26, rnd() * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 260; i++) {
      const x = W.x0 + T + rnd() * (W.x1 - W.x0 - 2 * T), y = W.y0 + T + rnd() * (W.y1 - W.y0 - 2 * T);
      if (wall(Math.floor((x - W.x0) / T), Math.floor((y - W.y0) / T))) continue;
      ctx.fillStyle = i % 3 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(x, y, 2 + rnd() * 4, 1.5 + rnd() * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (th.key === 'pizza') {   // cheesy floor: little sauce spots and basil leaves
      for (let i = 0; i < 40; i++) {
        const x = W.x0 + T + rnd() * (W.x1 - W.x0 - 2 * T), y = W.y0 + T + rnd() * (W.y1 - W.y0 - 2 * T);
        if (wall(Math.floor((x - W.x0) / T), Math.floor((y - W.y0) / T))) continue;
        ctx.fillStyle = i % 4 ? 'rgba(214,72,50,0.35)' : '#4c9a3c'; ctx.beginPath(); ctx.ellipse(x, y, i % 4 ? 6 : 4, i % 4 ? 4 : 2.5, rnd() * 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (th.key === 'ice') {   // shiny ice patches
      for (let i = 0; i < 18; i++) {
        const x = W.x0 + T + rnd() * (W.x1 - W.x0 - 2 * T), y = W.y0 + T + rnd() * (W.y1 - W.y0 - 2 * T);
        if (wall(Math.floor((x - W.x0) / T), Math.floor((y - W.y0) / T))) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x, y, 14, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      }
    }
    // walls: rounded rocky blocks with a front face where the floor is in front of them
    for (let r2 = 0; r2 < R; r2++) for (let c = 0; c < C; c++) {
      if (!wall(c, r2)) continue;
      const x = W.x0 + c * T, y = W.y0 + r2 * T;
      ctx.fillStyle = th.wall; U.roundRect(ctx, x - 4, y - 4, T + 8, T + 8, 14); ctx.fill();
    }
    for (let r2 = 0; r2 < R; r2++) for (let c = 0; c < C; c++) {
      if (!wall(c, r2)) continue;
      const x = W.x0 + c * T, y = W.y0 + r2 * T;
      for (let k = 0; k < 2; k++) { ctx.fillStyle = k ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.ellipse(x + 10 + rnd() * 30, y + 8 + rnd() * 22, 6 + rnd() * 6, 4 + rnd() * 3, 0, 0, Math.PI * 2); ctx.fill(); }
      if (r2 < R - 1 && !wall(c, r2 + 1)) {
        ctx.fillStyle = th.wallLo; ctx.fillRect(x - 2, y + T - 20, T + 4, 20);
        ctx.fillStyle = th.wallHi; ctx.fillRect(x - 2, y + T - 22, T + 4, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 2, y + T, T + 4, 4);
        this.paintWallDecor(ctx, th, x, y + T, rnd, c, r2);
      }
    }
    // the way back up: a ladder into a sunny hole in the back wall
    const ux = W.x0 + f.ax * T, uy = W.y0;
    ctx.fillStyle = '#1d140d'; U.roundRect(ctx, ux + 9, uy + 6, T - 18, T - 4, 8); ctx.fill();
    const sun = ctx.createLinearGradient(0, uy + 6, 0, uy + T + 4); sun.addColorStop(0, 'rgba(255,240,170,0.9)'); sun.addColorStop(1, 'rgba(255,240,170,0.1)');
    ctx.fillStyle = sun; U.roundRect(ctx, ux + 9, uy + 6, T - 18, T - 4, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,170,0.18)'; ctx.beginPath(); ctx.ellipse(ux + T / 2, uy + T + 18, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a86d36'; ctx.fillRect(ux + 15, uy + 2, 4, T + 12); ctx.fillRect(ux + T - 19, uy + 2, 4, T + 12);
    for (let y = uy + 8; y < uy + T + 12; y += 9) ctx.fillRect(ux + 15, y, T - 30, 3);
    ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☀️', ux + T / 2, uy + 12);
    // the floor number on a little plank beside it
    const px = ux + (f.ax < C - 3 ? T + 6 : -42);
    ctx.fillStyle = '#e0b070'; U.roundRect(ctx, px, uy + 14, 36, 22, 5); ctx.fill(); ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(14); ctx.fillText(String(f.n), px + 18, uy + 26);
    // the elevator in the back wall
    if (f.elevator) {
      const ex = W.x0 + f.elevator.c * T;
      ctx.fillStyle = '#f2b705'; ctx.fillRect(ex + 4, uy + 2, T - 8, T + 2);
      ctx.fillStyle = '#2b1d14'; for (let x = ex + 4; x < ex + T - 4; x += 8) ctx.fillRect(x, uy + 2, 4, 5);
      ctx.fillStyle = '#9aa3ad'; ctx.fillRect(ex + 9, uy + 10, T - 18, T - 6);
      ctx.fillStyle = '#7c8691'; ctx.fillRect(ex + T / 2 - 1, uy + 10, 2, T - 6);
      ctx.fillStyle = '#bfe6ff'; ctx.fillRect(ex + 13, uy + 15, 8, 9); ctx.fillRect(ex + T - 21, uy + 15, 8, 9);
      ctx.fillStyle = 'rgba(255,224,138,0.25)'; ctx.beginPath(); ctx.ellipse(ex + T / 2, uy + T + 16, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  paintWallDecor(ctx, th, x, y, rnd, c, r2) {
    const T = CFG.MINES.TILE, v = rnd();
    if (th.key === 'ice') {   // icicles
      ctx.fillStyle = 'rgba(240,250,255,0.95)';
      for (let k = 0; k < 3; k++) { const ix = x + 8 + k * 16 + rnd() * 6, len = 8 + rnd() * 10; ctx.beginPath(); ctx.moveTo(ix - 4, y - 2); ctx.lineTo(ix + 4, y - 2); ctx.lineTo(ix, y - 2 + len); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 24, T + 4, 4);
    } else if (th.key === 'crystal') {   // glowing crystals
      if (v < 0.55) {
        const cx = x + 10 + rnd() * 30, col = rnd() < 0.5 ? '#7ff0ff' : '#ff9ae6';
        ctx.fillStyle = col === '#7ff0ff' ? 'rgba(127,240,255,0.25)' : 'rgba(255,154,230,0.25)'; ctx.beginPath(); ctx.arc(cx, y - 14, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
        for (const [dx, h, w] of [[-6, 16, 5], [0, 22, 6], [7, 14, 5]]) { ctx.beginPath(); ctx.moveTo(cx + dx - w / 2, y - 4); ctx.lineTo(cx + dx, y - 4 - h); ctx.lineTo(cx + dx + w / 2, y - 4); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(cx - 1, y - 20, 1.5, 10);
      }
    } else if (th.key === 'pizza') {   // pepperoni slices stuck in the crust and cheese dripping
      if (v < 0.6) { const cx = x + 12 + rnd() * 26; ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(cx, y - 32, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#922b21'; ctx.beginPath(); ctx.arc(cx - 2, y - 33, 1.6, 0, Math.PI * 2); ctx.arc(cx + 3, y - 30, 1.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffe680';
      for (let k = 0; k < 2; k++) { const dx = x + 6 + rnd() * 38, len = 6 + rnd() * 10; ctx.fillRect(dx, y - 20, 5, len); ctx.beginPath(); ctx.arc(dx + 2.5, y - 20 + len, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffe680'; ctx.fillRect(x - 2, y - 22, T + 4, 4);
    } else {   // earth: wooden support posts now and then
      if ((c + r2) % 4 === 0) { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x + 4, y - 20, 6, 20); ctx.fillRect(x + T - 10, y - 20, 6, 20); ctx.fillStyle = '#a86d36'; ctx.fillRect(x, y - 24, T, 6); }
    }
  },

  // ======================= render: live things =======================
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'site') {
      const L = CFG.MINES.LANTERN, k = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.fillStyle = `rgba(255,214,110,${(0.16 + k * 0.1).toFixed(3)})`; ctx.beginPath(); ctx.arc(L.x, L.y, 12 + k * 4, 0, Math.PI * 2); ctx.fill();
      this.drawShelf(r, g);
      return;
    }
    if (g.area !== 'mines' || !this.st.floor) return;
    const f = this.st.floor;
    for (const sp of this.st.splats) {   // goo puddles left by popped slimes
      const a = 1 - Math.max(0, (sp.t - 1.5) / 1);
      ctx.globalAlpha = Math.max(0, a) * 0.8; ctx.fillStyle = sp.col;
      ctx.beginPath(); ctx.ellipse(sp.x, sp.y + 4, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sp.x - 18, sp.y - 2, 4, 0, Math.PI * 2); ctx.arc(sp.x + 20, sp.y + 8, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (f.ladder) this.drawLadderHole(ctx, f.ladder.x, f.ladder.y, t);
    for (const sn of f.snacks) this.drawSlice(ctx, sn.x, sn.y - 6 - Math.abs(Math.sin(t * 3)) * 4 - Math.max(0, 0.4 - sn.t) * 40, 1);
  },
  drawLadderHole(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#120c08'; ctx.beginPath(); ctx.ellipse(x, y, 22, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a86d36'; ctx.fillRect(x - 11, y - 18, 4, 24); ctx.fillRect(x + 7, y - 18, 4, 24);
    for (let k = 0; k < 3; k++) ctx.fillRect(x - 11, y - 14 + k * 8, 22, 3);
    const k = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.strokeStyle = `rgba(159,224,255,${(0.35 + k * 0.4).toFixed(3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 26 + k * 4, 16 + k * 2, 0, 0, Math.PI * 2); ctx.stroke();
  },
  drawSlice(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(1, 14, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd966'; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-11, -10); ctx.quadraticCurveTo(0, -15, 11, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c98a3a'; ctx.beginPath(); ctx.moveTo(-12, -10); ctx.quadraticCurveTo(0, -17, 12, -10); ctx.lineTo(11, -7); ctx.quadraticCurveTo(0, -13, -11, -7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-3, -4, 2.6, 0, Math.PI * 2); ctx.arc(3, 1, 2.2, 0, Math.PI * 2); ctx.arc(0, -8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, ctx = r.ctx;
    if (g.area === 'site') items.push({ y: CFG.MINES.MINER.y, draw: () => this.drawMiner(r, g) });
    if (g.area !== 'mines' || !st.floor) return;
    const f = st.floor;
    for (const k of f.rocks) items.push({ y: k.y + 14, draw: () => this.drawRock(r, g, f, k) });
    for (const k of f.crates) items.push({ y: k.y + 14, draw: () => this.drawCrate(r, k) });
    if (f.chest) items.push({ y: f.chest.y + 14, draw: () => this.drawChest(r, g, f.chest) });
    for (const sl of f.slimes) items.push({ y: sl.y + 6, draw: () => this.drawSlime(r, g, f, sl) });
    // the chef's hop (mining, bonking) and his blink after a bump: wrap the core's chef drawing
    const hop = st.act ? Math.sin(Math.min(1, st.act.t / 0.32) * Math.PI) * 9 : 0;
    const blink = st.blink > 0 && Math.floor(st.blink * 10) % 2 === 0;
    if ((hop || blink) && !g.driving && !g.onTrain) {
      items.push({ y: p.y - 0.001, draw: () => { ctx.save(); ctx.translate(0, -hop); if (blink) ctx.globalAlpha = 0.45; } });
      items.push({ y: p.y + 0.001, draw: () => ctx.restore() });
    }
  },
  rockPath(ctx, x, y, rad, shape) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i % 8) / 8 * Math.PI * 2 - Math.PI / 2, rr = rad * shape[i % 8], px = x + Math.cos(a) * rr * 1.1, py = y + Math.sin(a) * rr * 0.85;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  },
  drawRock(r, g, f, k) {
    const ctx = r.ctx, th = f.theme, sx = k.shake > 0 ? Math.sin(k.shake * 70) * 3 : 0, x = k.x + sx, y = k.y - 4;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(k.x + 3, k.y + 12, 21, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = th.rockLo; this.rockPath(ctx, x, y + 4, 19, k.shape); ctx.fill();
    ctx.fillStyle = th.rock; this.rockPath(ctx, x, y, 18, k.shape); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.stroke();
    if (th.key === 'pizza') {   // pepperoni rocks: darker spots
      ctx.fillStyle = th.rockLo; for (const [dx, dy] of [[-8, -6], [6, -10], [2, 2], [-4, 6]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.6, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = th.rockHi; ctx.beginPath(); ctx.ellipse(x - 6, y - 8, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    if (th.key === 'ice') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x, y - 12, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    if (k.ore) {
      const O = CFG.MINES.ORES[k.ore];
      for (const sp of k.specks) {
        const px = x + sp.dx, py = y + sp.dy + 6;
        if (k.ore === 'gem') { ctx.fillStyle = O.col; ctx.beginPath(); ctx.moveTo(px, py - sp.s - 2); ctx.lineTo(px + sp.s, py); ctx.lineTo(px, py + sp.s); ctx.lineTo(px - sp.s, py); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,60,80,0.5)'; ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(43,29,20,0.35)'; ctx.beginPath(); ctx.arc(px + 0.6, py + 0.8, sp.s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = O.col; ctx.beginPath(); ctx.arc(px, py, sp.s, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = O.hi; ctx.fillRect(px - 1, py - 1.5, 1.6, 1.6);
      }
    }
    // cracks show how many whacks it has taken
    const hits = k.max - k.hp;
    if (hits > 0) {
      ctx.strokeStyle = 'rgba(30,20,12,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(x - 2, y - 14); ctx.lineTo(x + 2, y - 6); ctx.lineTo(x - 3, y + 1); ctx.lineTo(x + 1, y + 8);
      if (hits > 1) { ctx.moveTo(x + 2, y - 6); ctx.lineTo(x + 10, y - 4); ctx.moveTo(x - 3, y + 1); ctx.lineTo(x - 11, y + 3); }
      ctx.stroke();
    }
  },
  drawCrate(r, k) {
    const ctx = r.ctx, sx = k.shake > 0 ? Math.sin(k.shake * 70) * 3 : 0, x = k.x + sx, y = k.y - 2;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(k.x + 3, k.y + 12, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a6632'; ctx.fillRect(x - 17, y - 16, 34, 28);
    ctx.fillStyle = '#c58a4a'; ctx.fillRect(x - 15, y - 14, 30, 24);
    ctx.fillStyle = '#9a6632'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 15, y - 9 + i * 8, 30, 1.5);
    ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y - 13); ctx.lineTo(x + 14, y + 9); ctx.stroke();
    ctx.fillStyle = '#e0b070'; ctx.fillRect(x - 17, y - 16, 34, 3);
  },
  drawChest(r, g, c) {
    const ctx = r.ctx, x = c.x, y = c.y, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 14, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
    if (!c.open) { const k = 0.5 + 0.5 * Math.sin(t * 3); ctx.fillStyle = `rgba(255,224,102,${(0.18 + k * 0.18).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(x, y - 4, 40, 30, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 24, y - 14, 48, 26);
    ctx.fillStyle = '#ffcf33'; ctx.fillRect(x - 24, y - 14, 48, 4); ctx.fillRect(x - 24, y + 8, 48, 4); ctx.fillRect(x - 3, y - 14, 6, 26);
    if (c.open) {
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 22, y - 20, 44, 8);
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 24, y - 40, 48, 20); ctx.fillStyle = '#ffcf33'; ctx.fillRect(x - 24, y - 40, 48, 4); ctx.fillRect(x - 3, y - 40, 6, 20);
      const k = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(255,236,140,${(0.3 + k * 0.25).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y - 52, 22, 0, Math.PI * 2); ctx.fill();
      this.drawGoldenPizza(ctx, x, y - 52 - k * 4, 14, t);
    } else {
      ctx.fillStyle = '#a86d36'; ctx.beginPath(); ctx.moveTo(x - 24, y - 14); ctx.quadraticCurveTo(x, y - 34, x + 24, y - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcf33'; ctx.fillRect(x - 3, y - 26, 6, 12);
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x, y - 8, 3, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawSlime(r, g, f, sl) {
    const ctx = r.ctx, col = f.theme.slime, t = g.time;
    const wob = sl.hop ? -0.12 : Math.sin(sl.phase * 5) * 0.05, sq = sl.squish * 0.35 + wob;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sl.x, sl.y + 3, 17 * (1 - sl.z / 60), 6 * (1 - sl.z / 60), 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(sl.x, sl.y + 2 - sl.z); ctx.scale(1 + sq, 1 - sq);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-19, -28, 0, -29); ctx.quadraticCurveTo(19, -28, 18, 0); ctx.quadraticCurveTo(0, 4, -18, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-8, -20, 5, 3, -0.5, 0, Math.PI * 2); ctx.fill();
    const fx = sl.face * 2;
    if (sl.stun > 0) {   // dizzy little x-eyes and a wobbly mouth
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2;
      for (const ex of [-6, 6]) { ctx.beginPath(); ctx.moveTo(fx + ex - 3, -15); ctx.lineTo(fx + ex + 3, -9); ctx.moveTo(fx + ex + 3, -15); ctx.lineTo(fx + ex - 3, -9); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#2b1d14'; for (const ex of [-6, 6]) { ctx.beginPath(); ctx.ellipse(fx + ex, -12, 2.6, 3.4, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff'; for (const ex of [-6, 6]) { ctx.beginPath(); ctx.arc(fx + ex + 0.8, -13.4, 1, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(fx, -7, 3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,120,150,0.4)'; ctx.beginPath(); ctx.arc(fx - 11, -7, 2.4, 0, Math.PI * 2); ctx.arc(fx + 11, -7, 2.4, 0, Math.PI * 2); ctx.fill();
    if (f.theme.key === 'pizza') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-4, -24, 3, 0, Math.PI * 2); ctx.arc(6, -22, 2.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (sl.stun > 0) {   // little stars circling its head
      ctx.fillStyle = '#ffe066';
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(sl.x + Math.cos(a) * 14, sl.y - 36 - sl.z + Math.sin(a) * 4, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  // the pizza-slice sword: a slice for a blade, a crust guard and a little handle (no arms: it floats in a bubble)
  drawSword(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.8, 0.8); ctx.rotate(-0.6);
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(-2, 4, 4, 9);
    ctx.fillStyle = '#c98a3a'; U.roundRect(ctx, -8, 1, 16, 4, 2); ctx.fill();
    ctx.fillStyle = '#ffd966'; ctx.beginPath(); ctx.moveTo(-5, 1); ctx.lineTo(0, -16); ctx.lineTo(5, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-1, -3, 1.6, 0, Math.PI * 2); ctx.arc(1, -9, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawPick(ctx, x, y) {
    ctx.save(); ctx.translate(x, y + 2); ctx.rotate(-0.4);
    ctx.fillStyle = '#a86d36'; ctx.fillRect(-1.6, -8, 3.2, 20);
    ctx.fillStyle = '#8c97a3'; ctx.beginPath(); ctx.moveTo(-11, -5); ctx.quadraticCurveTo(0, -14, 11, -5); ctx.lineTo(9, -3); ctx.quadraticCurveTo(0, -9, -9, -3); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'mines' || !this.st.floor) return;
    const ctx = r.ctx, st = this.st, p = g.player, f = st.floor;
    for (const b of st.bits) {   // bits of rock (and goo) flying
      const a = 1 - Math.max(0, (b.t - b.life * 0.6) / (b.life * 0.4));
      ctx.globalAlpha = a; ctx.fillStyle = b.col;
      if (b.round) { ctx.beginPath(); ctx.arc(b.x, b.y - b.z, b.s * 0.6, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(b.x - b.s / 2, b.y - b.z - b.s / 2, b.s, b.s);
    }
    ctx.globalAlpha = 1;
    // the tool in a bubble while the chef hops
    if (st.act && st.act.kind !== 'chest') {
      const hop = Math.sin(Math.min(1, st.act.t / 0.32) * Math.PI) * 9, bx = p.x + p.facing * 24, by = p.y - 80 - hop;
      r.drawBubble(bx, by, () => { if (st.act.kind === 'sword') this.drawSword(ctx, 0, 0); else this.drawPick(ctx, 0, 0); }, 34);
    }
    // darker edges, a soft light round the chef
    const cx = p.x, cy = p.y - 24, x0 = r.camX - 10, y0 = r.camY - 10, w = r.viewW + 20, h = r.viewH + 20, d = f.theme.dark;
    const grd = ctx.createRadialGradient(cx, cy, 70, cx, cy, 330);
    grd.addColorStop(0, `rgba(${d},0)`); grd.addColorStop(0.5, `rgba(${d},0.22)`); grd.addColorStop(1, `rgba(${d},0.6)`);
    ctx.fillStyle = grd; ctx.fillRect(x0, y0, w, h);
  },
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'mines' && st.floor && !g.travel) this.drawHud(r, g);
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (st.sleep) {
      const t = st.sleep.t, a = t < 1.2 ? Math.min(1, t / 1.0) : t < 1.6 ? 1 : Math.max(0, 1 - (t - 1.6) / 1.0);
      ctx.fillStyle = `rgba(14,10,30,${(a * 0.92).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = r.font(54); ctx.fillText('😴', W / 2, H / 2 - 30 + Math.sin(t * 3) * 4);
      ctx.font = r.font(24); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText('Time for a rest!', W / 2, H / 2 + 26);
      ctx.fillStyle = '#fff3c4'; ctx.fillText('Time for a rest!', W / 2, H / 2 + 26);
      ctx.font = r.font(20); ctx.fillStyle = '#c9c2ff'; for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i * 0.33) % 1; ctx.globalAlpha = a * (1 - k); ctx.fillText('z', W / 2 + 40 + k * 40, H / 2 - 60 - k * 50); }
      ctx.globalAlpha = 1;
    }
  },
  // five hearts (and the floor number) at the top-left, under the cash pill and the coin badge, clear of the hint
  hudSpot(r, w) {
    let x = 10, y = 96;
    try {
      const cv = r.canvas.getBoundingClientRect();
      const badge = document.getElementById('pc-badge'), cash = document.getElementById('hud-cash');
      const a = badge && badge.offsetParent ? badge.getBoundingClientRect() : cash ? cash.getBoundingClientRect() : null;
      if (a) { x = Math.max(8, a.left - cv.left); y = a.bottom - cv.top + 8; }
      // on a narrow screen the hint sits lower down: then the hearts go beside the coin badge instead
      const hint = document.getElementById('hint');
      if (a && hint && hint.offsetParent) {
        const h = hint.getBoundingClientRect(), hx0 = h.left - cv.left, hx1 = h.right - cv.left, hy0 = h.top - cv.top, hy1 = h.bottom - cv.top;
        if (hx0 < x + w && hx1 > x && hy0 < y + 34 && hy1 > y) {
          const bx = a.right - cv.left + 6;
          if (bx + w < cv.width - 8) { x = bx; y = a.top - cv.top + (a.height - 32) / 2; } else y = hy1 + 6;
        }
      }
    } catch (e) { /* layout not ready */ }
    return { x, y: Math.max(8, y) };
  },
  heartPath(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 0.62, y - s * 0.8, x, y - s * 0.22);
    ctx.bezierCurveTo(x + s * 0.62, y - s * 0.8, x + s * 1.25, y + s * 0.05, x, y + s * 0.9);
    ctx.closePath();
  },
  drawHud(r, g) {
    const ctx = r.ctx, st = this.st, M = CFG.MINES, n = M.HEARTS, hw = 24, padL = 10;
    const label = '🪜 ' + st.floor.n, w = padL + n * hw + 10 + 50, { x, y } = this.hudSpot(r, w);
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, x, y, w, 32, 16); ctx.fill();
    for (let i = 0; i < n; i++) {
      const cx = x + padL + i * hw + hw / 2, cy = y + 16;
      let s = 9;
      if (st.heartPop && st.heartPop.i === i) s *= 1 + 0.5 * Math.sin(Math.min(1, st.heartPop.t / 0.6) * Math.PI);
      const full = i < st.hearts;
      ctx.fillStyle = full ? '#ff4f6d' : 'rgba(255,255,255,0.18)'; this.heartPath(ctx, cx, cy - 1, s); ctx.fill();
      if (full) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(cx - s * 0.42, cy - s * 0.42, s * 0.18, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + padL + n * hw + 3, y + 7, 2, 18);
    ctx.font = r.font(14); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe08a'; ctx.fillText(label, x + padL + n * hw + 10, y + 17);
  },
};
Game.ext.unshift(MinesExt);   // first in line so the mine's buttons and hints beat Construction Town's own
Render.ext.push(MinesExt);
