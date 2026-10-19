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
  walkable(x, y) { return this.pathDist(x, y) <= CFG.SECRET.pathHalf || (this.inClearing(x, y) && !this.inCabin(x, y)); },
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
    this.blocks.push({ x: S.bear.x - 26, y: S.bear.y - 14, w: 52, h: 22 });
    this.blocks.push({ x: S.log.x - 44, y: S.log.y - 8, w: 88, h: 16 });
    for (const s of S.stumps) this.blocks.push({ x: s.x - 12, y: s.y - 6, w: 24, h: 12 });
    this.blocks.push({ x: S.sign.x - 5, y: S.sign.y - 6, w: 10, h: 10 });
    this.vehicleBlock = { x: -1034, y: 170, w: 30, h: 110 };     // nothing on wheels fits through the trees
    // the beehive hangs from the tree nearest the clearing's south-east edge
    const near = this.trees.slice().sort((a, b) => U.dist(a.x, a.y, S.hive.x, S.hive.y) - U.dist(b.x, b.y, S.hive.x, S.hive.y))[0];
    if (near) { S.hive.tree = near; S.hive.x = near.x + 16 * near.s; S.hive.y = near.y - 4 * near.s; }
  },

  // ---------- game hooks ----------
  build(g) {
    const S = CFG.SECRET;
    this.st = {
      visited: false, still: 0, peek: 0, cool: 0,
      squirrel: { stump: 0, x: S.stumps[0].x, y: S.stumps[0].y, hop: null, facing: 1, flick: 0 },
    };
  },
  obstacles(g, forCar) {
    if (g.player.x > -900) return [];
    return forCar ? this.blocks.concat([this.vehicleBlock]) : this.blocks;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, S = CFG.SECRET;
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
    const p = g.player, S = CFG.SECRET;
    if (g.area !== 'town' || !this.inStrip(p.x, p.y)) return undefined;
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
    if (g.area !== 'town' || !this.st) return;
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
};
SecretExt.setup();
Game.ext.push(SecretExt);
Render.ext.push(SecretExt);

