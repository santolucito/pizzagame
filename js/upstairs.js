'use strict';
// The pizzeria's roof, seen from outside, and the second floor with the owner's bedroom.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// A. THE ROOF. Whenever the chef is outside the pizzeria the whole building is covered by its flat roof (tar paper,
//    parapet, AC units, skylight, chimney, water tank, the big painted sign, pigeons, a pizza weather vane), drawn in
//    the `overlay` hook so it hides everything inside, like every other building in town is seen from above. It
//    fades in/out over ~0.35 s as you walk through the door. The still parts are cached in one offscreen canvas;
//    the fans, smoke, pigeons, vane and skylight glow move each frame.
// B. UPSTAIRS. A staircase in the office corner leads to its own little map (`CFG.AREAS.upstairs`): the owner's
//    bedroom. Beside the bed you can take a nap: the chef hops in, the screen goes a soft night blue with drifting
//    z's and dream pizzas for a few seconds, then a rooster wakes you to a fresh morning (the day/night clock resets).
CFG.UPSTAIRS = {
  ROOF: {
    fade: 0.35, pad: 8,                                   // seconds to fade; how far the roof overhangs the walls
    skylight: { x0: 110, y0: 196, x1: 300, y1: 326 },     // over the kitchen
    chimney: { x: 540, y: 172 },
    tank: { x: 856, y: 236 },
    ac: [{ x: 430, y: 186 }, { x: 650, y: 566 }, { x: 180, y: 566 }],
    vane: { x: 724, y: 178 },
    dish: { x: 912, y: 560 },
    sign: { x: 540, y: 446, pizza: { x: 150, y: 446 } },
    pigeons: [{ x: 380, y: 300 }, { x: 760, y: 420 }],
  },
  // The office stairs: a flight along the bottom wall climbing east into the corner; stand at its foot to go up.
  STAIRS: { block: { x: 296, y: 596, w: 76, h: 44 }, landing: { x: 266, y: 620 }, reach: 36, sign: { x: 334, y: 578 } },
  WORLD: { x0: 6400, y0: 1500, x1: 7000, y1: 1900 },      // free space east of the cabin's map
  room: { x0: 6460, y0: 1560, x1: 6940, y1: 1840 }, wall: 26,
  bed: { x0: 6484, y0: 1572, x1: 6592, y1: 1710 },
  sleepSpot: { x: 6626, y: 1664 }, sleepReach: 40,       // stand here, beside the bed, to nap
  napSpot: { x: 6538, y: 1640 },                          // where the chef lies (feet); the head lands on the pillow
  table: { x0: 6604, y0: 1574, x1: 6640, y1: 1608 },      // bedside table: lamp and alarm clock
  photo: { x: 6668, y: 1546 },                            // framed photo on the wall: the chef and the dog
  wardrobe: { x0: 6688, y0: 1562, x1: 6768, y1: 1612 },
  hook: { x: 6796, y: 1548 },                             // the chef hat's hook on the wall
  window: { x0: 6822, y0: 1504, x1: 6922, y1: 1558 },     // looks out over Main Street
  desk: { x0: 6894, y0: 1634, x1: 6936, y1: 1724 }, chair: { x: 6872, y: 1680 },
  rug: { x: 6700, y: 1716, rx: 86, ry: 46 },
  shelf: { x0: 6464, y0: 1744, x1: 6502, y1: 1836 },
  plant: { x: 6536, y: 1822 },
  opening: { x0: 6866, y0: 1766, x1: 6936, y1: 1838 },    // the stair hole in the floor, railed on two sides
  top: { x: 6836, y: 1806 }, topReach: 34,                // the top of the stairs: arrive here, go down from here
  nap: { hop: 0.45, sleep: 3.0, wake: 0.5 },              // seconds
};
CFG.AREAS.upstairs = { WORLD: CFG.UPSTAIRS.WORLD };

const UpstairsExt = {
  name: 'upstairs',
  st: null, roofBg: null,

  // ---------- game hooks ----------
  defaults: { upstairs: { seen: false } },
  build(g) {
    if (!g.s.upstairs) g.s.upstairs = { seen: false };
    const R = CFG.UPSTAIRS.ROOF;
    this.st = {
      roofA: this.insideShop(g) ? 0 : 1, fade: 0, nap: null,
      smoke: [], smokeT: 1, puffing: 0, rest: 3,
      pigeons: R.pigeons.map((p, i) => ({ x: p.x, y: p.y, tx: p.x, ty: p.y, wait: 1 + i, facing: 1, step: 0 })),
    };
  },
  // Inside the pizzeria, or in the door gap: the roof is off.
  insideShop(g) {
    const p = g.player, B = CFG.BUILDING, D = CFG.DOOR;
    return g.insideBuilding(p.x, p.y) || (p.x > B.x1 - 30 && p.x < B.x1 + 30 && p.y > D.y0 - 8 && p.y < D.y1 + 8);
  },
  obstacles(g) {
    if (g.area === 'upstairs') return this.roomBlocks();
    if (g.area === 'town') return [CFG.UPSTAIRS.STAIRS.block];
    return [];
  },
  roomBlocks() {
    const C = CFG.UPSTAIRS, R = C.room, w = C.wall, o = [];
    const rect = (q) => ({ x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 });
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push(rect(C.bed), rect(C.table), rect(C.wardrobe), rect(C.desk), rect(C.shelf), rect(C.opening));
    o.push({ x: C.chair.x - 10, y: C.chair.y - 10, w: 20, h: 20 });
    o.push({ x: C.plant.x - 13, y: C.plant.y - 12, w: 26, h: 20 });
    return o;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, C = CFG.UPSTAIRS;
    st.fade = Math.max(0, st.fade - dt);
    if (g.area === 'upstairs') { this.updateRoom(g, dt); return; }
    if (g.area !== 'town') return;
    // the roof: fade toward "on" while the chef is outside the shop
    const target = this.insideShop(g) ? 0 : 1;
    if (target > st.roofA) st.roofA = Math.min(1, st.roofA + dt / C.ROOF.fade);
    else if (target < st.roofA) st.roofA = Math.max(0, st.roofA - dt / C.ROOF.fade);
    if (st.roofA <= 0) return;
    // the chimney puffs for a few seconds, then rests
    if (st.puffing > 0) {
      st.puffing -= dt; st.smokeT -= dt;
      if (st.smokeT <= 0) { st.smokeT = U.rand(0.35, 0.6); st.smoke.push({ x: C.ROOF.chimney.x + U.rand(-3, 3), y: C.ROOF.chimney.y - 6, t: 0, dur: U.rand(2, 2.8), dx: U.rand(4, 12), r: U.rand(4, 7) }); }
      if (st.puffing <= 0) st.rest = U.rand(5, 9);
    } else { st.rest -= dt; if (st.rest <= 0) st.puffing = U.rand(3, 5); }
    for (const s of st.smoke) { s.t += dt; s.y -= 16 * dt; s.x += s.dx * dt; }
    st.smoke = st.smoke.filter((s) => s.t < s.dur);
    // the pigeons wander about the roof and peck
    const B = CFG.BUILDING;
    for (const q of st.pigeons) {
      if (q.wait > 0) { q.wait -= dt; q.step += dt * 6; continue; }
      q.step += dt * 14;
      if (U.moveToward(q, q.tx, q.ty, 26, dt)) {
        q.wait = U.rand(1.5, 4);
        q.tx = U.rand(B.x0 + 60, B.x1 - 60); q.ty = U.rand(B.y0 + 60, B.y1 - 60);
        q.facing = q.tx < q.x ? -1 : 1;
      }
    }
  },
  action(g) {
    const p = g.player, C = CFG.UPSTAIRS;
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return null;
    if (g.area === 'town') {
      if (U.dist(p.x, p.y, C.STAIRS.landing.x, C.STAIRS.landing.y) < C.STAIRS.reach) return { label: '🪜 Go upstairs', run: (gg) => this.goUp(gg) };
      return null;
    }
    if (g.area !== 'upstairs') return null;
    if (this.st.nap) return null;                                         // fast asleep
    if (U.dist(p.x, p.y, C.top.x, C.top.y) < C.topReach) return { label: '🪜 Go downstairs', run: (gg) => this.goDown(gg) };
    if (U.dist(p.x, p.y, C.sleepSpot.x, C.sleepSpot.y) < C.sleepReach) return { label: '😴 Sleep', run: (gg) => this.startNap(gg) };
    return null;
  },
  hint(g) {
    const p = g.player, C = CFG.UPSTAIRS;
    if (g.area === 'upstairs') {
      if (this.st.nap) return null;
      if (U.dist(p.x, p.y, C.sleepSpot.x, C.sleepSpot.y) < C.sleepReach) return { text: 'Hop into bed for a nap 😴', target: null };
      return null;
    }
    if (g.area !== 'town' || g.driving || !g.insideBuilding(p.x, p.y)) return undefined;
    const L = C.STAIRS.landing, d = U.dist(p.x, p.y, L.x, L.y);
    if (d < 110) return { text: 'Go upstairs to your room! 🛏️', target: d < C.STAIRS.reach ? null : L };
    return undefined;
  },
  goUp(g) {
    const C = CFG.UPSTAIRS, p = g.player;
    g.area = 'upstairs'; p.x = C.top.x; p.y = C.top.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.ROOF.fade; this.st.nap = null; Sfx.ding(); Haptics.tap();
    if (!g.s.upstairs.seen) { g.s.upstairs.seen = true; g.toast('🛏️ Your very own room!', true); }
  },
  goDown(g) {
    const C = CFG.UPSTAIRS, p = g.player;
    g.area = 'town'; p.x = C.STAIRS.landing.x; p.y = C.STAIRS.landing.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.ROOF.fade; this.st.roofA = 0; Sfx.drop();
  },
  // Is this point somewhere the chef can stand: inside the room and not inside a wall or a piece of furniture?
  roomFree(x, y) {
    const R = CFG.UPSTAIRS.room, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.roomBlocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // A save (or a push) that left the chef outside the walls or inside furniture goes back to the top of the stairs.
  rescue(g) {
    const p = g.player, C = CFG.UPSTAIRS;
    if (this.roomFree(p.x, p.y)) return false;
    const B = C.bed;
    if (p.x > B.x0 && p.x < B.x1 && p.y > B.y0 && p.y < B.y1) { p.x = C.sleepSpot.x; p.y = C.sleepSpot.y; p.moving = false; return true; }   // a save made mid-nap: just get up
    p.x = C.top.x; p.y = C.top.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  // ---------- the nap ----------
  startNap(g) {
    const p = g.player;
    this.st.nap = { phase: 'hop', t: 0, from: { x: p.x, y: p.y } };
    p.moving = false; p.facing = 1; Sfx.ding(); Haptics.tap();
  },
  napAlpha() {
    const n = this.st && this.st.nap, N = CFG.UPSTAIRS.nap;
    if (!n || n.phase !== 'sleep') return 0;
    return U.clamp(Math.min(n.t / 0.5, (N.sleep - n.t) / 0.6), 0, 1);
  },
  updateRoom(g, dt) {
    const st = this.st, p = g.player, C = CFG.UPSTAIRS, N = C.nap, n = st.nap;
    if (!n) { this.rescue(g); return; }
    // asleep: the chef is frozen; the phases carry them into bed, through the night and back out
    n.t += dt; p.moving = false; p.facing = 1;
    const arc = (a, b, k) => { p.x = U.lerp(a.x, b.x, k); p.y = U.lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 26; };
    if (n.phase === 'hop') {
      const k = Math.min(1, n.t / N.hop); arc(n.from, C.napSpot, k);
      if (k >= 1) { n.phase = 'sleep'; n.t = 0; Sfx.drop(); }
    } else if (n.phase === 'sleep') {
      p.x = C.napSpot.x; p.y = C.napSpot.y;
      if (n.t >= N.sleep) {
        n.phase = 'wake'; n.t = 0;
        if (typeof AtmosphereExt !== 'undefined' && AtmosphereExt.force) AtmosphereExt.force({ phase: 'day' });
        g.s.stats.naps = (g.s.stats.naps || 0) + 1;
        g.floats.push({ x: p.x + 30, y: p.y - 70, text: '🐓 Good morning!', color: '#ffe08a', t: 0, dur: 1.8, big: true });
        g.floats.push({ x: p.x + 30, y: p.y - 40, text: '😊 Well rested!', color: '#ffe08a', t: 0.5, dur: 2.2, big: true });
        Sfx.ding(); Haptics.success();
      }
    } else {
      const k = Math.min(1, n.t / N.wake); arc(C.napSpot, C.sleepSpot, k);
      if (k >= 1) { st.nap = null; p.x = C.sleepSpot.x; p.y = C.sleepSpot.y; }
    }
  },

  // ======================= render hooks =======================
  // The roof, over everything inside the building (world space, after entities, effects and floats).
  overlay(r, g) {
    if (!this.st || g.area !== 'town' || this.st.roofA <= 0) return;
    const ctx = r.ctx, st = this.st, R = CFG.UPSTAIRS.ROOF, B = CFG.BUILDING, bg = this.roofCanvas(r), t = g.time;
    ctx.save();
    ctx.globalAlpha = st.roofA;
    // the building's shadow on the ground, then the still picture
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bg.x0 + 10, bg.y0 + 12, bg.w, bg.h);
    ctx.drawImage(bg.canvas, bg.x0, bg.y0, bg.w, bg.h);
    // skylight glow: warm from the ovens, brighter at dusk
    const dusk = typeof AtmosphereExt !== 'undefined' && AtmosphereExt.state ? AtmosphereExt.state().dusk : 0;
    const S = R.skylight, sx = (S.x0 + S.x1) / 2, sy = (S.y0 + S.y1) / 2, pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 150);
    glow.addColorStop(0, `rgba(255,214,120,${(0.22 + 0.1 * pulse + 0.35 * dusk).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = glow; ctx.fillRect(sx - 150, sy - 150, 300, 300);
    ctx.fillStyle = `rgba(255,236,170,${(0.12 + 0.12 * pulse + 0.3 * dusk).toFixed(3)})`; ctx.fillRect(S.x0 + 4, S.y0 + 4, S.x1 - S.x0 - 8, S.y1 - S.y0 - 8);
    // AC fans, slowly turning
    R.ac.forEach((a, i) => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(t * (2.2 + i * 0.5) + i);
      ctx.fillStyle = '#d7dbe0';
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(10, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    // chimney smoke
    for (const s of st.smoke) {
      const k = s.t / s.dur;
      ctx.fillStyle = `rgba(235,235,240,${(0.55 * (1 - k)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r + k * 12, 0, Math.PI * 2); ctx.fill();
    }
    // the pizza-slice weather vane, swinging in the breeze
    const V = R.vane, ang = -0.4 + Math.sin(t * 0.5) * 0.5 + Math.sin(t * 1.7) * 0.12;
    ctx.save(); ctx.translate(V.x, V.y); ctx.rotate(ang);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-26, -1.5, 52, 3);
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(8, -10); ctx.lineTo(8, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(8, 10); ctx.lineTo(3, 10); ctx.lineTo(3, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(16, -2, 2, 0, Math.PI * 2); ctx.arc(21, 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, -7); ctx.lineTo(-18, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(V.x, V.y, 3.5, 0, Math.PI * 2); ctx.fill();
    // pigeons
    for (const q of st.pigeons) this.drawPigeon(ctx, q);
    // the roof is outdoors: it takes the dusk tint the shop interiors are spared
    if (dusk > 0) { const A = CFG.ATMOSPHERE, c = A.DUSK_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DUSK_ALPHA * dusk).toFixed(3)})`; ctx.fillRect(bg.x0, bg.y0, bg.w, bg.h); }
    ctx.restore();
    // the chef walking along the south wall is in front of the building: draw them again, over the roof
    const p = g.player;
    if (!g.driving && !g.onTrain && !g.insideBuilding(p.x, p.y) && p.y > B.y1 - 4 && p.y < B.y1 + 72 && p.x > B.x0 - 40 && p.x < B.x1 + 40) r.drawPlayer(g);
  },
  drawPigeon(ctx, q) {
    const walking = q.wait <= 0, bob = walking ? Math.sin(q.step) * 1.2 : 0, peck = walking ? 0 : Math.max(0, Math.sin(q.step)) * 3, f = q.facing;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 4, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b8f99'; ctx.beginPath(); ctx.ellipse(q.x, q.y - 4 + bob, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6f7380'; ctx.beginPath(); ctx.ellipse(q.x - f * 3, q.y - 5 + bob, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();   // wing
    ctx.fillStyle = '#5a6fb0'; ctx.beginPath(); ctx.arc(q.x + f * 8, q.y - 9 + bob + peck, 4, 0, Math.PI * 2); ctx.fill();          // head
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(q.x + f * 11, q.y - 9 + bob + peck); ctx.lineTo(q.x + f * 15, q.y - 8 + bob + peck); ctx.lineTo(q.x + f * 11, q.y - 7 + bob + peck); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(q.x + f * 9, q.y - 10 + bob + peck, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x - 3, q.y + 1); ctx.lineTo(q.x - 3, q.y + 4); ctx.moveTo(q.x + 3, q.y + 1); ctx.lineTo(q.x + 3, q.y + 4); ctx.stroke();
  },
  // The still parts of the roof, painted once into an offscreen canvas.
  roofCanvas(r) {
    if (this.roofBg) return this.roofBg;
    const B = CFG.BUILDING, P = CFG.UPSTAIRS.ROOF, res = 2;
    const x0 = B.x0 - P.pad, y0 = B.y0 - 4, w = B.x1 - B.x0 + 2 * P.pad, h = B.y1 - B.y0 + 4 + P.pad;
    const c = document.createElement('canvas'); c.width = Math.ceil(w * res); c.height = Math.ceil(h * res);
    const ctx = c.getContext('2d'); ctx.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    const main = r.ctx; r.ctx = ctx;
    this.paintRoof(r, x0, y0, w, h);
    r.ctx = main;
    this.roofBg = { canvas: c, x0, y0, w, h };
    return this.roofBg;
  },
  paintRoof(r, x0, y0, w, h) {
    const ctx = r.ctx, P = CFG.UPSTAIRS.ROOF;
    let seed = 20240601;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    // tar paper: dark grey with seams, gravel speckles and a few darker patches of fresh tar
    ctx.fillStyle = '#5c6069'; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = y0 + 44; y < y0 + h; y += 44) ctx.fillRect(x0, y, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (const [dx, dy, rx, ry] of [[0.3, 0.72, 90, 40], [0.68, 0.28, 70, 34], [0.82, 0.78, 60, 30], [0.12, 0.3, 40, 26]]) { ctx.beginPath(); ctx.ellipse(x0 + w * dx, y0 + h * dy, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 900; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h; ctx.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.09)'; ctx.fillRect(x, y, 2, 2); }
    // parapet: a raised ledge all round, lit from the top-left
    const pw = 12;
    ctx.fillStyle = '#8d9299'; ctx.fillRect(x0, y0, w, pw); ctx.fillRect(x0, y0 + h - pw, w, pw); ctx.fillRect(x0, y0, pw, h); ctx.fillRect(x0 + w - pw, y0, pw, h);
    ctx.fillStyle = '#b0b5bc'; ctx.fillRect(x0, y0, w, 3); ctx.fillRect(x0, y0, 3, h);
    ctx.fillStyle = '#4a4e55'; ctx.fillRect(x0 + pw, y0 + pw, w - 2 * pw, 3); ctx.fillRect(x0 + pw, y0 + pw, 3, h - 2 * pw);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, y0 + h - 3, w, 3); ctx.fillRect(x0 + w - 3, y0, 3, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = x0 + 24; x < x0 + w - 12; x += 24) { ctx.fillRect(x, y0 + 1, 1.5, pw - 2); ctx.fillRect(x, y0 + h - pw + 1, 1.5, pw - 2); }
    for (let y = y0 + 24; y < y0 + h - 12; y += 24) { ctx.fillRect(x0 + 1, y, pw - 2, 1.5); ctx.fillRect(x0 + w - pw + 1, y, pw - 2, 1.5); }
    // the big painted sign, readable from above (and from the planes)
    const sg = P.sign;
    ctx.font = r.font(56); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillText('NAPLES STREET PIZZA', sg.x + 4, sg.y + 5);
    ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.strokeStyle = '#c0392b'; ctx.strokeText('NAPLES STREET PIZZA', sg.x, sg.y);
    ctx.fillStyle = '#fff8ee'; ctx.fillText('NAPLES STREET PIZZA', sg.x, sg.y);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(sg.pizza.x + 4, sg.pizza.y + 5, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(sg.pizza.x, sg.pizza.y, 46, 0, Math.PI * 2); ctx.fill();
    r.drawPizza(sg.pizza.x, sg.pizza.y, 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(sg.pizza.x - Math.cos(a) * 44, sg.pizza.y - Math.sin(a) * 44); ctx.lineTo(sg.pizza.x + Math.cos(a) * 44, sg.pizza.y + Math.sin(a) * 44); ctx.stroke(); }
    // skylight over the kitchen: a glass panel in a dark frame (its glow is drawn each frame)
    const S = P.skylight;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, S.x0 + 4, S.y0 + 6, S.x1 - S.x0, S.y1 - S.y0, 6); ctx.fill();
    ctx.fillStyle = '#3e424a'; U.roundRect(ctx, S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0, 6); ctx.fill();
    ctx.fillStyle = '#9fd8f2'; ctx.fillRect(S.x0 + 6, S.y0 + 6, S.x1 - S.x0 - 12, S.y1 - S.y0 - 12);
    ctx.fillStyle = '#3e424a'; ctx.fillRect((S.x0 + S.x1) / 2 - 2, S.y0, 4, S.y1 - S.y0); ctx.fillRect(S.x0, (S.y0 + S.y1) / 2 - 2, S.x1 - S.x0, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(S.x0 + 10, S.y0 + 30); ctx.lineTo(S.x0 + 40, S.y0 + 8); ctx.lineTo(S.x0 + 60, S.y0 + 8); ctx.lineTo(S.x0 + 10, S.y0 + 50); ctx.closePath(); ctx.fill();
    // chimney: brick, with a sooty mouth
    const ch = P.chimney;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(ch.x - 18, ch.y - 14, 44, 44);
    ctx.fillStyle = '#b5533c'; ctx.fillRect(ch.x - 22, ch.y - 22, 44, 44);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = ch.y - 22; y < ch.y + 22; y += 8) { ctx.fillRect(ch.x - 22, y, 44, 1.5); for (let x = ch.x - 22 + ((y / 8) % 2 ? 10 : 0); x < ch.x + 22; x += 20) ctx.fillRect(x, y, 1.5, 8); }
    ctx.fillStyle = '#6e7177'; ctx.fillRect(ch.x - 24, ch.y - 24, 48, 5); ctx.fillRect(ch.x - 24, ch.y - 24, 5, 48);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a4e55'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 8, 0, Math.PI * 2); ctx.fill();
    // water tank on a braced stand
    const T = P.tank;
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 5; ctx.strokeRect(T.x - 50, T.y - 50, 100, 100);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(T.x - 50, T.y - 50); ctx.lineTo(T.x + 50, T.y + 50); ctx.moveTo(T.x + 50, T.y - 50); ctx.lineTo(T.x - 50, T.y + 50); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(T.x + 5, T.y + 7, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(T.x, T.y, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(T.x + Math.cos(a) * 46, T.y + Math.sin(a) * 46); ctx.stroke(); }
    const cone = ctx.createRadialGradient(T.x - 10, T.y - 12, 4, T.x, T.y, 46); cone.addColorStop(0, 'rgba(255,230,190,0.45)'); cone.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.arc(T.x, T.y, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 3; for (const rr of [44, 30]) { ctx.beginPath(); ctx.arc(T.x, T.y, rr, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(T.x, T.y, 7, 0, Math.PI * 2); ctx.fill();
    // AC units: light grey boxes with a round fan grille on top (fans drawn each frame) and side vents
    for (const a of P.ac) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, a.x - 28, a.y - 26, 64, 64, 6); ctx.fill();
      ctx.fillStyle = '#b5bac1'; U.roundRect(ctx, a.x - 32, a.y - 32, 64, 64, 6); ctx.fill();
      ctx.fillStyle = '#d4d8dd'; U.roundRect(ctx, a.x - 32, a.y - 32, 64, 5, 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = a.y + 14; y < a.y + 30; y += 5) ctx.fillRect(a.x - 26, y, 52, 2);
      ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(a.x, a.y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c6069'; ctx.beginPath(); ctx.arc(a.x, a.y, 19, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8d9299'; ctx.lineWidth = 2; for (const rr of [8, 14]) { ctx.beginPath(); ctx.arc(a.x, a.y, rr, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#8d9299'; ctx.fillRect(a.x + 32, a.y - 4, 14, 8);                 // pipe to the wall
    }
    // vent pipes, a roof hatch and a satellite dish
    ctx.fillStyle = '#3e424a'; for (const [x, y] of [[360, 560], [600, 240], [880, 420]]) { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d9299'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3e424a'; }
    ctx.fillStyle = '#4a4e55'; U.roundRect(ctx, 300, 390, 44, 44, 4); ctx.fill(); ctx.fillStyle = '#6e7177'; U.roundRect(ctx, 304, 394, 36, 36, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(334, 408, 6, 8);
    const D = P.dish;
    ctx.fillStyle = '#3e424a'; ctx.fillRect(D.x - 3, D.y - 3, 6, 26);
    ctx.fillStyle = '#e6e9ec'; ctx.beginPath(); ctx.ellipse(D.x, D.y, 18, 12, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x, D.y); ctx.lineTo(D.x + 12, D.y - 10); ctx.stroke();
    // weather vane base: a compass cross (the arrow turns each frame)
    const V = P.vane;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(V.x - 1.5, V.y - 24, 3, 48); ctx.fillRect(V.x - 24, V.y - 1.5, 48, 3);
    ctx.font = r.font(10); ctx.fillStyle = '#fff8ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', V.x, V.y - 30); ctx.fillText('S', V.x, V.y + 31); ctx.fillText('E', V.x + 31, V.y); ctx.fillText('W', V.x - 31, V.y);
  },

  // ---------- the office stairs (static town art) ----------
  paintTown(r, g) {
    const ctx = r.ctx, S = CFG.UPSTAIRS.STAIRS, b = S.block, L = S.landing;
    // a mat at the foot of the stairs
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(L.x + 2, L.y + 4, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.ellipse(L.x, L.y, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(L.x, L.y, 18, 8, 0, 0, Math.PI * 2); ctx.stroke();
    // the flight: treads climbing east, each a little darker and narrower, into a dark opening at the top
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(b.x + 3, b.y + 3, b.w, b.h);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(b.x, b.y, b.w, b.h);
    const n = 7, tw = (b.w - 14) / n;
    for (let i = 0; i < n; i++) {
      const x = b.x + 2 + i * tw, k = i / (n - 1), inset = k * 5;
      ctx.fillStyle = `rgb(${Math.round(201 - 60 * k)},${Math.round(154 - 50 * k)},${Math.round(95 - 35 * k)})`;
      ctx.fillRect(x, b.y + 4 + inset, tw - 1.5, b.h - 8 - inset * 2);
      ctx.fillStyle = 'rgba(255,230,180,0.25)'; ctx.fillRect(x, b.y + 4 + inset, 1.5, b.h - 8 - inset * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + tw - 4.5, b.y + 4 + inset, 3, b.h - 8 - inset * 2);   // riser shadow
    }
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(b.x + b.w - 12, b.y + 2, 12, b.h - 4);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▲', b.x + b.w - 6, b.y + b.h / 2);
    // railing along the room side: posts and a hand rail
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(b.x, b.y - 2, b.w - 10, 4);
    ctx.fillStyle = '#5b3a1a'; for (let x = b.x + 2; x < b.x + b.w - 12; x += 12) ctx.fillRect(x, b.y - 10, 3, 12);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(b.x, b.y - 12, b.w - 10, 3);
    // "UPSTAIRS" sign on the railing
    const sg = S.sign;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, sg.x - 28, sg.y - 7, 60, 16, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, sg.x - 30, sg.y - 9, 60, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛏️ UPSTAIRS', sg.x, sg.y - 1);
  },

  // ---------- the bedroom (static) ----------
  paint: {
    upstairs(r, g) { UpstairsExt.paintRoom(r, g); },
  },
  // Little pizzas scattered over a red-and-cream check: the duvet print (also used for the chef's dream duvet).
  duvet(ctx, x0, y0, x1, y1, radius) {
    ctx.save(); U.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, radius); ctx.clip();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = '#fff3e0';
    for (let y = y0; y < y1; y += 16) for (let x = x0 + ((y - y0) / 16 % 2) * 16; x < x1; x += 32) ctx.fillRect(x, y, 16, 16);
    for (let y = y0 + 8; y < y1; y += 24) for (let x = x0 + 8 + ((y - y0) / 24 % 2) * 12; x < x1; x += 24) {
      ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1, 1, 0, Math.PI * 2); ctx.arc(x + 1.4, y + 1, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; U.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, radius); ctx.stroke();
  },
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.UPSTAIRS, W = C.WORLD, R = C.room, w = C.wall;
    // outside the walls: the dark of the attic
    ctx.fillStyle = '#1f1611'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // wooden floor, like the office below
    for (let y = R.y0; y < R.y1; y += 18) {
      const row = Math.floor((y - R.y0) / 18), hh = Math.min(18, R.y1 - y);
      ctx.fillStyle = row % 2 ? '#c99a5f' : '#c4935a'; ctx.fillRect(R.x0, y, R.x1 - R.x0, hh);
      ctx.strokeStyle = 'rgba(80,40,10,0.18)'; ctx.beginPath(); ctx.moveTo(R.x0, y + 0.5); ctx.lineTo(R.x1, y + 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(80,40,10,0.12)';
      for (let x = R.x0 + (row % 2) * 60; x < R.x1; x += 120) { ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + hh); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,230,180,0.18)'; ctx.beginPath(); ctx.moveTo(R.x0, y + 6.5); ctx.lineTo(R.x1, y + 6.5); ctx.stroke();
    }
    const v = ctx.createRadialGradient((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 120, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 360);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,30,10,0.18)');
    ctx.fillStyle = v; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    // the rug (under everything else)
    const G = C.rug;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(G.x + 3, G.y + 4, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    for (const [k, col] of [[1, '#b23a48'], [0.78, '#f2e0bf'], [0.56, '#3b7dd8'], [0.34, '#f2e0bf'], [0.14, '#e4572e']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx * k, G.ry * k, 0, 0, Math.PI * 2); ctx.fill(); }
    // walls: the pizzeria's warm brown, with a cream wallpaper band on the top wall
    const wall = (x, y, ww, hh) => { ctx.fillStyle = '#7a5235'; ctx.fillRect(x, y, ww, hh); };
    wall(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, w); wall(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    wall(R.x0 - w, R.y0, w, R.y1 - R.y0); wall(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#f2e0bf'; ctx.fillRect(R.x0, R.y0 - w + 6, R.x1 - R.x0, w - 10);
    ctx.fillStyle = 'rgba(228,87,46,0.25)'; for (let x = R.x0 + 8; x < R.x1; x += 24) ctx.fillRect(x, R.y0 - w + 6, 6, w - 10);
    ctx.fillStyle = '#9c6b45'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, 4);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0, R.y0 - 4, R.x1 - R.x0, 4); ctx.fillRect(R.x0, R.y1, R.x1 - R.x0, 3);   // skirting
    const sh = ctx.createLinearGradient(0, R.y0, 0, R.y0 + 16); sh.addColorStop(0, 'rgba(0,0,0,0.2)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 16);
    // the window over Main Street: sky, the park trees, the road with a little car, a lamp post
    const N = C.window;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, N.x0 - 5, N.y0 - 5, N.x1 - N.x0 + 10, N.y1 - N.y0 + 10, 5); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0); ctx.clip();
    const sky = ctx.createLinearGradient(0, N.y0, 0, N.y1); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(1, '#d9f0ff');
    ctx.fillStyle = sky; ctx.fillRect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(N.x1 - 16, N.y0 + 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(N.x0 + 22, N.y0 + 12, 5, 0, Math.PI * 2); ctx.arc(N.x0 + 29, N.y0 + 10, 6, 0, Math.PI * 2); ctx.arc(N.x0 + 36, N.y0 + 13, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7cc45f'; ctx.fillRect(N.x0, N.y0 + 24, N.x1 - N.x0, 12);
    for (const [dx, s] of [[10, 1], [26, 0.8], [44, 1.1], [86, 0.9]]) { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(N.x0 + dx - 1.5, N.y0 + 22, 3, 8); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(N.x0 + dx, N.y0 + 20, 6 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(N.x0 + dx - 2, N.y0 + 17, 3 * s, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5c6069'; ctx.fillRect(N.x0, N.y0 + 36, N.x1 - N.x0, 18);
    ctx.fillStyle = '#ffe08a'; for (let x = N.x0 + 4; x < N.x1; x += 14) ctx.fillRect(x, N.y0 + 44, 7, 2);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, N.x0 + 56, N.y0 + 39, 22, 10, 3); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(N.x0 + 60, N.y0 + 40, 10, 4);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(N.x0 + 61, N.y0 + 49, 2.5, 0, Math.PI * 2); ctx.arc(N.x0 + 73, N.y0 + 49, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e424a'; ctx.fillRect(N.x0 + 68, N.y0 + 20, 2, 16); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(N.x0 + 69, N.y0 + 19, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect((N.x0 + N.x1) / 2 - 2, N.y0, 4, N.y1 - N.y0); ctx.fillRect(N.x0, (N.y0 + N.y1) / 2 - 2, N.x1 - N.x0, 4);
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 4; ctx.strokeRect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(N.x0 - 14, N.y0 - 6, 12, N.y1 - N.y0 + 12); ctx.fillRect(N.x1 + 2, N.y0 - 6, 12, N.y1 - N.y0 + 12);   // curtains
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (const x of [N.x0 - 11, N.x0 - 6, N.x1 + 5, N.x1 + 10]) ctx.fillRect(x, N.y0 - 6, 1.5, N.y1 - N.y0 + 12);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(N.x0 - 16, N.y1 + 6, N.x1 - N.x0 + 32, 5);   // sill
    // framed photo of the chef and the dog
    const ph = C.photo;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, ph.x - 15, ph.y - 12, 30, 24, 3); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(ph.x - 12, ph.y - 9, 24, 18);
    ctx.fillStyle = '#9fd8f2'; ctx.fillRect(ph.x - 11, ph.y - 8, 22, 10); ctx.fillStyle = '#7cc45f'; ctx.fillRect(ph.x - 11, ph.y + 2, 22, 6);
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(ph.x - 4, ph.y - 1, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ph.x - 4, ph.y - 4.5, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(ph.x - 6, ph.y + 1, 4, 5);
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(ph.x + 5, ph.y + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(ph.x + 8, ph.y + 1, 2.2, 0, Math.PI * 2); ctx.fill();
    // the chef hat on its hook
    const hk = C.hook;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hk.x, hk.y - 10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    U.roundRect(ctx, hk.x - 9, hk.y - 2, 18, 10, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(hk.x - 5, hk.y - 5, 6, 0, Math.PI * 2); ctx.arc(hk.x + 5, hk.y - 5, 6, 0, Math.PI * 2); ctx.fill();
    // the big bed: headboard and posts, mattress, two pillows and the pizza-print duvet
    const B = C.bed;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, B.x0 + 4, B.y0 + 6, B.x1 - B.x0, B.y1 - B.y0, 6); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0 - 4, B.y0 - 10, B.x1 - B.x0 + 8, 22, 5); ctx.fill();
    ctx.fillStyle = '#a5693a'; U.roundRect(ctx, B.x0 - 1, B.y0 - 7, B.x1 - B.x0 + 2, 14, 4); ctx.fill();
    for (const x of [B.x0 - 2, B.x1 + 2]) { ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(x, B.y0 - 8, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, B.y1 - 4, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, B.x0 - 3, B.y0 + 4, B.x1 - B.x0 + 6, B.y1 - B.y0 - 4, 6); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x0, B.y0 + 6, B.x1 - B.x0, B.y1 - B.y0 - 8, 5); ctx.fill();
    for (const x of [B.x0 + 28, B.x1 - 28]) { ctx.fillStyle = 'rgba(0,0,0,0.1)'; U.roundRect(ctx, x - 22, B.y0 + 14, 46, 24, 8); ctx.fill(); ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 23, B.y0 + 11, 46, 24, 8); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1.5; U.roundRect(ctx, x - 23, B.y0 + 11, 46, 24, 8); ctx.stroke(); }
    this.duvet(ctx, B.x0 + 3, B.y0 + 48, B.x1 - 3, B.y1 - 6, 8);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x0 + 3, B.y0 + 48, B.x1 - B.x0 - 6, 12, 4); ctx.fill();   // folded sheet
    // bedside table with a lamp and the alarm clock
    const T = C.table, tx = (T.x0 + T.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, T.x0 + 3, T.y0 + 4, T.x1 - T.x0, T.y1 - T.y0, 4); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 4); ctx.fill();
    ctx.fillStyle = '#9b6531'; U.roundRect(ctx, T.x0 + 2, T.y0 + 2, T.x1 - T.x0 - 4, T.y1 - T.y0 - 6, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(tx - 8, T.y0 + 12, 9, 0, Math.PI * 2); ctx.fill();       // lamp shade (seen from above)
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(tx - 8, T.y0 + 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(tx + 9, T.y0 + 20, 6.5, 0, Math.PI * 2); ctx.fill();     // alarm clock
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tx + 9, T.y0 + 20, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx + 9, T.y0 + 20); ctx.lineTo(tx + 9, T.y0 + 17); ctx.moveTo(tx + 9, T.y0 + 20); ctx.lineTo(tx + 11.5, T.y0 + 21); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(tx + 5, T.y0 + 14.5, 1.8, 0, Math.PI * 2); ctx.arc(tx + 13, T.y0 + 14.5, 1.8, 0, Math.PI * 2); ctx.fill();
    // wardrobe with two doors
    const Wd = C.wardrobe;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, Wd.x0 + 4, Wd.y0 + 5, Wd.x1 - Wd.x0, Wd.y1 - Wd.y0, 4); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Wd.x0, Wd.y0, Wd.x1 - Wd.x0, Wd.y1 - Wd.y0, 4); ctx.fill();
    ctx.fillStyle = '#9b6531'; ctx.fillRect(Wd.x0 + 4, Wd.y0 + 4, (Wd.x1 - Wd.x0) / 2 - 6, Wd.y1 - Wd.y0 - 8); ctx.fillRect((Wd.x0 + Wd.x1) / 2 + 2, Wd.y0 + 4, (Wd.x1 - Wd.x0) / 2 - 6, Wd.y1 - Wd.y0 - 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; ctx.strokeRect(Wd.x0 + 9, Wd.y0 + 9, (Wd.x1 - Wd.x0) / 2 - 16, Wd.y1 - Wd.y0 - 18); ctx.strokeRect((Wd.x0 + Wd.x1) / 2 + 7, Wd.y0 + 9, (Wd.x1 - Wd.x0) / 2 - 16, Wd.y1 - Wd.y0 - 18);
    ctx.fillStyle = '#ffe08a'; for (const x of [(Wd.x0 + Wd.x1) / 2 - 6, (Wd.x0 + Wd.x1) / 2 + 6]) { ctx.beginPath(); ctx.arc(x, (Wd.y0 + Wd.y1) / 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
    // desk with the shop's ledger and a mug, and a chair
    const D = C.desk, ch = C.chair;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, D.x0 + 3, D.y0 + 4, D.x1 - D.x0, D.y1 - D.y0, 5); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, 5); ctx.fill();
    ctx.fillStyle = '#9b6531'; U.roundRect(ctx, D.x0 + 2, D.y0 + 2, D.x1 - D.x0 - 4, D.y1 - D.y0 - 6, 4); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, D.x0 + 7, D.y0 + 14, 28, 36, 2); ctx.fill();                      // the ledger
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(D.x0 + 9, D.y0 + 16, 12, 32); ctx.fillRect(D.x0 + 22, D.y0 + 16, 11, 32);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = D.y0 + 20; y < D.y0 + 46; y += 5) { ctx.fillRect(D.x0 + 11, y, 8, 1); ctx.fillRect(D.x0 + 24, y, 7, 1); }
    ctx.fillStyle = '#2f9e44'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', D.x0 + 27, D.y0 + 44);
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(D.x0 + 22, D.y0 + 68, 7, 0, Math.PI * 2); ctx.fill();   // mug
    ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.arc(D.x0 + 22, D.y0 + 68, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(D.x0 + 31, D.y0 + 68, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#f2b134'; ctx.fillRect(D.x0 + 8, D.y0 + 60, 3, 18); ctx.fillStyle = '#e4572e'; ctx.fillRect(D.x0 + 8, D.y0 + 58, 3, 3);   // pencil
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(ch.x + 2, ch.y + 3, 11, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, ch.x - 11, ch.y - 4, 4, 10, 2); ctx.fill();   // chair back (facing the desk)
    // bookshelf against the west wall, full of bright books
    const Sh = C.shelf;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, Sh.x0 + 3, Sh.y0 + 4, Sh.x1 - Sh.x0, Sh.y1 - Sh.y0, 3); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Sh.x0, Sh.y0, Sh.x1 - Sh.x0, Sh.y1 - Sh.y0, 3); ctx.fill();
    const cols = ['#e4572e', '#3b7dd8', '#2f9e44', '#f2b134', '#b23a48', '#9c6bd8', '#4aa3d8'];
    let by = Sh.y0 + 4, i = 0;
    while (by < Sh.y1 - 6) { const bh = 5 + (i * 7) % 5; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(Sh.x0 + 4 + (i % 3) * 2, by, Sh.x1 - Sh.x0 - 8 - (i % 3) * 2, bh); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(Sh.x0 + 8, by + 1.5, 6, 1.5); by += bh + 2; i++; }
    // potted plant
    const P = C.plant;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 6, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c2e'; U.roundRect(ctx, P.x - 10, P.y - 6, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#e07a4a'; ctx.fillRect(P.x - 12, P.y - 8, 24, 4);
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[-8, -14, 7], [8, -14, 7], [0, -20, 8], [-4, -9, 6], [5, -8, 6]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 2, P.y - 20, 4, 0, Math.PI * 2); ctx.fill();
    // the stair opening: a dark hole with the top steps showing, railed on the room sides
    const O = C.opening;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(O.x0, O.y0, O.x1 - O.x0, O.y1 - O.y0);
    for (let k = 0; k < 4; k++) { const x = O.x0 + 6 + k * 12, kk = 1 - k / 4; ctx.fillStyle = `rgba(201,154,95,${(0.9 * kk).toFixed(2)})`; ctx.fillRect(x, O.y0 + 6, 10, O.y1 - O.y0 - 12); }
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▼', O.x1 - 12, (O.y0 + O.y1) / 2);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(O.x0 - 4, O.y0 - 4, O.x1 - O.x0 + 4, 4); ctx.fillRect(O.x0 - 4, O.y0 - 4, 4, O.y1 - O.y0 + 4);
    ctx.fillStyle = '#5b3a1a'; for (let x = O.x0 - 2; x < O.x1; x += 12) ctx.fillRect(x, O.y0 - 14, 3, 12);
    for (let y = O.y0 + 6; y < O.y1; y += 12) ctx.fillRect(O.x0 - 12, y, 12, 3);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(O.x0 - 16, O.y0 - 16, O.x1 - O.x0 + 16, 4); ctx.fillRect(O.x0 - 16, O.y0 - 16, 4, O.y1 - O.y0 + 16);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, O.x0 - 36, O.y0 - 36, 64, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 DOWNSTAIRS', O.x0 - 4, O.y0 - 28);
  },

  // ---------- the chef tucked in (drawn with the people so the duvet covers the sprite) ----------
  entities(r, g, items) {
    if (!this.st || g.area !== 'upstairs' || !this.st.nap || this.st.nap.phase !== 'sleep') return;
    const C = CFG.UPSTAIRS, B = C.bed, p = g.player;
    items.push({ y: B.y1 + 2, draw: () => {
      const ctx = r.ctx, x = p.x, y = p.y, t = g.time;
      // the duvet pulled up to the chin, rising and falling with each breath
      const br = Math.sin(t * 2.4) * 1.2;
      this.duvet(ctx, B.x0 + 3, y - 26 - br, B.x1 - 3, B.y1 - 6, 8);
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x0 + 3, y - 26 - br, B.x1 - B.x0 - 6, 11, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.ellipse(x, y - 8, 16, 14, 0, 0, Math.PI * 2); ctx.fill();   // the lump of the chef
      // closed eyes over the open ones, and a sleepy smile
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y - 38, 2.6, 0, Math.PI * 2); ctx.arc(x + 6, y - 38, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 39, 2.4, Math.PI * 0.15, Math.PI * 0.85); ctx.arc(x + 6, y - 39, 2.4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      // a nightcap over the chef hat
      ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(x - 13, y - 44); ctx.lineTo(x + 13, y - 44); ctx.quadraticCurveTo(x + 14, y - 60, x + 24, y - 66); ctx.quadraticCurveTo(x + 2, y - 62, x - 13, y - 44); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 14, y - 47, 28, 6, 3); ctx.fill(); ctx.beginPath(); ctx.arc(x + 24, y - 66, 4, 0, Math.PI * 2); ctx.fill();
      // the chef hat hangs on the bedpost
      const hx = B.x1 + 2, hy = B.y0 - 6;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
      U.roundRect(ctx, hx - 8, hy - 2, 16, 9, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx - 4, hy - 5, 5.5, 0, Math.PI * 2); ctx.arc(hx + 4, hy - 5, 5.5, 0, Math.PI * 2); ctx.fill();
      // little z's above the pillow
      ctx.fillStyle = '#fff8ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.font = r.font(9 + k * 3); ctx.fillText('z', x + 18 + ph * 14 + k * 4, y - 56 - ph * 26 - k * 4); }
      ctx.globalAlpha = 1;
    } });
  },

  // ---------- screen space: the area fade and the night of the nap ----------
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    const a = this.napAlpha();
    if (a > 0 && g.area === 'upstairs') this.drawNight(r, g, W, H, a);
    if (this.st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / CFG.UPSTAIRS.ROOF.fade).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
  drawNight(r, g, W, H, a) {
    const ctx = r.ctx, t = this.st.nap.t;
    ctx.save();
    ctx.globalAlpha = a;
    const grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(16,24,66,0.9)'); grd.addColorStop(1, 'rgba(34,44,96,0.9)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    // a crescent moon and a few twinkling stars
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.2, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(16,24,66,0.95)'; ctx.beginPath(); ctx.arc(W * 0.82 - 12, H * 0.2 - 6, 24, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 18; i++) { const sx = ((i * 157) % 100) / 100 * W, sy = ((i * 83) % 100) / 100 * H * 0.7, tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,255,255,${(0.35 + 0.55 * tw).toFixed(2)})`; ctx.beginPath(); ctx.arc(sx, sy, 1.2 + tw * 1.4, 0, Math.PI * 2); ctx.fill(); }
    // drifting z's
    ctx.fillStyle = '#dfe8ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < 6; k++) {
      const ph = (t * 0.35 + k / 6) % 1, size = 22 + k * 6;
      ctx.globalAlpha = a * Math.sin(ph * Math.PI);
      ctx.font = r.font(size);
      ctx.fillText('z', W * (0.3 + 0.08 * k) + Math.sin(t * 1.5 + k) * 18, H * 0.75 - ph * H * 0.55);
    }
    // dream pizzas floating by in little clouds
    for (let i = 0; i < 4; i++) {
      const x = ((t * 55 + i * (W + 120) / 4) % (W + 120)) - 60, y = H * (0.22 + 0.17 * i) + Math.sin(t * 1.6 + i * 2) * 14;
      ctx.globalAlpha = a * 0.95;
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(x - 20, y + 6, 18, 0, Math.PI * 2); ctx.arc(x, y - 4, 24, 0, Math.PI * 2); ctx.arc(x + 22, y + 6, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
      r.drawPizza(x, y, 18);
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(Math.min(30, W / 14)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('😴 Sweet dreams…', W / 2, H * 0.85);
    ctx.restore();
  },
};
Game.ext.push(UpstairsExt);
Render.ext.push(UpstairsExt);
