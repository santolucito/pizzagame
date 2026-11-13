'use strict';
// Stairs: one way to draw every staircase in the game, and one way to show where to stand on it.
// A plain helper object (no Game.ext / Render.ext hooks of its own): each feature file draws its stairs with these
// functions in its own paint hooks (static art) and builds its button and hint with the labels here.
//
// Stairs are drawn FLAT, seen from straight above like the rest of the floor art, and small (about 80 x 44 px; a
// person is about 70 px tall): a rectangle of treads as stripes, going UP (a flight) or DOWN (a stairwell in the floor).
// The tread at the start is the one to stand on: a paler tread with two little footprints on it.
//
//   Stairs.flatGeom(o)      the numbers: o = { x0, y0, x1, y1, dir, n, first }. `dir` is the way you walk along the
//                           stairs from the step you stand on ('e', 'w', 'n', 's'); `first` its size. Returns `treads`
//                           (in walking order), `stand` (the step to stand on), `foot` (where the chef stands), `body`
//                           (the solid part: all but the stand step), `path` (the feet on each tread, for a climb).
//   Stairs.flat(ctx, o)     draws them: a dark frame with crisp slats for treads, lighter towards the top (o.down: a
//                           stairwell, darker the deeper it goes), a thin handrail with knobs along o.rails (any of 'n',
//                           's', 'e', 'w'), and the step to stand on paler, with two little footprints (o.stand: false
//                           for steps you just walk over). o.mat: 'wood' (at home), 'stone', 'concrete', 'metal'.
//   Stairs.roundGeom(o) / Stairs.round(ctx, o)   the same look wound round a post (a spiral stair seen from above):
//                           o = { x, y, r, n, down }, with a straight step to stand on at the front (south).
//   Stairs.walk(path, k), Stairs.place(who, path, k, dt)   the feet k (0..1) of the way along the treads.
//   Stairs.up(place) / down(place)   the button labels: '⬆️ Go upstairs' / '⬇️ Go downstairs', or with a place,
//                           '⬆️ Up to the lamp room' / '⬇️ Down to the subway'.
//   Stairs.near(g, spot), Stairs.hint(g, spot, text), Stairs.sound(up), Stairs.sign(...)   reach (40 px), hint, sound, sign.
const Stairs = {
  REACH: 40,      // how close to the spot the button shows
  HINT: 110,      // how close the hint starts pointing at the step

  MATS: {
    wood: { tread: '#d4a46a', nose: '#f0c98e', riser: '#8d5a2b', side: '#7a4b23', sideHi: '#a26a35', rail: '#5b3a1a', railHi: '#c08850', knob: '#e8b26a', dark: '#24170f', trim: '#8d5a2b' },
    stone: { tread: '#d8d1c4', nose: '#f1ebdf', riser: '#9c9487', side: '#857d71', sideHi: '#aaa295', rail: '#2f6b3a', railHi: '#5fae6c', knob: '#56b862', dark: '#14110f', trim: '#a69e91' },
    concrete: { tread: '#c9ccd1', nose: '#f2c94c', riser: '#868b93', side: '#6b727c', sideHi: '#959ca6', rail: '#7f8995', railHi: '#dfe4ea', knob: '#dfe4ea', dark: '#121014', trim: '#9aa0a8' },
    metal: { tread: '#a9b1bb', nose: '#ffd166', riser: '#5c6670', side: '#4a5260', sideHi: '#727b88', rail: '#d93a2b', railHi: '#ff8a65', knob: '#ffd166', dark: '#151820', trim: '#5c6670' },
  },
  mat(m, over) {
    const base = typeof m === 'object' && m ? m : this.MATS[m] || this.MATS.wood;
    return over ? Object.assign({}, base, over) : base;
  },
  // a colour mixed toward black (k 0..1): treads get darker the deeper they go
  shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = 1 - U.clamp(k, 0, 1);
    return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
  },

  // ---------- labels, reach, hints, sound ----------
  up(place) { return place ? '⬆️ Up to ' + place : '⬆️ Go upstairs'; },
  down(place) { return place ? '⬇️ Down to ' + place : '⬇️ Go downstairs'; },
  dist(g, spot) { const p = g.player; return U.dist(p.x, p.y, spot.x, spot.y); },
  near(g, spot, reach) { return this.dist(g, spot) < (reach || this.REACH); },
  // the hint for a staircase: points at the step from a little way off, then just says what to do
  hint(g, spot, text, far) { const d = this.dist(g, spot); if (d >= (far || this.HINT)) return undefined; return { text, target: d < this.REACH ? null : { x: spot.x, y: spot.y } }; },
  sound(up) { if (up) Sfx.pickup(); else Sfx.drop(); Haptics.tap(); },

  // ---------- geometry ----------
  // A flat flight (or stairwell) filling the box x0..x1 × y0..y1, walked along `dir` from the step you stand on.
  flatGeom(o) {
    const dir = o.dir || 'e', horiz = dir === 'e' || dir === 'w', len = horiz ? o.x1 - o.x0 : o.y1 - o.y0, n = o.n || 6;
    const first = o.first || 22, run = (len - first) / Math.max(1, n - 1), treads = [];
    let a = 0;
    for (let i = 0; i < n; i++) {
      const sz = i ? run : first, b = a + sz;
      let T;
      if (dir === 'e') T = { x: o.x0 + a, y: o.y0, w: sz, h: o.y1 - o.y0 };
      else if (dir === 'w') T = { x: o.x1 - b, y: o.y0, w: sz, h: o.y1 - o.y0 };
      else if (dir === 's') T = { x: o.x0, y: o.y0 + a, w: o.x1 - o.x0, h: sz };
      else T = { x: o.x0, y: o.y1 - b, w: o.x1 - o.x0, h: sz };
      T.i = i; T.k = n > 1 ? i / (n - 1) : 0; T.cx = T.x + T.w / 2; T.cy = T.y + T.h / 2;
      treads.push(T); a = b;
    }
    const S = treads[0], gap = 6;
    const body = dir === 'e' ? { x: S.x + S.w + gap, y: o.y0, w: o.x1 - S.x - S.w - gap, h: o.y1 - o.y0 }
      : dir === 'w' ? { x: o.x0, y: o.y0, w: S.x - gap - o.x0, h: o.y1 - o.y0 }
        : dir === 's' ? { x: o.x0, y: S.y + S.h + gap, w: o.x1 - o.x0, h: o.y1 - S.y - S.h - gap }
          : { x: o.x0, y: o.y0, w: o.x1 - o.x0, h: S.y - gap - o.y0 };
    const path = treads.map((T) => ({ x: T.cx, y: T.cy + (horiz ? 4 : 0) }));
    return { dir, horiz, n, treads, stand: S, foot: path[0], top: path[n - 1], path, body, box: { x: o.x0, y: o.y0, w: o.x1 - o.x0, h: o.y1 - o.y0 } };
  },
  walk(points, k) {
    const m = points.length - 1, f = U.clamp(k, 0, 1) * m, i = Math.min(m - 1, Math.floor(f)), u = f - i, a = points[i], b = points[i + 1];
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    return { x: U.lerp(a.x, b.x, e), y: U.lerp(a.y, b.y, e) - Math.sin(u * Math.PI) * 3, facing: b.x > a.x + 0.5 ? 1 : b.x < a.x - 0.5 ? -1 : 0 };
  },
  // Put the chef (or anybody with x, y, facing, moving, bob) k of the way along a path.
  place(who, points, k, dt) {
    const q = this.walk(points, k);
    who.x = q.x; who.y = q.y; if (q.facing) who.facing = q.facing; who.moving = true; who.bob = (who.bob || 0) + (dt || 0) * 12;
    return q;
  },

  // A climb round a spiral between two floors of one map: the chef walks the treads on this floor, there is a short
  // blink (Stairs.blink) while `swap()` changes floors at the half-way point, then walks out on the other floor. Going up
  // that is up the spiral, then out of the stairwell above; going down, into the stairwell, then down the spiral.
  // cl = { t, swapped }; G = roundGeom(...); dur = seconds for the whole climb.
  spiralClimb(who, cl, G, dur, dt, swap) {
    const half = dur / 2;
    if (!cl.swapped && cl.t >= half) { cl.swapped = true; swap(); }
    if (!cl.swapped) this.place(who, G.path, cl.t / half, dt);
    else this.place(who, G.back, (cl.t - half) / half, dt);
    if (cl.t >= dur) who.moving = false;
  },
  // how dark the screen is during a spiral climb (0..1): a quick blink round the change of floors
  blink(cl, dur) { return U.clamp(1.4 - Math.abs(cl.t - dur / 2) / 0.22, 0, 1); },

  // ---------- drawing ----------
  // a colour mixed toward white (k 0..1)
  tint(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = U.clamp(k, 0, 1), c = (v) => Math.round(v + (255 - v) * f);
    return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
  },
  // how a tread is lit: a flight gets lighter towards the top, a stairwell darker the deeper it goes
  tone(M, T, down) { return down ? this.shade(M.tread, 0.05 + 0.5 * T.k) : this.mix(M.tread, -0.14 + 0.5 * T.k); },
  // darker (k < 0) or lighter (k > 0)
  mix(hex, k) { return k < 0 ? this.shade(hex, -k) : this.tint(hex, k); },
  // the line between two treads: the far edge of tread T (the side towards the next one)
  edge(T, dir, th) {
    if (dir === 'e') return { x: T.x + T.w - th, y: T.y, w: th, h: T.h };
    if (dir === 'w') return { x: T.x, y: T.y, w: th, h: T.h };
    if (dir === 's') return { x: T.x, y: T.y + T.h - th, w: T.w, h: th };
    return { x: T.x, y: T.y, w: T.w, h: th };
  },
  // the near edge of tread T (its nose, the side you step onto it from)
  nose(T, dir, th) { return this.edge(T, { e: 'w', w: 'e', n: 's', s: 'n' }[dir], th); },
  // a handrail along one long side of the box: a line with little posts
  rail(ctx, B, side, M) {
    const horiz = side === 'n' || side === 's', at = side === 'n' ? B.y - 3 : side === 's' ? B.y + B.h + 3 : side === 'w' ? B.x - 3 : B.x + B.w + 3;
    const a0 = horiz ? B.x : B.y, a1 = horiz ? B.x + B.w : B.y + B.h, pt = (q) => (horiz ? { x: q, y: at } : { x: at, y: q });
    const p0 = pt(a0), p1 = pt(a1);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p0.x + 1, p0.y + 2); ctx.lineTo(p1.x + 1, p1.y + 2); ctx.stroke();
    ctx.strokeStyle = M.rail; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.strokeStyle = M.railHi; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p0.x, p0.y - (horiz ? 0.8 : 0)); ctx.lineTo(p1.x, p1.y - (horiz ? 0.8 : 0)); ctx.stroke();
    ctx.lineCap = 'butt';
    for (const q of [p0, p1]) { ctx.fillStyle = M.rail; ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = M.knob; ctx.beginPath(); ctx.arc(q.x - 0.8, q.y - 0.8, 1.3, 0, Math.PI * 2); ctx.fill(); }
  },
  // two little shoe prints on a tread, toes pointing the way you walk on
  footprints(ctx, T, dir) {
    const ang = { e: 0, s: Math.PI / 2, w: Math.PI, n: -Math.PI / 2 }[dir], k = Math.min(T.w, T.h, 22) / 18;
    ctx.save(); ctx.translate(T.cx, T.cy); ctx.rotate(ang); ctx.fillStyle = 'rgba(91,58,26,0.55)';
    for (const [dx, dy] of [[-2, -5.5], [2, 5.5]]) {
      ctx.beginPath(); ctx.ellipse((dx + 1.5) * k, dy * k, 4.2 * k, 2.6 * k, 0, 0, Math.PI * 2); ctx.fill();          // the sole
      ctx.beginPath(); ctx.ellipse((dx - 4.5) * k, dy * k, 2 * k, 2.2 * k, 0, 0, Math.PI * 2); ctx.fill();            // the heel
    }
    ctx.restore();
  },
  // Flat stairs (see flatGeom): the slatted box, a dark frame with crisp slats for treads (lighter towards the top,
  // darker going down a stairwell), a thin handrail with knobs, and the step to stand on paler with two footprints.
  flat(ctx, o) {
    const G = this.flatGeom(o), M = this.mat(o.mat, o.colors), B = G.box, dir = G.dir, down = !!o.down, stand = o.stand !== false;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, B.x + 3, B.y + 3, B.w, B.h, 3); ctx.fill();
    ctx.fillStyle = down ? M.dark : M.rail; ctx.fillRect(B.x, B.y, B.w, B.h);
    for (const T of G.treads) {
      const r = G.horiz ? { x: T.x + 1, y: T.y + 3, w: T.w - 2, h: T.h - 6 } : { x: T.x + 3, y: T.y + 1, w: T.w - 6, h: T.h - 2 };
      ctx.fillStyle = stand && T.i === 0 ? this.tint(M.tread, 0.38) : this.tone(M, T, down); ctx.fillRect(r.x, r.y, r.w, r.h);
      if (stand && T.i === 0) this.footprints(ctx, T, dir);
      const nz = this.nose(r, dir, 2); ctx.fillStyle = 'rgba(255,240,205,0.5)'; ctx.fillRect(nz.x, nz.y, nz.w, nz.h);
      const sh = this.edge(r, dir, 2.5); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
    }
    for (const sd of o.rails || []) this.rail(ctx, B, sd, M);
    return G;
  },

  // A spiral seen from above, round a post at (x, y) with radius r: n wedge treads winding clockwise from the bottom
  // (south) all the way round, and a straight step to stand on at the front, below the circle. o.down: the stairwell on
  // the floor above (the same shape, darker the deeper it goes).
  roundGeom(o) {
    const r = o.r, n = o.n || 10, turn = o.turn || 0.85, a0 = Math.PI / 2 + 0.42, da = (Math.PI * 2 * turn) / n, rr = r * 0.62;
    const sw = Math.round(r * 0.95), sh = o.stepH || 26, stand = { x: o.x - sw / 2, y: o.y + r + 1, w: sw, h: sh, i: 0, k: 0 };
    stand.cx = o.x; stand.cy = stand.y + sh / 2;
    const wedges = [];
    for (let k = 0; k < n; k++) wedges.push({ i: k + 1, k: (k + 1) / n, a0: a0 + k * da, a1: a0 + (k + 1) * da });
    const foot = { x: o.x, y: stand.cy };
    const path = [foot, { x: o.x + Math.cos(Math.PI / 2 + 0.2) * rr, y: o.y + Math.sin(Math.PI / 2 + 0.2) * rr + 6 }];
    for (const w of wedges) { const a = (w.a0 + w.a1) / 2; path.push({ x: o.x + Math.cos(a) * rr, y: o.y + Math.sin(a) * rr }); }
    return { r, n, wedges, stand, foot, top: path[path.length - 1], path, back: path.slice().reverse(), body: { x: o.x - r, y: o.y - r, w: 2 * r, h: 2 * r }, box: { x: o.x - r, y: o.y - r, w: 2 * r, h: 2 * r + sh + 1 } };
  },
  round(ctx, o) {
    const G = this.roundGeom(o), M = this.mat(o.mat, o.colors), x = o.x, y = o.y, r = o.r, down = !!o.down, S = G.stand;
    // shadow, the dark frame (the hole's rim going down), the stand step's frame
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(x + 3, y + 3, r + 3, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(S.x + 3, S.y + 3, S.w, S.h);
    ctx.fillStyle = down ? M.dark : M.rail; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = M.rail; ctx.fillRect(S.x - 2, S.y - 3, S.w + 4, S.h + 5);
    // the wedge treads, each a crisp slat with a pale nose on the side you step onto it from and a shadow on the far side
    for (const w of G.wedges) {
      const g0 = w.a0 + 0.035, g1 = w.a1 - 0.035;
      ctx.fillStyle = this.tone(M, w, down);
      ctx.beginPath(); ctx.arc(x, y, r - 1.5, g0, g1); ctx.arc(x, y, 8, g1, g0, true); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,240,205,0.5)'; ctx.beginPath(); ctx.moveTo(x + Math.cos(g0 + 0.03) * 9, y + Math.sin(g0 + 0.03) * 9); ctx.lineTo(x + Math.cos(g0 + 0.03) * (r - 2), y + Math.sin(g0 + 0.03) * (r - 2)); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.moveTo(x + Math.cos(g1 - 0.03) * 9, y + Math.sin(g1 - 0.03) * 9); ctx.lineTo(x + Math.cos(g1 - 0.03) * (r - 2), y + Math.sin(g1 - 0.03) * (r - 2)); ctx.stroke();
    }
    // the post in the middle
    ctx.fillStyle = M.side; ctx.beginPath(); ctx.arc(x, y, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = M.knob; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 1.3, y - 1.3, 1.5, 0, Math.PI * 2); ctx.fill();
    // the step to stand on: paler, with two little footprints walking into the spiral
    ctx.fillStyle = this.tint(M.tread, 0.38); ctx.fillRect(S.x, S.y, S.w, S.h);
    ctx.fillStyle = 'rgba(255,240,205,0.5)'; ctx.fillRect(S.x, S.y + S.h - 2, S.w, 2);
    this.footprints(ctx, S, 'n');
    // the handrail round the rim, open at the front where the step joins
    const gap = 0.36, ra = r + 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 1, y + 2, ra, Math.PI / 2 + gap, Math.PI / 2 - gap + Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = M.rail; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y, ra, Math.PI / 2 + gap, Math.PI / 2 - gap + Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = M.railHi; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, ra - 0.6, Math.PI / 2 + gap, Math.PI / 2 - gap + Math.PI * 2); ctx.stroke();
    ctx.lineCap = 'butt';
    for (const a of [Math.PI / 2 + gap, Math.PI / 2 - gap]) { const qx = x + Math.cos(a) * ra, qy = y + Math.sin(a) * ra; ctx.fillStyle = M.rail; ctx.beginPath(); ctx.arc(qx, qy, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = M.knob; ctx.beginPath(); ctx.arc(qx - 0.8, qy - 0.8, 1.3, 0, Math.PI * 2); ctx.fill(); }
    return G;
  },
  // a little picture sign (⬆️🛏️): no reading needed
  sign(ctx, r, x, y, text, size) {
    const fs = size || 11;
    ctx.font = r.font(fs); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 14, h = fs + 9;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - w / 2 + 2, y - h / 2 + 2, w, h, 5); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - w / 2, y - h / 2, w, h, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.fillText(text, x, y + 0.5);
  },
};
