'use strict';
// The big red harvester on the farm: a classic combine with a spinning reel at the front, an open grain tank, an
// unloading auger (a pipe that swings out) and a chimney that puffs. Drive it over ripe plots and they are harvested
// (the core does that for any vehicle whose spec says `harvests`); the crop bits fly into the tank and it fills up.
// With 6 or more in the tank, by the barn, '🌾 Unload the grain' swings the auger out and pours a little grain pile.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
CFG.HARVESTER = {
  SPOT: { x: -900, y: 800, angle: -Math.PI / 2 },   // parked on the grass in the farm's bottom-left corner, nose to the plots
  PILE: { x: -776, y: 174 },                        // the grain pile: against the barn's right wall, just north of the big door
  UNLOAD_R: 150,                                    // how close to the pile the harvester must be to unload
  TANK_MAX: 12, UNLOAD_MIN: 6,
  NEAR: 70,                                         // on foot this close: "Drive the big harvester!"
  CROPS_R: 700,                                     // driving with ripe plots this close: "Drive over the crops!"
  UNLOAD: { out: 0.5, pour: 1.6, back: 0.5 },       // seconds: auger swings out, grain pours, auger swings back
  AUGER: { px: -14, py: -24, len: 52 },             // the auger's pivot on the tank's left side, and its length
  CHIMNEY: { x: -50, y: 13 },
  TANK: { x: -16, y: 0 },
};
CFG.VEHICLES.combine = { speed: 200, radius: 30, label: '🚜 Drive the harvester', exit: '🚶 Hop out', harvests: true, harvestReach: 70 };

const HarvesterExt = {
  name: 'harvester',
  defaults: { harvester: { pile: 0 } },
  v: null, st: null,

  build(g) {
    const S = CFG.HARVESTER.SPOT;
    if (!g.s.harvester) g.s.harvester = { pile: 0 };
    this.v = { kind: 'combine', x: S.x, y: S.y, angle: S.angle, vx: 0, vy: 0, reel: 0, auger: 0 };
    this.st = { tank: 0, kinds: [], show: 0, unload: null, bits: [], grains: [], prev: null, was: false, puffT: 0 };
  },
  ensure(g) { if (!this.v || !this.st) this.build(g); if (!g.s.harvester) g.s.harvester = { pile: 0 }; },
  vehicles(g) { this.ensure(g); return [this.v]; },
  riding(g) { return !!(this.v && g.driving && g.vehicle === this.v); },
  // the chef is somewhere else entirely: on a train, travelling, in a City taxi or up the Pizza Tower
  busy(g) {
    if (g.travel || g.onTrain || g.ride) return true;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return true;
    return false;
  },
  // world position of a point given in the harvester's own frame (nose +x)
  world(lx, ly) { const v = this.v, c = Math.cos(v.angle), s = Math.sin(v.angle); return { x: v.x + lx * c - ly * s, y: v.y + lx * s + ly * c }; },
  augerTip() { const A = CFG.HARVESTER.AUGER, a = -this.v.auger * Math.PI / 2; return this.world(A.px + Math.cos(a) * (A.len + 6), A.py + Math.sin(a) * (A.len + 6)); },
  nearPile(g) { const P = CFG.HARVESTER.PILE; return U.dist(this.v.x, this.v.y, P.x, P.y) < CFG.HARVESTER.UNLOAD_R; },
  ripePlots(g) { const p = g.player, R = CFG.HARVESTER.CROPS_R; return g.plots.filter((pl) => pl.ready && U.dist(p.x, p.y, pl.x, pl.y) < R).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y)); },

  update(g, dt) {
    this.ensure(g);
    const H = CFG.HARVESTER, v = this.v, st = this.st, riding = this.riding(g);
    // the core harvests after the extensions update: a plot that was ripe last step and is picked now, close to the
    // harvester while it was being driven, went into the tank
    if (st.prev && st.was && g.area === 'town') {
      for (const pl of g.plots) {
        if (!st.prev[pl.i] || pl.ready || U.dist(v.x, v.y, pl.x, pl.y) > CFG.VEHICLES.combine.harvestReach + 30) continue;
        if (st.tank < H.TANK_MAX) st.tank++;
        st.kinds.push(pl.kind); if (st.kinds.length > 8) st.kinds.shift();
        for (let k = 0; k < 6; k++) st.bits.push({ x0: pl.x + U.rand(-10, 10), y0: pl.y - U.rand(4, 18), t: -k * 0.05, dur: U.rand(0.45, 0.65), kind: pl.kind, arc: U.rand(30, 60), dx: U.rand(-8, 8), dy: U.rand(-8, 8) });
      }
    }
    st.prev = g.plots.map((pl) => pl.ready); st.was = riding;
    // the reel turns while someone is at the wheel, faster as it rolls along
    const speed = Math.hypot(v.vx, v.vy);
    if (riding) v.reel += dt * (1.5 + speed * 0.04);
    st.show += (st.tank / H.TANK_MAX - st.show) * Math.min(1, dt * 4);
    // unloading: swing out, pour, swing back
    const u = st.unload;
    if (u) {
      const U2 = H.UNLOAD, P = H.PILE; u.t += dt;
      if (u.t < U2.out) v.auger = u.t / U2.out;
      else if (u.t < U2.out + U2.pour) {
        v.auger = 1;
        if (!u.whoosh) { u.whoosh = true; g.floats.push({ x: P.x, y: P.y - 46, text: 'Whoosh! 🌾', color: '#ffe08a', t: 0, dur: 1.4, big: true }); Sfx.drop(); Haptics.tap(); }
        const want = Math.min(u.load, Math.ceil(((u.t - U2.out) / U2.pour) * u.load));
        while (u.poured < want) { u.poured++; st.tank = Math.max(0, st.tank - 1); g.s.harvester.pile++; }
        u.grainT = (u.grainT || 0) - dt;
        while (u.grainT <= 0) { u.grainT += 0.03; const tip = this.augerTip(); st.grains.push({ x0: tip.x, y0: tip.y, x1: P.x + U.rand(-12, 12), y1: P.y + U.rand(-5, 5), t: 0, dur: U.rand(0.3, 0.45) }); }
      } else if (u.t < U2.out + U2.pour + U2.back) {
        while (u.poured < u.load) { u.poured++; st.tank = Math.max(0, st.tank - 1); g.s.harvester.pile++; }
        v.auger = 1 - (u.t - U2.out - U2.pour) / U2.back;
      } else { v.auger = 0; st.unload = null; st.kinds = []; }
    }
    for (const b of st.bits) b.t += dt;
    st.bits = st.bits.filter((b) => b.t < b.dur);
    for (const p of st.grains) p.t += dt;
    st.grains = st.grains.filter((p) => p.t < p.dur);
    st.puffT += dt * (riding ? (speed > 15 ? 2.2 : 1.3) : 0.45);
  },

  action(g) {
    if (!this.st || !this.riding(g) || this.busy(g) || g.area !== 'town' || this.st.unload) return null;
    if (this.st.tank < CFG.HARVESTER.UNLOAD_MIN || !this.nearPile(g)) return null;
    return { label: '🌾 Unload the grain', run: (gg) => this.startUnload(gg) };
  },
  startUnload(g) {
    const st = this.st; if (st.unload || st.tank <= 0) return;
    st.unload = { t: 0, load: st.tank, poured: 0, whoosh: false };
  },

  hint(g) {
    if (!this.v || g.area !== 'town' || this.busy(g)) return undefined;
    const H = CFG.HARVESTER, p = g.player, st = this.st;
    if (this.riding(g)) {
      if (st.unload) return { text: 'Whoosh! 🌾', target: null };
      const ripe = this.ripePlots(g)[0];
      if (st.tank >= H.UNLOAD_MIN && (this.nearPile(g) || !ripe || st.tank >= H.TANK_MAX)) return { text: 'Unload the grain by the barn! 🌾', target: this.nearPile(g) ? null : H.PILE };
      if (ripe) return { text: 'Drive over the crops! 🌾', target: ripe };
      return undefined;
    }
    if (g.driving) return undefined;
    if (U.dist(p.x, p.y, this.v.x, this.v.y) < H.NEAR) return { text: 'Drive the big harvester! 🚜', target: this.v };
    return undefined;
  },

  home(g) {
    if (!this.st) return;
    if (this.st.unload) { const u = this.st.unload; while (u.poured < u.load) { u.poured++; this.st.tank = Math.max(0, this.st.tank - 1); g.s.harvester.pile++; } }
    this.st.unload = null; this.st.bits = []; this.st.grains = []; this.v.auger = 0; this.v.vx = 0; this.v.vy = 0;
  },

  // ---------------- drawing ----------------
  CROP_COL: { tomato: '#e53935', wheat: '#f2c94c', basil: '#3f9a4a', mushroom: '#b06b3b', cheese: '#ffe08a' },

  // the grain pile by the barn (under people): a straw patch marks the spot, the heap grows with every unload
  dynamic(r, g) {
    if (g.area !== 'town' || !g.s.harvester) return;
    const ctx = r.ctx, P = CFG.HARVESTER.PILE, n = g.s.harvester.pile, k = Math.min(1, n / 36);
    ctx.fillStyle = 'rgba(224,180,76,0.45)'; ctx.beginPath(); ctx.ellipse(P.x, P.y + 4, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 1.5;
    for (const [dx, dy, a] of [[-16, 6, 0.4], [12, 8, -0.6], [-4, 12, 1.1], [18, 0, 2.2]]) { ctx.beginPath(); ctx.moveTo(P.x + dx, P.y + dy); ctx.lineTo(P.x + dx + Math.cos(a) * 7, P.y + dy + Math.sin(a) * 7); ctx.stroke(); }
    if (n <= 0) return;
    const w = 12 + 16 * k, h = 6 + 16 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(P.x + 3, P.y + 5, w + 3, 7 + 4 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.moveTo(P.x - w, P.y + 4); ctx.quadraticCurveTo(P.x, P.y - h * 2, P.x + w, P.y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.moveTo(P.x - w * 0.7, P.y + 2); ctx.quadraticCurveTo(P.x - w * 0.15, P.y - h * 1.8, P.x + w * 0.35, P.y + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3c4'; for (let i = 0; i < 5 + 6 * k; i++) ctx.fillRect(P.x - w * 0.6 + ((i * 37) % (w * 1.2)), P.y - ((i * 13) % Math.max(2, h * 0.9)), 2, 2);
  },

  entities(r, g, items) {
    if (g.area !== 'town' || !this.v) return;
    const v = this.v;
    items.push({ y: v.y + 16, draw: () => this.drawRide(r, g) });
  },
  drawRide(r, g) {
    const ctx = r.ctx, v = this.v, riding = this.riding(g);
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    r.drawVehicle('combine', g, g.s.paint.combine, v);
    if (riding) {   // the chef's head and hat in the black cab
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(22, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(25, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(23, 0, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // chimney puffs rise straight up the screen whichever way the harvester faces
    const C = CFG.HARVESTER.CHIMNEY, ch = this.world(C.x, C.y), on = riding;
    // a short black stack standing up out of the engine, a silver rim on top
    ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, ch.x - 3.5, ch.y - 13, 7, 14, 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, ch.x - 5, ch.y - 15, 10, 4, 2); ctx.fill();
    const n = 4;
    for (let i = 0; i < n; i++) {
      const ph = (this.st.puffT + i / n) % 1;
      if (!on && i % 2) continue;
      ctx.globalAlpha = (1 - ph) * (on ? 0.8 : 0.45);
      ctx.fillStyle = on ? '#9e9e9e' : '#c9c9c9';
      ctx.beginPath(); ctx.arc(ch.x + Math.sin(ph * 5 + i) * 4 - ph * 8, ch.y - 18 - ph * 42, 4 + ph * 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    r.drawRidingExtras(g, v, 44);
  },

  // crop bits flying into the tank and grain pouring from the auger (world space, over everything)
  overlay(r, g) {
    if (g.area !== 'town' || !this.st) return;
    const ctx = r.ctx, st = this.st, T = CFG.HARVESTER.TANK;
    if (st.bits.length) {
      const tank = this.world(T.x, T.y);
      for (const b of st.bits) {
        if (b.t < 0) continue;
        const k = U.clamp(b.t / b.dur, 0, 1), x = U.lerp(b.x0, tank.x + b.dx, k), y = U.lerp(b.y0, tank.y + b.dy, k) - Math.sin(k * Math.PI) * b.arc;
        ctx.fillStyle = this.CROP_COL[b.kind] || '#f2c94c';
        ctx.beginPath(); ctx.arc(x, y, 4.5 - k * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1.2, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const p of st.grains) {
      const k = U.clamp(p.t / p.dur, 0, 1), x = U.lerp(p.x0, p.x1, k), y = U.lerp(p.y0, p.y1, k) - Math.sin(k * Math.PI) * 18;
      ctx.fillStyle = (Math.floor(p.x1) % 2) ? '#f2c94c' : '#d4a017';
      ctx.fillRect(x - 1.8, y - 1.8, 3.6, 3.6);
    }
  },

  // the harvester itself, nose +x: header with the reel, black cab, open grain tank, auger, engine and chimney
  vehicleArt: {
    combine(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#c62828', dark = 'rgba(0,0,0,0.22)', cream = '#f3e3bf', t = g.time;
      const st = HarvesterExt.st, fill = st && v === HarvesterExt.v ? st.show : 0, reel = v ? v.reel || 0 : t, auger = v ? v.auger || 0 : 0;
      // shadow under the body and the header
      h.shadow(124, 32); ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, 48, -52, 36, 116, 8); ctx.fill();
      // wheels: big drive wheels up front, smaller steering wheels at the back, black tyres with cream rims
      const wheel = (x, y, w, hh) => {
        ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, x - w / 2, y - hh / 2, w, hh, 4); ctx.fill();
        ctx.fillStyle = '#3a3a3a'; for (let k = -w / 2 + 3; k < w / 2 - 1; k += 5) ctx.fillRect(x + k, y - hh / 2, 2, hh);
        ctx.fillStyle = cream; U.roundRect(ctx, x - w * 0.3, y - hh * 0.28, w * 0.6, hh * 0.56, 3); ctx.fill();
        ctx.fillStyle = '#b08a4a'; ctx.beginPath(); ctx.arc(x, y, Math.min(w, hh) * 0.14, 0, Math.PI * 2); ctx.fill();
      };
      wheel(18, -38, 34, 16); wheel(18, 38, 34, 16); wheel(-44, -33, 22, 12); wheel(-44, 33, 22, 12);
      // body
      ctx.fillStyle = c; U.roundRect(ctx, -60, -31, 102, 62, 10); ctx.fill();
      ctx.fillStyle = dark; U.roundRect(ctx, -60, 19, 102, 12, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; U.roundRect(ctx, -56, -29, 94, 4, 2); ctx.fill();
      // engine grille at the back and the chimney
      ctx.fillStyle = '#8e1c1c'; U.roundRect(ctx, -60, -20, 16, 40, 5); ctx.fill();
      ctx.fillStyle = '#2b1d14'; for (let k = -15; k <= 13; k += 5) ctx.fillRect(-57, k, 10, 2);
      const C = CFG.HARVESTER.CHIMNEY;
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(C.x, C.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(C.x, C.y, 3.8, 0, Math.PI * 2); ctx.fill();
      // the open grain tank: a cream rim, dark inside, golden grain that rises as it fills (and heaps up when full)
      const T = CFG.HARVESTER.TANK;
      ctx.fillStyle = cream; U.roundRect(ctx, T.x - 24, -23, 48, 46, 7); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, T.x - 20, -19, 40, 38, 5); ctx.fill();
      if (fill > 0.01) {
        const k = Math.min(1, fill), gw = 6 + 34 * k, gh = 5 + 33 * k;
        ctx.fillStyle = '#d4a017'; U.roundRect(ctx, T.x - gw / 2, -gh / 2, gw, gh, Math.min(gw, gh) / 2.5); ctx.fill();
        ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.ellipse(T.x - 2, -2, gw * 0.36, gh * 0.34, 0, 0, Math.PI * 2); ctx.fill();
        if (k > 0.9) { ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.ellipse(T.x - 4, -4, 9, 7, 0, 0, Math.PI * 2); ctx.fill(); }
        const kinds = st && v === HarvesterExt.v ? st.kinds : [];
        for (let i = 0; i < kinds.length; i++) {   // a few colourful crop bits on top of the grain
          const a = i * 2.4, rr = 4 + (i % 3) * 4 * k;
          ctx.fillStyle = HarvesterExt.CROP_COL[kinds[i]] || '#f2c94c';
          ctx.beginPath(); ctx.arc(T.x + Math.cos(a) * rr * (gw / 40), Math.sin(a) * rr * (gh / 40), 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      // the black cab up front, with windows and a gleam on the windscreen
      ctx.fillStyle = '#1e1e1e'; U.roundRect(ctx, 12, -17, 28, 34, 6); ctx.fill();
      ctx.fillStyle = '#3d5166'; U.roundRect(ctx, 33, -13, 5, 26, 2); ctx.fill(); U.roundRect(ctx, 15, -15, 16, 4, 2); ctx.fill(); U.roundRect(ctx, 15, 11, 16, 4, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(34, -10, 2, 9);
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(26, -19, 2.5, 0, Math.PI * 2); ctx.fill();   // a little roof lamp
      // the name, kept the right way up: along the side when it drives across the screen, on the header's back wall
      // when it drives up or down the screen
      const ca = v ? Math.cos(v.angle) : 1, sa = v ? Math.sin(v.angle) : 0, side = Math.abs(ca) >= Math.abs(sa);
      ctx.save(); ctx.fillStyle = cream; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (side) { ctx.translate(-20, 25.5); if (ca < 0) ctx.rotate(Math.PI); ctx.fillText('HARVESTER', 0, 0); }
      ctx.restore();
      // feeder and the wide header: a back wall (with the name when seen end-on), the trough, cutter bar and dividers
      ctx.fillStyle = '#8e1c1c'; U.roundRect(ctx, 38, -13, 12, 26, 3); ctx.fill();
      ctx.fillStyle = c; U.roundRect(ctx, 46, -56, 30, 112, 5); ctx.fill();
      ctx.fillStyle = '#8e1c1c'; ctx.fillRect(46, -56, 11, 112);
      ctx.fillStyle = '#e8c06a'; ctx.fillRect(58, -52, 16, 104);                                  // the trough, gold with straw
      ctx.fillStyle = '#c9a03f'; for (let k = -50; k < 50; k += 7) ctx.fillRect(59 + ((k * 7) & 7), k, 6, 2);
      if (!side) { ctx.save(); ctx.translate(51.5, 0); ctx.rotate(sa < 0 ? Math.PI / 2 : -Math.PI / 2); ctx.fillStyle = cream; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HARVESTER', 0, 0.5); ctx.restore(); }
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(74, -54, 4, 108);                                  // cutter bar
      ctx.fillStyle = '#5c6670'; for (let k = -52; k < 52; k += 6) { ctx.beginPath(); ctx.moveTo(77, k); ctx.lineTo(81, k + 2); ctx.lineTo(77, k + 4); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = cream; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(48, s * 52); ctx.lineTo(86, s * 56); ctx.lineTo(48, s * 60); ctx.closePath(); ctx.fill(); }   // crop dividers
      // the reel: bats on spokes turning round the axle, the ones on top bright, the ones underneath dim
      const RX = 66, RR = 12;
      ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(RX, -54); ctx.lineTo(RX, 54); ctx.stroke();
      const bats = [];
      for (let i = 0; i < 5; i++) { const a = reel * 3 + i * Math.PI * 2 / 5; bats.push({ x: RX + Math.cos(a) * RR, top: -Math.sin(a) }); }
      bats.sort((a, b) => a.top - b.top);
      for (const b of bats) {
        const up = b.top > 0;
        ctx.strokeStyle = up ? '#2b1d14' : '#7a6a45'; ctx.lineWidth = up ? 2 : 1.5;
        for (const y of [-50, 0, 50]) { ctx.beginPath(); ctx.moveTo(RX, y); ctx.lineTo(b.x, y); ctx.stroke(); }
        ctx.fillStyle = up ? '#ffd166' : '#b8963c'; U.roundRect(ctx, b.x - 2.5, -52, 5, 104, 2); ctx.fill();
        if (up) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(b.x - 2, -50, 1.5, 100); }
      }
      ctx.fillStyle = '#5c6670'; for (const y of [-54, 54]) { ctx.beginPath(); ctx.arc(RX, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
      // headlights on the cab's front corners
      ctx.fillStyle = '#fff6b0'; U.roundRect(ctx, 39, -17, 4, 6, 1); ctx.fill(); U.roundRect(ctx, 39, 11, 4, 6, 1); ctx.fill();
      // the unloading auger: a pipe on the left side; stowed along the body, swung out sideways to pour
      const A = CFG.HARVESTER.AUGER, aa = -auger * Math.PI / 2;
      ctx.save(); ctx.translate(A.px, A.py); ctx.rotate(aa);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, 0, -1, A.len, 10, 5); ctx.fill();
      ctx.fillStyle = cream; U.roundRect(ctx, 0, -5, A.len, 10, 5); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 1, A.len, 4);
      ctx.fillStyle = '#c9b48a'; for (let k = 10; k < A.len - 4; k += 12) ctx.fillRect(k, -5, 3, 10);   // the pipe's joints
      ctx.fillStyle = '#8e1c1c'; U.roundRect(ctx, A.len - 4, -6, 12, 12, 3); ctx.fill();                    // spout
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(A.len + 2, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#8e1c1c'; ctx.beginPath(); ctx.arc(A.px, A.py, 6, 0, Math.PI * 2); ctx.fill();         // the pivot
      ctx.fillStyle = cream; ctx.beginPath(); ctx.arc(A.px, A.py, 2.5, 0, Math.PI * 2); ctx.fill();
    },
  },
};
Game.ext.unshift(HarvesterExt);
Render.ext.push(HarvesterExt);
