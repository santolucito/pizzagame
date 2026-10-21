'use strict';
// Rooftops: the ice cream shop gets a flat roof of its own, and the helicopter can land on the two flat roofs in
// town (the pizzeria's and the ice cream shop's) so the chef can hop out and walk about up there.
// Extension module: registered first in Game.ext and last in Render.ext. See the hook list in js/EXTENSIONS.md.
//
// A. THE ICE CREAM ROOF. Like the pizzeria's roof (js/upstairs.js) it covers the whole shop while the chef is outside
//    and fades away (same fade time) when the chef walks in the door, so the counter, the scooper and the customers
//    show. Pastel mint with a pink parapet, a big painted ice-cream cone, sprinkles, a round skylight, a frosty freezer
//    vent and a cone weather vane. The still parts are cached in one offscreen canvas; the vane, the mist and the
//    skylight glow move each frame. Drawn from the `overlay` hook, after the pizzeria roof and the flying helicopter.
// B. LANDING ON ROOFS. While the helicopter hovers over a roof the obstacles in the game are replaced
//    (`obstaclesOverride`) by that roof's four edge walls, so Land finds a spot on the roof and the chef steps out
//    onto it. `st.roof` is then set and stays set while the chef walks about up there: only the edge walls count, so
//    they can never fall off the roof and never bump into the shop's furniture below. The chef and the parked
//    helicopter are drawn again above the roof art, and the roof stays opaque (upstairs.js asks `aboveRoofs`).
//    Hop back in and fly away to clear it. Fun up there: pigeons that flutter off when you come near (pizzeria), a
//    frosty vent that puffs when you stand by it and a weather vane that spins when you touch it (ice cream shop).
//    A reload with the chef on a roof puts the helicopter back beside them.
CFG.ROOFTOPS = {
  WALL: 80,   // thickness of the invisible walls round a roof's walkable area
  NEAR: 40,   // a hovering helicopter this far outside a roof still counts as over it, so a landing half over the edge ends up fully on the roof or on the ground past the wall, never in the shop
  ROOFS: [
    // walk: where the chef's feet may be: inside the parapet and (pizzeria) clear of the office stairs' landing below
    { key: 'pizzeria', rect: CFG.BUILDING, walk: { x0: CFG.BUILDING.x0 + 24, y0: CFG.BUILDING.y0 + 30, x1: CFG.BUILDING.x1 - 24, y1: CFG.BUILDING.y1 - 68 } },
    { key: 'icecream', rect: CFG.ICE_CREAM.rect, walk: { x0: CFG.ICE_CREAM.rect.x0 + 22, y0: CFG.ICE_CREAM.rect.y0 + 30, x1: CFG.ICE_CREAM.rect.x1 - 22, y1: CFG.ICE_CREAM.rect.y1 - 22 } },
  ],
  ICE: {
    pad: 6, parapet: 10,                                  // how far the roof overhangs the walls; the ledge's width
    cone: { x: 1078, y: 234 },                            // the big painted cone
    skylight: { x: 1168, y: 174, r: 22 },
    vent: { x: 1064, y: 158, reach: 48 },                 // the freezer's frosty vent: stand by it and it puffs
    vane: { x: 1178, y: 268, reach: 30 },                 // the cone weather vane: touch it and it spins
    hatch: { x: 1124, y: 290 },
    pipes: [[1202, 132], [1042, 302]],
  },
  PIGEONS: [{ x: 300, y: 520 }, { x: 640, y: 320 }],     // the pizzeria roof's skittish pigeons: they fly off when you come close and come back later
  SCARE: 70,
};

const RooftopsExt = {
  name: 'rooftops',
  st: null, iceBg: null, bypass: false,

  // ======================= game hooks =======================
  defaults: { rooftops: { seen: {}, parked: null, toasted: false } },
  save(g) {
    if (!g.s.rooftops) g.s.rooftops = { seen: {}, parked: null, toasted: false };
    if (!g.s.rooftops.seen) g.s.rooftops.seen = {};
    return g.s.rooftops;
  },
  build(g) {
    this.save(g);
    this.st = {
      roof: null, wasFlying: false, pending: true, iceA: 1,
      mist: [], mistT: 0, vane: { a: 0, v: 0, cd: 0 },
      pigeons: CFG.ROOFTOPS.PIGEONS.map((q, i) => ({ hx: q.x, hy: q.y, x: q.x, y: q.y, z: 0, state: 'sit', t: 0, vx: 0, vy: 0, facing: i % 2 ? -1 : 1, ph: i * 2.1, wait: 0 })),
    };
    this.st.iceA = this.insideIce(g) ? 0 : 1;
  },
  home(g) {
    if (!this.st) return;
    this.st.roof = null; this.st.wasFlying = false; this.st.mist = [];
    for (const q of this.st.pigeons) { q.state = 'sit'; q.x = q.hx; q.y = q.hy; q.z = 0; }
    this.save(g).parked = null;
  },

  // ---------- helpers ----------
  heli() { return typeof AirfieldExt !== 'undefined' && AirfieldExt.rt ? AirfieldExt.rt.heli : null; },
  flying(g) { const h = this.heli(); return !!h && g.driving && g.vehicle === h; },
  inRect(R, x, y, m = 0) { return x > R.x0 - m && x < R.x1 + m && y > R.y0 - m && y < R.y1 + m; },
  // the roof whose rectangle (grown by m) holds the point; with two in reach, the nearer one
  roofAt(x, y, m = 0) {
    let best = null, bd = Infinity;
    for (const rf of CFG.ROOFTOPS.ROOFS) {
      if (!this.inRect(rf.rect, x, y, m)) continue;
      const R = rf.rect, d = Math.max(0, R.x0 - x, x - R.x1, R.y0 - y, y - R.y1);
      if (d < bd) { bd = d; best = rf; }
    }
    return best;
  },
  // The chef is above the roofs: walking on one, or flying the helicopter. The roofs stay on (upstairs.js asks this too).
  aboveRoofs(g) { return !!(this.st && this.st.roof) || this.flying(g); },
  // Inside the ice cream shop, or in its door gap: the roof is off.
  insideIce(g) {
    if (g.driving || this.aboveRoofs(g)) return false;
    const p = g.player, IC = CFG.ICE_CREAM, R = IC.rect;
    return this.inRect(R, p.x, p.y) || (Math.abs(p.x - IC.door.x) < IC.doorW / 2 + 10 && p.y >= R.y1 - 10 && p.y < R.y1 + 28);
  },
  roofAlpha(rf) {
    if (rf.key === 'icecream') return this.st ? this.st.iceA : 1;
    return typeof UpstairsExt !== 'undefined' && UpstairsExt.st ? UpstairsExt.st.roofA : 1;
  },
  // The four invisible walls round a roof's walkable area (thick bands outside it, their inner faces 12 px past the
  // walkable edge so the chef's 12 px body stays inside).
  walls(rf) {
    const W = rf.walk, T = CFG.ROOFTOPS.WALL, r = 12;
    const x = W.x0 - r - T, y = W.y0 - r - T, w = W.x1 - W.x0 + 2 * r + 2 * T, h = W.y1 - W.y0 + 2 * r;
    return [
      { x, y, w, h: T },                               // north
      { x, y: W.y1 + r, w, h: T },                     // south
      { x, y: W.y0 - r, w: T, h },                     // west
      { x: W.x1 + r, y: W.y0 - r, w: T, h },           // east
    ];
  },
  obstaclesOverride(g) {
    if (this.bypass || !this.st || g.area !== 'town') return null;
    const C = CFG.ROOFTOPS;
    if (this.st.roof) return this.walls(this.st.roof);                     // walking about on a roof: only its edges count
    if (!this.flying(g)) return null;
    const h = this.heli(), rf = this.roofAt(h.x, h.y, C.NEAR);
    if (!rf) return null;
    // hovering over a roof: Land may set the chef down on the roof (inside its walls) or on the ground past the wall
    // bands, never in the shop below; the ground keeps its real obstacles and the other shop is solid
    const o = this.walls(rf), R = rf.rect;
    this.bypass = true; let base = [];
    try { base = g.obstacles(); } finally { this.bypass = false; }
    for (const b of base) if (!(b.x < R.x1 + 12 && b.x + b.w > R.x0 - 12 && b.y < R.y1 + 12 && b.y + b.h > R.y0 - 12)) o.push(b);
    for (const other of C.ROOFS) if (other !== rf) o.push({ x: other.rect.x0 - 12, y: other.rect.y0 - 12, w: other.rect.x1 - other.rect.x0 + 24, h: other.rect.y1 - other.rect.y0 + 24 });
    return o;
  },

  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, C = CFG.ROOFTOPS, p = g.player, h = this.heli();
    if (st.pending) { st.pending = false; this.rescue(g); }   // once every extension has built (the helicopter exists now)
    if (g.area !== 'town') { if (st.roof) this.leaveRoof(g); st.wasFlying = false; return; }
    const flying = this.flying(g);
    // the chef just stepped out of the helicopter onto a roof
    if (st.wasFlying && !flying && !g.driving && h) { const rf = this.roofAt(h.x, h.y, C.NEAR); if (rf && this.inRect(rf.rect, p.x, p.y)) this.land(g, rf); }
    st.wasFlying = flying;
    if (st.roof) {
      if (flying) { if (!this.inRect(st.roof.rect, h.x, h.y, C.NEAR)) this.leaveRoof(g); }   // back in the air and away: off the roof
      else if (!h || g.driving || !this.inRect(st.roof.rect, h.x, h.y, C.NEAR) || !this.inRect(st.roof.rect, p.x, p.y)) this.leaveRoof(g);   // moved away some other way
      else {
        // on foot on the roof: the shop's pads, piles and tills are underneath, not here
        p.xferCd = Math.max(p.xferCd, 0.2);
        for (const pad of g.allPads()) g.padDwell[pad.key] = -1;
      }
    }
    // the ice cream roof fades off while the chef is in the shop
    const fade = CFG.UPSTAIRS && CFG.UPSTAIRS.ROOF ? CFG.UPSTAIRS.ROOF.fade : 0.35, target = this.insideIce(g) ? 0 : 1;
    if (target > st.iceA) st.iceA = Math.min(1, st.iceA + dt / fade);
    else if (target < st.iceA) st.iceA = Math.max(0, st.iceA - dt / fade);
    this.updateFun(g, dt);
  },
  updateFun(g, dt) {
    const st = this.st, C = CFG.ROOFTOPS, P = C.ICE, p = g.player;
    const onPizzeria = !!st.roof && st.roof.key === 'pizzeria' && !g.driving, onIce = !!st.roof && st.roof.key === 'icecream' && !g.driving;
    // the pigeons: sit and peck, flutter off when the chef comes close, come back a while later
    for (const q of st.pigeons) {
      q.t += dt;
      if (q.state === 'sit' || q.state === 'back') {
        if (onPizzeria && U.dist(p.x, p.y, q.x, q.y) < C.SCARE) {
          const a = Math.atan2(q.y - p.y, q.x - p.x) + U.rand(-0.5, 0.5);
          q.state = 'fly'; q.t = 0; q.vx = Math.cos(a) * 150; q.vy = Math.sin(a) * 150; q.facing = q.vx < 0 ? -1 : 1;
        }
      }
      if (q.state === 'fly') {
        q.x += q.vx * dt; q.y += q.vy * dt; q.z = Math.min(170, q.z + 110 * dt);
        if (q.t > 1.6) { q.state = 'away'; q.wait = U.rand(5, 9); }
      } else if (q.state === 'away') {
        q.wait -= dt;
        if (q.wait <= 0) { q.state = 'back'; q.x = q.hx + U.rand(-90, 90); q.y = q.hy - 30; q.z = 160; q.facing = q.x < q.hx ? 1 : -1; }
      } else if (q.state === 'back') {
        const arrived = U.moveToward(q, q.hx, q.hy, 110, dt);
        q.z = Math.max(0, q.z - 95 * dt);
        if (arrived && q.z <= 0) q.state = 'sit';
      }
    }
    // the frosty vent puffs while the chef stands by it
    st.mistT -= dt;
    if (onIce && U.dist(p.x, p.y, P.vent.x, P.vent.y) < P.vent.reach && st.mistT <= 0) {
      st.mistT = 0.1;
      st.mist.push({ x: P.vent.x + U.rand(-10, 10), y: P.vent.y - 4, t: 0, dur: U.rand(1.2, 1.8), dx: U.rand(-14, 14), r: U.rand(4, 8), flake: Math.random() < 0.35 });
    }
    for (const m of st.mist) { m.t += dt; m.y -= 26 * dt; m.x += m.dx * dt; }
    st.mist = st.mist.filter((m) => m.t < m.dur);
    // the weather vane: a touch sends it spinning, then it winds down
    const V = st.vane; V.cd -= dt;
    if (onIce && V.cd <= 0 && U.dist(p.x, p.y, P.vane.x, P.vane.y) < P.vane.reach) { V.v += 16; V.cd = 1.2; Sfx.ding(); Haptics.tap(); }
    V.a += V.v * dt; V.v *= Math.pow(0.3, dt);
    if (V.v < 0.02) V.v = 0;
  },
  land(g, rf) {
    const st = this.st, sv = this.save(g), p = g.player, h = this.heli();
    st.roof = rf; sv.parked = { key: rf.key, x: h.x, y: h.y, angle: h.angle };
    if (sv.seen[rf.key]) return;
    sv.seen[rf.key] = true;
    g.floats.push({ x: p.x, y: p.y - 64, text: 'Rooftop view! 🌆', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    for (let i = 0; i < 8; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-40, 40), y0: p.y - 20 + U.rand(-30, 30), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
    Sfx.ding(); Haptics.success();
    if (!sv.toasted) { sv.toasted = true; g.toast('🚁 You landed on the roof!', true); }
  },
  leaveRoof(g) { this.st.roof = null; this.save(g).parked = null; },
  // A reload with the chef on a roof (st.roof is not saved): if the helicopter is up there too, or it was parked there
  // when the game was saved, the chef is back on the roof with it; otherwise the core's own behaviour stands.
  rescue(g) {
    const h = this.heli(), p = g.player, sv = this.save(g);
    if (!h || g.area !== 'town' || g.driving) return;
    const rf = this.roofAt(p.x, p.y);
    if (!rf) { sv.parked = null; return; }
    const N = CFG.ROOFTOPS.NEAR;
    if (!this.inRect(rf.rect, h.x, h.y, N)) {
      if (!sv.parked || sv.parked.key !== rf.key || !this.inRect(rf.rect, sv.parked.x, sv.parked.y, N)) { sv.parked = null; return; }
      h.x = sv.parked.x; h.y = sv.parked.y; h.angle = sv.parked.angle || Math.PI; h.vx = 0; h.vy = 0; h.lift = 0;
    }
    this.st.roof = rf; sv.parked = { key: rf.key, x: h.x, y: h.y, angle: h.angle };
  },
  hint(g) {
    if (!this.st || !this.st.roof || g.area !== 'town' || g.driving) return undefined;
    const h = this.heli(), p = g.player;
    return { text: "You're on the roof! 🚁 Hop back in to fly", target: h && U.dist(p.x, p.y, h.x, h.y) > 60 ? h : null };
  },

  // ======================= render hooks =======================
  overlay(r, g) {
    if (!this.st || g.area !== 'town') return;
    const ctx = r.ctx, st = this.st, C = CFG.ROOFTOPS, h = this.heli(), flying = this.flying(g), t = g.time;
    const dusk = typeof AtmosphereExt !== 'undefined' && AtmosphereExt.state ? AtmosphereExt.state().dusk : 0;
    // ---- the ice cream roof
    if (st.iceA > 0) {
      const P = C.ICE, bg = this.iceCanvas(r);
      ctx.save(); ctx.globalAlpha = st.iceA;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bg.x0 + 8, bg.y0 + 10, bg.w, bg.h);
      ctx.drawImage(bg.canvas, bg.x0, bg.y0, bg.w, bg.h);
      // the skylight glows softly pink from the freezer lights below, more at dusk
      const S = P.skylight, pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      const glow = ctx.createRadialGradient(S.x, S.y, 8, S.x, S.y, 90);
      glow.addColorStop(0, `rgba(255,190,220,${(0.22 + 0.1 * pulse + 0.35 * dusk).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,190,220,0)');
      ctx.fillStyle = glow; ctx.fillRect(S.x - 90, S.y - 90, 180, 180);
      ctx.fillStyle = `rgba(255,240,250,${(0.1 + 0.12 * pulse + 0.3 * dusk).toFixed(3)})`; ctx.beginPath(); ctx.arc(S.x, S.y, S.r - 4, 0, Math.PI * 2); ctx.fill();
      // frosty mist from the vent
      for (const m of st.mist) {
        const k = m.t / m.dur, a = 0.6 * (1 - k);
        if (m.flake) { ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m.x - 4, m.y); ctx.lineTo(m.x + 4, m.y); ctx.moveTo(m.x, m.y - 4); ctx.lineTo(m.x, m.y + 4); ctx.stroke(); }
        else { ctx.fillStyle = `rgba(226,246,255,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + k * 10, 0, Math.PI * 2); ctx.fill(); }
      }
      // the cone weather vane, swinging in the breeze (and spinning when touched)
      this.drawVane(ctx, P.vane, st.vane.a - 0.5 + Math.sin(t * 0.6) * 0.35 + Math.sin(t * 1.9) * 0.1);
      if (dusk > 0 && CFG.ATMOSPHERE) { const A = CFG.ATMOSPHERE, c = A.DUSK_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DUSK_ALPHA * dusk).toFixed(3)})`; ctx.fillRect(bg.x0, bg.y0, bg.w, bg.h); }
      ctx.restore();
      // the helicopter flies above this roof too (the airfield drew it before the roof)
      if (flying && this.inRect(CFG.ICE_CREAM.rect, h.x, h.y, 80) && AirfieldExt.drawHeli) AirfieldExt.drawHeli(r, g);
    }
    // ---- the pizzeria roof's pigeons (on the roof, so only as visible as the roof)
    const pa = this.roofAlpha(C.ROOFS[0]);
    if (pa > 0) {
      ctx.save(); ctx.globalAlpha = pa;
      for (const q of st.pigeons) if (q.state !== 'away') this.drawPigeon(ctx, q, t);
      ctx.restore();
    }
    // ---- the parked helicopter on a roof, and the chef walking about up there: above the roof art
    const items = [];
    if (h && !flying) { const rf = this.roofAt(h.x, h.y, C.NEAR); if (rf && this.roofAlpha(rf) > 0) items.push({ y: h.y + 12, draw: () => (AirfieldExt.drawHeli ? AirfieldExt.drawHeli(r, g) : r.drawSiteVehicle(g, h, 18)) }); }
    if (st.roof && !g.driving && !g.onTrain) items.push({ y: g.player.y, draw: () => r.drawPlayer(g) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
    // ---- sparkles and floating words over a roof would be hidden under it: draw those again on top
    const inRoofs = (x, y) => C.ROOFS.some((rf) => this.roofAlpha(rf) >= 0.5 && this.inRect(rf.rect, x, y, 12));
    const fx = g.fx, fl = g.floats;
    try {
      g.fx = fx.filter((f) => f.kind === 'sparkle' && inRoofs(f.x0, f.y0)); if (g.fx.length) r.drawFx(g);
      g.floats = fl.filter((f) => inRoofs(f.x, f.y)); if (g.floats.length) r.drawFloats(g);
    } finally { g.fx = fx; g.floats = fl; }
  },
  drawVane(ctx, V, ang) {
    ctx.save(); ctx.translate(V.x, V.y); ctx.rotate(ang);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-26, -1.5, 52, 3);
    // the pointer: a little ice cream cone, tip forward
    ctx.fillStyle = '#e3a85e'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(10, -7); ctx.lineTo(10, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(24, 2); ctx.moveTo(14, 5); ctx.lineTo(24, -2); ctx.stroke();
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(8, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8f2c8'; ctx.beginPath(); ctx.arc(-3, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4322b'; ctx.beginPath(); ctx.arc(-11, 0, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, -7); ctx.lineTo(-18, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(V.x, V.y, 3.5, 0, Math.PI * 2); ctx.fill();
  },
  drawPigeon(ctx, q, t) {
    const f = q.facing, z = q.z || 0, flying = q.state === 'fly' || q.state === 'back', x = q.x, y = q.y - z;
    ctx.fillStyle = `rgba(0,0,0,${(0.18 * Math.max(0.15, 1 - z / 220)).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(q.x, q.y + 4, Math.max(4, 9 - z * 0.02), 3, 0, 0, Math.PI * 2); ctx.fill();
    const peck = flying ? 0 : Math.max(0, Math.sin(t * 3 + q.ph)) * 2.5;
    if (flying) {
      const flap = Math.sin(t * 26 + q.ph);
      ctx.fillStyle = '#7d8290';
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(x, y - 5); ctx.scale(s, 1); ctx.rotate(-flap * 0.7); ctx.beginPath(); ctx.ellipse(-10, 0, 11, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    }
    ctx.fillStyle = '#8b8f99'; ctx.beginPath(); ctx.ellipse(x, y - 4, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (!flying) { ctx.fillStyle = '#6f7380'; ctx.beginPath(); ctx.ellipse(x - f * 3, y - 5, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5a6fb0'; ctx.beginPath(); ctx.arc(x + f * 8, y - 9 + peck, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(x + f * 11, y - 9 + peck); ctx.lineTo(x + f * 15, y - 8 + peck); ctx.lineTo(x + f * 11, y - 7 + peck); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 9, y - 10 + peck, 0.9, 0, Math.PI * 2); ctx.fill();
    if (!flying) { ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 3, y + 1); ctx.lineTo(x - 3, y + 4); ctx.moveTo(x + 3, y + 1); ctx.lineTo(x + 3, y + 4); ctx.stroke(); }
  },
  // The still parts of the ice cream roof, painted once into an offscreen canvas.
  iceCanvas(r) {
    if (this.iceBg) return this.iceBg;
    const R = CFG.ICE_CREAM.rect, P = CFG.ROOFTOPS.ICE, res = 2;
    const x0 = R.x0 - P.pad, y0 = R.y0 - 4, w = R.x1 - R.x0 + 2 * P.pad, h = R.y1 - R.y0 + 4 + P.pad;
    const c = document.createElement('canvas'); c.width = Math.ceil(w * res); c.height = Math.ceil(h * res);
    const ctx = c.getContext('2d'); ctx.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    const main = r.ctx; r.ctx = ctx;
    this.paintIceRoof(r, x0, y0, w, h);
    r.ctx = main;
    this.iceBg = { canvas: c, x0, y0, w, h };
    return this.iceBg;
  },
  paintIceRoof(r, x0, y0, w, h) {
    const ctx = r.ctx, P = CFG.ROOFTOPS.ICE;
    let seed = 19770707;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    // mint roof membrane with pale seams and a few faint patches
    ctx.fillStyle = '#b4e6d0'; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; for (let y = y0 + 32; y < y0 + h; y += 32) ctx.fillRect(x0, y, w, 2.5);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (const [dx, dy, rx, ry] of [[0.3, 0.72, 50, 24], [0.75, 0.4, 40, 20], [0.55, 0.2, 30, 16]]) { ctx.beginPath(); ctx.ellipse(x0 + w * dx, y0 + h * dy, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill(); }
    // sprinkles everywhere
    const cols = ['#ff8fab', '#ffd166', '#9fd8f2', '#cdb4ff', '#ffffff', '#ff6b6b', '#ffb347'];
    for (let i = 0; i < 80; i++) {
      const x = x0 + 16 + rnd() * (w - 32), y = y0 + 16 + rnd() * (h - 32);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * Math.PI); ctx.fillStyle = cols[Math.floor(rnd() * cols.length)]; U.roundRect(ctx, -5, -1.6, 10, 3.2, 1.6); ctx.fill(); ctx.restore();
    }
    // parapet: a pink tiled ledge all round, lit from the top-left
    const pw = P.parapet;
    ctx.fillStyle = '#f2a4bd'; ctx.fillRect(x0, y0, w, pw); ctx.fillRect(x0, y0 + h - pw, w, pw); ctx.fillRect(x0, y0, pw, h); ctx.fillRect(x0 + w - pw, y0, pw, h);
    ctx.fillStyle = '#fbd3df'; ctx.fillRect(x0, y0, w, 3); ctx.fillRect(x0, y0, 3, h);
    ctx.fillStyle = '#c46f8e'; ctx.fillRect(x0 + pw, y0 + pw, w - 2 * pw, 3); ctx.fillRect(x0 + pw, y0 + pw, 3, h - 2 * pw);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x0, y0 + h - 3, w, 3); ctx.fillRect(x0 + w - 3, y0, 3, h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let x = x0 + 20; x < x0 + w - pw; x += 20) { ctx.fillRect(x, y0 + 1, 1.5, pw - 2); ctx.fillRect(x, y0 + h - pw + 1, 1.5, pw - 2); }
    for (let y = y0 + 20; y < y0 + h - pw; y += 20) { ctx.fillRect(x0 + 1, y, pw - 2, 1.5); ctx.fillRect(x0 + w - pw + 1, y, pw - 2, 1.5); }
    // the big painted ice cream cone, readable from the sky
    const c = P.cone;
    const cone = (ox, oy, shadow) => {
      ctx.fillStyle = shadow ? 'rgba(0,0,0,0.2)' : '#e3a85e';
      ctx.beginPath(); ctx.moveTo(c.x - 24 + ox, c.y + oy); ctx.lineTo(c.x + 24 + ox, c.y + oy); ctx.lineTo(c.x + ox, c.y + 58 + oy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shadow ? 'rgba(0,0,0,0.2)' : '#ff8fab'; ctx.beginPath(); ctx.arc(c.x + ox, c.y - 6 + oy, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shadow ? 'rgba(0,0,0,0.2)' : '#b8f2c8'; ctx.beginPath(); ctx.arc(c.x + ox, c.y - 42 + oy, 21, 0, Math.PI * 2); ctx.fill();
    };
    cone(4, 5, true); cone(0, 0, false);
    ctx.save(); ctx.beginPath(); ctx.moveTo(c.x - 24, c.y); ctx.lineTo(c.x + 24, c.y); ctx.lineTo(c.x, c.y + 58); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(c.x - 40 + k * 12, c.y - 10); ctx.lineTo(c.x + 20 + k * 12, c.y + 70); ctx.stroke(); ctx.beginPath(); ctx.moveTo(c.x + 40 - k * 12, c.y - 10); ctx.lineTo(c.x - 20 - k * 12, c.y + 70); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(c.x - 9, c.y - 14, 7, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(c.x - 7, c.y - 48, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.arc(c.x, c.y - 6, 26, 0.3, 1.6); ctx.lineTo(c.x, c.y - 6); ctx.closePath(); ctx.fill();
    for (const [sx, sy, col] of [[-14, -2, '#ffd166'], [10, -16, '#9fd8f2'], [4, 2, '#cdb4ff'], [-8, -36, '#ff6b6b'], [8, -44, '#ffd166']]) { ctx.save(); ctx.translate(c.x + sx, c.y + sy); ctx.rotate(sx * 0.3); ctx.fillStyle = col; U.roundRect(ctx, -4, -1.4, 8, 2.8, 1.4); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x + 4, c.y - 60); ctx.quadraticCurveTo(c.x + 10, c.y - 72, c.x + 16, c.y - 74); ctx.stroke();
    ctx.fillStyle = '#e4322b'; ctx.beginPath(); ctx.arc(c.x + 4, c.y - 60, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(c.x + 2, c.y - 62, 2, 0, Math.PI * 2); ctx.fill();
    // a round skylight (its glow is drawn each frame)
    const S = P.skylight;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(S.x + 4, S.y + 5, S.r + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(S.x, S.y, S.r + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(S.x, S.y, S.r + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9fd8f2'; ctx.beginPath(); ctx.arc(S.x, S.y, S.r - 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e424a'; ctx.fillRect(S.x - 1.5, S.y - S.r, 3, S.r * 2); ctx.fillRect(S.x - S.r, S.y - 1.5, S.r * 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(S.x - 7, S.y - 7, 6, 0, Math.PI * 2); ctx.fill();
    // the freezer vent: a grey box with a round grille, rimmed with frost
    const V = P.vent;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, V.x - 22, V.y - 20, 52, 52, 6); ctx.fill();
    ctx.fillStyle = '#b5bac1'; U.roundRect(ctx, V.x - 26, V.y - 26, 52, 52, 6); ctx.fill();
    ctx.fillStyle = '#d4d8dd'; U.roundRect(ctx, V.x - 26, V.y - 26, 52, 5, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = V.y + 12; y < V.y + 24; y += 5) ctx.fillRect(V.x - 20, y, 40, 2);
    ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(V.x, V.y - 2, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6069'; ctx.beginPath(); ctx.arc(V.x, V.y - 2, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8d9299'; ctx.lineWidth = 2; for (const rr of [6, 11]) { ctx.beginPath(); ctx.arc(V.x, V.y - 2, rr, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(V.x, V.y - 2, 18, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (const [dx, hh] of [[-14, 7], [-6, 11], [4, 8], [12, 6]]) { ctx.beginPath(); ctx.moveTo(V.x + dx - 2, V.y - 20); ctx.lineTo(V.x + dx + 2, V.y - 20); ctx.lineTo(V.x + dx, V.y - 20 + hh); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#8d9299'; ctx.fillRect(V.x - 36, V.y - 4, 10, 8);   // pipe to the wall
    // a roof hatch and two vent pipes
    const H = P.hatch;
    ctx.fillStyle = '#c46f8e'; U.roundRect(ctx, H.x - 20, H.y - 18, 40, 36, 4); ctx.fill(); ctx.fillStyle = '#f2a4bd'; U.roundRect(ctx, H.x - 16, H.y - 14, 32, 28, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(H.x + 8, H.y - 4, 5, 8);
    for (const [x, y] of P.pipes) { ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d9299'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    // weather vane base: a compass cross (the pointer turns each frame)
    const W = P.vane;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(W.x - 1.5, W.y - 24, 3, 48); ctx.fillRect(W.x - 24, W.y - 1.5, 48, 3);
    ctx.font = r.font(10); ctx.fillStyle = '#fff8ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', W.x, W.y - 30); ctx.fillText('S', W.x, W.y + 31); ctx.fillText('E', W.x + 31, W.y); ctx.fillText('W', W.x - 31, W.y);
  },
};

Game.ext.unshift(RooftopsExt);   // first in line: the roof-top hint beats the shop's own hints for the same spot below
Render.ext.push(RooftopsExt);    // last: the roof, the chef and the helicopter go over everything the other roofs drew
