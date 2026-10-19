'use strict';
// Day/night dusk cycle, rain in town, snow at Construction Town.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// The clock lives only in runtime state (never saved) and every session starts in the morning. A day is
// mostly plain daytime; then a golden hour, a soft lavender dusk (never darker than a moody evening) and
// a dawn straight back into the morning. Nothing mechanical changes: no monsters, no "night". The shops
// stay lit from inside: their interiors are cut out of the dusk tint and leak a little warm light.
// Rain/snow timers run for their own map all the time (like the town keeps running while you are away) but
// only draw in that map, never during rides. Particles are updated in `update` and drawn in `screen`.
CFG.ATMOSPHERE = {
  DAY: 225, GOLDEN: 15, DUSK: 75, DAWN: 15,       // seconds; the whole cycle is 330 s = 5.5 minutes of play
  DUSK_RAMP: 8,                                   // seconds for the blue tint to fade in at the start of dusk
  DUSK_ALPHA: 0.28,                               // the darkest the tint ever gets
  DUSK_COLOR: [70, 60, 150],                      // soft blue-purple
  DUSK_MODE: 'source-over',                       // 'source-over' (translucent fill) or 'multiply'
  GOLDEN_ALPHA: 0.16, GOLDEN_COLOR: [255, 170, 60],
  DAWN_ALPHA: 0.10, DAWN_COLOR: [255, 150, 120],
  SPILL_ALPHA: 0.13, SPILL_COLOR: [255, 224, 138], // warm light leaking out of the lit shops at dusk
  STARS: 16,
  RAIN: { first: [120, 240], every: [180, 360], dur: [40, 70], fade: 5, count: [80, 240], tint: [120, 150, 205], tintAlpha: 0.09, alpha: 0.42 },
  SNOW: { first: [120, 240], every: [180, 360], dur: [40, 70], fade: 5, count: [60, 150], tint: [150, 175, 215], tintAlpha: 0.10, alpha: 0.65 },
  RIPPLES: { perSec: 14, dur: 0.75, max: 60, alpha: 0.45 },
  GLOW_MAX_SCALE: 2.2,                            // glows stop growing past this zoom so they never swamp a phone screen
  GLOW_COLORS: { warm: [255, 205, 110], neon: [255, 120, 220], red: [255, 80, 80], ice: [255, 220, 240] },
  // Street lamp posts this file adds to the town (base positions, same look as the park posts in bgPark).
  // On the sidewalks of the road loop, clear of the crosswalks, the bus stop, the house doors and the ferry dock.
  LAMPS: [
    [-800, 6], [-300, 6], [200, 6], [760, 6], [1200, 6],          // Main Street, far sidewalk
    [-300, 908], [100, 908], [400, 908], [800, 908], [1100, 908],  // South Road, north sidewalk
    [-168, 1012], [212, 1012], [652, 1012],                        // beside each house door
    [1227, 500], [1227, 800],                                      // East Road, inner sidewalk
    [-125, 1172], [-740, -20],                                     // by the ferry dock (west of its sign), on the station path
  ],
  // Lit shop interiors (world rects just inside the walls): untinted at dusk, no rain streaks over the pizzeria.
  INTERIORS: [{ x0: 0, y0: 110, x1: 960, y1: 640 }, { x0: 1026, y0: 118, x1: 1216, y1: 312 }],
};

const AtmosphereExt = {
  name: 'atmosphere',
  t: 0,                              // seconds into the day cycle
  phase: 'day', dusk: 0, warm: 0, dawnWarm: 0,
  weather: { town: null, site: null }, // per-map shower timers: { wait, t, dur } (t >= 0 while a shower runs)
  toasted: { rain: false, snow: false },
  drops: [], flakes: [], ripples: [], stars: [], rippleAcc: 0,
  W: 960, H: 640,                    // screen size (CSS px) seen by the last draw; the particles live in that space
  grads: {},                         // cached unit radial gradients per colour key
  glowCache: null, glowKey: '',

  build(g) {
    this.t = 0; this.phase = 'day'; this.dusk = 0; this.warm = 0; this.dawnWarm = 0;
    const A = CFG.ATMOSPHERE;
    this.weather = { town: { wait: U.rand(A.RAIN.first[0], A.RAIN.first[1]), t: -1, dur: 0 }, site: { wait: U.rand(A.SNOW.first[0], A.SNOW.first[1]), t: -1, dur: 0 } };
    this.toasted = { rain: false, snow: false };
    this.drops = []; this.flakes = []; this.ripples = []; this.rippleAcc = 0;
    this.stars = []; for (let i = 0; i < A.STARS; i++) this.stars.push({ x: Math.random(), y: 0.02 + Math.random() * 0.22, s: U.rand(1, 2.2), ph: Math.random() * 6.28, sp: U.rand(1.5, 3.5) });
    this.glowKey = '';
  },

  // ---------- public: for other extensions (Easter eggs) ----------
  state() {
    const w = this.visibleWeather();
    return { phase: this.phase, dusk: this.dusk, weather: w.kind, intensity: w.intensity };
  },
  // Debug/integration setter: AtmosphereExt.force({ phase: 'dusk', weather: 'rain' }). Jumps the clock to the
  // peak of that phase and/or starts (or stops) a full-strength shower in the matching map.
  force(opts = {}) {
    const A = CFG.ATMOSPHERE;
    if (opts.phase) {
      const starts = { day: 0, golden: A.DAY + A.GOLDEN * 0.7, dusk: A.DAY + A.GOLDEN + A.DUSK * 0.5, dawn: A.DAY + A.GOLDEN + A.DUSK + A.DAWN * 0.45 };
      if (starts[opts.phase] !== undefined) { this.t = starts[opts.phase]; this.computePhase(); }
    }
    if (opts.weather) {
      const start = (w, S) => { w.dur = U.rand(S.dur[0], S.dur[1]); w.t = S.fade + 1; };
      const stop = (w, S) => { if (w.t >= 0) { w.t = -1; w.wait = U.rand(S.every[0], S.every[1]); } };
      if (opts.weather === 'rain') { start(this.weather.town, A.RAIN); stop(this.weather.site, A.SNOW); }
      else if (opts.weather === 'snow') { start(this.weather.site, A.SNOW); stop(this.weather.town, A.RAIN); }
      else { stop(this.weather.town, A.RAIN); stop(this.weather.site, A.SNOW); }
    }
  },

  // ---------- clock ----------
  computePhase() {
    const A = CFG.ATMOSPHERE, cycle = A.DAY + A.GOLDEN + A.DUSK + A.DAWN;
    const t = this.t % cycle, sm = (k) => { k = U.clamp(k, 0, 1); return k * k * (3 - 2 * k); };
    let phase = 'day', dusk = 0, warm = 0, dawnWarm = 0;
    if (t >= A.DAY + A.GOLDEN + A.DUSK) { phase = 'dawn'; const k = (t - A.DAY - A.GOLDEN - A.DUSK) / A.DAWN; dusk = 1 - sm(k); dawnWarm = Math.sin(k * Math.PI); }
    else if (t >= A.DAY + A.GOLDEN) { phase = 'dusk'; const e = t - A.DAY - A.GOLDEN; dusk = sm(e / A.DUSK_RAMP); warm = 1 - dusk; }
    else if (t >= A.DAY) { phase = 'golden'; warm = sm((t - A.DAY) / A.GOLDEN); }
    this.phase = phase; this.dusk = dusk; this.warm = warm; this.dawnWarm = dawnWarm;
  },

  // Which weather the player can see right now and how strong it is (0..1 with the fade in/out).
  visibleWeather() {
    if (!this.weather.town) return { kind: 'none', intensity: 0 };
    const A = CFG.ATMOSPHERE;
    const w = Game.area === 'town' ? this.weather.town : Game.area === 'site' ? this.weather.site : null;
    const S = Game.area === 'town' ? A.RAIN : A.SNOW;
    if (!w || w.t < 0 || Game.travel) return { kind: 'none', intensity: 0 };
    const k = Math.min(w.t / S.fade, (w.dur - w.t) / S.fade, 1);
    return { kind: Game.area === 'town' ? 'rain' : 'snow', intensity: U.clamp(k, 0, 1) };
  },

  update(g, dt) {
    if (typeof MiniGame !== 'undefined' && MiniGame.open) return;
    if (!this.weather.town) this.build(g);
    const A = CFG.ATMOSPHERE;
    this.t += dt; this.computePhase();
    // shower timers for each map
    const tick = (w, S) => {
      if (w.t >= 0) { w.t += dt; if (w.t >= w.dur) { w.t = -1; w.wait = U.rand(S.every[0], S.every[1]); } }
      else { w.wait -= dt; if (w.wait <= 0) { w.t = 0; w.dur = U.rand(S.dur[0], S.dur[1]); } }
    };
    tick(this.weather.town, A.RAIN); tick(this.weather.site, A.SNOW);
    const vis = this.visibleWeather();
    if (vis.kind === 'rain' && !this.toasted.rain) { this.toasted.rain = true; g.toast('🌧️ Rain! Watch the puddles', false); }
    if (vis.kind === 'snow' && !this.toasted.snow) { this.toasted.snow = true; g.toast('❄️ Snow at the site!', false); }
    if (vis.kind === 'rain') this.updateRain(g, dt, vis.intensity);
    else if (this.drops.length) this.drops.length = 0;
    if (vis.kind === 'snow') this.updateSnow(dt);
    else if (this.flakes.length) this.flakes.length = 0;
    if (vis.kind !== 'rain' && this.ripples.length) this.ripples.length = 0;
    for (let i = this.ripples.length - 1; i >= 0; i--) { const rp = this.ripples[i]; rp.t += dt; if (rp.t >= rp.dur) { this.ripples[i] = this.ripples[this.ripples.length - 1]; this.ripples.pop(); } }
  },

  particleCount(range) { return Math.round(U.clamp((this.W * this.H) / 3200, range[0], range[1])); },

  updateRain(g, dt, intensity) {
    const n = this.particleCount(CFG.ATMOSPHERE.RAIN.count), W = this.W, H = this.H;
    while (this.drops.length < n) this.drops.push({ x: Math.random() * (W + 80) - 40, y: Math.random() * H, len: U.rand(9, 16), v: U.rand(420, 620), a: U.rand(0.35, 1) });
    for (const d of this.drops) {
      d.y += d.v * dt; d.x -= d.v * 0.22 * dt;
      if (d.y > H + 20) { d.y = -20 - Math.random() * 40; d.x = Math.random() * (W + 80) - 40; }
      else if (d.x < -40) d.x += W + 80;
    }
    // ripple rings on the ground (world space, outside the pizzeria): spawn a few per frame inside the camera view
    const R = CFG.ATMOSPHERE.RIPPLES, r = Render, B = CFG.BUILDING;
    let want = R.perSec * intensity * dt + this.rippleAcc;
    while (want >= 1 && this.ripples.length < R.max) {
      want -= 1;
      const x = r.camX + Math.random() * r.viewW, y = r.camY + Math.random() * r.viewH;
      if (x > B.x0 && x < B.x1 && y > B.y0 && y < B.y1) continue; // the shop has a roof, in spirit
      this.ripples.push({ x, y, t: 0, dur: R.dur, s: U.rand(0.7, 1.2) });
    }
    this.rippleAcc = want % 1;
  },

  updateSnow(dt) {
    const n = this.particleCount(CFG.ATMOSPHERE.SNOW.count), W = this.W, H = this.H;
    while (this.flakes.length < n) this.flakes.push({ x: Math.random() * W, y: Math.random() * H, r: U.rand(1.4, 3.2), v: U.rand(22, 48), ph: Math.random() * 6.28, sw: U.rand(0.4, 1.2), amp: U.rand(8, 22) });
    for (const f of this.flakes) {
      f.ph += f.sw * dt; f.y += f.v * dt; f.x += Math.cos(f.ph) * f.amp * dt;
      if (f.y > H + 6) { f.y = -6 - Math.random() * 30; f.x = Math.random() * W; }
      if (f.x < -6) f.x += W + 12; else if (f.x > W + 6) f.x -= W + 12;
    }
  },

  // ---------- static art: street lamps along the town's roads (same look as the park posts) ----------
  paintTown(r, g) {
    const ctx = r.ctx;
    for (const [x, y] of CFG.ATMOSPHERE.LAMPS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(x - 2, y - 60, 4, 60); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - 62, 7, 0, Math.PI * 2); ctx.fill();
    }
  },

  // ---------- drawing ----------
  // Ripple rings on wet ground (world space, under floats/hint, over people: they are tiny and faint).
  overlay(r, g) {
    if (!this.ripples.length || g.travel) return;
    const ctx = r.ctx;
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#eaf6ff';
    for (const rp of this.ripples) {
      const k = rp.t / rp.dur;
      ctx.globalAlpha = CFG.ATMOSPHERE.RIPPLES.alpha * (1 - k);
      ctx.beginPath(); ctx.ellipse(rp.x, rp.y, (3 + 11 * k) * rp.s, (1.5 + 5.5 * k) * rp.s, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Screen-space rects of the lit shop interiors (town only); empty elsewhere.
  interiorRects(r, g) {
    if (g.area !== 'town') return [];
    const sc = r.scale, out = [];
    for (const q of CFG.ATMOSPHERE.INTERIORS) out.push({ x: (q.x0 - r.camX) * sc, y: (q.y0 - r.camY) * sc, w: (q.x1 - q.x0) * sc, h: (q.y1 - q.y0) * sc });
    return out;
  },

  screen(r, g) {
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    this.W = W; this.H = H;
    if (g.travel) return;                       // the ride cutscenes draw their own sky
    const A = CFG.ATMOSPHERE, vis = this.visibleWeather();
    // light cool tint for weather
    if (vis.intensity > 0) {
      const S = vis.kind === 'rain' ? A.RAIN : A.SNOW, c = S.tint;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(S.tintAlpha * vis.intensity).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    }
    // golden hour / dawn warmth, then the dusk tint with the lit shops cut out of it
    if (this.warm > 0) { const c = A.GOLDEN_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.GOLDEN_ALPHA * this.warm).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (this.dawnWarm > 0) { const c = A.DAWN_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DAWN_ALPHA * this.dawnWarm).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (this.dusk > 0) {
      const c = A.DUSK_COLOR, holes = this.interiorRects(r, g);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); for (const q of holes) ctx.rect(q.x, q.y, q.w, q.h);
      ctx.clip('evenodd');                      // everything outside the shops
      ctx.globalCompositeOperation = A.DUSK_MODE;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DUSK_ALPHA * this.dusk).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      if (holes.length) this.drawSpill(r, g, W, H);
      ctx.restore();
      this.drawGlows(r, g, W, H);
      if (this.dusk > 0.5) this.drawStars(ctx, g, W, H);
    }
    if (this.phase !== 'day') this.drawPip(ctx, g, W, H);
    if (vis.kind === 'rain') this.drawRain(r, g, vis.intensity);
    else if (vis.kind === 'snow') this.drawSnow(ctx, vis.intensity);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },

  // Warm light leaking out of the lit shops: the pizzeria's front (Main Street side) and door, the ice cream door.
  // Runs inside the even-odd clip, so it only lands outside the interiors.
  drawSpill(r, g, W, H) {
    const ctx = r.ctx, A = CFG.ATMOSPHERE, c = A.SPILL_COLOR, sc = r.scale, a = A.SPILL_ALPHA * this.dusk;
    const col = (k) => `rgba(${c[0]},${c[1]},${c[2]},${(a * k).toFixed(3)})`;
    const sx = (x) => (x - r.camX) * sc, sy = (y) => (y - r.camY) * sc;
    const B = CFG.BUILDING, D = CFG.DOOR, IC = CFG.ICE_CREAM;
    // front windows: a band fading out across the sidewalk and street above the top wall
    const fy0 = sy(B.y0), fy1 = sy(B.y0 - 46), fx0 = sx(B.x0), fx1 = sx(B.x1);
    if (fx1 > 0 && fx0 < W && fy0 > 0 && fy1 < H) {
      const lg = ctx.createLinearGradient(0, fy0, 0, fy1); lg.addColorStop(0, col(1)); lg.addColorStop(1, col(0));
      ctx.fillStyle = lg; ctx.fillRect(fx0, fy1, fx1 - fx0, fy0 - fy1);
    }
    const radial = (wx, wy, rad) => {
      const x = sx(wx), y = sy(wy), rr = rad * sc;
      if (x + rr < 0 || x - rr > W || y + rr < 0 || y - rr > H) return;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, col(1.3)); rg.addColorStop(0.5, col(0.5)); rg.addColorStop(1, col(0));
      ctx.fillStyle = rg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    };
    radial(B.x1, (D.y0 + D.y1) / 2, 120);         // the open door
    radial(IC.door.x, IC.rect.y1, 80);            // the ice cream shop door
  },

  // The list of things that glow in the current map (world coords). Rebuilt only when the map/owned stuff changes.
  glowList(g) {
    const key = g.area + '|' + (g.hasDecor('neon') ? 1 : 0) + (g.hasDecor('lights') ? 1 : 0) + (g.isUnlocked('station') ? 1 : 0);
    if (key === this.glowKey && this.glowCache) return this.glowCache;
    const out = [], lamp = (x, y, a = 1) => out.push({ x, y: y - 62, r: 75, c: 'warm', a });
    if (g.area === 'town') {
      for (const [x, y] of [[-40, 260], [1000, 260], [-40, 720], [1000, 720]]) lamp(x, y);                                                 // park lamp posts
      for (const [x, y] of CFG.ATMOSPHERE.LAMPS) lamp(x, y);                                                                               // street lamps
      if (g.hasDecor('neon')) out.push({ x: 820, y: 126, r: 90, c: 'neon', a: 0.7 });
      if (g.hasDecor('lights')) for (const x of [60, 150, 240, 330]) out.push({ x, y: 118, r: 48, c: 'warm', a: 0.35 });                   // string lights
      if (g.isUnlocked('station')) { const P = CFG.STATION.platform; out.push({ x: P.x1 - 18, y: P.y0 + 8, r: 60, c: 'warm', a: 0.9 }); }
      for (const h of CFG.HOUSES) out.push({ x: h.door.x + 6, y: h.y0 + 19, r: 42, c: 'warm', a: 0.8 });                                  // porch lights
      if (CFG.SECRET && CFG.SECRET.cabin) { const w = CFG.SECRET.cabin.window; out.push({ x: w.x, y: w.y, r: 55, c: 'warm', a: 0.9 }); }   // the cabin window in the woods
    } else if (g.area === 'site') {
      const S = CFG.SITE, P = S.STATION.platform;
      out.push({ x: S.CRANE.x, y: S.CRANE.y, r: 80, c: 'red', a: 1, pulse: true });                                                      // crane beacon
      out.push({ x: P.x1 - 18, y: P.y0 + 8, r: 60, c: 'warm', a: 0.9 });                                                                  // platform lamp
      out.push({ x: S.SIGN.x, y: S.SIGN.y - 44, r: 55, c: 'warm', a: 0.6 });                                                              // site sign floodlight
      out.push({ x: S.TOILET.x, y: S.TOILET.y - 26, r: 40, c: 'warm', a: 0.5 });
    } else if (g.area === 'city' && CFG.CITY && CFG.CITY.LAMPS) {
      for (const [x, y] of CFG.CITY.LAMPS) lamp(x, y);                                                                                     // the city's own lamp posts
    }
    this.glowKey = key; this.glowCache = out;
    return out;
  },

  unitGradient(ctx, key) {
    let gr = this.grads[key];
    if (gr) return gr;
    const c = CFG.ATMOSPHERE.GLOW_COLORS[key];
    gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.5)`); gr.addColorStop(0.45, `rgba(${c[0]},${c[1]},${c[2]},0.2)`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    this.grads[key] = gr;
    return gr;
  },

  drawGlows(r, g, W, H) {
    const ctx = r.ctx, list = this.glowList(g), sc = r.scale, gsc = Math.min(sc, CFG.ATMOSPHERE.GLOW_MAX_SCALE);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (wx, wy, rad, key, a) => {
      const sx = (wx - r.camX) * sc, sy = (wy - r.camY) * sc, sr = rad * gsc;
      if (sx + sr < 0 || sy + sr < 0 || sx - sr > W || sy - sr > H) return;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(sr, sr);
      ctx.globalAlpha = a * this.dusk; ctx.fillStyle = this.unitGradient(ctx, key); ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    };
    for (const gl of list) glow(gl.x, gl.y, gl.r, gl.c, gl.pulse ? gl.a * (0.55 + 0.45 * Math.sin(g.time * 6.28)) : gl.a);
    // headlights on whatever the chef is driving
    if (g.driving && g.vehicle) { const v = g.vehicle; glow(v.x + Math.cos(v.angle) * 34, v.y + Math.sin(v.angle) * 34, 55, 'warm', 0.8); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  },

  drawStars(ctx, g, W, H) {
    const k = (this.dusk - 0.5) * 2;
    ctx.fillStyle = '#fff8e6';
    for (const s of this.stars) {
      ctx.globalAlpha = k * (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(g.time * s.sp + s.ph)));
      ctx.beginPath(); ctx.arc(s.x * W, 60 + s.y * H, s.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // A little sun that becomes a moon, bottom-left corner, only outside plain daytime.
  drawPip(ctx, g, W, H) {
    const x = 26, y = H - 26, k = this.dusk;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(43,29,20,0.35)'; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = k > 0.5 ? '#fff4c2' : '#ffd166'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    if (k > 0.5) { ctx.fillStyle = 'rgba(43,29,20,0.35)'; ctx.globalCompositeOperation = 'source-atop'; ctx.beginPath(); ctx.arc(x + 4, y - 3, 8, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    else { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + g.time * 0.5; ctx.moveTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11); ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); } ctx.stroke(); }
    ctx.globalAlpha = 1;
  },

  drawRain(r, g, intensity) {
    const ctx = r.ctx, A = CFG.ATMOSPHERE.RAIN, holes = this.interiorRects(r, g);
    const inside = (x, y) => { for (const q of holes) if (x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h) return true; return false; };
    ctx.strokeStyle = '#dcefff'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    // two alpha bands so the streaks have a little depth without a stroke per drop; none over the lit shops
    for (const band of [0.5, 1]) {
      ctx.globalAlpha = A.alpha * intensity * band;
      ctx.beginPath();
      for (const d of this.drops) { if ((d.a > 0.65) !== (band === 1) || inside(d.x, d.y)) continue; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * 0.22, d.y - d.len); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  drawSnow(ctx, intensity) {
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = CFG.ATMOSPHERE.SNOW.alpha * intensity;
    ctx.beginPath();
    for (const f of this.flakes) { ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); }
    ctx.fill();
    ctx.globalAlpha = 1;
  },
};
Game.ext.push(AtmosphereExt);
Render.ext.push(AtmosphereExt);
