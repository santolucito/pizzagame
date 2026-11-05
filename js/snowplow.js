'use strict';
// Snow you can plow.
//   - Construction Town: while it snows there (AtmosphereExt.weather.site, whose timers tick all the time) a light snow
//     cover builds up over the dirt, grass and roads (never on roofs, inside buildings or on water), and melts slowly
//     once the shower is over. Riding the bulldozer clears the cells in front of its blade: the snow piles up ahead of
//     it and is left behind as a snowbank when you stop or turn. The dump truck, excavator and the other trucks leave
//     tyre tracks in the snow.
//   - Snowy Peak: an orange snow plow truck ('snowplow') is parked by the valley lift station. The flat snow away from
//     the runs and the snowman meadow is fresh powder; the plow clears roads through it (a packed blue-grey track with
//     little snowbanks along its sides and a spray off the blade) which stay clear while the chef is on Snowy Peak; fresh snow covers them once the chef has left.
// Everything here is runtime-only (nothing saved).
//
// The snow on the ground is a coarse grid (CELL px) drawn into an offscreen canvas at RES px per world px. Each cell is
// a small "lumpy snow" sprite (its neighbours' sprites overlap it), so a cell is redrawn (clear + its 3x3 neighbourhood
// of sprites, cut around buildings) only when its quantised state changes, a few per frame at most. The site's overall
// depth (snowfall / melting) is just the alpha the canvas is drawn with, so it never redraws anything. Each frame draws
// only the visible part of the canvas with one drawImage.
// Extension module: Game.ext.unshift + Render.ext.unshift (its ground layer must sit under the other extensions'
// moving ground art, like concrete puddles and footprints). See js/EXTENSIONS.md.

CFG.SNOWPLOW = {
  CELL: 24, RES: 0.5,                 // grid cell size (world px) and the cover canvas's resolution (canvas px per world px)
  FALL: 30,                           // seconds of full snowfall for the site's cover to build from bare ground to full
  MELT: 150,                          // seconds for a full site cover to melt away once the snow stops
  // Plowed roads (the plow's on Snowy Peak, the bulldozer's in Construction Town) stay clear for as long as the chef is
  // in that place (its buildings count too); fresh snow covers them again once the chef has gone somewhere else.
  PILE_CAP: 14,                       // the most snow (in cells) a bulldozer's blade pile holds
  PILE_MAX: 36,                       // piles left lying around at once
  BUDGET: 60,                         // cell redraws per frame (more while the layer is invisible)
  DOZER_BLADE: { xs: [44, 56], ys: [-22, -8, 8, 22] },                 // where the bulldozer's blade clears (its own frame)
  PLOW_BLADE: { xs: [50, 62], ys: [-38, -26, -13, 0, 13, 26, 38] },         // the plow's wide angled blade
  PLOW_BANKS: [[42, 56, 0.6], [56, 58, 0.5], [42, -54, 0.4], [56, -56, 0.3]],  // [x, y, amount]: snow pushed up beside the road
  SPOT: { x: 6110, y: 6575, angle: -Math.PI / 2 },                          // the plow's parking spot, east of the valley lift deck, nose to the mountain
  NEAR: 70, DOZER_NEAR: 120,
  STAMPS: 260,
};
CFG.VEHICLES.snowplow = { speed: 220, radius: 26, label: '🚜 Drive the snow plow', exit: '🚶 Hop out' };

const SnowPlowExt = {
  name: 'snowplow',
  v: null, st: null, layers: null, sprites: null, off: false,

  // ---------- state ----------
  build(g) {
    const S = CFG.SNOWPLOW.SPOT;
    this.v = { kind: 'snowplow', x: S.x, y: S.y, angle: S.angle, vx: 0, vy: 0, flash: 0 };
    this.st = {
      level: 0,                         // the site's snow depth 0..1 (snowfall builds it, melting takes it away)
      carry: 0, still: 0, angHist: [], piles: [], cleared: 0, clearedSay: 0, sayT: -99,
      peakCleared: 0, peakSay: 0, whooshT: -99, peakSayT: -99,
      spray: [], stamps: [], last: {},  // spray particles, tyre stamps, last stamp spot per vehicle
      time: 0,
    };
    this.layers = { site: this.makeLayer('site'), snow: this.makeLayer('snow') };
  },
  ensure(g) { if (!this.v || !this.st || !this.layers) this.build(g); },
  riding(g) { return !!(this.v && g.driving && g.vehicle === this.v); },
  busy(g) {
    if (g.travel || g.onTrain || g.ride || g.fishing) return true;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return true;
    if (typeof SnowExt !== 'undefined' && SnowExt.st && SnowExt.st.lift) return true;
    return false;
  },
  // point in a vehicle's own frame (nose +x) → world
  world(v, lx, ly) { const c = Math.cos(v.angle), s = Math.sin(v.angle); return { x: v.x + lx * c - ly * s, y: v.y + lx * s + ly * c }; },
  hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },

  // How hard it is snowing at Construction Town right now (0..1), wherever the chef is.
  siteSnowing() {
    if (typeof AtmosphereExt === 'undefined' || !AtmosphereExt.weather || !AtmosphereExt.weather.site) return 0;
    const w = AtmosphereExt.weather.site, F = CFG.ATMOSPHERE.SNOW.fade;
    if (w.t < 0) return 0;
    return U.clamp(Math.min(w.t / F, (w.dur - w.t) / F, 1), 0, 1);
  },
  // The snow depth (0..1) at a world point of a map: the site's cover, or Snowy Peak's fresh powder.
  depthAt(area, x, y) {
    this.ensure(Game);
    const L = this.layers[area]; if (!L) return 0;
    const i = this.cellAt(L, x, y); if (i < 0 || !L.mask[i]) return 0;
    const d = 1 - L.c[i];
    return area === 'site' ? d * this.st.level : d;
  },
  coverAlpha() { return 0.92 * U.clamp(this.st.level / 0.8, 0, 1); },   // a thin cover: the ground still tints it a little

  // ---------- the grid layers ----------
  makeLayer(area) {
    const P = CFG.SNOWPLOW, cell = P.CELL;
    const B = area === 'site' ? CFG.SITE.WORLD : { x0: CFG.SNOW.WORLD.x0, y0: CFG.SNOW.WORLD.y0 + 144, x1: CFG.SNOW.WORLD.x1, y1: CFG.SNOW.WORLD.y1 };
    const cols = Math.ceil((B.x1 - B.x0) / cell), rows = Math.ceil((B.y1 - B.y0) / cell), n = cols * rows;
    const L = {
      area, x0: B.x0, y0: B.y0, cols, rows, n, cell, cp: cell * P.RES,
      mask: new Uint8Array(n), c: new Float32Array(n), b: new Float32Array(n), code: new Uint8Array(n),
      dirty: new Uint8Array(n), dirtyList: [], act: new Uint8Array(n), active: [],
      cuts: area === 'site' ? this.siteCuts() : this.peakCuts(), cellCuts: null,
      canvas: null, ctx: null, painted: false,
    };
    // a cell holds snow (for plowing and depth) unless its middle is under a cut (a building, water, a sign...); its
    // sprite is drawn unless the whole cell is under cuts: the cuts themselves trim the cover to their exact shape
    const inCut = (x, y) => L.cuts.some((q) => this.inShape(q, x, y));
    L.draw = new Uint8Array(n);
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const x = B.x0 + (k + 0.5) * cell, y = B.y0 + (r + 0.5) * cell, o = cell * 0.5, i = r * cols + k;
      let hits = 0; for (const [dx, dy] of [[0, 0], [-o, -o], [o, -o], [-o, o], [o, o], [0, -o], [0, o], [-o, 0], [o, 0]]) if (inCut(x + dx, y + dy)) hits++;
      const out = y > B.y1 - 4 || x > B.x1 - 4;
      L.mask[i] = out || inCut(x, y) ? 0 : 1;
      L.draw[i] = out || hits === 9 ? 0 : 1;
    }
    // which cuts overlap each cell (only the cells that touch one)
    L.cellCuts = new Map();
    L.cuts.forEach((q, qi) => {
      const k0 = Math.max(0, Math.floor((q.x0 - B.x0) / cell)), k1 = Math.min(cols - 1, Math.floor((q.x1 - B.x0) / cell));
      const r0 = Math.max(0, Math.floor((q.y0 - B.y0) / cell)), r1 = Math.min(rows - 1, Math.floor((q.y1 - B.y0) / cell));
      for (let r = r0; r <= r1; r++) for (let k = k0; k <= k1; k++) { const i = r * cols + k; if (!L.cellCuts.has(i)) L.cellCuts.set(i, []); L.cellCuts.get(i).push(qi); }
    });
    return L;
  },
  inShape(q, x, y) {
    if (x < q.x0 || x > q.x1 || y < q.y0 || y > q.y1) return false;
    if (!q.ell) return true;
    const rx = (q.x1 - q.x0) / 2, ry = (q.y1 - q.y0) / 2, dx = (x - (q.x0 + rx)) / rx, dy = (y - (q.y0 + ry)) / ry;
    return dx * dx + dy * dy <= 1;
  },
  cellAt(L, x, y) {
    const k = Math.floor((x - L.x0) / L.cell), r = Math.floor((y - L.y0) / L.cell);
    if (k < 0 || r < 0 || k >= L.cols || r >= L.rows) return -1;
    return r * L.cols + k;
  },
  // Construction Town: where no snow settles (roofs and walls, insides, water, the things painted on the ground)
  siteCuts() {
    const out = [], R = (x0, y0, x1, y1) => out.push({ x0, y0, x1, y1 }), E = (x, y, rx, ry) => out.push({ x0: x - rx, y0: y - ry, x1: x + rx, y1: y + ry, ell: true });
    const S = CFG.SITE, W = S.WORLD;
    R(W.x0, W.y0, W.x1, -66);                                                     // the railway and the platform
    { const H = S.STATION.house; R(H.x0 - 6, H.y0 - 40, H.x1 + 6, H.y1 + 6); }
    { const B = S.BUILDING; R(B.x0 - 8, B.y0 - 38, B.x1 + 8, B.y1 + 8); }          // the half-built house: inside, no snow
    if (!S.CRANE.hidden) R(S.CRANE.x - 28, S.CRANE.y - 28, S.CRANE.x + 28, S.CRANE.y + 28);
    if (CFG.SITE_CRANE) { const b = CFG.SITE_CRANE.BASE; R(b.x - 32, b.y - 32, b.x + 32, b.y + 32); }
    { const T = S.TOILET; R(T.x - 19, T.y - 34, T.x + 21, T.y + 13); }
    { const G = S.SIGN; R(G.x - 73, G.y - 63, G.x + 73, G.y + 7); }
    for (const [x, y] of S.CONES) E(x + 1, y - 10, 15, 21);
    for (const [x, y] of S.BARRELS) E(x + 1, y - 4, 18, 19);
    for (const [x, y] of S.PALLETS) R(x - 28, y - 44, x + 28, y + 16);
    for (const [x, y, r] of [[2680, 640, 30], [3620, 820, 36], [3880, 250, 24]]) E(x, y, r + 5, r * 0.45 + 5);   // puddles
    for (const m of S.MOUNDS) E(m.x + 2, m.y + 2, m.r + 6, m.r * 0.55 + 7);       // dirt piles get a snowy cap instead
    if (typeof CFG.SITEGARAGE !== 'undefined' && CFG.SITEGARAGE.X1) { const G = CFG.SITEGARAGE; R(G.X0 - 10, W.y0, G.X1 + 10, G.DOOR_Y + 10); }
    if (typeof CFG.MINES !== 'undefined') { const H = CFG.MINES.HILL; R(H.x0 - 10, W.y0, H.x1 + 10, 44); }
    if (typeof CFG.SNOW !== 'undefined' && CFG.SNOW.CT) { const C = CFG.SNOW.CT; R(C.HUT.x0 - 12, W.y0, C.DECK.x1 + 10, C.DECK.y1 + 12); }
    if (typeof CFG.SITETOWN !== 'undefined') {
      const T = CFG.SITETOWN;
      { const St = T.STORE; R(St.x0 - 18, St.y0 - 12, St.x1 + 18, St.y1 + 28); }
      { const H = T.HOUSES; R(H[0].x0 - 8, H[0].y0 - 42, H[H.length - 1].x1 + 8, H[0].y1 + 10 + T.GARDEN_H + 6); }
      { const M = T.MAILBOX; E(M.x, M.y - 9, 14, 20); }
      { const G = T.SIGN; R(G.x - 110, G.y - 66, G.x + 110, G.y + 8); }
      { const P = T.POND; E(P.x, P.y + 2, P.rx + 14, P.ry + 12); }
      { const P = T.POND2; E(P.x, P.y + 2, P.rx + 14, P.ry + 12); }
      { const P = T.PARK; for (const [bx, by] of [[P.x0 + 40, P.y0 + 30], [P.x1 - 50, P.y1 - 60]]) R(bx - 23, by - 9, bx + 23, by + 20); }
      { const SL = T.SLIDE; R(SL.top.x - 42, SL.top.y - 36, SL.top.x + 44, SL.bottom.y + 42); }
      { const Bs = T.BUS; R(Bs.x - 28, Bs.y - 48, Bs.x + 44, Bs.y + 24); }
      { const Tw = T.TOWER; R(Tw.x - 32, Tw.y - 24, Tw.x + 32, Tw.y + 24); }
      for (const [x, y] of T.LAMPS) E(x, y - 26, 13, 36);
      for (const [x, y] of T.BEDS) R(x - 32, y - 14, x + 32, y + 14);
      for (const [x, y] of T.TREES) E(x + 3, y - 10, 21, 23);
      { const F = T.FACTORY; R(F.x0 - 4, F.y0 - 14, F.x1, F.y1); }
      { const D = T.DINER; R(D.x0 - 22, D.y0 - 28, D.x1 + 22, D.y1 + 26); R(D.x0 + (D.x1 - D.x0) / 2 - 72, D.y0 - 30, D.x0 + (D.x1 - D.x0) / 2 + 72, D.y0); }
      { const Tb = T.TABLE; R(Tb.x - 40, Tb.y - 31, Tb.x + 40, Tb.y + 32); E(Tb.x - 60, Tb.y - 18, 13, 22); }
      { const Bp = T.BEAM_PILE_BOX; R(Bp.x0 - 6, Bp.y0 - 22, Bp.x1 + 6, Bp.y1 + 6); }
      { const Tr = T.TRACK; R(Tr.x - 62, Tr.y - 60, Tr.x + 32, Tr.y - 4); R(Tr.x + Tr.rxi, Tr.y - 10, Tr.x + Tr.rxi + 116, Tr.y + 10); }
    }
    return out;
  },
  // Snowy Peak: fresh powder only on the flat snow away from the runs, the meadow, the stations and the cabin
  peakCuts() {
    const out = [], R = (x0, y0, x1, y1) => out.push({ x0, y0, x1, y1 });
    const S = CFG.SNOW, W = S.WORLD, L = S.SLOPE, M = S.MEADOW, V = S.VALLEY;
    R(W.x0, W.y0, W.x1, W.y0 + S.SKY_H + 96);                                       // the sky and the top edge
    R(W.x0, W.y0, L.x1 + 18, L.y1 + 14);                                             // the top terrace, the sledding hill and the ski run
    R(M.x0 - 14, M.y0 - 50, M.x1 + 14, M.y1 + 16);                                   // the snowman meadow keeps its snow
    R(S.CABIN.x0 - 18, S.CABIN.y0 - 96, S.CABIN.x1 + 18, S.CABIN.y1 + 70);           // the cocoa cabin, its mat and the cocoa pad
    R(S.BOTTOM_SPOT.x - 40, L.y1, S.DOWN_ARRIVE.x + 40, S.BOTTOM.y1 + 14);            // the mountain lift's bottom station and its two mats
    R(V.HUT.x0 - 14, V.HUT.y0 - 44, V.HUT.x1 + 10, V.HUT.y1 + 12);                   // the TO TOWN hut
    R(V.DECK.x0 - 8, V.DECK.y0 - 14, V.DECK.x1 + 8, W.y1);                            // the valley lift's deck
    R(W.x0, W.y1 - 40, W.x1, W.y1);                                                   // the fence along the bottom
    return out;
  },

  // ---------- the sprites: one lumpy-snow picture per (pass, state, variant), drawn once ----------
  // Passes, each drawn for every cell before the next: 0 the packed track (Snowy Peak), 1 the snow's blue shadow,
  // 2 the snow itself (so the shadow only shows along the edges of the cover), 3 and 4 the same for the snowbanks.
  PASSES: 5,
  buildSprites() {
    const P = CFG.SNOWPLOW, cell = P.CELL, res = P.RES, size = Math.round(cell * 2 * res), out = {};
    const mk = (fn) => { const c = document.createElement('canvas'); c.width = size; c.height = size; const x = c.getContext('2d'); x.setTransform(res, 0, 0, res, size / 2, size / 2); fn(x); return c; };
    const rnd = (seed) => { let s = (seed * 7919 + 104729) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
    // three overlapping lumps per cell; full snow overlaps its neighbours well, thin snow leaves gaps
    const blobs = (f, v, big) => {
      const r = rnd(v * 31 + (big ? 101 : 0)), out = [];
      for (let i = 0; i < 3; i++) {
        const a = r() * Math.PI * 2, d = cell * 0.15 * r(), rad = cell * (big ? 0.48 + r() * 0.14 : 0.6 + r() * 0.1) * (0.32 + 0.68 * f);
        out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, rx: rad, ry: rad * (0.8 + r() * 0.12) });
      }
      return out;
    };
    const fillBlobs = (x, bl, dy, grow, ky) => { x.beginPath(); for (const b of bl) { const yy = b.y + dy; x.moveTo(b.x + b.rx + grow, yy); x.ellipse(b.x, yy, b.rx + grow, (b.ry + grow) * (ky || 1), 0, 0, Math.PI * 2); } x.fill(); };
    for (const look of ['site', 'snow']) {
      const S = out[look] = [[], [], [], [], []];
      const shade = look === 'site' ? 'rgba(150,178,222,0.9)' : 'rgba(170,196,232,0.85)', white = look === 'site' ? '#f6faff' : '#ffffff';
      const lump = look === 'site' ? 'rgba(214,228,246,0.7)' : 'rgba(222,234,250,0.75)';
      for (let q = 0; q <= 4; q++) {
        const f = 1 - q / 4;
        for (const k of [0, 1, 2]) S[k][q] = [];
        for (let v = 0; v < 4; v++) {
          const bl = blobs(f, v, false), al = f < 1 ? 0.5 + 0.5 * f : 1;
          S[1][q][v] = f <= 0 ? null : mk((x) => { x.globalAlpha = al; x.fillStyle = shade; fillBlobs(x, bl, 3, 0.5); });
          S[2][q][v] = f <= 0 ? null : mk((x) => {
            x.globalAlpha = al; x.fillStyle = white; fillBlobs(x, bl, 0, 0);
            // a soft little hollow and a glint, so the cover reads lumpy rather than flat
            const r = rnd(v + 17), b = bl[Math.floor(r() * 3)];
            x.fillStyle = lump; x.beginPath(); x.ellipse(b.x + b.rx * 0.15, b.y + b.ry * 0.35, b.rx * 0.5, b.ry * 0.22, 0, 0, Math.PI * 2); x.fill();
            x.fillStyle = look === 'site' ? '#ffffff' : 'rgba(190,212,242,0.9)'; x.fillRect(bl[0].x - bl[0].rx * 0.3, bl[0].y - bl[0].ry * 0.4, 1.8, 1.8);
          });
          S[0][q][v] = look !== 'snow' || q === 0 ? null : mk((x) => {
            const r = rnd(v + 3), k = q / 4;
            x.globalAlpha = 0.3 + 0.55 * k;
            x.fillStyle = '#a9bad1'; x.beginPath();
            for (let i = 0; i < 3; i++) { const ox = (r() - 0.5) * 6, oy = (r() - 0.5) * 6, rr = cell * (0.62 + r() * 0.1); x.moveTo(ox + rr, oy); x.ellipse(ox, oy, rr, rr * 0.9, 0, 0, Math.PI * 2); }
            x.fill();
            x.fillStyle = 'rgba(132,152,184,0.55)'; for (let i = 0; i < 3; i++) x.fillRect((r() - 0.5) * 30, (r() - 0.5) * 30, 2.4, 1.6);   // packed-snow grit
          });
        }
      }
      for (let q = 0; q <= 3; q++) {
        S[3][q] = []; S[4][q] = [];
        for (let v = 0; v < 4; v++) {
          const bl = blobs(0.5 + 0.5 * q / 3, v + 4, true);
          S[3][q][v] = q === 0 ? null : mk((x) => { x.fillStyle = 'rgba(128,156,204,0.95)'; fillBlobs(x, bl, 4, 0.6); });
          S[4][q][v] = q === 0 ? null : mk((x) => {
            x.fillStyle = '#ffffff'; fillBlobs(x, bl, 0, 0);
            x.fillStyle = 'rgba(214,228,248,1)'; x.beginPath(); for (const b of bl) { x.moveTo(b.x + b.rx * 0.75, b.y + b.ry * 0.3); x.ellipse(b.x, b.y + b.ry * 0.3, b.rx * 0.75, b.ry * 0.5, 0, 0, Math.PI); } x.fill();
          });
        }
      }
    }
    this.sprites = out;
  },
  codeOf(L, i) {
    const qc = Math.round(U.clamp(L.c[i], 0, 1) * 4);
    return L.area === 'snow' ? qc * 4 + Math.round(U.clamp(L.b[i], 0, 1) * 3) : qc;
  },
  // a cell's state changed: it and its neighbours (whose sprites overlap it) need a redraw
  touch(L, i) {
    if (!L.act[i]) { L.act[i] = 1; L.active.push(i); }
    const code = this.codeOf(L, i);
    if (code === L.code[i]) return;
    L.code[i] = code;
    const k = i % L.cols, r = (i - k) / L.cols;
    for (let dr = -1; dr <= 1; dr++) for (let dk = -1; dk <= 1; dk++) {
      const kk = k + dk, rr = r + dr; if (kk < 0 || rr < 0 || kk >= L.cols || rr >= L.rows) continue;
      const j = rr * L.cols + kk; if (!L.dirty[j]) { L.dirty[j] = 1; L.dirtyList.push(j); }
    }
  },
  ensureCanvas(L) {
    if (L.canvas) return;
    if (!this.sprites) this.buildSprites();
    const c = document.createElement('canvas');
    c.width = Math.ceil(L.cols * L.cp); c.height = Math.ceil(L.rows * L.cp);
    L.canvas = c; L.ctx = c.getContext('2d'); L.painted = false;
    L.paintRow = 0;
    c.addEventListener('contextlost', (e) => { e.preventDefault(); L.painted = false; L.paintRow = 0; });
    c.addEventListener('contextrestored', () => { L.painted = false; L.paintRow = 0; });
  },
  spriteList(L, i) {
    const S = this.sprites[L.area], v = Math.floor(this.hash(i) * 4) & 3, qc = L.code[i] >> (L.area === 'snow' ? 2 : 0), qb = L.area === 'snow' ? L.code[i] & 3 : 0;
    const own = L.draw[i];
    return [S[0][qc] && S[0][qc][v], own ? S[1][qc][v] : null, own ? S[2][qc][v] : null, qb ? S[3][qb][v] : null, qb ? S[4][qb][v] : null];
  },
  // the whole layer, a band of rows at a time (every sprite of the band and the row either side, pass by pass, clipped
  // to the band, then the cuts), so a first paint is spread over a few steps and never stalls a frame
  paintBand(L, rows) {
    this.ensureCanvas(L);
    if (L.painted) return;
    const ctx = L.ctx, cp = L.cp, r0 = L.paintRow, r1 = Math.min(L.rows, r0 + rows), W = L.canvas.width;
    const clip = { x0: 0, y0: r0 * cp, x1: W, y1: r1 * cp };
    ctx.save(); ctx.beginPath(); ctx.rect(0, clip.y0, W, clip.y1 - clip.y0); ctx.clip();
    ctx.clearRect(0, clip.y0, W, clip.y1 - clip.y0);
    const ra = Math.max(0, r0 - 1), rb = Math.min(L.rows - 1, r1), lists = [];
    for (let r = ra; r <= rb; r++) for (let k = 0; k < L.cols; k++) { const i = r * L.cols + k; lists.push(i, this.spriteList(L, i)); }
    for (let pass = 0; pass < this.PASSES; pass++) for (let n = 0; n < lists.length; n += 2) {
      const sp = lists[n + 1][pass]; if (!sp) continue;
      const i = lists[n], k = i % L.cols, r = (i - k) / L.cols;
      ctx.drawImage(sp, (k - 0.5) * cp, (r - 0.5) * cp);
    }
    const res = CFG.SNOWPLOW.RES;
    for (const q of L.cuts) if ((q.y1 - L.y0) * res > clip.y0 && (q.y0 - L.y0) * res < clip.y1) this.cutShape(L, q, clip);
    ctx.restore();
    L.paintRow = r1;
    if (r1 >= L.rows) { L.painted = true; L.paintRow = 0; }
  },
  paintAll(L) { this.ensureCanvas(L); while (!L.painted) this.paintBand(L, 16); },
  cutShape(L, q, clip) {
    const ctx = L.ctx, res = CFG.SNOWPLOW.RES;
    const x0 = (q.x0 - L.x0) * res, y0 = (q.y0 - L.y0) * res, x1 = (q.x1 - L.x0) * res, y1 = (q.y1 - L.y0) * res;
    if (!q.ell) {
      const a = clip ? Math.max(x0, clip.x0) : x0, b = clip ? Math.max(y0, clip.y0) : y0, c = clip ? Math.min(x1, clip.x1) : x1, d = clip ? Math.min(y1, clip.y1) : y1;
      if (c > a && d > b) ctx.clearRect(a, b, c - a, d - b);
      return;
    }
    ctx.save();
    ctx.beginPath();
    if (clip) { ctx.rect(clip.x0, clip.y0, clip.x1 - clip.x0, clip.y1 - clip.y0); ctx.clip(); ctx.beginPath(); }
    ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, 0, 0, Math.PI * 2);
    ctx.clip(); ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
  },
  redrawCell(L, i) {
    const ctx = L.ctx, cp = L.cp, k = i % L.cols, r = (i - k) / L.cols, px = k * cp, py = r * cp;
    ctx.clearRect(px, py, cp, cp);
    const nb = [];
    for (let dr = -1; dr <= 1; dr++) for (let dk = -1; dk <= 1; dk++) {
      const kk = k + dk, rr = r + dr; if (kk < 0 || rr < 0 || kk >= L.cols || rr >= L.rows) continue;
      const j = rr * L.cols + kk; nb.push(j, this.spriteList(L, j));
    }
    for (let pass = 0; pass < this.PASSES; pass++) for (let n = 0; n < nb.length; n += 2) {
      const sp = nb[n + 1][pass]; if (!sp) continue;
      const j = nb[n], jk = j % L.cols, jr = (j - jk) / L.cols;
      const sx0 = (jk - 0.5) * cp, sy0 = (jr - 0.5) * cp;            // the sprite's top-left on the canvas
      const ax = Math.max(px, sx0), ay = Math.max(py, sy0), bx = Math.min(px + cp, sx0 + sp.width), by = Math.min(py + cp, sy0 + sp.height);
      if (bx <= ax || by <= ay) continue;
      ctx.drawImage(sp, ax - sx0, ay - sy0, bx - ax, by - ay, ax, ay, bx - ax, by - ay);
    }
    const cuts = L.cellCuts.get(i);
    if (cuts) { const clip = { x0: px, y0: py, x1: px + cp, y1: py + cp }; for (const qi of cuts) this.cutShape(L, L.cuts[qi], clip); }
  },
  flushDirty(L, budget) {
    if (L.dirtyList.length > 1500) { L.painted = false; L.paintRow = 0; for (const j of L.dirtyList) L.dirty[j] = 0; L.dirtyList.length = 0; }
    if (!L.painted) this.paintAll(L);
    let n = 0;
    while (L.dirtyList.length && n < budget) { const i = L.dirtyList.pop(); if (!L.dirty[i]) continue; L.dirty[i] = 0; this.redrawCell(L, i); n++; }
  },
  // set a cell's cleared amount / bank and note the change
  setCell(L, i, c, b) { L.c[i] = c; if (b !== undefined) L.b[i] = b; this.touch(L, i); },
  // refill plowed cells (and settle banks) by `fill` / `settle` this step; forget the cells that are back to fresh
  stepActive(L, fill, settle) {
    const A = L.active;
    for (let n = A.length - 1; n >= 0; n--) {
      const i = A[n];
      if (fill > 0 && L.c[i] > 0) L.c[i] = Math.max(0, L.c[i] - fill);
      if (settle > 0 && L.b[i] > 0) L.b[i] = Math.max(0, L.b[i] - settle);
      const code = this.codeOf(L, i);
      if (code !== L.code[i]) { L.act[i] = 1; this.touch(L, i); }
      if (L.c[i] <= 0 && L.b[i] <= 0) { L.act[i] = 0; A[n] = A[A.length - 1]; A.pop(); }
    }
  },

  // which place an area belongs to (an interior counts as its town: the Cocoa Cabin is still Snowy Peak)
  placeOf(area) {
    if (typeof WorldMapExt !== 'undefined' && WorldMapExt.placeOf) return WorldMapExt.placeOf(area) || area;
    return { cocoacabin: 'snow', mines: 'site', diner: 'site', hardware: 'site' }[area] || area;
  },
  // fresh snow over every plowed cell of a map (and its banks, piles and tyre marks)
  refresh(area) {
    const L = this.layers[area], st = this.st;
    for (const i of L.active.slice()) this.setCell(L, i, 0, 0);
    this.stepActive(L, 0, 0);
    st.stamps = st.stamps.filter((s) => s.area !== area);
    if (area === 'site') { st.piles = []; st.carry = 0; }
  },

  // ---------- game hooks ----------
  vehicles(g) { this.ensure(g); return g.area === 'snow' ? [this.v] : []; },

  update(g, dt) {
    this.ensure(g);
    const st = this.st;
    st.time += dt;
    // leaving a place: its plowed roads fill in with fresh snow (they stay clear while the chef is still there)
    const place = g.travel ? null : this.placeOf(g.area);
    if (place !== st.place) {
      if (st.place === 'snow') this.refresh('snow');
      if (st.place === 'site') this.refresh('site');
      st.place = place;
    }
    this.updateSite(g, dt);
    this.updatePeak(g, dt);
    // paint a layer ahead of time, a band per step: the site's while it snows, Snowy Peak's on the way there
    if (typeof document !== 'undefined') {
      const to = g.travel ? g.travel.to : g.area, L = this.layers[to];
      if (L && !L.painted && (to === 'snow' || st.level > 0)) this.paintBand(L, 8);
    }
    // spray and tyre stamps age
    for (const p of st.spray) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 260 * dt; }
    st.spray = st.spray.filter((p) => p.t < p.dur && p.z > -2);
    for (const s of st.stamps) s.t += dt;
    while (st.stamps.length && (st.stamps[0].t > st.stamps[0].dur)) st.stamps.shift();
    if (st.stamps.length > CFG.SNOWPLOW.STAMPS) st.stamps.splice(0, st.stamps.length - CFG.SNOWPLOW.STAMPS);
  },

  // ---- Construction Town: the snow cover, the bulldozer's blade, tyre tracks
  updateSite(g, dt) {
    const P = CFG.SNOWPLOW, st = this.st, L = this.layers.site, k = this.siteSnowing();
    const was = st.level;
    if (k > 0) st.level = Math.min(1, st.level + k * dt / P.FALL);
    else st.level = Math.max(0, st.level - dt / P.MELT);
    // all melted: the ground is bare, so every plowed cell starts fresh for the next shower
    if (st.level <= 0 && was > 0) {
      for (const i of L.active.slice()) this.setCell(L, i, 0);
      this.stepActive(L, 0, 0);
      st.piles = []; st.carry = 0; st.stamps = st.stamps.filter((s) => s.area !== 'site');
    }
    // piles melt with the rest (a little slower than flat snow; they never outlast the cover by much)
    if (k <= 0) for (const p of st.piles) p.size -= dt * Math.max(0.6, p.size0) / (P.MELT * 0.9);
    st.piles = st.piles.filter((p) => p.size > 0.25);
    const dz = g.bulldozer;
    if (!dz) return;
    const riding = g.driving && g.vehicle === dz && g.area === 'site';
    if (!riding) { if (st.carry > 0) this.dropPile(dz); st.angHist.length = 0; }
    else this.stepDozer(g, dz, dt);
    if (g.area === 'site' && g.driving && st.level > 0.15) {
      const v = g.vehicle, half = { dumptruck: 22, excavator: 20, mixer: 21, cranetruck: 22 }[v.kind];
      if (half) this.stamp(g, 'site', v, half, 40);
    }
  },
  stepDozer(g, v, dt) {
    const P = CFG.SNOWPLOW, st = this.st, L = this.layers.site;
    const ca = Math.cos(v.angle), sa = Math.sin(v.angle), fwd = v.vx * ca + v.vy * sa;
    // turning hard or stopping leaves the pile behind
    st.angHist.push({ t: st.time, a: v.angle });
    while (st.angHist.length && st.time - st.angHist[0].t > 0.4) st.angHist.shift();
    let turn = 0; if (st.angHist.length > 1) { let d = v.angle - st.angHist[0].a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; turn = Math.abs(d); }
    st.still = fwd < 12 ? st.still + dt : 0;
    if (st.carry > 0 && (st.still > 0.25 || turn > 0.75)) this.dropPile(v);
    if (fwd < 25 || st.level < 0.05) return;
    const B = P.DOZER_BLADE;
    let got = 0;
    for (const lx of B.xs) for (const ly of B.ys) {
      const w = this.world(v, lx, ly), i = this.cellAt(L, w.x, w.y);
      if (i < 0 || !L.mask[i] || L.c[i] >= 0.99) continue;
      got += (1 - L.c[i]) * st.level; this.setCell(L, i, 1);
      st.cleared++;
    }
    if (got > 0) {
      st.carry = Math.min(P.PILE_CAP, st.carry + got);
      // a little spray off both ends of the blade
      for (const s of [-1, 1]) if (Math.random() < 0.6) { const e = this.world(v, 50, s * 32); this.puff(e.x, e.y, ca * 40 - sa * s * 70, sa * 40 + ca * s * 70, 1); }
      if (st.cleared - st.clearedSay >= 30 && st.time - st.sayT > 10) {
        st.clearedSay = st.cleared; st.sayT = st.time;
        g.floats.push({ x: v.x, y: v.y - 58, text: 'Plowed! ❄️', color: '#ffffff', t: 0, dur: 1.3, big: true });
      }
    }
  },
  dropPile(v) {
    const P = CFG.SNOWPLOW, st = this.st, n = st.carry; st.carry = 0;
    if (n < 0.4) return;
    const pos = this.world(v, 50 + this.pileR(n) * 0.6, 0);
    const near = st.piles.find((p) => U.dist(p.x, p.y, pos.x, pos.y) < 30);
    if (near) { near.size = Math.min(P.PILE_CAP * 1.6, near.size + n); near.size0 = Math.max(near.size0, near.size); return; }
    st.piles.push({ x: pos.x, y: pos.y, size: n, size0: n, seed: Math.random() * 10 });
    if (st.piles.length > P.PILE_MAX) { st.piles.sort((a, b) => b.size - a.size); st.piles.length = P.PILE_MAX; }
  },
  pileR(n) { return 9 + 15 * Math.sqrt(Math.min(n, CFG.SNOWPLOW.PILE_CAP * 1.6) / CFG.SNOWPLOW.PILE_CAP); },
  puff(x, y, vx, vy, n) {
    const st = this.st; if (st.spray.length > 90) return;
    for (let i = 0; i < n; i++) st.spray.push({ x: x + U.rand(-4, 4), y: y + U.rand(-4, 4), z: U.rand(2, 8), vx: vx * U.rand(0.6, 1.2), vy: vy * U.rand(0.6, 1.2), vz: U.rand(60, 130), t: 0, dur: U.rand(0.35, 0.6), r: U.rand(2, 4.2) });
  },
  // tyre marks: a pair of short quads under the wheels every 12 px of travel
  stamp(g, area, v, half, dur) {
    const st = this.st, key = v.kind + (v === this.v ? 'p' : ''), last = st.last[key];
    if (Math.hypot(v.vx, v.vy) < 20) return;
    if (last && last.area === area && U.dist(last.x, last.y, v.x, v.y) < 12) return;
    st.last[key] = { x: v.x, y: v.y, area };
    if (area === 'site' && this.depthAt('site', v.x, v.y) < 0.2) return;
    const pts = [];
    for (const s of [-1, 1]) {
      for (const [lx, ly] of [[-5, s * half - 4], [5, s * half - 4], [5, s * half + 4], [-5, s * half + 4]]) { const w = this.world(v, lx - 20, ly); pts.push(w.x, w.y); }
    }
    st.stamps.push({ area, pts, x: v.x, y: v.y, t: 0, dur });
  },

  // ---- Snowy Peak: the plow
  updatePeak(g, dt) {
    const P = CFG.SNOWPLOW, st = this.st, L = this.layers.snow, v = this.v;
    const riding = this.riding(g);
    v.flash += dt * (riding ? 1 : 0.5);
    if (g.area !== 'snow' || g.travel) return;
    // rescue: a plow (with or without the chef) stuck inside a tree or a hut goes back to its spot
    const obs = typeof SnowExt !== 'undefined' && SnowExt.st ? SnowExt.st.obs : [];
    if (obs.some((o) => g.hitRect(v.x, v.y, 10, o))) {
      const S = P.SPOT; v.x = S.x; v.y = S.y; v.angle = S.angle; v.vx = 0; v.vy = 0;
      if (riding) { g.player.x = v.x; g.player.y = v.y; g.cameraSnap = true; }
      return;
    }
    if (!riding) return;
    const ca = Math.cos(v.angle), sa = Math.sin(v.angle), fwd = v.vx * ca + v.vy * sa;
    if (fwd < 25) return;
    this.stamp(g, 'snow', v, 27, 60);
    const B = P.PLOW_BLADE, hit = new Set();
    let fresh = 0;
    for (const lx of B.xs) for (const ly of B.ys) {
      const w = this.world(v, lx, ly), i = this.cellAt(L, w.x, w.y);
      if (i < 0 || !L.mask[i] || hit.has(i)) continue;
      hit.add(i);
      if (L.c[i] < 0.5) fresh++;
      if (L.c[i] < 0.99 || L.b[i] > 0) this.setCell(L, i, 1, 0);
    }
    // the snow rolls off the blade into little banks along both sides of the road
    for (const [lx, ly, amt] of P.PLOW_BANKS) {
      const w = this.world(v, lx, ly), i = this.cellAt(L, w.x, w.y);
      if (i < 0 || !L.mask[i] || hit.has(i) || L.c[i] > 0.3) continue;
      if (fresh > 0 && L.b[i] < 1) this.setCell(L, i, L.c[i], Math.min(1, L.b[i] + amt));
    }
    if (fresh > 0) {
      st.peakCleared += fresh;
      // spray off the blade's trailing (right-hand) end, flying out to the side
      const e = this.world(v, 54, 48);
      this.puff(e.x, e.y, ca * 30 - sa * 150, sa * 30 + ca * 150, 2);
      if (st.time - st.whooshT > 4) { st.whooshT = st.time; Sfx.chuff(1.4); }
      if (st.peakCleared - st.peakSay >= 40 && st.time - st.peakSayT > 12) {
        st.peakSay = st.peakCleared; st.peakSayT = st.time;
        g.floats.push({ x: v.x, y: v.y - 64, text: 'Whoosh! ❄️', color: '#ffffff', t: 0, dur: 1.3, big: true });
      }
    }
  },

  hint(g) {
    this.ensure(g);
    if (this.busy(g)) return undefined;
    const p = g.player, P = CFG.SNOWPLOW;
    if (g.area === 'snow') {
      if (this.riding(g)) {
        const S = CFG.SNOW, L = S.SLOPE, v = this.v;
        if (v.x > L.x0 && v.x < L.x1 && v.y > L.y0 && v.y < L.y1) return { text: 'Vroom! Plow the flat snow at the bottom 🚜', target: null };
        return { text: 'Plow snowy roads! 🚜❄️', target: null };
      }
      if (g.driving || (typeof SnowExt !== 'undefined' && SnowExt.st && SnowExt.st.ball)) return undefined;   // rolling a snowball: its hints
      if (U.dist(p.x, p.y, this.v.x, this.v.y) < P.NEAR) return { text: 'Drive the snow plow! 🚜', target: this.v };
      return undefined;
    }
    if (g.area === 'site' && this.st.level > 0.15) {
      const dz = g.bulldozer; if (!dz) return undefined;
      if (g.driving) return g.vehicle === dz ? { text: 'Push the snow into big piles! ❄️', target: null } : undefined;
      if (U.dist(p.x, p.y, dz.x, dz.y) < P.DOZER_NEAR) return { text: 'Plow the snow with the bulldozer! ❄️', target: null };
    }
    return undefined;
  },

  home(g) {
    this.ensure(g);
    const S = CFG.SNOWPLOW.SPOT, v = this.v;
    v.x = S.x; v.y = S.y; v.angle = S.angle; v.vx = 0; v.vy = 0;
    this.st.carry = 0; this.st.spray = []; this.st.angHist = []; this.st.last = {};
  },

  // ---------------- drawing ----------------
  // the ground layer (under people, vehicles and the other extensions' ground art)
  dynamic(r, g) {
    if (!this.layers || this.off || g.travel) return;
    const ctx = r.ctx;
    if (g.area === 'site') {
      const a = this.coverAlpha(), L = this.layers.site;
      if (a <= 0 && !L.dirtyList.length) return;
      this.ensureCanvas(L);
      this.flushDirty(L, a > 0 ? CFG.SNOWPLOW.BUDGET : 400);
      if (a <= 0) return;
      this.drawLayer(r, L, a);
      // dirt piles poke out of the snow with a white cap
      ctx.globalAlpha = a; ctx.fillStyle = '#f6faff';
      for (const m of g.mounds) {
        if (m.flat) continue;
        ctx.beginPath(); ctx.ellipse(m.x - m.r * 0.15, m.y - m.r * 0.36, m.r * 0.56, m.r * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      this.drawStamps(r, g, 'site', a);
      this.drawCoins(r, g);
      return;
    }
    if (g.area === 'snow') {
      const L = this.layers.snow;
      this.ensureCanvas(L);
      this.flushDirty(L, CFG.SNOWPLOW.BUDGET);
      this.drawLayer(r, L, 1);
      this.drawStamps(r, g, 'snow', 1);
    }
  },
  // the site's spinning coins lie on the ground under the cover: draw them again on top of it (the core's look)
  drawCoins(r, g) {
    const ctx = r.ctx, W = CFG.SITE.WORLD;
    for (const c of g.coins) {
      if (c.taken || c.x < W.x0 || c.x > W.x1 || c.y < W.y0 || c.y > W.y1) continue;
      const t = g.time * 3 + c.phase, w = Math.abs(Math.cos(t)) * 11 + 2, lift = Math.sin(t * 0.7) * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c99a1e'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 8 + lift + 2, w, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 8 + lift, w, 12, 0, 0, Math.PI * 2); ctx.fill();
      if (w > 6) { ctx.fillStyle = '#c99a1e'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', c.x, c.y - 7 + lift); }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(c.x - w * 0.4, c.y - 13 + lift, 2, 0, Math.PI * 2); ctx.fill();
    }
  },
  // only the part of the layer's canvas that is on screen
  drawLayer(r, L, alpha) {
    const ctx = r.ctx, res = CFG.SNOWPLOW.RES, W = L.cols * L.cell, H = L.rows * L.cell;
    const x0 = Math.max(L.x0, r.camX - 4), y0 = Math.max(L.y0, r.camY - 4), x1 = Math.min(L.x0 + W, r.camX + r.viewW + 4), y1 = Math.min(L.y0 + H, r.camY + r.viewH + 4);
    if (x1 <= x0 || y1 <= y0) return;
    const sx = Math.floor((x0 - L.x0) * res), sy = Math.floor((y0 - L.y0) * res), sw = Math.min(L.canvas.width - sx, Math.ceil((x1 - x0) * res) + 2), sh = Math.min(L.canvas.height - sy, Math.ceil((y1 - y0) * res) + 2);
    if (sw <= 0 || sh <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(L.canvas, sx, sy, sw, sh, L.x0 + sx / res, L.y0 + sy / res, sw / res, sh / res);
    ctx.globalAlpha = 1;
  },
  drawStamps(r, g, area, alpha) {
    const ctx = r.ctx, st = this.st, x0 = r.camX - 40, x1 = r.camX + r.viewW + 40, y0 = r.camY - 40, y1 = r.camY + r.viewH + 40;
    const col = area === 'site' ? [118, 100, 80] : [120, 142, 176];
    for (let b = 0; b < 4; b++) {
      let any = false;
      ctx.beginPath();
      for (const s of st.stamps) {
        if (s.area !== area || s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue;
        if (Math.min(3, Math.floor((s.t / s.dur) * 4)) !== b) continue;
        const p = s.pts; any = true;
        ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]); ctx.lineTo(p[6], p[7]); ctx.closePath();
        ctx.moveTo(p[8], p[9]); ctx.lineTo(p[10], p[11]); ctx.lineTo(p[12], p[13]); ctx.lineTo(p[14], p[15]); ctx.closePath();
      }
      if (!any) continue;
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.38 * (1 - b / 4) * alpha).toFixed(3)})`; ctx.fill();
    }
  },

  entities(r, g, items) {
    if (!this.st || this.off) return;
    const st = this.st;
    if (g.area === 'site') {
      const a = this.coverAlpha(); if (a <= 0) return;
      const x0 = r.camX - 60, x1 = r.camX + r.viewW + 60, y0 = r.camY - 60, y1 = r.camY + r.viewH + 80;
      for (const p of st.piles) if (p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1) items.push({ y: p.y, draw: () => this.drawPile(r.ctx, p.x, p.y, this.pileR(p.size), p.seed) });
      const dz = g.bulldozer;
      if (dz && st.carry > 0.3) { const rr = this.pileR(st.carry), w = this.world(dz, 50 + rr * 0.6, 0); items.push({ y: w.y + 1, draw: () => this.drawPile(r.ctx, w.x, w.y, rr, 3) }); }
      return;
    }
    if (g.area !== 'snow' || !this.v) return;
    const v = this.v;
    items.push({ y: v.y + 14, draw: () => this.drawRide(r, g) });
  },
  drawPile(ctx, x, y, s, seed) {
    ctx.fillStyle = 'rgba(90,120,170,0.25)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 3, s * 1.1, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9d8ee'; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f8ff'; ctx.beginPath();
    ctx.ellipse(x - s * 0.08, y - s * 0.22, s * 0.86, s * 0.5, 0, 0, Math.PI * 2);
    const a = (seed || 0) * 2.1;
    ctx.moveTo(x + s * 0.7, y - s * 0.3); ctx.arc(x + s * 0.32 + Math.cos(a) * 2, y - s * 0.32, s * 0.38, 0, Math.PI * 2);
    ctx.moveTo(x - s * 0.1, y - s * 0.55); ctx.arc(x - s * 0.36, y - s * 0.4 + Math.sin(a) * 2, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - s * 0.25, y - s * 0.5, s * 0.32, s * 0.16, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,190,230,0.8)'; ctx.fillRect(x + s * 0.3, y - s * 0.2, 2, 2); ctx.fillRect(x - s * 0.5, y - s * 0.05, 2, 2);
  },
  drawRide(r, g) {
    const ctx = r.ctx, v = this.v, riding = this.riding(g);
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    r.drawVehicle('snowplow', g, g.s.paint && g.s.paint.snowplow, v);
    if (riding) {   // the chef's head and hat under the cab's glass roof
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(14, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(17, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(15, 0, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // the amber beacon's glow, straight up the screen
    const lamp = this.world(v, 0, 0), on = Math.floor(v.flash * 4) % 2 === 0;
    if (on) { ctx.fillStyle = 'rgba(255,186,40,0.28)'; ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 16, 0, Math.PI * 2); ctx.fill(); }
    r.drawRidingExtras(g, v, 44);
  },
  // snow spray (world space, over everything)
  overlay(r, g) {
    if (!this.st || !this.st.spray.length || this.off) return;
    const ctx = r.ctx;
    for (const p of this.st.spray) {
      const k = p.t / p.dur;
      ctx.globalAlpha = 0.9 * (1 - k);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y - p.z, p.r * (1 + k * 0.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // the snow plow truck, nose +x: angled steel blade, orange cab with an amber beacon, a sand hopper, chained tyres
  vehicleArt: {
    snowplow(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#ff8c1a', dark = '#c25e00', t = v ? v.flash || 0 : g.time;
      h.shadow(112, 30);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(52, -42); ctx.lineTo(72, -40); ctx.lineTo(58, 44); ctx.lineTo(44, 42); ctx.closePath(); ctx.fill();
      // tyres with snow chains
      const tyre = (x, y) => {
        ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, x - 12, y - 7, 24, 14, 4); ctx.fill();
        ctx.strokeStyle = '#cfd6de'; ctx.lineWidth = 1.4; ctx.beginPath();
        for (let k = -9; k <= 9; k += 6) { ctx.moveTo(x + k - 2, y - 7); ctx.lineTo(x + k + 2, y + 7); }
        ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.stroke();
      };
      for (const x of [-30, -8, 26]) { tyre(x, -26); tyre(x, 26); }
      // chassis
      ctx.fillStyle = '#4a4f57'; U.roundRect(ctx, -54, -20, 104, 40, 6); ctx.fill();
      // the sand hopper at the back: an orange V-box with grey grit and a spinner
      ctx.fillStyle = c; U.roundRect(ctx, -56, -25, 52, 50, 7); ctx.fill();
      ctx.fillStyle = dark; U.roundRect(ctx, -52, -21, 44, 42, 5); ctx.fill();
      ctx.fillStyle = '#9b938a'; U.roundRect(ctx, -49, -17, 38, 34, 4); ctx.fill();
      ctx.fillStyle = '#b8b0a6'; for (let i = 0; i < 9; i++) ctx.fillRect(-46 + ((i * 13) % 32), -14 + ((i * 7) % 28), 3, 3);
      ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(-60, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff3b3b'; U.roundRect(ctx, -58, -24, 4, 7, 1); ctx.fill(); U.roundRect(ctx, -58, 17, 4, 7, 1); ctx.fill();   // tail lights
      // the cab: chunky orange, a glass roof where the driver sits, windscreen at the front
      ctx.fillStyle = c; U.roundRect(ctx, -4, -24, 40, 48, 8); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, -4, 16, 40, 8, 4); ctx.fill();
      ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 4, -15, 22, 30, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(7, -12, 3, 18);
      ctx.fillStyle = '#7fb6e0'; U.roundRect(ctx, 29, -18, 5, 36, 2); ctx.fill();
      // the hood and grille
      ctx.fillStyle = c; U.roundRect(ctx, 34, -18, 14, 36, 4); ctx.fill();
      ctx.fillStyle = '#2b2b2b'; for (let k = -12; k <= 10; k += 5) ctx.fillRect(44, k, 3, 3);
      ctx.fillStyle = '#fff6b0'; U.roundRect(ctx, 45, -17, 4, 6, 1); ctx.fill(); U.roundRect(ctx, 45, 11, 4, 6, 1); ctx.fill();
      // the amber beacon on the cab roof, flashing
      const on = Math.floor(t * 4) % 2 === 0;
      ctx.fillStyle = '#5c5c5c'; U.roundRect(ctx, -5, -7, 8, 14, 3); ctx.fill();
      ctx.fillStyle = on ? '#ffc21a' : '#b07400'; ctx.beginPath(); ctx.arc(-1, 0, 5, 0, Math.PI * 2); ctx.fill();
      if (on) { ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(-2.5, -1.5, 1.8, 0, Math.PI * 2); ctx.fill(); }
      // push frame and the big angled blade (the right-hand end trails, so the snow rolls off that side): a curved
      // steel moldboard, darker underneath, a bright top edge, red-and-white markers
      ctx.fillStyle = '#3d4248'; ctx.fillRect(46, -14, 12, 7); ctx.fillRect(46, 7, 12, 7); ctx.fillRect(50, -3, 8, 6);
      ctx.fillStyle = '#4b545d'; ctx.beginPath(); ctx.moveTo(56, -46); ctx.lineTo(70, -46); ctx.lineTo(56, 46); ctx.lineTo(42, 46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9aa5b0'; ctx.beginPath(); ctx.moveTo(58, -46); ctx.lineTo(68, -46); ctx.lineTo(54, 46); ctx.lineTo(44, 46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9d1d9'; ctx.beginPath(); ctx.moveTo(62, -46); ctx.lineTo(67, -46); ctx.lineTo(53, 46); ctx.lineTo(48, 46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2f5f8'; ctx.beginPath(); ctx.moveTo(66, -46); ctx.lineTo(68, -46); ctx.lineTo(54, 46); ctx.lineTo(52, 46); ctx.closePath(); ctx.fill();
      for (const f of [0.02, 0.98]) { const x = U.lerp(62, 48, f), y = U.lerp(-46, 46, f); ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 3, y - (f < 0.5 ? 0 : 6), 7, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, y - (f < 0.5 ? -6 : 12), 7, 6); }
      // blade guide poles with orange tips at both ends
      for (const [x, y] of [[66, -46], [52, 46]]) { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
      // the name along the side, kept the right way up
      const ca = v ? Math.cos(v.angle) : 1, sa = v ? Math.sin(v.angle) : 0;
      if (Math.abs(ca) >= Math.abs(sa)) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(-30, 21.5); if (ca < 0) ctx.rotate(Math.PI); ctx.fillText('SNOW PLOW', 0, 0); ctx.restore(); }
    },
  },
};
Game.ext.unshift(SnowPlowExt);
Render.ext.unshift(SnowPlowExt);
