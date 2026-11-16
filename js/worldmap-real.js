'use strict';
// The REAL world map: a second view in the world map modal (js/worldmap.js). Two big tabs at the top of the modal
// switch between the storybook map ('🫧 Picture map') and this one ('🛰️ Real map'); the choice is remembered.
// Here every outdoor place is the game's own map, drawn the way the game draws it (ground, roads, buildings, trees,
// water, snow, and a snapshot of the people, vehicles and landmarks the extensions draw as entities), all at the same
// scale, laid out side by side as one stitched world, with a line for each ride between them (rail, road, sea lane,
// cable, tunnel, flight path or rocket trail) and the ride's vehicle rolling along it. A bouncing chef hat shows where
// the chef is. Drag to look around, pinch / mouse wheel / ➕ ➖ to zoom, 🌍 to see everything again, tap a map to zoom
// into it (tap again to zoom back out). No fast travel, no reading needed.
// Not an extension: it adds nothing to Game.ext or Render.ext and never changes the game's state.
//
// GENERATED FROM THE DATA (nothing positioned by hand):
//  * Places and rides: WorldMapExt.places() (Home Town + every outdoor map a ride reaches) and CFG.LINKS
//    ({ from, to, via, dir }). Each map is a rectangle the size of its CFG.AREAS[k].WORLD (one world unit = one
//    world unit everywhere, so the sizes are real).
//  * Where a ride leaves and arrives: a link may carry `fromAt` / `toAt` points; else the config point named by
//    CFG.WORLDMAP_REAL.SPOTS[via] (a path ending, e.g. 'STATION.platform') inside that map; else any point in that map
//    whose config path names the ride or ends in a station-ish word; else the map's centre. The line leaves the map's
//    edge where a ray from that spot in the ride's direction meets it, and a little badge with the vehicle marks the spot.
//  * Layout: breadth first from Home Town over the links; each new map goes past its parent's edge in the link's `dir`
//    (a gap for the line between), lined up with the ride's spots, then nudged sideways or further out when needed. A
//    small beam search keeps the cheapest layouts: short lines, no map overlapping another (with room to spare), no
//    line crossing a map or another line, a compact whole. Every ride's line stays within ~35° of its direction.
//
// RENDERING THE MAPS: each place is drawn ONCE into its own offscreen canvas (the biggest map ~1500 px wide), lazily
// when the real view first opens, a place or two per frame with a "drawing the map…" pill meanwhile, then kept. On the
// next open a place is only redrawn when its static art changed (the same bgKey hooks the game's own cache uses).
// Drawing a place borrows the renderer for a moment and puts everything back in a finally block: Game.area, Render's
// ctx / camera / view / scale / dpr / ext list, Render.drawPlayer, the day-night clock (the snapshot is in daylight)
// and the City's Pizza Tower floor. It runs the same steps as Render.draw: the cached background (the core painters,
// paint[area], paintTown, paintAfter), the moving-scenery and entity hooks (people, vehicles, landmarks), the tree
// canopies and the world-space overlay hooks. Never: the HUD, the hint arrow, floats, effects, walk-on pads, the
// screen-space hooks (night tint, rain, snow), the weather ripples, or the Pizza Coins (they stay a hunt). The chef is
// left out of the picture (the hat shows where they are). Every hook runs in its own try/catch, so one that throws
// only leaves its own bits out. Each frame of the open view is a handful of drawImage calls (no ctx.filter, no
// getImageData), in its own requestAnimationFrame loop that runs only while the real view is open.

CFG.WORLDMAP_REAL = {
  // where each ride leaves / arrives in a map: config paths (their endings), tried in order; the first inside the map wins
  SPOTS: {
    train: ['STATION.platform'],
    skilift: ['SNOW.CT.BOARD', 'SNOW.VALLEY.BOARD'],
    bus: ['CITY.TOWN_STOP', 'CITY.STOP'],
    subway: ['CITY.SUBWAY', 'SUBWAY.CAMPUS.SUBWAY'],
    pierline: ['CITY.SUBWAY', 'PIERPARK.STATION'],
    ferry: ['ISLANDS.TOWN_FERRY', 'ISLANDS.FERRY'],
    rocket: ['ISLANDS.ROCKET.PAD', 'MOON.PAD'],
    flight: ['AIRFIELD.RUNWAY', 'CLOUD.RUNWAY'],
  },
  SPOT_WORDS: /^(station|stop|dock|pad|platform|runway|board|arrive|terminal|ferry|pier)$/i,   // the generic fallback
  MAX_PX: 1500,          // the biggest map's cached width in px (the others use the same resolution)
  MAX_RES: 0.5,          // never sharper than this (px per world unit)
  SKIP: ['atmosphere', 'pizzacoins'],   // extensions whose moving things stay out of the picture (ripples, the coin hunt)
  STORE_KEY: 'pizza-worldmap-view',
};

const WorldMapReal = {
  mode: 'picture', dom: null, raf: null, running: false, t: 0, last: 0, frames: 0,
  cache: {},          // place → { canvas, key, res, w, h }
  queue: [],          // places still to (re)draw
  renders: 0, renderMs: 0, errors: [],
  _lay: null, _spots: null,
  view: null,         // { x, y, s }: the layout point at the canvas's top-left and the scale (CSS px per world unit)
  anim: null, ptrs: new Map(), drag: null, pinch: null, touched: false, size: null,

  // ======================= data =======================
  places() { return typeof WorldMapExt !== 'undefined' ? WorldMapExt.places().filter((k) => CFG.AREAS[k] && CFG.AREAS[k].WORLD) : ['town']; },
  links() { const keys = this.places(); return typeof WorldMapExt !== 'undefined' ? WorldMapExt.links().filter((l) => keys.includes(l.from) && keys.includes(l.to)) : []; },
  ride(via) { return typeof WorldMapExt !== 'undefined' ? WorldMapExt.ride(via) : { ico: '🚗', style: 'road', name: via }; },
  info(k) { return typeof WorldMapExt !== 'undefined' ? WorldMapExt.place(k) : { ico: '📍', name: k, col: '#ffd6a0' }; },
  dirVec(dir) { return WorldMapExt.dirVec(dir); },

  // every point in the config ({x, y}, or a rect's centre) with its path, for finding the ride spots
  spotIndex() {
    const sig = Object.keys(CFG).length + '|' + Object.keys(CFG.AREAS).length;
    if (this._spots && this._spots.sig === sig) return this._spots.pts;
    const pts = [], seen = new Set();
    const walk = (o, path, d) => {
      if (!o || typeof o !== 'object' || seen.has(o) || d > 7) return;
      seen.add(o);
      if (typeof o.x === 'number' && typeof o.y === 'number') pts.push({ path, x: o.x, y: o.y });
      else if (typeof o.x0 === 'number' && typeof o.y0 === 'number' && typeof o.x1 === 'number' && typeof o.y1 === 'number') pts.push({ path, x: (o.x0 + o.x1) / 2, y: (o.y0 + o.y1) / 2 });
      for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object' && !['AREAS', 'WORLDMAP', 'WORLDMAP_REAL', 'LINKS'].includes(k)) walk(v, path + '.' + k, d + 1);
    };
    walk(CFG, 'CFG', 0);
    this._spots = { sig, pts };
    return pts;
  },
  // where a ride leaves / arrives in a map (world coords), or null
  findSpot(area, via, at) {
    if (at && typeof at.x === 'number') return { x: at.x, y: at.y, found: true };
    const W = CFG.AREAS[area].WORLD, inside = (p) => p.x >= W.x0 && p.x <= W.x1 && p.y >= W.y0 && p.y <= W.y1;
    const pts = this.spotIndex().filter(inside);
    for (const end of CFG.WORLDMAP_REAL.SPOTS[via] || []) {
      const p = pts.find((q) => q.path === 'CFG.' + end || q.path.endsWith('.' + end));
      if (p) return { x: p.x, y: p.y, found: true, path: p.path };
    }
    const word = String(via).toLowerCase();
    const p = pts.find((q) => q.path.toLowerCase().split('.').some((s) => s === word || s.startsWith(word + '_') || s.endsWith('_' + word)))
      || pts.find((q) => CFG.WORLDMAP_REAL.SPOT_WORDS.test(q.path.split('.').pop()));
    return p ? { x: p.x, y: p.y, found: true, path: p.path } : null;
  },

  // ======================= layout (generated, cached until the maps or rides change) =======================
  sig() {
    const keys = this.places();
    return keys.map((k) => { const W = CFG.AREAS[k].WORLD; return k + ':' + [W.x0, W.y0, W.x1, W.y1].join(','); }).join(';') + '|' + this.links().map((l) => l.from + '>' + l.to + ':' + l.via + ':' + l.dir).join(';');
  },
  layout() {
    const sig = this.sig();
    if (this._lay && this._lay.sig === sig) return this._lay;
    const keys = this.places(), links = this.links(), P = {};
    for (const k of keys) { const W = CFG.AREAS[k].WORLD; P[k] = { key: k, W, w: W.x1 - W.x0, h: W.y1 - W.y0 }; }
    const sizes = keys.map((k) => Math.max(P[k].w, P[k].h)).sort((a, b) => a - b);
    const G = U.clamp(sizes[Math.floor(sizes.length / 2)] * 0.3, 420, 900);   // the gap between maps, for the lines
    // a ride's spot in a map, in that map's own coords (0..w, 0..h)
    const local = (k, l) => {
      const at = l.from === k ? l.fromAt : l.toAt, s = this.findSpot(k, l.via, at), A = P[k];
      if (!s) return { x: A.w / 2, y: A.h / 2, found: false };
      return { x: U.clamp(s.x - A.W.x0, 2, A.w - 2), y: U.clamp(s.y - A.W.y0, 2, A.h - 2), found: true, path: s.path };
    };
    // the order: breadth first from Home Town; each step is a place, the ride that reaches it, and from where
    const root = keys[0], order = [], seen = { [root]: true }, q = [root];
    while (q.length) {
      const cur = q.shift();
      for (const l of links) {
        const other = l.from === cur ? l.to : l.to === cur ? l.from : null;
        if (!other || seen[other]) continue;
        seen[other] = true; q.push(other);
        const [dx, dy] = this.dirVec(l.dir), s = l.from === cur ? 1 : -1;
        order.push({ k: other, from: cur, l, u: [dx * s, dy * s], sa: local(cur, l), sb: local(other, l) });
      }
    }
    const rect = (k, x, y) => ({ x0: x, y0: y, x1: x + P[k].w, y1: y + P[k].h });
    const st0 = { pos: { [root]: [0, 0] }, rects: { [root]: rect(root, 0, 0) }, segs: [], cost: 0, bb: rect(root, 0, 0) };
    let beam = [st0];
    const BEAM = 8, gaps = [1, 1.4, 2, 2.8, 4, 5.5], shifts = [0, 0.12, -0.12, 0.25, -0.25, 0.4, -0.4, 0.6, -0.6, 0.85, -0.85, 1.1, -1.1];
    for (const step of order) {
      const { k, from, u, sa, sb } = step, w = P[k].w, h = P[k].h, sx = Math.abs(u[0]) > 0.3 ? Math.sign(u[0]) : 0, sy = Math.abs(u[1]) > 0.3 ? Math.sign(u[1]) : 0;
      const diag = sx && sy, minCos = Math.cos((diag ? 40 : 34) * Math.PI / 180), next = [];
      for (const st of beam) {
        const ra = st.rects[from], ex = this.exitPoint(ra, ra.x0 + sa.x, ra.y0 + sa.y, u[0], u[1]);
        const xs = sx > 0 ? gaps.map((g) => [ra.x1 + g * G, 0]) : sx < 0 ? gaps.map((g) => [ra.x0 - g * G - w, 0]) : shifts.map((f) => [ex.x - sb.x + f * w, Math.abs(f * w)]);
        const ys = sy > 0 ? gaps.map((g) => [ra.y1 + g * G, 0]) : sy < 0 ? gaps.map((g) => [ra.y0 - g * G - h, 0]) : shifts.map((f) => [ex.y - sb.y + f * h, Math.abs(f * h)]);
        for (const [bx, shx] of xs) for (const [by, shy] of ys) {
          const rb = rect(k, bx, by);
          if (Object.values(st.rects).some((r) => this.overlap(r, rb, G * 0.55))) continue;
          const en = this.exitPoint(rb, bx + sb.x, by + sb.y, -u[0], -u[1]), vx = en.x - ex.x, vy = en.y - ex.y, len = Math.hypot(vx, vy) || 1;
          if ((vx * u[0] + vy * u[1]) / len < minCos) continue;
          let cost = len / G + (shx + shy) / G * 0.35;
          for (const [o, r] of Object.entries(st.rects)) if (o !== from) { if (this.segRect(ex.x, ex.y, en.x, en.y, r, -G * 0.1)) cost += 40; else if (this.segRect(ex.x, ex.y, en.x, en.y, r, G * 0.3)) cost += 8; }
          for (const s of st.segs) {
            if (this.segRect(s[0], s[1], s[2], s[3], rb, G * 0.15)) cost += 40; else if (this.segRect(s[0], s[1], s[2], s[3], rb, G * 0.3)) cost += 8;
            if (this.segSeg(ex.x, ex.y, en.x, en.y, s[0], s[1], s[2], s[3])) cost += 6;
          }
          const bb = { x0: Math.min(st.bb.x0, rb.x0), y0: Math.min(st.bb.y0, rb.y0), x1: Math.max(st.bb.x1, rb.x1), y1: Math.max(st.bb.y1, rb.y1) };
          cost += ((bb.x1 - bb.x0 + bb.y1 - bb.y0) - (st.bb.x1 - st.bb.x0 + st.bb.y1 - st.bb.y0)) / G * 0.12;
          next.push({ st, k, x: bx, y: by, rb, seg: [ex.x, ex.y, en.x, en.y], bb, cost: st.cost + cost });
        }
      }
      if (!next.length) {   // nowhere nice: far out past everything in its direction
        for (const st of beam) {
          const b = st.bb, bx = sx > 0 ? b.x1 + G : sx < 0 ? b.x0 - G - w : st.rects[from].x0, by = sy > 0 ? b.y1 + G : sy < 0 ? b.y0 - G - h : st.rects[from].y0;
          const rb = rect(k, bx, by), ra = st.rects[from], ex = this.exitPoint(ra, ra.x0 + sa.x, ra.y0 + sa.y, u[0], u[1]), en = this.exitPoint(rb, bx + sb.x, by + sb.y, -u[0], -u[1]);
          next.push({ st, k, x: bx, y: by, rb, seg: [ex.x, ex.y, en.x, en.y], bb: { x0: Math.min(b.x0, rb.x0), y0: Math.min(b.y0, rb.y0), x1: Math.max(b.x1, rb.x1), y1: Math.max(b.y1, rb.y1) }, cost: st.cost + 1000 });
        }
      }
      next.sort((a, b) => a.cost - b.cost);
      beam = next.slice(0, BEAM).map((n) => ({
        pos: Object.assign({}, n.st.pos, { [n.k]: [n.x, n.y] }), rects: Object.assign({}, n.st.rects, { [n.k]: n.rb }),
        segs: n.st.segs.concat([n.seg]), cost: n.cost, bb: n.bb,
      }));
    }
    const best = beam[0];
    // places no ride reaches: in a row past the right edge
    for (const k of keys) if (!best.pos[k]) { const x = best.bb.x1 + G, y = best.bb.y0; best.pos[k] = [x, y]; best.rects[k] = rect(k, x, y); best.bb.x1 = x + P[k].w; best.bb.y1 = Math.max(best.bb.y1, y + P[k].h); }
    // the result, moved so the whole thing starts at (0, 0)
    const ox = best.bb.x0, oy = best.bb.y0, lay = { sig, G, places: {}, routes: [], W: best.bb.x1 - ox, H: best.bb.y1 - oy };
    for (const k of keys) { const r = best.rects[k]; lay.places[k] = { key: k, W: P[k].W, x0: r.x0 - ox, y0: r.y0 - oy, x1: r.x1 - ox, y1: r.y1 - oy, w: P[k].w, h: P[k].h }; }
    for (const l of links) {
      const a = lay.places[l.from], b = lay.places[l.to], u = this.dirVec(l.dir), sa = local(l.from, l), sb = local(l.to, l);
      const ex = this.exitPoint(a, a.x0 + sa.x, a.y0 + sa.y, u[0], u[1]), en = this.exitPoint(b, b.x0 + sb.x, b.y0 + sb.y, -u[0], -u[1]);
      lay.routes.push({ link: l, from: l.from, to: l.to, via: l.via, dir: l.dir, u, a: ex, b: en, sa: { x: a.x0 + sa.x, y: a.y0 + sa.y, found: sa.found, path: sa.path }, sb: { x: b.x0 + sb.x, y: b.y0 + sb.y, found: sb.found, path: sb.path }, r: this.ride(l.via) });
    }
    lay.cost = best.cost;
    this._lay = lay;
    return lay;
  },
  // where a ray from (x, y) going (ux, uy) leaves the rect
  exitPoint(r, x, y, ux, uy) {
    let t = Infinity;
    if (ux > 1e-6) t = Math.min(t, (r.x1 - x) / ux); else if (ux < -1e-6) t = Math.min(t, (r.x0 - x) / ux);
    if (uy > 1e-6) t = Math.min(t, (r.y1 - y) / uy); else if (uy < -1e-6) t = Math.min(t, (r.y0 - y) / uy);
    if (!isFinite(t)) t = 0;
    return { x: x + ux * t, y: y + uy * t };
  },
  overlap(a, b, m) { return a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m; },
  // does the segment pass through the rect (grown by m)?
  segRect(x0, y0, x1, y1, r, m) {
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dy = y1 - y0, X0 = r.x0 - m, X1 = r.x1 + m, Y0 = r.y0 - m, Y1 = r.y1 + m;
    for (const [p, q] of [[-dx, x0 - X0], [dx, X1 - x0], [-dy, y0 - Y0], [dy, Y1 - y0]]) {
      if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 1e-6;
  },
  segSeg(ax, ay, bx, by, cx, cy, dx, dy) {
    const o = (px, py, qx, qy, rx, ry) => Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px));
    return o(ax, ay, bx, by, cx, cy) * o(ax, ay, bx, by, dx, dy) < 0 && o(cx, cy, dx, dy, ax, ay) * o(cx, cy, dx, dy, bx, by) < 0;
  },

  // ======================= drawing the real maps (once each, cached) =======================
  res() {
    const keys = this.places(), maxW = Math.max(...keys.map((k) => { const W = CFG.AREAS[k].WORLD; return Math.max(W.x1 - W.x0, (W.y1 - W.y0) * 0.75); }));
    return Math.min(CFG.WORLDMAP_REAL.MAX_RES, CFG.WORLDMAP_REAL.MAX_PX / maxW);
  },
  skipExt(e) { return CFG.WORLDMAP_REAL.SKIP.includes(e && e.name); },
  // borrow the renderer as if `area` were on screen (whole map, daylight), run fn, and put everything back
  withArea(area, ctx, res, fn) {
    const g = Game, R = Render, W = CFG.AREAS[area].WORLD;
    const city = typeof CityExt !== 'undefined' ? CityExt : null, atm = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt : null;
    const saved = {
      area: g.area, ctx: R.ctx, camX: R.camX, camY: R.camY, viewW: R.viewW, viewH: R.viewH, scale: R.scale, dpr: R.dpr, bgRes: R.bgRes, ext: R.ext,
      drawPlayer: Object.prototype.hasOwnProperty.call(R, 'drawPlayer') ? R.drawPlayer : undefined, snap: g.cameraSnap,
      floor: city ? city.floor : undefined, atm: atm ? { phase: atm.phase, dusk: atm.dusk, warm: atm.warm, dawnWarm: atm.dawnWarm, weather: atm.weather } : null,
    };
    try {
      g.area = area;
      if (ctx) R.ctx = ctx;
      R.camX = W.x0; R.camY = W.y0; R.viewW = W.x1 - W.x0; R.viewH = W.y1 - W.y0; R.scale = res; R.dpr = 1; R.bgRes = res;
      R.drawPlayer = () => {};                     // the chef is shown by the hat
      if (city) city.floor = null;                 // the City as seen from outside, even while the chef is up the Pizza Tower
      if (atm) { atm.phase = 'day'; atm.dusk = 0; atm.warm = 0; atm.dawnWarm = 0; atm.weather = { town: { wait: 1e9, t: -1, dur: 0 }, site: { wait: 1e9, t: -1, dur: 0 } }; }
      return fn();
    } finally {
      g.area = saved.area; R.ctx = saved.ctx; R.camX = saved.camX; R.camY = saved.camY; R.viewW = saved.viewW; R.viewH = saved.viewH;
      R.scale = saved.scale; R.dpr = saved.dpr; R.bgRes = saved.bgRes; R.ext = saved.ext; g.cameraSnap = saved.snap;
      if (saved.drawPlayer === undefined) delete R.drawPlayer; else R.drawPlayer = saved.drawPlayer;
      if (city) city.floor = saved.floor;
      if (atm && saved.atm) Object.assign(atm, saved.atm);
    }
  },
  // what decides a place's static art: the same bgKey hooks the game's own background cache uses
  keyFor(area, res) {
    const g = Game;
    return this.withArea(area, null, res, () => {
      const parts = [area, Math.round(res * 1000)];
      for (const e of Render.ext) { if (!e.bgKey) continue; try { parts.push(e.bgKey(g)); } catch (err) { parts.push('!'); } }
      if (area === 'town') {
        try { parts.push(JSON.stringify(g.s.unlocked || {}), CFG.DECOR_ITEMS.map((it) => (g.hasDecor(it.key) ? 1 : 0)).join(''), g.s.iceCream && g.s.iceCream.owned, Math.round(g.price())); } catch (err) { parts.push('?'); }
      }
      return parts.join('|');
    });
  },
  // run one drawing step on its own: a hook that throws only leaves its own bits out
  guard(ctx, fn) {
    ctx.save();
    try { fn(); } catch (e) { if (this.errors.length < 50) this.errors.push(String(e && e.message || e)); } finally { ctx.restore(); Render.ctx = ctx; }
  },
  // the extensions as Render sees them while a map is drawn here: each hook guarded, the skipped ones' moving things off
  proxies(ctx) {
    const out = [];
    for (const e of Render.ext) {
      const p = Object.create(e), skip = this.skipExt(e);
      for (const h of ['dynamic', 'overlay', 'paintTown']) {
        if (typeof e[h] !== 'function') continue;
        p[h] = (skip && h !== 'paintTown') ? () => {} : (r, g) => this.guard(ctx, () => e[h].call(e, r, g));
      }
      if (typeof e.paintAfter === 'function') p.paintAfter = (r, g, a) => this.guard(ctx, () => e.paintAfter.call(e, r, g, a));
      if (typeof e.entities === 'function') {
        p.entities = skip ? () => {} : (r, g, items) => {
          const mine = [];
          this.guard(ctx, () => e.entities.call(e, r, g, mine));
          for (const it of mine) if (it && typeof it.draw === 'function') items.push({ y: it.y, draw: () => this.guard(ctx, () => it.draw()) });
        };
      }
      out.push(p);
    }
    return out;
  },
  renderPlace(k) {
    const t0 = performance.now(), res = this.res(), W = CFG.AREAS[k].WORLD, g = Game, R = Render;
    let c = this.cache[k];
    if (!c) {
      c = this.cache[k] = { canvas: document.createElement('canvas'), key: null };
      c.canvas.addEventListener('contextlost', (e) => { e.preventDefault(); c.key = null; });
      c.canvas.addEventListener('contextrestored', () => { c.key = null; if (this.running && !this.queue.includes(k)) this.queue.push(k); });
    }
    const key = this.keyFor(k, res);
    c.canvas.width = Math.max(1, Math.ceil((W.x1 - W.x0) * res)); c.canvas.height = Math.max(1, Math.ceil((W.y1 - W.y0) * res));
    const ctx = c.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#79b85e'; ctx.fillRect(0, 0, c.canvas.width, c.canvas.height);
    ctx.setTransform(res, 0, 0, res, -W.x0 * res, -W.y0 * res);
    this.withArea(k, ctx, res, () => {
      R.ext = this.proxies(ctx);
      // the static background, as Render.ensureBackground paints it
      this.guard(ctx, () => {
        if (k === 'site') R.paintSite(g);
        else if (k === 'town') R.paintBackground(g);
        else { const e = R.ext.find((x) => x.paint && x.paint[k]); if (e) e.paint[k](R, g); }
      });
      for (const e of R.ext) if (e.paintAfter) e.paintAfter(R, g, k);
      // then the live world, as Render.draw draws it (without the pads, effects, floats, hint, HUD and screen tints)
      this.guard(ctx, () => R.drawOutsideDynamic(g));
      if (k === 'town') for (const f of ['drawDecorDynamic', 'drawKitchenDynamic', 'drawCounterDynamic', 'drawDriveThruDynamic', 'drawTablesDynamic']) this.guard(ctx, () => R[f](g));
      this.guard(ctx, () => R.drawEntities(g));
      if (k === 'town') this.guard(ctx, () => R.drawForeground(g));
      for (const e of R.ext) if (e.overlay) e.overlay(R, g);
    });
    c.key = key; c.res = res; c.w = c.canvas.width; c.h = c.canvas.height;
    this.renders++;
    const ms = performance.now() - t0; this.renderMs += ms;
    return ms;
  },
  // which places need (re)drawing: missing, or their static art changed
  refreshQueue() {
    const res = this.res(), here = this.chefPlace();
    const keys = this.places().filter((k) => { const c = this.cache[k]; if (!c || !c.key) return true; try { return c.key !== this.keyFor(k, res); } catch (e) { return true; } });
    keys.sort((a, b) => (a === here ? -1 : b === here ? 1 : 0));
    this.queue = keys;
  },
  renderAll() { this.refreshQueue(); while (this.queue.length) this.renderPlace(this.queue.shift()); },
  ready(k) { const c = this.cache[k]; return !!(c && c.key); },

  // ======================= where the chef is =======================
  chefPlace() { return typeof WorldMapExt !== 'undefined' ? WorldMapExt.here(Game) : 'town'; },
  // the chef's spot in layout coords: right where they stand outdoors, else the door of the interior they are in
  // (following interiors inside interiors out to the place), else the middle of the place
  chefSpot() {
    const g = Game, lay = this.layout(), pk = this.chefPlace(), p = lay.places[pk];
    if (!p) return null;
    const W = p.W, inW = (q) => q && q.x >= W.x0 && q.x <= W.x1 && q.y >= W.y0 && q.y <= W.y1, at = (q, how) => ({ place: pk, x: p.x0 + q.x - W.x0, y: p.y0 + q.y - W.y0, how });
    const city = typeof CityExt !== 'undefined' ? CityExt : null;
    if (g.area === pk) {
      if (city && city.floor && pk === 'city' && CFG.CITY && CFG.CITY.TOWER && inW(CFG.CITY.TOWER.door)) return at(CFG.CITY.TOWER.door, 'door');
      if (inW(g.player)) return at(g.player, 'chef');
    } else if (typeof WorldMapExt !== 'undefined') {
      const idx = WorldMapExt.cfgIndex();
      let a = g.area;
      for (let i = 0; i < 6 && a && a !== pk; i++) {
        const d = WorldMapExt.doorSpots(a, idx).find(inW);
        if (d) return at(d, 'door');
        const A = CFG.AREAS[a];
        a = (A && A.place && CFG.AREAS[A.place]) ? A.place : WorldMapExt.doorParent(a, idx);
      }
    }
    return { place: pk, x: (p.x0 + p.x1) / 2, y: (p.y0 + p.y1) / 2, how: 'centre' };
  },

  // ======================= DOM: the tabs, the canvas, the zoom buttons =======================
  buildDom() {
    if (this.dom || typeof document === 'undefined' || typeof WorldMapExt === 'undefined' || !WorldMapExt.dom) return;
    const M = WorldMapExt.dom.modal, body = M.querySelector('.wm-body'), card = M.querySelector('.wm-card');
    if (!body || !card) return;
    const style = document.createElement('style');
    style.textContent = `
      .wmr-tabs { display: flex; gap: 8px; padding: 8px 8px 0; background: var(--panel, #fff8ee); }
      .wmr-tab { flex: 1; border: 0; border-radius: 14px; padding: 10px 8px; font: inherit; font-weight: 900; font-size: 18px; cursor: pointer;
        background: #f3e3c8; color: #5a3d22; box-shadow: 0 3px 0 #d8bf95; -webkit-tap-highlight-color: transparent; }
      .wmr-tab.on { background: var(--gold, #f2b134); color: var(--ink, #2b1d14); box-shadow: 0 3px 0 #b8801a; }
      .wmr-tab:active { transform: translateY(2px); box-shadow: none; }
      .wmr-wrap { position: relative; flex: 1; min-width: 0; min-height: 0; display: flex; }
      .wmr-wrap.hidden, .wm-canvas.hidden { display: none; }
      .wmr-canvas { flex: 1; width: 100%; height: 100%; min-width: 0; min-height: 0; display: block; border-radius: 14px; touch-action: none; cursor: grab; -webkit-tap-highlight-color: transparent; }
      .wmr-canvas.grabbing { cursor: grabbing; }
      .wmr-zoom { position: absolute; right: 10px; bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
      .wmr-zoom button { width: 54px; height: 54px; border-radius: 50%; border: 3px solid #fff; background: var(--gold, #f2b134); color: var(--ink, #2b1d14);
        font-size: 26px; line-height: 1; padding: 0; cursor: pointer; box-shadow: 0 3px 0 #b8801a, 0 4px 10px rgba(0,0,0,0.25); font-weight: 900; -webkit-tap-highlight-color: transparent; }
      .wmr-zoom button:active { transform: translateY(2px); box-shadow: 0 1px 0 #b8801a; }
      @media (max-width: 700px), (max-height: 520px) { .wmr-tabs { padding: 6px 6px 0; gap: 6px; } .wmr-tab { font-size: 17px; padding: 11px 6px; } .wmr-canvas { border-radius: 10px; } .wmr-zoom { right: 8px; bottom: 8px; } }
    `;
    document.head.appendChild(style);
    const tabs = document.createElement('div');
    tabs.className = 'wmr-tabs';
    tabs.innerHTML = '<button type="button" class="wmr-tab" data-view="picture" aria-label="Picture map">🫧 Picture map</button><button type="button" class="wmr-tab" data-view="real" aria-label="Real map">🛰️ Real map</button>';
    card.insertBefore(tabs, body);
    const wrap = document.createElement('div');
    wrap.className = 'wmr-wrap hidden';
    wrap.innerHTML = '<canvas class="wmr-canvas" aria-label="The real maps of every place, joined by their rides"></canvas><div class="wmr-zoom"><button type="button" data-z="in" aria-label="Zoom in">➕</button><button type="button" data-z="out" aria-label="Zoom out">➖</button><button type="button" data-z="fit" aria-label="See the whole world">🌍</button></div>';
    body.appendChild(wrap);
    this.dom = { modal: M, tabs, wrap, canvas: wrap.querySelector('canvas'), story: WorldMapExt.dom.canvas, btns: tabs.querySelectorAll('.wmr-tab') };
    tabs.addEventListener('click', (e) => { const b = e.target.closest('.wmr-tab'); if (b) { this.setMode(b.dataset.view, true); } });
    wrap.querySelector('.wmr-zoom').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      this.touched = true;
      if (b.dataset.z === 'fit') this.animateTo(this.fitView()); else this.zoomAt(b.dataset.z === 'in' ? 1.6 : 1 / 1.6, null, true);
      try { Haptics.tap(); } catch (err) { /* optional */ }
    });
    const cv = this.dom.canvas;
    cv.addEventListener('pointerdown', (e) => this.onDown(e));
    cv.addEventListener('pointermove', (e) => this.onMove(e));
    cv.addEventListener('pointerup', (e) => this.onUp(e));
    cv.addEventListener('pointercancel', (e) => this.onUp(e, true));
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.touched = true; const p = this.local(e); this.zoomAt(Math.exp(-U.clamp(e.deltaY, -200, 200) * 0.0022), p, false); }, { passive: false });
    try { const m = localStorage.getItem(CFG.WORLDMAP_REAL.STORE_KEY); if (m === 'real' || m === 'picture') this.mode = m; } catch (e) { /* private mode */ }
    this.applyMode();
    // the world map's own open() also shows this view when it was the last one picked
    const open = WorldMapExt.open;
    WorldMapExt.open = function () { const r = open.apply(this, arguments); WorldMapReal.onOpen(); return r; };
  },
  isOpen() { return typeof WorldMapExt !== 'undefined' && WorldMapExt.isOpen() && this.dom && !this.dom.modal.classList.contains('hidden'); },
  applyMode() {
    if (!this.dom) return;
    const real = this.mode === 'real';
    this.dom.wrap.classList.toggle('hidden', !real);
    this.dom.story.classList.toggle('hidden', real);
    this.dom.btns.forEach((b) => { const on = b.dataset.view === this.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  },
  setMode(m, byTap) {
    if (m !== 'real' && m !== 'picture') return;
    const changed = m !== this.mode;
    this.mode = m;
    try { localStorage.setItem(CFG.WORLDMAP_REAL.STORE_KEY, m); } catch (e) { /* private mode */ }
    this.applyMode();
    if (byTap && changed) { try { Sfx.pickup(); Haptics.tap(); } catch (e) { /* optional */ } }
    if (!this.isOpen()) return;
    if (m === 'real') { WorldMapExt.stop(); this.start(); } else { this.stop(); WorldMapExt.lay = null; WorldMapExt.start(); }
  },
  onOpen() {
    this.applyMode();
    if (this.mode !== 'real') return;
    WorldMapExt.stop();
    this.start();
  },
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now(); this.view = null; this.anim = null; this.touched = false;
    this.ptrs.clear(); this.drag = null; this.pinch = null;
    this.refreshQueue();
    const frame = (now) => {
      if (!this.isOpen() || this.mode !== 'real') { this.stop(); return; }
      const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000)); this.last = now;
      this.t += dt; this.frames++;
      // draw a place or two (never in the very first frame, so the placeholders show at once)
      if (this.queue.length && this.frames > 1) { const s = performance.now(); do { this.renderPlace(this.queue.shift()); } while (this.queue.length && performance.now() - s < 12); }
      this.draw(dt);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  },
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null; this.running = false; this.drag = null; this.pinch = null; this.ptrs.clear();
    if (this.dom) this.dom.canvas.classList.remove('grabbing');
  },

  // ======================= the view: pan, zoom, fit =======================
  fitCanvas() {
    const c = this.dom.canvas, W = Math.max(1, c.clientWidth), H = Math.max(1, c.clientHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1), bw = Math.round(W * dpr), bh = Math.round(H * dpr);
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    const changed = !this.size || this.size.W !== W || this.size.H !== H;
    this.size = { W, H, dpr };
    if (!this.view || (changed && !this.touched)) this.view = this.fitView();
    return this.size;
  },
  // the view that shows a layout rect (the whole world by default) as big as fits, with room for the labels
  fitView(r) {
    const lay = this.layout(), S = this.size || { W: 800, H: 600 };
    r = r || { x0: 0, y0: 0, x1: lay.W, y1: lay.H };
    const pad = r.x1 - r.x0 < lay.W ? 18 : 14, top = 34;
    const s = Math.min((S.W - pad * 2) / (r.x1 - r.x0), (S.H - pad - top) / (r.y1 - r.y0));
    return { s, x: (r.x0 + r.x1) / 2 - S.W / 2 / s, y: (r.y0 + r.y1) / 2 - (S.H + top - pad) / 2 / s };
  },
  limits() { const f = this.fitView().s; return { min: f * 0.6, max: Math.max(f * 2, this.res() * 2.6) }; },
  clampView(v) {
    const lay = this.layout(), S = this.size, L = this.limits();
    v.s = U.clamp(v.s, L.min, L.max);
    // the middle of the screen stays over the world
    const cx = U.clamp(v.x + S.W / 2 / v.s, 0, lay.W), cy = U.clamp(v.y + S.H / 2 / v.s, 0, lay.H);
    v.x = cx - S.W / 2 / v.s; v.y = cy - S.H / 2 / v.s;
    return v;
  },
  local(e) { const r = this.dom.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; },
  toLayout(p) { const v = this.view; return { x: v.x + p.x / v.s, y: v.y + p.y / v.s }; },
  zoomAt(k, p, animate) {
    if (!this.view || !this.size) return;
    const S = this.size; p = p || { x: S.W / 2, y: S.H / 2 };
    const v = this.anim ? this.anim.to : this.view, w = { x: v.x + p.x / v.s, y: v.y + p.y / v.s };
    const L = this.limits(), s = U.clamp(v.s * k, L.min, L.max);
    const to = this.clampView({ s, x: w.x - p.x / s, y: w.y - p.y / s });
    if (animate) this.animateTo(to); else { this.anim = null; this.view = to; }
  },
  animateTo(to, dur = 0.45) { if (this.view) this.anim = { from: Object.assign({}, this.view), to: this.clampView(Object.assign({}, to)), t: 0, dur }; },
  stepAnim(dt) {
    const a = this.anim; if (!a) return;
    a.t += dt;
    const k = U.easeOut(Math.min(1, a.t / a.dur)), S = this.size;
    const s = a.from.s * Math.pow(a.to.s / a.from.s, k);
    const c0 = { x: a.from.x + S.W / 2 / a.from.s, y: a.from.y + S.H / 2 / a.from.s }, c1 = { x: a.to.x + S.W / 2 / a.to.s, y: a.to.y + S.H / 2 / a.to.s };
    const cx = c0.x + (c1.x - c0.x) * k, cy = c0.y + (c1.y - c0.y) * k;
    this.view = { s, x: cx - S.W / 2 / s, y: cy - S.H / 2 / s };
    if (a.t >= a.dur) { this.view = Object.assign({}, a.to); this.anim = null; }
  },
  placeAt(p) {
    const lay = this.layout(), q = this.toLayout(p);
    for (const k of Object.keys(lay.places)) { const r = lay.places[k]; if (q.x >= r.x0 && q.x <= r.x1 && q.y >= r.y0 && q.y <= r.y1) return k; }
    return null;
  },
  // tap a map: zoom right into it; tap it again (or the sea around it) to see everything
  tap(p) {
    const k = this.placeAt(p);
    this.touched = true;
    if (!k) { this.animateTo(this.fitView()); return; }
    const r = this.layout().places[k], to = this.fitView(r), v = this.view;
    const zoomedIn = v.s >= to.s * 0.85 && Math.abs((v.x + this.size.W / 2 / v.s) - (r.x0 + r.x1) / 2) < (r.x1 - r.x0) * 0.3 && Math.abs((v.y + this.size.H / 2 / v.s) - (r.y0 + r.y1) / 2) < (r.y1 - r.y0) * 0.3;
    this.animateTo(zoomedIn ? this.fitView() : to);
    this.tapped = { k, t: 0 };
    try { Sfx.pickup(); Haptics.tap(); } catch (e) { /* optional */ }
  },
  onDown(e) {
    if (!this.view) return;
    e.preventDefault();
    try { this.dom.canvas.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
    const p = this.local(e);
    this.ptrs.set(e.pointerId, p);
    this.anim = null;
    if (this.ptrs.size === 1) { this.drag = { id: e.pointerId, x: p.x, y: p.y, v: Object.assign({}, this.view), moved: false }; this.dom.canvas.classList.add('grabbing'); }
    else if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      this.pinch = { d: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), s: this.view.s, w: this.toLayout(mid) };
      if (this.drag) this.drag.moved = true;
    }
  },
  onMove(e) {
    if (!this.ptrs.has(e.pointerId) || !this.view) return;
    const p = this.local(e);
    this.ptrs.set(e.pointerId, p);
    if (this.pinch && this.ptrs.size >= 2) {
      const [a, b] = [...this.ptrs.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, d = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
      const L = this.limits(), s = U.clamp(this.pinch.s * d / this.pinch.d, L.min, L.max);
      this.view = this.clampView({ s, x: this.pinch.w.x - mid.x / s, y: this.pinch.w.y - mid.y / s });
      this.touched = true;
    } else if (this.drag && this.drag.id === e.pointerId) {
      const dx = p.x - this.drag.x, dy = p.y - this.drag.y;
      if (!this.drag.moved && Math.hypot(dx, dy) > 8) this.drag.moved = true;
      if (this.drag.moved) { const v = this.drag.v; this.view = this.clampView({ s: v.s, x: v.x - dx / v.s, y: v.y - dy / v.s }); this.touched = true; }
    }
  },
  onUp(e, cancel) {
    if (!this.ptrs.has(e.pointerId)) return;
    const p = this.local(e);
    this.ptrs.delete(e.pointerId);
    try { this.dom.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* fine */ }
    if (this.ptrs.size < 2) this.pinch = null;
    if (this.drag && this.drag.id === e.pointerId) {
      if (!this.drag.moved && !cancel) this.tap(p);
      this.drag = null;
    }
    // one finger left after a pinch carries on panning from where it is
    if (this.ptrs.size === 1 && !this.drag) { const [id, q] = [...this.ptrs.entries()][0]; this.drag = { id, x: q.x, y: q.y, v: Object.assign({}, this.view), moved: true }; }
    if (!this.ptrs.size) this.dom.canvas.classList.remove('grabbing');
  },

  // ======================= drawing a frame (cached pictures only) =======================
  draw(dt = 0) {
    if (!this.dom) return;
    const S = this.fitCanvas(), ctx = this.dom.canvas.getContext('2d'), lay = this.layout(), t = this.t;
    this.stepAnim(dt);
    if (this.tapped) { this.tapped.t += dt; if (this.tapped.t > 1) this.tapped = null; }
    const v = this.view, X = (x) => (x - v.x) * v.s, Y = (y) => (y - v.y) * v.s;
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    // the sea of paper the maps sit on
    ctx.fillStyle = '#bfe4f6'; ctx.fillRect(0, 0, S.W, S.H);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    const dot = 46, ox = ((-v.x * v.s) % dot + dot) % dot, oy = ((-v.y * v.s) % dot + dot) % dot;
    for (let y = oy - dot; y < S.H + dot; y += dot) for (let x = ox - dot + ((Math.round((y - oy) / dot) % 2) ? dot / 2 : 0); x < S.W + dot; x += dot) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }
    const vis = (r, m = 0) => X(r.x1) > -m && X(r.x0) < S.W + m && Y(r.y1) > -m && Y(r.y0) < S.H + m;
    const here = this.chefPlace();
    // the maps
    for (const k of Object.keys(lay.places)) {
      const r = lay.places[k]; if (!vis(r, 20)) continue;
      const x = X(r.x0), y = Y(r.y0), w = (r.x1 - r.x0) * v.s, h = (r.y1 - r.y0) * v.s, c = this.cache[k];
      ctx.fillStyle = 'rgba(30,60,90,0.25)'; ctx.fillRect(x + 5, y + 7, w, h);
      if (c && c.key) ctx.drawImage(c.canvas, x, y, w, h);
      else this.drawPlaceholder(ctx, k, x, y, w, h, t);
      ctx.lineWidth = k === here ? 4 : 3; ctx.strokeStyle = k === here ? '#e4572e' : '#ffffff'; ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      if (this.tapped && this.tapped.k === k) { const a = Math.max(0, 1 - this.tapped.t); ctx.strokeStyle = `rgba(242,177,52,${a.toFixed(3)})`; ctx.lineWidth = 6; ctx.strokeRect(x - 4 - (1 - a) * 8, y - 4 - (1 - a) * 8, w + 8 + (1 - a) * 16, h + 8 + (1 - a) * 16); }
    }
    // the rides: their lines, the spots they leave from, and the vehicles going back and forth
    const lw = U.clamp(v.s * 55, 5, 16), es = U.clamp(v.s * 230, 22, 44);
    for (const rt of lay.routes) this.drawRoute(ctx, X(rt.a.x), Y(rt.a.y), X(rt.b.x), Y(rt.b.y), rt.r, lw);
    if (v.s >= 0.045) this.drawSpots(ctx, lay, X, Y, es * 0.8);
    const cs = this.chefSpot(), hx = cs ? X(cs.x) : 0, hy = cs ? Y(cs.y) : 0;
    lay.routes.forEach((rt, i) => this.drawVehicle(ctx, rt, X(rt.a.x), Y(rt.a.y), X(rt.b.x), Y(rt.b.y), es, t, i));
    this.drawLabels(ctx, lay, X, Y, S, here, cs ? { x0: hx - 26, y0: hy - 78, x1: hx + 26, y1: hy + 8 } : null);
    // the chef
    if (cs) this.drawChef(ctx, hx, hy, t);
    // still drawing some maps
    if (this.queue.length || Object.keys(lay.places).some((k) => !this.ready(k))) this.drawBusy(ctx, S, t);
  },
  drawPlaceholder(ctx, k, x, y, w, h, t) {
    const P = this.info(k);
    ctx.fillStyle = P.col || '#ffe8c2'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 6; i++) ctx.fillRect(x, y + h * (i + 0.5) / 6, w, Math.max(1, h * 0.02));
    const s = Math.min(w, h) * 0.32, bob = Math.sin(t * 3) * s * 0.05;
    this.emoji(ctx, P.ico, x + w / 2, y + h / 2 + bob, s);
    this.emoji(ctx, '🖍️', x + w / 2 + s * 0.75, y + h / 2 + s * 0.45 + Math.sin(t * 8) * s * 0.06, s * 0.45);
  },
  drawBusy(ctx, S, t) {
    const txt = '🖍️ Drawing the map…', fs = 16;
    ctx.font = this.font(fs); const w = ctx.measureText(txt).width + 30, x = S.W / 2 - w / 2, y = 10 + Math.sin(t * 4) * 2;
    ctx.fillStyle = 'rgba(43,29,20,0.82)'; U.roundRect(ctx, x, y, w, 32, 16); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, S.W / 2, y + 17);
  },
  // each map's name tag (its picture and name, or just the picture when the map is small on screen), on its top edge, or
  // its bottom edge when that spot is taken (by the chef's hat or another tag), or left out when there is no room at all
  drawLabels(ctx, lay, X, Y, S, here, hat) {
    const taken = hat ? [hat] : [], hit = (b) => taken.some((q) => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
    const keys = Object.keys(lay.places).sort((a, b) => (a === here ? -1 : b === here ? 1 : 0));
    for (const k of keys) {
      const r = lay.places[k], x = X(r.x0), y = Y(r.y0), w = X(r.x1) - x, h = Y(r.y1) - y;
      if (x + w < -150 || x > S.W + 150 || y + h < -60 || y > S.H + 60) continue;
      const P = this.info(k);
      let fs = Math.round(U.clamp(w * 0.07, 13, 22)), txt = null;
      for (const name of [P.name || k, P.short]) {
        if (!name) continue;
        ctx.font = this.font(fs, 900);
        if (w >= 90 && ctx.measureText(`${P.ico} ${name}`).width + 22 <= Math.max(w * 1.25, 130)) { txt = `${P.ico} ${name}`; break; }
      }
      if (!txt) { txt = P.ico; fs = Math.round(U.clamp(w * 0.18, 16, 24)); }
      ctx.font = this.font(fs, 900);
      // centred on its map, slid along to stay on the screen while its map is (never away from its map)
      const pw = ctx.measureText(txt).width + 22, ph = fs + 14, lo = Math.max(4, x), hi = Math.min(S.W - pw - 4, x + w - pw);
      const px = lo <= hi ? U.clamp(x + w / 2 - pw / 2, lo, hi) : x + w > 0 && x < S.W ? U.clamp(x + w / 2 - pw / 2, 4, S.W - pw - 4) : x + w / 2 - pw / 2;
      let box = null;
      for (const top of [true, false]) {
        let py = top ? y - ph * 0.55 : y + h - ph * 0.45;
        if (top && py < 4 && y + h > ph * 3) py = Math.min(4, y + h - ph * 2);   // a map running off the top keeps its tag in view
        const b = { x0: px - 2, y0: py - 2, x1: px + pw + 2, y1: py + ph + 2 };
        if (!hit(b)) { box = b; break; }
      }
      if (!box) continue;
      taken.push(box);
      const by = box.y0 + 2, mine = k === here;
      ctx.fillStyle = 'rgba(43,29,20,0.22)'; U.roundRect(ctx, px + 1, by + 3, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = mine ? '#e4572e' : '#fff8ee'; U.roundRect(ctx, px, by, pw, ph, ph / 2); ctx.fill();
      ctx.strokeStyle = mine ? '#b8401c' : '#e9c48a'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = mine ? '#ffffff' : '#2b1d14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, px + pw / 2, by + ph / 2 + 1);
    }
    return taken;
  },
  // a ride's line, styled by its kind (the same styles as the picture map), in screen px
  drawRoute(ctx, ax, ay, bx, by, r, lw) {
    const s = r.style, len = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / len, ny = (bx - ax) / len;
    const line = (w, col, dash) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (s === 'road') { line(lw * 1.5 + 4, 'rgba(255,255,255,0.9)'); line(lw * 1.5, '#5e6068'); line(Math.max(2, lw * 0.18), '#ffd84a', [lw * 0.9, lw * 0.9]); }
    else if (s === 'rail') {
      line(lw * 1.6 + 4, 'rgba(255,255,255,0.85)');
      ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = Math.max(2, lw * 0.3); ctx.lineCap = 'butt';
      const step = Math.max(7, lw * 0.9);
      for (let d = step / 2; d < len; d += step) { const x = ax + (bx - ax) * d / len, y = ay + (by - ay) * d / len; ctx.beginPath(); ctx.moveTo(x - nx * lw * 0.75, y - ny * lw * 0.75); ctx.lineTo(x + nx * lw * 0.75, y + ny * lw * 0.75); ctx.stroke(); }
      ctx.strokeStyle = '#55555f'; ctx.lineWidth = Math.max(1.5, lw * 0.18);
      for (const o of [-0.42, 0.42]) { ctx.beginPath(); ctx.moveTo(ax + nx * lw * o, ay + ny * lw * o); ctx.lineTo(bx + nx * lw * o, by + ny * lw * o); ctx.stroke(); }
    } else if (s === 'cable') {
      line(Math.max(3, lw * 0.35) + 3, 'rgba(255,255,255,0.85)'); line(Math.max(3, lw * 0.35), '#3d3d48');
      ctx.fillStyle = '#8d5a2b';
      for (const u of [0.3, 0.7]) { const x = ax + (bx - ax) * u, y = ay + (by - ay) * u; ctx.fillRect(x - lw * 0.35, y - lw * 0.35, lw * 0.7, lw * 0.7); }
    } else {
      const col = r.col || { tunnel: '#7a52c7', water: '#ffffff', space: '#ffd84a', air: '#ffffff' }[s] || '#ffffff';
      const halo = { water: 'rgba(40,140,210,0.55)', space: 'rgba(30,26,80,0.75)', air: 'rgba(80,140,200,0.45)', tunnel: col + '66' }[s] || 'rgba(0,0,0,0.25)';
      line(lw * 1.5, halo); line(Math.max(3, lw * 0.45), col, [1, lw * 1.1]);
    }
    ctx.restore();
  },
  // a ride's vehicle, going gently back and forth along its line (rockets and planes go one way and loop)
  drawVehicle(ctx, rt, ax, ay, bx, by, size, t, i) {
    const r = rt.r, sp = 0.3 + (i % 4) * 0.04;
    let u, dir = 1, fade = 1;
    if (r.loop) { const k = (t * sp * 0.45 + i * 0.37) % 1; u = 0.12 + 0.76 * k; fade = Math.min(1, k * 6, (1 - k) * 6); }
    else { const ph = t * sp + i * 1.3; u = 0.2 + 0.6 * (0.5 - 0.5 * Math.cos(ph)); dir = Math.sin(ph) >= 0 ? 1 : -1; }
    const x = ax + (bx - ax) * u, y = ay + (by - ay) * u, bob = r.style === 'water' ? Math.sin(t * 3) * 2.5 : Math.sin(t * 6) * 1;
    ctx.save(); ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + bob, size * 0.64, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.translate(x, y + bob);
    if (!r.loop && (bx - ax) * dir > 0 && r.style !== 'cable' && r.style !== 'tunnel') ctx.scale(-1, 1);   // the emoji face left: flip it going right
    this.emoji(ctx, r.ico, 0, 0, size * 0.82);
    ctx.restore();
  },
  // a little badge with the vehicle where each ride really leaves from (side by side where two share a spot)
  drawSpots(ctx, lay, X, Y, size) {
    const list = [];
    for (const rt of lay.routes) for (const s of [rt.sa, rt.sb]) if (s.found) list.push({ x: X(s.x), y: Y(s.y), ico: rt.r.ico });
    const groups = [];
    for (const p of list) { const g = groups.find((q) => Math.hypot(q[0].x - p.x, q[0].y - p.y) < size * 0.6); if (g) g.push(p); else groups.push([p]); }
    for (const g of groups) g.forEach((p, i) => {
      const x = p.x + (i - (g.length - 1) / 2) * size * 1.15, y = p.y;
      if (x < -size || x > this.size.W + size || y < -size || y > this.size.H + size) return;
      ctx.fillStyle = 'rgba(43,29,20,0.25)'; ctx.beginPath(); ctx.arc(x + 1, y + 2, size * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, size * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      this.emoji(ctx, p.ico, x, y, size * 0.72);
    });
  },
  drawChef(ctx, x, y, t) {
    const k = (t % 1.4) / 1.4;
    ctx.strokeStyle = `rgba(228,87,46,${(0.75 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, 10 + k * 26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    if (typeof WorldMapExt !== 'undefined' && WorldMapExt.drawHat) WorldMapExt.drawHat(ctx, { R: 46 }, { x, y: y + 46 - 4 }, t);
  },
  emoji(ctx, ch, x, y, size) {
    ctx.font = `${Math.round(size)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + size * 0.06);
  },
  font(px, w = 800) { return `${w} ${px}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"`; },
};

if (typeof document !== 'undefined') {
  if (typeof WorldMapExt !== 'undefined' && WorldMapExt.dom) WorldMapReal.buildDom();
  else window.addEventListener('DOMContentLoaded', () => WorldMapReal.buildDom());
}
