'use strict';
// Canvas renderer. Everything is drawn procedurally (no image assets).
// Static scenery is pre-rendered into an offscreen canvas and re-built only when the shop changes
// (unlocks, decorations) or the zoom level changes a lot; dynamic things are drawn every frame.
const Render = {
  canvas: null, ctx: null, scale: 1, baseScale: 1, fitScale: 1, dpr: 1, zoom: 1,
  viewW: CFG.W, viewH: CFG.H, camX: 0, camY: 0,
  MIN_VIEW_W: 440, MIN_VIEW_H: 420, MIN_ZOOMED_VIEW: 330, FULL_MAP_MIN_SCALE: 0.9, HUD_PAD_PX: 56,
  ZOOM_KEY: 'pizza-rush-zoom',
  bgs: null, bgRes: 1, zoomLabelT: 0,
  ext: [],   // feature extensions with optional draw hooks (see js/city.js etc.)

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    if (this.isSmallScreen()) {
      // Phones always start at the closest zoom level; pinch out to see more.
      this.zoom = this.maxScale() / this.baseScale;
    } else {
      try { const z = parseFloat(localStorage.getItem(this.ZOOM_KEY)); if (z > 0.3 && z < 4) this.zoom = z; } catch (e) { /* ignore */ }
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  isSmallScreen() { return Math.min(window.innerWidth / CFG.W, window.innerHeight / CFG.H) < this.FULL_MAP_MIN_SCALE; },
  // Closest allowed zoom: keep at least MIN_ZOOMED_VIEW logical px visible on each axis.
  maxScale() { return Math.min(window.innerWidth / this.MIN_ZOOMED_VIEW, window.innerHeight / this.MIN_ZOOMED_VIEW, 3.2); },

  resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // Fit the whole map when the screen allows it; on small screens zoom in so characters stay readable
    // and let the camera follow. The user's pinch zoom multiplies on top of that.
    const fit = Math.min(vw / CFG.W, vh / CFG.H);
    this.fitScale = fit;
    this.baseScale = fit >= this.FULL_MAP_MIN_SCALE ? fit : Math.min(this.FULL_MAP_MIN_SCALE, Math.max(fit, Math.min(vw / this.MIN_VIEW_W, vh / this.MIN_VIEW_H)));
    this.scale = U.clamp(this.baseScale * this.zoom, fit * 0.8, Math.max(fit, this.maxScale()));
    const W = CFG.WORLD;
    this.viewW = Math.min(W.x1 - W.x0, vw / this.scale);
    this.viewH = Math.min(W.y1 - W.y0, vh / this.scale);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.floor(this.viewW * this.scale), ch = Math.floor(this.viewH * this.scale);
    this.canvas.style.width = cw + 'px'; this.canvas.style.height = ch + 'px';
    this.canvas.width = Math.floor(cw * this.dpr); this.canvas.height = Math.floor(ch * this.dpr);
  },

  setZoom(z) {
    const minZ = (this.fitScale * 0.8) / this.baseScale, maxZ = Math.max(this.fitScale, this.maxScale()) / this.baseScale;
    const nz = U.clamp(z, minZ, maxZ);
    if (Math.abs(nz - this.zoom) < 0.001) return;
    this.zoom = nz; this.zoomLabelT = 1.2;
    this.resize();
    try { localStorage.setItem(this.ZOOM_KEY, String(this.zoom)); } catch (e) { /* ignore */ }
  },

  // Camera follows the player only along axes where the map is larger than the view.
  updateCamera(g, snap) {
    const W = g.bounds();
    if (g.cameraSnap) { snap = true; g.cameraSnap = false; }
    // A map smaller than the view (a shop interior, say) sits centred on the screen instead of pinned to a corner.
    const mw = W.x1 - W.x0, mh = W.y1 - W.y0;
    const tx = mw < this.viewW ? W.x0 - (this.viewW - mw) / 2 : U.clamp(g.player.x - this.viewW / 2, W.x0, W.x1 - this.viewW);
    // Let the world scroll a little below the HUD so the top edge is never hidden under it.
    const hudPad = this.HUD_PAD_PX / this.scale;
    // Riding the train, lift the camera so the train sits well down the screen with mountains above the tracks.
    const minY = g.onTrain ? Math.min(W.y0 - hudPad, g.player.y - this.viewH * 0.4) : W.y0 - hudPad;
    const ty = mh + hudPad < this.viewH ? W.y0 - (this.viewH - mh) / 2 : U.clamp(g.player.y - this.viewH / 2, minY, W.y1 - this.viewH);
    if (snap) { this.camX = tx; this.camY = ty; return; }
    this.camX = U.lerp(this.camX, tx, 0.12);
    this.camY = U.lerp(this.camY, ty, 0.12);
  },

  toLogical(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (cx - rect.left) / this.scale + this.camX, y: (cy - rect.top) / this.scale + this.camY };
  },
  toScreen(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: cx - rect.left, y: cy - rect.top };
  },

  font(size, weight = 800) { return `${weight} ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`; },

  draw(g) {
    const ctx = this.ctx;
    this.updateCamera(g, false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (g.travel) { this.drawTravel(g); return; }
    ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, -this.camX * this.dpr * this.scale, -this.camY * this.dpr * this.scale);
    this.ensureBackground(g);
    const W = g.bounds();
    this.drawSkyline(g, W);
    ctx.drawImage(this.bgs[g.area].canvas, W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    this.drawOutsideDynamic(g);
    this.drawDecorDynamic(g);
    this.drawKitchenDynamic(g);
    this.drawCounterDynamic(g);
    this.drawDriveThruDynamic(g);
    this.drawTablesDynamic(g);
    this.drawPads(g);
    this.drawEntities(g);
    this.drawForeground(g);
    this.drawFx(g);
    this.drawFloats(g);
    for (const e of this.ext) if (e.overlay) e.overlay(this, g);        // world space
    this.drawHint(g);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    for (const e of this.ext) if (e.screen) e.screen(this, g);          // screen space (CSS px)
    this.drawOverlay();
  },

  // ======================= static background =======================
  // Browsers may throw away a big offscreen canvas while the tab is hidden (the map then draws as a blank brown
  // rectangle under the people and cars). Forget every cached map so the next frame paints it again.
  invalidateBackgrounds() { if (this.bgs) for (const k in this.bgs) this.bgs[k].key = null; },
  // A cached map's canvas tells us when the browser threw its pixels away (contextlost) and when it may be used again
  // (contextrestored): repaint it then. (Reading pixels back to check was too costly: it forced the browser to finish
  // every pending drawing at once and could switch the canvas to slow software drawing.)
  watchBackground(c) {
    c.canvas.addEventListener('contextlost', (e) => { e.preventDefault(); c.key = null; });
    c.canvas.addEventListener('contextrestored', () => { c.key = null; });
  },
  // One cached background per map (the town, Construction Town), rebuilt when its key changes.
  ensureBackground(g) {
    const W = g.bounds(), area = (W.x1 - W.x0) * (W.y1 - W.y0);
    const res = Math.min(U.clamp(this.dpr * this.scale, 1, 2), Math.sqrt(9e6 / area)); // keep the cached map under ~9M pixels
    const extKey = this.ext.map((e) => e.bgKey ? e.bgKey(g) : '').join(',');
    const key = (g.area !== 'town' ? [g.area, extKey] : [extKey, g.isUnlocked('dining'), g.isUnlocked('tables2'), g.isUnlocked('oven2'), g.isUnlocked('driveThru'), g.isUnlocked('station'), CFG.DECOR_ITEMS.map((it) => g.hasDecor(it.key) ? 1 : 0).join(''), g.s.iceCream.owned, Math.round(g.price())]).concat([Math.round(res * 4) / 4]).join('|');
    const now = performance.now();
    if (!this.bgs) this.bgs = {};
    let c = this.bgs[g.area];
    if (!c) { c = this.bgs[g.area] = { canvas: document.createElement('canvas'), key: null, builtAt: 0, res: 1 }; this.watchBackground(c); }
    if (c.key === key) return;
    // During a pinch the resolution changes continuously; rebuild at most every 150 ms.
    const stem = (k) => k.split('|').slice(0, -1).join('|');
    if (c.key && now - c.builtAt < 150 && stem(key) === stem(c.key)) return;
    c.key = key; c.builtAt = now; c.res = Math.round(res * 4) / 4; this.bgRes = c.res;
    c.canvas.width = Math.ceil((W.x1 - W.x0) * c.res); c.canvas.height = Math.ceil((W.y1 - W.y0) * c.res);
    const ctx = c.canvas.getContext('2d');
    ctx.setTransform(c.res, 0, 0, c.res, -W.x0 * c.res, -W.y0 * c.res);
    const main = this.ctx; this.ctx = ctx;
    if (g.area === 'site') this.paintSite(g);
    else if (g.area === 'town') this.paintBackground(g);
    else { const e = this.ext.find((x) => x.paint && x.paint[g.area]); if (e) e.paint[g.area](this, g); }
    for (const e of this.ext) if (e.paintAfter) e.paintAfter(this, g, g.area);   // extensions adding static art to any map
    this.ctx = main;
  },

  // Sky and mountains above the top edge of the map: seen when the camera lifts for a train ride.
  drawSkyline(g, W) {
    const A = CFG.AREAS[g.area];
    if (this.camY >= W.y0 || W.y1 - W.y0 < 700 || (A && A.noSky)) return;   // only the big outdoor maps have the mountains and sky above them
    const ctx = this.ctx, x0 = this.camX - 10, x1 = this.camX + this.viewW + 10, top = this.camY - 10, base = W.y0 + 1;
    const sky = ctx.createLinearGradient(0, top, 0, base); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(1, '#d9f0ff');
    ctx.fillStyle = sky; ctx.fillRect(x0, top, x1 - x0, base - top);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(x0 + this.viewW * 0.8, base - 230, 26, 0, Math.PI * 2); ctx.fill();
    // clouds drifting slowly
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) {
      const cx = x0 + (((i * 530 + g.time * 12) % (this.viewW + 300)) + this.viewW + 300) % (this.viewW + 300) - 150, cy = base - 300 + (i % 3) * 46;
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.arc(cx + 18, cy - 8, 20, 0, Math.PI * 2); ctx.arc(cx + 40, cy, 15, 0, Math.PI * 2); ctx.fill();
    }
    const range = (h, step, col, snow, off) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, base);
      const start = Math.floor(x0 / step) * step - step;
      for (let x = start; x <= x1 + step; x += step) {
        const k = Math.floor(x / step), peak = base - h * (0.6 + 0.4 * Math.abs(Math.sin(k * 7.3 + off)));
        ctx.lineTo(x, base - 10); ctx.lineTo(x + step / 2, peak);
      }
      ctx.lineTo(x1 + step * 2, base); ctx.closePath(); ctx.fill();
      if (snow) {
        ctx.fillStyle = '#fff';
        for (let x = start; x <= x1 + step; x += step) {
          const k = Math.floor(x / step), peak = base - h * (0.6 + 0.4 * Math.abs(Math.sin(k * 7.3 + off)));
          ctx.beginPath(); ctx.moveTo(x + step / 2, peak); ctx.lineTo(x + step / 2 + 22, peak + 26); ctx.lineTo(x + step / 2 + 6, peak + 22); ctx.lineTo(x + step / 2 - 6, peak + 30); ctx.lineTo(x + step / 2 - 22, peak + 26); ctx.closePath(); ctx.fill();
        }
      }
    };
    range(200, 260, '#7f8fb3', true, 0.3);
    range(130, 180, '#5f7f8f', false, 1.9);
    range(70, 120, '#4d8a56', false, 4.1);
  },

  paintBackground(g) {
    this.bgGrounds(g);
    this.bgOutside(g);
    this.bgFloors(g);
    this.bgWalls(g);
    this.bgKitchen(g);
    this.bgCounter(g);
    this.bgDriveThru(g);
    this.bgOffice(g);
    this.bgTables(g);
    this.bgEntrance(g);
    this.bgDecor(g);
    this.bgPark(g);
    this.bgTown(g);
    this.bgFarm(g);
    this.bgStation(g);
    this.bgPlayground(g);
    for (const e of this.ext) if (e.paintTown) e.paintTown(this, g);
  },

  // Grass over the whole world, sidewalks around the building, the parking lot.
  bgGrounds(g) {
    const ctx = this.ctx, W = CFG.WORLD, B = CFG.BUILDING;
    const grd = ctx.createLinearGradient(0, W.y0, 0, W.y1);
    grd.addColorStop(0, '#79b85e'); grd.addColorStop(1, '#5f9c48');
    ctx.fillStyle = grd; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 520; i++) { const x = W.x0 + ((i * 193) % (W.x1 - W.x0)), y = W.y0 + ((i * 101) % (W.y1 - W.y0)); ctx.beginPath(); ctx.ellipse(x, y, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    // sidewalks: along the bottom and both sides of the building, plus the far side of the road
    const walk = (x, y, w, h) => {
      ctx.fillStyle = '#d2cbbb'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 1;
      for (let xx = x; xx <= x + w; xx += 48) { ctx.beginPath(); ctx.moveTo(xx + 0.5, y); ctx.lineTo(xx + 0.5, y + h); ctx.stroke(); }
      for (let yy = y; yy <= y + h; yy += 48) { ctx.beginPath(); ctx.moveTo(x, yy + 0.5); ctx.lineTo(x + w, yy + 0.5); ctx.stroke(); }
    };
    walk(W.x0, B.y1, W.x1 - W.x0, 48);
    walk(B.x1, CFG.ROAD.y2, 48, B.y1 - CFG.ROAD.y2 + 48);
    walk(B.x0 - 48, CFG.ROAD.y2, 48, B.y1 - CFG.ROAD.y2 + 48);
    walk(W.x0, CFG.ROAD.y1 - 22, W.x1 - W.x0, 22);
    // sidewalks hugging the inside of the road loop, and along the house fronts and the fire station
    walk(-400, CFG.ROAD.y2, 26, 920 - CFG.ROAD.y2);
    walk(1214, CFG.ROAD.y2, 26, 920 - CFG.ROAD.y2);
    walk(-400, 894, 1614, 26);
    walk(-480, 1000, 1800, 20);
    walk(1320, 300, 20, 240);
    for (const h of CFG.HOUSES) walk(h.door.x - 14, 1000, 28, 22);
    // the walk-in customers' path: from the east edge of town, over East Road, past the parking lot to the door
    walk(B.x1 + 48, CFG.DOOR_OUT.y - 20, W.x1 - B.x1 - 48, 40);
    // parking lot
    const P = CFG.PARKING;
    ctx.fillStyle = '#5a5d63'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 90; i++) ctx.fillRect(P.x0 + ((i * 37) % (P.x1 - P.x0)), P.y0 + ((i * 53) % (P.y1 - P.y0)), 2, 2);
    ctx.strokeStyle = '#f3efe3'; ctx.lineWidth = 3;
    for (let k = 0; k <= 3; k++) { const y = P.y0 + 14 + k * 72; ctx.beginPath(); ctx.moveTo(P.x0 + 20, y); ctx.lineTo(P.x0 + 130, y); ctx.stroke(); }
    ctx.fillStyle = '#f3efe3'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(P.x0 + 170, P.y0 + 150); ctx.rotate(-Math.PI / 2); ctx.fillText('PARKING', 0, 0); ctx.restore();
  },

  // Park furniture, pond, fountain basin, tree trunks, lamp posts, bus stop. Canopies are drawn in the foreground.
  bgPark(g) {
    const ctx = this.ctx;
    // pond
    const pd = CFG.POND;
    ctx.fillStyle = '#4d8a5a'; ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.rx + 8, pd.ry + 8, 0, 0, Math.PI * 2); ctx.fill();
    const wg = ctx.createRadialGradient(pd.x - 15, pd.y - 10, 5, pd.x, pd.y, pd.rx);
    wg.addColorStop(0, '#9fdcff'); wg.addColorStop(1, '#4aa3d8');
    ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.rx, pd.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy] of [[-40, 10], [25, 20], [10, -22]]) { ctx.beginPath(); ctx.ellipse(pd.x + dx, pd.y + dy, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    // bench
    const bench = (x, y) => {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 24, y + 6, 50, 6);
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 26, y - 4, 52, 10); ctx.fillRect(x - 26, y - 16, 52, 7);
      ctx.fillStyle = '#4a2d12'; ctx.fillRect(x - 22, y + 6, 5, 8); ctx.fillRect(x + 17, y + 6, 5, 8);
    };
    bench(-120, 350); bench(600, 790); bench(1150, 250);
    // fountain basin
    const f = CFG.FOUNTAIN;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(f.x + 2, f.y + 6, 60, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b9b2a4'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 60, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cc2ec'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 50, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9d968a'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 6, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(f.x - 4, f.y - 30, 8, 24);
    // flower beds
    const bed = (x, y) => {
      ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(x, y, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
      const cols = ['#ff8fab', '#ffd166', '#fff', '#ff6b6b', '#9ad0ff'];
      for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.arc(x - 26 + i * 6.5, y + Math.sin(i * 1.7) * 7, 3, 0, Math.PI * 2); ctx.fill(); }
    };
    bed(-180, 300); bed(300, 790); bed(1100, 300); bed(900, -40);
    // tree trunks + shadows
    for (const t of CFG.TREES) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(t.x + 4, t.y + 6, 30 * t.s, 12 * t.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, t.x - 7 * t.s, t.y - 30 * t.s, 14 * t.s, 36 * t.s, 4); ctx.fill();
    }
    // lamp posts
    for (const [x, y] of [[-40, 260], [1000, 260], [-40, 720], [1000, 720]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 2, y - 60, 4, 60); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 62, 7, 0, Math.PI * 2); ctx.fill();
    }
    // bus stop sign on the far sidewalk
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(498, -60, 4, 52);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, 486, -74, 28, 18, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BUS', 500, -65);
    // park sign
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-150, 180, 6, 40); ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, -185, 160, 76, 24, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(11); ctx.fillText('PARK', -147, 172);
    // parked cars (static)
    for (const [i, col] of [[0, '#41b883'], [1, '#f06292']]) {
      ctx.save(); ctx.translate(CFG.PARKING.x0 + 75, CFG.PARKING.y0 + 50 + i * 72); this.drawVehicle('car', g, col); ctx.restore();
    }
  },

  // The street along the top of the building. It is always a road now (the drive-thru window is what unlocks).
  bgOutside(g) {
    const ctx = this.ctx, r = CFG.ROAD, W = CFG.WORLD;
    for (const rd of CFG.ROADS) {
      ctx.fillStyle = '#474a50'; ctx.fillRect(rd.x0, rd.y0, rd.x1 - rd.x0, rd.y1 - rd.y0);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 300; i++) { const x = rd.x0 + ((i * 97) % (rd.x1 - rd.x0)), y = rd.y0 + ((i * 53) % (rd.y1 - rd.y0)); ctx.fillRect(x, y, 2, 2); }
    }
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.setLineDash([22, 16]);
    for (const rd of CFG.ROADS) {
      ctx.beginPath();
      if (rd.x1 - rd.x0 > rd.y1 - rd.y0) { const y = (rd.y0 + rd.y1) / 2; ctx.moveTo(rd.x0 + 40, y); ctx.lineTo(rd.x1 - 40, y); }
      else { const x = (rd.x0 + rd.x1) / 2; ctx.moveTo(x, rd.y0 + 40); ctx.lineTo(x, rd.y1 - 40); }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (g.isUnlocked('driveThru')) { ctx.fillStyle = '#fff'; ctx.fillRect(CFG.DT_WINDOW.x + 56, r.y1 + 6, 6, r.y2 - r.y1 - 12); }
    // crosswalk where train passengers cross Main Street to the shop's side path (stripes run with the traffic)
    const cw = CFG.STATION.route[1].x;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 0; k < 5; k++) ctx.fillRect(cw - 30, r.y1 + 8 + k * 14, 60, 8);
    // crosswalk over East Road where walk-in customers come in from the edge of town
    const er = CFG.ROADS[1], cy = CFG.DOOR_OUT.y;
    for (let k = 0; k < 5; k++) ctx.fillRect(er.x0 + 8 + k * 14, cy - 18, 8, 36);
    // near sidewalk + curb (in front of the building)
    ctx.fillStyle = '#cfc8b8'; ctx.fillRect(W.x0, r.y2 - 10, W.x1 - W.x0, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(W.x0, r.y2 - 10, W.x1 - W.x0, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let x = W.x0; x < W.x1; x += 60) { ctx.beginPath(); ctx.moveTo(x, r.y2 - 10); ctx.lineTo(x, r.y2); ctx.stroke(); }
  },

  bgFloors(g) {
    const ctx = this.ctx;
    const top = CFG.ROAD.y2 + 12;
    // front of house: warm two-tone tiles with grout
    const ts = 40;
    for (let y = top; y < CFG.H; y += ts) for (let x = 0; x < CFG.W; x += ts) {
      const even = ((x / ts) + Math.floor((y - top) / ts)) % 2 === 0;
      ctx.fillStyle = even ? '#f2e0bf' : '#e8d0a4'; ctx.fillRect(x, y, ts, ts);
    }
    ctx.strokeStyle = 'rgba(90,50,20,0.10)'; ctx.lineWidth = 1;
    for (let y = top; y < CFG.H; y += ts) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(CFG.W, y + 0.5); ctx.stroke(); }
    for (let x = 0; x < CFG.W; x += ts) { ctx.beginPath(); ctx.moveTo(x + 0.5, top); ctx.lineTo(x + 0.5, CFG.H); ctx.stroke(); }
    // kitchen: cool grey tiles
    const ks = 30;
    for (let y = top; y < 472; y += ks) for (let x = 0; x < 372; x += ks) {
      const even = ((x / ks) + Math.floor((y - top) / ks)) % 2 === 0;
      ctx.fillStyle = even ? '#dcdfe3' : '#cfd3d8'; ctx.fillRect(x, y, ks, ks);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    for (let y = top; y < 472; y += ks) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(372, y + 0.5); ctx.stroke(); }
    for (let x = 0; x < 372; x += ks) { ctx.beginPath(); ctx.moveTo(x + 0.5, top); ctx.lineTo(x + 0.5, 472); ctx.stroke(); }
    // staff area behind the counter: plain mat
    ctx.fillStyle = '#e6e1d4'; ctx.fillRect(378, top, CFG.W - 378, CFG.COUNTER.y - top);
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let x = 378; x < CFG.W; x += 24) ctx.fillRect(x, top, 1, CFG.COUNTER.y - top);
    // office: wood planks
    for (let y = 478; y < CFG.H; y += 18) {
      const row = Math.floor((y - 478) / 18);
      ctx.fillStyle = row % 2 ? '#c99a5f' : '#c4935a'; ctx.fillRect(0, y, 372, 18);
      ctx.strokeStyle = 'rgba(80,40,10,0.18)'; ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(372, y + 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(80,40,10,0.12)';
      for (let x = (row % 2) * 60; x < 372; x += 120) { ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + 18); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,230,180,0.18)'; ctx.beginPath(); ctx.moveTo(0, y + 6.5); ctx.lineTo(372, y + 6.5); ctx.stroke();
    }
    // soft vignette so edges feel enclosed
    const v = ctx.createRadialGradient(CFG.W / 2, CFG.H / 2, CFG.W * 0.35, CFG.W / 2, CFG.H / 2, CFG.W * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,30,10,0.16)');
    ctx.fillStyle = v; ctx.fillRect(0, top, CFG.W, CFG.H - top);
  },

  bgWalls(g) {
    const ctx = this.ctx;
    const wall = (x, y, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillStyle = '#7a5235'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#9c6b45'; ctx.fillRect(x, y, w, Math.min(4, h));
    };
    const B = CFG.BUILDING, D = CFG.DOOR;
    wall(B.x0 - 6, B.y0, B.x1 - B.x0 + 6, 12);
    wall(B.x0 - 6, B.y0, 6, B.y1 - B.y0);
    wall(B.x0 - 6, B.y1 - 6, B.x1 - B.x0 + 6, 6);
    wall(B.x1 - 6, B.y0, 6, D.y0 - B.y0);
    wall(B.x1 - 6, D.y1, 6, B.y1 - D.y1);
    wall(372, CFG.ROAD.y2 + 12, 6, 40);
    wall(372, 300, 6, 112);
    wall(0, 472, 372, 6);
    wall(372, 412, 6, 66);
    // baseboard shadow under the top wall
    const sh = ctx.createLinearGradient(0, CFG.ROAD.y2 + 12, 0, CFG.ROAD.y2 + 26);
    sh.addColorStop(0, 'rgba(0,0,0,0.18)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, CFG.ROAD.y2 + 12, CFG.W, 14);
    // chalkboard menu on the back wall behind the counter
    const bx = 388, by = 114;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, bx - 3, by - 3, 100, 42, 4); ctx.fill();
    ctx.fillStyle = '#2f4f3a'; ctx.fillRect(bx, by, 94, 36);
    ctx.fillStyle = '#f5f0dc'; ctx.font = this.font(10); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('MENU', bx + 6, by + 9);
    ctx.fillStyle = 'rgba(245,240,220,0.7)';
    ctx.fillText('Pizza ........ $' + Math.round(g.price()), bx + 6, by + 21);
    ctx.fillText('Slice ........ $' + Math.max(1, Math.round(g.price() / 4)), bx + 6, by + 31);
  },

  bgKitchen(g) {
    const ctx = this.ctx;
    for (let i = 0; i < 2; i++) {
      if (i === 1 && !g.isUnlocked('oven2')) continue;
      const o = CFG.OVENS[i];
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, o.x - 36, o.y - 26, 74, 62, 8); ctx.fill();
      const grd = ctx.createLinearGradient(o.x - 36, o.y - 30, o.x + 36, o.y + 30);
      grd.addColorStop(0, '#5f646b'); grd.addColorStop(1, '#3f4247');
      ctx.fillStyle = grd; U.roundRect(ctx, o.x - 36, o.y - 30, 72, 60, 8); ctx.fill();
      ctx.fillStyle = '#2f3237'; U.roundRect(ctx, o.x - 36, o.y - 30, 72, 14, 6); ctx.fill();
      ctx.fillStyle = '#c9ccd2';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(o.x - 20 + k * 10, o.y - 23, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('OVEN', o.x + 18, o.y - 23);
      // vent pipe
      ctx.fillStyle = '#55595f'; ctx.fillRect(o.x + 22, o.y - 42, 10, 14);
      ctx.fillStyle = '#3f4247'; ctx.fillRect(o.x + 20, o.y - 44, 14, 4);
      // door frame
      ctx.fillStyle = '#23262a'; U.roundRect(ctx, o.x - 28, o.y - 12, 56, 34, 6); ctx.fill();
      // handle
      ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, o.x - 20, o.y + 25, 40, 3, 2); ctx.fill();
    }
    // prep table: flour, rolling pin, a sauce bowl
    const pt = CFG.PREP_TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, pt.x - pt.w / 2 + 3, pt.y - pt.h / 2 + 4, pt.w, pt.h, 6); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, pt.x - pt.w / 2, pt.y - pt.h / 2 + 4, pt.w, pt.h, 6); ctx.fill();
    ctx.fillStyle = '#c99a5f'; U.roundRect(ctx, pt.x - pt.w / 2, pt.y - pt.h / 2, pt.w, pt.h - 6, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(pt.x - 18, pt.y - 2, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1dcb2'; ctx.beginPath(); ctx.arc(pt.x - 18, pt.y - 3, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, pt.x + 2, pt.y - 12, 30, 7, 3); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(pt.x - 2, pt.y - 10, 5, 3); ctx.fillRect(pt.x + 31, pt.y - 10, 5, 3);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pt.x + 18, pt.y + 6, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(pt.x + 18, pt.y + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, pt.x - 30, pt.y + 22, 60, 13, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MAKE A PIZZA', pt.x, pt.y + 29);
    // pile tray
    const p = CFG.OVEN_PILE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, p.x - 28, p.y - 12, 56, 28, 6); ctx.fill();
    ctx.fillStyle = '#a9acb1'; U.roundRect(ctx, p.x - 24, p.y - 9, 48, 20, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(p.x - 22, p.y - 7, 44, 2);
  },

  bgCounter(g) {
    const ctx = this.ctx, c = CFG.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, c.x1 + 2, c.y + 12, c.x2 - c.x1, c.h, 8); ctx.fill();
    ctx.fillStyle = '#8a5527'; U.roundRect(ctx, c.x1, c.y + 8, c.x2 - c.x1, c.h, 8); ctx.fill();
    const grd = ctx.createLinearGradient(0, c.y, 0, c.y + c.h);
    grd.addColorStop(0, '#d2944f'); grd.addColorStop(1, '#bd7f3f');
    ctx.fillStyle = grd; U.roundRect(ctx, c.x1, c.y, c.x2 - c.x1, c.h - 6, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,10,0.15)'; ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(c.x1 + 10, c.y + 7 + k * 7); ctx.lineTo(c.x2 - 10, c.y + 9 + k * 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(c.x1 + 8, c.y + 3, c.x2 - c.x1 - 16, 3);
    // register body
    const r = CFG.REGISTER;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, r.x - 17, r.y - 24, 36, 32, 5); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, r.x - 18, r.y - 26, 36, 32, 5); ctx.fill();
    ctx.fillStyle = '#7fd1ff'; U.roundRect(ctx, r.x - 13, r.y - 22, 26, 12, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(r.x - 11, r.y - 20, 10, 2);
    ctx.fillStyle = '#c9d2dc'; U.roundRect(ctx, r.x - 14, r.y - 7, 28, 9, 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a';
    for (let k = 0; k < 4; k++) ctx.fillRect(r.x - 12 + k * 7, r.y - 5, 4, 5);
    // "pay here" standing card
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, r.x - 22, r.y + 9, 44, 13, 3); ctx.fill();
    ctx.fillStyle = '#b8401c'; ctx.font = this.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PAY HERE', r.x, r.y + 16);
    // display tray
    const d = CFG.DISPLAY;
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; U.roundRect(ctx, d.x - 32, d.y - 17, 64, 24, 6); ctx.fill();
    // queue markers
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let i = 0; i < CFG.QUEUE.max; i++) { ctx.beginPath(); ctx.ellipse(CFG.QUEUE.x, CFG.QUEUE.y + i * CFG.QUEUE.dy + 4, 16, 8, 0, 0, Math.PI * 2); ctx.fill(); }
    // cash spot plate
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.beginPath(); ctx.ellipse(CFG.CASH_PILE.x, CFG.CASH_PILE.y + 6, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
  },

  bgDriveThru(g) {
    if (!g.isUnlocked('driveThru')) return;
    const ctx = this.ctx, w = CFG.DT_WINDOW;
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e4572e'; ctx.fillRect(w.x - 48 + i * 12, CFG.ROAD.y2 - 12, 12, 12); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(w.x - 48, CFG.ROAD.y2 - 1, 96, 3);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, w.x - 42, CFG.ROAD.y2 - 2, 84, 20, 4); ctx.fill();
    const glass = ctx.createLinearGradient(w.x - 36, 0, w.x + 36, 0);
    glass.addColorStop(0, '#9fe0ff'); glass.addColorStop(0.5, '#d9f3ff'); glass.addColorStop(1, '#8fd4ff');
    ctx.fillStyle = glass; U.roundRect(ctx, w.x - 36, CFG.ROAD.y2 + 1, 72, 12, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, w.x - 146, CFG.ROAD.y2 - 4, 92, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DRIVE THRU', w.x - 100, CFG.ROAD.y2 + 5);
    const s = CFG.DT_STACK;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 8, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8c8f94'; U.roundRect(ctx, s.x - 28, s.y - 12, 56, 28, 6); ctx.fill();
    ctx.fillStyle = '#a9acb1'; U.roundRect(ctx, s.x - 24, s.y - 9, 48, 20, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.beginPath(); ctx.ellipse(CFG.DT_CASH.x, CFG.DT_CASH.y + 6, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
  },

  bgOffice(g) {
    const ctx = this.ctx;
    // manager's desk in the office corner: staff are hired here
    const dx = CFG.OFFICE_DESK.x, dy = CFG.OFFICE_DESK.y;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, dx - 38, dy + 4, 80, 24, 5); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, dx - 40, dy, 80, 24, 5); ctx.fill();
    ctx.fillStyle = '#9b6531'; U.roundRect(ctx, dx - 40, dy - 6, 80, 24, 5); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, dx - 34, dy - 2, 20, 14, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(dx - 31, dy + 2, 12, 1); ctx.fillRect(dx - 31, dy + 5, 10, 1); ctx.fillRect(dx - 31, dy + 8, 13, 1);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(dx + 28, dy + 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a2a10'; ctx.beginPath(); ctx.arc(dx + 28, dy + 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, dx - 4, dy - 20, 26, 18, 3); ctx.fill();
    ctx.fillStyle = '#7fd1ff'; U.roundRect(ctx, dx - 1, dy - 17, 20, 12, 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, dx - 36, dy + 22, 72, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('HIRING', dx, dy + 29);
    for (const [pos, label, ico] of []) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 36, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, pos.x - 38, pos.y + 28, 80, 24, 5); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, pos.x - 40, pos.y + 24, 80, 24, 5); ctx.fill();
      const grd = ctx.createLinearGradient(0, pos.y + 18, 0, pos.y + 42);
      grd.addColorStop(0, '#9b6531'); grd.addColorStop(1, '#8d5a2b');
      ctx.fillStyle = grd; U.roundRect(ctx, pos.x - 40, pos.y + 18, 80, 24, 5); ctx.fill();
      // papers + mug
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, pos.x - 34, pos.y + 22, 20, 14, 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(pos.x - 31, pos.y + 26, 12, 1); ctx.fillRect(pos.x - 31, pos.y + 29, 10, 1); ctx.fillRect(pos.x - 31, pos.y + 32, 13, 1);
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(pos.x + 28, pos.y + 29, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a2a10'; ctx.beginPath(); ctx.arc(pos.x + 28, pos.y + 29, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, pos.x - 44, pos.y + 50, 88, 18, 4); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, pos.x, pos.y + 59);
      ctx.font = this.font(16); ctx.fillText(ico, pos.x + 8, pos.y + 29);
    }
  },

  bgTables(g) {
    const ctx = this.ctx;
    for (const t of g.activeTables()) {
      // chairs with backs
      for (const dy of [-34, 34]) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(t.x + 1, t.y + dy + 4, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(t.x, t.y + dy, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a4f24'; ctx.beginPath(); ctx.arc(t.x, t.y + dy, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a2d12'; U.roundRect(ctx, t.x - 12, t.y + dy + (dy < 0 ? -15 : 9), 24, 6, 3); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(t.x + 1, t.y + 7, 27, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(t.x, t.y, 25, 0, Math.PI * 2); ctx.fill();
      // red/white checkered tablecloth
      ctx.save(); ctx.beginPath(); ctx.arc(t.x, t.y, 22, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#fff6ea'; ctx.fillRect(t.x - 22, t.y - 22, 44, 44);
      ctx.fillStyle = '#d9483b';
      for (let yy = -24; yy < 24; yy += 8) for (let xx = -24; xx < 24; xx += 8) if (((xx + yy) / 8) % 2 === 0) ctx.fillRect(t.x + xx, t.y + yy, 8, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(t.x - 6, t.y - 8, 12, 6, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // candle
      ctx.fillStyle = '#fff'; ctx.fillRect(t.x - 1.5, t.y - 8, 3, 7);
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(t.x, t.y - 10, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
  },

  bgEntrance(g) {
    const ctx = this.ctx, e = CFG.ENTRANCE;
    // open glass door swung outward from the gap in the right wall
    const D = CFG.DOOR, B = CFG.BUILDING;
    ctx.fillStyle = '#7a5235'; ctx.fillRect(B.x1 - 8, D.y0 - 4, 10, 6); ctx.fillRect(B.x1 - 8, D.y1 - 2, 10, 6);
    ctx.save(); ctx.translate(B.x1, D.y0); ctx.rotate(0.55);
    ctx.fillStyle = '#7a5235'; ctx.fillRect(0, 0, 8, D.y1 - D.y0 - 4);
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(2, 4, 4, D.y1 - D.y0 - 12);
    ctx.restore();
    // awning over the door
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e4572e'; ctx.fillRect(B.x1 - 2, D.y0 - 12 + i * 14, 24, 14); }
    // mat
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, e.x - 40, e.y - 16, 68, 36, 6); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, e.x - 42, e.y - 18, 68, 36, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; U.roundRect(ctx, e.x - 37, e.y - 13, 58, 26, 4); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('WELCOME', e.x - 8, e.y);
  },

  // Decorations: owned items are drawn fully; unowned ones are drawn as gray ghosts where they will go.
  bgDecor(g) {
    const ctx = this.ctx;
    const ghost = (key, fn) => { if (g.hasDecor(key)) { fn(); return; } ctx.save(); ctx.globalAlpha = 0.32; fn(); ctx.restore(); };   // faded preview; no canvas filter (a filter on this huge picture stalled the repaint for seconds)
    const plant = (x, y, s = 1) => {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 4 * s, 13 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b5532b'; U.roundRect(ctx, x - 9 * s, y - 10 * s, 18 * s, 14 * s, 3 * s); ctx.fill();
      ctx.fillStyle = '#d2673b'; U.roundRect(ctx, x - 11 * s, y - 13 * s, 22 * s, 5 * s, 2 * s); ctx.fill();
      ctx.fillStyle = '#3f9a4a';
      for (const [dx, dy, r] of [[0, -22, 9], [-9, -16, 7], [9, -17, 7], [-4, -26, 5], [5, -27, 5]]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, r * s, r * 0.8 * s, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.ellipse(x - 2 * s, y - 24 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
    };
    ghost('plants', () => { plant(662, 598); plant(936, 215); plant(40, 455, 0.9); });
    ghost('posters', () => {
      const poster = (x, y, text) => {
        ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, x - 20, y - 15, 40, 30, 3); ctx.fill();
        ctx.fillStyle = '#fff3d6'; ctx.fillRect(x - 17, y - 12, 34, 24);
        this.drawPizza(x, y - 2, 7);
        ctx.fillStyle = '#b8401c'; ctx.font = this.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 8);
      };
      poster(70, 142, 'BEST PIZZA'); poster(130, 142, 'SINCE 1987'); poster(700, 134, 'HOT & FRESH');
    });
    ghost('lights', () => {
      // the wire; bulbs are dynamic when owned, static gray when not
      ctx.strokeStyle = 'rgba(30,20,10,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = 10; x <= 330; x += 40) { ctx.moveTo(x, 110); ctx.quadraticCurveTo(x + 20, 124, x + 40, 110); }
      ctx.stroke();
      if (!g.hasDecor('lights')) { ctx.fillStyle = '#ffd166'; for (let x = 18; x < 370; x += 16) { const sag = 110 + 10 * Math.sin(((x - 10) % 40) / 40 * Math.PI); ctx.beginPath(); ctx.arc(x, sag + 4, 3, 0, Math.PI * 2); ctx.fill(); } }
    });
    ghost('neon', () => {
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 756, 112, 128, 26, 6); ctx.fill();
      if (!g.hasDecor('neon')) { ctx.fillStyle = '#ff78dc'; ctx.font = this.font(17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥ PIZZA ♥', 820, 126); }
    });
    ghost('jukebox', () => {
      const cx = 790, cy = 465;
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 3, 92, 46, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.ellipse(cx, cy, 92, 46, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.ellipse(cx, cy, 78, 36, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.ellipse(cx, cy, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
      const jx = 934, jy = 262;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, jx - 14, jy - 26, 32, 50, 10); ctx.fill();
      ctx.fillStyle = '#8c2f2f'; U.roundRect(ctx, jx - 16, jy - 30, 32, 50, 10); ctx.fill();
      ctx.fillStyle = '#f2b134'; U.roundRect(ctx, jx - 12, jy - 26, 24, 14, 8); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, jx - 10, jy - 6, 20, 14, 3); ctx.fill();
      ctx.fillStyle = '#7fd1ff'; ctx.fillRect(jx - 8, jy - 4, 16, 4);
    });
  },

  // Ice cream shop next door, houses across the south road, the fire station across the east road.
  bgTown(g) {
    const ctx = this.ctx;
    // ---- ice cream shop
    const IC = CFG.ICE_CREAM, R = IC.rect, owned = g.s.iceCream.owned;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(R.x0 + 4, R.y0 + 4, R.x1 - R.x0, R.y1 - R.y0);
    // floor
    for (let y = R.y0; y < R.y1; y += 24) for (let x = R.x0; x < R.x1; x += 24) { ctx.fillStyle = ((x - R.x0) / 24 + (y - R.y0) / 24) % 2 ? '#ffe1ea' : '#fff7f9'; ctx.fillRect(x, y, Math.min(24, R.x1 - x), Math.min(24, R.y1 - y)); }
    // walls (door gap on the bottom)
    ctx.fillStyle = '#c45c7a';
    ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 8); ctx.fillRect(R.x0, R.y0, 6, R.y1 - R.y0); ctx.fillRect(R.x1 - 6, R.y0, 6, R.y1 - R.y0);
    ctx.fillRect(R.x0, R.y1 - 6, IC.door.x - IC.doorW / 2 - R.x0, 6); ctx.fillRect(IC.door.x + IC.doorW / 2, R.y1 - 6, R.x1 - IC.door.x - IC.doorW / 2, 6);
    // door awning (pink/white)
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#ff8fab'; ctx.fillRect(IC.door.x - 36 + i * 12, R.y1 - 2, 12, 12); }
    // freezer with tubs
    ctx.fillStyle = '#9fb3c8'; U.roundRect(ctx, R.x0 + 14, R.y0 + 16, R.x1 - R.x0 - 28, 36, 5); ctx.fill();
    const tubs = ['#ffb6c1', '#fff3c4', '#8d5a2b', '#b8f2c8', '#cdb4ff', '#ffd166', '#f8c8dc'];
    for (let i = 0; i < 7; i++) { ctx.fillStyle = tubs[i]; ctx.beginPath(); ctx.arc(R.x0 + 30 + i * 24, R.y0 + 34, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(R.x0 + 27 + i * 24, R.y0 + 31, 3, 0, Math.PI * 2); ctx.fill(); }
    // counter
    ctx.fillStyle = '#8a5527'; U.roundRect(ctx, IC.counter.x - 60, IC.counter.y - 8, 120, 24, 6); ctx.fill();
    ctx.fillStyle = '#ffd6e3'; U.roundRect(ctx, IC.counter.x - 60, IC.counter.y - 14, 120, 20, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.beginPath(); ctx.ellipse(IC.cash.x, IC.cash.y + 6, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    // big cone sign on the roof edge
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, IC.door.x - 60, R.y0 - 26, 120, 22, 6); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍦 ICE CREAM', IC.door.x, R.y0 - 15);
    if (!owned) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(IC.door.x + 70, R.y1 + 6, 5, 34);
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, IC.door.x + 44, R.y1 - 4, 58, 26, 4); ctx.fill();
      ctx.strokeStyle = '#b23a48'; ctx.lineWidth = 2; U.roundRect(ctx, IC.door.x + 44, R.y1 - 4, 58, 26, 4); ctx.stroke();
      ctx.fillStyle = '#b23a48'; ctx.font = this.font(10); ctx.fillText('FOR SALE', IC.door.x + 73, R.y1 + 9);
    }
    // ---- houses
    for (const h of CFG.HOUSES) {
      const w = h.x1 - h.x0, hh = h.y1 - h.y0;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(h.x0 + 5, h.y0 + 5, w, hh);
      // facade (door side faces the road at the top)
      ctx.fillStyle = h.color; ctx.fillRect(h.x0, h.y0, w, 34);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(h.door.x - 11, h.y0 + 4, 22, 28); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(h.door.x + 6, h.y0 + 19, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9fe0ff'; ctx.fillRect(h.x0 + 18, h.y0 + 8, 24, 18); ctx.fillRect(h.x1 - 42, h.y0 + 8, 24, 18);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(h.x0 + 18, h.y0 + 8, 24, 18); ctx.strokeRect(h.x1 - 42, h.y0 + 8, 24, 18);
      // roof
      ctx.fillStyle = h.roof; ctx.fillRect(h.x0, h.y0 + 34, w, hh - 34);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = h.y0 + 34; y < h.y1; y += 16) ctx.fillRect(h.x0, y, w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(h.x0, h.y0 + 34, w, 6);
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(h.x1 - 40, h.y0 + 60, 18, 24); ctx.fillStyle = '#4a2d12'; ctx.fillRect(h.x1 - 42, h.y0 + 58, 22, 5);
      // mailbox by the path
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(h.door.x + 22, h.y0 - 16, 3, 16); ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, h.door.x + 17, h.y0 - 24, 14, 9, 3); ctx.fill();
      // name plate
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, h.door.x - 48, h.y1 - 20, 96, 16, 4); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(h.name.toUpperCase(), h.door.x, h.y1 - 12);
    }
    // ---- garage paint shop
    const GA = CFG.GARAGE, gw = GA.x1 - GA.x0, gh = GA.y1 - GA.y0, gd = GA.door;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(GA.x0 + 5, GA.y0 + 5, gw, gh);
    ctx.fillStyle = '#6d6d6d'; ctx.fillRect(GA.x0, GA.y0, gw, gh);                          // floor
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = GA.y0; y < GA.y1; y += 20) ctx.fillRect(GA.x0, y, gw, 2);
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(GA.bay.x - 30, GA.bay.y - 26, 60, 4); ctx.fillRect(GA.bay.x - 30, GA.bay.y + 22, 60, 4); ctx.fillRect(GA.bay.x - 30, GA.bay.y - 26, 4, 52); ctx.fillRect(GA.bay.x + 26, GA.bay.y - 26, 4, 52); // bay markings
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(GA.x0, GA.y0, gd.x - gd.half - GA.x0, 8); ctx.fillRect(gd.x + gd.half, GA.y0, GA.x1 - (gd.x + gd.half), 8); ctx.fillRect(GA.x0, GA.y0, 8, gh); ctx.fillRect(GA.x1 - 8, GA.y0, 8, gh); ctx.fillRect(GA.x0, GA.y1 - 8, gw, 8);
    ctx.fillStyle = '#c62828'; ctx.fillRect(GA.x0 + 8, GA.y1 - 20, gw - 16, 12);              // back wall tool rack
    CFG.PAINT_COLORS.filter((c) => c !== 'rainbow').forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(GA.x0 + 24 + i * 18, GA.y1 - 14, 5, 0, Math.PI * 2); ctx.fill(); }); // paint cans
    ctx.fillStyle = 'rgba(159,224,255,0.35)'; ctx.fillRect(GA.x0 + 8, GA.y0 + 8, gd.x - gd.half - GA.x0 - 8, 6); ctx.fillRect(gd.x + gd.half, GA.y0 + 8, GA.x1 - (gd.x + gd.half) - 8, 6);   // showroom glass
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, gd.x - 78, GA.y0 - 20, 156, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚗 SHOWROOM · 🎨 PAINT', gd.x, GA.y0 - 11);
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(gd.x - gd.half, 1000, gd.half * 2, 20);          // driveway from the road
    // ---- fire station
    const F = CFG.FIRE_STATION, fw = F.x1 - F.x0, fh = F.y1 - F.y0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(F.x0 + 5, F.y0 + 5, fw, fh);
    ctx.fillStyle = '#c62828'; ctx.fillRect(F.x0, F.y0, fw, fh);
    ctx.fillStyle = '#8e1c1c'; ctx.fillRect(F.x0 + 40, F.y0, fw - 40, fh);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = F.y0; y < F.y1; y += 14) ctx.fillRect(F.x0 + 40, y, fw - 40, 2);
    // two garage doors on the road side
    for (const dy of [70, 160]) { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(F.x0 + 4, F.y0 + dy - 30, 32, 60); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 4; k++) ctx.fillRect(F.x0 + 4, F.y0 + dy - 30 + k * 15, 32, 2); }
    // the lower bay is open: dark garage interior where the truck lives (the truck itself is drawn live)
    ctx.fillStyle = '#3a2323'; ctx.fillRect(F.x0 + 4, F.y0 + 130, 130, 60);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(F.x0 + 4, F.y0 + 130, 130, 8);
    // sign + hydrant
    ctx.fillStyle = '#fff'; U.roundRect(ctx, F.x0 + 50, F.y0 + 10, fw - 60, 20, 4); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.font = this.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚒 FIRE DEPT', F.x0 + 50 + (fw - 60) / 2, F.y0 + 20);
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, 1326, 560, 10, 18, 3); ctx.fill(); ctx.fillRect(1323, 566, 16, 4);
  },

  // The farm: barn, silo, cow pen, four planted plots, fences, hay, scarecrow, tractor and a dirt path.
  bgFarm(g) {
    const ctx = this.ctx, F = CFG.FARM;
    // dirt path from the road to the gate, and farm soil
    ctx.fillStyle = '#c9a36b'; ctx.fillRect(F.gate.x - 10, F.gate.y - 16, 110, 32);
    ctx.fillStyle = '#b48a55'; ctx.fillRect(F.gate.x - 10, F.gate.y - 16, 110, 4);
    const soil = (x0, y0, x1, y1) => {
      ctx.fillStyle = '#8d6a3f'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = y0 + 6; y < y1; y += 14) ctx.fillRect(x0, y, x1 - x0, 3);
    };
    soil(-965, 340, -815, 470); soil(-765, 340, -565, 470); soil(-965, 540, -815, 660); soil(-765, 540, -595, 670);
    // fences (decorative)
    const fence = (x0, y0, x1, y1) => {
      const horiz = Math.abs(x1 - x0) > Math.abs(y1 - y0);
      ctx.fillStyle = '#d7b98a';
      if (horiz) { ctx.fillRect(x0, y0 - 2, x1 - x0, 4); ctx.fillRect(x0, y0 + 8, x1 - x0, 4); for (let x = x0; x <= x1; x += 28) ctx.fillRect(x - 2, y0 - 8, 5, 22); }
      else { ctx.fillRect(x0 - 2, y0, 4, y1 - y0); ctx.fillRect(x0 + 8, y0, 4, y1 - y0); for (let y = y0; y <= y1; y += 28) ctx.fillRect(x0 - 8, y - 2, 22, 5); }
    };
    fence(F.x0, F.y0, F.x1, F.y0); fence(F.x0, F.y1, F.x1, F.y1);
    fence(F.x0, F.y0, F.x0, F.secretGate.y - F.secretGate.half); fence(F.x0, F.secretGate.y + F.secretGate.half, F.x0, F.y1);   // west fence, gap behind the barn
    fence(F.x1 - 10, F.y0, F.x1 - 10, F.gate.y - 40); fence(F.x1 - 10, F.gate.y + 40, F.x1 - 10, F.y1);
    // cow pen fence
    const P = F.pen; fence(P.x0, P.y0, P.x1, P.y0); fence(P.x0, P.y1, F.penGate.x - F.penGate.half, P.y1); fence(F.penGate.x + F.penGate.half, P.y1, P.x1, P.y1); fence(P.x0, P.y0, P.x0, P.y1); fence(P.x1, P.y0, P.x1, P.y1);
    const PGt = F.penGate; ctx.fillStyle = '#6b4a2b'; ctx.fillRect(PGt.x - PGt.half, P.y1 - 10, PGt.half * 2, 20); ctx.fillStyle = '#e0b44c'; ctx.fillRect(PGt.x - PGt.half - 4, P.y1 - 4, 6, 20); ctx.fillRect(PGt.x + PGt.half - 2, P.y1 - 4, 6, 20); // pen gate opening + posts
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(F.x1 - 14, F.gate.y - F.gate.half - 6, 10, 8); ctx.fillRect(F.x1 - 14, F.gate.y + F.gate.half - 2, 10, 8); // east gate posts
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(P.x0 + 10, P.y0 + 10, P.x1 - P.x0 - 20, P.y1 - P.y0 - 20);
    ctx.fillStyle = '#7d5a35'; for (let i = 0; i < 40; i++) ctx.fillRect(P.x0 + 14 + ((i * 37) % (P.x1 - P.x0 - 30)), P.y0 + 14 + ((i * 53) % (P.y1 - P.y0 - 30)), 6, 3);
    ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.ellipse(P.x1 - 40, P.y1 - 30, 22, 10, 0, 0, Math.PI * 2); ctx.fill(); // water trough
    // barn
    const B = F.barn, bw = B.x1 - B.x0, bh = B.y1 - B.y0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 6, B.y0 + 6, bw, bh);
    ctx.fillStyle = '#b23a3a'; ctx.fillRect(B.x0, B.y0, bw, bh);
    ctx.fillStyle = '#8e2a2a'; ctx.fillRect(B.x0, B.y0, bw, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let y = B.y0 + 40; y < B.y1; y += 12) ctx.fillRect(B.x0, y, bw, 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(B.x0, B.y0, bw, 4); ctx.fillRect(B.x0, B.y1 - 4, bw, 4); ctx.fillRect(B.x0, B.y0, 4, bh); ctx.fillRect(B.x1 - 4, B.y0, 4, bh);
    // big door facing right with an X
    ctx.fillStyle = '#fff'; ctx.fillRect(B.x1 - 40, B.y0 + 50, 36, 60); ctx.fillStyle = '#b23a3a'; ctx.fillRect(B.x1 - 36, B.y0 + 54, 28, 52);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(B.x1 - 36, B.y0 + 54); ctx.lineTo(B.x1 - 8, B.y0 + 106); ctx.moveTo(B.x1 - 8, B.y0 + 54); ctx.lineTo(B.x1 - 36, B.y0 + 106); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, B.x0 + 20, B.y0 + 10, 100, 20, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐄 FARM', B.x0 + 70, B.y0 + 20);
    // silo
    const S = F.silo;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(S.x + 4, S.y + 44, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfd3d8'; U.roundRect(ctx, S.x - 20, S.y - 40, 40, 84, 20); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; for (let y = S.y - 30; y < S.y + 40; y += 14) ctx.fillRect(S.x - 20, y, 40, 2);
    ctx.fillStyle = '#b23a3a'; ctx.beginPath(); ctx.ellipse(S.x, S.y - 40, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
    // hay bales, scarecrow, tractor
    for (const [hx, hy] of [[-560, 730], [-530, 760], [-560, 790]]) { ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, hx - 16, hy - 10, 32, 20, 4); ctx.fill(); ctx.fillStyle = '#b8862c'; ctx.fillRect(hx - 16, hy - 2, 32, 3); }
    const sx = -880, sy = 500;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(sx - 2, sy - 40, 4, 50); ctx.fillRect(sx - 18, sy - 24, 36, 4);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, sx - 10, sy - 28, 20, 22, 4); ctx.fill();
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(sx, sy - 36, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(sx - 12, sy - 44, 24, 4);
    // plot signs
    ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [tx, ty, label] of [[-890, 330, '🍅 TOMATOES'], [-665, 330, '🌾 WHEAT'], [-890, 530, '🌿 BASIL'], [-680, 530, '🍄 MUSHROOMS']]) {
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, tx - 40, ty - 8, 80, 16, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillText(label, tx, ty);
    }
  },

  drawFarmDynamic(g) {
    const ctx = this.ctx, F = CFG.FARM, t = g.time;
    for (const pl of g.plots) {
      const grow = pl.ready ? 1 : 1 - pl.t / F.regrow[pl.kind]; // 0 just picked .. 1 ripe
      const sway = Math.sin(t * 1.5 + pl.phase) * 2;
      if (pl.kind === 'tomato') {
        ctx.fillStyle = '#4b8a3a'; ctx.fillRect(pl.x - 1.5, pl.y - 22 * grow, 3, 22 * grow);
        ctx.fillStyle = '#5db04a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(pl.x + (k - 1) * 8 + sway, pl.y - 8 - k * 5 * grow, 7, 4, (k - 1) * 0.5, 0, Math.PI * 2); ctx.fill(); }
        if (pl.ready) { ctx.fillStyle = '#e53935'; for (const [dx, dy] of [[-7, -6], [6, -12], [0, -18]]) { ctx.beginPath(); ctx.arc(pl.x + dx + sway, pl.y + dy, 5, 0, Math.PI * 2); ctx.fill(); } }
      } else if (pl.kind === 'wheat') {
        for (let k = -2; k <= 2; k++) {
          ctx.strokeStyle = pl.ready ? '#d4a017' : '#9ccc65'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pl.x + k * 6, pl.y); ctx.lineTo(pl.x + k * 6 + sway, pl.y - 26 * grow); ctx.stroke();
          if (pl.ready) { ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.ellipse(pl.x + k * 6 + sway, pl.y - 28, 3, 7, 0, 0, Math.PI * 2); ctx.fill(); }
        }
      } else if (pl.kind === 'basil') {
        ctx.fillStyle = pl.ready ? '#3f9a4a' : '#8fd19e';
        for (let k = 0; k < 5; k++) { const a = k * 1.26 + pl.phase; ctx.beginPath(); ctx.ellipse(pl.x + Math.cos(a) * 9 * grow + sway, pl.y - 8 + Math.sin(a) * 6 * grow, 9 * grow, 5 * grow, a, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, pl.x - 22, pl.y - 6, 44, 12, 6); ctx.fill();
        if (grow > 0.3) for (const [dx, h] of [[-10, 10], [2, 14], [12, 9]]) { ctx.fillStyle = '#e9d9c2'; ctx.fillRect(pl.x + dx - 2, pl.y - 6 - h * grow, 4, h * grow); ctx.fillStyle = pl.ready ? '#b06b3b' : '#d4b59a'; ctx.beginPath(); ctx.arc(pl.x + dx, pl.y - 6 - h * grow, 7 * grow, Math.PI, 0); ctx.fill(); }
      }
      if (pl.ready && g.s.farm[pl.kind] < F.max) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✨', pl.x + 16, pl.y - 30 + Math.sin(t * 4 + pl.phase) * 3); }
    }
    this.drawCow(g.cow, g);
  },

  drawCow(c, g) {
    const ctx = this.ctx, x = c.x, y = c.y, f = c.facing;
    const bob = c.moving ? Math.sin(c.bob) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; const st = c.moving ? Math.sin(c.bob) * 3 : 0;
    ctx.fillRect(x - 16, y - 4 + st, 5, 12); ctx.fillRect(x + 11, y - 4 - st, 5, 12); ctx.fillRect(x - 6, y - 4 - st, 5, 12); ctx.fillRect(x + 2, y - 4 + st, 5, 12);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 22, y - 24 + bob, 44, 24, 10); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x - 8, y - 14 + bob, 8, 6, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 10, y - 18 + bob, 6, 5, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8c8dc'; ctx.beginPath(); ctx.ellipse(x, y - 4 + bob, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); // udder
    // head and tail: drawn facing right, then mirrored as a whole when the cow faces left
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(f, 1);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, 14, -30, 20, 18, 7); ctx.fill();
    ctx.fillStyle = '#f8c8dc'; U.roundRect(ctx, 22, -20, 12, 8, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(25, -27, 3, 3); ctx.fillRect(31, -27, 3, 3);
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.ellipse(18, -32, 5, 3, 0, 0, Math.PI * 2); ctx.ellipse(30, -32, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a36b'; ctx.fillRect(23, -38, 3, 7);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-28, -6 + Math.sin(g.time * 3) * 4); ctx.stroke();
    ctx.restore();
    if (c.moo > 0) this.drawBubble(x, y - 50, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Moo!', 0, 0); }, 44);
    else if (c.ready) this.drawBubble(x, y - 50 + Math.sin(g.time * 4) * 3, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🧀', 0, 0); }, 30);
  },

  // Railway along the top of the world, a platform with a little station house opposite the farm.
  bgStation(g) {
    const ctx = this.ctx, S = CFG.STATION, P = S.platform;
    this.bgPlatform(S, CFG.WORLD, '🚉 STATION');
    if (!g.isUnlocked('station')) this.bgDerelictStation(S);
    // railway crossing gates where the tracks meet nothing: just a crossing sign near the station path
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(-712, P.y1, 24, 50); // path down to the sidewalk
    // trash can beside the path: throw away pizzas you are carrying
    const T = S.trash;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 4, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c8a3c'; U.roundRect(ctx, T.x - 18, T.y - 30, 36, 32, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let i = 0; i < 4; i++) ctx.fillRect(T.x - 13 + i * 8, T.y - 24, 3, 22);
    ctx.fillStyle = '#4a7230'; U.roundRect(ctx, T.x - 21, T.y - 36, 42, 9, 4); ctx.fill();
    ctx.fillStyle = '#3d5f27'; U.roundRect(ctx, T.x - 5, T.y - 40, 10, 5, 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TRASH', T.x, T.y - 12);
  },

  // Before it is repaired the old station is boarded up: planks over the windows and door, cracks, weeds, a sign.
  bgDerelictStation(S) {
    const ctx = this.ctx, P = S.platform, H = S.house;
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);   // grimy platform
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
    for (const [x, y] of [[P.x0 + 60, P.y0 + 10], [P.x0 + 180, P.y1 - 8], [P.x1 - 90, P.y0 + 16], [P.x0 + 280, P.y0 + 24]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 9); ctx.lineTo(x + 10, y + 20); ctx.moveTo(x + 14, y + 9); ctx.lineTo(x + 26, y + 6); ctx.stroke(); }   // cracks
    const plank = (x, y, w, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#a0754a'; ctx.fillRect(-w / 2, -3, w, 6); ctx.fillStyle = '#2b1d14'; ctx.fillRect(-w / 2 + 3, -1, 2, 2); ctx.fillRect(w / 2 - 5, -1, 2, 2); ctx.restore(); };
    plank(H.x0 + 22, H.y0 + 27, 30, 0.35); plank(H.x0 + 22, H.y0 + 27, 30, -0.35); plank(H.x1 - 22, H.y0 + 27, 30, 0.35); plank(H.x1 - 22, H.y0 + 27, 30, -0.35);   // boarded windows
    plank(H.x0 + 50, H.y0 + 26, 26, 0.5); plank(H.x0 + 50, H.y0 + 38, 26, -0.5);   // boarded door
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(H.x1 - 30, H.y0, 22, 14);   // missing roof patch
    ctx.fillStyle = '#5f8f3a';   // weeds along the platform edge and the path
    for (const [x, y] of [[P.x0 + 20, P.y1 - 4], [P.x0 + 110, P.y1 - 2], [P.x0 + 250, P.y1 - 6], [P.x1 - 40, P.y1 - 3], [-720, P.y1 + 30], [-690, P.y1 + 44], [P.x0 + 330, P.y0 + 30]]) { ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 3, y - 12); ctx.lineTo(x, y); ctx.lineTo(x + 2, y - 14); ctx.lineTo(x + 4, y); ctx.lineTo(x + 7, y - 10); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); }
    ctx.save(); ctx.translate(H.x1 + 24, P.y1 - 2); ctx.rotate(-0.12);   // leaning sign
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-2, -34, 4, 34); ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, -44, -56, 88, 26, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = this.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CLOSED', 0, -48); ctx.fillText('needs repair', 0, -37); ctx.restore();
  },

  // Tracks across the top of a map, a platform with a little station house. Shared by both towns.
  bgPlatform(S, W, label) {
    const ctx = this.ctx, ty = S.trackY;
    ctx.fillStyle = '#8d7b63'; ctx.fillRect(W.x0, ty - 18, W.x1 - W.x0, 36);           // ballast
    ctx.fillStyle = '#6b4a2b'; for (let x = W.x0; x < W.x1; x += 22) ctx.fillRect(x, ty - 12, 10, 24); // ties
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(W.x0, ty - 8, W.x1 - W.x0, 4); ctx.fillRect(W.x0, ty + 4, W.x1 - W.x0, 4); // rails
    const P = S.platform;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(P.x0 + 3, P.y0 + 3, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, 4); // safety line
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let x = P.x0; x < P.x1; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, P.y0); ctx.lineTo(x + 0.5, P.y1); ctx.stroke(); }
    // station house
    const H = S.house;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(H.x0 + 4, H.y0 + 4, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#c98a4b'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#8a5527'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, 14);
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(H.x0 + 12, H.y0 + 20, 20, 14); ctx.fillRect(H.x1 - 32, H.y0 + 20, 20, 14);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(H.x0 + 42, H.y0 + 18, 16, 28);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(H.x0 + 50, H.y0 - 2, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(H.x0 + 50, H.y0 - 2); ctx.lineTo(H.x0 + 50, H.y0 - 8); ctx.moveTo(H.x0 + 50, H.y0 - 2); ctx.lineTo(H.x0 + 54, H.y0 - 2); ctx.stroke(); // clock
    ctx.font = this.font(10); const lw = ctx.measureText(label).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, P.x0 + 195 - lw / 2, P.y1 - 14, lw, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, P.x0 + 195, P.y1 - 6);
    // bench + lamp on the platform
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x1 - 70, P.y0 + 14, 40, 8); ctx.fillRect(P.x1 - 70, P.y0 + 24, 40, 6); ctx.fillStyle = '#4a2d12'; ctx.fillRect(P.x1 - 66, P.y0 + 30, 4, 8); ctx.fillRect(P.x1 - 38, P.y0 + 30, 4, 8);
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(P.x1 - 20, P.y0 + 10, 3, 30); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(P.x1 - 18, P.y0 + 8, 5, 0, Math.PI * 2); ctx.fill();
  },

  // ======================= Construction Town =======================
  paintSite(g) {
    const ctx = this.ctx, S = CFG.SITE, W = S.WORLD;
    // packed dirt with tyre ruts and gravel
    const grd = ctx.createLinearGradient(0, W.y0, 0, W.y1); grd.addColorStop(0, '#c9a46a'); grd.addColorStop(1, '#b08a52');
    ctx.fillStyle = grd; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let i = 0; i < 700; i++) { const x = W.x0 + ((i * 193) % (W.x1 - W.x0)), y = W.y0 + ((i * 101) % (W.y1 - W.y0)); ctx.beginPath(); ctx.ellipse(x, y, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 6;
    for (const [x0, y0, x1, y1] of [[2650, 300, 3300, 820], [2700, 320, 3350, 840], [3300, 200, 3950, 700], [3330, 180, 3980, 680]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    // a few puddles
    ctx.fillStyle = '#8fb8d6';
    for (const [x, y, r] of [[2680, 640, 30], [3620, 820, 36], [3880, 250, 24]]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
    // gravel road along the top
    const R = S.ROAD;
    ctx.fillStyle = '#8c8c86'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 400; i++) ctx.fillRect(R.x0 + ((i * 97) % (R.x1 - R.x0)), R.y0 + ((i * 53) % (R.y1 - R.y0)), 3, 2);
    this.bgPlatform(S.STATION, W, '🏗️ ' + S.STATION.name);
    ctx.fillStyle = '#d2cbbb'; ctx.fillRect(S.STATION.stopX + S.STATION.boardDx - 12, S.STATION.platform.y1, 24, R.y0 - S.STATION.platform.y1); // path to the road
    // orange safety fencing around the lot, with a wide gap by the station path
    const fence = (x0, y0, x1, y1) => {
      ctx.fillStyle = '#ff7a1a'; const vert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
      if (vert) { for (let y = y0; y < y1; y += 24) ctx.fillRect(x0 - 2, y, 5, 16); ctx.fillRect(x0 - 1, y0, 3, y1 - y0); }
      else { for (let x = x0; x < x1; x += 24) ctx.fillRect(x, y0 - 2, 16, 5); ctx.fillRect(x0, y0 - 1, x1 - x0, 3); }
    };
    { const px = S.STATION.stopX + S.STATION.boardDx; fence(W.x0 + 30, R.y1 + 20, px - 60, R.y1 + 20); fence(px + 60, R.y1 + 20, W.x1 - 30, R.y1 + 20); }
    // the half-built house: concrete slab, brick walls part way up, scaffolding, a doorway
    const B = S.BUILDING;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 6, B.y0 + 8, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#b9b5ad'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let x = B.x0; x < B.x1; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, B.y0); ctx.lineTo(x + 0.5, B.y1); ctx.stroke(); }
    for (let y = B.y0; y < B.y1; y += 40) { ctx.beginPath(); ctx.moveTo(B.x0, y + 0.5); ctx.lineTo(B.x1, y + 0.5); ctx.stroke(); }
    const brickWall = (x, y, w, h) => {
      ctx.fillStyle = '#b5543a'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let yy = y; yy < y + h; yy += 8) { ctx.fillRect(x, yy, w, 1.5); const off = ((yy - y) / 8) % 2 ? 10 : 0; for (let xx = x + off; xx < x + w; xx += 20) ctx.fillRect(xx, yy, 1.5, 8); }
    };
    brickWall(B.x0, B.y0, B.x1 - B.x0, 14); brickWall(B.x0, B.y0, 14, B.y1 - B.y0); brickWall(B.x1 - 14, B.y0, 14, B.y1 - B.y0);
    brickWall(B.x0, B.y1 - 14, B.door.x - B.door.half - B.x0, 14); brickWall(B.door.x + B.door.half, B.y1 - 14, B.x1 - (B.door.x + B.door.half), 14);
    ctx.fillStyle = '#9a9a9a'; // scaffolding poles along the back wall
    for (let x = B.x0 + 10; x < B.x1; x += 48) { ctx.fillRect(x, B.y0 - 30, 4, 46); }
    ctx.fillRect(B.x0 + 10, B.y0 - 30, B.x1 - B.x0 - 20, 4); ctx.fillRect(B.x0 + 10, B.y0 - 10, B.x1 - B.x0 - 20, 4);
    ctx.fillStyle = '#c99a5f'; ctx.fillRect(B.x0 + 14, B.y0 - 26, B.x1 - B.x0 - 28, 10); // plank
    ctx.fillStyle = '#2b1d14'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; U.roundRect(ctx, B.x0 + 60, B.y0 + 70, 180, 40, 6); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillText('🏠 FUTURE HOME OF', (B.x0 + B.x1) / 2, B.y0 + 84); ctx.fillText('PIZZA #2 ?', (B.x0 + B.x1) / 2, B.y0 + 100);
    // brick pallets
    for (const [x, y] of S.PALLETS) { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 24, y + 6, 48, 8); brickWall(x - 20, y - 16, 40, 24); }
    // tower crane: concrete base and the mast (the jib swings in the dynamic pass)
    const C = S.CRANE;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x - 20, C.y - 18, 48, 48);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(C.x - 24, C.y - 24, 48, 48);
    ctx.fillStyle = '#f2b705'; ctx.fillRect(C.x - 12, C.y - 12, 24, 24);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(C.x - 12, C.y - 12); ctx.lineTo(C.x + 12, C.y + 12); ctx.moveTo(C.x + 12, C.y - 12); ctx.lineTo(C.x - 12, C.y + 12); ctx.stroke();
    // portable toilet
    const T = S.TOILET;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(T.x - 12, T.y - 26, 32, 40);
    ctx.fillStyle = '#2f9e9e'; ctx.fillRect(T.x - 16, T.y - 30, 32, 40); ctx.fillStyle = '#237a7a'; ctx.fillRect(T.x - 16, T.y - 30, 32, 8);
    ctx.fillStyle = '#1b5e5e'; ctx.fillRect(T.x - 6, T.y - 16, 12, 24); ctx.fillStyle = '#fff'; ctx.fillRect(T.x - 12, T.y - 20, 6, 4);
    // cones and barrels
    for (const [x, y] of S.CONES) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x + 3, y - 24); ctx.lineTo(x - 3, y - 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 14, 12, 4);
    }
    for (const [x, y] of S.BARRELS) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 6, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - 10, y - 16, 20, 24, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 10, y - 10, 20, 2); ctx.fillRect(x - 10, y, 20, 2);
    }
    // sign by the station
    const G = S.SIGN;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(G.x - 3, G.y - 30, 6, 34); ctx.fillStyle = '#f2b705'; U.roundRect(ctx, G.x - 70, G.y - 60, 140, 34, 6); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🚧 UNDER CONSTRUCTION 🚧', G.x, G.y - 49); ctx.font = this.font(9); ctx.fillText('Ride the big machines!', G.x, G.y - 35);
  },

  // Construction Town things that move: dirt piles that get flattened, the crane's jib, the big machines' rider
  drawSiteDynamic(g) {
    const ctx = this.ctx, S = CFG.SITE;
    for (const m of g.mounds) {
      if (m.flat) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, m.r, m.r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(m.x + 4, m.y + 6, m.r, m.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a4f2a'; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#95643a'; ctx.beginPath(); ctx.ellipse(m.x - m.r * 0.1, m.y - m.r * 0.3, m.r * 0.65, m.r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b07a48'; ctx.beginPath(); ctx.ellipse(m.x - m.r * 0.2, m.y - m.r * 0.5, m.r * 0.3, m.r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    }
    // crane jib swinging slowly over the site, hook dangling below it
    const C = S.CRANE, a = Math.sin(g.time * 0.25) * 0.9 + 0.3, L = 230;
    ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(6, 10, L, 8);
    ctx.fillStyle = '#f2b705'; ctx.fillRect(-50, -6, L + 50, 12);
    ctx.fillStyle = '#2b1d14'; for (let x = -44; x < L - 10; x += 18) ctx.fillRect(x, -4, 3, 8);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-56, -10, 30, 20); // counterweight
    ctx.restore();
    const hx = C.x + Math.cos(a) * (L - 30), hy = C.y + Math.sin(a) * (L - 30);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy + 60); ctx.stroke();
    ctx.fillStyle = '#9a9a9a'; ctx.beginPath(); ctx.arc(hx, hy + 64, 6, 0, Math.PI); ctx.fill();
    ctx.fillStyle = Math.floor(g.time * 2) % 2 ? '#ff3b3b' : '#ffb3b3'; ctx.beginPath(); ctx.arc(C.x, C.y, 4, 0, Math.PI * 2); ctx.fill(); // beacon
  },

  drawSiteVehicle(g, v, lift) {
    const ctx = this.ctx, riding = g.driving && g.vehicle === v;
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    this.drawVehicle(v.kind, g, g.s.paint[v.kind], v);
    if (riding) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-10, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(-7, 0, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-9, 0, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    this.drawRidingExtras(g, v, lift);
  },

  // The ride between the towns: a side-on view of the train chugging past mountains.
  drawTravel(g) {
    const ctx = this.ctx, tr = g.travel, W = this.canvas.width / this.dpr, H = this.canvas.height / this.dpr;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (tr.via !== 'train') { const e = this.ext.find((x) => x.travel && x.travel[tr.via]); if (e) e.travel[tr.via](this, g, W, H); return; }
    const k = tr.t / tr.dur, ease = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1; // slow out, slow in
    const dist = (tr.t < 1.2 ? tr.t * tr.t / 2.4 : tr.t - 0.6) * 420; // scrolled distance (px)
    // heading home the train runs the other way: mirror the whole scene (the banner is drawn unmirrored below)
    const mirrored = tr.to === 'town';
    ctx.save(); if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(0.6, '#d9f0ff'); sky.addColorStop(1, '#eaf7ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.18, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();
    const groundY = H * 0.78;
    const layer = (speed, draw) => { const off = (dist * speed) % 2000; for (let r = -1; r <= Math.ceil(W / 2000) + 1; r++) draw(r * 2000 - off); };
    // clouds
    layer(0.08, (ox) => { ctx.fillStyle = 'rgba(255,255,255,0.92)'; for (let i = 0; i < 5; i++) { const cx = ox + i * 410 + 60, cy = H * (0.12 + (i % 3) * 0.08); ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.arc(cx + 20, cy - 10, 24, 0, Math.PI * 2); ctx.arc(cx + 46, cy, 17, 0, Math.PI * 2); ctx.fill(); } });
    // far mountains with snow, then nearer hills
    const range = (speed, h, step, col, snow, off) => layer(speed, (ox) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ox, groundY);
      for (let x = 0; x <= 2000; x += step) { const kk = x / step, peak = groundY - h * (0.55 + 0.45 * Math.abs(Math.sin(kk * 7.3 + off))); ctx.lineTo(ox + x, groundY - 6); ctx.lineTo(ox + x + step / 2, peak); }
      ctx.lineTo(ox + 2000, groundY); ctx.closePath(); ctx.fill();
      if (snow) { ctx.fillStyle = '#fff'; for (let x = 0; x <= 2000; x += step) { const kk = x / step, peak = groundY - h * (0.55 + 0.45 * Math.abs(Math.sin(kk * 7.3 + off))), px = ox + x + step / 2; ctx.beginPath(); ctx.moveTo(px, peak); ctx.lineTo(px + 24, peak + 30); ctx.lineTo(px + 6, peak + 24); ctx.lineTo(px - 6, peak + 32); ctx.lineTo(px - 24, peak + 30); ctx.closePath(); ctx.fill(); } }
    });
    range(0.15, H * 0.5, 250, '#7f8fb3', true, 0.3);
    range(0.3, H * 0.3, 170, '#5f7f8f', false, 1.9);
    range(0.5, H * 0.17, 110, '#4d8a56', false, 4.1);
    // meadow, trees, a fence
    ctx.fillStyle = '#6cb35a'; ctx.fillRect(0, groundY - 4, W, H - groundY + 4);
    layer(0.8, (ox) => { for (let i = 0; i < 9; i++) { const tx = ox + i * 230 + (i % 2) * 60, ty = groundY + 6; ctx.fillStyle = '#6b4a2b'; ctx.fillRect(tx - 4, ty - 26, 8, 26); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(tx, ty - 38, 22, 0, Math.PI * 2); ctx.arc(tx - 14, ty - 26, 16, 0, Math.PI * 2); ctx.arc(tx + 14, ty - 26, 16, 0, Math.PI * 2); ctx.fill(); } });
    // track bed and rails run under the train, ties streaming past
    const ty = groundY + 46;
    ctx.fillStyle = '#8d7b63'; ctx.fillRect(0, ty - 10, W, 24);
    layer(1, (ox) => { ctx.fillStyle = '#6b4a2b'; for (let x = 0; x < 2000; x += 26) ctx.fillRect(ox + x, ty - 8, 12, 20); });
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(0, ty - 4, W, 3); ctx.fillRect(0, ty + 6, W, 3);
    // the train, side on: two coaches and the locomotive, wheels turning, smoke puffing
    const scale = Math.min(1.1, W / 760), tx0 = W / 2 - 300 * scale, by = ty - 6;
    ctx.save(); ctx.translate(tx0, by); ctx.scale(scale, scale);
    const wheel = (x, r) => { ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(x, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; const a = dist / r; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(x - Math.cos(a) * r, -Math.sin(a) * r); ctx.moveTo(x + Math.cos(a + 1.57) * r, Math.sin(a + 1.57) * r); ctx.lineTo(x - Math.cos(a + 1.57) * r, -Math.sin(a + 1.57) * r); ctx.stroke(); };
    const coach = (x) => {
      ctx.fillStyle = '#2d8a5a'; U.roundRect(ctx, x, -58, 170, 52, 8); ctx.fill();
      ctx.fillStyle = '#3aa36c'; U.roundRect(ctx, x + 4, -64, 162, 10, 5); ctx.fill();
      ctx.fillStyle = '#bfe3ff'; for (let k2 = 14; k2 < 160; k2 += 30) U.roundRect(ctx, x + k2, -48, 20, 18, 3), ctx.fill();
      ctx.fillStyle = '#1f6e3e'; ctx.fillRect(x, -16, 170, 10);
      wheel(x + 30, 11); wheel(x + 60, 11); wheel(x + 110, 11); wheel(x + 140, 11);
    };
    coach(0); ctx.fillStyle = '#2b1d14'; ctx.fillRect(170, -30, 14, 8); coach(184); ctx.fillRect(354, -30, 14, 8);
    // locomotive
    const lx = 368;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, lx, -22, 200, 18, 4); ctx.fill();
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, lx, -74, 60, 60, 8); ctx.fill(); ctx.fillStyle = '#e53935'; U.roundRect(ctx, lx - 4, -80, 68, 12, 5); ctx.fill(); // cab
    ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, lx + 10, -66, 18, 18, 3); ctx.fill(); U.roundRect(ctx, lx + 34, -66, 18, 18, 3); ctx.fill();
    const boiler = ctx.createLinearGradient(0, -62, 0, -18); boiler.addColorStop(0, '#c9ccd2'); boiler.addColorStop(1, '#6b7480');
    ctx.fillStyle = boiler; U.roundRect(ctx, lx + 58, -62, 130, 44, 20); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(lx + 110, -62, 10, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(lx + 160, -90, 16, 30); ctx.fillRect(lx + 156, -92, 24, 8); // chimney
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(lx + 190, -40, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(lx + 188, -10); ctx.lineTo(lx + 214, 10); ctx.lineTo(lx + 188, 10); ctx.closePath(); ctx.fill(); // cowcatcher
    wheel(lx + 40, 12); wheel(lx + 90, 17); wheel(lx + 130, 17); wheel(lx + 172, 12);
    ctx.fillStyle = '#9aa0a8'; const rod = Math.cos(dist / 17) * 17; ctx.fillRect(lx + 90 + rod - 2, -4, 44, 4);
    // chef waving from the first coach window
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(203, -40, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(203, -49, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // smoke puffs trailing back from the chimney
    for (let i = 0; i < 7; i++) { const age = ((g.time * 1.3 + i * 0.6) % 4.2) / 4.2; const sx = tx0 + (lx + 168) * scale - age * 260, sy = by - 92 * scale - age * 70; ctx.fillStyle = `rgba(240,240,240,${0.75 * (1 - age)})`; ctx.beginPath(); ctx.arc(sx, sy, (6 + age * 22) * scale, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // destination banner
    const msg = tr.to === 'site' ? '🚂 Next stop: Construction Town! 🏗️' : '🚂 Next stop: home! 🍕';
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; const bw = Math.min(W - 24, 360); U.roundRect(ctx, W / 2 - bw / 2, 60, bw, 44, 12); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(bw < 300 ? 14 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 82);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, bw - 32, 6, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, (bw - 32) * U.clamp(k, 0, 1), 6, 3); ctx.fill();
    // fade in and out at the ends of the ride
    if (ease < 1) { ctx.fillStyle = `rgba(43,29,20,${1 - ease})`; ctx.fillRect(0, 0, W, H); }
  },

  // Playground across South Road from the farm.
  bgPlayground(g) {
    const ctx = this.ctx, PG = CFG.PLAYGROUND;
    // soft rubber surface
    ctx.fillStyle = '#c9b7e8'; U.roundRect(ctx, PG.x0 + 10, PG.y0, PG.x1 - PG.x0 - 20, PG.y1 - PG.y0, 24); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let i = 0; i < 60; i++) ctx.fillRect(PG.x0 + 20 + ((i * 53) % (PG.x1 - PG.x0 - 40)), PG.y0 + 8 + ((i * 31) % (PG.y1 - PG.y0 - 16)), 3, 3);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, PG.x0 + 20, PG.y0 + 6, 96, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛝 PLAYGROUND', PG.x0 + 68, PG.y0 + 14);
    for (const r of PG.rides) {
      if (r.kind === 'slide') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(r.x + 50, r.y + 52, 60, 10, 0, 0, Math.PI * 2); ctx.fill();
        // ladder
        ctx.fillStyle = '#3b7dd8'; ctx.fillRect(r.x - 10, r.y - 24, 5, 64); ctx.fillRect(r.x + 5, r.y - 24, 5, 64);
        for (let k = 0; k < 5; k++) ctx.fillRect(r.x - 10, r.y - 20 + k * 13, 20, 4);
        // top platform + slide
        ctx.fillStyle = '#2d5a8a'; ctx.fillRect(r.x - 14, r.y - 30, 30, 10);
        ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(r.x + 8, r.y - 30); ctx.lineTo(r.x + 110, r.y + 42); ctx.lineTo(r.x + 110, r.y + 56); ctx.lineTo(r.x + 8, r.y - 16); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e09a1c'; ctx.beginPath(); ctx.moveTo(r.x + 8, r.y - 16); ctx.lineTo(r.x + 110, r.y + 56); ctx.lineTo(r.x + 110, r.y + 62); ctx.lineTo(r.x + 8, r.y - 10); ctx.closePath(); ctx.fill();
      } else if (r.kind === 'swing') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 70, 70, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e4572e'; ctx.fillRect(r.x - 66, r.y - 6, 132, 8);
        for (const dx of [-62, 62]) { ctx.fillRect(dx + r.x - 3, r.y - 6, 6, 76); }
      } else if (r.kind === 'seesaw') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 14, 60, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(r.x - 12, r.y + 12); ctx.lineTo(r.x + 12, r.y + 12); ctx.lineTo(r.x, r.y - 6); ctx.closePath(); ctx.fill();
      } else if (r.kind === 'spring') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 22, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 26, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  },

  // Train and the moving parts of the playground (swing ropes, seesaw plank, spring horse).
  drawTrain(g, t = g.train) {
    const ctx = this.ctx;
    if (t.state === 'away') return;
    const y = t.y, stopped = t.state === 'stopped';
    for (const p of t.smoke) { ctx.fillStyle = `rgba(235,235,235,${0.65 * (1 - p.t / 1.6)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 5 + p.t * 10, 0, Math.PI * 2); ctx.fill(); }
    const bogies = (x, len) => { ctx.fillStyle = '#1e1e1e'; for (const bx of [x + 18, x + len - 34]) { U.roundRect(ctx, bx, y - 27, 16, 6, 2); ctx.fill(); U.roundRect(ctx, bx, y + 21, 16, 6, 2); ctx.fill(); } };
    const coupler = (x) => { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 10, y - 4, 20, 8); };
    // passenger coach seen from above: body, roof ridge, vents, windows along both sides, a door each side
    const coach = (x, len) => {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; U.roundRect(ctx, x + 4, y - 20, len, 48, 10); ctx.fill();
      bogies(x, len);
      ctx.fillStyle = '#2d8a5a'; U.roundRect(ctx, x, y - 24, len, 48, 10); ctx.fill();
      ctx.fillStyle = '#bfe3ff';
      for (let k = 12; k < len - 40; k += 20) { ctx.fillRect(x + k, y - 21, 12, 6); ctx.fillRect(x + k, y + 15, 12, 6); }
      ctx.fillStyle = stopped ? '#ffe08a' : '#1f6e3e'; ctx.fillRect(x + len - 34, y - 23, 14, 8); ctx.fillRect(x + len - 34, y + 15, 14, 8); // doors
      ctx.fillStyle = '#3aa36c'; U.roundRect(ctx, x + 6, y - 12, len - 12, 24, 8); ctx.fill(); // roof
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.35; ctx.fillRect(x + 10, y - 1, len - 20, 2); ctx.globalAlpha = 1; // ridge
      ctx.fillStyle = '#1f6e3e'; for (let k = 20; k < len - 20; k += 32) U.roundRect(ctx, x + k, y - 5, 10, 10, 3), ctx.fill(); // vents
    };
    const L = 150, front = t.x;
    coach(front - 160 - L - 12, L); coupler(front - 160 - 12 + 1); coach(front - 160 - 2 * L - 24, L); coupler(front - 160 - L - 24 + 1);
    // locomotive: chassis, round boiler, chimney, dome, cab, cowcatcher
    const x = front - 160;
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; U.roundRect(ctx, x + 4, y - 20, 160, 48, 10); ctx.fill();
    bogies(x, 160); ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, x + 70, y - 27, 16, 6, 2); ctx.fill(); U.roundRect(ctx, x + 70, y + 21, 16, 6, 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, x, y - 22, 160, 44, 8); ctx.fill();
    const boiler = ctx.createLinearGradient(0, y - 18, 0, y + 18); boiler.addColorStop(0, '#6b7480'); boiler.addColorStop(0.5, '#c9ccd2'); boiler.addColorStop(1, '#6b7480');
    ctx.fillStyle = boiler; U.roundRect(ctx, x + 6, y - 18, 108, 36, 18); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + 100, y, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(x + 100, y, 6, 0, Math.PI * 2); ctx.fill(); // chimney
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(x + 62, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 60, y - 2, 3, 0, Math.PI * 2); ctx.fill(); // dome
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, x - 2, y - 26, 52, 52, 8); ctx.fill(); // cab
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, x + 4, y - 16, 40, 32, 6); ctx.fill(); // cab roof
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(x + 8, y - 25, 14, 6); ctx.fillRect(x + 26, y - 25, 14, 6); ctx.fillRect(x + 8, y + 19, 14, 6); ctx.fillRect(x + 26, y + 19, 14, 6);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 156, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(x + 158, y - 16); ctx.lineTo(x + 176, y); ctx.lineTo(x + 158, y + 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 160 + k * 4, y - 12 + k * 2, 2, 24 - k * 4);
    if (g.onTrain) { const cx = front - 240; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx, y, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(cx + 3, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 1, y, 5.5, 0, Math.PI * 2); ctx.fill(); }
    // countdown over the locomotive while it waits
    if (stopped && !g.onTrain && t.remote) this.drawBubble(front - 40, y - 52 + Math.sin(g.time * 4) * 3, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Hop on to go home!', 0, 0); }, 124);
    else if (stopped && !g.onTrain) {
      const n = Math.ceil(t.leavesIn), urgent = n <= 5;
      this.drawBubble(front - 40, y - 52 + (urgent ? Math.sin(g.time * 12) * 3 : 0), () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = urgent ? '#e4572e' : '#2b1d14'; ctx.fillText(`Leaves in ${n}s`, 0, 0); }, 92);
    }
  },

  drawFishing(g) {
    const f = g.fishing; if (!f) return;
    const ctx = this.ctx, p = g.player, B = CFG.FISHING.bobber;
    const dip = f.phase === 'bite' ? 6 + Math.sin(g.time * 30) * 3 : Math.sin(g.time * 2) * 1.5;
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x + 10, p.y - 20); ctx.lineTo(p.x + 26, p.y - 50); ctx.stroke(); // rod
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x + 26, p.y - 50); ctx.quadraticCurveTo(B.x + 10, p.y - 60, B.x, B.y + dip - 6); ctx.stroke(); // line
    if (f.splash > 0) { ctx.strokeStyle = `rgba(255,255,255,${f.splash})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(B.x, B.y + 2, 14 * (1 - f.splash) + 4, 6 * (1 - f.splash) + 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(B.x, B.y + dip, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(B.x, B.y + dip, 6, Math.PI, 0); ctx.fill();
    if (f.phase === 'bite') { ctx.fillStyle = '#e4572e'; ctx.font = this.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', B.x, B.y - 26 + Math.sin(g.time * 20) * 3); }
    if (f.phase === 'done' && f.result) { ctx.font = this.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.result.ico, p.x + 30, p.y - 60 - f.t * 20); }
  },

  drawPlaygroundDynamic(g) {
    const ctx = this.ctx, PG = CFG.PLAYGROUND, ride = g.ride;
    for (const r of PG.rides) {
      if (r.kind === 'swing') {
        for (const dx of [-24, 24]) {
          const active = ride && ride.def === r && Math.abs(ride.seatX - (r.x + dx)) < 1;
          const a = active ? ride.angle || 0 : Math.sin(g.time * 1.2 + dx) * 0.06;
          // same pendulum as the rider: pivot on the top bar, rope length 70
          const px = r.x + dx, py = r.y, sx = px + Math.sin(a) * 70, sy = py + Math.cos(a) * 70;
          ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.lineTo(sx - 9, sy); ctx.moveTo(px + 9, py); ctx.lineTo(sx + 9, sy); ctx.stroke();
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(-a);
          ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -13, -3, 26, 6, 3); ctx.fill();
          ctx.restore();
        }
      } else if (r.kind === 'seesaw') {
        const tilt = ride && ride.def === r ? ride.tilt * 0.35 : 0.12;
        ctx.save(); ctx.translate(r.x, r.y - 4); ctx.rotate(tilt);
        ctx.fillStyle = '#f2b134'; U.roundRect(ctx, -60, -5, 120, 10, 5); ctx.fill();
        ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -60, -9, 16, 8, 3); ctx.fill(); U.roundRect(ctx, 44, -9, 16, 8, 3); ctx.fill();
        ctx.restore();
      } else if (r.kind === 'spring') {
        const b = ride && ride.def === r ? ride.bounce || 0 : 0;
        const hx = r.x, hy = r.y - b;
        // the coil stretches between the ground plate and the horse as it bounces
        const baseY = r.y + 24, topY = hy + 2, coils = 5, step = (baseY - topY) / coils;
        ctx.fillStyle = '#5c6670'; U.roundRect(ctx, hx - 12, baseY - 2, 24, 6, 3); ctx.fill();
        ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - 8, baseY);
        for (let k = 1; k <= coils; k++) ctx.lineTo(hx + (k % 2 ? 8 : -8), baseY - k * step);
        ctx.stroke();
        ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, hx - 16, hy - 14, 32, 14, 7); ctx.fill();
        ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, hx + 10, hy - 26, 12, 16, 5); ctx.fill();
        ctx.fillStyle = '#2b1d14'; ctx.fillRect(hx + 16, hy - 22, 2, 2); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(hx + 8, hy - 28, 14, 4);
        ctx.fillStyle = '#e4572e'; U.roundRect(ctx, hx - 6, hy - 18, 12, 5, 2); ctx.fill(); // saddle
      }
    }
  },

  // ======================= dynamic scenery =======================
  drawDecorDynamic(g) {
    const ctx = this.ctx, t = g.time;
    if (g.hasDecor('lights')) {
      const cols = ['#ff6b6b', '#ffd166', '#6bd3ff', '#7cf29a', '#ff9de2'];
      let i = 0;
      for (let x = 18; x < 370; x += 16) {
        const sag = 110 + 10 * Math.sin(((x - 10) % 40) / 40 * Math.PI);
        const tw = 0.6 + 0.4 * Math.sin(t * 4 + i * 1.3);
        ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = tw;
        ctx.beginPath(); ctx.arc(x, sag + 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.25 * tw; ctx.beginPath(); ctx.arc(x, sag + 4, 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; i++;
      }
    }
    if (g.hasDecor('neon')) {
      const flicker = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 2.3);
      ctx.save();
      ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 14 * flicker;
      ctx.fillStyle = `rgba(255,120,220,${flicker})`; ctx.font = this.font(17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('♥ PIZZA ♥', 820, 126);
      ctx.restore();
    }
  },

  drawKitchenDynamic(g) {
    const ctx = this.ctx, bt = g.bakeTime();
    for (let i = 0; i < g.ovenCount(); i++) {
      const o = CFG.OVENS[i];
      const prog = U.clamp(g.ovens[i].t / bt, 0, 1);
      // glass with glow
      const glow = 0.3 + 0.7 * prog;
      const grd = ctx.createLinearGradient(0, o.y - 10, 0, o.y + 20);
      grd.addColorStop(0, `rgba(255,${Math.floor(140 + 60 * prog)},40,${glow})`); grd.addColorStop(1, `rgba(190,60,10,${glow})`);
      ctx.fillStyle = grd; U.roundRect(ctx, o.x - 26, o.y - 10, 52, 30, 5); ctx.fill();
      // flames
      for (let k = 0; k < 5; k++) {
        const fx = o.x - 18 + k * 9, fh = 5 + 4 * Math.abs(Math.sin(g.time * 10 + k * 1.7 + i));
        ctx.fillStyle = k % 2 ? '#ffd166' : '#ff8c42';
        ctx.beginPath(); ctx.moveTo(fx - 3, o.y + 19); ctx.quadraticCurveTo(fx, o.y + 19 - fh * 2, fx + 3, o.y + 19); ctx.closePath(); ctx.fill();
      }
      this.drawPizza(o.x, o.y + 6, 9);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; U.roundRect(ctx, o.x - 24, o.y - 8, 48, 7, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, o.x - 30, o.y + 24, 60, 7, 3); ctx.fill();
      ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, o.x - 30, o.y + 24, 60 * prog, 7, 3); ctx.fill();
      // steam when nearly done
      if (prog > 0.8) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let k = 0; k < 3; k++) { const ph = (g.time * 1.5 + k * 0.7) % 1; ctx.beginPath(); ctx.arc(o.x + 22 + k * 5 + Math.sin(ph * 6) * 3, o.y - 46 - ph * 18, 4 * (1 - ph) + 1, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    const p = CFG.OVEN_PILE;
    this.drawPizzaStack(p.x, p.y - 2, g.s.piles.oven);
    this.drawCountBadge(p.x + 26, p.y - 18 - Math.min(g.s.piles.oven, 30) * 4, g.s.piles.oven, g.ovenPileCap());
  },

  drawCounterDynamic(g) {
    const ctx = this.ctx;
    const cs = CFG.CASHIER_SPOT;
    ctx.strokeStyle = g.cashierPresent() ? 'rgba(47,158,68,0.8)' : 'rgba(228,87,46,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.ellipse(cs.x, cs.y + 2, 26, 14, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    const d = CFG.DISPLAY, n = g.s.piles.display;
    this.drawPizzaStack(d.x, d.y - 6, n);
    // glass dome over the display
    const h = 14 + Math.min(n, 30) * 4;
    ctx.fillStyle = 'rgba(200,235,255,0.22)'; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(d.x - 30, d.y + 2); ctx.lineTo(d.x - 30, d.y - h + 10); ctx.quadraticCurveTo(d.x - 30, d.y - h - 10, d.x, d.y - h - 10); ctx.quadraticCurveTo(d.x + 30, d.y - h - 10, d.x + 30, d.y - h + 10); ctx.lineTo(d.x + 30, d.y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(d.x - 22, d.y - h + 4); ctx.quadraticCurveTo(d.x - 20, d.y - h - 2, d.x - 10, d.y - h - 5); ctx.stroke();
    this.drawCountBadge(d.x + 30, d.y - 22 - Math.min(n, 30) * 4, n, CFG.DISPLAY_CAP);
    this.drawCashPile(CFG.CASH_PILE.x, CFG.CASH_PILE.y, g.s.piles.cash);
  },

  drawDriveThruDynamic(g) {
    if (!g.isUnlocked('driveThru')) return;
    const s = CFG.DT_STACK;
    this.drawPizzaStack(s.x, s.y - 2, g.s.piles.dt);
    this.drawCountBadge(s.x + 26, s.y - 18 - Math.min(g.s.piles.dt, 30) * 4, g.s.piles.dt, CFG.DT_STACK_CAP);
    this.drawCashPile(CFG.DT_CASH.x, CFG.DT_CASH.y, g.s.piles.dtCash);
  },

  drawTablesDynamic(g) {
    const ctx = this.ctx;
    for (const t of g.activeTables()) {
      if (t.dirty) {
        ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(t.x - 7, t.y - 3, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(t.x + 8, t.y + 4, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.arc(t.x - 7, t.y - 3, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(t.x - 8, t.y - 4, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d98a3c'; ctx.fillRect(t.x + 3, t.y + 1, 5, 4); ctx.fillRect(t.x - 13, t.y + 7, 4, 3);
        ctx.fillStyle = '#9fe0ff'; U.roundRect(ctx, t.x + 10, t.y - 14, 6, 10, 2); ctx.fill();
        this.drawBubble(t.x, t.y - 56, () => {
          ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧹', 0, 0);
        }, 34);
        if (t.cleanProg > 0) this.drawProgressRing(t.x, t.y, 30, t.cleanProg, '#2f9e44');
      } else if (t.occupied) {
        this.drawPizza(t.x, t.y + 2, 10);
      }
      if (t.tip > 0) {
        for (let i = 0; i < Math.min(4, Math.ceil(t.tip / 10)); i++) {
          ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, t.x - 14 + i * 7, t.y - 2 - i * 2, 18, 9, 2); ctx.fill();
          ctx.fillStyle = '#4caf50'; U.roundRect(ctx, t.x - 14 + i * 7, t.y - 4 - i * 2, 18, 9, 2); ctx.fill();
          ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(t.x - 5 + i * 7, t.y + 0.5 - i * 2, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#1f6e2e'; U.roundRect(ctx, t.x - 20, t.y - 30, 40, 15, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(U.money(t.tip), t.x, t.y - 22);
      }
    }
  },

  drawPads(g) {
    const ctx = this.ctx;
    const pulse = 0.5 + 0.5 * Math.sin(g.time * 3);
    const R = CFG.PAD_RADIUS;
    for (const pad of g.allPads()) {
      const paid = g.s.padPaid[pad.key] || 0;
      const afford = !pad.maxed && g.s.cash + paid >= pad.price;
      const { x, y } = pad.pos;
      if (pad.kind === 'decor') {
        // ghost items carry just a price tag; the circle appears when you come close
        const nearBy = U.dist(g.player.x, g.player.y, x, y) < 110;
        if (nearBy) {
          ctx.fillStyle = afford ? `rgba(242,177,52,${0.35 + 0.2 * pulse})` : 'rgba(255,255,255,0.35)';
          ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = afford ? '#e4572e' : '#8a7a6a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
          ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
          if (paid > 0) { ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (paid / pad.price)); ctx.stroke(); }
        }
        const tag = `${pad.ico} ${U.money(pad.price - paid)}`;
        ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(tag).width + 14;
        ctx.fillStyle = afford ? 'rgba(31,110,46,0.9)' : 'rgba(43,29,20,0.75)'; U.roundRect(ctx, x - w / 2, y - 10 + (nearBy ? -26 : 0), w, 18, 9); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(tag, x, y - 1 + (nearBy ? -26 : 0));
        continue;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 4, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      const grd = ctx.createRadialGradient(x, y, 4, x, y, R);
      if (pad.maxed) { grd.addColorStop(0, 'rgba(230,225,215,0.8)'); grd.addColorStop(1, 'rgba(200,195,185,0.5)'); }
      else if (afford) { grd.addColorStop(0, `rgba(255,236,170,${0.8 + 0.2 * pulse})`); grd.addColorStop(1, `rgba(242,177,52,${0.5 + 0.2 * pulse})`); }
      else { grd.addColorStop(0, 'rgba(255,255,255,0.75)'); grd.addColorStop(1, 'rgba(255,255,255,0.35)'); }
      ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pad.maxed ? '#a79d90' : afford ? '#e4572e' : '#8a7a6a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      if (paid > 0 && !pad.maxed) {
        ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (paid / pad.price)); ctx.stroke();
      }
      // icon floating above, label + price on the pad
      const bob = afford ? Math.sin(g.time * 4 + x) * 2 : 0;
      ctx.font = this.font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = pad.maxed ? 0.6 : 1;
      ctx.fillStyle = '#2b1d14'; ctx.fillText(pad.ico, x, y - 44 + bob);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#2b1d14'; ctx.font = this.font(11); ctx.fillText(pad.label, x, y - 7);
      if (pad.maxed) { ctx.fillStyle = '#6f665c'; ctx.font = this.font(12); ctx.fillText(pad.locked ? 'LOCKED' : 'MAX', x, y + 9); }
      else { ctx.fillStyle = afford ? '#1f6e2e' : '#b8401c'; ctx.font = this.font(14); ctx.fillText(U.money(pad.price - paid), x, y + 9); }
      if (pad.sub) {
        ctx.fillStyle = 'rgba(43,29,20,0.75)'; U.roundRect(ctx, x - 34, y + 20, 68, 13, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = this.font(9); ctx.fillText(pad.sub, x, y + 27);
      }
    }
  },

  // Coins, fountain water and the dog.
  drawOutsideDynamic(g) {
    const ctx = this.ctx;
    for (const c of g.coins) {
      if (c.taken) continue;
      const t = g.time * 3 + c.phase;
      const w = Math.abs(Math.cos(t)) * 11 + 2, lift = Math.sin(t * 0.7) * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c99a1e'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 8 + lift + 2, w, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 8 + lift, w, 12, 0, 0, Math.PI * 2); ctx.fill();
      if (w > 6) { ctx.fillStyle = '#c99a1e'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', c.x, c.y - 7 + lift); }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(c.x - w * 0.4, c.y - 13 + lift, 2, 0, Math.PI * 2); ctx.fill();
    }
    const f = CFG.FOUNTAIN;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let k = 0; k < 10; k++) {
      const ph = (g.time * 0.9 + k * 0.1) % 1, a = (k / 10) * Math.PI * 2;
      const r = ph * 34, h = Math.sin(ph * Math.PI) * 26;
      ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * r, f.y - 28 - h + ph * 26, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // ducks on the pond
    const pd = CFG.POND;
    for (let k = 0; k < 2; k++) {
      const a = g.time * 0.3 + k * 2.6;
      const dx = pd.x + Math.cos(a) * 30, dy = pd.y + Math.sin(a) * 16 + 6;
      ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.ellipse(dx, dy, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(dx + (Math.cos(a + 1.57) < 0 ? -6 : 6), dy - 5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(dx + (Math.cos(a + 1.57) < 0 ? -12 : 8), dy - 6, 4, 2);
    }
    this.drawDog(g.dog, g);
    this.drawTownDynamic(g);
    this.drawFarmDynamic(g);
    this.drawPlaygroundDynamic(g);
    this.drawFishing(g);
    this.drawSiteDynamic(g);
    for (const e of this.ext) if (e.dynamic) e.dynamic(this, g);
  },

  drawTownDynamic(g) {
    const ctx = this.ctx;
    for (const h of g.houses) {
      if (h.order) {
        const left = h.order.want - h.order.have;
        const bob = Math.sin(g.time * 4) * 3;
        this.drawBubble(h.door.x, h.y0 - 40 + bob, () => {
          this.drawPizza(-10, 0, 8);
          ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('×' + left, 2, 1);
        }, 46);
        this.drawProgressBar(h.door.x, h.y0 - 22 + bob, 40, h.order.t / CFG.ORDER_WAIT, '#f2b134');
      } else if (h.happy > 0) {
        this.drawBubble(h.door.x, h.y0 - 40, () => { ctx.font = this.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('😋', 0, 0); }, 30);
      }
    }
    if (g.s.iceCream.owned) {
      const IC = CFG.ICE_CREAM;
      this.drawPerson(IC.scooper.x, IC.scooper.y, { shirt: '#fff', skin: '#e0ac69', hat: 'cap', capColor: '#ff8fab', facing: 1, moving: false, bob: 0, carry: 0, apron: '#ffb6c1', pants: '#4a4a4a' });
      this.drawCashPile(IC.cash.x, IC.cash.y, g.s.iceCream.cash);
    }
  },

  drawDeliveryCar(g) {
    const ctx = this.ctx, c = g.car, owned = g.s.vehicles.car;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle);
    if (!owned) ctx.globalAlpha = 0.6;   // on the showroom floor, not yours yet
    this.drawVehicle('car', g, owned ? g.s.paint.car : '#c9ccd2');
    // roof sign
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, -16, -8, 32, 16, 4); ctx.fill();
    this.drawPizza(0, 0, 6);
    ctx.restore();
    if (owned) this.drawRidingExtras(g, c, 30);
  },

  // pizzas stacked on the vehicle while driving, and the "hop in" bubble when standing next to it
  drawRidingExtras(g, c, lift) {
    const ctx = this.ctx;
    if (g.driving && g.vehicle === c && g.player.carry > 0) {
      const n = Math.min(g.player.carry, 30);
      for (let i = 0; i < n; i++) { ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(c.x, c.y - lift - i * 4 + 2, 11, 0, Math.PI * 2); ctx.fill(); this.drawPizza(c.x, c.y - lift - i * 4, 11); }
      this.drawCountBadge(c.x + 18, c.y - lift - 10 - n * 4, g.player.carry, g.playerCap());
    }
    if (!g.driving && g.nearVehicle === c) {
      const bob = Math.sin(g.time * 5) * 3;
      const label = CFG.VEHICLES[c.kind].label + '!';
      this.drawBubble(c.x, c.y - 48 + bob, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(label, 0, 0); }, 64);
    }
  },

  drawTractorRide(g) {
    const ctx = this.ctx, t = g.tractor, riding = g.driving && g.vehicle === t;
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.angle);
    this.drawVehicle('tractor', g, g.s.paint.tractor);
    if (riding) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-16, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(-13, 0, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-15, 0, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    this.drawRidingExtras(g, t, 26);
  },

  drawDeliveryBike(g) {
    const ctx = this.ctx, b = g.bike, riding = g.driving && g.vehicle === b, owned = g.s.vehicles.bike;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
    if (!owned) ctx.globalAlpha = 0.6;
    // scooter, nose +x
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 4, 28, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.ellipse(-20, 0, 8, 5, 0, 0, Math.PI * 2); ctx.ellipse(22, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = owned ? this.paintColor(g.s.paint.bike, g) : '#c9ccd2'; U.roundRect(ctx, -14, -8, 36, 16, 7); ctx.fill();     // body
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -10, -6, 16, 12, 5); ctx.fill();     // seat
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(16, -12, 3, 24);                           // handlebar
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(24, 0, 3, 0, Math.PI * 2); ctx.fill(); // headlight
    // pizza box on the back rack
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, -30, -9, 16, 18, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕', -22, 0);
    if (riding) {
      // the chef riding: shoulders + hat seen from above
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(3, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(1, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(14, -9, 2.5, 0, Math.PI * 2); ctx.arc(14, 9, 2.5, 0, Math.PI * 2); ctx.fill(); // hands on the bars
    }
    ctx.restore();
    if (owned) this.drawRidingExtras(g, b, 22);
  },

  drawDog(d, g) {
    const ctx = this.ctx, x = d.x, y = d.y, f = d.facing;
    const bob = d.moving ? Math.sin(d.bob) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    // legs
    ctx.fillStyle = '#a66a2c';
    const st = d.moving ? Math.sin(d.bob) * 3 : 0;
    ctx.fillRect(x - 10, y - 6 + st, 4, 9); ctx.fillRect(x + 6, y - 6 - st, 4, 9); ctx.fillRect(x - 4, y - 6 - st, 4, 9); ctx.fillRect(x + 1, y - 6 + st, 4, 9);
    // body
    ctx.fillStyle = '#c17f3a'; U.roundRect(ctx, x - 14, y - 18 + bob, 28, 15, 7); ctx.fill();
    // tail (wags)
    ctx.strokeStyle = '#c17f3a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - f * 13, y - 12 + bob); ctx.lineTo(x - f * 21, y - 20 + bob + Math.sin(d.wag) * 5); ctx.stroke();
    // head
    ctx.fillStyle = '#c17f3a'; ctx.beginPath(); ctx.arc(x + f * 12, y - 20 + bob, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a26'; ctx.beginPath(); ctx.ellipse(x + f * 6, y - 24 + bob, 4, 6, f * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1d3a8'; ctx.beginPath(); ctx.ellipse(x + f * 17, y - 17 + bob, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 20, y - 18 + bob, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + f * 13, y - 22 + bob, 1.6, 0, Math.PI * 2); ctx.fill();
    if (d.happy > 0) { ctx.fillStyle = '#ff6b8a'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.fillText('♥', x + f * 12, y - 34 + bob); }
  },

  // Tree canopies are drawn over everything so you can walk "under" them.
  drawForeground(g) {
    const ctx = this.ctx;
    for (const t of CFG.TREES) {
      const sway = Math.sin(g.time * 1.2 + t.x) * 2;
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(t.x + sway, t.y - 44 * t.s, 30 * t.s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(t.x - 18 * t.s + sway, t.y - 30 * t.s, 22 * t.s, 0, Math.PI * 2); ctx.arc(t.x + 18 * t.s + sway, t.y - 30 * t.s, 22 * t.s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(t.x - 8 * t.s + sway, t.y - 52 * t.s, 14 * t.s, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  },

  // ======================= entities =======================
  drawEntities(g) {
    const items = [];
    for (const c of g.customers) items.push({ y: c.y, draw: () => this.drawCustomer(c, g) });
    for (const st of g.staff) items.push({ y: st.y, draw: () => this.drawStaff(st, g) });
    for (const c of g.cars) items.push({ y: c.y, draw: () => this.drawCar(c, g) });
    if (g.fireTruck.state !== 'away') items.push({ y: g.fireTruck.y + 10, draw: () => { const t = g.fireTruck; this.ctx.save(); this.ctx.translate(t.x, t.y); this.ctx.rotate(t.angle); this.drawVehicle('firetruck', g, '#d32f2f'); this.ctx.restore(); } });
    for (const c of g.icCustomers) items.push({ y: c.y, draw: () => this.drawIceCreamCustomer(c, g) });
    items.push({ y: g.car.y + 10, draw: () => this.drawDeliveryCar(g) });
    items.push({ y: g.bike.y + 8, draw: () => this.drawDeliveryBike(g) });
    items.push({ y: g.tractor.y + 12, draw: () => this.drawTractorRide(g) });
    items.push({ y: g.train.y + 20, draw: () => this.drawTrain(g, g.train) });
    items.push({ y: g.siteTrain.y + 20, draw: () => this.drawTrain(g, g.siteTrain) });
    for (const v of [g.excavator, g.dumptruck, g.bulldozer]) items.push({ y: v.y + 12, draw: () => this.drawSiteVehicle(g, v, 30) });
    if (!g.driving && !g.onTrain) items.push({ y: g.player.y, draw: () => this.drawPlayer(g) });
    for (const e of this.ext) if (e.entities) e.entities(this, g, items);
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
  },

  specialLook(kind) {
    switch (kind) {
      case 'santa': return { shirt: '#d62828', pants: '#d62828', skin: '#f1c27d', hat: 'santa', beard: '#fff', belt: true, stripes: false };
      case 'cat': return { shirt: '#fff', pants: '#8a8a8a', skin: '#a9a9a9', hat: 'tallhat', cat: true, bowtie: '#e4572e', stripes: false };
      case 'robot': return { shirt: '#8c97a3', pants: '#5c6670', skin: '#b8c2cc', hat: 'antenna', robot: true, stripes: false };
      case 'pirate': return { shirt: '#fff', pants: '#2b1d14', hat: 'bandana', eyepatch: true, stripes: true };
      case 'dino': return { shirt: '#4caf50', pants: '#3b8f3f', skin: '#5cc466', hat: 'spikes', dino: true, stripes: false };
    }
    return {};
  },

  drawPerson(x, y, o) {
    const ctx = this.ctx;
    const bob = o.moving ? Math.sin(o.bob || 0) * 2 : 0;
    const f = o.facing || 1;
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(43,29,20,0.45)';
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    // legs + shoes
    const step = o.moving ? Math.sin((o.bob || 0)) * 4 : 0;
    ctx.fillStyle = o.pants || '#3a3f5c';
    U.roundRect(ctx, x - 9, y - 10 + step, 7, 14, 3); ctx.fill();
    U.roundRect(ctx, x + 2, y - 10 - step, 7, 14, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14';
    ctx.beginPath(); ctx.ellipse(x - 5.5, y + 4 + step, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5.5, y + 4 - step, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    // body
    ctx.fillStyle = o.shirt; U.roundRect(ctx, x - 13, y - 30 + bob, 26, 24, 9); ctx.fill(); ctx.stroke();
    if (o.stripes) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 11, y - 26 + bob + k * 7, 22, 2.5); }
    if (o.apron) {
      ctx.fillStyle = o.apron; U.roundRect(ctx, x - 8, y - 24 + bob, 16, 17, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, x - 5, y - 14 + bob, 10, 5, 2); ctx.fill();
    }
    if (o.belt) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 13, y - 14 + bob, 26, 4); ctx.fillStyle = '#f2b134'; ctx.fillRect(x - 3, y - 15 + bob, 6, 6); }
    if (o.bowtie) { ctx.fillStyle = o.bowtie; ctx.beginPath(); ctx.moveTo(x, y - 27 + bob); ctx.lineTo(x - 7, y - 31 + bob); ctx.lineTo(x - 7, y - 23 + bob); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y - 27 + bob); ctx.lineTo(x + 7, y - 31 + bob); ctx.lineTo(x + 7, y - 23 + bob); ctx.closePath(); ctx.fill(); }
    if (o.dino) { ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.moveTo(x - f * 12, y - 14 + bob); ctx.quadraticCurveTo(x - f * 26, y - 10 + bob, x - f * 28, y - 22 + bob); ctx.lineTo(x - f * 12, y - 20 + bob); ctx.closePath(); ctx.fill(); }
    // arms
    ctx.fillStyle = o.skin;
    ctx.beginPath(); ctx.arc(x - 14, y - 16 + bob, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14, y - 16 + bob, 3.5, 0, Math.PI * 2); ctx.fill();
    // head
    if (o.robot) { ctx.fillStyle = o.skin; U.roundRect(ctx, x - 10, y - 48 + bob, 20, 20, 4); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = o.skin; ctx.beginPath(); ctx.arc(x, y - 38 + bob, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if (o.cat) {
      ctx.fillStyle = o.skin; ctx.beginPath(); ctx.moveTo(x - 10, y - 42 + bob); ctx.lineTo(x - 8, y - 54 + bob); ctx.lineTo(x - 2, y - 46 + bob); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 10, y - 42 + bob); ctx.lineTo(x + 8, y - 54 + bob); ctx.lineTo(x + 2, y - 46 + bob); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 6, y - 34 + bob); ctx.lineTo(x + d * 16, y - 36 + bob); ctx.moveTo(x + d * 6, y - 32 + bob); ctx.lineTo(x + d * 16, y - 31 + bob); ctx.stroke(); }
      ctx.lineWidth = 1.5;
    }
    if (o.dino) {
      ctx.fillStyle = o.skin; U.roundRect(ctx, x + f * 4, y - 38 + bob, 14, 9, 4); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x + f * 9, y - 31 + bob, 2, 2); ctx.fillRect(x + f * 13, y - 31 + bob, 2, 2);
    }
    if (o.beard) { ctx.fillStyle = o.beard; ctx.beginPath(); ctx.arc(x, y - 33 + bob, 9, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y - 26 + bob, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    // hair / hat
    if (o.hat === 'santa') {
      ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.moveTo(x - 11, y - 44 + bob); ctx.lineTo(x + 11, y - 44 + bob); ctx.lineTo(x + f * 6, y - 64 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 12, y - 47 + bob, 24, 6, 3); ctx.fill(); ctx.beginPath(); ctx.arc(x + f * 6, y - 64 + bob, 4, 0, Math.PI * 2); ctx.fill();
    } else if (o.hat === 'tallhat') {
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#d62828'; ctx.fillRect(x - 8, y - 52 - k * 7 + bob, 16, 7); }
      ctx.fillStyle = '#d62828'; U.roundRect(ctx, x - 13, y - 48 + bob, 26, 4, 2); ctx.fill();
      ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.strokeRect(x - 8, y - 87 + bob, 16, 39);
    } else if (o.hat === 'antenna') {
      ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 48 + bob); ctx.lineTo(x, y - 58 + bob); ctx.stroke();
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(x, y - 60 + bob, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.5;
    } else if (o.hat === 'bandana') {
      ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.arc(x, y - 40 + bob, 11, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - f * 10, y - 40 + bob); ctx.lineTo(x - f * 20, y - 34 + bob); ctx.lineTo(x - f * 9, y - 36 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 6 + k * 6, y - 45 + bob, 1.3, 0, Math.PI * 2); ctx.fill(); }
    } else if (o.hat === 'spikes') {
      ctx.fillStyle = '#2e7d32'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 8 + k * 7, y - 44 + bob); ctx.lineTo(x - 4 + k * 7, y - 54 + bob); ctx.lineTo(x + k * 7, y - 44 + bob); ctx.closePath(); ctx.fill(); }
    } else if (o.hat === 'chef') {
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 9, y - 54 + bob, 18, 10, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - 5, y - 56 + bob, 6, 0, Math.PI * 2); ctx.arc(x + 5, y - 56 + bob, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; // mustache
      ctx.beginPath(); ctx.ellipse(x + f * 1 - 3, y - 33 + bob, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(x + f * 1 + 3, y - 33 + bob, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    } else if (o.hat === 'cap') {
      ctx.fillStyle = o.capColor || '#2b1d14'; ctx.beginPath(); ctx.arc(x, y - 40 + bob, 11, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - 11 + (f < 0 ? -6 : 0), y - 41 + bob, 17, 3.5);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 3, y - 48 + bob, 6, 3);
    } else {
      ctx.fillStyle = o.hair || '#2b1d14';
      const hs = o.hairStyle || 0;
      if (hs === 0) { ctx.beginPath(); ctx.arc(x, y - 40 + bob, 10.5, Math.PI, 0); ctx.fill(); }
      else if (hs === 1) { ctx.beginPath(); ctx.arc(x, y - 40 + bob, 10.5, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(x - f * 7, y - 36 + bob, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (hs === 2) { ctx.beginPath(); ctx.arc(x, y - 40 + bob, 10.5, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 50 + bob, 5, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(x, y - 41 + bob, 10.5, Math.PI * 1.15, Math.PI * 1.85); ctx.fill(); }
    }
    // face
    ctx.fillStyle = '#2b1d14';
    if (o.angry) {
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + f * 2 - 4, y - 41 + bob); ctx.lineTo(x + f * 2 + 1, y - 38 + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + f * 2 + 6, y - 41 + bob); ctx.lineTo(x + f * 2 + 1, y - 38 + bob); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + f * 2, y - 31 + bob, 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (o.robot) {
      ctx.fillStyle = '#6bd3ff'; ctx.fillRect(x + f * 3 - 6, y - 41 + bob, 5, 4); ctx.fillRect(x + f * 3 + 1, y - 41 + bob, 5, 4);
      ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 5 + k * 3, y - 33 + bob, 2, 2);
    } else {
      ctx.beginPath(); ctx.arc(x + f * 3 - 3, y - 38 + bob, 1.7, 0, Math.PI * 2); ctx.arc(x + f * 3 + 3, y - 38 + bob, 1.7, 0, Math.PI * 2); ctx.fill();
      if (o.eyepatch) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 3 + 3, y - 38 + bob, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 10, y - 43 + bob); ctx.lineTo(x + 10, y - 36 + bob); ctx.stroke(); ctx.lineWidth = 1.5; }
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + f * 2, y - 35 + bob, 3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,120,0.35)';
      ctx.beginPath(); ctx.arc(x + f * 3 - 7, y - 34 + bob, 2.2, 0, Math.PI * 2); ctx.arc(x + f * 3 + 7, y - 34 + bob, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    // carried pizzas
    if (o.carry > 0) {
      const n = Math.min(o.carry, 30);
      for (let i = 0; i < n; i++) { ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(x, y - 60 + bob - i * 4, 12, 0, Math.PI * 2); ctx.fill(); this.drawPizza(x, y - 62 + bob - i * 4, 12); }
    }
  },

  drawPlayer(g) {
    const p = g.player;
    const swinging = g.ride && g.ride.def.kind === 'swing';
    if (swinging) { this.ctx.save(); this.ctx.translate(p.x, p.y); this.ctx.rotate(-(g.ride.angle || 0)); this.ctx.translate(-p.x, -p.y); }
    this.drawPerson(p.x, p.y, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: p.facing, moving: p.moving, bob: p.bob, carry: p.carry, pants: '#2d3a4a' });
    if (swinging) this.ctx.restore();
    if (p.carry > 0) this.drawCountBadge(p.x + 18, p.y - 70 - Math.min(p.carry, 30) * 4, p.carry, g.playerCap());
    if (p.cleanTarget) this.drawProgressRing(p.x, p.y - 20, 22, p.cleanTarget.cleanProg, '#2f9e44');
    if (g.nearPrep) { const pt = CFG.PREP_TABLE, bob = Math.sin(g.time * 5) * 3; this.drawBubble(pt.x, pt.y - 40 + bob, () => { this.ctx.font = this.font(13); this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillStyle = '#2b1d14'; this.ctx.fillText('👐 Make a pizza!', 0, 0); }, 92); }
  },

  drawStaff(st, g) {
    st.bob = (st.bob || 0) + (st.moving ? 0.25 : 0);
    const cap = st.role === 'cashier' ? '#2d3a4a' : st.role === 'helper' ? '#b8401c' : '#1f6e2e';
    this.drawPerson(st.x, st.y, { shirt: st.shirt, skin: st.skin, hat: 'cap', capColor: cap, facing: st.facing, moving: st.moving, bob: st.bob, carry: st.carry, apron: st.role === 'helper' ? '#fff' : null, pants: '#3a3f5c' });
    if (st.role === 'cleaner' && st.state === 'cleaning') {
      this.drawBubble(st.x, st.y - 72, () => { this.ctx.font = this.font(13); this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillStyle = '#2b1d14'; this.ctx.fillText('🧹', 0, 0); }, 30);
    }
  },

  drawCustomer(c, g) {
    const ctx = this.ctx;
    c.bob = (c.bob || 0) + (c.moving ? 0.25 : 0);
    const look = { shirt: c.shirt, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle, stripes: c.stripes, facing: c.facing, moving: c.moving, bob: c.bob, carry: c.state === 'eating' ? 0 : c.have, angry: c.angry, pants: '#4a4a4a' };
    if (c.special) Object.assign(look, this.specialLook(c.special));
    this.drawPerson(c.x, c.y, look);
    const idx = c.inMainQueue ? g.queueIndex(c) : -1;
    const bubbleY = c.y - 66 - Math.min(c.have, 30) * 4;
    const maxPat = CFG.PATIENCE * g.patienceBonus();
    if (c.inMainQueue && idx === 0 && c.state === 'queue') {
      const left = c.want - c.have;
      this.drawBubble(c.x, bubbleY, () => {
        this.drawPizza(-10, 0, 8);
        ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('×' + left, 2, 1);
      }, 46);
      this.drawPatience(c.x, bubbleY - 18, c.patience / maxPat);
    } else if (c.inMainQueue && c.patience < maxPat * 0.35) {
      this.drawPatience(c.x, c.y - 60, c.patience / maxPat);
    } else if (c.state === 'paying') {
      if (g.cashierPresent()) {
        this.drawBubble(c.x, bubbleY, () => {
          ctx.fillStyle = '#2f9e44'; ctx.font = this.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
        }, 30);
        this.drawProgressBar(c.x, bubbleY + 16, 40, c.payProg, '#2f9e44');
      } else {
        this.drawBubble(c.x, bubbleY, () => {
          ctx.fillStyle = '#e4572e'; ctx.font = this.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 1);
        }, 30, '#ffd6cc');
      }
    } else if (c.state === 'eating') {
      const t = (Math.sin(g.time * 8 + c.id) + 1) / 2;
      this.drawBubble(c.x, c.y - 66, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(t > 0.5 ? '😋' : '🍕', 0, 0); }, 30);
    }
  },

  drawIceCreamCustomer(c, g) {
    const ctx = this.ctx;
    c.bob = (c.bob || 0) + (c.moving ? 0.25 : 0);
    this.drawPerson(c.x, c.y, { shirt: c.shirt, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle, stripes: c.stripes, facing: c.facing, moving: c.moving, bob: c.bob, carry: 0, pants: '#4a4a4a' });
    if (c.cone) {
      const x = c.x + c.facing * 14, y = c.y - 22;
      ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.flavor; ctx.beginPath(); ctx.arc(x, y - 3, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(x + 1, y - 9, 2, 0, Math.PI * 2); ctx.fill();
    } else if (c.state === 'order') {
      this.drawBubble(c.x, c.y - 66, () => { ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🍦', 0, 0); }, 30);
    }
  },

  drawCar(c, g) {
    const ctx = this.ctx;
    const x = c.x, y = c.y;
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.state === 'path' ? c.angle : 0);
    this.drawVehicle(c.kind || 'car', g, c.color);
    ctx.restore();
    if (c.state === 'waiting') {
      const left = c.want - c.have;
      this.drawBubble(x, y - 40, () => {
        this.drawPizza(-10, 0, 8);
        ctx.fillStyle = '#2b1d14'; ctx.font = this.font(13); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('×' + left, 2, 1);
      }, 46);
      if (c.patience < CFG.CAR_PATIENCE * 0.5) this.drawPatience(x, y - 58, c.patience / CFG.CAR_PATIENCE);
    }
  },

  // Top-down vehicles drawn at the origin, nose pointing +x.
  // 'rainbow' paint cycles through the hues
  paintColor(color, g) { return color === 'rainbow' ? `hsl(${Math.floor((g.time * 70) % 360)}, 85%, 56%)` : color; },
  drawVehicle(kind, g, color, v) {
    const ctx = this.ctx, t = g.time;
    color = this.paintColor(color, g);
    const wheels = (xs, w = 14, h = 9, half = 22) => { ctx.fillStyle = '#1e1e1e'; for (const wx of xs) { U.roundRect(ctx, wx - w / 2, -half - 4, w, h, 3); ctx.fill(); U.roundRect(ctx, wx - w / 2, half - 5, w, h, 3); ctx.fill(); } };
    const lights = (len, half) => { ctx.fillStyle = '#fff6b0'; U.roundRect(ctx, len / 2 - 4, -half + 5, 5, 9, 2); ctx.fill(); U.roundRect(ctx, len / 2 - 4, half - 14, 5, 9, 2); ctx.fill(); ctx.fillStyle = '#ff5252'; U.roundRect(ctx, -len / 2 - 1, -half + 5, 5, 9, 2); ctx.fill(); U.roundRect(ctx, -len / 2 - 1, half - 14, 5, 9, 2); ctx.fill(); };
    const flash = Math.floor(t * 5) % 2 === 0;
    const lightbar = (x) => { ctx.fillStyle = flash ? '#ff3b3b' : '#3b7dff'; U.roundRect(ctx, x - 4, -14, 8, 12, 2); ctx.fill(); ctx.fillStyle = flash ? '#3b7dff' : '#ff3b3b'; U.roundRect(ctx, x - 4, 2, 8, 12, 2); ctx.fill(); ctx.fillStyle = '#ddd'; ctx.fillRect(x - 5, -2, 10, 4); };
    const shadow = (len, half) => { ctx.fillStyle = 'rgba(0,0,0,0.28)'; U.roundRect(ctx, -len / 2 + 2, -half + 5, len, half * 2, 11); ctx.fill(); };
    for (const e of this.ext) if (e.vehicleArt && e.vehicleArt[kind]) { e.vehicleArt[kind](this, g, color, v, { shadow, wheels, lights, lightbar }); return; }
    switch (kind) {
      case 'firetruck': {
        shadow(124, 24); wheels([-44, -16, 40], 15, 10, 24);
        ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, -62, -24, 124, 48, 9); ctx.fill();
        ctx.fillStyle = '#9e1b1b'; U.roundRect(ctx, -62, 10, 124, 14, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-58, -20, 116, 3); ctx.fillRect(-58, 17, 116, 3);
        // cab
        ctx.fillStyle = '#b71c1c'; U.roundRect(ctx, 18, -22, 42, 44, 7); ctx.fill();
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 44, -17, 12, 34, 3); ctx.fill(); U.roundRect(ctx, 24, -17, 8, 34, 3); ctx.fill();
        lightbar(36);
        // ladder on the back
        ctx.fillStyle = '#9e9e9e'; U.roundRect(ctx, -58, -9, 74, 18, 3); ctx.fill();
        ctx.fillStyle = '#cfd3d8'; ctx.fillRect(-56, -8, 70, 3); ctx.fillRect(-56, 5, 70, 3);
        for (let k = -52; k < 14; k += 8) ctx.fillRect(k, -6, 2, 12);
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(-50, 15, 4, 0, Math.PI * 2); ctx.fill();
        lights(124, 24);
        break;
      }
      case 'mixer': {
        shadow(108, 22); wheels([-38, -12, 36], 14, 9, 22);
        ctx.fillStyle = '#6d6d6d'; U.roundRect(ctx, -54, -16, 108, 32, 6); ctx.fill();
        ctx.fillStyle = '#f2b134'; U.roundRect(ctx, 22, -21, 34, 42, 7); ctx.fill();
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 42, -16, 10, 32, 3); ctx.fill();
        // drum with rotating stripes
        ctx.save(); ctx.beginPath(); ctx.ellipse(-14, 0, 36, 19, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#d7dbe0'; ctx.fillRect(-60, -30, 100, 60);
        ctx.fillStyle = '#9aa0a8'; const off = (t * 40) % 16;
        for (let k = -70; k < 40; k += 16) { ctx.beginPath(); ctx.moveTo(k + off, -30); ctx.lineTo(k + off + 8, -30); ctx.lineTo(k + off + 20, 30); ctx.lineTo(k + off + 12, 30); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        ctx.strokeStyle = '#6d6d6d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(-14, 0, 36, 19, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#6d6d6d'; U.roundRect(ctx, -58, -5, 10, 10, 2); ctx.fill();
        lights(108, 22);
        break;
      }
      case 'police': {
        shadow(92, 22); wheels([-28, 26]);
        ctx.fillStyle = '#f5f5f5'; U.roundRect(ctx, -46, -22, 92, 44, 12); ctx.fill();
        ctx.fillStyle = '#1e1e1e'; ctx.fillRect(-22, -22, 30, 44); U.roundRect(ctx, -46, 10, 92, 12, 6); ctx.fill();
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 8, -15, 15, 30, 4); ctx.fill(); U.roundRect(ctx, -30, -15, 8, 30, 3); ctx.fill();
        ctx.fillStyle = '#f5f5f5'; U.roundRect(ctx, -20, -14, 26, 28, 5); ctx.fill();
        lightbar(-4);
        ctx.fillStyle = '#1e1e1e'; ctx.font = this.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); ctx.translate(32, 0); ctx.rotate(Math.PI / 2); ctx.fillText('POLICE', 0, 0); ctx.restore();
        lights(92, 22);
        break;
      }
      case 'schoolbus': {
        shadow(112, 22); wheels([-38, 36]);
        ctx.fillStyle = '#f2b134'; U.roundRect(ctx, -56, -22, 112, 44, 9); ctx.fill();
        ctx.fillStyle = '#1e1e1e'; ctx.fillRect(-52, -21, 104, 3); ctx.fillRect(-52, 18, 104, 3);
        ctx.fillStyle = '#bfe3ff'; for (let k = -46; k < 40; k += 14) { U.roundRect(ctx, k, -18, 10, 8, 2); ctx.fill(); U.roundRect(ctx, k, 10, 10, 8, 2); ctx.fill(); }
        U.roundRect(ctx, 44, -16, 8, 32, 3); ctx.fill();
        ctx.fillStyle = '#1e1e1e'; ctx.font = this.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SCHOOL BUS', -4, 0);
        ctx.fillStyle = '#d32f2f'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; ctx.lineTo(-30 + Math.cos(a) * 6, -27 + Math.sin(a) * 6); } ctx.closePath(); ctx.fill();
        lights(112, 22);
        break;
      }
      case 'taxi': {
        shadow(92, 22); wheels([-28, 26]);
        ctx.fillStyle = '#ffd60a'; U.roundRect(ctx, -46, -22, 92, 44, 12); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, -46, 8, 92, 14, 8); ctx.fill();
        for (let k = -40; k < 40; k += 8) { ctx.fillStyle = (k / 8) % 2 ? '#1e1e1e' : '#fff'; ctx.fillRect(k, -22, 8, 4); ctx.fillRect(k, 18, 8, 4); }
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 8, -15, 15, 30, 4); ctx.fill(); U.roundRect(ctx, -30, -15, 8, 30, 3); ctx.fill();
        ctx.fillStyle = '#ffd60a'; U.roundRect(ctx, -20, -14, 26, 28, 5); ctx.fill();
        ctx.fillStyle = '#fff'; U.roundRect(ctx, -14, -6, 14, 12, 2); ctx.fill();
        ctx.fillStyle = '#1e1e1e'; ctx.font = this.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAXI', -7, 0);
        lights(92, 22);
        break;
      }
      case 'excavator': {
        shadow(84, 24); const ec = color || '#f2b705';
        ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, -36, -26, 72, 12, 5); ctx.fill(); U.roundRect(ctx, -36, 14, 72, 12, 5); ctx.fill(); // tracks
        ctx.fillStyle = '#6d6d6d'; for (let k = -30; k < 34; k += 9) { ctx.fillRect(k, -24, 4, 8); ctx.fillRect(k, 16, 4, 8); }
        ctx.fillStyle = ec; ctx.beginPath(); ctx.arc(-4, 0, 22, 0, Math.PI * 2); ctx.fill(); // turntable body
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(-16, 0, 10, 0, Math.PI * 2); ctx.fill(); // engine
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 0, -12, 14, 24, 4); ctx.fill(); // cab glass
        // arm: boom out front, bucket at the end, swinging up and down as it digs
        const swing = v ? Math.sin(v.arm) : 0, reach = 36 + swing * 8;
        ctx.fillStyle = ec; U.roundRect(ctx, 10, -6 + swing * 4, reach, 12, 4); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(14, -2 + swing * 4, reach - 8, 3);
        ctx.fillStyle = '#5c5c5c'; U.roundRect(ctx, 10 + reach - 4, -11 + swing * 6, 16, 22, 4); ctx.fill(); // bucket
        ctx.fillStyle = '#2b2b2b'; for (let k = -8; k <= 8; k += 8) ctx.fillRect(10 + reach + 10, k - 2 + swing * 6, 5, 3); // teeth
        break;
      }
      case 'dumptruck': {
        shadow(104, 24); const dc = color || '#ff7a1a';
        wheels([-32, -10, 32], 15, 10, 24);
        ctx.fillStyle = '#5c5c5c'; U.roundRect(ctx, -52, -22, 104, 44, 6); ctx.fill(); // chassis
        ctx.fillStyle = dc; U.roundRect(ctx, 20, -22, 32, 44, 7); ctx.fill(); // cab
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, 36, -16, 10, 32, 3); ctx.fill();
        ctx.fillStyle = dc; U.roundRect(ctx, -52, -24, 68, 48, 6); ctx.fill(); // tipper bed
        ctx.fillStyle = '#7a4f2a'; U.roundRect(ctx, -46, -18, 56, 36, 5); ctx.fill(); // load of dirt
        ctx.fillStyle = '#95643a'; ctx.beginPath(); ctx.ellipse(-18, -2, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
        lights(104, 24);
        break;
      }
      case 'bulldozer': {
        shadow(84, 24); const bc = color || '#f2b705';
        ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, -30, -26, 60, 12, 5); ctx.fill(); U.roundRect(ctx, -30, 14, 60, 12, 5); ctx.fill(); // tracks
        ctx.fillStyle = '#6d6d6d'; for (let k = -26; k < 28; k += 9) { ctx.fillRect(k, -24, 4, 8); ctx.fillRect(k, 16, 4, 8); }
        ctx.fillStyle = bc; U.roundRect(ctx, -30, -16, 56, 32, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, 0, -12, 22, 24, 4); ctx.fill(); // engine hood
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, -22, -10, 14, 20, 4); ctx.fill(); // cab
        ctx.fillStyle = '#5c5c5c'; ctx.fillRect(22, -4, 20, 8); // push arms
        ctx.fillStyle = '#9a9a9a'; U.roundRect(ctx, 38, -30, 10, 60, 3); ctx.fill(); // blade
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(40, -28, 3, 56);
        ctx.fillStyle = '#5c5c5c'; U.roundRect(ctx, -34, -8, 8, 16, 3); ctx.fill(); // ripper at the back
        break;
      }
      case 'tractor': {
        shadow(80, 20); const tc = color || '#43a047';
        ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(-22, -20, 13, 0, Math.PI * 2); ctx.arc(-22, 20, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(-22, -20, 5, 0, Math.PI * 2); ctx.arc(-22, 20, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, 20, -22, 12, 8, 3); ctx.fill(); U.roundRect(ctx, 20, 14, 12, 8, 3); ctx.fill();
        ctx.fillStyle = tc; U.roundRect(ctx, -34, -15, 76, 30, 8); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, -34, -15, 30, 30, 8); ctx.fill();
        ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, -26, -8, 14, 16, 4); ctx.fill();
        ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, -2, -12, 10, 24, 3); ctx.fill();
        ctx.fillStyle = '#9e9e9e'; ctx.fillRect(12, -10, 4, 8); ctx.fillStyle = '#6d6d6d'; ctx.beginPath(); ctx.arc(14, -12, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff6b0'; U.roundRect(ctx, 38, -10, 4, 6, 1); ctx.fill(); U.roundRect(ctx, 38, 4, 4, 6, 1); ctx.fill();
        break;
      }
      default: {
        shadow(94, 22); wheels([-28, 26]);
        ctx.fillStyle = color; U.roundRect(ctx, -46, -22, 92, 44, 12); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, -46, 8, 92, 14, 8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; U.roundRect(ctx, -40, -18, 80, 8, 4); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, -30, -17, 54, 34, 7); ctx.fill();
        const glass = ctx.createLinearGradient(-30, 0, 24, 0);
        glass.addColorStop(0, '#9fd8ff'); glass.addColorStop(0.5, '#e3f6ff'); glass.addColorStop(1, '#9fd8ff');
        ctx.fillStyle = glass; U.roundRect(ctx, 8, -15, 15, 30, 4); ctx.fill(); U.roundRect(ctx, -30, -15, 8, 30, 3); ctx.fill();
        ctx.fillStyle = color; U.roundRect(ctx, -20, -14, 26, 28, 5); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; U.roundRect(ctx, -18, -12, 22, 6, 3); ctx.fill();
        ctx.fillStyle = color; ctx.fillRect(2, -26, 6, 4); ctx.fillRect(2, 22, 6, 4);
        lights(94, 22);
      }
    }
  },

  // ======================= primitives =======================
  drawPizza(x, y, r) {
    const ctx = this.ctx;
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b';
    const pr = Math.max(1.5, r * 0.2);
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.2, pr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.35, pr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.1, y + r * 0.35, pr, 0, Math.PI * 2); ctx.fill();
    if (r >= 9) { ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y + r * 0.3, r * 0.16, r * 0.09, 0.7, 0, Math.PI * 2); ctx.fill(); }
  },
  drawPizzaStack(x, y, n) {
    for (let i = 0; i < Math.min(n, 30); i++) {
      this.ctx.fillStyle = '#b86f2d'; this.ctx.beginPath(); this.ctx.arc(x, y - i * 4 + 2, 14, 0, Math.PI * 2); this.ctx.fill();
      this.drawPizza(x, y - i * 4, 14);
    }
  },
  drawCountBadge(x, y, n, cap) {
    const ctx = this.ctx;
    const full = n >= cap;
    ctx.fillStyle = full ? '#e4572e' : '#2b1d14';
    U.roundRect(ctx, x - 16, y - 9, 32, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${n}/${cap}`, x, y + 1);
  },
  drawCashPile(x, y, amount) {
    const ctx = this.ctx;
    if (amount <= 0) return;
    const n = Math.min(14, Math.ceil(amount / 12));
    for (let i = 0; i < n; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const bx = x - 22 + col * 18 + (row % 2) * 4, by = y - row * 5;
      ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, bx - 2, by + 2, 22, 11, 2); ctx.fill();
      ctx.fillStyle = '#4caf50'; U.roundRect(ctx, bx - 2, by, 22, 11, 2); ctx.fill();
      ctx.fillStyle = '#2f9e44'; ctx.fillRect(bx + 6, by, 10, 11);
      ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(bx + 9, by + 5.5, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#1f6e2e'; U.roundRect(ctx, x - 26, y - 34 - Math.floor(n / 3) * 5, 52, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = this.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(U.money(amount), x, y - 25 - Math.floor(n / 3) * 5);
  },
  drawBubble(x, y, inner, w = 40, bg = '#fff') {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, -w / 2 + 2, -11, w, 26, 8); ctx.fill();
    ctx.fillStyle = bg; ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5;
    U.roundRect(ctx, -w / 2, -13, w, 26, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 18); ctx.lineTo(5, 12); ctx.closePath(); ctx.fill();
    inner();
    ctx.restore();
  },
  drawPatience(x, y, frac) {
    const col = frac > 0.5 ? '#2f9e44' : frac > 0.25 ? '#f2b134' : '#e4572e';
    this.drawProgressBar(x, y, 36, frac, col);
  },
  drawProgressBar(x, y, w, frac, col) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, x - w / 2, y - 3, w, 6, 3); ctx.fill();
    ctx.fillStyle = col; U.roundRect(ctx, x - w / 2, y - 3, w * U.clamp(frac, 0, 1), 6, 3); ctx.fill();
  },
  drawProgressRing(x, y, r, frac, col) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * U.clamp(frac, 0, 1)); ctx.stroke();
  },

  // ======================= effects / overlay =======================
  drawFx(g) {
    const ctx = this.ctx;
    for (const f of g.fx) {
      if (f.t < 0) continue;
      const k = U.clamp(f.t / f.dur, 0, 1);
      if (f.kind === 'dirt') {
        const x = U.lerp(f.x0, f.x1, k), y = U.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 34;
        ctx.fillStyle = `rgba(122,79,42,${1 - k * 0.7})`; ctx.beginPath(); ctx.arc(x, y, 5 - k * 2, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (f.kind === 'sparkle') {
        ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + k * 2;
          const r1 = 8 + k * 26, r2 = r1 + 8;
          ctx.beginPath(); ctx.moveTo(f.x0 + Math.cos(a) * r1, f.y0 + Math.sin(a) * r1); ctx.lineTo(f.x0 + Math.cos(a) * r2, f.y0 + Math.sin(a) * r2); ctx.stroke();
        }
        continue;
      }
      const x1 = f.follow ? g.player.x : f.x1, y1 = f.follow ? g.player.y - 10 : f.y1;
      const e = U.easeOut(k);
      const x = U.lerp(f.x0, x1, e), y = U.lerp(f.y0, y1, e) - Math.sin(k * Math.PI) * 26;
      if (f.kind === 'pizza') this.drawPizza(x, y, 12);
      else if (f.kind === 'bill' || f.kind === 'cash') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(k * 3);
        ctx.fillStyle = '#4caf50'; U.roundRect(ctx, -11, -6, 22, 12, 2); ctx.fill();
        ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  },
  drawFloats(g) {
    const ctx = this.ctx;
    for (const f of g.floats) {
      const a = 1 - U.clamp((f.t - f.dur * 0.6) / (f.dur * 0.4), 0, 1);
      ctx.globalAlpha = a;
      ctx.font = this.font(f.big ? 18 : 13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,29,20,0.85)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  },
  drawHint(g) {
    const h = g.hint;
    if (!h || !h.target) return;
    const ctx = this.ctx;
    const p = g.player, t = h.target;
    const d = U.dist(p.x, p.y, t.x, t.y);
    if (d < 70) return;
    const ang = Math.atan2(t.y - p.y, t.x - p.x);
    const bounce = Math.sin(g.time * 6) * 4;
    const ox = p.x + Math.cos(ang) * (40 + bounce), oy = p.y - 20 + Math.sin(ang) * (40 + bounce);
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang);
    ctx.fillStyle = '#f2b134'; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -10); ctx.lineTo(-2, 0); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = `rgba(242,177,52,${0.6 + 0.4 * Math.sin(g.time * 6)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(t.x, t.y + 4, 34 + bounce, 18 + bounce / 2, 0, 0, Math.PI * 2); ctx.stroke();
  },
  drawOverlay() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // screen space (CSS px)
    const j = Input.joy;
    if (j.active) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(j.ox, j.oy, Input.JOY_RADIUS, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), m = Math.min(d, Input.JOY_RADIUS);
      const kx = d ? j.ox + (dx / d) * m : j.ox, ky = d ? j.oy + (dy / d) * m : j.oy;
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(kx, ky, 22, 0, Math.PI * 2); ctx.fill();
    }
    if (this.zoomLabelT > 0) {
      this.zoomLabelT -= 1 / 60;
      const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
      ctx.globalAlpha = Math.min(1, this.zoomLabelT * 2);
      ctx.fillStyle = 'rgba(43,29,20,0.8)'; U.roundRect(ctx, w / 2 - 36, h - 44, 72, 26, 13); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = this.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round((this.scale / this.baseScale) * 100) + '%', w / 2, h - 31);
      ctx.globalAlpha = 1;
    }
  },
};
