'use strict';
// The secret path behind the barn: a winding trail through dense woods to a clearing with a log cabin and a sleeping bear.
// Nothing to buy or do here: a cosy place to discover. Extension module: registered with Game.ext and Render.ext (see js/EXTENSIONS.md).
CFG.SECRET = {
  x0: -1320, y0: -100, x1: -1020, y1: 1330,      // the forest strip west of the farm (the railway runs above y -100)
  // the trail: from the hidden fence gap behind the barn, bending between the trees down to the clearing
  path: [[-988, 225], [-1064, 225], [-1124, 176], [-1198, 212], [-1244, 294], [-1218, 374], [-1136, 404], [-1080, 470], [-1088, 552], [-1088, 630]],
  pathHalf: 32,
  clearing: { x: -1180, y: 688, rx: 128, ry: 92 },
  cabin: { x0: -1240, y0: 540, x1: -1120, y1: 616, roofTop: 486, porch: { y0: 616, y1: 648 }, door: { x: -1180, w: 30 }, window: { x: -1140, y: 572 }, chimney: { x: -1220 } },
  bear: { x: -1212, y: 640 },
  chair: { x: -1140, y: 634 },
  lantern: { x: -1098, y: 690 },
  mailbox: { x: -1272, y: 672 },
  sign: { x: -1052, y: 602 },
  woodpile: { x: -1270, y: 598 },
  honey: { x: -1250, y: 652 },
  stumps: [{ x: -1252, y: 740 }, { x: -1130, y: 752 }, { x: -1084, y: 722 }],
  stream: [[-1320, 324], [-1280, 334], [-1232, 336], [-1186, 324], [-1146, 332], [-1108, 330]],
  pool: { x: -1098, y: 330, rx: 24, ry: 13 },
  hive: { x: -1062, y: 735 },
  log: { x: -1200, y: 880 },
  stillTime: 3,                                  // seconds standing still by the bear before it peeks
};
// Inside the cabin: its own little map (free space south-east of the other maps), a one-room log cabin seen from above.
CFG.AREAS.cabin = { WORLD: { x0: 4700, y0: 1500, x1: 5300, y1: 1900 } };
CFG.SECRET.HOME = {
  room: { x0: 4765, y0: 1560, x1: 5235, y1: 1840 }, wall: 26,
  fire: { x: 4947, y: 1575 },                         // the firebox on the top wall; the hearth sticks out onto the floor
  topWindow: { x: 5060 }, sideWindow: { y: 1740 },
  bed: { x0: 5168, y0: 1580, x1: 5228, y1: 1684 },
  table: { x: 5100, y: 1780 }, chairs: [{ x: 5060, y: 1780 }, { x: 5140, y: 1780 }],
  counter: { x0: 4822, y0: 1808, x1: 4904, y1: 1840 },
  door: { x: 4995, w: 42 }, exit: { x: 4995, y: 1818 },  // stand on the mat inside to go out; you arrive there when you come in
  porchDoor: { x: -1176, y: 636 },                      // stand here on the porch outside to go in (clear of the bear's rug)
  catalog: { x: 5046, y: 1826, reach: 44 },             // the mail-order catalog on its little stand by the door
  eye: { x: 5172, y: 1742 },                            // where you stand to look through the telescope
  // decorations, bought from the catalog: `spot` is where the item goes, `block` an obstacle rect once owned,
  // `view` how the catalog page shows it (scale, and the item's visual centre relative to its spot)
  items: [
    { key: 'rug', label: 'Big Rug', ico: '🟥', price: 40, spot: { x: 4995, y: 1700 }, view: { s: 1.8, dy: 0 } },
    { key: 'teddy', label: 'Teddy Bear', ico: '🧸', price: 45, spot: { x: 5198, y: 1614 }, view: { s: 3.4, dy: 0 } },
    { key: 'plant', label: 'Potted Plant', ico: '🪴', price: 50, spot: { x: 5212, y: 1822 }, view: { s: 3, dy: -12 }, block: [5198, 1806, 30, 30] },
    { key: 'jar', label: 'Bear Cookie Jar', ico: '🍪', price: 55, spot: { x: 4862, y: 1818 }, view: { s: 3.4, dy: -7 } },
    { key: 'curtains', label: 'Curtains', ico: '🪟', price: 60, spot: { x: 5060, y: 1548 }, view: { s: 2.4, dy: 0 } },
    { key: 'fish', label: 'Fish Bowl', ico: '🐟', price: 65, spot: { x: 5100, y: 1776 }, view: { s: 3.6, dy: 0 } },
    { key: 'painting', label: 'Pizza Painting', ico: '🖼️', price: 70, spot: { x: 4812, y: 1548 }, view: { s: 3.2, dy: 0 } },
    { key: 'dogbed', label: 'Dog Bed', ico: '🐶', price: 75, spot: { x: 4950, y: 1636 }, view: { s: 3, dy: 0 } },
    { key: 'lamp', label: 'Cosy Lamp', ico: '💡', price: 80, spot: { x: 4788, y: 1690 }, view: { s: 2.8, dy: -16 }, block: [4776, 1684, 24, 16] },
    { key: 'armchair', label: 'Comfy Armchair', ico: '🛋️', price: 90, spot: { x: 4888, y: 1636 }, view: { s: 2.8, dy: 0 }, block: [4868, 1616, 40, 40] },
    { key: 'clock', label: 'Cuckoo Clock', ico: '🕰️', price: 110, spot: { x: 5010, y: 1546 }, view: { s: 3.2, dy: -2 }, block: null },
    { key: 'books', label: 'Bookshelf', ico: '📚', price: 120, spot: { x: 5125, y: 1580 }, view: { s: 2.4, dy: 0 }, block: [5088, 1562, 74, 36] },
    { key: 'record', label: 'Record Player', ico: '🎵', price: 150, spot: { x: 4945, y: 1806 }, view: { s: 3.2, dy: 0 }, block: [4925, 1792, 40, 26] },
    { key: 'oven', label: 'Pizza Oven', ico: '🍕', price: 200, spot: { x: 4790, y: 1812 }, view: { s: 2.4, dy: 0 }, block: [4765, 1786, 52, 54] },
    { key: 'telescope', label: 'Telescope', ico: '🔭', price: 250, spot: { x: 5212, y: 1742 }, view: { s: 3.2, dy: -2 }, block: [5198, 1730, 34, 24] },
  ],
};

const SecretExt = {
  name: 'secret',
  trees: [], bushes: [], ferns: [], shrooms: [], rocks: [], blocks: [], props: [],
  st: null,

  // ---------- geometry ----------
  segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = l2 ? U.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  },
  pathDist(x, y) {
    const P = CFG.SECRET.path; let d = 1e9;
    for (let i = 0; i < P.length - 1; i++) d = Math.min(d, this.segDist(x, y, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]));
    return d;
  },
  inClearing(x, y, m = 0) { const C = CFG.SECRET.clearing; const dx = (x - C.x) / (C.rx + m), dy = (y - C.y) / (C.ry + m); return dx * dx + dy * dy < 1; },
  inCabin(x, y, m = 0) { const c = CFG.SECRET.cabin; return x > c.x0 - m && x < c.x1 + m && y > c.roofTop - m && y < c.porch.y1 + m; },
  inWalls(x, y) { const c = CFG.SECRET.cabin; return x > c.x0 - 6 && x < c.x1 + 6 && y > c.roofTop && y < c.y1; },   // the cabin itself; the porch stays walkable
  walkable(x, y) { return this.pathDist(x, y) <= CFG.SECRET.pathHalf || (this.inClearing(x, y) && !this.inWalls(x, y)); },
  inStrip(x, y) { return x < -1010 && y > CFG.SECRET.y0; },   // the railway runs above the woods; walking the rails is not finding the path

  // Deterministic layout so the woods look the same every visit.
  setup() {
    const S = CFG.SECRET;
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const free = (x, y, m) => this.pathDist(x, y) > m && !this.inClearing(x, y, m) && !this.inCabin(x, y, m) && y > -36 && x > S.x0 + 14 && x < S.x1 - 14;
    // trees on a jittered grid, well clear of the trail so the canopies never hide it
    for (let gy = S.y0 + 60; gy < S.y1 - 20; gy += 54) for (let gx = S.x0 + 28; gx < S.x1 - 22; gx += 46) {
      const x = gx + (rnd() - 0.5) * 26, y = gy + (rnd() - 0.5) * 30, s = 0.75 + rnd() * 0.35;
      if (x < -1300 || x > -1040 || !free(x, y, 66)) continue;
      if (this.inCabin(x, y, 40) || (y > S.cabin.roofTop - 60 && y < S.cabin.porch.y1 + 10 && x > S.cabin.x0 - 70 && x < S.cabin.x1 + 50)) continue;
      this.trees.push({ x, y, s });
    }
    CFG.TREES.push(...this.trees);   // the core sways their canopies over the player; trunks are repainted on the forest floor below
    // undergrowth: a ring of bushes hugging the trail, then ferns, mushrooms and rocks scattered through the deep wood
    const P = S.path;
    for (let i = 0; i < P.length - 1; i++) {
      const ax = P[i][0], ay = P[i][1], bx = P[i + 1][0], by = P[i + 1][1], len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
      for (let d = 10; d < len; d += 26) for (const side of [-1, 1]) {
        const t = d / len, off = side * (44 + rnd() * 10), x = ax + (bx - ax) * t + nx * off, y = ay + (by - ay) * t + ny * off;
        if (x < -1010 && x > S.x0 + 8 && this.pathDist(x, y) > 38 && !this.inClearing(x, y, 10)) this.bushes.push({ x, y, s: 0.8 + rnd() * 0.4, k: Math.floor(rnd() * 3) });
      }
    }
    for (let i = 0; i < 170; i++) {
      const x = S.x0 + 12 + rnd() * (S.x1 - S.x0 - 24), y = S.y0 + 50 + rnd() * (S.y1 - S.y0 - 70);
      if (!free(x, y, 42)) continue;
      const r = rnd();
      if (r < 0.45) this.bushes.push({ x, y, s: 0.7 + rnd() * 0.5, k: Math.floor(rnd() * 3) });
      else if (r < 0.75) this.ferns.push({ x, y, s: 0.7 + rnd() * 0.5 });
      else if (r < 0.9) this.shrooms.push({ x, y, s: 0.7 + rnd() * 0.6, red: rnd() < 0.6 });
      else this.rocks.push({ x, y, s: 0.6 + rnd() * 0.8 });
    }
    // a few mushrooms and flowers in the clearing edges too
    for (let i = 0; i < 6; i++) { const a = rnd() * Math.PI * 2; this.shrooms.push({ x: S.clearing.x + Math.cos(a) * (S.clearing.rx - 22), y: S.clearing.y + Math.sin(a) * (S.clearing.ry - 18), s: 0.8, red: i % 2 === 0 }); }
    // the woods are solid: 12 px cells outside the trail and clearing, merged into row runs
    const cs = 12;
    for (let y = S.y0; y < S.y1; y += cs) {
      let run = null;
      for (let x = S.x0; x < -1004; x += cs) {
        const pts = [[x, y], [x + cs, y], [x, y + cs], [x + cs, y + cs], [x + cs / 2, y + cs / 2]];
        const open = pts.some(([px, py]) => this.walkable(px, py));
        if (open) { run = null; continue; }
        if (run && run.y === y && run.x + run.w === x) run.w += cs; else { run = { x, y, w: cs, h: cs }; this.blocks.push(run); }
      }
    }
    const c = S.cabin;
    this.blocks.push({ x: c.x0 - 6, y: c.roofTop, w: c.x1 - c.x0 + 12, h: c.y1 - c.roofTop });          // cabin walls and roof
    this.blocks.push({ x: S.woodpile.x - 18, y: S.woodpile.y - 10, w: 36, h: 20 });
    this.blocks.push({ x: S.lantern.x - 4, y: S.lantern.y - 6, w: 8, h: 10 });
    this.blocks.push({ x: S.mailbox.x - 8, y: S.mailbox.y - 6, w: 16, h: 10 });
    this.blocks.push({ x: S.chair.x - 12, y: S.chair.y - 8, w: 24, h: 14 });
    this.blocks.push({ x: S.bear.x - 26, y: S.bear.y - 14, w: 46, h: 22 });   // stops just short of the door mat
    this.blocks.push({ x: S.log.x - 44, y: S.log.y - 8, w: 88, h: 16 });
    for (const s of S.stumps) this.blocks.push({ x: s.x - 12, y: s.y - 6, w: 24, h: 12 });
    this.blocks.push({ x: S.sign.x - 5, y: S.sign.y - 6, w: 10, h: 10 });
    this.vehicleBlock = { x: -1034, y: 170, w: 30, h: 110 };     // nothing on wheels fits through the trees
    // the beehive hangs from the tree nearest the clearing's south-east edge
    const near = this.trees.slice().sort((a, b) => U.dist(a.x, a.y, S.hive.x, S.hive.y) - U.dist(b.x, b.y, S.hive.x, S.hive.y))[0];
    if (near) { S.hive.tree = near; S.hive.x = near.x + 16 * near.s; S.hive.y = near.y - 4 * near.s; }
    // the telescope's sky, computed once: stars in a unit square (u, v), a denser band for the Milky Way
    const cols = ['#ffffff', '#fff4d6', '#cfe6ff', '#ffd9c2', '#ffe9a8', '#ffffff'];
    this.stars = [];
    for (let i = 0; i < 300; i++) { const big = rnd() < 0.08; this.stars.push({ u: rnd(), v: rnd(), r: big ? 1.8 + rnd() * 1.2 : 0.5 + rnd() * 1.1, col: cols[Math.floor(rnd() * cols.length)], tw: 1 + rnd() * 2.5, ph: rnd() * 6.3, d: big ? 1 : 0.3 + rnd() * 0.5, big }); }
    const ca = Math.cos(-0.6), sa = Math.sin(-0.6);
    for (let i = 0; i < 220; i++) { const along = rnd() - 0.5, off = (rnd() + rnd() + rnd() - 1.5) * 0.09; this.stars.push({ u: 0.5 + along * ca - off * sa, v: 0.5 + along * sa + off * ca, r: 0.4 + rnd() * 0.7, col: cols[Math.floor(rnd() * 3)], tw: 1.5 + rnd() * 2, ph: rnd() * 6.3, d: 0.3, big: false }); }
    this.constellations = [
      { name: 'The Big Dipper', pts: [[0.13, 0.26], [0.18, 0.23], [0.23, 0.24], [0.28, 0.28], [0.35, 0.26], [0.36, 0.34], [0.29, 0.36]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
      { name: 'The Little Pizza', pts: [[0.58, 0.66], [0.72, 0.63], [0.66, 0.80], [0.64, 0.68], [0.67, 0.73]], edges: [[0, 1], [1, 2], [2, 0]] },
    ];
  },

  // ---------- game hooks ----------
  defaults: { cabin: { owned: {}, seen: false } },
  build(g) {
    const S = CFG.SECRET;
    if (!g.s.cabin) g.s.cabin = { owned: {}, seen: false };
    this.st = {
      visited: false, still: 0, peek: 0, cool: 0,
      squirrel: { stump: 0, x: S.stumps[0].x, y: S.stumps[0].y, hop: null, facing: 1, flick: 0 },
      fade: 0, notes: [], noteT: 0, cuckoo: -1,
      view: { on: false, t: 0, shoot: null, shootT: 4, wish: 0, label: 0, labelT: 0 },      // looking through the telescope
      cat: { on: false, page: 0, flip: null, ready: true, hold: null, bought: 0, nope: 0 },  // the decoration catalog
    };
  },
  obstacles(g, forCar) {
    if (g.area === 'cabin') return this.homeBlocks(g);
    if (g.player.x > -900) return [];
    return forCar ? this.blocks.concat([this.vehicleBlock]) : this.blocks;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, S = CFG.SECRET;
    st.fade = Math.max(0, st.fade - dt);
    if (g.area === 'cabin') { this.updateHome(g, dt); return; }
    if (g.area !== 'town') return;
    const inside = this.inStrip(p.x, p.y);
    if (inside && !st.visited) { st.visited = true; g.toast('🌲 You found a secret path!', true); }
    // the bear: stand still right next to it for a few seconds and it opens one eye
    const nearBear = inside && U.dist(p.x, p.y, S.bear.x, S.bear.y) < 72;
    st.cool = Math.max(0, st.cool - dt);
    if (st.peek > 0) { st.peek -= dt; if (st.peek <= 0) { st.peek = 0; st.cool = 6; } }
    else if (nearBear && !p.moving && st.cool <= 0) { st.still += dt; if (st.still >= S.stillTime) { st.still = 0; st.peek = 2.6; } }
    else st.still = 0;
    // the squirrel hops to another stump when you come close
    const q = st.squirrel; q.flick += dt;
    if (q.hop) {
      q.hop.t += dt; const k = Math.min(1, q.hop.t / q.hop.dur);
      q.x = U.lerp(q.hop.x0, q.hop.x1, k); q.y = U.lerp(q.hop.y0, q.hop.y1, k) - Math.sin(k * Math.PI) * 44;
      if (k >= 1) { q.hop = null; q.x = S.stumps[q.stump].x; q.y = S.stumps[q.stump].y; }
    } else if (inside && U.dist(p.x, p.y, q.x, q.y) < 64) {
      let best = q.stump, bd = -1;
      S.stumps.forEach((s, i) => { const d = U.dist(p.x, p.y, s.x, s.y); if (i !== q.stump && d > bd) { bd = d; best = i; } });
      const to = S.stumps[best];
      q.facing = to.x < q.x ? -1 : 1;
      q.hop = { x0: q.x, y0: q.y, x1: to.x, y1: to.y, t: 0, dur: 0.75 }; q.stump = best;
      g.floats.push({ x: q.x, y: q.y - 28, text: '!', color: '#ffe08a', t: 0, dur: 0.7 });
    }
  },
  hint(g) {
    const p = g.player, S = CFG.SECRET, H = S.HOME;
    if (g.area === 'cabin') return this.homeHint(g);
    if (g.area !== 'town' || !this.inStrip(p.x, p.y)) return undefined;
    if (U.dist(p.x, p.y, H.porchDoor.x, H.porchDoor.y) < 64) return { text: 'Go inside your cabin!', target: H.porchDoor };
    if (U.dist(p.x, p.y, S.bear.x, S.bear.y) < 110) return { text: 'Shh… the bear is sleeping', target: null };
    if (p.x > -1120 && p.y < 300) return { text: 'Ooh, a secret path…', target: null };
    return null;
  },

  // ---------- static art ----------
  paintTown(r, g) {
    const ctx = r.ctx, S = CFG.SECRET;
    ctx.save();
    ctx.beginPath(); ctx.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); ctx.clip();
    this.paintFloor(ctx);
    this.paintStream(ctx);
    this.paintClearing(ctx, r);
    ctx.restore(); ctx.save();
    ctx.beginPath(); ctx.rect(S.x0, S.y0, CFG.FARM.x0 - 4 - S.x0, S.y1 - S.y0); ctx.clip();   // the trail's dirt runs right up to the fence gap
    this.paintPath(ctx);
    ctx.restore(); ctx.save();
    ctx.beginPath(); ctx.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); ctx.clip();
    this.paintUndergrowth(ctx);
    this.paintTrunks(ctx);
    this.paintCabin(ctx, r);
    this.paintProps(ctx, r);
    ctx.restore();
  },
  paintFloor(ctx) {
    const S = CFG.SECRET;
    const grd = ctx.createLinearGradient(0, S.y0, 0, S.y1);
    grd.addColorStop(0, '#5f9a47'); grd.addColorStop(1, '#4f8a3e');
    ctx.fillStyle = grd; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    // soft forest-edge fade along the top so the woods meet the grass gently
    const top = ctx.createLinearGradient(0, S.y0, 0, S.y0 + 60);
    top.addColorStop(0, 'rgba(121,184,94,1)'); top.addColorStop(1, 'rgba(121,184,94,0)');
    ctx.fillStyle = top; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, 60);
    // dappled shade and leaf litter
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let i = 0; i < 260; i++) { const x = S.x0 + ((i * 193) % 300), y = S.y0 + ((i * 101) % (S.y1 - S.y0)); ctx.beginPath(); ctx.ellipse(x, y, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(140,90,40,0.18)';
    for (let i = 0; i < 180; i++) { const x = S.x0 + ((i * 137) % 300), y = S.y0 + ((i * 211) % (S.y1 - S.y0)); ctx.beginPath(); ctx.ellipse(x, y, 4, 2.2, i, 0, Math.PI * 2); ctx.fill(); }
  },
  paintStream(ctx) {
    const S = CFG.SECRET, P = S.stream;
    const line = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); };
    line(24, '#4d8a5a'); line(16, '#4aa3d8');
    ctx.fillStyle = '#4d8a5a'; ctx.beginPath(); ctx.ellipse(S.pool.x, S.pool.y, S.pool.rx + 5, S.pool.ry + 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4aa3d8'; ctx.beginPath(); ctx.ellipse(S.pool.x, S.pool.y, S.pool.rx, S.pool.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; ctx.beginPath(); ctx.moveTo(mx - 7, my - 2); ctx.quadraticCurveTo(mx, my - 5, mx + 7, my - 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(S.pool.x - 10, S.pool.y - 3); ctx.quadraticCurveTo(S.pool.x, S.pool.y - 7, S.pool.x + 10, S.pool.y - 3); ctx.stroke();
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy] of [[-12, 4], [9, 5]]) { ctx.beginPath(); ctx.ellipse(S.pool.x + dx, S.pool.y + dy, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  paintClearing(ctx, r) {
    const S = CFG.SECRET, C = S.clearing;
    ctx.fillStyle = '#7cc45f'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx + 6, C.ry + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8ad26a'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx - 10, C.ry - 8, 0, 0, Math.PI * 2); ctx.fill();
    // a worn patch of earth in front of the porch
    const c = S.cabin;
    ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.ellipse((c.x0 + c.x1) / 2 + 10, c.porch.y1 + 24, 76, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.ellipse(S.path[S.path.length - 1][0], S.path[S.path.length - 1][1] + 20, 36, 22, 0, 0, Math.PI * 2); ctx.fill();
    // wild flowers
    const cols = ['#ff8fab', '#ffd166', '#fff', '#9ad0ff', '#ff6b6b'];
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996, rad = 0.35 + 0.6 * ((i * 37) % 10) / 10, x = C.x + Math.cos(a) * C.rx * rad, y = C.y + Math.sin(a) * C.ry * rad;
      if (this.inCabin(x, y, 14) || U.dist(x, y, S.bear.x, S.bear.y) < 40 || Math.abs(x - S.path[S.path.length - 1][0]) < 36 && y < 680) continue;
      ctx.fillStyle = '#3f9a4a'; ctx.fillRect(x - 1, y - 6, 2, 7);
      ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x, y - 7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 7, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  },
  paintPath(ctx) {
    const S = CFG.SECRET, P = S.path;
    const trail = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); };
    trail(S.pathHalf * 2 + 6, '#a88552'); trail(S.pathHalf * 2 - 2, '#c9a36b');
    // pebbles and footprints
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < P.length - 1; i++) {
      const ax = P[i][0], ay = P[i][1], bx = P[i + 1][0], by = P[i + 1][1], len = Math.hypot(bx - ax, by - ay);
      for (let d = 8; d < len; d += 18) { const t = d / len, k = (i * 7 + d) % 5; ctx.beginPath(); ctx.ellipse(ax + (bx - ax) * t + (k - 2) * 7, ay + (by - ay) * t + ((k * 3) % 5 - 2) * 4, 2.6, 1.6, k, 0, Math.PI * 2); ctx.fill(); }
    }
    // the stream crosses the trail: stepping stones over the water
    const cx = -1232, cy = 336;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx - 2, cy, 40, 17, 0.12, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = '#4aa3d8'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(S.stream[1][0], S.stream[1][1]); ctx.lineTo(S.stream[2][0], S.stream[2][1]); ctx.lineTo(S.stream[3][0], S.stream[3][1]); ctx.stroke();
    ctx.restore();
    for (const [dx, dy] of [[-18, 6], [-4, -4], [10, 5], [22, -3]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx + dx + 1, cy + dy + 2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d4cdbf'; ctx.beginPath(); ctx.ellipse(cx + dx - 2, cy + dy - 1.5, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  paintUndergrowth(ctx) {
    const S = CFG.SECRET;
    const bush = (b) => {
      const s = b.s, x = b.x, y = b.y;
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 6 * s, 18 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b.k === 1 ? '#3b8f45' : '#3f9a4a';
      ctx.beginPath(); ctx.arc(x - 9 * s, y - 2 * s, 10 * s, 0, Math.PI * 2); ctx.arc(x + 9 * s, y - 1 * s, 10 * s, 0, Math.PI * 2); ctx.arc(x, y - 9 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 3 * s, y - 12 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      if (b.k === 2) { ctx.fillStyle = '#e84c6a'; for (const [dx, dy] of [[-8, -2], [4, -9], [9, 1]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, 2.2, 0, Math.PI * 2); ctx.fill(); } }
    };
    const fern = (f) => {
      const s = f.s; ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 2.5 * s; ctx.lineCap = 'round';
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x + k * 9 * s, f.y - 12 * s, f.x + k * 14 * s, f.y - 16 * s + Math.abs(k) * 6 * s); ctx.stroke(); }
    };
    const shroom = (m) => {
      const s = m.s; ctx.fillStyle = '#f3e6cf'; U.roundRect(ctx, m.x - 3 * s, m.y - 9 * s, 6 * s, 10 * s, 2); ctx.fill();
      ctx.fillStyle = m.red ? '#e53935' : '#d9a066'; ctx.beginPath(); ctx.ellipse(m.x, m.y - 9 * s, 8 * s, 5.5 * s, 0, Math.PI, 0); ctx.fill();
      if (m.red) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(m.x - 3 * s, m.y - 11 * s, 1.4 * s, 0, Math.PI * 2); ctx.arc(m.x + 3 * s, m.y - 10 * s, 1.2 * s, 0, Math.PI * 2); ctx.fill(); }
    };
    const rock = (k) => {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(k.x + 2, k.y + 3, 11 * k.s, 5 * k.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9d968a'; ctx.beginPath(); ctx.ellipse(k.x, k.y, 11 * k.s, 7 * k.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(k.x - 3 * k.s, k.y - 2 * k.s, 6 * k.s, 3 * k.s, 0, 0, Math.PI * 2); ctx.fill();
    };
    for (const k of this.rocks) rock(k);
    for (const f of this.ferns) fern(f);
    for (const b of this.bushes.slice().sort((a, b) => a.y - b.y)) bush(b);
    for (const m of this.shrooms) shroom(m);
    // a fallen log, mossy, deep in the south wood
    const L = S.log;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(L.x + 3, L.y + 8, 46, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, L.x - 44, L.y - 8, 88, 18, 9); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(L.x + 44, L.y + 1, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7b98a'; ctx.beginPath(); ctx.ellipse(L.x + 44, L.y + 1, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; for (const [dx, dy] of [[-30, -6], [-10, -9], [14, -7]]) { ctx.beginPath(); ctx.ellipse(L.x + dx, L.y + dy, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    shroom({ x: L.x - 36, y: L.y + 14, s: 0.8, red: true }); shroom({ x: L.x + 20, y: L.y + 16, s: 0.6, red: false });
  },
  paintTrunks(ctx) {
    for (const t of this.trees.slice().sort((a, b) => a.y - b.y)) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(t.x + 4, t.y + 6, 30 * t.s, 12 * t.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, t.x - 7 * t.s, t.y - 30 * t.s, 14 * t.s, 36 * t.s, 4); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(t.x - 2 * t.s, t.y - 24 * t.s, 2, 22 * t.s);
    }
  },
  paintCabin(ctx, r) {
    const S = CFG.SECRET, c = S.cabin, w = c.x1 - c.x0, mid = (c.x0 + c.x1) / 2;
    // shadow, then the log walls
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(c.x0 + 6, c.y0 + 8, w, c.y1 - c.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(c.x0, c.y0, w, c.y1 - c.y0);
    for (let y = c.y0 + 2; y < c.y1 - 4; y += 12) { ctx.fillStyle = '#a5693a'; U.roundRect(ctx, c.x0 - 3, y, w + 6, 9, 4.5); ctx.fill(); ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.arc(c.x0 - 1, y + 4.5, 3, 0, Math.PI * 2); ctx.arc(c.x1 + 1, y + 4.5, 3, 0, Math.PI * 2); ctx.fill(); }
    // roof: a wide gable with shingle lines, overhanging the walls
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.moveTo(c.x0 - 10, c.y0 + 6); ctx.lineTo(mid + 4, c.roofTop + 6); ctx.lineTo(c.x1 + 14, c.y0 + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(c.x0 - 12, c.y0 + 2); ctx.lineTo(mid, c.roofTop); ctx.lineTo(c.x1 + 12, c.y0 + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.moveTo(c.x0 - 4, c.y0 - 2); ctx.lineTo(mid, c.roofTop + 8); ctx.lineTo(c.x1 + 4, c.y0 - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < 5; k++) { const t = k / 5; ctx.beginPath(); ctx.moveTo(c.x0 - 4 + (mid - c.x0 + 4) * t, c.y0 - 2 - (c.y0 - 2 - c.roofTop - 8) * t); ctx.lineTo(c.x1 + 4 - (c.x1 + 4 - mid) * t, c.y0 - 2 - (c.y0 - 2 - c.roofTop - 8) * t); ctx.stroke(); }
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, c.x0 - 14, c.y0 - 2, w + 28, 7, 3); ctx.fill();     // eave beam
    // stone chimney
    const ch = c.chimney.x;
    ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, ch - 10, c.roofTop + 2, 20, 42, 3); ctx.fill();
    ctx.fillStyle = '#6e7177'; U.roundRect(ctx, ch - 12, c.roofTop - 2, 24, 7, 2); ctx.fill();
    ctx.fillStyle = '#a9acb1'; for (const [dx, dy] of [[-6, 10], [3, 18], [-4, 26], [5, 34]]) { ctx.beginPath(); ctx.ellipse(ch + dx, c.roofTop + dy, 4, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
    // door with a little heart, and a warm window
    const d = c.door;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, d.x - d.w / 2 - 3, c.y0 + 24, d.w + 6, c.y1 - c.y0 - 24, 4); ctx.fill();
    ctx.fillStyle = '#7a4a22'; U.roundRect(ctx, d.x - d.w / 2, c.y0 + 27, d.w, c.y1 - c.y0 - 27, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(d.x + d.w / 2 - 6, c.y0 + 56, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e84c6a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', d.x, c.y0 + 38);
    const wn = c.window;
    ctx.fillStyle = '#f5f0dc'; U.roundRect(ctx, wn.x - 15, wn.y - 13, 30, 26, 3); ctx.fill();
    ctx.fillStyle = '#ffd97a'; ctx.fillRect(wn.x - 12, wn.y - 10, 24, 20);
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(wn.x - 1, wn.y - 10, 2, 20); ctx.fillRect(wn.x - 12, wn.y - 1, 24, 2);
    ctx.fillStyle = '#b23a48'; ctx.fillRect(wn.x - 17, wn.y - 15, 3, 30); ctx.fillRect(wn.x + 14, wn.y - 15, 3, 30);   // shutters
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, wn.x - 18, wn.y + 12, 36, 5, 2); ctx.fill();                               // window box
    ctx.fillStyle = '#ff8fab'; for (const dx of [-11, -4, 3, 10]) { ctx.beginPath(); ctx.arc(wn.x + dx, wn.y + 10, 2.6, 0, Math.PI * 2); ctx.fill(); }
    // porch deck, steps, posts and railing
    const p = c.porch;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(c.x0 - 6, p.y1, w + 16, 6);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(c.x0 - 8, p.y0, w + 16, p.y1 - p.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = c.x0 - 8; x < c.x1 + 8; x += 16) ctx.fillRect(x, p.y0, 1.5, p.y1 - p.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(c.x0 - 8, p.y1 - 3, w + 16, 3);
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(d.x - 22, p.y1, 44, 5); ctx.fillStyle = '#b5773a'; ctx.fillRect(d.x - 20, p.y1 + 5, 40, 4);     // steps
    ctx.fillStyle = '#d7b98a';
    for (const x of [c.x0 - 6, c.x1 + 2]) { ctx.fillRect(x, c.y1 - 2, 4, p.y1 - c.y1); }
    ctx.fillRect(c.x0 - 8, p.y0 + 10, d.x - 30 - (c.x0 - 8), 3); ctx.fillRect(d.x + 30, p.y0 + 10, c.x1 + 8 - (d.x + 30), 3);   // railing
    for (let x = c.x0 - 2; x < c.x1 + 8; x += 12) if (x < d.x - 30 || x > d.x + 30) ctx.fillRect(x, p.y0 + 10, 2, 12);
    // a doormat and the bear's rug
    ctx.fillStyle = '#b8862c'; U.roundRect(ctx, d.x - 14, p.y0 + 14, 28, 10, 2); ctx.fill();
    const b = S.bear;
    ctx.fillStyle = '#c45c7a'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 34, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd6e0'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c7a'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    // woodpile against the west wall
    const wp = S.woodpile;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(wp.x + 2, wp.y + 10, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-12, 4], [0, 4], [12, 4], [-6, -4], [6, -4], [0, -12]]) {
      ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.arc(wp.x + dx, wp.y + dy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d7b98a'; ctx.beginPath(); ctx.arc(wp.x + dx, wp.y + dy, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b5773a'; ctx.beginPath(); ctx.arc(wp.x + dx, wp.y + dy, 1.4, 0, Math.PI * 2); ctx.fill();
    }
  },
  paintProps(ctx, r) {
    const S = CFG.SECRET;
    // lantern post (the glow is drawn each frame)
    const ln = S.lantern;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(ln.x + 2, ln.y + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(ln.x - 2, ln.y - 56, 4, 58); ctx.fillRect(ln.x - 2, ln.y - 56, 14, 3);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, ln.x + 5, ln.y - 54, 12, 16, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(ln.x + 7, ln.y - 51, 8, 10);
    // mailbox on a post
    const mb = S.mailbox;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(mb.x - 2, mb.y - 24, 4, 26);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, mb.x - 10, mb.y - 36, 20, 14, 6); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(mb.x + 8, mb.y - 40, 2, 10); ctx.beginPath(); ctx.arc(mb.x + 9, mb.y - 41, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐻', mb.x, mb.y - 29);
    // "Shh… bear sleeping" sign by the trail's end
    const sg = S.sign;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(sg.x + 2, sg.y + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(sg.x - 3, sg.y - 44, 6, 46);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, sg.x - 32, sg.y - 62, 64, 30, 5); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, sg.x - 29, sg.y - 59, 58, 24, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Shh…', sg.x, sg.y - 53); ctx.fillText('bear sleeping', sg.x, sg.y - 42);
    // tree stumps for the squirrel
    for (const s of S.stumps) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(s.x + 2, s.y + 6, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, s.x - 13, s.y - 8, 26, 16, 5); ctx.fill();
      ctx.fillStyle = '#d7b98a'; ctx.beginPath(); ctx.ellipse(s.x, s.y - 8, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b5773a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(s.x, s.y - 8, 8, 3.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(s.x, s.y - 8, 3.5, 1.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // an axe in the first stump
    const ax = S.stumps[0];
    ctx.fillStyle = '#8d5a2b'; ctx.save(); ctx.translate(ax.x + 6, ax.y - 10); ctx.rotate(-0.5); ctx.fillRect(-2, -26, 4, 28); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(-2, -24); ctx.lineTo(-12, -20); ctx.lineTo(-12, -8); ctx.lineTo(-2, -12); ctx.closePath(); ctx.fill(); ctx.restore();
    // a honey pot by the door (bears love honey)
    const h = S.honey;
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, h.x - 7, h.y - 12, 14, 14, 5); ctx.fill();
    ctx.fillStyle = '#b8862c'; ctx.fillRect(h.x - 8, h.y - 13, 16, 4);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(h.x - 5, h.y - 8, 10, 5);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HONEY', h.x, h.y - 5.5);
  },

  // ---------- moving things ----------
  dynamic(r, g) {
    if (!this.st) return;
    if (g.area === 'cabin') { this.homeDynamic(r, g); return; }
    if (g.area !== 'town') return;
    const ctx = r.ctx, S = CFG.SECRET, t = g.time;
    // the lantern and the window glow softly, with a little flicker
    const glow = (x, y, rad, a) => { const gr = ctx.createRadialGradient(x, y, 2, x, y, rad); gr.addColorStop(0, `rgba(255,214,120,${a})`); gr.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); };
    const fl = 0.85 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
    glow(S.lantern.x + 11, S.lantern.y - 46, 34 * fl, 0.35);
    glow(S.cabin.window.x, S.cabin.window.y, 30 * fl, 0.25);
  },
  entities(r, g, items) {
    if (g.area !== 'town' || !this.st) return;
    const S = CFG.SECRET;
    items.push({ y: S.bear.y + 4, draw: () => this.drawBear(r, g) });
    items.push({ y: S.chair.y + 2, draw: () => this.drawChair(r, g) });
    items.push({ y: this.st.squirrel.y + 1, draw: () => this.drawSquirrel(r, g) });
  },
  drawBear(r, g) {
    const ctx = r.ctx, S = CFG.SECRET, b = S.bear, t = g.time, st = this.st;
    const breath = 1 + Math.sin(t * 1.6) * 0.03, peek = st.peek > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 6, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(b.x, b.y + 4); ctx.scale(1, breath); ctx.translate(-b.x, -b.y - 4);
    // curled-up body with a lighter tummy, hind paw and a stubby tail
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(b.x + 6, b.y - 10, 28, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a56f3a'; ctx.beginPath(); ctx.ellipse(b.x + 10, b.y - 6, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(b.x + 30, b.y - 14, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.ellipse(b.x + 18, b.y + 2, 11, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(b.x + 20, b.y + 3, 6, 3.5, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // head resting on the front paws
    const hx = b.x - 18, hy = b.y - 8;
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(hx - 11, hy - 13, 6, 0, Math.PI * 2); ctx.arc(hx + 9, hy - 15, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.arc(hx - 11, hy - 13, 3, 0, Math.PI * 2); ctx.arc(hx + 9, hy - 15, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(hx, hy - 4, 17, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(hx - 6, hy + 1, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(hx - 10, hy - 1, 3.2, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    // eyes: two sleepy arcs, or one eye peeking open
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx - 6, hy - 8, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (peek) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(hx + 4, hy - 8, 3.4, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hx + 3.4, hy - 7.6, 1.6, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(hx + 4, hy - 8, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    // front paws
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(hx - 6, hy + 10, 9, 5, 0, 0, Math.PI * 2); ctx.ellipse(hx + 10, hy + 11, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c99a5f'; for (const px of [hx - 10, hx - 5, hx + 6, hx + 11]) { ctx.beginPath(); ctx.arc(px, hy + (px < hx ? 9 : 10), 1.5, 0, Math.PI * 2); ctx.fill(); }
    if (peek) {
      r.drawBubble(b.x - 6, b.y - 48, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('…zzz?', 0, 0); }, 58);
    } else {
      // drifting z z z
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.45 + k / 3) % 1;
        ctx.globalAlpha = (1 - ph) * 0.9; ctx.font = r.font(9 + ph * 9); ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 2.5;
        const zx = hx + 10 + ph * 22 + Math.sin(ph * 6 + k) * 4, zy = hy - 24 - ph * 36;
        ctx.strokeText('z', zx, zy); ctx.fillText('z', zx, zy);
      }
      ctx.globalAlpha = 1;
    }
  },
  drawChair(r, g) {
    const ctx = r.ctx, c = CFG.SECRET.chair, rock = Math.sin(g.time * 1.3) * 0.06;
    ctx.save(); ctx.translate(c.x, c.y + 4); ctx.rotate(rock);
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(0, 0, 14, Math.PI * 0.15, Math.PI * 0.85); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill();   // rockers
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, -11, -12, 22, 8, 3); ctx.fill();          // seat
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(-9, -4, 3, 7); ctx.fillRect(6, -4, 3, 7);          // legs
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, 5, -34, 5, 24, 2); ctx.fill();                // back post
    for (const dy of [-30, -24, -18]) ctx.fillRect(-9, dy, 15, 2.5);                            // back slats
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(-11, -30, 3, 20);
    ctx.fillStyle = '#e84c6a'; U.roundRect(ctx, -9, -14, 17, 5, 2); ctx.fill();               // a little cushion
    ctx.restore();
  },
  drawSquirrel(r, g) {
    const ctx = r.ctx, q = this.st.squirrel, f = q.facing, x = q.x, y = q.y - 9;
    const tailWag = q.hop ? 0.3 : Math.sin(q.flick * 6) * 0.12;
    if (!q.hop) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y + 8, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    // bushy tail curling up behind
    ctx.save(); ctx.translate(-7, 2); ctx.rotate(tailWag);
    ctx.fillStyle = '#b5651d'; ctx.beginPath(); ctx.ellipse(-3, -8, 5, 10, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d2843a'; ctx.beginPath(); ctx.ellipse(-3.5, -9, 2.5, 6, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#b5651d'; ctx.beginPath(); ctx.ellipse(0, 1, 7, 6, 0, 0, Math.PI * 2); ctx.fill();         // body
    ctx.fillStyle = '#f1d3a8'; ctx.beginPath(); ctx.ellipse(1, 2.5, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();   // tummy
    ctx.fillStyle = '#b5651d'; ctx.beginPath(); ctx.arc(6, -5, 5, 0, Math.PI * 2); ctx.fill();                  // head
    ctx.beginPath(); ctx.ellipse(4, -10, 1.6, 2.6, -0.3, 0, Math.PI * 2); ctx.ellipse(8, -10, 1.6, 2.6, 0.3, 0, Math.PI * 2); ctx.fill();   // ears
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(8, -5.5, 1.1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(10.6, -3.6, 1, 0, Math.PI * 2); ctx.fill();   // eye, nose
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(4, 4, 2.6, 1.8, 0, 0, Math.PI * 2); ctx.fill();     // paws holding an acorn
    ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.arc(5.5, 1.5, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(3.5, -1.5, 4, 1.5);
    ctx.restore();
  },
  overlay(r, g) {
    if (g.area !== 'town' || !this.st) return;
    const ctx = r.ctx, S = CFG.SECRET, t = g.time, C = S.clearing;
    // chimney smoke
    const ch = S.cabin.chimney.x, top = S.cabin.roofTop - 4;
    for (let k = 0; k < 4; k++) {
      const ph = (t * 0.22 + k / 4) % 1;
      ctx.globalAlpha = (1 - ph) * 0.55; ctx.fillStyle = '#f3efe3';
      ctx.beginPath(); ctx.arc(ch + Math.sin(ph * 5 + k) * 6 + ph * 10, top - ph * 46, 4 + ph * 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // two butterflies wandering the clearing
    const flutter = (k, c1, c2) => {
      const a = t * (0.5 + k * 0.13) + k * 2.1;
      const x = C.x + Math.sin(a) * (C.rx - 40) * (0.6 + 0.3 * Math.sin(a * 0.37 + k)), y = C.y - 26 + Math.cos(a * 0.8 + k) * (C.ry - 40) + Math.sin(t * 5 + k) * 3;
      const vx = Math.cos(a), flap = Math.abs(Math.sin(t * 14 + k * 2));
      ctx.save(); ctx.translate(x, y); ctx.scale(vx < 0 ? -1 : 1, 1);
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(-4 * flap - 1, -3, 5 * flap + 1, 4.5, -0.3, 0, Math.PI * 2); ctx.ellipse(4 * flap + 1, -3, 5 * flap + 1, 4.5, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(-3 * flap - 1, 2, 3.5 * flap + 0.8, 3, -0.3, 0, Math.PI * 2); ctx.ellipse(3 * flap + 1, 2, 3.5 * flap + 0.8, 3, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -1, -5, 2, 10, 1); ctx.fill();
      ctx.restore();
    };
    flutter(0, '#ffd166', '#ff8fab'); flutter(1, '#9ad0ff', '#fff');
    // the beehive hangs under the canopy of its tree (drawn here so it sits over the swaying leaves), bees humming round it
    const hv = S.hive, sway = hv.tree ? Math.sin(t * 1.2 + hv.tree.x) * 2 : 0;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(hv.x + sway - 1, hv.y - 26, 2, 12);
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(hv.x + sway, hv.y - 4, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8862c'; for (const dy of [-10, -4, 2]) ctx.fillRect(hv.x + sway - 10, hv.y + dy, 20, 1.6);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hv.x + sway, hv.y + 2, 2.4, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 3; k++) {
      const a = t * 2.2 + k * 2.1, bx = hv.x + sway + Math.cos(a) * (16 + k * 4), by = hv.y - 4 + Math.sin(a * 1.7) * 10 - k * 3;
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(bx - 1, by - 3, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.ellipse(bx + 1.5, by - 3, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(bx, by, 3.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(bx - 1.2, by - 2, 1, 4); ctx.fillRect(bx + 0.8, by - 2, 1, 4);
    }
  },

  // ======================= inside the cabin: the player's little home =======================
  owned(g, key) { return !!(g.s.cabin && g.s.cabin.owned[key]); },
  action(g) {
    const p = g.player, H = CFG.SECRET.HOME;
    if (g.driving || g.onTrain || g.ride || g.travel) return null;
    if (g.area === 'town' && U.dist(p.x, p.y, H.porchDoor.x, H.porchDoor.y) < 30) return { label: '🚪 Go inside', run: (gg) => this.enterHome(gg) };
    if (g.area !== 'cabin') return null;
    const st = this.st;
    if (st.view.on) return { label: '🚶 Done looking', run: (gg) => this.stopViewing(gg) };
    if (st.cat.on) return this.catalogAction(g);
    if (U.dist(p.x, p.y, H.exit.x, H.exit.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leaveHome(gg) };
    if (U.dist(p.x, p.y, H.catalog.x, H.catalog.y) < H.catalog.reach) return { label: '📖 Open the catalog', run: (gg) => this.openCatalog(gg) };
    if (this.owned(g, 'telescope') && U.dist(p.x, p.y, H.eye.x, H.eye.y) < 40) return { label: '🔭 Look at the stars', run: (gg) => this.startViewing(gg) };
    return null;
  },
  enterHome(g) {
    const H = CFG.SECRET.HOME, p = g.player;
    g.area = 'cabin'; p.x = H.exit.x; p.y = H.exit.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.cabin.seen) { g.s.cabin.seen = true; g.toast('🏡 Your very own cabin!', true); }
  },
  leaveHome(g) {
    const H = CFG.SECRET.HOME, p = g.player;
    g.area = 'town'; p.x = H.porchDoor.x; p.y = H.porchDoor.y; p.moving = false; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.drop();
  },
  homeBlocks(g) {
    const H = CFG.SECRET.HOME, R = H.room, w = H.wall, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: H.fire.x - 35, y: R.y0 - 4, w: 70, h: 42 });                                   // hearth
    o.push({ x: H.bed.x0, y: H.bed.y0, w: H.bed.x1 - H.bed.x0, h: H.bed.y1 - H.bed.y0 });
    o.push({ x: H.table.x - 24, y: H.table.y - 22, w: 48, h: 44 });
    for (const c of H.chairs) o.push({ x: c.x - 10, y: c.y - 12, w: 20, h: 24 });
    o.push({ x: H.counter.x0, y: H.counter.y0, w: H.counter.x1 - H.counter.x0, h: H.counter.y1 - H.counter.y0 });
    for (const it of H.items) if (it.block && this.owned(g, it.key)) o.push({ x: it.block[0], y: it.block[1], w: it.block[2], h: it.block[3] });
    return o;
  },
  // ---------- the catalog: one item per page, pages turn with left/right, the big button buys ----------
  openCatalog(g) { const c = this.st.cat, p = g.player; c.on = true; c.page = 0; c.flip = null; c.ready = false; c.bought = 0; c.nope = 0; c.hold = { x: p.x, y: p.y }; p.moving = false; Sfx.pickup(); Haptics.tap(); },
  closeCatalog(g) { this.st.cat.on = false; this.st.cat.hold = null; Sfx.drop(); },
  catalogPages() { return CFG.SECRET.HOME.items.length + 1; },
  turnPage(g, dir) {
    const c = this.st.cat, n = this.catalogPages(), to = c.page + dir;
    if (to < 0 || to >= n || c.flip) return;
    c.flip = { from: c.page, to, t: 0, dur: 0.32 }; c.page = to; c.bought = 0; c.nope = 0; Sfx.pickup();
  },
  catalogAction(g) {
    const c = this.st.cat, H = CFG.SECRET.HOME;
    if (c.page === 0) return { label: '📕 Close the catalog', run: (gg) => this.closeCatalog(gg) };
    const it = H.items[c.page - 1];
    if (this.owned(g, it.key)) return { label: '✅ You have this one!', run: (gg) => this.turnPage(gg, c.page < this.catalogPages() - 1 ? 1 : -1) };
    if (g.s.cash >= it.price) return { label: `🛒 Buy for ${U.money(it.price)}`, run: (gg) => this.buyItem(gg, it) };
    return { label: `💰 Need ${U.money(it.price - g.s.cash)} more`, run: (gg) => { c.nope = 1.4; Sfx.error(); } };
  },
  buyItem(g, it) {
    const c = this.st.cat;
    if (this.owned(g, it.key) || g.s.cash < it.price) return;
    g.s.cash -= it.price; g.s.cabin.owned[it.key] = true;
    Sfx.buy(); Haptics.success(); c.bought = 1.8; c.nope = 0;
    this.nudgeOut(g, it);
    g.fx.push({ kind: 'sparkle', x0: it.spot.x, y0: it.spot.y, x1: it.spot.x, y1: it.spot.y, t: 0, dur: 0.8 });
    g.floats.push({ x: g.player.x, y: g.player.y - 50, text: `${it.ico} It's in your cabin!`, color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },
  // A newly solid item must never appear under the chef: step to the nearest free spot beside it.
  nudgeOut(g, it) {
    const p = g.player, b = it.block, r = 12;
    if (!b || !(p.x + r > b[0] && p.x - r < b[0] + b[2] && p.y + r > b[1] && p.y - r < b[1] + b[3])) return;
    const blocks = this.homeBlocks(g), cands = [[b[0] - r - 2, p.y], [b[0] + b[2] + r + 2, p.y], [p.x, b[1] - r - 2], [p.x, b[1] + b[3] + r + 2]];
    let best = null, bd = 1e9;
    for (const [x, y] of cands) { if (!this.homeFree(g, x, y, blocks)) continue; const d = U.dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = [x, y]; } }
    if (best) { p.x = best[0]; p.y = best[1]; } else this.rescueHome(g);
    if (this.st.cat.hold) this.st.cat.hold = { x: p.x, y: p.y };
  },
  // ---------- the telescope: a frozen look at the night sky ----------
  startViewing(g) { const v = this.st.view, H = CFG.SECRET.HOME, p = g.player; v.on = true; v.t = 0; v.shoot = null; v.shootT = 2.5; v.wish = 0; v.label = 0; v.labelT = 0; p.x = H.eye.x; p.y = H.eye.y; p.moving = false; p.facing = 1; this.st.fade = 0.45; Sfx.ding(); Haptics.tap(); },
  stopViewing(g) { this.st.view.on = false; this.st.fade = 0.45; Sfx.drop(); },
  bgKey(g) { return g.s.cabin ? 'cabin:' + CFG.SECRET.HOME.items.map((it) => this.owned(g, it.key) ? 1 : 0).join('') : ''; },
  homeHint(g) {
    const p = g.player, H = CFG.SECRET.HOME, st = this.st, s = g.s;
    if (st.view.on || st.cat.on) return null;                       // the overlays explain themselves
    if (this.owned(g, 'telescope') && U.dist(p.x, p.y, H.eye.x, H.eye.y) < 40) return { text: 'Look through the telescope! 🔭', target: null };
    if (U.dist(p.x, p.y, H.catalog.x, H.catalog.y) < H.catalog.reach) return { text: 'Open the catalog to decorate 📖', target: null };
    const left = H.items.filter((it) => !this.owned(g, it.key));
    if (!left.length) return { text: 'Walk to the door to go outside', target: H.exit };
    if (left.some((it) => s.cash >= it.price)) return { text: 'Open the catalog to decorate 📖', target: H.catalog };
    return { text: 'Cosy! Your very own cabin 🏡', target: null };
  },
  // Is this point somewhere the chef can stand: inside the room and not inside a wall or a solid piece of furniture?
  homeFree(g, x, y, blocks) {
    const R = CFG.SECRET.HOME.room, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of blocks || this.homeBlocks(g)) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // Rescue: a save (or a push) that left the chef outside the walls or inside furniture goes back onto the door mat.
  rescueHome(g) {
    const p = g.player, H = CFG.SECRET.HOME;
    if (this.homeFree(g, p.x, p.y)) return false;
    p.x = H.exit.x; p.y = H.exit.y - 8; p.moving = false;
    if (this.st.cat.hold) this.st.cat.hold = { x: p.x, y: p.y };
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  updateHome(g, dt) {
    const st = this.st, p = g.player, H = CFG.SECRET.HOME, t = g.time;
    if (!st.view.on) this.rescueHome(g);
    // looking through the telescope: stay at the eyepiece, time the shooting stars and the label
    if (st.view.on) {
      const v = st.view; p.x = H.eye.x; p.y = H.eye.y; p.moving = false; p.facing = 1;
      v.t += dt; v.wish = Math.max(0, v.wish - dt); v.labelT += dt;
      if (v.labelT > 9) { v.labelT = 0; v.label = (v.label + 1) % 5; }
      if (v.shoot) { v.shoot.t += dt; if (v.shoot.t > v.shoot.dur) v.shoot = null; }
      else { v.shootT -= dt; if (v.shootT <= 0) { v.shootT = U.rand(4, 9); const fromLeft = Math.random() < 0.5; v.shoot = { u: fromLeft ? U.rand(0.05, 0.4) : U.rand(0.6, 0.95), v: U.rand(0.08, 0.4), du: (fromLeft ? 1 : -1) * U.rand(0.35, 0.5), dv: U.rand(0.18, 0.3), t: 0, dur: U.rand(0.9, 1.3) }; v.wish = 3.2; } }
    }
    // reading the catalog: stay put, left/right turn the pages, down closes it
    if (st.cat.on) {
      const c = st.cat; p.x = c.hold.x; p.y = c.hold.y; p.moving = false;
      c.bought = Math.max(0, c.bought - dt); c.nope = Math.max(0, c.nope - dt);
      if (c.flip) { c.flip.t += dt; if (c.flip.t >= c.flip.dur) c.flip = null; }
      const a = Input.axis();
      if (Math.abs(a.x) < 0.3 && Math.abs(a.y) < 0.3) c.ready = true;
      else if (c.ready) {
        c.ready = false;
        if (a.y > 0.5 && Math.abs(a.x) < 0.5) this.closeCatalog(g);
        else if (a.x > 0.5) this.turnPage(g, 1);
        else if (a.x < -0.5) this.turnPage(g, -1);
      }
    }
    // the cuckoo pops out once a minute
    if (this.owned(g, 'clock')) {
      const minute = Math.floor(t / 60);
      if (minute !== st.cuckoo && t % 60 < 0.05) { st.cuckoo = minute; const c = H.items.find((it) => it.key === 'clock').spot; g.floats.push({ x: c.x, y: c.y - 16, text: 'Cuckoo!', color: '#ffe08a', t: 0, dur: 1.4, big: true }); Sfx.ding(); }
    }
    // music notes drift up from the record player while you stand near it
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.8);
    const rec = H.items.find((it) => it.key === 'record').spot;
    if (this.owned(g, 'record') && U.dist(p.x, p.y, rec.x, rec.y) < 80) { st.noteT -= dt; if (st.noteT <= 0) { st.noteT = 0.55; st.notes.push({ x: rec.x + U.rand(-14, 14), y: rec.y - 16, ch: U.pick(['♪', '♫', '♩']), t: 0 }); } }
    else st.noteT = 0;
  },
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'cabin' && this.st.view.on) this.drawSkyView(r, g, W, H);
    else if (g.area === 'cabin' && this.st.cat.on) this.drawCatalog(r, g, W, H);
    if (this.st.fade <= 0) return;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },

  // ---------- the interior, static ----------
  paint: {
    cabin(r, g) { SecretExt.paintHome(r, g); },
  },
  nightSky(ctx, x0, y0, x1, y1) {
    const grd = ctx.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, '#182040'); grd.addColorStop(1, '#2a3560');
    ctx.fillStyle = grd; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  },
  paintHome(r, g) {
    const ctx = r.ctx, H = CFG.SECRET.HOME, R = H.room, w = H.wall, W = CFG.AREAS.cabin.WORLD;
    // night outside: sky, stars, moon and a dark tree line
    this.nightSky(ctx, W.x0, W.y0, W.x1, W.y1);
    ctx.fillStyle = '#fff8c2';
    for (let i = 0; i < 70; i++) { const x = W.x0 + ((i * 193) % 600), y = W.y0 + ((i * 137) % 400), s = 0.8 + (i % 3) * 0.5; if (x > R.x0 - w - 6 && x < R.x1 + w + 6 && y > R.y0 - w - 6 && y < R.y1 + w + 6) continue; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(W.x1 - 40, W.y0 + 30, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#182040'; ctx.beginPath(); ctx.arc(W.x1 - 46, W.y0 + 25, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10251c';
    for (let x = W.x0; x < W.x1; x += 34) { const h = 26 + ((x * 7) % 18); ctx.beginPath(); ctx.moveTo(x, W.y1); ctx.lineTo(x + 17, W.y1 - h); ctx.lineTo(x + 34, W.y1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, W.y0); ctx.lineTo(x + 17, W.y0 + h * 0.6); ctx.lineTo(x + 34, W.y0); ctx.closePath(); ctx.fill(); }
    // the room: floorboards, then the log walls around them
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, R.y0 - w + 10, R.x1 - R.x0 + 2 * w, R.y1 - R.y0 + 2 * w);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let y = R.y0, k = 0; y < R.y1; y += 22, k++) {
      ctx.fillStyle = k % 2 ? '#ad7036' : '#b87c3e'; ctx.fillRect(R.x0, y, R.x1 - R.x0, Math.min(22, R.y1 - y));
      ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(R.x0, y, R.x1 - R.x0, 1.5);
      for (let x = R.x0 + ((k * 61) % 120); x < R.x1; x += 150) ctx.fillRect(x, y, 1.5, 22);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(R.x0 + 30 + ((i * 157) % 420), R.y0 + 12 + ((i * 97) % 260), 3, 1.6, 0, 0, Math.PI * 2); ctx.fill(); }
    const logRow = (x0, y0, len, vertical) => {
      for (let k = 0; k < 2; k++) {
        ctx.fillStyle = k ? '#a5693a' : '#9a6033';
        if (vertical) { U.roundRect(ctx, x0 + k * 13, y0, 12, len, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0 + k * 13 + 3, y0, 2, len); }
        else { U.roundRect(ctx, x0, y0 + k * 13, len, 12, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0 + k * 13 + 3, len, 2); }
      }
    };
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    logRow(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, false); logRow(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, false);
    logRow(R.x0 - w, R.y0, R.y1 - R.y0, true); logRow(R.x1, R.y0, R.y1 - R.y0, true);
    ctx.fillStyle = '#c99a5f'; for (const [cx, cy] of [[R.x0 - w, R.y0 - w], [R.x1, R.y0 - w], [R.x0 - w, R.y1], [R.x1, R.y1]]) { for (const [dx, dy] of [[6, 6], [19, 6], [6, 19], [19, 19]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 4.5, 0, Math.PI * 2); ctx.fill(); } }
    // fireplace: stone surround on the top wall, firebox, mantel with a photo of the bear, hearth stones on the floor
    const F = H.fire;
    ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, F.x - 38, R.y0 - w, 76, w + 42, 4); ctx.fill();
    ctx.fillStyle = '#a9acb1'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse(F.x - 32 + ((i * 29) % 64), R.y0 - w + 4 + ((i * 17) % 60), 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, F.x - 22, R.y0 - 12, 44, 36, 4); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, F.x - 16, R.y0 + 12, 32, 7, 3); ctx.fill(); U.roundRect(ctx, F.x - 12, R.y0 + 6, 24, 7, 3); ctx.fill();
    ctx.fillStyle = '#6e7177'; ctx.fillRect(F.x - 40, R.y0 - 14, 80, 4);                       // mantel shelf
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, F.x + 20, R.y0 - 24, 16, 12, 2); ctx.fill(); ctx.fillStyle = '#fff3d6'; ctx.fillRect(F.x + 22, R.y0 - 22, 12, 8);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐻', F.x + 28, R.y0 - 18);
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(F.x - 34, R.y0 - 22, 4, 9); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(F.x - 32, R.y0 - 24, 2, 3, 0, 0, Math.PI * 2); ctx.fill();   // candle
    // windows: the night outside, with a moon in the top one
    const win = (x0, y0, ww, hh, moon) => {
      ctx.fillStyle = '#f5f0dc'; U.roundRect(ctx, x0 - 4, y0 - 4, ww + 8, hh + 8, 3); ctx.fill();
      this.nightSky(ctx, x0, y0, x0 + ww, y0 + hh);
      ctx.fillStyle = '#fff8c2'; for (const [dx, dy] of [[6, 5], [ww - 9, 9], [ww / 2, hh - 6], [10, hh - 4]]) { ctx.beginPath(); ctx.arc(x0 + dx, y0 + dy, 1.2, 0, Math.PI * 2); ctx.fill(); }
      if (moon) { ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(x0 + ww - 12, y0 + 9, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1b2446'; ctx.beginPath(); ctx.arc(x0 + ww - 14, y0 + 7, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#f5f0dc'; ctx.fillRect(x0 + ww / 2 - 1, y0, 2, hh); ctx.fillRect(x0, y0 + hh / 2 - 1, ww, 2);
    };
    win(H.topWindow.x - 24, R.y0 - w + 3, 48, 20, true);
    win(R.x1 + 3, H.sideWindow.y - 22, 20, 44, false);
    // bed: wooden frame, white sheet, pillow and a patchwork quilt
    const B = H.bed;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(B.x0 + 3, B.y0 + 4, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0 - 3, B.y0 - 6, B.x1 - B.x0 + 6, B.y1 - B.y0 + 9, 5); ctx.fill();
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, B.x0 + 8, B.y0 + 6, B.x1 - B.x0 - 16, 18, 6); ctx.fill();
    const qc = ['#e4572e', '#3b7dd8', '#ffd166', '#56b862', '#ff8fab', '#9ad0ff'];
    for (let y = B.y0 + 32, k = 0; y < B.y1 - 2; y += 14) for (let x = B.x0 + 2; x < B.x1 - 2; x += 14, k++) { ctx.fillStyle = qc[k % 6]; ctx.fillRect(x, y, Math.min(13, B.x1 - 2 - x), Math.min(13, B.y1 - 2 - y)); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(B.x0 + 2, B.y0 + 32, B.x1 - B.x0 - 4, B.y1 - B.y0 - 34);
    // round table with two chairs, a mug and a candle
    const T = H.table;
    for (const c of H.chairs) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(c.x - 8, c.y - 8, 18, 22); ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, c.x - 10, c.y - 10, 20, 20, 4); ctx.fill(); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(c.x < T.x ? c.x - 12 : c.x + 8, c.y - 12, 4, 24); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 4, 26, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(T.x, T.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a5693a'; ctx.beginPath(); ctx.arc(T.x, T.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(T.x - 10, T.y + 6, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f5f0dc'; ctx.beginPath(); ctx.arc(T.x - 10, T.y + 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(T.x + 8, T.y - 4, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(T.x + 8, T.y - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    // kitchen corner: counter with a sink and a pot, a shelf of jars on the wall behind it
    const K = H.counter;
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0 - 6);
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, K.x0 + 42, K.y0 + 5, 32, 18, 4); ctx.fill(); ctx.fillStyle = '#9fe0ff'; U.roundRect(ctx, K.x0 + 46, K.y0 + 8, 24, 12, 3); ctx.fill();
    ctx.fillStyle = '#8c8f94'; ctx.fillRect(K.x0 + 57, K.y0 + 23, 3, 7);
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(K.x0 + 20, K.y0 + 14, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a5a6a'; ctx.beginPath(); ctx.arc(K.x0 + 20, K.y0 + 14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(K.x0, R.y1 + 4, K.x1 - K.x0, 4);
    for (const [dx, col] of [[8, '#e4572e'], [26, '#ffd166'], [44, '#56b862'], [62, '#ff8fab']]) { ctx.fillStyle = col; U.roundRect(ctx, K.x0 + dx, R.y1 + 9, 12, 12, 3); ctx.fill(); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(K.x0 + dx + 2, R.y1 + 8, 8, 3); }
    // the front door on the bottom wall, a mat inside, pegs with the spare chef hat, and the sign
    const D = H.door;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, D.x - D.w / 2 - 3, R.y1 - 2, D.w + 6, w + 2, 3); ctx.fill();
    ctx.fillStyle = '#7a4a22'; U.roundRect(ctx, D.x - D.w / 2, R.y1 + 1, D.w, w - 2, 3); ctx.fill();
    ctx.fillStyle = '#9fe0ff'; U.roundRect(ctx, D.x - 10, R.y1 + 5, 20, 8, 2); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(D.x + 14, R.y1 + 15, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8862c'; U.roundRect(ctx, D.x - 18, R.y1 - 16, 36, 13, 3); ctx.fill(); ctx.fillStyle = '#d9a066'; ctx.fillRect(D.x - 14, R.y1 - 13, 28, 7);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(D.x - 60, R.y1 + 6, 30, 4); ctx.fillStyle = '#c99a5f'; for (const dx of [-56, -44, -34]) ctx.fillRect(D.x + dx, R.y1 + 10, 3, 5);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, D.x - 50, R.y1 + 13, 14, 10, 3); ctx.fill(); U.roundRect(ctx, D.x - 52, R.y1 + 10, 18, 6, 3); ctx.fill();   // the spare hat
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, D.x + 30, R.y1 + 5, 92, 18, 4); ctx.fill(); ctx.fillStyle = '#b5773a'; U.roundRect(ctx, D.x + 33, R.y1 + 8, 86, 12, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏡 Home sweet home', D.x + 76, R.y1 + 14);
    // the mail-order catalog on a little stand by the door
    const C = H.catalog;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x - 10, C.y - 8, 26, 22);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x - 13, C.y - 11, 26, 22, 3); ctx.fill(); ctx.fillStyle = '#a5693a'; U.roundRect(ctx, C.x - 10, C.y - 8, 20, 16, 2); ctx.fill();
    ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(-0.25);
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, -9, -11, 18, 22, 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.fillRect(-7, -9, 14, 18);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(-7, -9, 14, 5); ctx.fillStyle = '#3f9a4a'; U.roundRect(ctx, -4, -2, 8, 7, 2); ctx.fill(); ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.moveTo(-5, -1); ctx.lineTo(0, -5); ctx.lineTo(5, -1); ctx.closePath(); ctx.fill();
    ctx.restore();
    // decorations you own (the rest wait in the catalog)
    for (const it of H.items) if (this.owned(g, it.key)) this.drawHomeItem(r, g, it);
  },
  drawHomeItem(r, g, it) {
    const ctx = r.ctx, x = it.spot.x, y = it.spot.y, R = CFG.SECRET.HOME.room;
    switch (it.key) {
      case 'rug':
        for (const [rx, ry, col] of [[66, 40, '#e4572e'], [56, 33, '#ffd166'], [44, 26, '#3b7dd8'], [32, 19, '#fff'], [20, 12, '#e4572e']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'teddy':
        ctx.fillStyle = '#c17f3a'; ctx.beginPath(); ctx.arc(x - 7, y - 10, 3.5, 0, Math.PI * 2); ctx.arc(x + 7, y - 10, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y + 6, 10, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f1d3a8'; ctx.beginPath(); ctx.ellipse(x, y - 3, 4.5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y + 7, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 4, y - 9, 1.1, 0, Math.PI * 2); ctx.arc(x + 4, y - 9, 1.1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 4.5, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x - 5, y - 2); ctx.lineTo(x - 5, y + 4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x + 5, y - 2); ctx.lineTo(x + 5, y + 4); ctx.closePath(); ctx.fill();
        break;
      case 'plant':
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b5532b'; U.roundRect(ctx, x - 9, y - 10, 18, 14, 3); ctx.fill(); ctx.fillStyle = '#d2673b'; U.roundRect(ctx, x - 11, y - 13, 22, 5, 2); ctx.fill();
        ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[0, -22, 9], [-9, -16, 7], [9, -17, 7], [-4, -26, 5], [5, -27, 5]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, rr, rr * 0.8, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.ellipse(x - 2, y - 24, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case 'jar':
        ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(x - 7, y - 14, 3.5, 0, Math.PI * 2); ctx.arc(x + 7, y - 14, 3.5, 0, Math.PI * 2); ctx.fill();
        U.roundRect(ctx, x - 10, y - 14, 20, 20, 7); ctx.fill();
        ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(x, y - 1, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 4, y - 7, 1.3, 0, Math.PI * 2); ctx.arc(x + 4, y - 7, 1.3, 0, Math.PI * 2); ctx.arc(x, y - 2.5, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, x - 7, y - 19, 14, 5, 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COOKIES', x, y + 3.5);
        break;
      case 'curtains':
        ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 40, y - 15, 80, 3);
        for (const side of [-1, 1]) { ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x + side * 26 - 12, y - 14, 24, 30, 4); ctx.fill(); ctx.fillStyle = '#ffd166'; for (const [dx, dy] of [[-5, -8], [3, -1], [-4, 7], [4, 11]]) { ctx.beginPath(); ctx.arc(x + side * 26 + dx, y + dy, 1.8, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.fillRect(x + side * 26 - 12, y + 3, 24, 3); }
        break;
      case 'fish':
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 10, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cfefff'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7fd1ff'; ctx.beginPath(); ctx.arc(x, y + 1, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d9a066'; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.arc(x + dx, y + 8, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#3f9a4a'; ctx.fillRect(x + 5, y - 2, 2, 9);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12, -2.4, -1.2); ctx.stroke();
        if (!this.owned(g, 'fish')) { ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.ellipse(x - 1, y, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'painting':
        ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, x - 20, y - 14, 40, 28, 3); ctx.fill();
        ctx.fillStyle = '#9ad0ff'; ctx.fillRect(x - 17, y - 11, 34, 22); ctx.fillStyle = '#7cc45f'; ctx.fillRect(x - 17, y + 4, 34, 7);
        r.drawPizza(x, y - 1, 8);
        break;
      case 'dogbed':
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 4, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a5693a'; ctx.beginPath(); ctx.ellipse(x, y, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9ad0ff'; ctx.beginPath(); ctx.ellipse(x, y + 1, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 4, y - 1, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case 'lamp':
        ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.ellipse(x, y + 6, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 1.5, y - 30, 3, 36);
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x - 13, y - 26); ctx.lineTo(x + 13, y - 26); ctx.lineTo(x + 8, y - 42); ctx.lineTo(x - 8, y - 42); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e0b44c'; ctx.fillRect(x - 13, y - 28, 26, 3);
        break;
      case 'armchair':
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, x - 17, y - 16, 40, 40, 8); ctx.fill();
        ctx.fillStyle = '#b23a48'; U.roundRect(ctx, x - 20, y - 20, 40, 40, 8); ctx.fill();
        ctx.fillStyle = '#c94c5c'; U.roundRect(ctx, x - 8, y - 12, 26, 24, 5); ctx.fill();                 // seat cushion (back on the left, facing the fire)
        ctx.fillStyle = '#8f2f3a'; U.roundRect(ctx, x - 20, y - 20, 10, 40, 5); ctx.fill(); U.roundRect(ctx, x - 12, y - 20, 32, 8, 4); ctx.fill(); U.roundRect(ctx, x - 12, y + 12, 32, 8, 4); ctx.fill();
        ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x - 6, y - 8, 10, 16, 3); ctx.fill();                  // a little cushion
        break;
      case 'clock':
        ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(x - 16, y - 8); ctx.lineTo(x, y - 20); ctx.lineTo(x + 16, y - 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 13, y - 9, 26, 24, 3); ctx.fill();
        ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, x - 5, y - 8, 10, 7, 2); ctx.fill();                   // the bird's little door
        ctx.fillStyle = '#f5f0dc'; ctx.beginPath(); ctx.arc(x, y + 6, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 1.5); ctx.moveTo(x, y + 6); ctx.lineTo(x + 4, y + 7); ctx.stroke();
        break;
      case 'books': {
        ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, x - 37, y - 18, 74, 36, 3); ctx.fill();
        const cols = ['#e4572e', '#3b7dd8', '#ffd166', '#56b862', '#ff8fab', '#8e5bd1', '#ff8c42'];
        for (let row = 0; row < 2; row++) for (let k = 0; k < 11; k++) { ctx.fillStyle = cols[(k + row * 3) % 7]; ctx.fillRect(x - 33 + k * 6, y - 15 + row * 17, 5, 14 - (k % 3)); }
        ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 37, y - 1, 74, 2);
        break;
      }
      case 'record':
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, x - 17, y - 10, 40, 28, 4); ctx.fill();
        ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - 20, y - 13, 40, 26, 4); ctx.fill();
        ctx.fillStyle = '#a5693a'; U.roundRect(ctx, x - 17, y - 10, 34, 20, 3); ctx.fill();
        if (!this.owned(g, 'record')) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 4, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x - 4, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x + 9, y - 7, 2, 10); ctx.beginPath(); ctx.arc(x + 10, y - 7, 2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'oven':
        ctx.fillStyle = '#6e7177'; U.roundRect(ctx, x - 25, y - 26, 52, 54, 6); ctx.fill();
        ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, x - 22, y - 23, 46, 48, 5); ctx.fill();
        ctx.fillStyle = '#a9acb1'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(x - 18 + ((i * 23) % 38), y - 18 + ((i * 17) % 40), 4, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 6, y - 10, 28, 22, 8); ctx.fill();                   // the mouth faces right into the kitchen
        ctx.fillStyle = '#b23a3a'; U.roundRect(ctx, x - 22, y - 23, 46, 8, 3); ctx.fill();
        if (!this.owned(g, 'oven')) { ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.ellipse(x + 8, y + 2, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 24, y + 14, 12, 12); ctx.fillStyle = '#d7b98a'; ctx.beginPath(); ctx.arc(x - 18, y + 20, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'telescope':
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 14, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#5b3a1a'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 13); ctx.moveTo(x, y); ctx.lineTo(x + 10, y + 13); ctx.moveTo(x, y); ctx.lineTo(x + 1, y + 15); ctx.stroke();   // tripod
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.22);                                                                     // the tube points right, through the window
        ctx.fillStyle = '#1f2a38'; U.roundRect(ctx, -16, -4, 10, 8, 3); ctx.fill();                                              // eyepiece, toward the room
        ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -8, -6, 32, 12, 4); ctx.fill(); ctx.fillStyle = '#4a5a6a'; ctx.fillRect(-6, -4, 28, 2);
        ctx.fillStyle = '#ffd166'; U.roundRect(ctx, 20, -7, 6, 14, 2); ctx.fill(); ctx.fillStyle = '#9ad0ff'; ctx.fillRect(25, -5, 2, 10);   // brass ring and the lens
        ctx.restore();
        break;
    }
  },

  // ---------- the interior, each frame ----------
  homeDynamic(r, g) {
    const ctx = r.ctx, H = CFG.SECRET.HOME, R = H.room, W = CFG.AREAS.cabin.WORLD, t = g.time, st = this.st, p = g.player;
    // the view is bigger than this little map: paint night sky over whatever shows outside it
    const vx0 = r.camX - 10, vy0 = r.camY - 10, vx1 = r.camX + r.viewW + 10, vy1 = r.camY + r.viewH + 10;
    ctx.fillStyle = '#182040';
    if (vy0 < W.y0) ctx.fillRect(vx0, vy0, vx1 - vx0, W.y0 - vy0);
    if (vy1 > W.y1) ctx.fillRect(vx0, W.y1, vx1 - vx0, vy1 - W.y1);
    if (vx0 < W.x0) ctx.fillRect(vx0, W.y0, W.x0 - vx0, W.y1 - W.y0);
    if (vx1 > W.x1) ctx.fillRect(W.x1, W.y0, vx1 - W.x1, W.y1 - W.y0);
    const glow = (x, y, rad, a, col = '255,190,100') => { const gr = ctx.createRadialGradient(x, y, 2, x, y, rad); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); };
    const fl = 0.85 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
    // the fire crackles in the fireplace
    const F = H.fire;
    glow(F.x, R.y0 + 30, 70 * fl, 0.28);
    for (let k = 0; k < 3; k++) {
      const ph = t * (6 + k) + k * 2, dx = (k - 1) * 8 + Math.sin(ph) * 2, h = 16 + Math.sin(ph * 1.3) * 4 - k * 2;
      ctx.fillStyle = k === 2 ? '#ffe08a' : k === 1 ? '#ffb347' : '#ff7a2e';
      ctx.beginPath(); ctx.moveTo(F.x + dx - 7 + k, R.y0 + 14); ctx.quadraticCurveTo(F.x + dx - 8, R.y0 + 14 - h * 0.6, F.x + dx + Math.sin(ph * 2) * 2, R.y0 + 14 - h); ctx.quadraticCurveTo(F.x + dx + 8, R.y0 + 14 - h * 0.6, F.x + dx + 7 - k, R.y0 + 14); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#ffe08a'; for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(F.x - 8 + k * 8 + Math.sin(ph * 8 + k) * 3, R.y0 + 10 - ph * 26, 1.2, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    const spot = (key) => H.items.find((it) => it.key === key).spot;
    if (this.owned(g, 'lamp')) { const L = spot('lamp'); glow(L.x, L.y - 30, 60 * fl, 0.3); }
    if (this.owned(g, 'oven')) { const O = spot('oven'); glow(O.x + 10, O.y + 2, 30 * fl, 0.4, '255,140,60'); ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.ellipse(O.x + 8, O.y + 2, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(O.x + 7, O.y + 2 + Math.sin(t * 11) * 0.6, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    if (this.owned(g, 'fish')) {
      const B = spot('fish'), fx = Math.sin(t * 1.1) * 5, dir = Math.cos(t * 1.1) < 0 ? -1 : 1;
      ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.ellipse(B.x + fx, B.y + Math.sin(t * 3) * 1.5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(B.x + fx - dir * 4, B.y); ctx.lineTo(B.x + fx - dir * 8, B.y - 3); ctx.lineTo(B.x + fx - dir * 8, B.y + 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(B.x + fx + dir * 2.5, B.y - 0.8, 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(B.x - 3, B.y - 6 - (t * 6 % 5), 1, 0, Math.PI * 2); ctx.fill();
    }
    if (this.owned(g, 'clock')) {
      const C = spot('clock'), sw = Math.sin(t * 3.2) * 0.35;
      ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(C.x, C.y + 15); ctx.lineTo(C.x + Math.sin(sw) * 14, C.y + 15 + Math.cos(sw) * 14); ctx.stroke();
      ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(C.x + Math.sin(sw) * 14, C.y + 15 + Math.cos(sw) * 14, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(C.x, C.y + 6); ctx.lineTo(C.x + Math.sin(t * 0.2) * 4.5, C.y + 6 - Math.cos(t * 0.2) * 4.5); ctx.stroke();
      if (t % 60 < 2) { const out = Math.sin(Math.min(1, (t % 60) / 0.3) * Math.PI / 2) * 6; ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(C.x, C.y - 4 + out, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(C.x + 3, C.y - 4 + out); ctx.lineTo(C.x + 7, C.y - 3 + out); ctx.lineTo(C.x + 3, C.y - 2 + out); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(C.x + 1, C.y - 5 + out, 0.8, 0, Math.PI * 2); ctx.fill(); }
    }
    if (this.owned(g, 'record')) {
      const Rc = spot('record');
      ctx.save(); ctx.translate(Rc.x - 4, Rc.y); ctx.rotate(t * 4);
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-0.5, -3, 1, 1.5);
      ctx.restore();
      ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const n of st.notes) { ctx.globalAlpha = 1 - n.t / 1.8; ctx.fillStyle = '#8e5bd1'; ctx.fillText(n.ch, n.x + Math.sin(n.t * 4) * 6, n.y - n.t * 26); }
      ctx.globalAlpha = 1;
    }
    if (this.owned(g, 'dogbed')) this.drawSleepingDog(r, g, spot('dogbed').x, spot('dogbed').y);
  },
  // ---------- looking through the telescope (screen space) ----------
  drawSkyView(r, g, W, H) {
    const ctx = r.ctx, v = this.st.view, t = v.t;
    const D = Math.max(200, Math.min(W * 0.92, H - 128)), R = D / 2, cx = W / 2, cy = 56 + (H - 128) / 2;
    ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const sky = ctx.createLinearGradient(0, cy - R, 0, cy + R); sky.addColorStop(0, '#070b1e'); sky.addColorStop(0.65, '#101a3f'); sky.addColorStop(1, '#1d2c5c');
    ctx.fillStyle = sky; ctx.fillRect(cx - R, cy - R, D, D);
    const swx = Math.sin(t * 0.23) * R * 0.035, swy = Math.cos(t * 0.17) * R * 0.025;   // slow parallax sway
    const px = (u, d) => cx + (u - 0.5) * D * 1.35 + swx * d, py = (vv, d) => cy + (vv - 0.5) * D * 1.35 + swy * d;
    // the Milky Way: a soft rotated band
    ctx.save(); ctx.translate(cx + swx * 0.3, cy + swy * 0.3); ctx.rotate(-0.6);
    const band = ctx.createLinearGradient(0, -R * 0.4, 0, R * 0.4); band.addColorStop(0, 'rgba(190,205,255,0)'); band.addColorStop(0.5, 'rgba(200,210,255,0.16)'); band.addColorStop(1, 'rgba(190,205,255,0)');
    ctx.fillStyle = band; ctx.fillRect(-R * 1.6, -R * 0.4, R * 3.2, R * 0.8);
    ctx.restore();
    // stars, twinkling
    for (const s of this.stars) {
      const a = 0.5 + 0.5 * Math.sin(t * s.tw + s.ph), x = px(s.u, s.d), y = py(s.v, s.d);
      ctx.globalAlpha = 0.35 + 0.65 * a; ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
      if (s.big && a > 0.7) { ctx.globalAlpha = (a - 0.7) * 1.5; ctx.fillRect(x - s.r * 3, y - 0.5, s.r * 6, 1); ctx.fillRect(x - 0.5, y - s.r * 3, 1, s.r * 6); }
    }
    ctx.globalAlpha = 1;
    // a ringed planet
    const plx = px(0.2, 0.8), ply = py(0.62, 0.8), pr = R * 0.045;
    ctx.save(); ctx.translate(plx, ply); ctx.rotate(-0.4);
    ctx.strokeStyle = 'rgba(255,225,170,0.55)'; ctx.lineWidth = pr * 0.35; ctx.beginPath(); ctx.ellipse(0, 0, pr * 2.1, pr * 0.55, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = '#e9c48a'; ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4a86a'; ctx.fillRect(-pr, -pr * 0.3, pr * 2, pr * 0.22); ctx.fillRect(-pr * 0.9, pr * 0.25, pr * 1.8, pr * 0.18);
    ctx.strokeStyle = 'rgba(255,235,190,0.9)'; ctx.beginPath(); ctx.ellipse(0, 0, pr * 2.1, pr * 0.55, 0, Math.PI + 0.15, Math.PI * 2 - 0.15); ctx.stroke();
    ctx.restore();
    // the moon: big, friendly, with craters and a soft glow
    const mx = px(0.72, 1), my = py(0.27, 1), mr = R * 0.19;
    const mg = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 2.2); mg.addColorStop(0, 'rgba(255,245,200,0.35)'); mg.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6efd0'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy, rr] of [[-0.45, -0.3, 0.16], [0.3, -0.45, 0.11], [0.4, 0.3, 0.2], [-0.2, 0.45, 0.12], [-0.05, 0.05, 0.08], [0.6, -0.1, 0.07]]) {
      ctx.fillStyle = '#e2d8b0'; ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d2c79c'; ctx.beginPath(); ctx.arc(mx + dx * mr + rr * mr * 0.2, my + dy * mr + rr * mr * 0.25, rr * mr * 0.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#b9ad84'; ctx.lineWidth = Math.max(1.5, mr * 0.05); ctx.lineCap = 'round';                               // a sleepy little smile
    ctx.beginPath(); ctx.arc(mx - mr * 0.28, my - mr * 0.12, mr * 0.07, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(mx + mr * 0.02, my - mr * 0.12, mr * 0.07, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(mx - mr * 0.13, my + mr * 0.1, mr * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // constellations light up one after the other
    ctx.lineWidth = 1.2; ctx.font = r.font(Math.max(11, R * 0.05)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.constellations.forEach((c, k) => {
      const lit = 0.5 + 0.5 * Math.sin(t * 0.35 + k * Math.PI);
      ctx.strokeStyle = `rgba(160,200,255,${(0.65 * lit).toFixed(3)})`;
      ctx.beginPath(); for (const [a, b] of c.edges) { ctx.moveTo(px(c.pts[a][0], 0.6), py(c.pts[a][1], 0.6)); ctx.lineTo(px(c.pts[b][0], 0.6), py(c.pts[b][1], 0.6)); } ctx.stroke();
      for (const [u, vv] of c.pts) { const x = px(u, 0.6), y = py(vv, 0.6); ctx.fillStyle = `rgba(200,225,255,${(0.25 * lit).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2 + lit, 0, Math.PI * 2); ctx.fill(); }
      if (lit > 0.6) { ctx.globalAlpha = (lit - 0.6) / 0.4; ctx.fillStyle = '#cfe6ff'; ctx.fillText(c.name, px(c.pts[0][0] + 0.11, 0.6), py(c.pts[0][1] - 0.08, 0.6)); ctx.globalAlpha = 1; }
    });
    // a slow comet, a blinking satellite, and now and then a shooting star
    const cu = ((t * 0.011) % 1.4) - 0.2, cvv = 0.18 + cu * 0.22, cxx = px(cu, 0.7), cyy = py(cvv, 0.7);
    const tail = ctx.createLinearGradient(cxx, cyy, cxx - R * 0.22, cyy - R * 0.1); tail.addColorStop(0, 'rgba(180,220,255,0.7)'); tail.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.strokeStyle = tail; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cxx, cyy); ctx.lineTo(cxx - R * 0.22, cyy - R * 0.1); ctx.stroke();
    ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.arc(cxx, cyy, 2.5, 0, Math.PI * 2); ctx.fill();
    const su = ((t % 26) / 26) * 1.3 - 0.15, sx = px(su, 0.5), sy = py(0.52 - su * 0.15, 0.5);
    ctx.fillStyle = '#9ad0ff'; ctx.fillRect(sx - 9, sy - 1.5, 6, 3); ctx.fillRect(sx + 3, sy - 1.5, 6, 3); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(sx - 2, sy - 2, 4, 4);
    if (t % 1 < 0.5) { ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(sx, sy - 3.5, 1.5, 0, Math.PI * 2); ctx.fill(); }
    if (v.shoot) {
      const sh = v.shoot, k = sh.t / sh.dur, hx = px(sh.u + sh.du * k, 0), hy = py(sh.v + sh.dv * k, 0), len = R * 0.3 * Math.sin(k * Math.PI);
      const ang = Math.atan2(sh.dv, sh.du), tx = hx - Math.cos(ang) * len, ty = hy - Math.sin(ang) * len;
      const tg = ctx.createLinearGradient(hx, hy, tx, ty); tg.addColorStop(0, 'rgba(255,255,255,0.95)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = tg; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
    }
    // pine tops along the bottom edge, with an owl
    ctx.fillStyle = '#050d09';
    for (let i = 0; i < 14; i++) { const x = cx - R + (i + 0.5) * (D / 14) + swx * 1.3, h = R * (0.22 + ((i * 7) % 5) * 0.03), base = cy + R + 2; ctx.beginPath(); ctx.moveTo(x - D / 20, base); ctx.lineTo(x, base - h); ctx.lineTo(x + D / 20, base); ctx.closePath(); ctx.fill(); }
    const ox = cx - R * 0.25 + swx * 1.3, oy = cy + R * 0.77;
    ctx.fillStyle = '#050d09'; ctx.beginPath(); ctx.ellipse(ox, oy, R * 0.035, R * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox - R * 0.03, oy - R * 0.03); ctx.lineTo(ox - R * 0.035, oy - R * 0.065); ctx.lineTo(ox - R * 0.01, oy - R * 0.04); ctx.moveTo(ox + R * 0.03, oy - R * 0.03); ctx.lineTo(ox + R * 0.035, oy - R * 0.065); ctx.lineTo(ox + R * 0.01, oy - R * 0.04); ctx.fill();
    if (t % 6 > 0.25) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(ox - R * 0.013, oy - R * 0.02, R * 0.008, 0, Math.PI * 2); ctx.arc(ox + R * 0.013, oy - R * 0.02, R * 0.008, 0, Math.PI * 2); ctx.fill(); }
    // vignette inside the eyepiece
    const vg = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, D, D);
    ctx.restore();
    // the telescope's rim
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = Math.max(6, R * 0.05); ctx.beginPath(); ctx.arc(cx, cy, R + ctx.lineWidth / 2 - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#b8862c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2); ctx.stroke();
    // a little label
    const labels = ['So many stars! ✨', 'Hello, Moon! 🌙', 'Can you find the Big Dipper?', 'The planet has a ring! 🪐', 'Shh… the owl is watching 🦉'];
    const text = v.wish > 0 ? 'A shooting star! Make a wish 🌠' : labels[v.label % labels.length];
    ctx.font = r.font(W < 480 ? 13 : 15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lw = ctx.measureText(text).width + 24, ly = cy + R - 30;
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, cx - lw / 2, ly - 13, lw, 26, 13); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.fillText(text, cx, ly);
  },

  // ---------- the decoration catalog (screen space) ----------
  drawCatalog(r, g, W, H) {
    const ctx = r.ctx, c = this.st.cat, items = CFG.SECRET.HOME.items, n = this.catalogPages();
    ctx.fillStyle = 'rgba(10,8,6,0.72)'; ctx.fillRect(0, 0, W, H);
    const cw = Math.min(360, W - 32), ch = Math.min(440, H - 150), cx = W / 2, cy = 56 + (H - 128) / 2;
    // page flip: the card squashes to a spine and back, the content switches half way
    let sq = 1, page = c.page;
    if (c.flip) { const k = c.flip.t / c.flip.dur; sq = Math.abs(Math.cos(k * Math.PI)); if (k < 0.5) page = c.flip.from; }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.04, sq), 1); ctx.translate(-cx, -cy);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, cx - cw / 2 + 6, cy - ch / 2 + 8, cw, ch, 16); ctx.fill();
    if (page === 0) {
      // the cover
      ctx.fillStyle = '#b23a48'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 16); ctx.fill();
      ctx.fillStyle = '#8f2f3a'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, 22, ch, 16); ctx.fill();
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - cw / 2 + 36, cy - ch / 2 + 22, cw - 56, ch - 44, 10); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(Math.min(30, cw * 0.08)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🏡 Cabin Catalog', cx + 8, cy - ch / 2 + 62);
      // a little cabin picture
      const hx = cx + 8, hy = cy + 10, hs = Math.min(1.2, ch / 380);
      ctx.save(); ctx.translate(hx, hy); ctx.scale(hs, hs);
      ctx.fillStyle = '#7cc45f'; ctx.beginPath(); ctx.ellipse(0, 46, 110, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a5693a'; ctx.fillRect(-60, -10, 120, 56); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = -4; y < 46; y += 12) ctx.fillRect(-60, y, 120, 2);
      ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(-72, -8); ctx.lineTo(0, -62); ctx.lineTo(72, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8c8f94'; ctx.fillRect(28, -52, 14, 30);
      ctx.fillStyle = '#7a4a22'; U.roundRect(ctx, -14, 10, 28, 36, 4); ctx.fill(); ctx.fillStyle = '#ffd97a'; ctx.fillRect(24, 4, 22, 18); ctx.fillStyle = '#f5f0dc'; ctx.fillRect(34, 4, 2, 18); ctx.fillRect(24, 12, 22, 2);
      ctx.fillStyle = '#e84c6a'; ctx.font = r.font(12); ctx.fillText('♥', 0, 24);
      for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.5 - k * 0.12; ctx.fillStyle = '#f3efe3'; ctx.beginPath(); ctx.arc(35 + k * 7 + Math.sin(g.time * 1.5 + k) * 3, -62 - k * 14, 6 + k * 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.restore();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(15); ctx.fillText(`${items.length} lovely things inside`, cx + 8, cy + ch / 2 - 72);
      ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(14); ctx.fillText('Walk ◀ ▶ to turn pages', cx + 8, cy + ch / 2 - 46);
    } else {
      const it = items[page - 1], own = this.owned(g, it.key), afford = g.s.cash >= it.price;
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 16); ctx.fill();
      ctx.fillStyle = '#e8dcc4'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, 14, ch, 16); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(Math.min(26, cw * 0.072)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${it.ico} ${it.label}`, cx + 6, cy - ch / 2 + 40);
      // the picture, on a plain board
      const bw = cw - 60, bh = ch - 170, bx = cx + 6, by = cy - 12;
      ctx.fillStyle = '#fdf3dc'; U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.fill();
      ctx.strokeStyle = '#e8dcc4'; ctx.lineWidth = 2; U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.stroke();
      ctx.save(); ctx.beginPath(); U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.clip();
      const k = it.view.s * Math.min(1, bh / 260);
      ctx.translate(bx, by + Math.sin(g.time * 1.4) * 2); ctx.scale(k, k); ctx.translate(-it.spot.x, -it.spot.y - it.view.dy);
      this.drawHomeItem(r, g, it);
      ctx.restore();
      // price / status
      const tag = own ? '✅ In your cabin' : U.money(it.price);
      ctx.font = r.font(22); const tw = ctx.measureText(tag).width + 28;
      ctx.fillStyle = own ? '#2f9e44' : afford ? '#1f6e2e' : '#b8401c'; U.roundRect(ctx, cx + 6 - tw / 2, cy + ch / 2 - 74, tw, 34, 17); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(tag, cx + 6, cy + ch / 2 - 57);
      if (c.bought > 0) { ctx.globalAlpha = Math.min(1, c.bought); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,29,20,0.85)'; const yy = by - bh / 2 + 22 - (1.8 - c.bought) * 10; ctx.strokeText("✨ It's in your cabin! ✨", bx, yy); ctx.fillText("✨ It's in your cabin! ✨", bx, yy); ctx.globalAlpha = 1; }
      if (c.nope > 0) { ctx.globalAlpha = Math.min(1, c.nope); ctx.fillStyle = '#b8401c'; ctx.font = r.font(13); ctx.fillText('Earn more at the pizzeria 🍕', cx + 6, cy + ch / 2 - 32); ctx.globalAlpha = 1; }
    }
    // page counter and the arrows
    ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${page + 1} / ${n}`, cx + 6, cy + ch / 2 - 16);
    ctx.font = r.font(22); ctx.fillStyle = page > 0 ? '#2b1d14' : 'rgba(43,29,20,0.25)'; ctx.fillText('◀', cx - cw / 2 + 34, cy + ch / 2 - 18);
    ctx.fillStyle = page < n - 1 ? '#2b1d14' : 'rgba(43,29,20,0.25)'; ctx.fillText('▶', cx + cw / 2 - 22, cy + ch / 2 - 18);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▼ walk down to close', cx, cy + ch / 2 + 16);
  },
  // The park dog curls up in its bed while you are home (it is the same dog in spirit; the real one waits in the park).
  drawSleepingDog(r, g, x, y) {
    const ctx = r.ctx, t = g.time, br = Math.sin(t * 1.6) * 0.6;
    ctx.fillStyle = '#c17f3a'; ctx.beginPath(); ctx.ellipse(x + 2, y - 2, 14, 8 + br, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c17f3a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 12, y - 2); ctx.quadraticCurveTo(x + 18, y - 10, x + 10, y - 11); ctx.stroke();
    ctx.fillStyle = '#c17f3a'; ctx.beginPath(); ctx.arc(x - 8, y - 5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a26'; ctx.beginPath(); ctx.ellipse(x - 12, y - 10, 3.5, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1d3a8'; ctx.beginPath(); ctx.ellipse(x - 12, y - 2, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 15, y - 3, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 7, y - 7, 2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    const ph = (t * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#fff'; ctx.font = r.font(8 + ph * 5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', x - 2 + ph * 10, y - 16 - ph * 18); ctx.globalAlpha = 1;
  },
};
SecretExt.setup();
Game.ext.push(SecretExt);
Render.ext.push(SecretExt);

