'use strict';
// The ice rink on Snowy Peak (map 'snow', js/snow.js), in the open snow south of the Cocoa Cabin.
//   - A rounded rink of glossy blue-white ice with white boards (a red rail, a yellow kick plate) all round, a gate in
//     the west boards, a skate rental stand with a striped awning and a friendly renter, two log benches, a little
//     Christmas tree, light poles with pennants and strings of coloured bulbs that glow at dusk.
//   - '⛸️ Put on skates' at the stand: the chef wears skates (a vehicle kind 'skates' driven by this file) and steps onto
//     the ice through the gate. On the ice it is slippery: momentum, a slow glide to a stop, curving turns, a gentle top
//     speed and soft bounces off the boards (never stuck). The big button does '🌀 Spin' (slow) or '⭐ Jump' (gliding
//     fast); '🚶 Take off skates' by the gate (or the vehicle button anywhere) glides back out. Without skates the gate
//     stays shut and the hint points at the stand.
//   - Skates leave scratch marks: a small offscreen canvas over the ice, drawn into incrementally (one short stroke per
//     few px skated), plus a coarse grid of cells (12 px) that knows which parts are scratched (the "% clean").
//   - Three friendly skaters loop round the ice (two kids, and a dad pulling a toddler on a little sled); they wobble,
//     the kids sometimes sit down on their bottoms and giggle, and they skate off to the benches while the Zamboni is out.
//   - The Zamboni (vehicle kind 'zamboni'), a cute ice resurfacer in its open garage on the north side: '🧊 Drive the
//     Zamboni' at the mat beside the garage. It drives slowly and only on the ice and its garage ramp. Under it the
//     scratches vanish and a shiny wet trail is left that slowly dries back to glossy; a pill over it shows how clean the
//     rink is, and the whole rink smooth (the last few specks polish themselves) is "Shiny! ✨". '🚶 Hop out' in the
//     garage (the vehicle button on the ice drives it home first). When the rink gets scratched and the chef is not on
//     the ice, the Zamboni driver takes it out on his own (a little whistle; the skaters leave the ice first).
//   - Nothing but small counters is saved (g.s.icerink). Take-me-home clears the skates and the Zamboni ride.
// Coordination: js/snow.js moved a few pines and the snow dog's patch north of the rink; js/snowplow.js leaves CUT out
// of its fresh-powder mask.
// Extension module: Game.ext.unshift + Render.ext.push (see js/EXTENSIONS.md).

CFG.ICERINK = {
  ICE: { x0: 6720, y0: 6390, x1: 7200, y1: 6630, r: 80 },   // the ice: a rounded rectangle
  BOARD: 10, BOARD_H: 16,                                     // the boards round it: thickness and height
  GATE: { y: 6516, half: 28 },                                // the gate in the west boards
  GATE_OUT: { x: 6686, y: 6516 }, GATE_IN: { x: 6754, y: 6516 },
  STAND: { x0: 6560, y0: 6400, x1: 6670, y1: 6448 }, STAND_H: 92,   // the skate rental stand (solid)
  SKATE_SPOT: { x: 6615, y: 6484 },                           // '⛸️ Put on skates'
  BENCHES: [{ x: 6630, y: 6594 }, { x: 6630, y: 6654 }],
  SEATS: [{ x: 6612, y: 6593 }, { x: 6648, y: 6593 }, { x: 6612, y: 6653 }],
  XMAS: { x: 6572, y: 6548 },
  GARAGE: { x0: 7016, y0: 6292, x1: 7144, y1: 6372 }, GARAGE_H: 66,  // the Zamboni's open garage (solid for walkers)
  LANE: { x: 7080, half: 16, top: 6334 },                     // the garage ramp the Zamboni drives along
  ZAM_HOME: { x: 7080, y: 6334 },
  ZAM_SPOT: { x: 7176, y: 6368 },                             // '🧊 Drive the Zamboni' (the mat east of the garage)
  DRIVER_SPOT: { x: 7200, y: 6328 },                          // where the Zamboni driver waits
  POLES: [[6722, 6392], [6900, 6366], [6722, 6630], [6960, 6662], [7198, 6630], [7198, 6392]],
  STRINGS: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5]],
  POLE_H: 78,
  CUT: { x0: 6546, y0: 6284, x1: 7226, y1: 6676 },            // no fresh powder here (js/snowplow.js)
  ZONE: { x0: 6530, y0: 6200, x1: 7240, y1: 6700 },           // everything the rink draws (for the "on screen" test)
  CELL: 12, RES: 1.5,
  SKATE: { acc: 300, max: 150, glide: 0.5, drag: 0.8, margin: 14, walk: 95, out: 140 },
  ZAM: { speed: 90, auto: 80, turn: 2.4, margin: 30, sweep: [-42, 24, 27], wetAt: -38 },
  SPIN_T: 1.2, JUMP_T: 0.7, JUMP_H: 28, JUMP_SPEED: 85,
  WET_T: 18, WET_MAX: 450,
  AUTO_PCT: 70, AUTO_GAP: 60, FINISH_PCT: 96,
  NEAR: 42, HINT_R: 70,
};
CFG.VEHICLES.skates = { speed: 0, radius: 12, label: '⛸️ Put on skates', exit: '🚶 Take off skates' };
CFG.VEHICLES.zamboni = { speed: 0, radius: 26, label: '🧊 Drive the Zamboni', exit: '🚶 Hop out' };

const IceRinkExt = {
  name: 'icerink',
  defaults: { icerink: { seen: false, skates: 0, spins: 0, jumps: 0, drives: 0, shiny: 0, autos: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    const d = JSON.parse(JSON.stringify(this.defaults.icerink));
    g.s.icerink = Object.assign(d, g.s.icerink || {});
    const K = CFG.ICERINK, I = K.ICE, cols = Math.ceil((I.x1 - I.x0) / K.CELL), rows = Math.ceil((I.y1 - I.y0) / K.CELL);
    const st = this.st = {
      skate: null,
      zam: { kind: 'zamboni', x: K.ZAM_HOME.x, y: K.ZAM_HOME.y, angle: Math.PI / 2, vx: 0, vy: 0, sx: 0, sy: 0, mode: 'park', driver: 'npc', path: null, wi: 0, wt: 0, smoothed: 0, celebrated: false, wetLast: null, chefHome: false, beacon: 0 },
      cols, rows, dirt: new Float32Array(cols * rows), live: new Uint8Array(cols * rows), total: 0, dirty: 0,
      wet: [], canvas: null, cctx: null,
      since: 0, parkT: 99, whistleT: 0, shinyT: 0,
      skaters: this.makeSkaters(),
      driver: { say: null, sayT: 0, hop: 0 },
      fade: 0,
    };
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const x = I.x0 + (k + 0.5) * K.CELL, y = I.y0 + (r + 0.5) * K.CELL;
      if (this.sdf(x, y) < -9) { st.live[r * cols + k] = 1; st.total++; }
    }
    st.obs = this.makeObs();
    this.preScratch();
    // the world map lists the rink among Snowy Peak's landmarks
    const W = typeof CFG.WORLDMAP !== 'undefined' && CFG.WORLDMAP.PLACES && CFG.WORLDMAP.PLACES.snow;
    if (W) { W.marks = W.marks || []; if (!W.marks.some((m) => m[0] === '⛸️')) W.marks.push(['⛸️', 'Ice rink', 'The ice rink and the Zamboni', 3]); }
  },
  ready(g) { if (!this.st) this.build(g); if (!g.s.icerink) g.s.icerink = JSON.parse(JSON.stringify(this.defaults.icerink)); return this.st; },
  save(g) { this.ready(g); return g.s.icerink; },
  makeSkaters() {
    const K = CFG.ICERINK, I = K.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2;
    const L = [
      { kid: true, s: 0.74, shirt: '#ff6fa8', beanie: '#8e5bd1', bobble: '#ffffff', hair: '#7a3e1d', hairStyle: 1, pants: '#5b4a8a', skin: '#f1c27d', sp: 80, rx: 170, ry: 80, th: 0.6, word: 'Hehe! 😆' },
      { kid: true, s: 0.78, shirt: '#2f9e44', beanie: '#ffd166', bobble: '#e4572e', hair: '#2b1d14', hairStyle: 0, pants: '#2d3a4a', skin: '#e0ac69', sp: 94, rx: 200, ry: 92, th: 2.8, word: 'Oopsie! 😄' },
      { kid: false, s: 1, shirt: '#3b7dd8', beanie: '#e4572e', bobble: '#ffffff', hair: '#8a5a2b', hairStyle: 0, pants: '#3a3f5c', skin: '#f1c27d', sp: 62, rx: 128, ry: 56, th: 4.4, toddler: true },
    ];
    return L.map((o, i) => {
      const x = cx + o.rx * Math.cos(o.th), y = cy + o.ry * Math.sin(o.th);
      return { i, look: o, x, y, th: o.th, rx: o.rx, ry: o.ry, trx: o.rx, try: o.ry, sp: o.sp, lap: o.th, state: 'skate', t: 0, path: null, seat: K.SEATS[i], facing: -1, say: null, sayT: 0, hop: 0, wob: 0, fallT: 0, hiT: 3 + i * 2, mark: null, moving: false, bob: 0,
        sled: o.toddler ? { x: x + 30, y } : null };
    });
  },
  makeObs() {
    const K = CFG.ICERINK, I = K.ICE, o = [];
    const box = (b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    // the boards: small boxes along the middle of the boards, the gate shut with a box of its own
    for (const p of this.outline(-K.BOARD / 2, 12)) {
      if (this.inGate(p) || this.inRamp(p)) continue;
      o.push({ x: p.x - 7, y: p.y - 7, w: 14, h: 14 });
    }
    o.push({ x: I.x0 - K.BOARD - 4, y: K.GATE.y - K.GATE.half, w: K.BOARD + 8, h: K.GATE.half * 2 });    // the gate (shut for walkers)
    o.push({ x: K.LANE.x - 44, y: K.GARAGE.y1, w: 88, h: I.y0 - K.GARAGE.y1 + 2 });                        // the Zamboni's ramp
    o.push(box(K.STAND), box(K.GARAGE));
    for (const b of K.BENCHES) o.push({ x: b.x - 32, y: b.y - 10, w: 64, h: 12 });
    o.push({ x: K.XMAS.x - 14, y: K.XMAS.y - 10, w: 28, h: 14 });
    for (const [x, y] of K.POLES) o.push({ x: x - 4, y: y - 5, w: 8, h: 8 });
    return o;
  },
  inGate(p) { const K = CFG.ICERINK; return p.x < K.ICE.x0 + 4 && Math.abs(p.y - K.GATE.y) < K.GATE.half; },
  inRamp(p) { const K = CFG.ICERINK; return p.y < K.ICE.y0 + 4 && Math.abs(p.x - K.LANE.x) < 40; },

  // ---------- the rink's shape ----------
  // signed distance to the ice's rounded edge (negative on the ice)
  sdf(x, y) {
    const I = CFG.ICERINK.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2, r = I.r;
    const qx = Math.abs(x - cx) - ((I.x1 - I.x0) / 2 - r), qy = Math.abs(y - cy) - ((I.y1 - I.y0) / 2 - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  },
  normal(x, y) {
    const I = CFG.ICERINK.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2, r = I.r;
    const qx = Math.abs(x - cx) - ((I.x1 - I.x0) / 2 - r), qy = Math.abs(y - cy) - ((I.y1 - I.y0) / 2 - r);
    const sx = x < cx ? -1 : 1, sy = y < cy ? -1 : 1;
    if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); return { x: sx * qx / l, y: sy * qy / l }; }
    return qx > qy ? { x: sx, y: 0 } : { x: 0, y: sy };
  },
  // push a point back onto the ice (keeping `margin` from the boards); returns the boards' normal when it had to
  keepIn(p, margin) {
    const d = this.sdf(p.x, p.y) + margin;
    if (d <= 0) return null;
    const n = this.normal(p.x, p.y); p.x -= n.x * d; p.y -= n.y * d;
    return n;
  },
  onIce(x, y, margin = 0) { return this.sdf(x, y) < -margin; },
  // points round the ice's edge, `inset` px inside it (negative: outside), every `step` px: from the top edge's east
  // end going west (anticlockwise on screen), each with the outward normal
  outline(inset, step) {
    const I = CFG.ICERINK.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2;
    const hx = (I.x1 - I.x0) / 2 - inset, hy = (I.y1 - I.y0) / 2 - inset, r = Math.max(2, I.r - inset), a = hx - r, b = hy - r;
    const out = [], P = Math.PI;
    const line = (x0, y0, x1, y1, nx, ny) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i < n; i++) out.push({ x: U.lerp(x0, x1, i / n), y: U.lerp(y0, y1, i / n), nx, ny }); };
    const arc = (ox, oy, t0, t1) => { const n = Math.max(1, Math.round(Math.abs(t1 - t0) * r / step)); for (let i = 0; i < n; i++) { const t = U.lerp(t0, t1, i / n); out.push({ x: ox + Math.cos(t) * r, y: oy + Math.sin(t) * r, nx: Math.cos(t), ny: Math.sin(t) }); } };
    line(cx + a, cy - b - r, cx - a, cy - b - r, 0, -1); arc(cx - a, cy - b, -P / 2, -P);
    line(cx - a - r, cy - b, cx - a - r, cy + b, -1, 0); arc(cx - a, cy + b, P, P / 2);
    line(cx - a, cy + b + r, cx + a, cy + b + r, 0, 1); arc(cx + a, cy + b, P / 2, 0);
    line(cx + a + r, cy + b, cx + a + r, cy - b, 1, 0); arc(cx + a, cy - b, 0, -P / 2);
    return out;
  },
  inZone(x, y, pad = 0) { const Z = CFG.ICERINK.ZONE; return x > Z.x0 - pad && x < Z.x1 + pad && y > Z.y0 - pad && y < Z.y1 + pad; },
  // the chef standing in the board ring, the stand, the garage, a bench...: not a place to be on foot
  blocked(g, x, y) { return this.sdf(x, y) < 6 || this.st.obs.some((o) => g.hitRect(x, y, 10, o)); },

  // ---------- scratches and the clean grid ----------
  ensureCanvas() {
    const st = this.st;
    if (st.canvas) return st.cctx;
    if (typeof document === 'undefined') return null;
    const K = CFG.ICERINK, I = K.ICE, c = document.createElement('canvas');
    c.width = Math.ceil((I.x1 - I.x0) * K.RES); c.height = Math.ceil((I.y1 - I.y0) * K.RES);
    const x = c.getContext('2d'); if (!x) return null;
    x.setTransform(K.RES, 0, 0, K.RES, -I.x0 * K.RES, -I.y0 * K.RES); x.lineCap = 'round'; x.lineJoin = 'round';
    st.canvas = c; st.cctx = x;
    return x;
  },
  cellAt(x, y) {
    const K = CFG.ICERINK, I = K.ICE, st = this.st, k = Math.floor((x - I.x0) / K.CELL), r = Math.floor((y - I.y0) / K.CELL);
    if (k < 0 || r < 0 || k >= st.cols || r >= st.rows) return -1;
    return r * st.cols + k;
  },
  // one short scratch from (x0,y0) to (x1,y1): an engraved line on the canvas, and dirt in its cell
  addScratch(x0, y0, x1, y1) {
    const st = this.st, c = this.ensureCanvas(), len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 0.5 || !this.onIce(x0, y0, 3) || !this.onIce(x1, y1, 3)) return;
    if (c) {
      c.strokeStyle = 'rgba(112,142,180,0.55)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x0, y0 + 0.9); c.lineTo(x1, y1 + 0.9); c.stroke();
    }
    const i = this.cellAt((x0 + x1) / 2, (y0 + y1) / 2);
    if (i < 0 || !st.live[i]) return;
    const was = st.dirt[i] >= 0.5;
    st.dirt[i] = Math.min(3, st.dirt[i] + len / CFG.ICERINK.CELL * 0.6);
    if (!was && st.dirt[i] >= 0.5) st.dirty++;
  },
  // a little curl of scratches (a spin) or a cross (a landing)
  addCurl(x, y, r0) { let px = x + r0, py = y; for (let a = 0.5; a <= Math.PI * 2 + 0.01; a += 0.5) { const rr = r0 * (1 - a / 14), nx = x + Math.cos(a) * rr, ny = y + Math.sin(a) * rr * 0.6; this.addScratch(px, py, nx, ny); px = nx; py = ny; } },
  cleanPct() { const st = this.st; return st.total ? Math.round(100 * (1 - st.dirty / st.total)) : 100; },
  // the rink as it is at the start of a session: skaters have been round it a few times
  preScratch(seed = 7) {
    const I = CFG.ICERINK.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let k = 0; k < 16; k++) {
      const rx = 110 + rnd() * 105, ry = 44 + rnd() * 52, a0 = rnd() * Math.PI * 2, len = 1.4 + rnd() * 2.6, ox = (rnd() - 0.5) * 30, oy = (rnd() - 0.5) * 16;
      let px = null, py = null;
      for (let a = a0; a < a0 + len; a += 12 / ((rx + ry) / 2)) {
        const x = cx + ox + Math.cos(a) * rx + Math.sin(a * 5 + k) * 3, y = cy + oy + Math.sin(a) * ry;
        if (px !== null) this.addScratch(px, py, x, y);
        px = x; py = y;
      }
    }
    for (let k = 0; k < 7; k++) this.addCurl(cx + (rnd() - 0.5) * 360, cy + (rnd() - 0.5) * 150, 7 + rnd() * 5);
  },
  // under the Zamboni: the scratches in its footprint vanish
  smoothUnder(z) {
    const K = CFG.ICERINK, Z = K.ZAM, st = this.st, [s0, s1, sh] = Z.sweep, ca = Math.cos(z.angle), sa = Math.sin(z.angle);
    const W = (lx, ly) => ({ x: z.x + lx * ca - ly * sa, y: z.y + lx * sa + ly * ca });
    const P = [W(s0, -sh), W(s1, -sh), W(s1, sh), W(s0, sh)];
    const c = this.ensureCanvas();
    if (c) {
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
      c.beginPath(); c.moveTo(P[0].x, P[0].y); for (let i = 1; i < 4; i++) c.lineTo(P[i].x, P[i].y); c.closePath(); c.fill(); c.restore();
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of P) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    const I = K.ICE, C = K.CELL;
    const k0 = Math.max(0, Math.floor((x0 - I.x0) / C)), k1 = Math.min(st.cols - 1, Math.floor((x1 - I.x0) / C));
    const r0 = Math.max(0, Math.floor((y0 - I.y0) / C)), r1 = Math.min(st.rows - 1, Math.floor((y1 - I.y0) / C));
    let got = 0;
    for (let r = r0; r <= r1; r++) for (let k = k0; k <= k1; k++) {
      const i = r * st.cols + k; if (!st.live[i] || st.dirt[i] <= 0) continue;
      const dx = I.x0 + (k + 0.5) * C - z.x, dy = I.y0 + (r + 0.5) * C - z.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      if (lx < s0 || lx > s1 || Math.abs(ly) > sh) continue;
      if (st.dirt[i] >= 0.5) { st.dirty--; got++; }
      st.dirt[i] = 0;
    }
    return got;
  },
  // the last few specks polish themselves: the whole rink is smooth
  polishAll(g) {
    const K = CFG.ICERINK, I = K.ICE, st = this.st, c = this.ensureCanvas();
    for (let i = 0; i < st.dirt.length; i++) {
      if (!st.live[i] || st.dirt[i] <= 0) continue;
      const k = i % st.cols, r = Math.floor(i / st.cols), x = I.x0 + k * K.CELL, y = I.y0 + r * K.CELL;
      if (c) c.clearRect(x - 3, y - 3, K.CELL + 6, K.CELL + 6);
      if (st.dirt[i] >= 0.5 && g) g.fx.push({ kind: 'sparkle', x0: x + 6, y0: y + 6, x1: 0, y1: 0, t: -Math.random() * 0.3, dur: 0.6 });
      st.dirt[i] = 0;
    }
    st.dirty = 0;
  },
  addWet(z) {
    const K = CFG.ICERINK, st = this.st, ca = Math.cos(z.angle), sa = Math.sin(z.angle), x = z.x + K.ZAM.wetAt * ca, y = z.y + K.ZAM.wetAt * sa;
    if (z.wetLast && U.dist(z.wetLast.x, z.wetLast.y, x, y) < 7) return;
    z.wetLast = { x, y };
    if (!this.onIce(x, y, -4)) return;
    st.wet.push({ x, y, a: z.angle, t: 0 });
    if (st.wet.length > K.WET_MAX) st.wet.splice(0, st.wet.length - K.WET_MAX);
  },

  // ---------- helpers ----------
  busy(g) {
    return !!(g.onTrain || g.ride || g.travel || g.fishing ||
      (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) ||
      (typeof SnowExt !== 'undefined' && SnowExt.st && (SnowExt.st.lift || SnowExt.st.ball)));
  },
  skating(g) { const sk = this.st && this.st.skate; return !!(sk && g.driving && g.vehicle === sk); },
  zamboning(g) { const z = this.st && this.st.zam; return !!(z && g.driving && g.vehicle === z); },
  mine(g) { return this.skating(g) || this.zamboning(g); },
  near(g, s, d) { return U.dist(g.player.x, g.player.y, s.x, s.y) < d; },
  zamOut() { const z = this.st.zam; return z.mode !== 'park'; },
  npcDriving(g) { return this.st.zam.mode !== 'park' && !this.zamboning(g); },
  say(g, x, y, text, color, big = true, dur = 1.4) { g.floats.push({ x, y, text, color: color || '#ffe08a', t: 0, dur, big }); },
  sparkle(g, x, y, n = 6, spread = 22) { for (let i = 0; i < n; i++) g.fx.push({ kind: 'sparkle', x0: x + U.rand(-spread, spread), y0: y + U.rand(-spread, spread * 0.6), x1: 0, y1: 0, t: -i * 0.05, dur: 0.55 }); },
  whistle() { Sfx.tone(2093, 0.12, 'square', 0.018, 120); setTimeout(() => Sfx.tone(2349, 0.22, 'square', 0.018, -160), 150); },

  // ---------- game hooks ----------
  obstacles(g, forCar) {
    if (g.area !== 'snow') return [];
    const st = this.ready(g);
    if (forCar && this.mine(g)) return [];   // the skates and the Zamboni keep to the ice by themselves
    return st.obs;
  },
  vehicles(g) {
    if (!this.st || g.area !== 'snow') return [];
    const v = [];
    if (this.skating(g)) v.push(this.st.skate);
    if (this.zamboning(g)) v.push(this.st.zam);
    return v;
  },
  action(g) {
    if (g.area !== 'snow' || this.busy(g)) return null;
    const K = CFG.ICERINK, st = this.ready(g);
    if (g.driving) {
      if (this.skating(g)) {
        const sk = st.skate; if (sk.phase !== 'on') return null;
        if (this.near(g, K.GATE_IN, 56) && Math.hypot(sk.sx, sk.sy) < 90) return { label: '🚶 Take off skates', run: (gg) => this.skatesOff(gg) };
        if (Math.hypot(sk.sx, sk.sy) > K.JUMP_SPEED || sk.jump > 0) return { label: '⭐ Jump', run: (gg) => this.jump(gg) };
        return { label: '🌀 Spin', run: (gg) => this.spin(gg) };
      }
      if (this.zamboning(g)) {
        const z = st.zam;
        if (z.mode === 'chef' && z.y < K.ICE.y0 + 24) return { label: '🚶 Hop out', run: (gg) => this.hopOut(gg) };
        return null;
      }
      return null;
    }
    if (this.near(g, K.SKATE_SPOT, K.NEAR)) return { label: '⛸️ Put on skates', run: (gg) => this.skatesOn(gg) };
    if (this.near(g, K.ZAM_SPOT, K.NEAR) && st.zam.mode === 'park') return { label: '🧊 Drive the Zamboni', run: (gg) => this.driveZam(gg) };
    return null;
  },
  hint(g) {
    if (!this.st || g.area !== 'snow' || g.travel) return undefined;
    if (this.busy(g)) return undefined;
    const K = CFG.ICERINK, st = this.st, s = g.s.icerink || {}, p = g.player;
    if (this.skating(g)) {
      const sk = st.skate;
      if (sk.phase === 'in') return { text: 'Here we go! ⛸️', target: null };
      if (sk.phase === 'out') return { text: 'Skates off! 👟', target: null };
      if (this.near(g, K.GATE_IN, 56)) return { text: 'Take off your skates here 🚶', target: null };
      if (!s.spins) return { text: 'Glide around and press 🌀 to spin! ⛸️', target: null };
      if (!s.jumps) return { text: 'Glide fast and press ⭐ to jump! ⛸️', target: null };
      return { text: 'Wheee! Glide around the ice ⛸️', target: null };
    }
    if (this.zamboning(g)) {
      const z = st.zam, pct = this.cleanPct();
      if (z.mode === 'home') return { text: 'Back to the garage! 🧊', target: null };
      if (pct >= 100) return { text: 'Shiny! ✨ Drive back into the garage', target: z.y < K.ICE.y0 + 40 ? null : { x: K.LANE.x, y: K.ICE.y0 + 10 } };
      return { text: `Smooth the ice! 🧊 ${pct}% clean`, target: null };
    }
    if (g.driving) return undefined;
    const R = K.HINT_R, dS = U.dist(p.x, p.y, K.SKATE_SPOT.x, K.SKATE_SPOT.y), dG = U.dist(p.x, p.y, K.GATE_OUT.x, K.GATE_OUT.y), dZ = U.dist(p.x, p.y, K.ZAM_SPOT.x, K.ZAM_SPOT.y);
    if (dZ < R) {
      if (st.zam.mode !== 'park') return { text: 'The Zamboni is smoothing the ice! 🧊✨', target: null };
      return { text: this.cleanPct() >= 100 ? 'The ice is shiny! Drive the Zamboni anyway 🧊' : 'Drive the Zamboni and smooth the ice! 🧊', target: dZ < K.NEAR ? null : K.ZAM_SPOT };
    }
    if (dS < R) return { text: 'Put on skates and glide on the ice! ⛸️', target: dS < K.NEAR ? null : K.SKATE_SPOT };
    if (dG < R) return { text: 'Put on skates first! ⛸️', target: K.SKATE_SPOT };
    return undefined;
  },
  home(g) {
    if (!this.st) return;
    const st = this.st;
    st.skate = null;
    this.parkZam(true);
    for (const k of st.skaters) if (k.state !== 'skate' && k.state !== 'fall') this.backOnIce(k);
  },

  // ---------- skates ----------
  skatesOn(g) {
    const K = CFG.ICERINK, st = this.st, p = g.player, s = this.save(g);
    const v = { kind: 'skates', x: p.x, y: p.y, angle: -Math.PI / 2, vx: 0, vy: 0, sx: 0, sy: 0, phase: 'in', path: [{ x: K.GATE_OUT.x, y: K.GATE_OUT.y }, { x: K.GATE_IN.x, y: K.GATE_IN.y }], spin: 0, spinA: 0, jump: 0, z: 0, t: 0, mark: null, facing: 1, bonkT: 0 };
    st.skate = v; g.vehicle = v; g.driving = true;
    s.skates++;
    this.say(g, p.x, p.y - 78, '⛸️ Skates on!', '#ffffff', true, 1.2);
    Sfx.pickup(); Haptics.tap();
  },
  skatesOff(g) {
    const K = CFG.ICERINK, sk = this.st.skate; if (!sk) return;
    sk.phase = 'out'; sk.spin = 0; sk.jump = 0; sk.z = 0; sk.sx = 0; sk.sy = 0;
    sk.path = [];
    if (U.dist(sk.x, sk.y, K.GATE_IN.x, K.GATE_IN.y) > 4) sk.path.push({ x: K.GATE_IN.x, y: K.GATE_IN.y });
    sk.path.push({ x: K.GATE_OUT.x, y: K.GATE_OUT.y });
    Haptics.tap();
  },
  spin(g) {
    const sk = this.st.skate; if (!sk || sk.phase !== 'on' || sk.spin > 0 || sk.jump > 0) return;
    const s = this.save(g);
    sk.spin = CFG.ICERINK.SPIN_T; sk.spinA = 0;
    s.spins++;
    this.say(g, sk.x, sk.y - 84, 'Wheee! 🌀', '#ffffff', true, 1.2);
    this.addCurl(sk.x, sk.y + 3, 9);
    Sfx.clean(); Haptics.tap();
  },
  jump(g) {
    const sk = this.st.skate; if (!sk || sk.phase !== 'on' || sk.spin > 0 || sk.jump > 0) return;
    const s = this.save(g);
    sk.jump = CFG.ICERINK.JUMP_T; sk.mark = null;
    s.jumps++;
    Sfx.tone(300, 0.3, 'sine', 0.045, 500); Haptics.tap();
  },
  stepSkate(g, dt) {
    const K = CFG.ICERINK, S = K.SKATE, st = this.st, sk = st.skate, p = g.player;
    sk.t += dt; sk.vx = 0; sk.vy = 0; sk.bonkT = Math.max(0, sk.bonkT - dt);
    if (sk.phase === 'in' || sk.phase === 'out') {
      const w = sk.path[0], sp = sk.phase === 'out' && this.onIce(sk.x, sk.y, 4) ? S.out : S.walk;
      if (w) { if (Math.abs(w.x - sk.x) > 2) sk.facing = w.x < sk.x ? -1 : 1; if (U.moveToward(sk, w.x, w.y, sp, dt)) sk.path.shift(); }
      if (!sk.path.length) {
        if (sk.phase === 'in') { sk.phase = 'on'; sk.sx = 40; sk.sy = 0; sk.mark = null; }
        else { this.finishSkatesOff(g); return; }
      }
      p.x = sk.x; p.y = sk.y; p.moving = false; p.hasMoved = true; p.facing = sk.facing;
      return;
    }
    const a = Input.axis(), inp = !!(a.x || a.y);
    if (sk.spin > 0) {
      sk.spin = Math.max(0, sk.spin - dt); sk.spinA += dt * 11;
      const f = Math.pow(0.35, dt); sk.sx *= f; sk.sy *= f;
      if (sk.spin === 0) { sk.spinA = 0; this.sparkle(g, sk.x, sk.y - 30, 5, 18); }
    } else {
      sk.sx += a.x * S.acc * dt; sk.sy += a.y * S.acc * dt;
      const f = Math.pow(inp ? S.drag : S.glide, dt); sk.sx *= f; sk.sy *= f;
    }
    const sp = Math.hypot(sk.sx, sk.sy);
    if (sp > S.max) { sk.sx *= S.max / sp; sk.sy *= S.max / sp; }
    if (sp < 2 && !inp) { sk.sx = 0; sk.sy = 0; }
    sk.x += sk.sx * dt; sk.y += sk.sy * dt;
    // the boards: a soft bounce back onto the ice
    const n = this.keepIn(sk, S.margin);
    if (n) {
      const vn = sk.sx * n.x + sk.sy * n.y;
      if (vn > 0) {
        sk.sx -= n.x * vn * 1.5; sk.sy -= n.y * vn * 1.5;
        if (vn > 70 && sk.bonkT <= 0) { sk.bonkT = 1.2; this.say(g, sk.x, sk.y - 80, 'Boing! 💫', '#ffffff', false, 0.9); Haptics.tap(); }
      }
    }
    // the jump
    if (sk.jump > 0) {
      sk.jump = Math.max(0, sk.jump - dt);
      sk.z = Math.sin(Math.PI * (1 - sk.jump / K.JUMP_T)) * K.JUMP_H;
      if (sk.jump === 0) {
        sk.z = 0; sk.mark = null;
        this.addScratch(sk.x - 6, sk.y, sk.x + 6, sk.y + 5); this.addScratch(sk.x + 6, sk.y, sk.x - 6, sk.y + 5);
        this.say(g, sk.x, sk.y - 86, 'Ta-da! ⭐', '#ffe08a', true, 1.2);
        this.sparkle(g, sk.x, sk.y - 10, 6, 22);
      }
    }
    if (Math.abs(sk.sx) > 14) sk.facing = sk.sx < 0 ? -1 : 1;
    // the blades scratch the ice
    if (sk.z <= 0) {
      if (!sk.mark) sk.mark = { x: sk.x, y: sk.y + 3 };
      else if (U.dist(sk.mark.x, sk.mark.y, sk.x, sk.y + 3) >= 10) { const side = (sk.t * 7) % 2 < 1 ? 1.5 : -1.5; this.addScratch(sk.mark.x, sk.mark.y, sk.x, sk.y + 3 + side * 0.4); sk.mark = { x: sk.x, y: sk.y + 3 }; }
    }
    p.x = sk.x; p.y = sk.y; p.moving = false; p.hasMoved = true;
    p.facing = sk.spin > 0 ? (Math.cos(sk.spinA) >= 0 ? sk.facing : -sk.facing) : sk.facing;
  },
  finishSkatesOff(g) {
    const K = CFG.ICERINK, st = this.st, p = g.player;
    if (this.skating(g)) { g.driving = false; g.vehicle = null; }
    st.skate = null;
    p.x = K.GATE_OUT.x - 14; p.y = K.GATE_OUT.y; p.moving = false; p.hasMoved = true; p.facing = -1;
    this.say(g, p.x, p.y - 78, 'Skates off! 👟', '#ffffff', false, 1.1);
    Sfx.drop(); Haptics.tap();
  },

  // ---------- the Zamboni ----------
  driveZam(g) {
    const st = this.st, z = st.zam, p = g.player, s = this.save(g);
    if (z.mode !== 'park') return;
    z.mode = 'chef'; z.driver = 'chef'; z.sx = 0; z.sy = 0; z.vx = 0; z.vy = 0; z.smoothed = 0; z.celebrated = false; z.wetLast = null; z.chefHome = false;
    g.vehicle = z; g.driving = true; p.x = z.x; p.y = z.y;
    s.drives++;
    st.driver.say = 'Your turn! 👍'; st.driver.sayT = 1.8; st.driver.hop = 0.6;
    this.startOuting(g);
    this.say(g, z.x, z.y - 70, '🧊 Vroom!', '#ffffff', true, 1.2);
    Haptics.tap();
  },
  // the Zamboni comes out: a little whistle and the skaters leave the ice
  startOuting(g) {
    const st = this.st;
    st.parkT = 0; st.since = 0;
    if (st.whistleT <= 0) { this.whistle(); st.whistleT = 4; const K = CFG.ICERINK; this.say(g, K.GATE_IN.x + 30, K.GATE_IN.y - 70, '🎵 Tweet!', '#ffffff', false, 1.2); }
    for (const k of st.skaters) if (k.state === 'skate' || k.state === 'fall' || k.state === 'enter') this.leaveIce(k);
  },
  hopOut(g) {
    const K = CFG.ICERINK, st = this.st, z = st.zam, p = g.player;
    if (this.zamboning(g)) { g.driving = false; g.vehicle = null; }
    z.mode = 'home'; z.driver = 'npc'; z.chefHome = false; z.path = [{ x: K.LANE.x, y: K.LANE.top }]; z.wi = 0; z.wt = 0;
    p.x = K.ZAM_SPOT.x; p.y = K.ZAM_SPOT.y; p.moving = false; p.hasMoved = true; p.facing = -1;
    st.driver.say = 'Thank you! 🧊'; st.driver.sayT = 1.8;
    Sfx.drop(); Haptics.tap();
  },
  parkZam(quiet) {
    const K = CFG.ICERINK, st = this.st, z = st.zam;
    z.x = K.ZAM_HOME.x; z.y = K.ZAM_HOME.y; z.angle = Math.PI / 2; z.mode = 'park'; z.driver = 'npc'; z.path = null; z.sx = 0; z.sy = 0; z.vx = 0; z.vy = 0; z.chefHome = false;
    if (!quiet) st.parkT = 0;
  },
  // the resurfacing pattern: out of the garage, two laps round the rink each a little further in, then down the middle
  autoPath() {
    const K = CFG.ICERINK, I = K.ICE, cy = (I.y0 + I.y1) / 2, out = [{ x: K.LANE.x, y: I.y0 + 46 }];
    for (const inset of [32, 76]) { const L = this.outline(inset, 26); out.push(...L, L[0]); }
    out.push({ x: I.x1 - 96, y: cy }, { x: I.x0 + 100, y: cy }, { x: I.x0 + 150, y: cy + 50 }, { x: K.LANE.x, y: I.y0 + 64 }, { x: K.LANE.x, y: I.y0 + 18 }, { x: K.LANE.x, y: K.LANE.top });
    return out;
  },
  startAuto(g) {
    const st = this.st, z = st.zam, s = this.save(g);
    z.mode = 'auto'; z.driver = 'npc'; z.path = this.autoPath(); z.wi = 0; z.wt = 0; z.smoothed = 0; z.celebrated = false; z.wetLast = null; z.wait = 1.2;
    st.since = 0; s.autos++;
    st.driver.say = 'Smoothing time! 🧊'; st.driver.sayT = 1.6;
    this.startOuting(g);
  },
  // move the Zamboni to (nx, ny), keeping it on the ice or on its garage ramp
  moveZam(z, nx, ny) {
    const K = CFG.ICERINK, Z = K.ZAM, L = K.LANE, I = K.ICE, ramp = I.y0 + Z.margin;
    if (z.y < ramp - 0.5) { nx = U.clamp(nx, L.x - L.half, L.x + L.half); ny = Math.max(ny, L.top); }
    else if (Math.abs(nx - L.x) <= L.half && ny < ramp) ny = Math.max(ny, L.top);
    else { const q = { x: nx, y: ny }; this.keepIn(q, Z.margin); nx = q.x; ny = q.y; }
    z.x = nx; z.y = ny;
  },
  turnTo(z, ang, rate, dt) { let d = ang - z.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; z.angle += U.clamp(d, -rate * dt, rate * dt); return d; },
  stepZamChef(g, dt) {
    const K = CFG.ICERINK, Z = K.ZAM, z = this.st.zam, a = Input.axis();
    const k = (a.x || a.y) ? 1 - Math.pow(0.05, dt) : 1 - Math.pow(0.002, dt);
    z.sx += (a.x * Z.speed - z.sx) * k; z.sy += (a.y * Z.speed - z.sy) * k;
    const sp = Math.hypot(z.sx, z.sy);
    if (sp > 12) this.turnTo(z, Math.atan2(z.sy, z.sx), 5, dt);
    const ox = z.x, oy = z.y;
    this.moveZam(z, z.x + z.sx * dt, z.y + z.sy * dt);
    if (Math.abs(z.x - ox) < Math.abs(z.sx * dt) * 0.3) z.sx *= 0.5;
    if (Math.abs(z.y - oy) < Math.abs(z.sy * dt) * 0.3) z.sy *= 0.5;
    return U.dist(ox, oy, z.x, z.y);
  },
  // follow z.path (auto run, or driving home)
  stepZamPath(g, dt, speed) {
    const z = this.st.zam, w = z.path && z.path[z.wi];
    if (!w) return 0;
    z.wt += dt;
    const d = U.dist(z.x, z.y, w.x, w.y);
    if (d < 20 || z.wt > 4) { z.wi++; z.wt = 0; return 0; }
    const diff = this.turnTo(z, Math.atan2(w.y - z.y, w.x - z.x), CFG.ICERINK.ZAM.turn, dt);
    const v = speed * (1 - 0.6 * Math.min(1, Math.abs(diff) / 1.3));
    const ox = z.x, oy = z.y;
    this.moveZam(z, z.x + Math.cos(z.angle) * v * dt, z.y + Math.sin(z.angle) * v * dt);
    z.sx = (z.x - ox) / dt; z.sy = (z.y - oy) / dt;
    return U.dist(ox, oy, z.x, z.y);
  },
  stepZam(g, dt) {
    const K = CFG.ICERINK, st = this.st, z = st.zam, p = g.player, s = this.save(g);
    z.beacon += dt;
    if (z.mode === 'park') {
      this.turnTo(z, Math.PI / 2, 2.5, dt);
      return;
    }
    z.vx = 0; z.vy = 0;
    let moved = 0;
    if (z.mode === 'chef') moved = this.stepZamChef(g, dt);
    else if (z.mode === 'auto') {
      if (z.wait > 0) { z.wait -= dt; return; }
      moved = this.stepZamPath(g, dt, K.ZAM.auto);
      if (z.wi >= z.path.length) { this.parkZam(false); return; }
    } else if (z.mode === 'home') {
      moved = this.stepZamPath(g, dt, K.ZAM.auto);
      if (z.wi >= z.path.length || (z.y <= K.LANE.top + 2 && Math.abs(z.x - K.LANE.x) < 3)) {
        const chef = z.chefHome && this.zamboning(g);
        this.parkZam(false);
        if (chef) { g.driving = false; g.vehicle = null; p.x = K.ZAM_SPOT.x; p.y = K.ZAM_SPOT.y; p.moving = false; p.facing = -1; st.driver.say = 'Thank you! 🧊'; st.driver.sayT = 1.8; Sfx.drop(); }
        return;
      }
    }
    if (this.zamboning(g)) { p.x = z.x; p.y = z.y; p.moving = moved > 0.2; p.hasMoved = true; }
    // smoothing: the footprint wipes the scratches, the back leaves a wet trail
    if (moved > 0.2 && this.onIce(z.x, z.y, 0)) {
      z.smoothed += this.smoothUnder(z);
      this.addWet(z);
      if (!z.celebrated && z.smoothed > 0 && this.cleanPct() >= K.FINISH_PCT) {
        z.celebrated = true; this.polishAll(g);
        if (g.area === 'snow') {
          const I = K.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2;
          this.say(g, z.x, z.y - 86, 'Shiny! ✨', '#ffe08a', true, 2.4);
          for (let i = 0; i < 14; i++) g.fx.push({ kind: 'sparkle', x0: cx + U.rand(-210, 210), y0: cy + U.rand(-100, 100), x1: 0, y1: 0, t: -i * 0.06, dur: 0.7 });
          st.shinyT = 2.5;
          if (z.mode === 'chef') { s.shiny++; Sfx.unlock(); Haptics.success(); if (g.save) g.save(); }
          else Sfx.chime();
        }
      }
    }
  },

  // ---------- the skaters ----------
  leaveIce(k) {
    const K = CFG.ICERINK;
    k.state = 'exit'; k.mark = null; k.fallT = 0;
    k.path = [{ x: K.GATE_IN.x + 20, y: K.GATE_IN.y }, { x: K.GATE_IN.x, y: K.GATE_IN.y }, { x: K.GATE_OUT.x, y: K.GATE_OUT.y }, { x: k.seat.x, y: k.seat.y }];
  },
  backOnIce(k) {
    const K = CFG.ICERINK, I = K.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2;
    k.state = 'skate'; k.path = null; k.th = Math.PI; k.lap = k.th; k.x = cx - k.rx; k.y = cy; k.mark = null;
    if (k.sled) { k.sled.x = k.x + 30; k.sled.y = k.y; }
  },
  stepSkaters(g, dt) {
    const K = CFG.ICERINK, I = K.ICE, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2, st = this.st, p = g.player, out = this.zamOut();
    for (const k of st.skaters) {
      k.hop = Math.max(0, k.hop - dt); k.hiT = Math.max(0, k.hiT - dt);
      if (k.sayT > 0) { k.sayT -= dt; if (k.sayT <= 0) k.say = null; }
      k.t += dt; const ox = k.x;
      if (k.state === 'skate') {
        k.th -= (k.sp / ((k.rx + k.ry) / 2)) * dt;
        k.rx += U.clamp(k.trx - k.rx, -9 * dt, 9 * dt); k.ry += U.clamp(k.try - k.ry, -5 * dt, 5 * dt);
        if (k.lap - k.th >= Math.PI * 2) { k.lap = k.th; k.trx = U.rand(110, 205); k.try = U.rand(44, 92); }
        k.x = cx + k.rx * Math.cos(k.th) + Math.sin(k.t * 1.3 + k.i) * 5; k.y = cy + k.ry * Math.sin(k.th);
        k.wob = Math.max(0, k.wob - dt);
        k.moving = false;
        // the kids sometimes wobble... and sit down on their bottoms with a giggle
        if (k.look.kid && k.t > 4 && k.wob <= 0 && Math.random() < dt * 0.035) { k.wob = 0.9; k.say = 'Whoa! 😮'; k.sayT = 0.9; }
        if (k.look.kid && k.wob > 0 && k.wob < 0.12) { k.wob = 0; k.state = 'fall'; k.fallT = 2.2; k.say = k.look.word; k.sayT = 2; k.mark = null; this.addCurl(k.x, k.y + 2, 6); }
        // the blades scratch the ice
        if (!k.mark) k.mark = { x: k.x, y: k.y + 3 };
        else if (U.dist(k.mark.x, k.mark.y, k.x, k.y + 3) >= 14) { this.addScratch(k.mark.x, k.mark.y, k.x, k.y + 3); k.mark = { x: k.x, y: k.y + 3 }; }
        // a wave for the chef
        if (k.hiT <= 0 && !k.say && U.dist(p.x, p.y, k.x, k.y) < 100 && Math.random() < dt * 0.6) { k.say = '👋'; k.sayT = 1.4; k.hop = 0.5; k.hiT = 10; }
      } else if (k.state === 'fall') {
        k.fallT -= dt; k.moving = false;
        if (k.fallT < 1.4 && k.fallT > 1.2 && k.hop <= 0) k.hop = 0.4;
        if (k.fallT <= 0) { k.state = 'skate'; k.t = 0; k.mark = null; }
      } else if (k.state === 'exit' || k.state === 'enter') {
        const w = k.path[0];
        k.moving = true; k.bob += dt * 9;
        if (!w || U.moveToward(k, w.x, w.y, 80, dt)) { if (w) k.path.shift(); if (!k.path.length) { if (k.state === 'exit') { k.state = 'bench'; k.moving = false; k.facing = 1; } else this.backOnIce(k); } }
      } else if (k.state === 'bench') {
        k.moving = false;
        if (!out && st.parkT > 1.5) { k.state = 'enter'; k.path = [{ x: K.GATE_OUT.x, y: K.GATE_OUT.y }, { x: K.GATE_IN.x, y: K.GATE_IN.y }]; }
      }
      if (Math.abs(k.x - ox) > 0.05) k.facing = k.x < ox ? -1 : 1;
      // the toddler's little sled trails on its rope
      if (k.sled) {
        const sd = k.sled, d = U.dist(sd.x, sd.y, k.x, k.y), L = k.state === 'bench' ? 24 : 32;
        if (d > L) { sd.x = k.x + (sd.x - k.x) * L / d; sd.y = k.y + (sd.y - k.y) * L / d; }
        if (k.state === 'bench') { sd.x += (k.x + 30 - sd.x) * Math.min(1, dt * 3); sd.y += (k.y + 12 - sd.y) * Math.min(1, dt * 3); }
      }
      if (!Number.isFinite(k.x) || !Number.isFinite(k.y)) this.backOnIce(k);
    }
  },

  // ---------- update ----------
  update(g, dt) {
    const K = CFG.ICERINK, st = this.ready(g), p = g.player, s = g.s.icerink, z = st.zam;
    st.whistleT = Math.max(0, st.whistleT - dt); st.shinyT = Math.max(0, st.shinyT - dt);
    if (st.driver.sayT > 0) { st.driver.sayT -= dt; if (st.driver.sayT <= 0) st.driver.say = null; }
    st.driver.hop = Math.max(0, st.driver.hop - dt);
    for (const w of st.wet) w.t += dt;
    while (st.wet.length && st.wet[0].t > K.WET_T) st.wet.shift();
    // somewhere else (a ride, another map): the skates come off and the Zamboni goes home
    if (g.area !== 'snow') {
      if (st.skate) { if (this.skating(g)) { g.driving = false; g.vehicle = null; } st.skate = null; }
      if (z.mode !== 'park' && !g.travel) { if (this.zamboning(g)) { g.driving = false; g.vehicle = null; } this.parkZam(true); }
      return;
    }
    if (g.travel) return;
    st.parkT += dt;
    // the vehicle button pressed (or something else took the chef off): skates glide out, the Zamboni drives home
    if (st.skate && !this.skating(g)) {
      if (!g.driving && !this.busy(g) && this.inZone(p.x, p.y)) { g.vehicle = st.skate; g.driving = true; if (st.skate.phase !== 'out') this.skatesOff(g); }
      else st.skate = null;
    }
    if (z.mode === 'chef' && !this.zamboning(g)) {
      if (!g.driving && !this.busy(g) && this.inZone(p.x, p.y)) {
        g.vehicle = z; g.driving = true;
        if (z.y < K.ICE.y0 + 24) this.hopOut(g);
        else { z.mode = 'home'; z.chefHome = true; z.path = [{ x: K.LANE.x, y: K.ICE.y0 + 64 }, { x: K.LANE.x, y: K.ICE.y0 + 18 }, { x: K.LANE.x, y: K.LANE.top }]; z.wi = 0; z.wt = 0; }
      } else { z.mode = 'home'; z.driver = 'npc'; z.chefHome = false; z.path = [{ x: K.LANE.x, y: K.LANE.top }]; z.wi = 0; }
    }
    if (z.mode === 'home' && z.chefHome && !this.zamboning(g)) z.chefHome = false;
    // first time here
    if (!s.seen && !g.driving && this.inZone(p.x, p.y, 60)) { s.seen = true; g.toast('⛸️ An ice rink with a Zamboni!', true); }
    this.stepSkaters(g, dt);
    if (this.skating(g)) this.stepSkate(g, dt);
    this.stepZam(g, dt);
    // the Zamboni driver takes it out when the ice gets scratched (not while the chef is on the ice)
    if (z.mode === 'park') {
      st.since += dt;
      if (st.since > K.AUTO_GAP && this.cleanPct() < K.AUTO_PCT && !st.skate && !this.zamboning(g)) this.startAuto(g);
    }
    // rescue: on foot inside the boards, the stand, the garage or a bench: back out by the gate
    if (!g.driving && !this.busy(g) && this.inZone(p.x, p.y) && this.blocked(g, p.x, p.y)) {
      const inside = this.sdf(p.x, p.y) < 6;
      p.x = inside || !this.near(g, K.ZAM_SPOT, 120) ? K.GATE_OUT.x - 14 : K.ZAM_SPOT.x; p.y = inside || !this.near(g, K.ZAM_SPOT, 120) ? K.GATE_OUT.y : K.ZAM_SPOT.y;
      p.moving = false;
      this.say(g, p.x, p.y - 70, 'Oops! ⛸️', '#ffffff', true, 1.1);
    }
  },

  // ================= art =================
  paintAfter(r, g, area) { if (area === 'snow') this.paintRink(r); },
  // the static part: the packed snow round the rink, the ice, the boards whose faces look south, the ramp, the floors
  paintRink(r) {
    const ctx = r.ctx, K = CFG.ICERINK, I = K.ICE, w = I.x1 - I.x0, h = I.y1 - I.y0, cx = (I.x0 + I.x1) / 2, cy = (I.y0 + I.y1) / 2;
    // packed snow round the rink and trodden paths to the stand, the garage and the benches
    ctx.fillStyle = 'rgba(196,214,238,0.5)'; U.roundRect(ctx, I.x0 - 30, I.y0 - 28, w + 60, h + 58, I.r + 30); ctx.fill();
    ctx.fillStyle = 'rgba(196,214,238,0.45)';
    U.roundRect(ctx, K.STAND.x0 - 14, K.STAND.y1 - 6, K.GATE_OUT.x - K.STAND.x0 + 30, 96, 30); ctx.fill();
    U.roundRect(ctx, K.BENCHES[0].x - 50, K.BENCHES[0].y - 30, 100, 104, 26); ctx.fill();
    U.roundRect(ctx, K.GARAGE.x1 - 4, K.GARAGE.y0 + 30, 86, 70, 24); ctx.fill();
    // the garage floor and its ramp: grey rubber with ridges
    const G = K.GARAGE;
    ctx.fillStyle = '#b9c6d4'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(K.LANE.x - 40, G.y1 - 2, 80, I.y0 - G.y1 + 8);
    ctx.fillStyle = '#7a8591'; for (let y = G.y1 + 2; y < I.y0 + 4; y += 5) ctx.fillRect(K.LANE.x - 38, y, 76, 2);
    // the ice: glossy blue-white
    ctx.save();
    U.roundRect(ctx, I.x0, I.y0, w, h, I.r); ctx.clip();
    const gr = ctx.createLinearGradient(0, I.y0, 0, I.y1); gr.addColorStop(0, '#eef9ff'); gr.addColorStop(0.55, '#d8effc'); gr.addColorStop(1, '#c2e3f8');
    ctx.fillStyle = gr; ctx.fillRect(I.x0, I.y0, w, h);
    // painted lines: a red centre line, two blue lines, a centre circle with a big snowflake
    ctx.fillStyle = 'rgba(228,87,46,0.35)'; ctx.fillRect(cx - 3, I.y0, 6, h);
    ctx.fillStyle = 'rgba(59,125,216,0.28)'; ctx.fillRect(cx - 104, I.y0, 6, h); ctx.fillRect(cx + 98, I.y0, 6, h);
    ctx.strokeStyle = 'rgba(59,125,216,0.32)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 52, 40, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,180,235,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, ex = Math.cos(a) * 30, ey = Math.sin(a) * 23;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ex, cy + ey);
      const bx = cx + ex * 0.6, by = cy + ey * 0.6;
      for (const s of [-1, 1]) { const b = a + s * 0.7; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b) * 10, by + Math.sin(b) * 7.6); }
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    for (const fx of [-150, 150]) for (const fy of [-50, 50]) { ctx.strokeStyle = 'rgba(228,87,46,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx + fx, cy + fy, 20, 15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(228,87,46,0.3)'; ctx.beginPath(); ctx.ellipse(cx + fx, cy + fy, 3, 2.4, 0, 0, Math.PI * 2); ctx.fill(); }
    // reflections: soft diagonal bands of light, and glints
    for (const [x0, bw, al] of [[-60, 70, 0.4], [40, 26, 0.35], [170, 90, 0.3], [300, 30, 0.35], [380, 60, 0.25]]) {
      ctx.fillStyle = `rgba(255,255,255,${al})`;
      ctx.beginPath(); ctx.moveTo(I.x0 + x0, I.y1); ctx.lineTo(I.x0 + x0 + bw, I.y1); ctx.lineTo(I.x0 + x0 + bw + 150, I.y0); ctx.lineTo(I.x0 + x0 + 150, I.y0); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 40; i++) { const x = I.x0 + 10 + this.hash(i) * (w - 20), y = I.y0 + 10 + this.hash(i + 50) * (h - 20); ctx.fillRect(x, y, 2, 2); }
    // a soft bluish shade along the edge, where the boards stand
    ctx.strokeStyle = 'rgba(110,160,210,0.35)'; ctx.lineWidth = 10; U.roundRect(ctx, I.x0, I.y0, w, h, I.r); ctx.stroke();
    ctx.restore();
    // the boards that face the viewer from the far side (north half, both ends)
    for (const sg of this.boardSegs()) if (!sg.south) this.drawBoardSeg(ctx, sg);
    // the ramp's posts in the boards' gap, the gate's posts
    ctx.fillStyle = '#ffffff';
    for (const x of [K.LANE.x - 41, K.LANE.x + 37]) { ctx.fillStyle = '#e4572e'; ctx.fillRect(x, I.y0 - K.BOARD - K.BOARD_H - 6, 4, K.BOARD + K.BOARD_H + 6); }
  },
  hash(i) { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); },
  // the boards as short segments: ground line, face, rail on top. North-ish ones are static, south ones y-sort.
  boardSegs() {
    if (this._segs) return this._segs;
    const K = CFG.ICERINK, B = K.BOARD, pts = this.outline(0, 12), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (this.inGate(mid) || this.inRamp(mid)) continue;
      const south = (a.ny + b.ny) / 2 > 0.35;
      const ga = south ? { x: a.x + a.nx * B, y: a.y + a.ny * B } : a, gb = south ? { x: b.x + b.nx * B, y: b.y + b.ny * B } : b;
      out.push({ a, b, ga, gb, south, y: Math.max(ga.y, gb.y), x: mid.x });
    }
    return (this._segs = out);
  },
  drawBoardSeg(ctx, sg) {
    const K = CFG.ICERINK, B = K.BOARD, H = K.BOARD_H, a = sg.a, b = sg.b, ga = sg.ga, gb = sg.gb;
    const ex = (gb.x - ga.x) * 0.06, ey = (gb.y - ga.y) * 0.06;   // a hair of overlap: no seams
    // the face: white panels with a yellow kick plate
    if (Math.abs(gb.x - ga.x) > 0.5) {
      ctx.fillStyle = '#f7fbff'; ctx.beginPath(); ctx.moveTo(ga.x - ex, ga.y - ey); ctx.lineTo(gb.x + ex, gb.y + ey); ctx.lineTo(gb.x + ex, gb.y + ey - H); ctx.lineTo(ga.x - ex, ga.y - ey - H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(ga.x - ex, ga.y - ey); ctx.lineTo(gb.x + ex, gb.y + ey); ctx.lineTo(gb.x + ex, gb.y + ey - 4); ctx.lineTo(ga.x - ex, ga.y - ey - 4); ctx.closePath(); ctx.fill();
      if (sg.south) { ctx.fillStyle = 'rgba(59,125,216,0.18)'; ctx.beginPath(); ctx.moveTo(ga.x, ga.y - 4); ctx.lineTo(gb.x, gb.y - 4); ctx.lineTo(gb.x, gb.y - 7); ctx.lineTo(ga.x, ga.y - 7); ctx.closePath(); ctx.fill(); }
    }
    // the rail on top: from the inner edge to the outer edge, lifted by the boards' height
    const ia = { x: a.x, y: a.y - H }, ib = { x: b.x, y: b.y - H }, oa = { x: a.x + a.nx * B, y: a.y + a.ny * B - H }, ob = { x: b.x + b.nx * B, y: b.y + b.ny * B - H };
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(ia.x - ex, ia.y - ey); ctx.lineTo(ib.x + ex, ib.y + ey); ctx.lineTo(ob.x + ex, ob.y + ey); ctx.lineTo(oa.x - ex, oa.y - ey); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ia.x, ia.y + 0.6); ctx.lineTo(ib.x, ib.y + 0.6); ctx.stroke();
  },

  // ---- each frame
  visible(r, pad = 0) { const Z = CFG.ICERINK.ZONE; return Z.x1 + pad > r.camX && Z.x0 - pad < r.camX + r.viewW && Z.y1 + pad > r.camY && Z.y0 - pad < r.camY + r.viewH; },
  dynamic(r, g) {
    if (!this.st || g.area !== 'snow' || g.travel || !this.visible(r)) return;
    const ctx = r.ctx, K = CFG.ICERINK, I = K.ICE, st = this.st;
    // the mats: where to put on skates and where to hop in the Zamboni
    this.drawSpot(r, K.SKATE_SPOT, '⛸️'); this.drawSpot(r, K.ZAM_SPOT, '🧊');
    // the scratches
    if (st.canvas) ctx.drawImage(st.canvas, I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0);
    // the wet trail behind the Zamboni: glassy water drying back to glossy ice (one stroke per age band)
    if (st.wet.length) {
      ctx.save(); U.roundRect(ctx, I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0, I.r); ctx.clip();
      const W = st.wet, NB = 6, band = (w) => Math.min(NB - 1, Math.floor(w.t / K.WET_T * NB)), joined = (i) => i > 0 && U.dist(W[i - 1].x, W[i - 1].y, W[i].x, W[i].y) < 16;
      ctx.lineWidth = K.ZAM.sweep[2] * 2; ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
      for (let b = 0; b < NB; b++) {
        const al = 0.5 * Math.pow(1 - (b + 0.5) / NB, 1.2);
        ctx.beginPath(); let any = false, open = false;
        for (let i = 0; i < W.length; i++) {
          if (band(W[i]) !== b) { open = false; continue; }
          if (!open) { const j = joined(i) ? i - 1 : i; ctx.moveTo(W[j].x, W[j].y); if (j === i) ctx.lineTo(W[i].x + Math.cos(W[i].a) * 0.5, W[i].y + Math.sin(W[i].a) * 0.5); open = true; }
          else if (!joined(i)) ctx.moveTo(W[i].x, W[i].y);
          ctx.lineTo(W[i].x, W[i].y); any = true;
        }
        if (any) { ctx.strokeStyle = `rgba(118,188,244,${al.toFixed(3)})`; ctx.stroke(); }
      }
      // glassy streaks on the fresh water
      ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const [off, al] of [[11, 0.55], [-15, 0.35]]) {
        ctx.beginPath(); let open = false;
        for (let i = 0; i < W.length; i++) {
          const w = W[i]; if (w.t > K.WET_T * 0.45) { open = false; continue; }
          const x = w.x - Math.sin(w.a) * off, y = w.y + Math.cos(w.a) * off;
          if (open && joined(i)) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          open = true;
        }
        ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.stroke();
      }
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
      ctx.restore();
    }
    // a slow glint sliding over the ice
    const t = (g.time * 0.08) % 1.6, gx = I.x0 - 100 + t * 450;
    ctx.save(); U.roundRect(ctx, I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0, I.r); ctx.clip();
    ctx.fillStyle = st.shinyT > 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.moveTo(gx, I.y1); ctx.lineTo(gx + 40, I.y1); ctx.lineTo(gx + 190, I.y0); ctx.lineTo(gx + 150, I.y0); ctx.closePath(); ctx.fill();
    ctx.restore();
    // reflections under the skaters (a soft blue ghost on the ice)
    ctx.fillStyle = 'rgba(80,130,190,0.16)';
    for (const k of st.skaters) if (k.state === 'skate' || k.state === 'fall') { ctx.beginPath(); ctx.ellipse(k.x, k.y + 10 * k.look.s, 9 * k.look.s, 13 * k.look.s, 0, 0, Math.PI * 2); ctx.fill(); }
    const sk = st.skate; if (sk && this.onIce(sk.x, sk.y)) { ctx.beginPath(); ctx.ellipse(sk.x, sk.y + 12, 10, 15, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st || g.area !== 'snow' || !this.visible(r, 60)) return;
    const K = CFG.ICERINK, st = this.st, ctx = r.ctx, x0 = r.camX - 80, x1 = r.camX + r.viewW + 80, y0 = r.camY - 40, y1 = r.camY + r.viewH + 160;
    const vis = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
    for (const sg of this.boardSegs()) if (sg.south && vis(sg.x, sg.y)) items.push({ y: sg.y, draw: () => this.drawBoardSeg(ctx, sg) });
    items.push({ y: K.GATE.y - K.GATE.half, draw: () => this.drawGate(r, g) });
    { const S = K.STAND; if (vis((S.x0 + S.x1) / 2, S.y1)) { items.push({ y: S.y0, draw: () => this.drawStandBack(r, g) }); items.push({ y: S.y1, draw: () => this.drawStandFront(r, g) }); } }
    { const G = K.GARAGE; if (vis((G.x0 + G.x1) / 2, G.y1)) { items.push({ y: G.y0, draw: () => this.drawGarageBack(r, g) }); items.push({ y: G.y1 + 0.5, draw: () => this.drawGarageFront(r, g) }); } }
    for (const b of K.BENCHES) if (vis(b.x, b.y)) items.push({ y: b.y, draw: () => this.drawBench(ctx, b) });
    if (vis(K.XMAS.x, K.XMAS.y)) items.push({ y: K.XMAS.y, draw: () => this.drawXmas(r, g) });
    K.POLES.forEach(([x, y], i) => { if (vis(x, y)) items.push({ y, draw: () => this.drawPole(r, g, x, y, i) }); });
    for (const k of st.skaters) if (vis(k.x, k.y)) {
      items.push({ y: k.state === 'bench' ? k.y - 0.5 : k.y, draw: () => this.drawSkater(r, g, k) });
      if (k.sled) items.push({ y: k.sled.y, draw: () => this.drawToddlerSled(r, g, k) });
    }
    const z = st.zam;
    if (vis(z.x, z.y)) items.push({ y: z.y + 14, draw: () => this.drawZam(r, g) });
    if (!this.npcDriving(g) && vis(K.DRIVER_SPOT.x, K.DRIVER_SPOT.y)) items.push({ y: K.DRIVER_SPOT.y, draw: () => this.drawDriver(r, g) });
    if (this.skating(g)) items.push({ y: st.skate.y, draw: () => this.drawChefSkating(r, g) });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'snow' || g.travel || !this.visible(r, 80)) return;
    const ctx = r.ctx, K = CFG.ICERINK, st = this.st;
    this.drawStrings(r, g);
    const bubble = (x, y, text) => { ctx.font = r.font(13); const tw = ctx.measureText(text).width + 22; r.drawBubble(x, y, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, tw); };
    for (const k of st.skaters) if (k.say) bubble(k.x, k.y - (k.state === 'fall' ? 68 : k.state === 'bench' ? 84 : 76) * k.look.s - (k.hop > 0 ? 8 : 0), k.say);
    if (st.driver.say) { const at = this.npcDriving(g) ? st.zam : K.DRIVER_SPOT; bubble(at.x, at.y - 78, st.driver.say); }
    // how clean the rink is, over the Zamboni while it is out
    const z = st.zam;
    if (z.mode !== 'park' && (this.zamboning(g) || z.mode === 'auto')) this.drawMeter(r, g, z.x, z.y - 70);
  },
  // the glow of the bulbs at dusk (screen space, over the dusk tint)
  screen(r, g) {
    if (!this.st || g.area !== 'snow' || g.travel || !this.visible(r, 80)) return;
    const dusk = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.dusk || 0 : 0;
    if (dusk < 0.05) return;
    const ctx = r.ctx, sc = r.scale, gs = Math.min(sc, 2), W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of this.bulbs()) {
      const x = (b.x - r.camX) * sc, y = (b.y - r.camY) * sc;
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      ctx.fillStyle = `rgba(${b.rgb},${(0.13 * dusk).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 7 * gs, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,246,214,${(0.32 * dusk).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 2.2 * gs, 0, Math.PI * 2); ctx.fill();
    }
    // the stand's warm lamp
    { const S = CFG.ICERINK.STAND, x = ((S.x0 + S.x1) / 2 - r.camX) * sc, y = (S.y1 - 46 - r.camY) * sc, R = 60 * gs, gr = ctx.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(255,205,110,${(0.22 * dusk).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,205,110,0)'); ctx.fillStyle = gr; ctx.fillRect(x - R, y - R, R * 2, R * 2); }
    ctx.restore();
  },

  // ---- art helpers
  bulbs() {
    if (this._bulbs) return this._bulbs;
    const K = CFG.ICERINK, cols = [['#ff5a5a', '255,90,90'], ['#ffd23f', '255,210,63'], ['#4cd964', '76,217,100'], ['#4aa8ff', '74,168,255'], ['#ff8fd0', '255,143,208']], out = [];
    let n = 0;
    for (const [ia, ib] of K.STRINGS) {
      const [ax, ay] = K.POLES[ia], [bx, by] = K.POLES[ib], A = { x: ax, y: ay - K.POLE_H + 4 }, B = { x: bx, y: by - K.POLE_H + 4 };
      const len = U.dist(A.x, A.y, B.x, B.y), m = Math.max(2, Math.round(len / 16));
      for (let i = 1; i < m; i++) { const t = i / m, c = cols[n++ % cols.length]; out.push({ x: U.lerp(A.x, B.x, t), y: U.lerp(A.y, B.y, t) + 18 * 4 * t * (1 - t) + 3, col: c[0], rgb: c[1], i: n }); }
    }
    return (this._bulbs = out);
  },
  drawStrings(r, g) {
    const ctx = r.ctx, K = CFG.ICERINK, dusk = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.dusk || 0 : 0, step = Math.floor(g.time * 2);
    ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const [ia, ib] of K.STRINGS) {
      const [ax, ay] = K.POLES[ia], [bx, by] = K.POLES[ib], A = { x: ax, y: ay - K.POLE_H + 4 }, B = { x: bx, y: by - K.POLE_H + 4 };
      ctx.moveTo(A.x, A.y); for (let i = 1; i <= 12; i++) { const t = i / 12; ctx.lineTo(U.lerp(A.x, B.x, t), U.lerp(A.y, B.y, t) + 18 * 4 * t * (1 - t)); }
    }
    ctx.stroke();
    for (const b of this.bulbs()) {
      const twinkle = dusk > 0.3 && (b.i + step) % 7 === 0;
      ctx.fillStyle = twinkle ? '#ffffff' : b.col; ctx.beginPath(); ctx.arc(b.x, b.y, 2.8, 0, Math.PI * 2); ctx.fill();
      if (dusk > 0.2) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(b.x - 0.8, b.y - 0.8, 1.1, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  drawPole(r, g, x, y, i) {
    const ctx = r.ctx, K = CFG.ICERINK, h = K.POLE_H, wv = Math.sin(g.time * 4 + i) * 3;
    ctx.fillStyle = 'rgba(70,100,150,0.22)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 1, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 2.5, y - h, 5, h + 1);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y - h, 4, Math.PI, 0); ctx.fill();
    // a pennant on top
    ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166', '#2f9e44', '#8e5bd1', '#ff8fd0'][i % 6];
    ctx.beginPath(); ctx.moveTo(x, y - h - 2); ctx.lineTo(x + 20, y - h + 4 + wv * 0.4); ctx.lineTo(x, y - h + 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 1, y - h - 6, 2, 8);
  },
  drawSpot(r, s, ico) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(59,125,216,0.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 24, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(59,125,216,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(s.x, s.y, 24, 11, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, s.x, s.y + 1);
  },
  // the gate in the west boards: posts, and a little door that swings open when someone is about to pass
  drawGate(r, g) {
    const ctx = r.ctx, K = CFG.ICERINK, I = K.ICE, B = K.BOARD, H = K.BOARD_H, G = K.GATE, st = this.st;
    const who = [g.player].concat(st.skaters);
    const open = who.some((q) => U.dist(q.x, q.y, (K.GATE_IN.x + K.GATE_OUT.x) / 2, G.y) < 54) && (this.skating(g) || st.skaters.some((k) => k.state === 'exit' || k.state === 'enter'));
    const xL = I.x0 - B, yT = G.y - G.half, yB = G.y + G.half;
    if (open) {   // the door swung out to the west, hinged on the north post
      ctx.fillStyle = '#f7fbff'; ctx.fillRect(xL - G.half * 1.6, yT - H, G.half * 1.6, H);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(xL - G.half * 1.6, yT - 4, G.half * 1.6, 4);
      ctx.fillStyle = '#e4572e'; ctx.fillRect(xL - G.half * 1.6, yT - H - 3, G.half * 1.6, 3);
    } else {      // shut: a board across the gap, with a little blue latch
      ctx.fillStyle = '#e4572e'; ctx.fillRect(xL, yT - H, B, yB - yT);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(xL + B - 2, yT - H, 1.2, yB - yT);
      ctx.fillStyle = '#3b7dd8'; ctx.fillRect(xL - 2, G.y - H - 3, 6, 6);
    }
    for (const y of [yT, yB]) { ctx.fillStyle = '#c0392b'; ctx.fillRect(xL - 1, y - H - 8, B + 2, 10); ctx.fillStyle = '#ffffff'; ctx.fillRect(xL - 1, y - H - 8, B + 2, 2); }
  },
  drawStandBack(r, g) {
    const ctx = r.ctx, K = CFG.ICERINK, S = K.STAND, H = K.STAND_H, w = S.x1 - S.x0;
    // the back panel: blue planks, a shelf of skates
    ctx.fillStyle = 'rgba(70,100,150,0.2)'; ctx.fillRect(S.x0 + 6, S.y0 - 2, w, 10);
    ctx.fillStyle = '#4f8fd8'; ctx.fillRect(S.x0, S.y0 - H, w, H);
    ctx.fillStyle = '#3f7cc2'; for (let x = S.x0 + 12; x < S.x1; x += 14) ctx.fillRect(x, S.y0 - H, 2, H);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(S.x0 + 6, S.y0 - 38, 56, 4);
    for (let i = 0; i < 3; i++) {   // pairs of white skates hanging on the pegs
      const x = S.x0 + 16 + i * 18, y = S.y0 - 34;
      ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 6); ctx.moveTo(x, y); ctx.lineTo(x + 5, y + 6); ctx.stroke();
      for (const d of [-5, 3]) { ctx.fillStyle = '#ffffff'; U.roundRect(ctx, x + d - 3, y + 5, 7, 10, 2); ctx.fill(); ctx.fillStyle = ['#ff8fd0', '#3b7dd8', '#ffd166', '#2f9e44'][i]; ctx.fillRect(x + d - 2, y + 7, 5, 1.5); ctx.fillStyle = '#9aa7b8'; ctx.fillRect(x + d - 4, y + 15, 9, 1.5); }
    }
    // the renter behind the counter
    const t = g.time, near = !g.driving && this.near(g, K.SKATE_SPOT, 70), wave = near ? Math.sin(t * 8) * 0.3 : 0;
    r.drawPerson(S.x0 + 82, S.y0 + 26, { shirt: '#e4572e', skin: '#f1c27d', hat: 'cap', capColor: '#3b7dd8', facing: -1, moving: false, bob: 0, carry: 0, pants: '#3a3f5c', stripes: true });
    if (near) { ctx.save(); ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(S.x0 + 100, S.y0 - 28); ctx.rotate(wave); ctx.fillText('👋', 0, 0); ctx.restore(); }
  },
  drawStandFront(r, g) {
    const ctx = r.ctx, K = CFG.ICERINK, S = K.STAND, H = K.STAND_H, w = S.x1 - S.x0, cx = (S.x0 + S.x1) / 2;
    // the counter
    ctx.fillStyle = '#a0683a'; ctx.fillRect(S.x0, S.y1 - 34, w, 34);
    ctx.fillStyle = '#7d4f2b'; for (let y = S.y1 - 26; y < S.y1; y += 9) ctx.fillRect(S.x0, y, w, 2);
    ctx.fillStyle = '#c08a52'; ctx.fillRect(S.x0 - 4, S.y1 - 38, w + 8, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(S.x0 - 4, S.y1 - 40, w + 8, 3);
    // a pair of skates on the counter
    for (const d of [-8, 6]) { ctx.fillStyle = '#ffffff'; U.roundRect(ctx, cx - 30 + d, S.y1 - 50, 8, 11, 2); ctx.fill(); ctx.fillStyle = '#9aa7b8'; ctx.fillRect(cx - 31 + d, S.y1 - 39, 10, 1.6); }
    // the posts and the striped awning
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(S.x0 - 2, S.y1 - H, 5, H - 34); ctx.fillRect(S.x1 - 3, S.y1 - H, 5, H - 34);
    const ay = S.y0 - H - 6, ah = S.y1 - S.y0 + 4;
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#e4572e'; ctx.fillRect(S.x0 - 8 + i * (w + 16) / 8, ay, (w + 16) / 8 + 0.5, ah); }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#e4572e'; ctx.beginPath(); const x = S.x0 - 8 + i * (w + 16) / 8, ww = (w + 16) / 8; ctx.moveTo(x, ay + ah); ctx.lineTo(x + ww, ay + ah); ctx.lineTo(x + ww / 2, ay + ah + 7); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; for (let x = S.x0 - 6; x <= S.x1 + 6; x += 10) { ctx.beginPath(); ctx.arc(x, ay + 1, 4 + (x % 3), Math.PI, 0); ctx.fill(); }
    // the sign
    ctx.font = r.font(12); const text = '⛸️ SKATES', tw = ctx.measureText(text).width + 20;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, cx - tw / 2, ay - 26, tw, 22, 6); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; U.roundRect(ctx, cx - tw / 2, ay - 26, tw, 22, 6); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, ay - 14);
  },
  // the garage: the inside (seen through the big open door), then the log front wall round the door, a snowy roof
  drawGarageBack(r, g) {
    const ctx = r.ctx, K = CFG.ICERINK, G = K.GARAGE, H = K.GARAGE_H, L = K.LANE;
    ctx.fillStyle = '#5a4634'; ctx.fillRect(L.x - 40, G.y1 - H, 80, H);
    ctx.fillStyle = '#6e5843'; for (let y = G.y1 - H + 8; y < G.y1 - 20; y += 10) ctx.fillRect(L.x - 40, y, 80, 2);
    ctx.fillStyle = '#9aa7b8'; ctx.fillRect(L.x - 40, G.y1 - 20, 80, 20);
    ctx.fillStyle = '#2f9e44'; ctx.lineWidth = 3; ctx.strokeStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(L.x + 28, G.y1 - 40, 7, 0, Math.PI * 2); ctx.stroke();   // a coiled hose on the wall
    ctx.fillStyle = '#e4572e'; ctx.fillRect(L.x - 33, G.y1 - 50, 3, 26); U.roundRect(ctx, L.x - 37, G.y1 - 26, 11, 9, 2); ctx.fill();   // a shovel
  },
  drawGarageFront(r, g) {
    const ctx = r.ctx, K = CFG.ICERINK, G = K.GARAGE, H = K.GARAGE_H, L = K.LANE, fy = G.y1 - H, cx = (G.x0 + G.x1) / 2, dl = L.x - 38, dr = L.x + 38, dt = G.y1 - 54;
    ctx.fillStyle = 'rgba(70,100,150,0.22)'; ctx.fillRect(G.x1, G.y0 + 10, 8, G.y1 - G.y0 - 6);
    const wall = (x0, y0, x1, y1) => {
      ctx.fillStyle = '#a0683a'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = '#7d4f2b'; for (let y = fy + 8; y < y1; y += 10) if (y > y0) ctx.fillRect(x0, y, x1 - x0, 2);
    };
    wall(G.x0, fy, dl, G.y1); wall(dr, fy, G.x1, G.y1); wall(dl, fy, dr, dt);
    ctx.fillStyle = '#b07a45'; for (const x of [G.x0, G.x1]) for (let y = fy + 4; y < G.y1; y += 10) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    // the rolled-up door over the opening, with yellow-and-black stripes on its frame
    ctx.fillStyle = '#7fb6e0'; ctx.fillRect(dl, dt - 4, dr - dl, 6);
    for (let x = dl; x < dr; x += 8) { ctx.fillStyle = (x - dl) % 16 ? '#2d3a4a' : '#ffd166'; ctx.fillRect(x, dt + 2, 8, 3); }
    ctx.fillStyle = '#ffd166'; ctx.fillRect(dl - 3, dt, 3, G.y1 - dt); ctx.fillRect(dr, dt, 3, G.y1 - dt);
    // little windows either side
    ctx.fillStyle = '#ffe9a8'; U.roundRect(ctx, G.x0 + 6, fy + 16, 14, 16, 3); ctx.fill(); U.roundRect(ctx, G.x1 - 20, fy + 16, 14, 16, 3); ctx.fill();
    // the roof, with snow on it
    const rt = fy - 34;
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(G.x0 - 12, fy + 4); ctx.lineTo(G.x1 + 12, fy + 4); ctx.lineTo(G.x1 - 6, rt); ctx.lineTo(G.x0 + 6, rt); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(G.x0 - 8, fy - 2); ctx.lineTo(G.x1 + 8, fy - 2); ctx.lineTo(G.x1 - 9, rt + 2); ctx.lineTo(G.x0 + 9, rt + 2); ctx.closePath(); ctx.fill();
    for (let x = G.x0; x <= G.x1; x += 12) { ctx.beginPath(); ctx.arc(x, fy - 1, 5 + (x % 3), 0, Math.PI); ctx.fill(); }
    ctx.font = r.font(12); const text = '🧊 ZAMBONI', tw = ctx.measureText(text).width + 20;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, cx - tw / 2, fy - 30, tw, 22, 6); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; U.roundRect(ctx, cx - tw / 2, fy - 30, tw, 22, 6); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, fy - 18);
  },
  drawBench(ctx, b) {
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(b.x + 3, b.y + 2, 34, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(b.x - 26, b.y - 10, 6, 11); ctx.fillRect(b.x + 20, b.y - 10, 6, 11);
    ctx.fillStyle = '#a0683a'; U.roundRect(ctx, b.x - 32, b.y - 16, 64, 8, 3); ctx.fill();
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, b.x - 32, b.y - 18, 64, 4, 2); ctx.fill();
  },
  drawXmas(r, g) {
    const ctx = r.ctx, X = CFG.ICERINK.XMAS, x = X.x, y = X.y, t = g.time;
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 2, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 9, y - 10, 18, 12, 2); ctx.fill();   // the tub
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 3, y - 16, 6, 8);
    const tiers = [[y - 14, 24, 22], [y - 30, 19, 20], [y - 44, 13, 18]];
    for (const [ty, hw, th] of tiers) { ctx.fillStyle = '#2f7d4a'; ctx.beginPath(); ctx.moveTo(x - hw, ty); ctx.lineTo(x + hw, ty); ctx.lineTo(x, ty - th); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw + 3, ty - 2, hw * 2 - 6, 2); }
    const cols = ['#ff5a5a', '#ffd23f', '#4aa8ff', '#ff8fd0'];
    [[-12, -18], [10, -20], [-4, -28], [7, -36], [-8, -38], [2, -48], [14, -16], [-15, -16]].forEach(([dx, dy], i) => {
      ctx.fillStyle = (Math.floor(t * 2) + i) % 4 === 0 ? '#ffffff' : cols[i % 4]; ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.6, 0, Math.PI * 2); ctx.fill();
    });
    // the star on top
    ctx.fillStyle = '#ffd23f'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 3 : 7; ctx.lineTo(x + Math.cos(a) * rr, y - 64 + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  },
  // a skater (scaled), gliding with the feet together, sometimes wobbling, or sitting on the ice / a bench
  drawPersonOnSkates(r, x, y, look, o) {
    const ctx = r.ctx, s = o.scale || 1, f = look.facing || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (o.shadow !== false && !o.sit) { ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(2, 5, 15, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.translate(0, -(o.z || 0)); ctx.rotate(o.tilt || 0);
    if (o.spin) ctx.scale(0.5 + 0.5 * Math.abs(Math.cos(o.spin)), 1);
    if (o.sit) {
      // sitting down: legs out in front with the skates up, the body lower
      ctx.fillStyle = look.pants || '#3a3f5c';
      for (const d of [-3, 3]) { U.roundRect(ctx, f > 0 ? -2 : -16, d - 2, 18, 7, 3); ctx.fill(); }
      for (const d of [-3, 3]) { ctx.fillStyle = '#ffffff'; U.roundRect(ctx, f * 16 - 4, d - 8, 8, 9, 2); ctx.fill(); ctx.fillStyle = '#9aa7b8'; ctx.fillRect(f * 16 + (f > 0 ? 4 : -5.5), d - 9, 1.5, 11); }
      ctx.save(); ctx.beginPath(); ctx.rect(-40, -120, 80, 118); ctx.clip(); r.drawPerson(0, 12, Object.assign({}, look, { moving: false })); ctx.restore();
      if (look.beanie) this.drawBeanie(ctx, 0, 12, look);
    } else {
      r.drawPerson(0, 0, look);
      // white skates and silver blades
      for (const d of [-5.5, 5.5]) {
        ctx.fillStyle = '#ffffff'; U.roundRect(ctx, d - 4.5, -3, 9, 7.5, 2.5); ctx.fill();
        ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1; U.roundRect(ctx, d - 4.5, -3, 9, 7.5, 2.5); ctx.stroke();
        ctx.fillStyle = look.lace || '#e4572e'; ctx.fillRect(d - 1.5, -2, 3, 1.4);
        ctx.fillStyle = '#9aa7b8'; ctx.fillRect(d - 5.5 + f, 5, 11, 1.8);
      }
      if (look.beanie) this.drawBeanie(ctx, 0, 0, look);
    }
    ctx.restore();
  },
  drawBeanie(ctx, x, y, look) {
    ctx.fillStyle = look.beanie; ctx.beginPath(); ctx.arc(x, y - 41, 11.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; U.roundRect(ctx, x - 12, y - 44, 24, 6, 3); ctx.fill();
    ctx.fillStyle = look.bobble || '#ffffff'; ctx.beginPath(); ctx.arc(x, y - 54, 5, 0, Math.PI * 2); ctx.fill();
  },
  skaterLook(k) {
    const L = k.look;
    return { shirt: L.shirt, skin: L.skin, hair: L.hair, hairStyle: L.hairStyle, facing: k.facing, moving: k.moving, bob: k.bob, carry: 0, pants: L.pants, beanie: L.beanie, bobble: L.bobble };
  },
  drawSkater(r, g, k) {
    const L = k.look, look = this.skaterLook(k), hop = k.hop > 0 ? Math.abs(Math.sin(k.hop * Math.PI * 2)) * 6 : 0;
    if (k.state === 'bench') {   // sitting on the bench: the legs tucked behind the seat
      const ctx = r.ctx;
      ctx.save(); ctx.beginPath(); ctx.rect(k.x - 40, k.y - 120, 80, 104); ctx.clip();
      ctx.translate(k.x, k.y - 8); ctx.scale(L.s, L.s); r.drawPerson(0, 0, Object.assign(look, { moving: false })); this.drawBeanie(ctx, 0, 0, look);
      ctx.restore();
      return;
    }
    if (k.state === 'fall') { this.drawPersonOnSkates(r, k.x, k.y - hop, look, { scale: L.s, sit: true }); return; }
    const tilt = k.wob > 0 ? Math.sin(k.t * 22) * 0.22 : Math.sin(k.t * 2.2 + k.i) * 0.05;
    this.drawPersonOnSkates(r, k.x, k.y - hop, look, { scale: L.s, tilt });
  },
  drawToddlerSled(r, g, k) {
    const ctx = r.ctx, sd = k.sled, ang = Math.atan2(k.y - sd.y, k.x - sd.x);
    // the rope
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sd.x + Math.cos(ang) * 12, sd.y - 4); ctx.lineTo(k.x - Math.cos(ang) * 6, k.y - 16 * k.look.s); ctx.stroke();
    ctx.fillStyle = 'rgba(70,100,150,0.25)'; ctx.beginPath(); ctx.ellipse(sd.x + 2, sd.y + 4, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; for (const d of [-8, 8]) { ctx.beginPath(); ctx.moveTo(sd.x - 14, sd.y + d * 0.35 + 3); ctx.lineTo(sd.x + 12, sd.y + d * 0.35 + 3); ctx.quadraticCurveTo(sd.x + 17, sd.y + d * 0.35 + 3, sd.x + 17, sd.y + d * 0.35 - 1); ctx.stroke(); }
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, sd.x - 15, sd.y - 6, 30, 10, 4); ctx.fill();
    // the toddler in a puffy yellow snowsuit and a pink hat, sitting up (legs tucked in the sled)
    ctx.save(); ctx.beginPath(); ctx.rect(sd.x - 30, sd.y - 80, 60, 76); ctx.clip();
    ctx.translate(sd.x, sd.y + 4); ctx.scale(0.55, 0.55);
    const look = { shirt: '#ffd166', skin: '#f1c27d', hair: '#8a5a2b', facing: k.facing, moving: false, bob: 0, carry: 0, pants: '#ffd166', beanie: '#ff8fd0', bobble: '#ffffff' };
    r.drawPerson(0, 0, look); this.drawBeanie(ctx, 0, 0, look);
    ctx.restore();
    ctx.fillStyle = '#c0392b'; U.roundRect(ctx, sd.x - 15, sd.y - 2, 30, 6, 3); ctx.fill();
    if (k.state === 'skate' && Math.sin(g.time * 3 + 1) > 0.97) { ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('😄', sd.x + 14, sd.y - 34); }
  },
  drawChefSkating(r, g) {
    const sk = this.st.skate, p = g.player;
    const look = { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: p.facing || 1, moving: false, bob: 0, carry: p.carry, pants: '#2d3a4a' };
    const walking = sk.phase !== 'on', tilt = walking ? Math.sin(sk.t * 12) * 0.12 : U.clamp(sk.sx / 900, -0.14, 0.14);
    if (sk.z > 0) { const ctx = r.ctx, k = 1 - sk.z / (CFG.ICERINK.JUMP_H * 1.8); ctx.fillStyle = 'rgba(70,100,150,0.28)'; ctx.beginPath(); ctx.ellipse(sk.x + 2, sk.y + 5, 15 * k, 5 * k, 0, 0, Math.PI * 2); ctx.fill(); }
    this.drawPersonOnSkates(r, sk.x, sk.y, look, { scale: 1, tilt, z: sk.z, spin: sk.spin > 0 ? sk.spinA : 0, shadow: sk.z <= 0 });
    if (sk.spin > 0) {   // swirl lines round the feet
      const ctx = r.ctx; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) { const a = sk.spinA * 1.3 + i * Math.PI; ctx.beginPath(); ctx.ellipse(sk.x, sk.y - 6, 20, 7, 0, a, a + 1.6); ctx.stroke(); }
    }
  },
  drawDriver(r, g) {
    const K = CFG.ICERINK, D = K.DRIVER_SPOT, d = this.st.driver, hop = d.hop > 0 ? Math.abs(Math.sin(d.hop * Math.PI * 2)) * 6 : 0;
    const look = { shirt: '#2a5db0', skin: '#e0ac69', hat: 'cap', capColor: '#ffd166', facing: -1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', beard: '#6b4a2b' };
    r.drawPerson(D.x, D.y - hop, look);
  },
  drawZam(r, g) {
    const ctx = r.ctx, z = this.st.zam, chef = this.zamboning(g), npc = this.npcDriving(g);
    ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.angle);
    r.drawVehicle('zamboni', g, null, z);
    if (chef || npc) {   // the driver's head, seen from above, in the seat
      ctx.fillStyle = chef ? '#ffffff' : '#ffd166'; ctx.beginPath(); ctx.ellipse(-6, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = chef ? '#f1c27d' : '#e0ac69'; ctx.beginPath(); ctx.arc(-3, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = chef ? '#ffffff' : '#ffd166'; ctx.beginPath(); ctx.arc(-5, 0, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    if (chef) r.drawRidingExtras(g, z, 40);
  },
  drawMeter(r, g, x, y) {
    const ctx = r.ctx, pct = this.cleanPct(), w = 118, h = 28, done = pct >= 100, x0 = x - w / 2;
    ctx.fillStyle = 'rgba(43,29,20,0.8)'; U.roundRect(ctx, x0, y - h / 2, w, h, 14); ctx.fill();
    ctx.font = r.font(13); ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText(done ? '✨' : '🧊', x0 + 15, y + 1);
    ctx.textAlign = 'left'; ctx.fillStyle = done ? '#ffd23f' : '#ffffff'; ctx.fillText(pct + '%', x0 + 28, y + 1);
    const bx = x0 + 68, bw = w - 78;
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; U.roundRect(ctx, bx, y - 4, bw, 8, 4); ctx.fill();
    ctx.fillStyle = done ? '#ffd23f' : '#7fd3ff'; U.roundRect(ctx, bx, y - 4, Math.max(8, bw * pct / 100), 8, 4); ctx.fill();
  },

  // the Zamboni, nose +x: a white body with a blue stripe, the big blue snow tank at the front, the driver's seat in the
  // middle, the water tank behind it and the conditioner (the blue towel bar that leaves the wet trail) at the back
  vehicleArt: {
    zamboni(r, g, color, v, h) {
      const ctx = r.ctx, t = v ? v.beacon || 0 : g.time, moving = v && Math.hypot(v.sx || 0, v.sy || 0) > 5;
      h.shadow(84, 25);
      // wheels
      ctx.fillStyle = '#1e1e1e'; for (const x of [-24, 22]) for (const s of [-1, 1]) { U.roundRect(ctx, x - 9, s * 23 - 5, 18, 10, 3); ctx.fill(); }
      // the conditioner at the back: a blue bar with the white towel trailing
      ctx.fillStyle = '#2a5db0'; U.roundRect(ctx, -46, -27, 9, 54, 3); ctx.fill();
      ctx.fillStyle = moving ? 'rgba(170,220,255,0.95)' : '#e8f4ff'; U.roundRect(ctx, -51, -26, 6, 52, 2); ctx.fill();
      // the body
      ctx.fillStyle = '#f4f8fc'; U.roundRect(ctx, -40, -22, 80, 44, 9); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-40, 14, 80, 5); ctx.fillRect(-40, -19, 80, 5);
      // the water tank (back)
      ctx.fillStyle = '#cfe6fa'; U.roundRect(ctx, -37, -15, 22, 30, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-34, -12, 4, 22);
      ctx.fillStyle = '#7fb6e0'; ctx.beginPath(); ctx.arc(-26, 0, 4, 0, Math.PI * 2); ctx.fill();
      // the seat and the steering wheel
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -14, -11, 14, 22, 4); ctx.fill();
      ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(6, -7); ctx.lineTo(6, 7); ctx.stroke();
      // the big snow tank at the front, with its lid lines and the name
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, 8, -20, 32, 40, 7); ctx.fill();
      ctx.fillStyle = '#5b9be6'; U.roundRect(ctx, 11, -17, 26, 34, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(14, -14, 3, 28);
      ctx.fillStyle = '#ffffff'; for (let k = -10; k <= 10; k += 10) { ctx.beginPath(); ctx.arc(28, k, 2.4, 0, Math.PI * 2); ctx.fill(); }   // snowflake dots
      // headlights and the amber beacon
      ctx.fillStyle = '#fff6b0'; U.roundRect(ctx, 38, -17, 4, 7, 1); ctx.fill(); U.roundRect(ctx, 38, 10, 4, 7, 1); ctx.fill();
      const on = v && v.mode !== 'park' && Math.floor(t * 4) % 2 === 0;
      ctx.fillStyle = '#5c5c5c'; U.roundRect(ctx, -2, 12, 8, 8, 2); ctx.fill();
      ctx.fillStyle = on ? '#ffc21a' : '#b07400'; ctx.beginPath(); ctx.arc(2, 16, 3.5, 0, Math.PI * 2); ctx.fill();
      // the name along the side, kept the right way up
      const ca = v ? Math.cos(v.angle) : 1, sa = v ? Math.sin(v.angle) : 0;
      if (Math.abs(ca) >= Math.abs(sa)) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(-8, 16.5); if (ca < 0) ctx.rotate(Math.PI); ctx.fillText('ZAMBONI', 0, 0); ctx.restore(); }
    },
  },
};
Game.ext.unshift(IceRinkExt);   // ahead of Snowy Peak and the snow plow: by the rink its buttons and hints count
Render.ext.push(IceRinkExt);
