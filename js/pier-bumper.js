'use strict';
// Pizza Pier: the BUMPER CARS (plot CFG.PIER.PLOTS.bumper, north of the boardwalk between the terminal and the midway).
// A covered pavilion: a striped roof along the back over a big "🚗 BUMPER CARS" sign, a light canopy frame with a
// ceiling grid, a shiny metal floor ringed by a fat rubber rail, and a little gate in the front rail on the boardwalk
// side. Four park visitors drive round bumper cars about, bumping gently and laughing; each car's pole runs up to the
// ceiling grid and sparks.
//   - At the gate: '🚗 Drive a bumper car' puts the chef in the free car parked just inside it (vehicle kind
//     'bumpercar'). The normal joystick drives it; it never leaves the floor: this file keeps every car inside the rail
//     itself (the core moves the chef's car, then `update` bounces it off the rail and off the other cars).
//   - Bumping a car or the rail: both bounce apart, "BONK! 💥", a little spark and a boing. The visitors bump into the
//     chef too now and then, gently.
//   - '🚶 Hop out' (the vehicle button) works anywhere: the chef steps out at the gate and the car glides back to its spot.
// Everything here is runtime-only (nothing saved). Extension module: Game.ext.unshift + Render.ext.push.
CFG.PIER_BUMPER = {
  BLOCK: { x0: 8476, y0: 5562, x1: 8944, y1: 5846 },   // solid on foot: the back wall, the floor and its rail
  RAIL: { x0: 8480, y0: 5640, x1: 8940, y1: 5842 },    // the rubber rail's outer edge
  FLOOR: { x0: 8494, y0: 5654, x1: 8926, y1: 5828 },   // the metal floor inside the rail: the cars stay on it
  WALL: { x0: 8480, y0: 5570, x1: 8940, y1: 5640 },    // the back wall under the striped roof edge
  CEIL: 70,                                            // the ceiling grid's height over the floor (screen px)
  GATE: { x: 8710, y: 5868, half: 26 },                // the mat outside the gate in the front rail (boardwalk side)
  HOME: { x: 8710, y: 5798, angle: -Math.PI / 2 },     // the free car's spot just inside the gate, nose into the arena
  R: 21,                                               // a car's radius (the rubber ring)
  NEAR: 70,
  AI_SPEED: 115, CHASE_SPEED: 100, GLIDE: 140,
  COLORS: ['#ff8a1f', '#e8384f', '#2f80ed', '#27ae60', '#c86bfa'],   // the free car first
  STARTS: [[8570, 5700], [8680, 5694], [8820, 5712], [8880, 5790]],
  ONLOOKER: { x: 8556, y: 5870 },
};
CFG.VEHICLES.bumpercar = { speed: 190, radius: 21, label: '🚗 Drive a bumper car', exit: '🚶 Hop out' };

const PierBumperExt = {
  name: 'pierbumper',
  st: null,

  build(g) {
    const B = CFG.PIER_BUMPER, H = B.HOME;
    const looks = [
      { shirt: '#ffd23f', skin: '#f1c27d', hair: '#5a3a1a', hairStyle: 2 },
      { shirt: '#ff7eb6', skin: '#8d5524', hair: '#1a1a1a', hairStyle: 1 },
      { shirt: '#5ad1e6', skin: '#e0ac69', hair: '#d9a066', hairStyle: 0 },
      { shirt: '#9be564', skin: '#c68642', hair: '#2b1d14', hairStyle: 3 },
    ];
    const free = { kind: 'bumpercar', x: H.x, y: H.y, angle: H.angle, vx: 0, vy: 0, col: B.COLORS[0], wob: 0, zap: 0, laugh: 0, ai: null };
    const cars = [free];
    B.STARTS.forEach(([x, y], i) => cars.push({ kind: 'bumpercar', x, y, angle: i * 1.7, vx: 0, vy: 0, col: B.COLORS[i + 1], look: looks[i], wob: 0, zap: 0, laugh: 0, ai: { tx: x, ty: y, t: 0, chase: 0, slow: 0 } }));
    this.st = { cars, free, rode: false, bonkCd: 0, laughCd: 0, chaseT: 4, sparks: [], cheer: 0, bonks: { car: 0, rail: 0, ai: 0 } };
  },
  ensure(g) { if (!this.st) this.build(g); return this.st; },
  riding(g) { return !!(this.st && g.driving && g.vehicle === this.st.free); },
  // the chef is busy with something else: a ride between maps, a train, a City taxi or tower floor, another vehicle
  busy(g) {
    if (g.travel || g.onTrain || g.ride || g.fishing) return true;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return true;
    if (g.driving && !this.riding(g)) return true;
    return false;
  },
  here(g) { return g.area === 'pizzapier'; },
  nearGate(g) { const G = CFG.PIER_BUMPER.GATE; return U.dist(g.player.x, g.player.y, G.x, G.y) < CFG.PIER_BUMPER.NEAR; },
  inBlock(x, y, r) { const K = CFG.PIER_BUMPER.BLOCK; return x + r > K.x0 && x - r < K.x1 && y + r > K.y0 && y - r < K.y1; },

  // ---------- hooks ----------
  // On foot the whole pavilion is solid (you drive in, you do not walk in). The chef's own bumper car is kept on the
  // floor by `update`, so it sees nothing here; any other vehicle sees the pavilion as solid.
  obstacles(g, forCar) {
    if (!this.here(g)) return [];
    if (forCar && this.riding(g)) return [];
    const K = CFG.PIER_BUMPER.BLOCK;
    return [{ x: K.x0, y: K.y0, w: K.x1 - K.x0, h: K.y1 - K.y0 }];
  },

  action(g) {
    if (!this.here(g) || this.busy(g) || g.driving) return null;
    if (!this.nearGate(g)) return null;
    return { label: '🚗 Drive a bumper car', run: (gg) => this.getIn(gg) };
  },
  hint(g) {
    if (!this.here(g) || this.busy(g)) return undefined;
    if (this.riding(g)) return { text: 'Bump the other cars! 💥', target: null };
    if (g.driving) return undefined;
    if (this.nearGate(g)) return { text: 'Drive the bumper cars! 🚗💥', target: CFG.PIER_BUMPER.GATE };
    return undefined;
  },

  getIn(g) {
    const st = this.ensure(g), c = st.free, H = CFG.PIER_BUMPER.HOME, p = g.player;
    if (U.dist(c.x, c.y, H.x, H.y) > 2) { c.x = H.x; c.y = H.y; c.angle = H.angle; }   // still gliding home: it is there at once
    c.vx = 0; c.vy = 0; c.glide = false;
    g.vehicle = c; g.driving = true; st.rode = true;
    p.x = c.x; p.y = c.y; p.moving = false; p.hasMoved = true;
    Sfx.pickup(); Haptics.tap();
  },
  // the core has just let the chef out of the car (the vehicle button): onto the gate mat; the car glides home
  afterHopOut(g) {
    const st = this.st, c = st.free, p = g.player, G = CFG.PIER_BUMPER.GATE;
    c.glide = true;
    if (U.dist(p.x, p.y, c.x, c.y) > 70) return;   // moved somewhere else entirely (a test teleport, Take-me-home)
    p.x = G.x; p.y = G.y; p.moving = false; p.facing = 1;
  },
  // a save or a push that left the chef inside the pavilion on foot: back onto the gate mat
  rescue(g) {
    const p = g.player, G = CFG.PIER_BUMPER.GATE;
    if (!this.inBlock(p.x, p.y, 6)) return false;
    p.x = G.x; p.y = G.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Oops! Out by the gate', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  home(g) {
    if (!this.st) return;
    const keep = this.st.bonks;
    this.build(g); this.st.bonks = keep;
  },

  update(g, dt) {
    const st = this.ensure(g), p = g.player;
    if (!this.here(g)) { st.rode = false; return; }
    const riding = this.riding(g);
    if (st.rode && !riding && !g.driving) this.afterHopOut(g);
    st.rode = riding;
    if (!g.driving && !g.travel && !g.onTrain && !g.ride) this.rescue(g);
    st.bonkCd = Math.max(0, st.bonkCd - dt); st.laughCd = Math.max(0, st.laughCd - dt);
    st.chaseT -= dt; st.cheer = Math.max(0, st.cheer - dt);
    this.stepCars(g, dt, riding);
    if (riding) { p.x = st.free.x; p.y = st.free.y; }
    for (const s of st.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; }
    st.sparks = st.sparks.filter((s) => s.t < s.dur);
  },

  // the visitors steer about, the free car glides home, then everyone bounces off the rail and off each other
  stepCars(g, dt, riding) {
    const B = CFG.PIER_BUMPER, F = B.FLOOR, R = B.R, st = this.st, cars = st.cars, free = st.free;
    const pad = R + 14;
    for (const c of cars) {
      c.wob = Math.max(0, c.wob - dt * 2.5); c.zap = Math.max(0, c.zap - dt); c.laugh = Math.max(0, c.laugh - dt);
      if (c === free) {
        if (riding) continue;                       // the core moves it from the joystick
        const H = B.HOME, d = U.dist(c.x, c.y, H.x, H.y);
        if (d > 1.5) {
          const sp = Math.min(B.GLIDE, d * 3 + 20), k = 1 - Math.pow(0.03, dt);
          c.vx += ((H.x - c.x) / d * sp - c.vx) * k; c.vy += ((H.y - c.y) / d * sp - c.vy) * k;
        } else { c.x = H.x; c.y = H.y; c.vx = 0; c.vy = 0; c.glide = false; }
        this.turnTo(c, d > 12 ? Math.atan2(c.vy, c.vx) : H.angle, dt, 5);
        c.x += c.vx * dt; c.y += c.vy * dt;
        continue;
      }
      const a = c.ai;
      a.t -= dt;
      const speed = Math.hypot(c.vx, c.vy);
      a.slow = speed < 25 ? a.slow + dt : 0;
      // now and then one visitor comes to give the chef a gentle bump
      if (riding && st.chaseT <= 0 && !a.chase && U.dist(c.x, c.y, free.x, free.y) > 90) { a.chase = 2.4; a.t = 2.4; st.chaseT = U.rand(4, 7); }
      if (a.chase) { a.chase = Math.max(0, a.chase - dt); a.tx = free.x; a.ty = free.y; }
      if (a.t <= 0 || a.slow > 0.8 || (!a.chase && U.dist(c.x, c.y, a.tx, a.ty) < 24)) {
        a.chase = 0; a.slow = 0; a.t = U.rand(1.6, 3.4);
        a.tx = U.rand(F.x0 + pad, F.x1 - pad); a.ty = U.rand(F.y0 + pad, F.y1 - pad);
      }
      const d = Math.max(1, U.dist(c.x, c.y, a.tx, a.ty)), want = a.chase ? B.CHASE_SPEED : B.AI_SPEED;
      const k = 1 - Math.pow(0.12, dt);
      c.vx += ((a.tx - c.x) / d * want - c.vx) * k; c.vy += ((a.ty - c.y) / d * want - c.vy) * k;
      if (speed > 15) this.turnTo(c, Math.atan2(c.vy, c.vx), dt, 4);
      c.x += c.vx * dt; c.y += c.vy * dt;
    }
    // collisions: a few passes so a pile-up in a corner sorts itself out
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) this.collide(g, cars[i], cars[j], pass === 0, riding);
      for (const c of cars) this.walls(g, c, pass === 0, riding);
    }
  },
  turnTo(c, target, dt, rate) {
    let d = target - c.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    c.angle += d * Math.min(1, dt * rate);
  },
  collide(g, a, b, events, riding) {
    const R = CFG.PIER_BUMPER.R, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = R * 2;
    if (d >= min) return;
    const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0, over = min - d;
    a.x -= nx * over / 2; a.y -= ny * over / 2; b.x += nx * over / 2; b.y += ny * over / 2;
    const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vn >= 0) return;                         // already moving apart
    // a springy bounce: swap the push along the line between them, and always part with a little kick
    const j = -1.85 * vn / 2, kick = Math.max(0, 70 - (vn + 2 * j)) / 2, imp = j + kick;
    a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp;
    if (!events || vn > -30) return;
    a.wob = b.wob = 1; a.zap = b.zap = 0.35;
    const mine = riding && (a === this.st.free || b === this.st.free);
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    if (mine) this.bonk(g, cx, cy, 'car');
    else { this.st.bonks.ai++; if (this.st.laughCd <= 0 && (a.look || b.look)) { (a.look ? a : b).laugh = 1.4; this.st.laughCd = 2.5; } }
    for (const c of [a, b]) if (c.look && mine) c.laugh = 1.4;
  },
  walls(g, c, events, riding) {
    const B = CFG.PIER_BUMPER, F = B.FLOOR, R = B.R;
    let hit = 0, hx = c.x, hy = c.y;
    const bounce = (v) => Math.max(Math.abs(v) * 0.75, 80);
    if (c.x < F.x0 + R) { c.x = F.x0 + R; if (c.vx < 0) { hit = Math.max(hit, -c.vx); c.vx = bounce(c.vx); } hx = F.x0; }
    if (c.x > F.x1 - R) { c.x = F.x1 - R; if (c.vx > 0) { hit = Math.max(hit, c.vx); c.vx = -bounce(c.vx); } hx = F.x1; }
    if (c.y < F.y0 + R) { c.y = F.y0 + R; if (c.vy < 0) { hit = Math.max(hit, -c.vy); c.vy = bounce(c.vy); } hy = F.y0; }
    if (c.y > F.y1 - R) { c.y = F.y1 - R; if (c.vy > 0) { hit = Math.max(hit, c.vy); c.vy = -bounce(c.vy); } hy = F.y1; }
    if (!events || hit < 40) return;
    c.wob = Math.max(c.wob, 0.7);
    if (riding && c === this.st.free) { c.zap = 0.35; this.bonk(g, hx, hy, 'rail'); }
  },
  // the chef bumped something: one float, a few sparks and a boing (never more than one every half second)
  bonk(g, x, y, what) {
    const st = this.st;
    st.bonks[what]++;
    if (st.bonkCd > 0) return;
    st.bonkCd = 0.55; st.cheer = 1.2;
    g.floats.push({ x, y: y - 56, text: 'BONK! 💥', color: '#ffe08a', t: 0, dur: 1, big: true });
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + U.rand(-1.3, 1.3), s = U.rand(70, 150); st.sparks.push({ x, y: y - 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, dur: U.rand(0.25, 0.45) }); }
    if (Sfx.throttle('boing', 450)) { Sfx.tone(170, 0.12, 'triangle', 0.06, 260); setTimeout(() => Sfx.tone(420, 0.2, 'sine', 0.045, -250), 90); }
    Haptics.tap();
  },

  // ---------------- drawing ----------------
  visible(r) {
    const K = CFG.PIER_BUMPER.BLOCK;
    return K.x1 + 40 > r.camX && K.x0 - 40 < r.camX + r.viewW && K.y1 + 60 > r.camY && K.y0 - 40 < r.camY + r.viewH;
  },
  dusk() { return typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.dusk || 0 : 0; },

  // static: the apron and gate mat, the back wall with its sign and striped roof edge, the rubber rail, the metal floor
  paintAfter(r, g, area) {
    if (area !== 'pizzapier') return;
    const ctx = r.ctx, B = CFG.PIER_BUMPER, P = CFG.PIER.PLOTS.bumper, Ra = B.RAIL, F = B.FLOOR, W = B.WALL, G = B.GATE;
    ctx.save();
    // a paved apron in front of the pavilion, with a red mat at the gate
    ctx.fillStyle = '#e9dcc0'; U.roundRect(ctx, P.x0 + 6, B.BLOCK.y1 - 6, P.x1 - P.x0 - 12, P.y1 - B.BLOCK.y1 + 2, 6); ctx.fill();
    ctx.fillStyle = 'rgba(160,130,90,0.25)'; for (let x = P.x0 + 30; x < P.x1 - 10; x += 34) ctx.fillRect(x, B.BLOCK.y1, 2, P.y1 - B.BLOCK.y1 - 6);
    ctx.fillStyle = '#d93a3a'; U.roundRect(ctx, G.x - G.half - 4, G.y - 18, G.half * 2 + 8, 30, 6); ctx.fill();
    ctx.fillStyle = '#ffd23f'; U.roundRect(ctx, G.x - G.half, G.y - 14, G.half * 2, 22, 4); ctx.fill();
    ctx.fillStyle = '#d93a3a'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚗', G.x, G.y - 3);
    // shadow of the pavilion
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; U.roundRect(ctx, Ra.x0 - 4, Ra.y0 + 6, Ra.x1 - Ra.x0 + 12, Ra.y1 - Ra.y0 + 4, 10); ctx.fill();
    // the back wall: a deep blue panel with stars, the big sign in the middle
    ctx.fillStyle = '#2c4fb0'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = '#233f8f'; ctx.fillRect(W.x0, W.y1 - 12, W.x1 - W.x0, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = W.x0 + 10; x < W.x1; x += 40) ctx.fillRect(x, W.y0 + 6, 3, W.y1 - W.y0 - 18);
    const star = (x, y, s, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.45 : s; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
    for (const [x, y, s, col] of [[8512, 5600, 9, '#ffd23f'], [8556, 5618, 6, '#ff7eb6'], [8866, 5600, 9, '#ffd23f'], [8910, 5620, 6, '#5ad1e6'], [8540, 5590, 4, '#fff'], [8890, 5590, 4, '#fff']]) star(x, y, s, col);
    const sx = (W.x0 + W.x1) / 2, sy = 5608;
    ctx.fillStyle = '#b31d2c'; U.roundRect(ctx, sx - 128, sy - 26, 256, 52, 12); ctx.fill();
    ctx.fillStyle = '#ffd23f'; U.roundRect(ctx, sx - 122, sy - 21, 244, 42, 9); ctx.fill();
    ctx.fillStyle = '#d0262f'; ctx.font = r.font(24, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚗 BUMPER CARS', sx, sy + 1);
    // the striped roof edge along the back (scalloped awning)
    const ax0 = W.x0 - 8, ax1 = W.x1 + 8, ay = 5560, n = 20, sw = (ax1 - ax0) / n;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(ax0, ay + 16, ax1 - ax0, 6);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#fff6e8' : '#e8384f';
      ctx.fillRect(ax0 + i * sw, ay, sw + 0.5, 16);
      ctx.beginPath(); ctx.arc(ax0 + i * sw + sw / 2, ay + 16, sw / 2, 0, Math.PI); ctx.fill();
    }
    ctx.fillStyle = '#b31d2c'; ctx.fillRect(ax0, ay - 3, ax1 - ax0, 4);
    // back corner posts (silver)
    for (const x of [Ra.x0, Ra.x1]) { ctx.fillStyle = '#9aa3b1'; ctx.fillRect(x - 5, ay + 10, 10, Ra.y0 - ay - 6); ctx.fillStyle = '#dfe5ee'; ctx.fillRect(x - 3, ay + 10, 3, Ra.y0 - ay - 6); }
    // the rubber rail: a fat black bumper all round with a yellow stripe, and its front face (we see it from the south)
    ctx.fillStyle = '#23232b'; U.roundRect(ctx, Ra.x0, Ra.y0, Ra.x1 - Ra.x0, Ra.y1 - Ra.y0, 12); ctx.fill();
    ctx.fillStyle = '#3a3a46'; U.roundRect(ctx, Ra.x0 + 3, Ra.y0 + 2, Ra.x1 - Ra.x0 - 6, Ra.y1 - Ra.y0 - 8, 10); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.5; ctx.setLineDash([14, 10]);
    U.roundRect(ctx, Ra.x0 + 7, Ra.y0 + 6, Ra.x1 - Ra.x0 - 14, Ra.y1 - Ra.y0 - 16, 8); ctx.stroke(); ctx.setLineDash([]);
    // the shiny metal floor: cool steel, diamond-plate dimples, a few broad glints
    const grd = ctx.createLinearGradient(F.x0, F.y0, F.x1, F.y1);
    grd.addColorStop(0, '#b9c6d6'); grd.addColorStop(0.5, '#d7e0ea'); grd.addColorStop(1, '#a9b7c8');
    ctx.fillStyle = grd; U.roundRect(ctx, F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0, 6); ctx.fill();
    ctx.save(); U.roundRect(ctx, F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0, 6); ctx.clip();
    ctx.strokeStyle = 'rgba(90,105,125,0.35)'; ctx.lineWidth = 2;
    for (let y = F.y0 + 8, row = 0; y < F.y1; y += 12, row++) {
      ctx.beginPath();
      for (let x = F.x0 + 6 + (row % 2) * 12; x < F.x1; x += 24) { const s = row % 2 ? 1 : -1; ctx.moveTo(x - 3, y - 2 * s); ctx.lineTo(x + 3, y + 2 * s); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (const x of [F.x0 + 60, F.x0 + 210, F.x0 + 330]) { ctx.beginPath(); ctx.moveTo(x, F.y0); ctx.lineTo(x + 40, F.y0); ctx.lineTo(x - 40, F.y1); ctx.lineTo(x - 80, F.y1); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (const x of [F.x0 + 140, F.x0 + 400]) { ctx.beginPath(); ctx.moveTo(x, F.y0); ctx.lineTo(x + 14, F.y0); ctx.lineTo(x - 66, F.y1); ctx.lineTo(x - 80, F.y1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // the front rail's face, and the gate gap with a red rope across it
    ctx.fillStyle = '#16161c'; ctx.fillRect(Ra.x0 + 8, Ra.y1 - 6, Ra.x1 - Ra.x0 - 16, 6);
    ctx.fillStyle = '#ffd23f'; for (let x = Ra.x0 + 16; x < Ra.x1 - 16; x += 26) ctx.fillRect(x, Ra.y1 - 5, 12, 3);
    ctx.fillStyle = '#c7ccd6'; ctx.fillRect(G.x - G.half, F.y1 - 2, G.half * 2, Ra.y1 - F.y1 + 2);   // a metal threshold
    ctx.fillStyle = '#9aa3b1'; for (let x = G.x - G.half + 4; x < G.x + G.half; x += 8) ctx.fillRect(x, F.y1, 4, Ra.y1 - F.y1);
    ctx.restore();
  },

  // under people: the canopy's side beams and the twinkling bulbs on the sign and roof edge
  dynamic(r, g) {
    if (!this.here(g) || !this.visible(r)) return;
    const ctx = r.ctx, B = CFG.PIER_BUMPER, Ra = B.RAIL, H = B.CEIL, t = g.time, dk = this.dusk();
    const y1 = Ra.y1 - H;
    ctx.save();
    ctx.strokeStyle = 'rgba(160,170,186,0.9)'; ctx.lineWidth = 3;   // the side beams of the canopy frame
    ctx.beginPath(); ctx.moveTo(Ra.x0, 5572); ctx.lineTo(Ra.x0, y1); ctx.moveTo(Ra.x1, 5572); ctx.lineTo(Ra.x1, y1); ctx.stroke();
    // bulbs round the sign and along the roof edge
    const sx = (B.WALL.x0 + B.WALL.x1) / 2, sy = 5608, pal = ['#fff36b', '#ff6b6b', '#6be3ff', '#9bff6b'];
    const bulb = (x, y, i) => {
      const on = (Math.floor(t * 3) + i) % 3 !== 0;
      if (on && dk > 0.05) { ctx.globalAlpha = 0.35 * dk; ctx.fillStyle = pal[i % 4]; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = on ? pal[i % 4] : '#8a7f6a'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    };
    let i = 0;
    for (let x = sx - 120; x <= sx + 120; x += 16) { bulb(x, sy - 24, i++); bulb(x, sy + 24, i++); }
    for (let x = B.WALL.x0 - 4; x <= B.WALL.x1 + 4; x += 23) bulb(x, 5557, i++);
    ctx.restore();
  },

  entities(r, g, items) {
    if (!this.here(g) || !this.st || !this.visible(r)) return;
    const B = CFG.PIER_BUMPER;
    for (const c of this.st.cars) items.push({ y: c.y + 14, draw: () => this.drawCar(r, g, c) });
    items.push({ y: B.BLOCK.y1 + 1, draw: () => this.drawFront(r, g) });
    const O = B.ONLOOKER;
    items.push({ y: O.y, draw: () => this.drawOnlooker(r, g) });
  },

  // one car: rubber skirt, the round body (squashed for the 3/4 view), the driver sitting in it, and the pole
  drawCar(r, g, c) {
    const ctx = r.ctx, B = CFG.PIER_BUMPER, H = B.CEIL, t = g.time;
    const chef = c === this.st.free && this.riding(g);
    const wob = c.wob > 0 ? Math.sin(t * 40) * c.wob * 2.5 : 0, x = c.x + wob, y = c.y;
    const ca = Math.cos(c.angle), sa = Math.sin(c.angle);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 7, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#18181e'; ctx.beginPath(); ctx.ellipse(x, y + 4, 24, 17.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(x, y); ctx.scale(1, 0.72); ctx.rotate(c.angle);
    this.vehicleArt.bumpercar(r, g, c.col, c);
    ctx.restore();
    // the pole: from the back of the car straight up to the ceiling grid
    const bx = x - ca * 15, by = y - sa * 15 * 0.72;
    const pole = () => {
      ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, by - 2); ctx.lineTo(bx, by - H + 2); ctx.stroke();
      ctx.strokeStyle = '#d5dbe4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx - 1, by - 2); ctx.lineTo(bx - 1, by - H + 2); ctx.stroke();
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, bx - 6, by - H - 1, 12, 4, 2); ctx.fill();   // the contact shoe on the grid
      const sp = Math.hypot(c.vx, c.vy);
      if (c.zap > 0 || (sp > 30 && ((t * 13 + c.x * 0.01) % 1) < 0.35)) {
        const big = c.zap > 0 ? 1.6 : 1, n = c.zap > 0 ? 6 : 4;
        ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let i = 0; i < n; i++) { const a = i * 2.4 + t * 31, rr = (5 + ((i * 7 + Math.floor(t * 20)) % 5)) * big; ctx.moveTo(bx, by - H); ctx.lineTo(bx + Math.cos(a) * rr, by - H + Math.sin(a) * rr * 0.8); }
        ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx, by - H, 2.2 * big, 0, Math.PI * 2); ctx.fill();
      }
    };
    pole();   // always behind the driver, so a face is never hidden
    // the driver, sitting: legs hidden inside the car
    const look = chef
      ? { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', pants: '#2d3a4a', carry: g.player.carry }
      : c.look ? Object.assign({ pants: '#4a4a4a' }, c.look) : null;
    if (look) {
      look.facing = ca < 0 ? -1 : 1; look.moving = false; look.bob = 0;
      const bounce = c.laugh > 0 ? Math.abs(Math.sin(t * 14)) * 2 : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 60, y - 240, 120, 236); ctx.clip();
      r.drawPerson(x - ca * 3, y + 3 - bounce, look);
      ctx.restore();
      // arms on the wheel
      ctx.fillStyle = look.skin; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 9, y - 6, 3.5, 0, Math.PI * 2); ctx.fill(); }
      if (c.laugh > 0) {
        const k = Math.min(1, c.laugh * 3);
        ctx.globalAlpha = k; r.drawBubble(x, y - (chef && g.player.carry ? 92 : 74), () => { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('😆', 0, 0); }, 30); ctx.globalAlpha = 1;
      }
    }
    // the front lip of the car over the driver's lap
    ctx.fillStyle = c.col; ctx.beginPath(); ctx.ellipse(x, y + 2, 17, 7, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 5, 15, 4, 0, 0, Math.PI); ctx.fill();
    if (chef && g.player.carry > 0) r.drawCountBadge(x + 18, y - 70 - Math.min(g.player.carry, 30) * 4, g.player.carry, g.playerCap());
  },

  // the front of the canopy frame: corner posts, the striped front beam with bulbs, and the gate posts
  drawFront(r, g) {
    const ctx = r.ctx, B = CFG.PIER_BUMPER, Ra = B.RAIL, H = B.CEIL, G = B.GATE, t = g.time, dk = this.dusk();
    const by = Ra.y1 - H;
    // the ceiling grid: a fine mesh over the riders' heads (faint, so the floor stays in view)
    ctx.strokeStyle = 'rgba(40,48,70,0.2)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Ra.x0 + 46; x < Ra.x1 - 10; x += 46) { ctx.moveTo(x, B.WALL.y1 - 34); ctx.lineTo(x, by); }
    for (let y = B.WALL.y1 - 34; y < by - 4; y += 34) { ctx.moveTo(Ra.x0, y); ctx.lineTo(Ra.x1, y); }
    ctx.stroke();
    for (const x of [Ra.x0, Ra.x1]) {
      ctx.fillStyle = '#9aa3b1'; ctx.fillRect(x - 5, by, 10, H);
      ctx.fillStyle = '#e3e8f0'; ctx.fillRect(x - 3, by, 3, H);
      ctx.fillStyle = '#e8384f'; U.roundRect(ctx, x - 7, Ra.y1 - 8, 14, 10, 3); ctx.fill();
    }
    // the front beam: red and white stripes
    const n = 24, w = (Ra.x1 - Ra.x0 + 12) / n;
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#fff6e8' : '#e8384f'; ctx.fillRect(Ra.x0 - 6 + i * w, by - 3, w + 0.5, 5); }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(Ra.x0 - 6, by + 2, Ra.x1 - Ra.x0 + 12, 1.5);
    const pal = ['#fff36b', '#ff6b6b', '#6be3ff', '#9bff6b'];
    for (let i = 0, x = Ra.x0 + 6; x < Ra.x1; x += 22, i++) {
      const on = (Math.floor(t * 3) + i) % 3 !== 1;
      if (on && dk > 0.05) { ctx.globalAlpha = 0.35 * dk; ctx.fillStyle = pal[i % 4]; ctx.beginPath(); ctx.arc(x, by + 5, 7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = on ? pal[i % 4] : '#8a7f6a'; ctx.beginPath(); ctx.arc(x, by + 5, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    // the gate: two short posts with yellow knobs, a red rope between them (dropped while the chef is driving)
    for (const s of [-1, 1]) {
      const x = G.x + s * (G.half + 2);
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 3, Ra.y1 - 30, 6, 30);
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, Ra.y1 - 32, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#d0262f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(G.x - G.half - 2, Ra.y1 - 26); ctx.quadraticCurveTo(G.x, Ra.y1 - 12, G.x + G.half + 2, Ra.y1 - 26); ctx.stroke();
  },

  drawOnlooker(r, g) {
    const O = CFG.PIER_BUMPER.ONLOOKER, st = this.st, t = g.time, cheer = st && st.cheer > 0;
    const hop = cheer ? Math.abs(Math.sin(t * 11)) * 6 : 0;   // a happy little hop when the chef gives someone a BONK
    r.drawPerson(O.x, O.y - hop, { shirt: '#ff9f43', skin: '#e0ac69', hair: '#2b1d14', hairStyle: 1, facing: 1, moving: false, bob: 0, pants: '#3a5a8c' });
    if (cheer) { const ctx = r.ctx; r.drawBubble(O.x, O.y - 76, () => { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎉', 0, 0); }, 30); }
  },

  // bonk sparks (world space, over everything)
  overlay(r, g) {
    if (!this.here(g) || !this.st || !this.st.sparks.length) return;
    const ctx = r.ctx;
    ctx.save(); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const s of this.st.sparks) {
      const k = s.t / s.dur;
      ctx.strokeStyle = k < 0.5 ? '#fff6a0' : '#ffb84a'; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.04, s.y - s.vy * 0.04); ctx.stroke();
    }
    ctx.restore();
  },

  // a round bumper car seen from above, nose +x: rubber ring, shiny body, seat at the back, wheel up front, pole base
  vehicleArt: {
    bumpercar(r, g, color, v) {
      const ctx = r.ctx, c = (v && v.col) || color || '#ff8a1f';
      ctx.fillStyle = '#23232b'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3c3c48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 21.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-3, -4, 14, Math.PI * 1.05, Math.PI * 1.6); ctx.arc(-3, -4, 9, Math.PI * 1.6, Math.PI * 1.05, true); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, -15, -11, 11, 22, 5); ctx.fill();   // the seat back
      ctx.fillStyle = '#2b2b33'; U.roundRect(ctx, -12, -9, 14, 18, 5); ctx.fill();             // the seat
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(9, 0, 5, 0, Math.PI * 2); ctx.stroke();   // steering wheel
      ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(17, -6, 2.2, 0, Math.PI * 2); ctx.arc(17, 6, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa3b1'; ctx.beginPath(); ctx.arc(-15, 0, 3.5, 0, Math.PI * 2); ctx.fill();   // the pole's base
    },
  },
};
Game.ext.unshift(PierBumperExt);
Render.ext.push(PierBumperExt);
