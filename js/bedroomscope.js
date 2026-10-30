'use strict';
// The bedroom telescope. Once the Telescope is bought from the catalog upstairs it stands by the window; stand next
// to it and press the button to look out over the town. It reuses the Pizza Tower's telescope mechanism
// (CityExt.scopeStart / scopeUpdate / scopeBegin / scopeEnd in js/city.js): the chef is held at the eyepiece, the
// stick pans the view with easing and a soft bump at each end, a label says what is in the middle of the view.
// The view is the real geography seen from the pizzeria's upstairs window, left (west) to right (east): the farm,
// the train station with the mountains behind it, Main Street with the bus stop, the park, the fire station, the
// airfield and, far away, the City with the Pizza Tower; the river runs along the bottom with the ferry on it.
// Extension module: registered with Game.ext (first, so its button beats the room's) and Render.ext. See js/EXTENSIONS.md.

CFG.BEDROOMSCOPE = {
  reach: 44,       // stand this close to the telescope to look through it
  start: 0.35,     // the pan fraction the view opens on (Main Street, right under the window)
  train: 26,       // seconds between trains puffing past the station (the train shows for the first 9)
  plane: 22,       // seconds between take-offs at the airfield
  bus: 32,         // seconds between buses on Main Street
};

// what sits in the middle of the view at each pan fraction, and the compass strip (the window faces north)
const BEDSCOPE_SPOTS = [[0.02, 'The farm! 🐄'], [0.2, 'The train station! 🚂'], [0.37, 'Main Street 🚌'], [0.55, 'The park! ⛲'], [0.7, 'The fire station! 🚒'], [0.86, 'The airfield! ✈️'], [1.03, 'The City, far away! 🏙️']];
const BEDSCOPE_COMPASS = [[-0.1, 'SW'], [0.1, 'W'], [0.3, 'NW'], [0.5, 'N'], [0.7, 'NE'], [0.9, 'E'], [1.1, 'SE']];
// fixed tables so the frame allocates nothing big: stars (unit coords, radius 1), the City's towers [dx, w, h]
const BEDSCOPE_STARS = [[-0.8, -0.5], [-0.6, -0.8], [-0.3, -0.6], [-0.1, -0.9], [0.1, -0.7], [0.3, -0.85], [0.5, -0.55], [0.7, -0.75], [0.85, -0.4], [-0.45, -0.35], [0.05, -0.45], [0.4, -0.3], [-0.7, -0.2], [0.65, -0.15], [-0.2, -0.25], [0.2, -0.6], [-0.9, -0.35], [0.9, -0.6]];
const BEDSCOPE_BUSHES = [[-0.35, 11], [-0.05, 14], [0.18, 9], [0.47, 13], [0.66, 10], [0.92, 14], [1.14, 10], [1.4, 12]];   // [fc, radius] of the bushes on the near bank
const BEDSCOPE_TOWERS = [[-150, 26, 40], [-118, 20, 62], [-92, 30, 48], [-56, 22, 80], [-30, 26, 58], [34, 24, 66], [62, 30, 46], [96, 20, 72], [120, 28, 38], [152, 22, 56]];

const BedroomScopeExt = {
  name: 'bedroomscope',
  viewing: null,   // looking through the bedroom telescope: a CityExt.scopeStart state, or null

  // ---------- helpers ----------
  spot() { if (!this._spot) { const it = CFG.UPSTAIRS.items.find((i) => i.key === 'telescope'); this._spot = it ? it.spot : { x: 6872, y: 1594 }; } return this._spot; },
  // in the bedroom, on foot, the telescope bought, and no nap / slide / catalog / drawing pad going on
  ready(g) {
    if (g.area !== 'upstairs' || g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof UpstairsExt === 'undefined' || typeof CityExt === 'undefined' || !UpstairsExt.st || !UpstairsExt.owned(g, 'telescope')) return false;
    const st = UpstairsExt.st;
    return !(st.nap || st.slide || st.cat.on || st.draw.on);
  },
  near(g) { const p = g.player, s = this.spot(); return U.dist(p.x, p.y, s.x, s.y) < CFG.BEDROOMSCOPE.reach; },
  look(g) {
    const p = g.player;
    p.moving = false; p.facing = 1;
    this.viewing = CityExt.scopeStart(p.x, p.y, CFG.BEDROOMSCOPE.start);
    Sfx.ding(); Haptics.tap();
  },

  // ---------- game hooks ----------
  build(g) { this.viewing = null; },
  home(g) { this.viewing = null; },
  update(g, dt) {
    if (!this.viewing) return;
    if (!this.ready(g)) { this.viewing = null; return; }   // the chef was moved elsewhere (a reload, Take me home)
    CityExt.scopeUpdate(g, this.viewing, dt);
  },
  action(g) {
    if (this.viewing) return { label: '🚶 Done looking', run: () => { this.viewing = null; Haptics.tap(); } };
    if (!this.ready(g) || !this.near(g)) return null;
    return { label: '🔭 Look through the telescope', run: (gg) => this.look(gg) };
  },
  hint(g) {
    if (this.viewing) return null;
    if (this.ready(g) && this.near(g)) return { text: 'Look through the telescope! 🔭', target: null };
    return undefined;
  },

  // ---------- render hooks ----------
  screen(r, g) {
    if (!this.viewing || g.area !== 'upstairs') return;
    this.drawView(r, g, r.canvas.width / r.dpr, r.canvas.height / r.dpr);
  },

  // a colour between two hex colours (small strings only; nothing big is built per frame)
  mix(a, b, k) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), ch = (s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * k);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  },

  // Through the bedroom telescope: the town from the upstairs window, west on the left round to east on the right.
  // Near layers slide past faster than far ones; the time of day follows the Atmosphere extension when it is loaded.
  drawView(r, g, W, H) {
    const ctx = r.ctx, t = g.time, v = this.viewing, C = CFG.BEDROOMSCOPE;
    const atm = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt : null;
    const dusk = atm ? U.clamp(atm.dusk || 0, 0, 1) : 0, warm = atm ? atm.warm || 0 : 0, dawn = atm ? atm.dawnWarm || 0 : 0;
    const G = CityExt.scopeBegin(r, g, v, W, H), { cx, cy, Rv, S, hz, sx } = G;
    const K1 = 0.7, K2 = 0.85, K3 = 1.15;
    // the sky, the sun by day and the moon at dusk, drifting clouds, birds
    const sky = ctx.createLinearGradient(0, cy - Rv, 0, hz); sky.addColorStop(0, this.mix('#5fb6ee', '#2b2f6e', dusk)); sky.addColorStop(1, this.mix('#dff3ff', '#a78bc4', dusk));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (dusk < 1) { ctx.globalAlpha = 1 - dusk; ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(sx(0.62, 0.3), cy - Rv * 0.55, Rv * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    if (dusk > 0) { const mx = sx(0.3, 0.3), my = cy - Rv * 0.6; ctx.globalAlpha = dusk; ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(mx, my, Rv * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = this.mix('#5fb6ee', '#2b2f6e', dusk); ctx.beginPath(); ctx.arc(mx - Rv * 0.035, my - Rv * 0.02, Rv * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.fillStyle = `rgba(255,255,255,${(0.9 - 0.5 * dusk).toFixed(2)})`; for (let i = 0; i < 9; i++) { const mx = sx(-0.3 + i * 0.2, 0.3) + ((t * 5 + i * 50) % 80), my = cy - Rv * (0.8 - (i % 3) * 0.13); ctx.beginPath(); ctx.arc(mx, my, 11, 0, Math.PI * 2); ctx.arc(mx + 13, my - 6, 14, 0, Math.PI * 2); ctx.arc(mx + 28, my, 10, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const bx = sx(0.25 + i * 0.14, 0.45) + ((t * 20 + i * 90) % 160) - 80, by = cy - Rv * (0.42 + (i % 3) * 0.08) + Math.sin(t * 3 + i) * 4, fl = Math.sin(t * 9 + i) * 3; ctx.beginPath(); ctx.moveTo(bx - 7, by); ctx.quadraticCurveTo(bx - 3, by - 4 - fl, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4 - fl, bx + 7, by); ctx.stroke(); }
    // far layer: the mountains behind the station in the north-west, fading away to the east
    ctx.fillStyle = this.mix('#7f8fb3', '#3e3f6e', dusk); ctx.beginPath(); ctx.moveTo(sx(-0.7, K1), hz); for (let i = 0; i <= 16; i++) { const fc = -0.7 + i * 0.065, hgt = Rv * (0.14 + 0.22 * Math.abs(Math.sin(i * 2.3 + 1))) * U.clamp((0.62 - fc) / 0.25, 0, 1); ctx.lineTo(sx(fc, K1), hz - 4); ctx.lineTo(sx(fc + 0.032, K1), hz - hgt); } ctx.lineTo(sx(0.6, K1), hz); ctx.closePath(); ctx.fill();
    ctx.fillStyle = this.mix('#ffffff', '#c9c6e8', dusk); for (let i = 0; i <= 16; i++) { const fc = -0.7 + i * 0.065, hgt = Rv * (0.14 + 0.22 * Math.abs(Math.sin(i * 2.3 + 1))) * U.clamp((0.62 - fc) / 0.25, 0, 1); if (hgt < Rv * 0.1) continue; const px = sx(fc + 0.032, K1), peak = hz - hgt; ctx.beginPath(); ctx.moveTo(px, peak); ctx.lineTo(px + 12, peak + 14); ctx.lineTo(px + 3, peak + 11); ctx.lineTo(px - 3, peak + 15); ctx.lineTo(px - 12, peak + 14); ctx.closePath(); ctx.fill(); }
    // far layer: the City on the eastern horizon, small and hazy, the Pizza Tower in the middle of it
    { const ox = sx(1.03, K1), oy = hz - Rv * 0.01, s2 = S * 0.72; ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(ox, oy); ctx.scale(s2, s2);
      ctx.fillStyle = this.mix('#9fb3c8', '#4a4f80', dusk); ctx.beginPath(); ctx.ellipse(0, 2, 200, 14, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < BEDSCOPE_TOWERS.length; i++) { const [dx, w, h] = BEDSCOPE_TOWERS[i]; ctx.fillStyle = i % 2 ? this.mix('#5c6f8a', '#2f3358', dusk) : this.mix('#6f84a3', '#3a3f66', dusk); ctx.fillRect(dx, -h, w, h); if (dusk > 0.2) { ctx.fillStyle = `rgba(255,224,138,${(0.8 * dusk).toFixed(2)})`; for (let yy = -h + 6; yy < -6; yy += 10) for (let xx = dx + 4; xx < dx + w - 5; xx += 8) if (((xx * 7 + yy * 3) % 5) < 2) ctx.fillRect(xx, yy, 3, 4); } }
      ctx.fillStyle = this.mix('#3b4d66', '#262a4a', dusk); ctx.fillRect(-10, -118, 22, 118); ctx.fillStyle = this.mix('#ffd166', '#f2b134', dusk); ctx.fillRect(-14, -124, 30, 8); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(1, -140); ctx.lineTo(-9, -124); ctx.lineTo(11, -124); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(-3, -131, 1.6, 0, Math.PI * 2); ctx.arc(3, -128, 1.6, 0, Math.PI * 2); ctx.fill();   // the Pizza Tower with its slice on top
      ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#ff3b3b' : 'rgba(255,59,59,0.3)'; ctx.beginPath(); ctx.arc(1, -143, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); }
    // the land: green from the horizon down, with soft rolling hills, and the tracks running west along the far layer
    ctx.fillStyle = this.mix('#5fa84f', '#3a5a4a', dusk); ctx.fillRect(0, hz, W, H);
    ctx.fillStyle = this.mix('#6cb35a', '#416650', dusk); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(sx(-0.5 + i * 0.25, K1), hz + 4, Rv * 0.45, Rv * 0.09, 0, Math.PI, 0); ctx.fill(); }
    { const ty = hz + Rv * 0.03, x0 = sx(-0.4, K1), x1 = sx(0.52, K1); ctx.fillStyle = this.mix('#6b4a2b', '#3f3326', dusk); ctx.fillRect(x0, ty - 1, x1 - x0, 5); ctx.fillStyle = this.mix('#8d9299', '#5a5e73', dusk); ctx.fillRect(x0, ty - 2, x1 - x0, 1.5); ctx.fillRect(x0, ty + 3, x1 - x0, 1.5); }
    // mid layer: the farm, far to the west: the barn, the pen with the cow, the fields
    { const ox = sx(0.02, K2), oy = hz + Rv * 0.07; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      ctx.fillStyle = this.mix('#8bc34a', '#4f6f3c', dusk); ctx.beginPath(); ctx.ellipse(0, 6, 170, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.mix('#a3703f', '#5a4330', dusk); for (let k = -150; k < -40; k += 14) ctx.fillRect(k, 4, 8, 20); ctx.fillStyle = '#e4572e'; for (let k = -146; k < -40; k += 14) { ctx.beginPath(); ctx.arc(k, 8 + (k % 3), 2.2, 0, Math.PI * 2); ctx.fill(); }   // tomato rows
      ctx.fillStyle = this.mix('#e9c46a', '#8a7a4a', dusk); for (let k = 50; k < 150; k += 10) ctx.fillRect(k, 6, 5, 18);   // wheat
      ctx.fillStyle = this.mix('#b23a48', '#6a2a3a', dusk); ctx.fillRect(-120, -42, 62, 42); ctx.fillStyle = this.mix('#8a2a36', '#4e1e2a', dusk); ctx.beginPath(); ctx.moveTo(-126, -42); ctx.lineTo(-89, -64); ctx.lineTo(-52, -42); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f5f0dc'; ctx.fillRect(-100, -24, 22, 24); ctx.strokeStyle = this.mix('#8a2a36', '#4e1e2a', dusk); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-100, -24); ctx.lineTo(-78, 0); ctx.moveTo(-78, -24); ctx.lineTo(-100, 0); ctx.stroke();   // the barn
      ctx.strokeStyle = this.mix('#8d5a2b', '#4e3a22', dusk); ctx.lineWidth = 2; for (let k = -16; k <= 40; k += 14) { ctx.beginPath(); ctx.moveTo(k, -14); ctx.lineTo(k, 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(40, -10); ctx.moveTo(-16, -3); ctx.lineTo(40, -3); ctx.stroke();   // the pen
      { const bob = Math.sin(t * 1.3) * 1.5, tail = Math.sin(t * 2.6) * 0.6; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(10, -12, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(5, -14, 4, 3, 0, 0, Math.PI * 2); ctx.ellipse(15, -10, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(24, -14 + bob, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f4a6b0'; ctx.fillRect(26, -12 + bob, 5, 3); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(24, -16 + bob, 1, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; for (const lx of [2, 8, 14, 18]) { ctx.beginPath(); ctx.moveTo(lx, -6); ctx.lineTo(lx, -1); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(-8 + tail * 3, -8 + tail * 2); ctx.stroke(); }   // the cow
      ctx.fillStyle = this.mix('#e9c46a', '#8a7a4a', dusk); ctx.beginPath(); ctx.arc(60, -8, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(60, -8, 4, 0, Math.PI * 2); ctx.stroke();   // a hay bale
      ctx.restore(); }
    // mid layer: the train station with its platform, and the train puffing past now and then
    { const ox = sx(0.2, K2), oy = hz + Rv * 0.035, s2 = S * 0.9; ctx.save(); ctx.translate(ox, oy); ctx.scale(s2, s2);
      ctx.fillStyle = this.mix('#b9b5ad', '#6a6878', dusk); ctx.fillRect(-90, -6, 180, 8); ctx.fillStyle = this.mix('#ffd166', '#a08a50', dusk); ctx.fillRect(-90, -6, 180, 1.5);   // the platform
      ctx.fillStyle = this.mix('#f2d6a0', '#8a7a62', dusk); ctx.fillRect(-70, -40, 60, 34); ctx.fillStyle = this.mix('#b23a48', '#6a2a3a', dusk); ctx.fillRect(-76, -46, 72, 8); ctx.fillStyle = dusk > 0.2 ? '#ffe08a' : '#9fe0ff'; ctx.fillRect(-62, -32, 10, 10); ctx.fillRect(-28, -32, 10, 10); ctx.fillStyle = this.mix('#5b3a1a', '#3a2a18', dusk); ctx.fillRect(-45, -22, 10, 16);   // the station house
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-40, -52, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-40, -52); ctx.lineTo(-40, -55.5); ctx.moveTo(-40, -52); ctx.lineTo(-37.5, -52); ctx.stroke();   // the clock
      ctx.fillStyle = this.mix('#2b1d14', '#1a1410', dusk); ctx.fillRect(20, -30, 3, 24); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(10, -36, 24, 9); ctx.fillStyle = '#fff'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('STATION', 22, -31.5);
      const tp = t % C.train;
      if (tp < 9) {   // the train rolls in from the east, slows at the platform and puffs off west
        const k = tp / 9, tx = 190 - U.easeOut(Math.min(1, k * 1.15)) * 150 - Math.max(0, k - 0.6) * 260, ty = -14;
        ctx.fillStyle = this.mix('#2d8a5a', '#1e5a3e', dusk); ctx.fillRect(tx + 30, ty - 12, 34, 14); ctx.fillStyle = this.mix('#f2b705', '#8a6a10', dusk); ctx.fillRect(tx + 68, ty - 12, 34, 14); ctx.fillStyle = '#9fe0ff'; for (const wx of [tx + 36, tx + 48, tx + 74, tx + 86]) ctx.fillRect(wx, ty - 9, 6, 5);   // the coaches
        ctx.fillStyle = this.mix('#c62828', '#7a1a1a', dusk); ctx.fillRect(tx, ty - 10, 28, 12); ctx.fillRect(tx - 2, ty - 18, 12, 10); ctx.fillStyle = '#2b1d14'; ctx.fillRect(tx + 20, ty - 18, 4, 8); ctx.fillStyle = '#ffe08a'; ctx.fillRect(tx - 3, ty - 6, 2, 3);
        ctx.fillStyle = '#2b1d14'; for (const wx of [tx + 5, tx + 14, tx + 23, tx + 36, tx + 58, tx + 74, tx + 96]) { ctx.beginPath(); ctx.arc(wx, ty + 2, 3, 0, Math.PI * 2); ctx.fill(); }
        for (let i = 0; i < 4; i++) { const age = (t * 0.8 + i * 0.25) % 1; ctx.fillStyle = `rgba(235,235,235,${(0.65 * (1 - age)).toFixed(2)})`; ctx.beginPath(); ctx.arc(tx + 22 + age * 14, ty - 20 - age * 20, 2.5 + age * 5, 0, Math.PI * 2); ctx.fill(); }   // puffs
      }
      ctx.restore(); }
    // mid layer: Main Street right under the window: the bus shelter, a lamp, cars driving by and the bus now and then
    { const ox = sx(0.37, K2), oy = hz + Rv * 0.13; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      ctx.fillStyle = this.mix('#5c6069', '#33364a', dusk); ctx.fillRect(-230, -16, 460, 26); ctx.fillStyle = this.mix('#b9b5ad', '#6a6878', dusk); ctx.fillRect(-230, -20, 460, 4); ctx.fillStyle = '#ffe08a'; for (let k = -226; k < 230; k += 18) ctx.fillRect(k, -4, 9, 2);   // the road
      ctx.fillStyle = this.mix('#3b7dd8', '#25487a', dusk); ctx.fillRect(-30, -44, 44, 5); ctx.fillStyle = 'rgba(159,224,255,0.6)'; ctx.fillRect(-27, -39, 38, 18); ctx.fillStyle = this.mix('#2d5a8a', '#1b3450', dusk); ctx.fillRect(-28, -40, 3, 20); ctx.fillRect(11, -40, 3, 20); ctx.fillStyle = this.mix('#8d5a2b', '#4e3a22', dusk); ctx.fillRect(-24, -27, 32, 3);   // the bus shelter and its bench
      ctx.fillStyle = '#e4572e'; ctx.fillRect(26, -46, 10, 8); ctx.fillStyle = this.mix('#3e424a', '#262a36', dusk); ctx.fillRect(30, -38, 2, 18); ctx.fillStyle = '#fff'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BUS', 31, -42);   // the stop sign
      ctx.fillStyle = this.mix('#3e424a', '#262a36', dusk); ctx.fillRect(-70, -50, 2, 30); ctx.fillStyle = dusk > 0.2 ? '#ffe08a' : '#d9dde3'; ctx.beginPath(); ctx.arc(-69, -51, 3.5, 0, Math.PI * 2); ctx.fill();   // the lamp post
      if (dusk > 0.2) { ctx.fillStyle = `rgba(255,224,138,${(0.18 * dusk).toFixed(2)})`; ctx.beginPath(); ctx.moveTo(-69, -50); ctx.lineTo(-90, -14); ctx.lineTo(-48, -14); ctx.closePath(); ctx.fill(); }
      const car = (cxx, cy2, col, dir) => { ctx.fillStyle = col; U.roundRect(ctx, cxx - 11, cy2 - 8, 22, 9, 3); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(cxx - 6, cy2 - 7, 5, 4); ctx.fillRect(cxx + 1, cy2 - 7, 5, 4); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cxx - 6, cy2 + 1, 2.5, 0, Math.PI * 2); ctx.arc(cxx + 6, cy2 + 1, 2.5, 0, Math.PI * 2); ctx.fill(); if (dusk > 0.2) { ctx.fillStyle = '#fff7c2'; ctx.fillRect(cxx + dir * 10, cy2 - 5, 2, 2); } };
      car(-230 + ((t * 38) % 470), -2, this.mix('#e4572e', '#8a3a24', dusk), 1); car(230 - ((t * 30 + 180) % 470), -9, this.mix('#41b883', '#2a6a50', dusk), -1);
      const bp = t % C.bus;
      if (bp < 12) { const k = bp / 12, bx = 230 - (k < 0.4 ? U.easeOut(k / 0.4) * 240 : k < 0.6 ? 240 : 240 + ((k - 0.6) / 0.4) * ((k - 0.6) / 0.4) * 240); ctx.fillStyle = this.mix('#3b7dd8', '#25487a', dusk); U.roundRect(ctx, bx - 26, -18, 52, 14, 4); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(bx - 24, -9, 48, 1.5); ctx.fillStyle = '#bfe3ff'; for (let k2 = -22; k2 < 20; k2 += 8) ctx.fillRect(bx + k2, -16, 5, 5); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(bx - 16, -3, 3, 0, Math.PI * 2); ctx.arc(bx + 14, -3, 3, 0, Math.PI * 2); ctx.fill(); }   // the City bus pulling in, waiting, and pulling away west
      ctx.restore(); }
    // mid layer: the park: trees, the pond with ducks, the fountain and a bench
    { const ox = sx(0.55, K2), oy = hz + Rv * 0.09; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      ctx.fillStyle = this.mix('#7cc45f', '#456a45', dusk); ctx.beginPath(); ctx.ellipse(0, 4, 150, 30, 0, 0, Math.PI * 2); ctx.fill();
      for (const [dx, s] of [[-120, 1.1], [-86, 0.9], [96, 1], [130, 0.85], [40, 0.8]]) { ctx.fillStyle = this.mix('#6b4a2b', '#3f2e1c', dusk); ctx.fillRect(dx - 2, -14 * s, 4, 14 * s); ctx.fillStyle = this.mix('#3f9a4a', '#2a5a38', dusk); ctx.beginPath(); ctx.arc(dx, -18 * s, 13 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = this.mix('#56b862', '#356a44', dusk); ctx.beginPath(); ctx.arc(dx - 4 * s, -22 * s, 7 * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = this.mix('#4aa3d8', '#2a4f80', dusk); ctx.beginPath(); ctx.ellipse(-30, 8, 44, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-50 + ((t * 8) % 30), 6, 10, 1.5); ctx.fillRect(-20 - ((t * 6) % 24), 11, 8, 1.5);   // the pond
      for (const [dx, ph] of [[-44, 0], [-16, 2]]) { const dy = 6 + Math.sin(t * 2 + ph) * 1; ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.ellipse(dx, dy, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(dx + 4, dy - 3, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(dx + 6, dy - 3, 2.5, 1.5); }   // ducks
      ctx.fillStyle = this.mix('#9aa0a8', '#5e6273', dusk); ctx.beginPath(); ctx.ellipse(60, 6, 22, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = this.mix('#4aa3d8', '#2a4f80', dusk); ctx.beginPath(); ctx.ellipse(60, 5, 18, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = this.mix('#b9b5ad', '#6a6878', dusk); ctx.fillRect(57, -16, 6, 20);
      for (let i = 0; i < 10; i++) { const k = (t * 0.9 + i * 0.1) % 1, side = i % 2 ? 1 : -1, dx2 = 60 + side * k * 12, dy2 = -16 - Math.sin(k * Math.PI) * 14 + k * 14; ctx.fillStyle = `rgba(190,230,255,${(0.9 - k * 0.6).toFixed(2)})`; ctx.beginPath(); ctx.arc(dx2, dy2, 1.8, 0, Math.PI * 2); ctx.fill(); }   // the fountain's spray
      ctx.fillStyle = this.mix('#8d5a2b', '#4e3a22', dusk); ctx.fillRect(100, -8, 24, 4); ctx.fillRect(100, -14, 24, 3); ctx.fillRect(102, -4, 2, 6); ctx.fillRect(120, -4, 2, 6);   // a bench
      ctx.restore(); }
    // mid layer: the fire station: red brick, two bays, the fire truck's nose in the lower one
    { const ox = sx(0.7, K2), oy = hz + Rv * 0.08; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      ctx.fillStyle = this.mix('#7c8088', '#45485a', dusk); ctx.fillRect(-70, -4, 140, 10);
      ctx.fillStyle = this.mix('#c0392b', '#6e2219', dusk); ctx.fillRect(-56, -56, 112, 56); ctx.fillStyle = this.mix('#922b21', '#54181a', dusk); ctx.fillRect(-60, -60, 120, 6); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = -50; yy < -2; yy += 8) for (let xx = -56 + ((yy / 8) % 2 ? 6 : 0); xx < 56; xx += 12) ctx.fillRect(xx, yy, 5, 1);
      ctx.fillStyle = this.mix('#d9dde3', '#7d8296', dusk); ctx.fillRect(-46, -36, 36, 36); ctx.fillRect(10, -36, 36, 36); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = -32; yy < 0; yy += 7) { ctx.fillRect(-46, yy, 36, 1.5); ctx.fillRect(10, yy, 36, 1.5); }   // the bay doors
      ctx.fillStyle = '#e4572e'; ctx.fillRect(12, -14, 32, 14); ctx.fillStyle = '#fff'; ctx.fillRect(12, -8, 32, 2.5); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(14, -12, 8, 4); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(18, 1, 3, 0, Math.PI * 2); ctx.arc(38, 1, 3, 0, Math.PI * 2); ctx.fill();   // the truck's nose
      ctx.fillStyle = dusk > 0.2 ? '#ffe08a' : '#9fe0ff'; ctx.fillRect(-50, -52, 12, 9); ctx.fillRect(-30, -52, 12, 9); ctx.fillRect(18, -52, 12, 9); ctx.fillRect(38, -52, 12, 9);
      ctx.fillStyle = '#fff'; ctx.fillRect(-16, -54, 32, 12); ctx.fillStyle = '#c0392b'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FIRE', 0, -48);
      ctx.fillStyle = this.mix('#3e424a', '#262a36', dusk); ctx.fillRect(48, -78, 2, 20); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(50, -78); ctx.lineTo(50 + 12 + Math.sin(t * 2.5) * 2, -75 + Math.sin(t * 3) * 1.5); ctx.lineTo(50, -70); ctx.closePath(); ctx.fill();   // the flag
      ctx.restore(); }
    // mid layer: the airfield: the hangar, the windsock, the runway and a plane taking off every so often
    { const ox = sx(0.86, K2), oy = hz + Rv * 0.1; ctx.save(); ctx.translate(ox, oy); ctx.scale(S, S);
      ctx.fillStyle = this.mix('#7c8088', '#45485a', dusk); ctx.fillRect(-100, -6, 200, 12); ctx.fillStyle = this.mix('#5c6069', '#33364a', dusk); ctx.fillRect(-60, 4, 300, 10); ctx.fillStyle = '#fff'; for (let k = -56; k < 240; k += 16) ctx.fillRect(k, 8.5, 8, 1.5);   // the apron and the runway
      ctx.fillStyle = this.mix('#9aa0a8', '#5e6273', dusk); ctx.beginPath(); ctx.moveTo(-90, -6); ctx.lineTo(-90, -34); ctx.quadraticCurveTo(-60, -62, -30, -34); ctx.lineTo(-30, -6); ctx.closePath(); ctx.fill(); ctx.fillStyle = this.mix('#6b7280', '#3f4352', dusk); ctx.fillRect(-80, -30, 40, 24); ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let yy = -28; yy < -8; yy += 6) ctx.fillRect(-80, yy, 40, 1);   // the hangar
      ctx.fillStyle = '#fff'; ctx.fillRect(-76, -45, 32, 8); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HANGAR', -60, -41);
      { const wa = -0.25 + Math.sin(t * 1.2) * 0.3 + Math.sin(t * 3.1) * 0.08; ctx.fillStyle = this.mix('#3e424a', '#262a36', dusk); ctx.fillRect(-16, -50, 2, 44); ctx.save(); ctx.translate(-15, -50); ctx.rotate(wa); ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(24, -2); ctx.lineTo(24, 2); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(8, -3.3, 5, 6.6); ctx.restore(); }   // the windsock
      const pp = t % C.plane; let px = 10, py = -6, lift = 0, s3 = 1;   // the plane: waits on its stand, rolls down the runway, climbs away east
      if (pp < 5) { px = 10 + (pp / 5) * (pp / 5) * 160; py = -6; }
      else if (pp < 11) { const k = (pp - 5) / 6; px = 170 + k * 240; lift = k * k * 90; s3 = 1 - k * 0.5; }
      else { px = 26; py = -12; }
      ctx.save(); ctx.translate(px, py - lift); ctx.scale(s3, s3); if (lift > 0) ctx.rotate(-0.3); ctx.fillStyle = 'rgba(0,0,0,0.12)'; if (pp < 11) { ctx.beginPath(); ctx.ellipse(0, lift / s3 + 4, 12, 3, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff'; U.roundRect(ctx, -14, -5, 28, 8, 4); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-14, -3); ctx.lineTo(-10, -13); ctx.lineTo(-6, -3); ctx.closePath(); ctx.fill(); ctx.fillRect(-6, -2, 16, 2.5); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(4, -4, 6, 3); ctx.fillStyle = '#2b1d14'; ctx.fillRect(14, -6 + Math.sin(t * 40) * 4, 1.5, 8); ctx.restore();
      ctx.restore(); }
    // near layer: the river along the bottom of the view, its bank, the ferry chugging across, reeds
    { const ry = cy + Rv * 0.42, x0 = sx(-0.6, K3), x1 = sx(1.6, K3);
      ctx.fillStyle = this.mix('#e8d49a', '#8a7f62', dusk); ctx.fillRect(x0, ry - 6, x1 - x0, 6); ctx.fillStyle = this.mix('#4aa3d8', '#2a4f80', dusk); ctx.fillRect(x0, ry, x1 - x0, H); ctx.fillStyle = this.mix('#2f86bd', '#1f3a60', dusk); ctx.fillRect(x0, ry, x1 - x0, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 18; i++) { const wx = sx(-0.5 + (i % 9) * 0.26, K3) + ((t * 12 + i * 37) % 70), wy = ry + 8 + Math.floor(i / 9) * Rv * 0.2 + (i % 3) * 5; ctx.fillRect(wx, wy, 16 * S, 2); }
      for (let i = 0; i < BEDSCOPE_BUSHES.length; i++) { const [fc, bs] = BEDSCOPE_BUSHES[i], bx = sx(fc, K3), bsz = bs * S; ctx.fillStyle = this.mix('#3f9a4a', '#2a5a38', dusk); ctx.beginPath(); ctx.arc(bx, ry - 8 - bsz * 0.5, bsz, 0, Math.PI * 2); ctx.arc(bx + bsz * 0.9, ry - 8 - bsz * 0.3, bsz * 0.8, 0, Math.PI * 2); ctx.arc(bx - bsz * 0.9, ry - 8 - bsz * 0.3, bsz * 0.75, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = this.mix('#56b862', '#356a44', dusk); ctx.beginPath(); ctx.arc(bx - bsz * 0.3, ry - 10 - bsz * 0.8, bsz * 0.45, 0, Math.PI * 2); ctx.fill(); }
      for (const fc of [-0.2, 0.3, 0.75, 1.25]) { const rx = sx(fc, K3); ctx.strokeStyle = this.mix('#2f7a3e', '#1f4a2c', dusk); ctx.lineWidth = 2 * S; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(rx + k * 5 * S, ry); ctx.quadraticCurveTo(rx + k * 5 * S + Math.sin(t * 1.5 + k) * 3, ry - 12 * S, rx + k * 6 * S + Math.sin(t * 1.5 + k) * 5, ry - 22 * S); ctx.stroke(); } }   // reeds on the bank
      { const fu = (t * 0.1) % 2, fk = fu < 1 ? fu : 2 - fu, fx = sx(-0.1 + fk * 1.2, K3), fdir = fu < 1 ? 1 : -1, fy = ry + Rv * 0.12 + Math.sin(t * 1.4) * 2; ctx.save(); ctx.translate(fx, fy); ctx.scale(S * 1.3, S * 1.3);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(-fdir * 24, 10); ctx.lineTo(-fdir * 60, 6); ctx.lineTo(-fdir * 60, 14); ctx.closePath(); ctx.fill();   // the wake
        ctx.fillStyle = this.mix('#2d5a8a', '#1b3450', dusk); ctx.beginPath(); ctx.moveTo(-24, 8); ctx.lineTo(24, 8); ctx.lineTo(18, 18); ctx.lineTo(-18, 18); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-16, -3, 32, 11); ctx.fillStyle = dusk > 0.2 ? '#ffe08a' : '#9fe0ff'; for (let k = -12; k < 12; k += 7) ctx.fillRect(k, 0, 4, 4); ctx.fillStyle = '#e4572e'; ctx.fillRect(fdir * 6 - 3, -11, 6, 8);
        for (let i = 0; i < 3; i++) { const age = (t * 0.7 + i * 0.33) % 1; ctx.fillStyle = `rgba(235,235,235,${(0.5 * (1 - age)).toFixed(2)})`; ctx.beginPath(); ctx.arc(fdir * 6 - fdir * age * 14, -13 - age * 16, 2 + age * 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore(); } }
    // the time of day: golden hour and dawn warmth, then the dusk tint and the stars
    const A = CFG.ATMOSPHERE;
    if (warm > 0 && A) { const c = A.GOLDEN_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.GOLDEN_ALPHA * warm).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (dawn > 0 && A) { const c = A.DAWN_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DAWN_ALPHA * dawn).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (dusk > 0 && A) {
      const c = A.DUSK_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DUSK_ALPHA * dusk).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
      if (dusk > 0.5) for (let i = 0; i < BEDSCOPE_STARS.length; i++) { const [ux, uy] = BEDSCOPE_STARS[i], tw = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.7); ctx.fillStyle = `rgba(255,255,255,${(((dusk - 0.5) * 2) * (0.35 + 0.55 * tw)).toFixed(2)})`; ctx.beginPath(); ctx.arc(cx + ux * Rv, cy + uy * Rv, 1 + tw * 1.2, 0, Math.PI * 2); ctx.fill(); }
    }
    CityExt.scopeEnd(r, g, v, W, H, G, BEDSCOPE_SPOTS, BEDSCOPE_COMPASS);
  },
};

Game.ext.unshift(BedroomScopeExt);   // first in line so its button and hint beat the bedroom's own
Render.ext.push(BedroomScopeExt);
