'use strict';
// World map: a big '🗺️ World map' button at the front of the help panel's button row opens a storybook map of every
// place in the game. It is NOT a plot of map coordinates (the maps sit far apart in one coordinate space): each place
// is a round, picture-book bubble with an emoji and a short name, little dotted paths join the places that are
// connected, and the vehicle that makes each trip (🚂 🚌 ⛴️ ✈️ 🚡 🚇 🚀) rides gently back and forth along its path.
// A bouncing chef hat marks where the chef is now (interiors count as their outer place: a City shop is the City).
// Tapping a place bounces it and pops up a speech bubble with its name and how to get there. No fast travel.
// Each place also shows how many of its Pizza Coins have been found. Places never visited get a "?" and a sparkle.
// The map draws into its own canvas with its own requestAnimationFrame loop, which runs only while the map is open.
// Opening it, like any modal, only turns the game's input off (UI.show); the town keeps simulating behind it.
// Extension module: Game.ext.push (it only remembers which places the chef has been to). See js/EXTENSIONS.md.

CFG.WORLDMAP = {
  // the places on the map: picture, name, colour, how to get there, and the little sub-places drawn beside them
  PLACES: {
    town: {
      ico: '🍕', name: 'Home Town', col: '#ffd6a0', how: '🏡 Home! Your pizzeria is here.',
      subs: [['🐄', 'Farm', 'The farm and the barn'], ['🚒', 'Fire Station', 'The fire station'], ['🌲', 'Woods', 'The secret woods and the cabin']],
    },
    site: {
      ico: '🏗️', name: 'Construction Town', short: 'Construction', col: '#ffe08a', how: '🚂 Take the train from the station by the farm',
      subs: [['⛏️', 'Pizza Mine', 'The Pizza Mine'], ['🥞', 'Diner', 'The diner'], ['🔧', 'Hardware', 'The hardware store']],
    },
    snow: {
      ico: '⛷️', name: 'Snowy Peak', col: '#e3f4ff', how: '🚡 Ride the ski lift by the Pizza Mine',
      subs: [['🛷', 'Sledding', 'The sledding hill'], ['☕', 'Cocoa Cabin', 'The Cocoa Cabin']],
    },
    city: {
      ico: '🏙️', name: 'The City', col: '#d7d2ff', how: '🚌 Take the bus from Main Street',
      subs: [['🛍️', 'Shops', 'Lots of shops to go inside'], ['🌭', 'Hot dogs', 'The hot dog cart in Pizza Square']],
    },
    campus: {
      ico: '🎓', name: 'Columbia', col: '#cfe3ff', how: '🚇 Ride the subway from the City',
      subs: [['🏛️', 'Library', 'Low Library'], ['🐻', 'Barnard', 'Barnard Hall']],
    },
    islands: {
      ico: '🏝️', name: 'The Islands', col: '#c9f3e8', how: '⛴️ Take the ferry from the dock by River House',
      subs: [['🏖️', 'Sunny Beach', 'Sunny Beach'], ['🗼', 'Lighthouse', 'The Lighthouse'], ['⭐', 'Starfish Cove', 'Starfish Cove']],
    },
    moon: {
      ico: '🌕', name: 'Pizza Moon', col: '#3d3f78', dark: true, how: '🚀 Fly the rocket from Rocket Island',
      subs: [['👽', 'Alien', 'The friendly alien']],
    },
    cloud: {
      ico: '☁️', name: 'Cloud Harbor', col: '#ffffff', how: '✈️ Hop in a plane at the airfield',
      subs: [['🎈', 'Balloons', 'Hot-air balloon rides'], ['🧁', 'Sky Café', 'The Sky Café']],
    },
  },
  // every map (CFG.AREAS key) belongs to one place; a new map may also say `CFG.AREAS.x.place = 'city'` itself
  AREA_PLACE: {
    town: 'town', upstairs: 'town', pizzarain: 'town', barn: 'town', firestation: 'town', cabin: 'town',
    jetcabin: 'town', afterminal: 'town', afhangar: 'town', aftower: 'town', afworkshop: 'town',
    site: 'site', mines: 'site', diner: 'site', hardware: 'site',
    snow: 'snow', cocoacabin: 'snow',
    city: 'city', subway: 'city', barber: 'city', toyshop: 'city', petshop: 'city', bakery: 'city', hotel: 'city', arcade: 'city',
    candy: 'city', books: 'city', catcafe: 'city', gym: 'city', flowers: 'city', music: 'city', cinema: 'city', post: 'city',
    grocery: 'city', school: 'city', bank: 'city', cafe: 'city', aquarium: 'city', firedept: 'city',
    campus: 'campus', lowlibrary: 'campus', barnardhall: 'campus',
    islands: 'islands', lighthouse: 'islands', crabshack: 'islands', coconuthut: 'islands', missionctl: 'islands', beachhut: 'islands', rocketinside: 'islands',
    moon: 'moon',
    cloud: 'cloud', skycafe: 'cloud',
  },
  // how the places are joined (every Game.startTravel in js/): the path style and the vehicle riding it
  ROUTES: [
    { a: 'town', b: 'site', via: 'train', ico: '🚂', style: 'rail', loop: false },
    { a: 'site', b: 'snow', via: 'skilift', ico: '🚡', style: 'cable', loop: false },
    { a: 'town', b: 'city', via: 'bus', ico: '🚌', style: 'road', loop: false },
    { a: 'city', b: 'campus', via: 'subway', ico: '🚇', style: 'tunnel', loop: false },
    { a: 'town', b: 'islands', via: 'ferry', ico: '⛴️', style: 'water', loop: false },
    { a: 'islands', b: 'moon', via: 'rocket', ico: '🚀', style: 'space', loop: true },
    { a: 'town', b: 'cloud', via: 'flight', ico: '✈️', style: 'air', loop: true },
  ],
  // two hand-made layouts (fractions of the canvas): a wide one for desktops and tablets, a tall one for phones
  LAYOUTS: {
    wide: {
      pos: { town: [0.42, 0.55], site: [0.15, 0.56], snow: [0.135, 0.2], cloud: [0.405, 0.2], campus: [0.655, 0.21], city: [0.665, 0.53], islands: [0.765, 0.79], moon: [0.915, 0.21] },
      bend: { 'town-site': 0.06, 'site-snow': 0.0, 'town-city': -0.08, 'city-campus': 0.1, 'town-islands': 0.2, 'islands-moon': 0.2, 'town-cloud': 0.12 },
      horizon: 0.34, sea: [-0.05, 0.75, 1.05, 1.1], space: [0.82, -0.05, 1.05, 0.38],
      mountains: [[0.03, 0.12, 0.13], [0.15, 0.06, 0.16], [0.27, 0.16, 0.11]], hill: [0.655, 0.26, 0.13],
      decor: [['🐳', 0.12, 0.89, 1.0], ['⛵', 0.52, 0.9, 0.8], ['🌳', 0.28, 0.44, 0.75], ['🌳', 0.545, 0.62, 0.7], ['🌻', 0.04, 0.68, 0.55], ['🐟', 0.64, 0.95, 0.55], ['🎈', 0.54, 0.09, 0.7]],
    },
    tall: {
      pos: { moon: [0.19, 0.115], cloud: [0.5, 0.125], snow: [0.81, 0.135], site: [0.79, 0.335], town: [0.43, 0.5], city: [0.79, 0.565], campus: [0.74, 0.8], islands: [0.25, 0.84] },
      bend: { 'town-site': 0.08, 'site-snow': 0.0, 'town-city': -0.1, 'city-campus': 0.1, 'town-islands': -0.14, 'islands-moon': -0.07, 'town-cloud': -0.1 },
      horizon: 0.245, sea: [-0.05, 0.69, 0.56, 1.1], space: [-0.05, -0.05, 0.36, 0.225],
      mountains: [[0.68, 0.1, 0.14], [0.84, 0.04, 0.18], [0.98, 0.11, 0.12]], hill: null,
      decor: [['🌳', 0.17, 0.42, 0.7], ['🌻', 0.12, 0.6, 0.55], ['🐳', 0.42, 0.93, 0.85], ['⛵', 0.1, 0.75, 0.7], ['🌳', 0.94, 0.68, 0.6], ['🎈', 0.66, 0.035, 0.6]],
    },
  },
};

const WorldMapExt = {
  name: 'worldmap',
  defaults: { worldmap: { seen: { town: true } } },
  dom: null, raf: null, running: false, frames: 0, t: 0, last: 0,
  sel: null,       // { kind: 'place' | 'sub', key, i, t } : the thing tapped last, with its speech bubble
  lay: null,       // the computed layout for the canvas's current size (positions in CSS px)

  // ---------- which place is a map in ----------
  placeOf(area) {
    const t = CFG.WORLDMAP.AREA_PLACE;
    if (t[area]) return t[area];
    const A = CFG.AREAS && CFG.AREAS[area];
    if (A && A.place && CFG.WORLDMAP.PLACES[A.place]) return A.place;
    return null;
  },
  unmapped() { return Object.keys(CFG.AREAS).filter((k) => !this.placeOf(k)); },
  here(g) { return this.placeOf(g.area) || 'town'; },
  seenState(g) {
    if (!g.s.worldmap || typeof g.s.worldmap !== 'object') g.s.worldmap = { seen: { town: true } };
    if (!g.s.worldmap.seen || typeof g.s.worldmap.seen !== 'object') g.s.worldmap.seen = { town: true };
    return g.s.worldmap.seen;
  },
  // been there: remembered here, or the Pizza Coins hunt saw one of its maps
  visited(g, place) {
    if (place === 'town' || this.seenState(g)[place]) return true;
    const pc = g.s.pizzacoins && g.s.pizzacoins.seen;
    if (pc) for (const a of Object.keys(pc)) if (pc[a] && this.placeOf(a) === place) return true;
    return false;
  },
  // Pizza Coins found / hidden per place (every coin's map mapped with the same table)
  coins(g) {
    const out = {}, P = CFG.PIZZACOINS, got = (g.s.pizzacoins && g.s.pizzacoins.got) || {};
    if (!P || !P.SPOTS) return out;
    for (const s of P.SPOTS) { const pl = this.placeOf(s.area); if (!pl) continue; const o = out[pl] || (out[pl] = { n: 0, got: 0 }); o.n++; if (got[s.id]) o.got++; }
    return out;
  },

  // ---------- game hook: remember the places the chef has been ----------
  update(g) {
    if (g.travel) return;
    const pl = this.placeOf(g.area);
    if (pl) { const seen = this.seenState(g); if (!seen[pl]) seen[pl] = true; }
  },
  home() {},

  // ======================= DOM: the help button and the modal =======================
  buildDom() {
    if (this.dom || typeof document === 'undefined' || !document.body) return;
    const help = document.querySelector('#modal-help .help-actions');
    const host = document.getElementById('app') || document.body;
    const style = document.createElement('style');
    style.textContent = `
      #btn-worldmap { background: var(--gold, #f2b134); color: var(--ink, #2b1d14); box-shadow: 0 3px 0 #b8801a; font-size: 16px; padding: 10px 18px; }
      #btn-worldmap:active { box-shadow: none; }
      .wm-head-btn { margin-left: auto; margin-right: 10px; background: var(--gold, #f2b134); color: var(--ink, #2b1d14); border: 0; border-radius: 999px; padding: 7px 14px; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 2px 0 #b8801a; font-family: inherit; }
      .wm-head-btn:active { box-shadow: none; transform: translateY(2px); }
      @media (max-width: 700px), (max-height: 520px) { .wm-head-btn { font-size: 18px; padding: 10px 16px; } }
      @media (max-width: 700px), (max-height: 520px) { #btn-worldmap { flex: 1 1 100%; font-size: 19px; padding: 16px; } }
      #modal-worldmap .wm-card { width: min(1060px, 100%); height: min(92vh, 760px); max-height: none; }
      #modal-worldmap .modal-head { background: #2f8fc9; }
      .wm-body { flex: 1; min-height: 0; padding: 8px; background: var(--panel, #fff8ee); display: flex; }
      .wm-canvas { flex: 1; min-width: 0; min-height: 0; width: 100%; height: 100%; display: block; border-radius: 14px; touch-action: manipulation; cursor: pointer; -webkit-tap-highlight-color: transparent; }
      @media (max-width: 700px), (max-height: 520px) { #modal-worldmap .wm-card { height: 100%; } .wm-body { padding: 6px; } .wm-canvas { border-radius: 10px; } }
    `;
    document.head.appendChild(style);
    const btn = document.createElement('button');
    btn.id = 'btn-worldmap'; btn.type = 'button'; btn.className = 'btn'; btn.textContent = '🗺️ World map';
    if (help) help.insertBefore(btn, help.firstChild);
    // and a small one in the help panel's header, always in view (the help text is long)
    const head = document.querySelector('#modal-help .modal-head');
    if (head) {
      const hb = document.createElement('button');
      hb.id = 'btn-worldmap-head'; hb.type = 'button'; hb.className = 'wm-head-btn'; hb.textContent = '🗺️ Map'; hb.title = 'World map';
      hb.addEventListener('click', () => this.open());
      const close = head.querySelector('.close'); head.insertBefore(hb, close || null);
    }
    const modal = document.createElement('div');
    modal.id = 'modal-worldmap'; modal.className = 'modal hidden';
    modal.innerHTML = `<div class="modal-card wm-card">
        <div class="modal-head"><h2>🗺️ World map</h2><button class="close wm-close" aria-label="Close">✕</button></div>
        <div class="wm-body"><canvas class="wm-canvas" aria-label="A map of all the places"></canvas></div>
      </div>`;
    host.appendChild(modal);
    this.dom = { btn, modal, canvas: modal.querySelector('canvas'), close: modal.querySelector('.wm-close') };
    btn.addEventListener('click', () => this.open());
    this.dom.close.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) this.close(); });
    this.dom.canvas.addEventListener('pointerdown', (e) => {
      const r = this.dom.canvas.getBoundingClientRect();
      this.tap(e.clientX - r.left, e.clientY - r.top);
    });
  },
  isOpen() { return typeof UI !== 'undefined' && UI.open === 'worldmap'; },
  open() {
    if (!this.dom || typeof UI === 'undefined') return;
    UI.els.worldmap = this.dom.modal;     // UI.init rebuilds UI.els, so hand it the modal each time
    UI.show('worldmap');
    this.sel = null; this.lay = null;
    try { Sfx.init(); Sfx.resume(); } catch (e) { /* sound is optional */ }
    this.start();
  },
  close() {
    if (this.isOpen()) UI.close(); else if (this.dom) this.dom.modal.classList.add('hidden');
    this.stop();
  },
  // the animation runs only while the map is open; it notices any close (✕, Escape, the backdrop) and stops itself
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const frame = (now) => {
      if (!this.isOpen() || this.dom.modal.classList.contains('hidden')) { this.stop(); return; }
      const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000)); this.last = now;
      this.t += dt; this.frames++;
      if (this.sel) this.sel.t += dt;
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  },
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null; this.running = false;
  },

  // ======================= layout =======================
  fit() {
    const c = this.dom.canvas, W = Math.max(1, c.clientWidth), H = Math.max(1, c.clientHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1), bw = Math.round(W * dpr), bh = Math.round(H * dpr);
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    if (!this.lay || this.lay.W !== W || this.lay.H !== H) this.lay = this.layout(W, H);
    return dpr;
  },
  layout(W, H) {
    const C = CFG.WORLDMAP, wide = W / H >= 1.05, L = wide ? C.LAYOUTS.wide : C.LAYOUTS.tall;
    const R = Math.round(U.clamp(wide ? Math.min(W * 0.05, H * 0.085) : Math.min(W * 0.1, H * 0.052), 24, 58));
    const fs = U.clamp(Math.round(R * 0.36), 12, 18);
    const lay = { W, H, wide, L, R, fs, places: {}, routes: [], subs: [], obs: [] };
    const ctx = this.dom.canvas.getContext('2d');
    ctx.font = this.font(fs);
    for (const k of Object.keys(C.PLACES)) {
      const P = C.PLACES[k], [fx, fy] = L.pos[k], x = fx * W, y = fy * H;
      const name = (P.short && ctx.measureText(P.name).width + 22 > R * 3.2) ? P.short : P.name;
      const lw = ctx.measureText(name).width + 20, lh = fs + 10, ly = y + R + 4;
      lay.places[k] = { key: k, x, y, name, label: { x0: x - lw / 2, y0: ly, x1: x + lw / 2, y1: ly + lh } };
    }
    for (const r of C.ROUTES) {
      const a = lay.places[r.a], b = lay.places[r.b], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const bend = L.bend[r.a + '-' + r.b] || 0;
      const cx = (a.x + b.x) / 2 - dy / len * bend * len, cy = (a.y + b.y) / 2 + dx / len * bend * len;
      const pts = [];
      for (let i = 0; i <= 40; i++) { const u = i / 40, v = 1 - u; pts.push([v * v * a.x + 2 * v * u * cx + u * u * b.x, v * v * a.y + 2 * v * u * cy + u * u * b.y]); }
      lay.routes.push({ r, a, b, cx, cy, pts });
    }
    // what the little sub-place icons must keep clear of: bubbles, labels, coin badges, the hat, the paths, the decor
    const obs = lay.obs;
    for (const p of Object.values(lay.places)) {
      obs.push({ x: p.x, y: p.y, r: R + 4 });
      obs.push({ rect: p.label });
      obs.push({ x: p.x, y: p.y - R - 16, r: 18 });                                  // the chef hat
      obs.push({ rect: { x0: p.x + R * 0.42 - 2, y0: p.y + R * 0.26 - 2, x1: p.x + R * 1.14 + lay.fs * 2.2 + 10, y1: p.y + R * 0.98 + 2 } });   // the coin badge
    }
    for (const rt of lay.routes) for (let i = 4; i <= 36; i += 2) obs.push({ x: rt.pts[i][0], y: rt.pts[i][1], r: 10 });
    for (const d of L.decor) obs.push({ x: d[1] * W, y: d[2] * H, r: R * 0.55 * d[3] });
    // place each sub-icon in the roomiest spot around its bubble (it is skipped if there is no room at all)
    const rs = Math.round(U.clamp(R * 0.36, 11, 19)), sfs = U.clamp(Math.round(R * 0.22), 9, 12), labelled = R >= 40;
    ctx.font = this.font(sfs);
    const sea = { x0: L.sea[0] * W, y0: L.sea[1] * H, x1: L.sea[2] * W }, space = { x0: L.space[0] * W, x1: L.space[2] * W, y1: L.space[3] * H };
    for (const k of Object.keys(C.PLACES)) {
      const p = lay.places[k];
      C.PLACES[k].subs.forEach((s, i) => {
        const tw = labelled ? ctx.measureText(s[1]).width + 8 : 0;
        let best = null;
        for (let a = 0; a < 360; a += 10) {
          for (const d of labelled ? [R + rs + 8, R + rs * 2 + 16, R + rs * 3 + 26] : [R + rs + 6, R + rs + 14]) {
            const x = p.x + Math.cos(a * Math.PI / 180) * d, y = p.y + Math.sin(a * Math.PI / 180) * d;
            // it must sit clearly nearer its own place than any other
            const own = Math.hypot(p.x - x, p.y - y), other = Math.min(...Object.values(lay.places).filter((q) => q !== p).map((q) => Math.hypot(q.x - x, q.y - y)));
            if (other < own + R * 0.6) continue;
            // land things stay on land (the islands' things in the sea), the moon's things in space and nobody else's
            const inSea = x + rs > sea.x0 && x - rs < sea.x1 && y + rs + (labelled ? sfs : 0) > sea.y0 - 6;
            const inSpace = x + rs > space.x0 - 4 && x - rs < space.x1 && y - rs < space.y1 + 4;
            if (k !== 'islands' && inSea) continue;
            if (k === 'moon' ? !(x - rs > space.x0 + 4 && x + rs < space.x1 - 4 && y + rs + (labelled ? sfs + 4 : 0) < space.y1 - 4) : inSpace) continue;
            const lab = labelled ? { x0: x - tw / 2, y0: y + rs + 1, x1: x + tw / 2, y1: y + rs + sfs + 4 } : null;
            let cl = Math.min(x - rs - 4, W - 4 - rs - x, y - rs - 4, H - 4 - (lab ? lab.y1 - y : rs) - y);
            if (lab) cl = Math.min(cl, lab.x0 - 4, W - 4 - lab.x1);
            for (const o of obs) {
              cl = Math.min(cl, this.clear(o, x, y) - rs);
              if (lab) cl = Math.min(cl, this.clearRect(o, lab));
              if (cl < 0) break;
            }
            const score = Math.min(cl, 24) - (d - R - rs) * 0.6 + Math.min(other / own, 2.5) * 10;   // roomy, close, and away from the neighbours
            if (cl >= 2 && (!best || score > best.score)) best = { x, y, score, lab };
          }
        }
        if (!best) return;
        const sub = { place: k, i, ico: s[0], name: s[1], text: s[2], x: best.x, y: best.y, r: rs, fs: sfs, lab: best.lab };
        lay.subs.push(sub);
        obs.push({ x: sub.x, y: sub.y, r: rs + 3 });
        if (sub.lab) obs.push({ rect: sub.lab });
      });
    }
    return lay;
  },
  // clearance from an obstacle to a point (minus the obstacle's own size)
  clear(o, x, y) {
    if (o.rect) { const q = o.rect, dx = Math.max(q.x0 - x, 0, x - q.x1), dy = Math.max(q.y0 - y, 0, y - q.y1); return Math.hypot(dx, dy); }
    return Math.hypot(o.x - x, o.y - y) - o.r;
  },
  clearRect(o, q) {
    if (o.rect) { const a = o.rect, dx = Math.max(a.x0 - q.x1, q.x0 - a.x1, 0), dy = Math.max(a.y0 - q.y1, q.y0 - a.y1, 0); return Math.hypot(dx, dy) - 2; }
    const dx = Math.max(q.x0 - o.x, 0, o.x - q.x1), dy = Math.max(q.y0 - o.y, 0, o.y - q.y1);
    return Math.hypot(dx, dy) - o.r;
  },
  font(px, w = 800) { return `${w} ${px}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"`; },

  // ======================= tapping =======================
  hit(x, y) {
    const lay = this.lay; if (!lay) return null;
    for (const s of lay.subs) if (Math.hypot(s.x - x, s.y - y) <= s.r + 6) return { kind: 'sub', key: s.place, i: s.i };
    let best = null, bd = Infinity;
    for (const p of Object.values(lay.places)) {
      const d = Math.hypot(p.x - x, p.y - y), onLabel = x >= p.label.x0 - 4 && x <= p.label.x1 + 4 && y >= p.label.y0 - 4 && y <= p.label.y1 + 4;
      if ((d <= lay.R + 8 || onLabel) && d < bd) { bd = d; best = { kind: 'place', key: p.key }; }
    }
    return best;
  },
  tap(x, y) {
    if (!this.lay) return;
    const h = this.hit(x, y);
    if (!h) { this.sel = null; return; }
    this.sel = Object.assign(h, { t: 0 });
    try { Sfx.pickup(); Haptics.tap(); } catch (e) { /* optional */ }
  },
  // where a place is on the canvas (CSS px from the canvas's top-left), for tests and anyone curious
  spot(key) {
    if (!this.dom) return null;
    this.fit();
    const p = this.lay.places[key]; if (!p) return null;
    return { x: p.x, y: p.y, r: this.lay.R };
  },
  // the words in the speech bubble for the current selection
  bubbleLines(g, sel) {
    const P = CFG.WORLDMAP.PLACES[sel.key];
    if (sel.kind === 'sub') {
      const s = P.subs[sel.i];
      return [`${s[0]} ${s[2]}`, `in ${P.ico} ${P.name}`];
    }
    const lines = [`${P.ico} ${P.name}`, P.how];
    if (this.here(g) === sel.key) lines.push('👨‍🍳 You are here!');
    else if (!this.visited(g, sel.key)) lines.push('✨ Not visited yet!');
    const c = this.coins(g)[sel.key];
    if (c) lines.push(c.got >= c.n ? `🍕 All ${c.n} Pizza Coins found!` : `🍕 Pizza Coins: ${c.got} of ${c.n}`);
    return lines;
  },

  // ======================= drawing =======================
  draw() {
    const dpr = this.fit(), c = this.dom.canvas, ctx = c.getContext('2d'), lay = this.lay, g = Game, t = this.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lay.W, lay.H);
    this.drawScenery(ctx, lay, t);
    for (const rt of lay.routes) this.drawRoute(ctx, lay, rt);
    for (const rt of lay.routes) this.drawVehicle(ctx, lay, rt, t);
    const here = this.here(g), coins = this.coins(g);
    for (const s of lay.subs) this.drawSub(ctx, lay, s);
    for (const k of Object.keys(lay.places)) this.drawPlace(ctx, lay, lay.places[k], t, k === here, this.visited(g, k), coins[k]);
    this.drawHat(ctx, lay, lay.places[here], t);
    if (this.sel) this.drawBubble(ctx, lay, this.bubbleLines(g, this.sel), t);
  },

  emoji(ctx, ch, x, y, size) {
    ctx.font = `${Math.round(size)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + size * 0.06);
  },
  star(ctx, x, y, r, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  },
  cloudPuff(ctx, x, y, s, a) {
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath();
    ctx.arc(x - s * 0.9, y, s * 0.55, 0, Math.PI * 2); ctx.arc(x, y - s * 0.25, s * 0.75, 0, Math.PI * 2); ctx.arc(x + s * 0.9, y, s * 0.55, 0, Math.PI * 2);
    ctx.fill(); ctx.fillRect(x - s * 0.9, y - s * 0.05, s * 1.8, s * 0.6);
  },
  drawScenery(ctx, lay, t) {
    const { W, H, L, R } = lay, hz = L.horizon * H;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, hz + 40);
    sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#d9f2ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz + 40);
    // drifting clouds
    for (let i = 0; i < 4; i++) {
      const s = R * (0.35 + (i % 2) * 0.12), x = ((i * 0.29 + t * 0.008 * (1 + i * 0.3)) % 1.2 - 0.1) * W, y = hz * (0.25 + 0.17 * i);
      this.cloudPuff(ctx, x, y, s, 0.7);
    }
    // mountains with snowy caps
    for (const [fx, fy, fw] of L.mountains) {
      const x = fx * W, base = hz + 30, top = fy * H, w = fw * W;
      ctx.fillStyle = '#8aa0c8'; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x, top); ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7189b6'; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, base); ctx.lineTo(x + w * 0.25, base); ctx.closePath(); ctx.fill();
      const k = 0.32; ctx.fillStyle = '#ffffff'; ctx.beginPath();
      ctx.moveTo(x, top); ctx.lineTo(x + w * k, top + (base - top) * k);
      ctx.lineTo(x + w * k * 0.4, top + (base - top) * k * 0.8); ctx.lineTo(x, top + (base - top) * k * 1.05);
      ctx.lineTo(x - w * k * 0.4, top + (base - top) * k * 0.8); ctx.lineTo(x - w * k, top + (base - top) * k); ctx.closePath(); ctx.fill();
    }
    // a green hill (the campus sits on it in the wide map)
    if (L.hill) { const [fx, fy, fw] = L.hill; ctx.fillStyle = '#8fd46a'; ctx.beginPath(); ctx.ellipse(fx * W, hz + 20, fw * W, hz + 20 - fy * H, 0, Math.PI, 0); ctx.fill(); }
    // the land, with a soft wavy horizon
    ctx.fillStyle = '#a6e07a'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, hz + Math.sin(x / 70) * 6);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 26; i++) { const x = ((i * 137) % 997) / 997 * W, y = hz + 20 + ((i * 71) % 487) / 487 * (H - hz - 20); ctx.beginPath(); ctx.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // the sea, with a sandy beach and moving waves
    const [sx0, sy0, sx1, sy1] = L.sea, X0 = sx0 * W, Y0 = sy0 * H, X1 = sx1 * W, Y1 = sy1 * H;
    ctx.fillStyle = '#ffe6a8'; U.roundRect(ctx, X0 - 10, Y0 - 10, X1 - X0 + 20, Y1 - Y0 + 20, 60); ctx.fill();
    const sea = ctx.createLinearGradient(0, Y0, 0, H); sea.addColorStop(0, '#5cc6f2'); sea.addColorStop(1, '#2f97d9');
    ctx.fillStyle = sea; U.roundRect(ctx, X0, Y0, X1 - X0, Y1 - Y0, 54); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const x = X0 + 30 + (((i * 0.37 + t * 0.012) % 1) * (Math.min(X1, W) - X0 - 60)), y = Y0 + 22 + ((i * 53) % 97) / 97 * (Math.min(Y1, H) - Y0 - 34);
      ctx.beginPath(); ctx.arc(x - 6, y, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(x + 6, y, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
    // the space corner, with twinkling stars and a ringed planet
    const [px0, py0, px1, py1] = L.space, Q = { x0: px0 * W, y0: py0 * H, x1: px1 * W, y1: py1 * H };
    const sp = ctx.createRadialGradient(lay.places.moon.x, lay.places.moon.y, 10, lay.places.moon.x, lay.places.moon.y, Math.max(Q.x1 - Q.x0, Q.y1 - Q.y0));
    sp.addColorStop(0, '#3a2f7a'); sp.addColorStop(1, '#151a3d');
    ctx.fillStyle = sp; U.roundRect(ctx, Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0, 40); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([2, 8]); U.roundRect(ctx, Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0, 40); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); U.roundRect(ctx, Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0, 40); ctx.clip();
    for (let i = 0; i < 18; i++) {
      const x = Q.x0 + 8 + ((i * 89) % 101) / 101 * (Q.x1 - Q.x0 - 16), y = Q.y0 + 8 + ((i * 47) % 103) / 103 * (Q.y1 - Q.y0 - 16);
      const a = 0.45 + 0.55 * Math.abs(Math.sin(t * (1.2 + (i % 5) * 0.35) + i));
      this.star(ctx, x, y, 2 + (i % 3) * 1.3 * a, `rgba(255,${240 - (i % 3) * 20},${200 + (i % 2) * 55},${a.toFixed(3)})`);
    }
    ctx.restore();
    // a few friendly things to look at (gently bobbing)
    for (const [ch, fx, fy, k] of L.decor) {
      const bob = Math.sin(t * 1.6 + fx * 10) * 3;
      this.emoji(ctx, ch, fx * W, fy * H + bob, R * 0.75 * k);
    }
    // Cloud Harbor floats on a bed of clouds
    const cp = lay.places.cloud;
    this.cloudPuff(ctx, cp.x - R * 0.95, cp.y + R * 0.55, R * 0.42, 0.9); this.cloudPuff(ctx, cp.x + R * 0.95, cp.y + R * 0.5, R * 0.46, 0.9);
  },

  drawRoute(ctx, lay, rt) {
    const s = rt.r.style, pts = rt.pts, line = () => { ctx.beginPath(); ctx.moveTo(rt.a.x, rt.a.y); ctx.quadraticCurveTo(rt.cx, rt.cy, rt.b.x, rt.b.y); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (s === 'road') {
      ctx.strokeStyle = '#6f6f78'; ctx.lineWidth = 14; line(); ctx.stroke();
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 9]); line(); ctx.stroke(); ctx.setLineDash([]);
    } else if (s === 'rail') {
      ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3;
      for (let i = 1; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i + 1], [x, y] = pts[i], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 8, ny = dx / l * 8;
        ctx.beginPath(); ctx.moveTo(x - nx, y - ny); ctx.lineTo(x + nx, y + ny); ctx.stroke();
      }
      ctx.strokeStyle = '#6b6b75'; ctx.lineWidth = 2.5;
      for (const off of [-5, 5]) {
        ctx.beginPath();
        pts.forEach(([x, y], i) => { const j = Math.min(pts.length - 1, Math.max(1, i)), [ax, ay] = pts[j - 1], [bx, by] = pts[j], l = Math.hypot(bx - ax, by - ay) || 1, X = x - (by - ay) / l * off, Y = y + (bx - ax) / l * off; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.stroke();
      }
    } else if (s === 'cable') {
      ctx.strokeStyle = '#3d3d48'; ctx.lineWidth = 2.5; line(); ctx.stroke();
      ctx.fillStyle = '#8d5a2b';
      for (const u of [0.33, 0.66]) { const [x, y] = pts[Math.round(u * 40)]; ctx.fillRect(x - 2.5, y - 2, 5, 22); }
    } else {
      const col = { tunnel: '#7a52c7', water: '#ffffff', space: '#ffd84a', air: '#ffffff' }[s] || '#fff';
      ctx.strokeStyle = s === 'air' ? 'rgba(80,140,200,0.35)' : s === 'tunnel' ? 'rgba(122,82,199,0.25)' : 'rgba(0,0,0,0.12)';
      ctx.lineWidth = s === 'tunnel' ? 12 : 8; line(); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash([1, 11]); line(); ctx.stroke(); ctx.setLineDash([]);
    }
  },
  // where along a route a vehicle is (0..1) and which way it is going
  vehicleAt(rt, t) {
    const sp = 0.32 + (rt.r.ico.charCodeAt(0) % 7) * 0.02;
    if (rt.r.loop) { const k = (t * sp * 0.5 + rt.r.a.length * 0.13) % 1; return { u: 0.18 + 0.64 * k, dir: 1, fade: Math.min(1, k * 6, (1 - k) * 6) }; }
    const ph = t * sp + rt.r.b.length;
    return { u: 0.2 + 0.6 * (0.5 - 0.5 * Math.cos(ph)), dir: Math.sin(ph) >= 0 ? 1 : -1, fade: 1 };
  },
  drawVehicle(ctx, lay, rt, t) {
    const v = this.vehicleAt(rt, t), f = v.u * 40, i = Math.min(39, Math.floor(f)), k = f - i, [x0, y0] = rt.pts[i], [x1, y1] = rt.pts[i + 1];
    const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, dx = (x1 - x0) * v.dir;
    const size = lay.R * 0.72, bob = rt.r.style === 'water' ? Math.sin(t * 3) * 2.5 : rt.r.style === 'cable' ? 6 : Math.sin(t * 6) * 1;
    ctx.save(); ctx.globalAlpha = v.fade;
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y + bob, size * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.translate(x, y + bob);
    if (rt.r.style === 'water') ctx.rotate(Math.sin(t * 2.2) * 0.08);
    if (!rt.r.loop && dx > 0 && rt.r.style !== 'cable' && rt.r.style !== 'tunnel') ctx.scale(-1, 1);   // the emoji face left
    this.emoji(ctx, rt.r.ico, 0, 0, size);
    ctx.restore();
  },
  drawSub(ctx, lay, s) {
    const sel = this.sel && this.sel.kind === 'sub' && this.sel.key === s.place && this.sel.i === s.i;
    const sc = sel ? 1 + 0.25 * Math.exp(-this.sel.t * 5) * Math.abs(Math.sin(this.sel.t * 14)) : 1;
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(1, 2.5, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.strokeStyle = sel ? '#e4572e' : '#e9c48a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    this.emoji(ctx, s.ico, 0, 0, s.r * 1.15);
    ctx.restore();
    if (s.lab) {
      ctx.font = this.font(s.fs); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,248,238,0.9)'; ctx.strokeText(s.name, s.x, s.lab.y0 + 1);
      ctx.fillStyle = '#5a3d22'; ctx.fillText(s.name, s.x, s.lab.y0 + 1);
    }
  },
  drawPlace(ctx, lay, p, t, here, seen, coins) {
    const P = CFG.WORLDMAP.PLACES[p.key], R = lay.R;
    const sel = this.sel && this.sel.kind === 'place' && this.sel.key === p.key;
    const sc = sel ? 1 + 0.18 * Math.exp(-this.sel.t * 4) * Math.abs(Math.sin(this.sel.t * 12)) : 1;
    const bob = Math.sin(t * 1.3 + p.x * 0.01) * 1.5;
    // a soft glow ring where the chef is
    if (here) {
      const k = (t % 1.6) / 1.6;
      ctx.strokeStyle = `rgba(228,87,46,${(0.6 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y + bob, R + 4 + k * 14, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(60,40,20,0.22)'; ctx.beginPath(); ctx.ellipse(2, R * 0.92, R * 0.95, R * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
    gr.addColorStop(0, P.dark ? '#5a5ca8' : '#ffffff'); gr.addColorStop(1, P.col);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(3, R * 0.1); ctx.strokeStyle = here ? '#e4572e' : sel ? '#f2b134' : '#ffffff'; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(90,61,34,0.35)'; ctx.beginPath(); ctx.arc(0, 0, R + Math.max(3, R * 0.1) / 2 + 0.5, 0, Math.PI * 2); ctx.stroke();
    this.emoji(ctx, P.ico, 0, 0, R * 1.05);
    ctx.restore();
    // name label
    const L = p.label, y = L.y0 + bob;
    ctx.fillStyle = 'rgba(60,40,20,0.2)'; U.roundRect(ctx, L.x0 + 1, y + 2, L.x1 - L.x0, L.y1 - L.y0, (L.y1 - L.y0) / 2); ctx.fill();
    ctx.fillStyle = here ? '#e4572e' : '#fff8ee'; U.roundRect(ctx, L.x0, y, L.x1 - L.x0, L.y1 - L.y0, (L.y1 - L.y0) / 2); ctx.fill();
    ctx.strokeStyle = here ? '#b8401c' : '#e9c48a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = this.font(lay.fs); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = here ? '#ffffff' : '#2b1d14'; ctx.fillText(p.name, p.x, y + (L.y1 - L.y0) / 2 + 1);
    // the Pizza Coin badge: found / hidden here
    if (coins && coins.n) {
      const bx = p.x + R * 0.78, by = p.y + R * 0.62 + bob, br = R * 0.36, full = coins.got >= coins.n;
      const txt = `${coins.got}/${coins.n}`;
      ctx.font = this.font(Math.max(10, Math.round(br * 0.78)));
      const tw = ctx.measureText(txt).width, w = br * 2 + tw + 8;
      ctx.fillStyle = full ? '#fff3b0' : '#ffffff'; U.roundRect(ctx, bx - br, by - br, w, br * 2, br); ctx.fill();
      ctx.strokeStyle = '#e09b14'; ctx.lineWidth = 2; ctx.stroke();
      if (typeof PizzaCoinsExt !== 'undefined' && PizzaCoinsExt.drawCoin) PizzaCoinsExt.drawCoin(ctx, bx, by, br * 0.78, 0);
      else { ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.arc(bx, by, br * 0.78, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = full ? '#b5770f' : '#5a3d22'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, bx + br + 2, by + 1);
    }
    // not been there yet: a question mark and a twinkle
    if (!seen) {
      const qx = p.x - R * 0.74, qy = p.y - R * 0.7 + bob;
      ctx.fillStyle = '#7a52c7'; ctx.beginPath(); ctx.arc(qx, qy, R * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = this.font(Math.round(R * 0.4), 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', qx, qy + 1);
      const a = Math.abs(Math.sin(t * 2.2 + p.x));
      this.star(ctx, p.x + R * 0.7, p.y - R * 0.85 + bob, 3 + a * 5, `rgba(255,236,140,${(0.4 + 0.6 * a).toFixed(3)})`);
    }
  },
  // the bouncing chef hat over the place the chef is in now
  drawHat(ctx, lay, p, t) {
    if (!p) return;
    const R = lay.R, s = U.clamp(R * 0.44, 12, 24), hop = Math.abs(Math.sin(t * 3.2)) * R * 0.28;
    const x = p.x, y = p.y - R - s * 0.55 - hop;
    ctx.fillStyle = 'rgba(60,40,20,0.2)'; ctx.beginPath(); ctx.ellipse(x, p.y - R + 2, s * (0.9 - hop / (R * 0.9)), s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3.2) * 0.08);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.55); ctx.lineTo(s * 0.3, s * 0.55); ctx.lineTo(0, s * 1.0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c9b8a6'; ctx.lineWidth = 1.6;
    U.roundRect(ctx, -s * 0.62, -s * 0.05, s * 1.24, s * 0.62, s * 0.12); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.5, -s * 0.35, s * 0.42, 0, Math.PI * 2); ctx.arc(s * 0.5, -s * 0.35, s * 0.42, 0, Math.PI * 2); ctx.arc(0, -s * 0.62, s * 0.55, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.58, -s * 0.4, s * 1.16, s * 0.46);
    ctx.strokeStyle = '#e8ddd0'; ctx.lineWidth = 1.2;
    for (const k of [-0.25, 0.25]) { ctx.beginPath(); ctx.moveTo(k * s, s * 0.02); ctx.lineTo(k * s, s * 0.5); ctx.stroke(); }
    ctx.restore();
  },
  // the speech bubble over the tapped place (or under it, when there is no room above)
  drawBubble(ctx, lay, lines, t) {
    const sel = this.sel, p = lay.places[sel.key], s = sel.kind === 'sub' ? lay.subs.find((q) => q.place === sel.key && q.i === sel.i) : null;
    const ax = s ? s.x : p.x, ay = s ? s.y : p.y, ar = s ? s.r : lay.R;
    const fs = U.clamp(Math.round(lay.R * 0.38), 14, 19), pad = 12, maxW = Math.min(lay.W - 24, Math.max(240, fs * 20));
    const rows = [];
    lines.forEach((ln, i) => {
      ctx.font = this.font(i === 0 ? fs + 3 : fs, i === 0 ? 900 : 700);
      for (const r of this.wrap(ctx, ln, maxW - pad * 2)) rows.push({ text: r, big: i === 0, w: ctx.measureText(r).width });
    });
    const lh = fs * 1.35, w = Math.min(maxW, Math.max(...rows.map((r) => r.w)) + pad * 2), h = rows.length * lh + pad * 2 - 2;
    const pop = Math.min(1, sel.t / 0.18), sc = 0.6 + 0.4 * U.easeOut(pop);
    let above = ay - ar - 18 - h > 6;
    if (!s && !above && ay + ar + 18 + h + 30 > lay.H) above = true;
    let bx = U.clamp(ax - w / 2, 8, lay.W - 8 - w), by = above ? ay - ar - 16 - h : ay + ar + (s ? 14 : 34);
    by = U.clamp(by, 6, lay.H - 6 - h);
    ctx.save(); ctx.translate(ax, ay); ctx.scale(sc, sc); ctx.translate(-ax, -ay); ctx.globalAlpha = pop;
    ctx.fillStyle = 'rgba(43,29,20,0.25)'; U.roundRect(ctx, bx + 2, by + 4, w, h, 16); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e9c48a'; ctx.lineWidth = 3;
    U.roundRect(ctx, bx, by, w, h, 16); ctx.fill(); ctx.stroke();
    // the tail points at the place
    const tx = U.clamp(ax, bx + 20, bx + w - 20), ty = above ? by + h : by, tip = above ? Math.min(ay - ar - 2, ty + 14) : Math.max(ay + ar + 2, ty - 14);
    ctx.beginPath(); ctx.moveTo(tx - 10, ty); ctx.lineTo(ax + (tx - ax) * 0.3, tip); ctx.lineTo(tx + 10, ty); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx - 10, ty); ctx.lineTo(ax + (tx - ax) * 0.3, tip); ctx.lineTo(tx + 10, ty); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - 11.5, above ? ty - 4 : ty + 1, 23, 3.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      ctx.font = this.font(r.big ? fs + 3 : fs, r.big ? 900 : 700); ctx.fillStyle = r.big ? '#2b1d14' : '#5a3d22';
      ctx.fillText(r.text, bx + w / 2, by + pad + lh * (i + 0.5));
    });
    ctx.restore();
  },
  wrap(ctx, text, maxW) {
    const words = text.split(' '), out = []; let cur = '';
    for (const w of words) { const n = cur ? cur + ' ' + w : w; if (cur && ctx.measureText(n).width > maxW) { out.push(cur); cur = w; } else cur = n; }
    if (cur) out.push(cur);
    return out;
  },
};

WorldMapExt.buildDom();
Game.ext.push(WorldMapExt);
