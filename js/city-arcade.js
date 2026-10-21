'use strict';
// The ARCADE: City building 3 on Bus Street (the purple one under the pizza billboard). Blinking bulbs frame its door;
// inside is a glowing games room with its own little map: three cabinets, a pinball table, a claw machine that always
// wins, a dance pad, a photo booth, a prize counter with a clerk and a token bag to buy.
// The cabinets and the pinball table are REAL games: pressing Play opens the game big on the screen in a cabinet frame
// (the `screen` hook), the chef is held at the machine, the joystick plays and the big button is the game's button
// (pinball) or "Stop playing". Kid rules: a round lasts 30 s or until the goal, nothing is ever lost, a big score
// counter, a "Great game!" card at the end and a best score per game on the machine's backglass.
// Extension module: registered with Game.ext (unshift: the door beats the City's own buttons) and Render.ext.
CFG.ARCADE = {
  BUILDING: 3,                                   // index in CFG.CITY.BUILDINGS
  DOOR: { x: 5256, y: 14 },                      // on the sidewalk right below the door
  WORLD: { x0: 1400, y0: 3000, x1: 2000, y1: 3400 },
  ROOM: { x0: 1430, y0: 3040, x1: 1970, y1: 3370 }, WALL: 26,
  EXIT: { x: 1700, y: 3348 },                    // the mat inside the door; you arrive just above it
  REACH: 34, PLAY: 3,                            // how close counts as "at" a machine; seconds a photo takes
  ROUND: 30, CARD: 2,                            // seconds a big-screen round lasts; seconds the "Great game!" card stays
  PF: { w: 320, h: 400 },                        // the big playfield, in its own units (scaled to fit the screen)
  CABINETS: [
    { key: 'invaders', title: 'PIZZA INVADERS', ico: '👾', x: 1436, y: 3044, w: 64, h: 56, color: '#ff4fd8', spot: { x: 1468, y: 3118 } },
    { key: 'racer', title: 'ROAD RACER', ico: '🏎️', x: 1512, y: 3044, w: 64, h: 56, color: '#3ff0ff', spot: { x: 1544, y: 3118 } },
    { key: 'pong', title: 'PIZZA PONG', ico: '🏓', x: 1588, y: 3044, w: 64, h: 56, color: '#ffe94f', spot: { x: 1620, y: 3118 } },
  ],
  PINBALL: { x: 1690, y: 3044, w: 74, h: 96, spot: { x: 1727, y: 3160 } },
  CLAW: { x: 1836, y: 3044, w: 92, h: 82, spot: { x: 1882, y: 3146 } },
  GUMBALL: { x: 1800, y: 3078 },
  COUNTER: { x0: 1466, y0: 3176, x1: 1502, y1: 3306, clerk: { x: 1448, y: 3248 } },
  TOKEN_PAD: { x: 1550, y: 3244 },
  BOOTH: { x: 1898, y: 3180, w: 62, h: 86, spot: { x: 1874, y: 3228 } },
  DANCE: { x: 1740, y: 3262, half: 36 },
  PLUSH: ['bear', 'bunny', 'dino', 'cat', 'duck'],
};
CFG.AREAS.arcade = { WORLD: CFG.ARCADE.WORLD };

// ======================= the four big-screen games =======================
// Each game owns a state object `G` (made by init), steps it with the stick `a` ({x, y} in -1..1) and draws itself in
// playfield units (0..PF.w × 0..PF.h). `A` is ArcadeExt (helpers: addScore, burst, blip, text), `pl` the play record.
const ArcadeGames = {
  // ---- PIZZA INVADERS: the chef's rocket auto-fires pizza slices at cheeky vegetables drifting down ----
  invaders: {
    title: 'PIZZA INVADERS', ico: '👾', color: '#ff4fd8', GOAL: 24,
    init() { return { ship: 160, fire: 0.4, bullets: [], veg: [], wave: 0, waveCd: 0, hits: 0, sparks: [], texts: [] }; },
    step(G, a, dt, A, pl) {
      const PF = CFG.ARCADE.PF;
      G.ship = U.clamp(G.ship + a.x * 240 * dt, 22, PF.w - 22);
      G.fire -= dt; if (G.fire <= 0) { G.fire = 0.5; G.bullets.push({ x: G.ship, y: PF.h - 58 }); }
      for (const b of G.bullets) b.y -= 300 * dt;
      G.bullets = G.bullets.filter((b) => b.y > -16 && !b.hit);
      G.waveCd -= dt;
      if (!G.veg.length || G.waveCd <= 0) { this.row(G); G.waveCd = 6; }
      for (const v of G.veg) { v.y += 20 * dt; v.ph += dt; v.x = v.x0 + Math.sin(v.ph * 1.4) * 22; }
      for (const b of G.bullets) for (const v of G.veg) if (!v.hit && !b.hit && U.dist(b.x, b.y, v.x, v.y) < 19) {
        v.hit = b.hit = true; G.hits++; A.addScore(pl, 10); A.burst(G, v.x, v.y, 10, ['#ffe94f', '#fff', v.col]); A.blip(880 + (G.hits % 4) * 110, 0.06, 'square', 0.03);
      }
      G.veg = G.veg.filter((v) => !v.hit && v.y < PF.h + 30);   // the ones that reach the bottom just float away
      G.bullets = G.bullets.filter((b) => !b.hit);
      A.stepFx(G, dt);
    },
    row(G) {
      const kinds = [['broccoli', '#3fa34d'], ['carrot', '#ff8c1a'], ['tomato', '#e53935'], ['mushroom', '#e07a5f'], ['eggplant', '#7b3fa0']];
      for (let i = 0; i < 6; i++) { const k = kinds[(i + G.wave) % 5]; G.veg.push({ x0: 44 + i * 46.4, x: 44 + i * 46.4, y: G.wave ? -26 : 30, kind: k[0], col: k[1], ph: i * 0.7 + G.wave }); }
      G.wave++;
    },
    goal(G) { return G.hits >= this.GOAL; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.ARCADE.PF, t = g.time;
      ctx.fillStyle = '#0b1230'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 40; i++) { const x = (i * 97 + 13) % PF.w, y = (i * 211 + t * (6 + (i % 3) * 5)) % PF.h; ctx.fillRect(x, y, 2, 2); }
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(270, 60, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f3c96b'; ctx.beginPath(); ctx.arc(263, 54, 4, 0, Math.PI * 2); ctx.arc(276, 66, 3, 0, Math.PI * 2); ctx.fill();   // a cheese moon
      for (const v of G.veg) A.drawVeg(ctx, v.x, v.y, v.kind, v.col, v.ph);
      for (const b of G.bullets) A.drawSlice(ctx, b.x, b.y);
      A.drawShip(ctx, G.ship, PF.h - 40, t);
      A.drawFx(ctx, r, G);
    },
  },

  // ---- ROAD RACER: three lanes, the road scrolls, dodge cars (a bump just goes "Boing!") and collect pizza boxes ----
  racer: {
    title: 'ROAD RACER', ico: '🏎️', color: '#3ff0ff', GOAL: 15, LANES: [80, 160, 240],
    init() { return { lane: 1, x: 160, laneCd: 0, speed: 170, road: 0, cars: [], boxes: [], carCd: 1.2, boxCd: 0.7, bounce: 0, slow: 0, got: 0, bumps: 0, sparks: [], texts: [] }; },
    step(G, a, dt, A, pl) {
      const PF = CFG.ARCADE.PF, L = this.LANES, py = PF.h - 70;
      if (Math.abs(a.x) > 0.5) { if (G.laneCd <= 0) { G.lane = U.clamp(G.lane + (a.x < 0 ? -1 : 1), 0, 2); G.laneCd = 0.4; } } else G.laneCd = 0;
      G.laneCd -= dt;
      G.x += (L[G.lane] - G.x) * Math.min(1, dt * 11);
      G.speed = Math.min(300, G.speed + 4.5 * dt);                           // the speed creeps up a little
      G.bounce -= dt; G.slow -= dt;
      const sp = G.speed * (G.slow > 0 ? 0.45 : 1);
      G.road = (G.road + sp * dt) % 40;
      G.carCd -= dt;
      if (G.carCd <= 0) { G.carCd = U.rand(1.3, 2.2); const lane = U.randInt(0, 2); if (!G.cars.some((c) => c.lane === lane && c.y < 80)) G.cars.push({ lane, x: L[lane], y: -60, color: U.pick(['#3b7dd8', '#ffb347', '#8bff5a', '#ff7ad0']), boost: 0 }); }
      G.boxCd -= dt;
      if (G.boxCd <= 0) { G.boxCd = U.rand(0.7, 1.3); const lane = U.randInt(0, 2); if (!G.cars.some((c) => c.lane === lane && c.y < 60)) G.boxes.push({ lane, x: L[lane], y: -30 }); }
      for (const c of G.cars) { c.boost -= dt; c.y += (c.boost > 0 ? -300 : sp * 0.55) * dt; }
      for (const b of G.boxes) b.y += sp * dt;
      for (const c of G.cars) if (G.bounce <= 0 && Math.abs(c.x - G.x) < 24 && Math.abs(c.y - py) < 48) {
        G.bounce = 0.5; G.slow = 0.9; c.boost = 1.2; G.bumps++; A.text(G, G.x, py - 50, 'Boing!', '#ffe08a'); A.blip(220, 0.12, 'triangle', 0.04, -80);
      }
      for (const b of G.boxes) if (!b.got && Math.abs(b.x - G.x) < 26 && Math.abs(b.y - py) < 34) {
        b.got = true; G.got++; A.addScore(pl, 10); A.burst(G, b.x, b.y, 8, ['#ffe94f', '#fff', '#ff9f1c']); A.blip(1040, 0.06, 'square', 0.03);
      }
      G.cars = G.cars.filter((c) => c.y < PF.h + 70 && c.y > -140);
      G.boxes = G.boxes.filter((b) => !b.got && b.y < PF.h + 40);
      A.stepFx(G, dt);
    },
    goal(G) { return G.got >= this.GOAL; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.ARCADE.PF, py = PF.h - 70;
      ctx.fillStyle = '#3da35d'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = '#2f8a4a'; for (let y = -40 + G.road; y < PF.h + 40; y += 80) { ctx.beginPath(); ctx.arc(16, y, 11, 0, Math.PI * 2); ctx.arc(304, y + 40, 11, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#4a4a5a'; ctx.fillRect(40, 0, 240, PF.h);
      for (let y = -40 + G.road, i = 0; y < PF.h + 40; y += 20, i++) { ctx.fillStyle = i % 2 ? '#e53935' : '#fff'; ctx.fillRect(36, y, 5, 20); ctx.fillRect(279, y, 5, 20); }
      ctx.fillStyle = '#fff3b0'; for (let y = -40 + G.road; y < PF.h + 40; y += 40) { ctx.fillRect(118, y, 4, 22); ctx.fillRect(198, y, 4, 22); }
      for (const b of G.boxes) A.drawBox(r, ctx, b.x, b.y);
      for (const c of G.cars) A.drawCar(ctx, c.x, c.y, c.color, false);
      ctx.save(); ctx.translate(G.x, py); if (G.bounce > 0) ctx.rotate(Math.sin(G.bounce * 30) * 0.12 * G.bounce); A.drawCar(ctx, 0, 0, '#e53935', true); ctx.restore();
      if (G.slow > 0) { ctx.fillStyle = '#ffe94f'; for (let i = 0; i < 3; i++) { const an = g.time * 6 + i * 2.1; A.drawStar(ctx, G.x + Math.cos(an) * 24, py - 34 + Math.sin(an) * 7, 5, 2, 5); } }
      if (G.speed > 240) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = 48 + ((i * 53) % 224), y = (i * 131 + G.road * 3) % PF.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke(); } }
      A.drawFx(ctx, r, G);
    },
  },

  // ---- PIZZA PONG: your paddle up/down against a friendly robot that returns the ball (not always!) ----
  pong: {
    title: 'PIZZA PONG', ico: '🏓', color: '#ffe94f', GOAL: 5, PH: 36,
    init() { const G = { py: 200, ry: 200, ball: { x: 160, y: 200, vx: -200, vy: 40 }, err: 0, goals: 0, rally: 0, serveCd: 0.8, blink: 0, sparks: [], texts: [] }; return G; },
    serve(G) { G.ball = { x: 160, y: 200, vx: -200, vy: U.rand(-90, 90) }; G.serveCd = 0.8; G.err = U.rand(-70, 70); },
    step(G, a, dt, A, pl) {
      const PF = CFG.ARCADE.PF, H = this.PH, b = G.ball;
      G.py = U.clamp(G.py + a.y * 290 * dt, H + 16, PF.h - H - 4);
      const target = b.vx > 0 ? b.y + G.err : PF.h / 2;
      G.ry = U.clamp(G.ry + U.clamp(target - G.ry, -150 * dt, 150 * dt), H + 4, PF.h - H - 4);
      G.blink -= dt;
      if (G.serveCd > 0) { G.serveCd -= dt; A.stepFx(G, dt); return; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < 11) { b.y = 11; b.vy = Math.abs(b.vy); } else if (b.y > PF.h - 11) { b.y = PF.h - 11; b.vy = -Math.abs(b.vy); }
      if (b.vx < 0 && b.x - 10 < 34 && b.x > 14 && Math.abs(b.y - G.py) < H + 8) {   // your paddle (x 22..34)
        b.vx = Math.min(330, Math.abs(b.vx) * 1.04); b.vy = (b.y - G.py) * 4 + b.vy * 0.3; b.x = 45; G.rally++; G.err = U.rand(-70, 70);
        A.addScore(pl, 1); A.burst(G, 36, b.y, 5, ['#ffe94f', '#fff']); A.blip(700 + (G.rally % 5) * 60, 0.05, 'square', 0.03);
      }
      if (b.vx > 0 && b.x + 10 > 284 && b.x < 306 && Math.abs(b.y - G.ry) < H + 6) {   // the robot's paddle (x 284..298)
        b.vx = -Math.abs(b.vx); b.vy = (b.y - G.ry) * 3 + b.vy * 0.3; b.x = 273; G.blink = 0.35;
      }
      if (b.x > PF.w + 14) { G.goals++; A.addScore(pl, 5); A.burst(G, 300, b.y, 14, ['#ffe94f', '#fff', '#ff4fd8']); A.text(G, 240, 120, 'GOAL!', '#ffe94f'); A.blip(1320, 0.14, 'triangle', 0.045, 200); this.serve(G); }
      else if (b.x < -14) this.serve(G);                                            // a missed ball just comes back
      A.stepFx(G, dt);
    },
    goal(G) { return G.goals >= this.GOAL; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.ARCADE.PF, H = this.PH, b = G.ball, t = g.time;
      ctx.fillStyle = '#0e2a4a'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = 'rgba(63,240,255,0.45)'; for (let y = 6; y < PF.h; y += 18) ctx.fillRect(158, y, 4, 10);
      ctx.strokeStyle = 'rgba(63,240,255,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, PF.w - 8, PF.h - 8);
      // your paddle, with a chef hat
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, 22, G.py - H, 12, H * 2, 6); ctx.fill();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, 18, G.py - H - 9, 20, 9, 3); ctx.fill(); ctx.beginPath(); ctx.ellipse(28, G.py - H - 11, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      // the robot: a paddle body with a boxy head on top
      ctx.fillStyle = '#9aa3b2'; U.roundRect(ctx, 284, G.ry - H, 14, H * 2, 6); ctx.fill();
      const hy = G.ry - H - 14, happy = G.blink > 0;
      ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, 279, hy - 10, 24, 20, 5); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(291, hy - 15 - Math.abs(Math.sin(t * 4)) * 2, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.fillRect(290, hy - 12, 2, 4);
      ctx.fillStyle = '#3ff0ff';
      if (happy) { ctx.strokeStyle = '#3ff0ff'; ctx.lineWidth = 2; for (const ex of [286, 296]) { ctx.beginPath(); ctx.arc(ex, hy - 1, 3, Math.PI, 0); ctx.stroke(); } }
      else for (const ex of [286, 296]) ctx.fillRect(ex - 2.5, hy - 5, 5, 5);
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(285, hy + 4, 12, 2);
      // the pizza ball
      if (G.serveCd > 0) { const k = 1 + Math.sin(t * 12) * 0.12; r.drawPizza(b.x, b.y, 11 * k); } else r.drawPizza(b.x, b.y, 11);
      A.drawFx(ctx, r, G);
    },
  },

  // ---- PINBALL: launch with the button, flip with the stick (or the button); bumpers, a ramp, lights; the ball
  // never drains for good: it rolls back to the plunger and the button launches it again ----
  pinball: {
    title: 'PIZZA BALL', ico: '🪩', color: '#ff9f1c', R: 9, GRAV: 520,
    BUMPERS: [{ x: 88, y: 128, c: '#ff4fd8' }, { x: 200, y: 104, c: '#3ff0ff' }, { x: 150, y: 206, c: '#ffe94f' }],
    LAMPS: [100, 150, 200], LAMP_Y: 46,
    FLIP: { len: 46, rest: 0.5, up: -0.5, pivots: [{ x: 100, y: 362 }, { x: 220, y: 362 }] },
    GUIDES: [[16, 290, 96, 356], [288, 290, 224, 356], [316, 60, 260, 16], [44, 100, 44, 250], [288, 72, 288, 400]],   // side guides, the arch over the lane, the ramp's wall, the lane wall
    init() { return { at: 'plunger', ball: { x: 303, y: 372, vx: 0, vy: 0, lane: true, ramp: false, r: 9 }, fl: [{ ang: 0.5, vel: 0 }, { ang: 0.5, vel: 0 }], bump: [0, 0, 0], lamps: [false, false, false], flash: 0, ramp: 0, btnFlip: 0, launches: 0, flips: 0, returnT: 0, still: 0, sparks: [], texts: [] }; },
    launch(G, A) { if (G.at !== 'plunger') return; G.at = 'play'; G.launches++; const b = G.ball; b.x = 303; b.y = 372; b.vx = 0; b.vy = -U.rand(630, 700); b.lane = true; b.ramp = false; A.blip(520, 0.1, 'triangle', 0.04, 300); },
    step(G, a, dt, A, pl) {
      const PF = CFG.ARCADE.PF, F = this.FLIP, b = G.ball;
      G.btnFlip -= dt; G.ramp -= dt; for (let i = 0; i < 3; i++) G.bump[i] -= dt;
      if (G.flash > 0) { G.flash -= dt; if (G.flash <= 0) G.lamps = [false, false, false]; }
      // the flippers: left with the stick left, right with the stick right, both with the button
      const up = [a.x < -0.4 || G.btnFlip > 0, a.x > 0.4 || G.btnFlip > 0];
      for (let i = 0; i < 2; i++) { const f = G.fl[i], target = up[i] ? F.up : F.rest, prev = f.ang; f.ang += U.clamp(target - f.ang, -24 * dt, 24 * dt); f.vel = (f.ang - prev) / dt; if (up[i] && prev === F.rest && f.ang !== prev) G.flips++; }
      if (G.at === 'return') { G.returnT += dt; if (G.returnT >= 1) { G.at = 'plunger'; b.x = 303; b.y = 372; b.vx = b.vy = 0; } A.stepFx(G, dt); return; }
      if (G.at !== 'play') { A.stepFx(G, dt); return; }
      const N = 4, h = dt / N;
      for (let n = 0; n < N; n++) {
        if (b.ramp) {   // carried up the ramp tube and shot out along the top
          b.vx = 0; b.vy = -380; b.x += (30 - b.x) * Math.min(1, h * 12); b.y += b.vy * h;
          if (b.y < 60) { b.ramp = false; b.vx = 280; b.vy = -80; }
          continue;
        }
        b.vy += this.GRAV * h; b.x += b.vx * h; b.y += b.vy * h;
        const sp = Math.hypot(b.vx, b.vy); if (sp > 900) { b.vx *= 900 / sp; b.vy *= 900 / sp; }
        if (b.lane) {   // in the plunger lane: straight up, then over the arch into the playfield
          b.x = U.clamp(b.x, 288 + b.r, 316 - b.r);
          if (b.y < 60) { b.lane = false; b.vx = -220; }                                   // over the arch, into the playfield
          else if (b.y > 372 && b.vy > 0) { G.at = 'plunger'; b.x = 303; b.y = 372; b.vx = b.vy = 0; }   // a weak launch rolls back
        } else {
          if (b.x < 16 + b.r) { b.x = 16 + b.r; b.vx = Math.abs(b.vx) * 0.6; }
          if (b.x > 316 - b.r) { b.x = 316 - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
          if (b.y < 16 + b.r) { b.y = 16 + b.r; b.vy = Math.abs(b.vy) * 0.6; }
          if (b.x > 288 && b.y > 72) { b.lane = true; continue; }                       // it dropped into the lane from above
          for (const s of this.GUIDES) A.hitSeg(b, s[0], s[1], s[2], s[3], 3, 0.6);
          this.BUMPERS.forEach((bp, i) => {
            const d = U.dist(b.x, b.y, bp.x, bp.y);
            if (d < 18 + b.r && d > 0) { const nx = (b.x - bp.x) / d, ny = (b.y - bp.y) / d; b.x = bp.x + nx * (18 + b.r); b.y = bp.y + ny * (18 + b.r); b.vx = nx * 380; b.vy = ny * 380; if (G.bump[i] <= 0) { G.bump[i] = 0.35; A.addScore(pl, 100); A.burst(G, bp.x, bp.y, 6, [bp.c, '#fff']); A.blip(660 + i * 120, 0.06, 'square', 0.03); } }
          });
          this.LAMPS.forEach((lx, i) => { if (!G.lamps[i] && U.dist(b.x, b.y, lx, this.LAMP_Y) < 16) { G.lamps[i] = true; A.addScore(pl, 50); A.blip(1200 + i * 100, 0.06, 'sine', 0.03); if (G.lamps.every((l) => l)) { G.flash = 1; A.addScore(pl, 1000); A.text(G, 150, 90, 'BONUS!', '#ffe94f'); A.burst(G, 150, 46, 16, ['#ffe94f', '#fff', '#ff4fd8']); } } });
          if (b.x < 44 && b.y > 60 && b.y < 250 && b.vy < -40) { b.ramp = true; G.ramp = 1; A.addScore(pl, 500); A.text(G, 30, 80, 'RAMP!', '#3ff0ff'); A.blip(900, 0.12, 'triangle', 0.04, 400); }
          // the flippers (capsules); a flipper on its way up kicks the ball hard
          for (let i = 0; i < 2; i++) {
            const f = G.fl[i], pv = F.pivots[i], dir = i ? -1 : 1, tx = pv.x + dir * Math.cos(f.ang) * F.len, ty = pv.y + Math.sin(f.ang) * F.len;
            const k = A.hitSeg(b, pv.x, pv.y, tx, ty, 7, 0.5);
            if (k !== false && f.vel < -4) { b.vy = Math.min(b.vy, -(480 + 260 * k)); b.vx += dir * 140 * (0.3 + k); }
          }
          if (b.y > PF.h + 20) { G.at = 'return'; G.returnT = 0; G.drainX = U.clamp(b.x, 60, 260); }
        }
      }
      // never stuck: a ball that sits still gets a nudge
      if (G.at === 'play' && Math.hypot(b.vx, b.vy) < 25) { G.still += dt; if (G.still > 1.2) { G.still = 0; b.vy = -200; b.vx = U.rand(-120, 120); } } else G.still = 0;
      A.stepFx(G, dt);
    },
    goal() { return false; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.ARCADE.PF, F = this.FLIP, b = G.ball, t = g.time;
      ctx.fillStyle = '#143a5a'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = '#1d4f78'; ctx.fillRect(16, 16, 272, 384);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 12; i++) A.drawStar(ctx, 40 + (i * 61) % 230, 40 + (i * 97) % 300, 6, 2, 4);
      // plunger lane, the arch, the guides and the ramp
      ctx.fillStyle = '#0f2f4b'; ctx.fillRect(288, 72, 28, 328);
      ctx.strokeStyle = '#3ff0ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(288, 72); ctx.lineTo(288, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(316, 60); ctx.lineTo(260, 16); ctx.stroke();
      ctx.strokeStyle = '#ffe94f'; ctx.lineWidth = 5; for (const s of this.GUIDES.slice(0, 2)) { ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.stroke(); }
      ctx.fillStyle = G.ramp > 0 ? '#5cc8ff' : '#2a6f9e'; U.roundRect(ctx, 16, 56, 28, 194, 8); ctx.fill();
      ctx.strokeStyle = '#3ff0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(44, 100); ctx.lineTo(44, 250); ctx.stroke();
      ctx.fillStyle = G.ramp > 0 ? '#fff' : 'rgba(255,255,255,0.5)'; for (let i = 0; i < 3; i++) { const y = 120 + i * 48 - ((t * 40) % 48); if (y > 70 && y < 240) { ctx.beginPath(); ctx.moveTo(30, y - 8); ctx.lineTo(38, y + 2); ctx.lineTo(22, y + 2); ctx.closePath(); ctx.fill(); } }
      // lamps along the top and the chasing lights
      this.LAMPS.forEach((lx, i) => { const lit = G.lamps[i] || (G.flash > 0 && Math.floor(t * 10) % 2 === 0); if (lit) { ctx.fillStyle = 'rgba(255,233,79,0.35)'; ctx.beginPath(); ctx.arc(lx, this.LAMP_Y, 14, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = lit ? '#ffe94f' : 'rgba(255,233,79,0.3)'; ctx.beginPath(); ctx.arc(lx, this.LAMP_Y, 7, 0, Math.PI * 2); ctx.fill(); });
      for (let i = 0; i < 16; i++) { const on = (i + Math.floor(t * 6)) % 4 === 0; ctx.fillStyle = on ? ['#ff4fd8', '#3ff0ff', '#ffe94f'][i % 3] : 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(60 + i * 12, 26, 2.5, 0, Math.PI * 2); ctx.fill(); }
      // bumpers
      this.BUMPERS.forEach((bp, i) => {
        const lit = G.bump[i] > 0;
        if (lit) { ctx.fillStyle = A.rgba(bp.c, 0.35); ctx.beginPath(); ctx.arc(bp.x, bp.y, 28, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = lit ? bp.c : A.rgba(bp.c, 0.55); ctx.beginPath(); ctx.arc(bp.x, bp.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2); ctx.fill();
      });
      // flippers
      ctx.strokeStyle = '#ffe94f'; ctx.lineWidth = 14; ctx.lineCap = 'round';
      G.fl.forEach((f, i) => { const pv = F.pivots[i], dir = i ? -1 : 1; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(pv.x + dir * Math.cos(f.ang) * F.len, pv.y + Math.sin(f.ang) * F.len); ctx.stroke(); });
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 6; G.fl.forEach((f, i) => { const pv = F.pivots[i], dir = i ? -1 : 1; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(pv.x + dir * Math.cos(f.ang) * F.len * 0.85, pv.y + Math.sin(f.ang) * F.len * 0.85); ctx.stroke(); });
      ctx.lineCap = 'butt';
      // the plunger
      ctx.fillStyle = '#9a9ab8'; ctx.fillRect(300, 384, 6, 14); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(303, 392, 8, 0, Math.PI * 2); ctx.fill();
      if (G.at === 'plunger') { const k = 0.5 + 0.5 * Math.sin(t * 6); ctx.fillStyle = `rgba(255,233,79,${(0.3 + 0.5 * k).toFixed(2)})`; ctx.beginPath(); ctx.moveTo(303, 345 - k * 6); ctx.lineTo(313, 357 - k * 6); ctx.lineTo(293, 357 - k * 6); ctx.closePath(); ctx.fill(); }
      // the ball (rolling back along the bottom when it drained)
      let bx = b.x, by = b.y;
      if (G.at === 'return') { const k = U.easeOut(Math.min(1, G.returnT)); bx = U.lerp(G.drainX, 303, k); by = k < 0.5 ? 392 : U.lerp(392, 372, (k - 0.5) * 2); }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(bx + 2, by + 3, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx - 3, by - 3, 3, 0, Math.PI * 2); ctx.fill();
      A.drawFx(ctx, r, G);
    },
  },
};

const ArcadeExt = {
  name: 'arcade',
  st: null,
  // ---------- small helpers ----------
  door() { return CFG.ARCADE.DOOR; },
  building() { return CFG.CITY.BUILDINGS[CFG.ARCADE.BUILDING]; },
  cityBusy(g) { return !!(g.driving || g.onTrain || g.ride || g.travel || g.fishing || (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))))); },
  atDoor(g, d) { const D = CFG.ARCADE.DOOR; return g.area === 'city' && !this.cityBusy(g) && U.dist(g.player.x, g.player.y, D.x, D.y) < d; },
  at(g, spot, d = CFG.ARCADE.REACH) { return U.dist(g.player.x, g.player.y, spot.x, spot.y) < d; },
  onDancePad(g) { const D = CFG.ARCADE.DANCE, p = g.player; return g.area === 'arcade' && Math.abs(p.x - D.x) < D.half && Math.abs(p.y - D.y) < D.half; },
  tri(u) { return 1 - Math.abs((((u % 2) + 2) % 2) - 1); },
  rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; },
  cabinet(key) { return CFG.ARCADE.CABINETS.find((c) => c.key === key); },

  // ---------- game hooks ----------
  defaults: { arcade: { seen: false, tokens: 0, prizes: 0, photos: 0, pinball: 0, plays: 0, danced: false, best: { invaders: 0, racer: 0, pong: 0, pinball: 0 } } },
  build(g) {
    if (!g.s.arcade) g.s.arcade = JSON.parse(JSON.stringify(this.defaults.arcade));
    if (!g.s.arcade.best) g.s.arcade.best = JSON.parse(JSON.stringify(this.defaults.arcade.best));
    this.st = {
      fade: 0, flash: 0, play: null, photo: null, notes: [], lastBlip: -1,
      dance: { on: false, t: 0, beat: -1 },
      pin: { t: 0, bump: [0, 0, 0] },
    };
  },
  home(g) { if (!this.st) return; this.st.play = null; this.st.photo = null; this.st.fade = 0; this.st.flash = 0; this.st.dance.on = false; this.st.notes = []; },
  obstacles(g) {
    if (g.area !== 'arcade') return [];
    const A = CFG.ARCADE, R = A.ROOM, w = A.WALL, P = A.PINBALL, C = A.CLAW, K = A.COUNTER, B = A.BOOTH, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: R.x0, y: R.y0, w: R.x1 - R.x0, h: 60 });                       // the whole row of machines along the top wall
    o.push({ x: P.x, y: P.y, w: P.w, h: P.h }, { x: C.x, y: C.y, w: C.w, h: C.h });
    o.push({ x: R.x0, y: K.y0 - 6, w: K.x1 - R.x0, h: K.y1 - K.y0 + 12 });     // the counter and the clerk's lane behind it
    o.push({ x: B.x, y: B.y, w: B.w, h: B.h });
    return o;
  },
  free(g, x, y) {
    const R = CFG.ARCADE.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.obstacles(g)) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // a save or a push that left the chef in a wall or inside a machine goes back onto the door mat
  rescue(g) {
    const p = g.player, E = CFG.ARCADE.EXIT;
    if (this.free(g, p.x, p.y)) return false;
    p.x = E.x; p.y = E.y - 8; p.moving = false;
    if (this.st.play) this.st.play.hold = { x: p.x, y: p.y };
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player;
    st.fade = Math.max(0, st.fade - dt); st.flash = Math.max(0, st.flash - dt);
    if (st.photo) { st.photo.t += dt; if (st.photo.t >= st.photo.dur) st.photo = null; }
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.6);
    if (g.area !== 'arcade') { st.play = null; st.dance.on = false; return; }
    this.rescue(g);
    // the little pinball table in the room keeps its ball rolling as attract mode
    const pin = st.pin; pin.t += dt * 0.9;
    for (let i = 0; i < 3; i++) pin.bump[i] = Math.max(0, pin.bump[i] - dt);
    // a game in progress: the chef stays at the machine until it is over
    if (st.play) {
      const pl = st.play; p.x = pl.hold.x; p.y = pl.hold.y; p.moving = false; p.facing = pl.facing;
      if (pl.game) this.stepGame(g, pl, dt);
      else {
        pl.t += dt;
        if (pl.kind === 'booth') for (const at of [0.7, 1.4, 2.1]) if (pl.t - dt < at && pl.t >= at) { st.flash = 0.25; pl.flashes = (pl.flashes || 0) + 1; }
        if (pl.t >= pl.dur) { this.finishPlay(g, pl); st.play = null; }
      }
    }
    // the dance pad: stand on it and the arrows light up to a beat; the chef bobs along
    const D = st.dance, on = !st.play && this.onDancePad(g);
    if (on) {
      if (!D.on) { D.on = true; D.t = 0; D.beat = -1; g.s.arcade.danced = true; Sfx.ding(); Haptics.tap(); }
      D.t += dt;
      const beat = Math.floor(D.t * 2) % 4;
      if (beat !== D.beat) { D.beat = beat; st.notes.push({ x: p.x + U.rand(-16, 16), y: p.y - 52, ch: U.pick(['♪', '♫', '♩']), t: 0, col: U.pick(['#ff4fd8', '#3ff0ff', '#ffe94f']) }); }
      if (!p.moving) { p.moving = true; p.bob += dt * 9; }   // the core draws a stepping, bobbing chef while "moving"
    } else D.on = false;
  },
  action(g) {
    if (!this.st) return null;
    const A = CFG.ARCADE, st = this.st;
    if (g.area === 'city') return this.atDoor(g, 30) ? { label: '🚪 Go inside', run: (gg) => this.enter(gg) } : null;
    if (g.area !== 'arcade') return null;
    if (st.play) {
      const pl = st.play;
      if (!pl.game) return { label: { claw: '🧸 Grabbing…', booth: '📸 Smile…' }[pl.kind], run: () => {} };
      if (pl.over > 0) return { label: '⭐ Great game!', run: () => {} };
      if (pl.key === 'pinball') { const G = pl.game; return G.at === 'plunger' ? { label: '🪩 Launch!', run: () => ArcadeGames.pinball.launch(G, this) } : { label: '⚡ Flip!', run: () => { G.btnFlip = 0.22; } }; }
      return { label: '🚪 Stop playing', run: (gg) => this.finishGame(gg, pl) };
    }
    if (this.at(g, A.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.at(g, A.CLAW.spot)) return { label: '🧸 Grab a prize', run: (gg) => this.startPlay(gg, 'claw', A.CLAW.spot) };
    if (this.at(g, A.PINBALL.spot)) return { label: '🪩 Play pinball', run: (gg) => this.startPlay(gg, 'pinball', A.PINBALL.spot, 'pinball') };
    if (this.at(g, A.BOOTH.spot)) return { label: '📸 Take a photo', run: (gg) => this.startPlay(gg, 'booth', A.BOOTH.spot) };
    for (const c of A.CABINETS) if (this.at(g, c.spot)) return { label: `${c.ico} Play`, run: (gg) => this.startPlay(gg, 'cab', c.spot, c.key) };
    return null;
  },
  enter(g) {
    const E = CFG.ARCADE.EXIT, p = g.player;
    g.area = 'arcade'; p.x = E.x; p.y = E.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.arcade.seen) { g.s.arcade.seen = true; g.toast('🕹️ Welcome to the Arcade!', true); }
  },
  leave(g) {
    const D = CFG.ARCADE.DOOR, p = g.player;
    g.area = 'city'; p.x = D.x; p.y = D.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.dance.on = false; Sfx.drop();
  },
  // kind: 'cab' | 'pinball' (big-screen games, key names the game), 'claw' | 'booth' (short animations in the room)
  startPlay(g, kind, spot, key) {
    const st = this.st, a = g.s.arcade, p = g.player, A = CFG.ARCADE;
    if (st.play) return;
    const pl = { kind, key, t: 0, dur: A.PLAY, hold: { x: spot.x, y: spot.y }, facing: kind === 'booth' ? 1 : p.facing, flashes: 0, score: 0, over: 0, bump: 0, game: null, newBest: false, sparks: [] };
    if (kind === 'claw') { pl.dur = 2.4; pl.x0 = this.clawSweepX(g.time); pl.plush = this.nearestSlot(pl.x0); }   // it grabs whatever is under it
    if (kind === 'cab' || kind === 'pinball') { pl.dur = A.ROUND; pl.game = ArcadeGames[key].init(); }
    st.play = pl; p.x = spot.x; p.y = spot.y; p.moving = false;
    a.plays++;
    if (a.tokens > 0) { a.tokens--; g.floats.push({ x: p.x, y: p.y - 46, text: '🪙', color: '#ffe94f', t: 0, dur: 0.9 }); }
    Sfx.pickup(); Haptics.tap();
  },
  // the claw and the photo booth: a timed animation, then a prize or a photo
  finishPlay(g, pl) {
    const a = g.s.arcade, p = g.player, A = CFG.ARCADE;
    let text = '⭐ High score!';
    if (pl.kind === 'claw') { a.prizes++; text = 'You got a prize! 🧸'; g.fx.push({ kind: 'sparkle', x0: A.CLAW.x + 17, y0: A.CLAW.y + 70, x1: A.CLAW.x + 17, y1: A.CLAW.y + 70, t: 0, dur: 0.8 }); }
    else if (pl.kind === 'booth') { a.photos++; text = '📸 Say cheese!'; this.st.photo = { t: 0, dur: 3 }; }
    g.floats.push({ x: p.x, y: p.y - 50, text, color: '#ffe08a', t: 0, dur: 1.8, big: true });
    Sfx.ding(); Haptics.success();
  },
  // ---------- the big-screen games: one fixed step, the end, the card ----------
  stepGame(g, pl, dt) {
    const def = ArcadeGames[pl.key];
    pl.bump = Math.max(0, pl.bump - dt * 3);
    if (pl.over > 0) {
      pl.over -= dt;
      for (const s of pl.sparks) s.t += dt;
      if (pl.over <= 0) { this.closeGame(g, pl); }
      return;
    }
    pl.t += dt;
    def.step(pl.game, Input.axis(), dt, this, pl, g);
    if (pl.t >= pl.dur || def.goal(pl.game)) this.finishGame(g, pl);
  },
  // the round is over (time, goal or "Stop playing"): save the best, show the card for a moment
  finishGame(g, pl) {
    if (pl.over > 0) return;
    const a = g.s.arcade, PF = CFG.ARCADE.PF;
    pl.over = CFG.ARCADE.CARD; pl.goal = ArcadeGames[pl.key].goal(pl.game);
    pl.newBest = pl.score > (a.best[pl.key] || 0);
    if (pl.newBest) a.best[pl.key] = pl.score;
    if (pl.key === 'pinball') a.pinball++;
    for (let i = 0; i < 36; i++) pl.sparks.push({ x: U.rand(10, PF.w - 10), y: U.rand(10, PF.h - 10), t: -U.rand(0, 1.4), dur: 0.7, s: U.rand(5, 11), col: U.pick(['#ffe94f', '#fff', '#ff4fd8', '#3ff0ff']) });
    Sfx.tone(784, 0.14, 'triangle', 0.05); setTimeout(() => Sfx.tone(1175, 0.3, 'triangle', 0.05), 120);   // one short flourish
    Haptics.success();
  },
  closeGame(g, pl) {
    const p = g.player;
    this.st.play = null;
    g.floats.push({ x: p.x, y: p.y - 50, text: `⭐ Score ${pl.score}`, color: '#ffe08a', t: 0, dur: 1.8, big: true });
  },
  addScore(pl, n) { pl.score += n; pl.bump = 1; },
  blip(freq, dur, type, gain, slide) { const t = performance.now(); if (this.st.lastBlip >= 0 && t - this.st.lastBlip < 90) return; this.st.lastBlip = t; Sfx.tone(freq, dur, type, gain, slide); },
  burst(G, x, y, n, cols) { for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + Math.random(), sp = U.rand(60, 160); G.sparks.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, dur: U.rand(0.4, 0.7), s: U.rand(3, 7), col: U.pick(cols) }); } },
  text(G, x, y, text, col) { G.texts.push({ x, y, text, col, t: 0, dur: 1 }); },
  stepFx(G, dt) {
    for (const s of G.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; }
    G.sparks = G.sparks.filter((s) => s.t < s.dur);
    for (const x of G.texts) x.t += dt;
    G.texts = G.texts.filter((x) => x.t < x.dur);
  },
  drawFx(ctx, r, G) {
    for (const s of G.sparks) { const k = s.t / s.dur; ctx.globalAlpha = 1 - k; ctx.fillStyle = s.col; this.drawStar(ctx, s.x, s.y, s.s * (1 - k * 0.5), s.s * 0.4, 4); }
    ctx.globalAlpha = 1;
    for (const x of G.texts) { const k = x.t / x.dur; ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.font = r.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#2b1d14'; ctx.strokeText(x.text, x.x, x.y - k * 30); ctx.fillStyle = x.col; ctx.fillText(x.text, x.x, x.y - k * 30); }
    ctx.globalAlpha = 1;
  },
  // a ball against a capsule (segment + radius): pushed out and bounced; returns where along the segment it hit (0..1) or false
  hitSeg(b, x1, y1, x2, y2, rad, rest) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const k = U.clamp(((b.x - x1) * dx + (b.y - y1) * dy) / L2, 0, 1), px = x1 + dx * k, py = y1 + dy * k;
    const ddx = b.x - px, ddy = b.y - py, d = Math.hypot(ddx, ddy), R = rad + b.r;
    if (d >= R || d === 0) return false;
    const nx = ddx / d, ny = ddy / d; b.x = px + nx * R; b.y = py + ny * R;
    const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + rest) * vn * nx; b.vy -= (1 + rest) * vn * ny; }
    return k;
  },
  hint(g) {
    if (!this.st) return undefined;
    if (g.area === 'city') return this.atDoor(g, 64) ? { text: 'Go inside the Arcade! 🕹️', target: CFG.ARCADE.DOOR } : undefined;
    if (g.area !== 'arcade') return undefined;
    const A = CFG.ARCADE, st = this.st, a = g.s.arcade;
    if (st.play) return st.play.game ? null : { text: { claw: 'Grabbing a prize… 🧸', booth: 'Smile! 📸' }[st.play.kind], target: null };
    if (st.dance.on) return { text: 'Dance to the beat! 💃', target: null };
    if (this.at(g, A.CLAW.spot)) return { text: 'Press the button to grab a prize! 🧸', target: null };
    if (this.at(g, A.PINBALL.spot)) return { text: 'Press the button to play pinball! 🪩', target: null };
    if (this.at(g, A.BOOTH.spot)) return { text: 'Press the button for a photo! 📸', target: null };
    for (const c of A.CABINETS) if (this.at(g, c.spot)) return { text: `Press the button to play! ${c.ico}`, target: null };
    if (this.at(g, A.TOKEN_PAD, 70)) return { text: 'Stand on the circle for tokens 🪙', target: null };
    if (!a.prizes) return { text: 'Try the claw machine! 🧸', target: A.CLAW.spot };
    if (!a.danced) return { text: 'Step on the dance pad! 🕺', target: A.DANCE };
    if (!a.pinball) return { text: 'Play pinball! 🪩', target: A.PINBALL.spot };
    if (!a.photos) return { text: 'Take a photo in the booth! 📸', target: A.BOOTH.spot };
    if (this.at(g, A.EXIT, 30)) return { text: 'Press the button to go outside 🚪', target: null };
    return { text: 'So many games to play! 🕹️', target: null };
  },
  pads(g) {
    if (g.area !== 'arcade') return [];
    const a = g.s.arcade;
    return [{ key: 'arcadeTokens', label: 'Token Bag', ico: '🪙', pos: CFG.ARCADE.TOKEN_PAD, price: 2, sub: `${a.tokens} tokens` }];
  },
  onPad(g, pad) {
    g.s.arcade.tokens += 10;
    g.floats.push({ x: g.player.x, y: g.player.y - 50, text: '🪙 +10 tokens!', color: '#ffe94f', t: 0, dur: 1.6, big: true });
  },

  // ---------- geometry shared by the live art ----------
  bumpers() { const P = CFG.ARCADE.PINBALL, fx = P.x + 6, fy = P.y + 26; return [{ x: fx + 16, y: fy + 16, c: '#ff4fd8' }, { x: fx + 46, y: fy + 16, c: '#3ff0ff' }, { x: fx + 31, y: fy + 34, c: '#ffe94f' }]; },
  ball(t) { const P = CFG.ARCADE.PINBALL, fx = P.x + 6, fy = P.y + 26, fw = P.w - 12, fh = P.h - 32; return { x: fx + fw / 2 + Math.sin(t * 1.9) * (fw / 2 - 8), y: fy + fh / 2 - 6 + Math.sin(t * 2.7 + 1) * (fh / 2 - 12) }; },
  plushSlots() { const C = CFG.ARCADE.CLAW; return [0, 1, 2, 3].map((i) => ({ x: C.x + 18 + i * 19, y: C.y + 46 })); },
  // the claw sweeps left and right over the plushies on its own; the button drops it where it is
  clawSweepX(t) { const C = CFG.ARCADE.CLAW; return C.x + 18 + this.tri(t * 0.45) * 57; },
  nearestSlot(x) { let best = 0, bd = Infinity; this.plushSlots().forEach((s, i) => { const d = Math.abs(s.x - x); if (d < bd) { bd = d; best = i; } }); return best; },
  // where the claw is during a grab: { x, y, open (0..1), carry (plush index or -1), drop (0..1 fall of the prize into the chute) }
  clawPose(pl, time) {
    const C = CFG.ARCADE.CLAW, rest = { x: C.x + C.w - 18, y: C.y + 14 }, chute = { x: C.x + 17 };
    if (!pl) return { x: this.clawSweepX(time), y: rest.y, open: 1, carry: -1, drop: 0 };
    const s = this.plushSlots()[pl.plush], t = pl.t, e = U.easeOut, x = U.lerp(pl.x0, s.x, e(Math.min(1, t / 0.25)));
    if (t < 0.55) return { x, y: U.lerp(rest.y, s.y - 8, e(t / 0.55)), open: 1, carry: -1, drop: 0 };
    if (t < 0.85) return { x, y: s.y - 8, open: 1 - (t - 0.55) / 0.3, carry: -1, drop: 0 };
    if (t < 1.35) return { x, y: U.lerp(s.y - 8, rest.y, e((t - 0.85) / 0.5)), open: 0, carry: pl.plush, drop: 0 };
    if (t < 1.9) return { x: U.lerp(s.x, chute.x, e((t - 1.35) / 0.55)), y: rest.y, open: 0, carry: pl.plush, drop: 0 };
    return { x: chute.x, y: rest.y, open: Math.min(1, (t - 1.9) / 0.2), carry: -1, drop: Math.min(1, (t - 1.9) / 0.4) };
  },

  // ======================= outside: the sign and the blinking door =======================
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.building(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🕹️ ARCADE';
    // a dark glass door with a glowing joystick window instead of the plain wooden one
    ctx.fillStyle = '#1b1038'; ctx.fillRect(cx - 11, gy + 10, 22, 30);
    ctx.fillStyle = 'rgba(63,240,255,0.75)'; ctx.fillRect(cx - 7, gy + 14, 14, 11);
    ctx.fillStyle = '#ff4fd8'; ctx.fillRect(cx - 2, gy + 17, 4, 5); ctx.fillStyle = '#ffe94f'; ctx.beginPath(); ctx.arc(cx, gy + 16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(cx + 6, gy + 30, 2, 0, Math.PI * 2); ctx.fill();
    // the sign, in the City's style
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
  },
  doorBulbs() {
    const b = this.building(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, pts = [];
    for (const dx of [-8, 0, 8]) pts.push([cx + dx, gy + 22.5]);
    for (const dy of [23, 31, 39]) { pts.push([cx + 16, gy + dy]); pts.push([cx - 16, gy + dy]); }
    return pts;
  },
  drawDoorLights(r, g) {
    const ctx = r.ctx, t = g.time, b = this.building(), cx = (b.x0 + b.x1) / 2, cols = ['#ff4fd8', '#3ff0ff', '#ffe94f'], step = Math.floor(t * 4);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const grd = ctx.createRadialGradient(cx, b.y1 + 4, 2, cx, b.y1 + 4, 42);
    grd.addColorStop(0, `rgba(190,120,255,${(0.18 + 0.14 * pulse).toFixed(3)})`); grd.addColorStop(1, 'rgba(190,120,255,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(cx, b.y1 + 4, 42, 18, 0, 0, Math.PI * 2); ctx.fill();
    this.doorBulbs().forEach(([x, y], i) => {
      const on = (i + step) % 3 === 0, col = cols[i % 3];
      if (on) { ctx.fillStyle = this.rgba(col, 0.35); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = on ? col : this.rgba(col, 0.3); ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2); ctx.fill();
    });
  },

  // ======================= inside: the static room =======================
  bgKey(g) { return g.s && g.s.arcade ? 'arcade:' + Math.min(8, g.s.arcade.prizes) : ''; },
  paint: { arcade(r, g) { ArcadeExt.paintRoom(r, g); } },
  drawStar(ctx, x, y, ro, ri, n = 4) {
    ctx.beginPath();
    for (let k = 0; k < n * 2; k++) { const a = -Math.PI / 2 + k * Math.PI / n, rr = k % 2 ? ri : ro; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  },
  drawPlush(ctx, x, y, kind, s = 1) {
    const col = { bear: '#c17f3a', bunny: '#f7b7d0', dino: '#6bd36b', cat: '#ffb347', duck: '#ffe94f' }[kind] || '#c17f3a';
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col;
    if (kind === 'bunny') { ctx.beginPath(); ctx.ellipse(-4, -14, 2.6, 7, -0.15, 0, Math.PI * 2); ctx.ellipse(4, -14, 2.6, 7, 0.15, 0, Math.PI * 2); ctx.fill(); }
    else if (kind === 'dino') { ctx.beginPath(); for (const dx of [-5, 0, 5]) { ctx.moveTo(dx - 3, -7); ctx.lineTo(dx, -13); ctx.lineTo(dx + 3, -7); } ctx.closePath(); ctx.fill(); }
    else if (kind === 'cat') { ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-6, -14); ctx.lineTo(-1, -9); ctx.closePath(); ctx.moveTo(8, -6); ctx.lineTo(6, -14); ctx.lineTo(1, -9); ctx.closePath(); ctx.fill(); }
    else if (kind === 'duck') { ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(0, -1, 5, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; }
    else { ctx.beginPath(); ctx.arc(-6, -9, 3.2, 0, Math.PI * 2); ctx.arc(6, -9, 3.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(0, 7, 8, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -3, 8, 0, Math.PI * 2); ctx.fill();
    if (kind === 'bear' || kind === 'cat') { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-3, -4, 1.1, 0, Math.PI * 2); ctx.arc(3, -4, 1.1, 0, Math.PI * 2); ctx.fill();
    if (kind !== 'duck') { ctx.beginPath(); ctx.arc(0, -0.5, 1.1, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  paintRoom(r, g) {
    const ctx = r.ctx, A = CFG.ARCADE, R = A.ROOM, w = A.WALL, W = A.WORLD;
    let seed = 20240601;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const neon = ['#3ff0ff', '#ff4fd8', '#ffe94f', '#8bff5a'];
    // outside the walls: the dark of the building
    ctx.fillStyle = '#120a26'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // the carpet: deep purple with neon stars, squiggles and dots
    ctx.fillStyle = '#1b1038'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let i = 0; i < 150; i++) {
      const x = R.x0 + 8 + rnd() * (R.x1 - R.x0 - 16), y = R.y0 + 8 + rnd() * (R.y1 - R.y0 - 16), col = neon[Math.floor(rnd() * 4)], k = rnd();
      ctx.fillStyle = this.rgba(col, 0.75); ctx.strokeStyle = this.rgba(col, 0.75); ctx.lineWidth = 2;
      if (k < 0.45) this.drawStar(ctx, x, y, 3 + rnd() * 4, 1.2, 4);
      else if (k < 0.7) { ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x - 3, y - 8, x, y); ctx.quadraticCurveTo(x + 3, y + 8, x + 8, y); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(x, y, 1.5 + rnd() * 1.5, 0, Math.PI * 2); ctx.fill(); }
    }
    // the walls, with a neon strip along the inside edge
    ctx.fillStyle = '#2a1a4e'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#3a2866'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, 6); ctx.fillRect(R.x0 - w, R.y1 + w - 6, R.x1 - R.x0 + 2 * w, 6);
    ctx.save(); ctx.shadowColor = '#3ff0ff'; ctx.shadowBlur = 10; ctx.strokeStyle = '#3ff0ff'; ctx.lineWidth = 2.5; ctx.strokeRect(R.x0 - 1, R.y0 - 1, R.x1 - R.x0 + 2, R.y1 - R.y0 + 2); ctx.restore();
    // the neon ARCADE sign on the top wall
    ctx.save(); ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 14; ctx.fillStyle = '#ff7ae6'; ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🕹️ ARCADE 👾', (R.x0 + R.x1) / 2, R.y0 - w / 2 + 1); ctx.restore();
    // cabinets, pinball, claw machine, gumball machine along the top wall
    for (const c of A.CABINETS) this.paintCabinet(r, c);
    this.paintPinball(r);
    this.paintClaw(r);
    this.paintGumball(r);
    // prize counter on the left wall, a shelf of plushies behind it
    const K = A.COUNTER;
    ctx.fillStyle = '#1e1540'; ctx.fillRect(R.x0 - w + 3, K.y0 - 4, w - 3, K.y1 - K.y0 + 8);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#5b3fa0'; ctx.fillRect(R.x0 - w + 3, K.y0 + 18 + i * 24, w - 3, 3); this.drawPlush(ctx, R.x0 - w / 2 + 1, K.y0 + 12 + i * 24, A.PLUSH[i], 0.62); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(K.x0 + 4, K.y0 + 4, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#4b2d8a'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#8e5bd1'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0 - 8, K.y1 - K.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0 - 8, 3);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(K.x1 - 8, K.y0 + 6, 6, K.y1 - K.y0 - 12);   // glass front
    ctx.save(); ctx.translate(K.x1 - 4, (K.y0 + K.y1) / 2); ctx.rotate(Math.PI / 2); ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -26, -9, 52, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧸 PRIZES', 0, -2); ctx.restore();
    ctx.fillStyle = '#ffe94f'; ctx.beginPath(); ctx.arc(K.x0 + 14, K.y0 + 20, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.fillText('🪙', K.x0 + 14, K.y0 + 20);   // a token jar
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, K.x0 + 6, K.y1 - 30, 16, 20, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(K.x0 + 9, K.y1 - 26, 10, 8);   // till
    // the photo booth on the right wall
    this.paintBooth(r);
    // the dance pad on the floor
    this.paintDancePad(r);
    // the door on the bottom wall, the mat inside it, an EXIT sign
    const E = A.EXIT;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, E.x - 24, R.y1 - 2, 48, w + 2, 3); ctx.fill();
    ctx.fillStyle = '#1b1038'; U.roundRect(ctx, E.x - 21, R.y1 + 1, 42, w - 2, 3); ctx.fill();
    ctx.fillStyle = 'rgba(63,240,255,0.7)'; U.roundRect(ctx, E.x - 14, R.y1 + 5, 28, 8, 2); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 15, R.y1 + 15, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, E.x - 16, R.y1 - 16, 32, 11, 2); ctx.fill(); ctx.fillStyle = '#eaffea'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, R.y1 - 10.5);
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, E.x - 24, E.y - 9, 48, 18, 4); ctx.fill(); ctx.fillStyle = '#e4572e'; U.roundRect(ctx, E.x - 20, E.y - 6, 40, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('WELCOME', E.x, E.y + 0.5);
    // the prizes you won sit in a row by the door
    const won = Math.min(8, (g.s.arcade && g.s.arcade.prizes) || 0);
    for (let i = 0; i < won; i++) this.drawPlush(ctx, E.x + 50 + i * 26, R.y1 - 14, A.PLUSH[i % 5], 0.85);
  },
  paintCabinet(r, c) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h);
    ctx.fillStyle = '#2d2b55'; U.roundRect(ctx, c.x, c.y, c.w, c.h, 4); ctx.fill();
    ctx.fillStyle = c.color; ctx.fillRect(c.x, c.y + 12, 5, c.h - 12); ctx.fillRect(c.x + c.w - 5, c.y + 12, 5, c.h - 12);
    ctx.fillStyle = c.color; U.roundRect(ctx, c.x, c.y, c.w, 12, 4); ctx.fill(); ctx.fillRect(c.x, c.y + 8, c.w, 4);
    ctx.fillStyle = '#1b1038'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.title, c.x + c.w / 2, c.y + 6.5);
    ctx.fillStyle = this.rgba(c.color, 0.25); ctx.fillRect(c.x + 6, c.y + 13, c.w - 12, 30);
    ctx.fillStyle = '#061018'; ctx.fillRect(c.x + 8, c.y + 15, c.w - 16, 26);
    ctx.fillStyle = '#3b3a66'; ctx.fillRect(c.x + 5, c.y + 44, c.w - 10, 12);
    ctx.fillStyle = '#9a9ab8'; ctx.fillRect(c.x + 15, c.y + 46, 2, 6); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(c.x + 16, c.y + 46, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe94f'; ctx.beginPath(); ctx.arc(c.x + c.w - 24, c.y + 50, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3ff0ff'; ctx.beginPath(); ctx.arc(c.x + c.w - 14, c.y + 50, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1038'; ctx.fillRect(c.x + c.w / 2 - 3, c.y + 47, 6, 2);   // coin slot
  },
  paintPinball(r) {
    const ctx = r.ctx, P = CFG.ARCADE.PINBALL, fx = P.x + 6, fy = P.y + 26, fw = P.w - 12, fh = P.h - 32;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(P.x + 4, P.y + 5, P.w, P.h);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, P.x, P.y, P.w, P.h, 4); ctx.fill();
    ctx.fillStyle = '#1b1038'; U.roundRect(ctx, P.x + 3, P.y + 3, P.w - 6, 20, 3); ctx.fill();   // backglass
    ctx.fillStyle = '#ff7ae6'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★ PIZZA BALL ★', P.x + P.w / 2, P.y + 8);
    ctx.fillStyle = '#143a5a'; ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = '#1d4f78'; ctx.fillRect(fx + 4, fy + 4, fw - 8, fh - 14);
    ctx.strokeStyle = '#3ff0ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx + fw - 6, fy + 2); ctx.lineTo(fx + fw - 6, fy + fh - 14); ctx.stroke();   // the launch lane
    ctx.fillStyle = '#ffe94f'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(fx + 8 + i * 14, fy + fh - 4, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(fx + fw - 6, fy + fh - 6, 3, 0, Math.PI * 2); ctx.fill();   // plunger knob
  },
  paintClaw(r) {
    const ctx = r.ctx, C = CFG.ARCADE.CLAW;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(C.x + 4, C.y + 5, C.w, C.h);
    ctx.fillStyle = '#ff7ad0'; U.roundRect(ctx, C.x, C.y, C.w, C.h, 5); ctx.fill();
    ctx.fillStyle = '#d94fa8'; ctx.fillRect(C.x, C.y + 58, C.w, 4);
    ctx.fillStyle = 'rgba(190,240,255,0.22)'; ctx.fillRect(C.x + 6, C.y + 6, C.w - 12, 50);   // the glass
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(C.x + 8, C.y + 8, 6, 44);
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(C.x + 6, C.y + 6, C.w - 12, 4);                 // the gantry rail
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(C.x + 8, C.y + 64, 20, 14); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(C.x + 10, C.y + 66, 16, 10);   // prize chute
    ctx.fillStyle = '#ffe94f'; ctx.font = r.font(5.5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PRIZE', C.x + 18, C.y + 71);
    ctx.fillStyle = '#9a9ab8'; ctx.fillRect(C.x + 52, C.y + 66, 2, 8); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(C.x + 53, C.y + 66, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3ff0ff'; ctx.beginPath(); ctx.arc(C.x + 72, C.y + 71, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.fillText('🧸 CLAW', C.x + C.w / 2, C.y - 7);
  },
  paintGumball(r) {
    const ctx = r.ctx, G = CFG.ARCADE.GUMBALL;
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, G.x - 9, G.y, 18, 20, 3); ctx.fill();
    ctx.fillStyle = 'rgba(190,240,255,0.4)'; ctx.beginPath(); ctx.arc(G.x, G.y - 8, 12, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#ff4fd8', '#3ff0ff', '#ffe94f', '#8bff5a', '#ff9f1c'][i % 5]; ctx.beginPath(); ctx.arc(G.x - 7 + (i % 3) * 7, G.y - 13 + Math.floor(i / 3) * 6, 2.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(G.x - 4, G.y + 8, 8, 4);
  },
  paintBooth(r) {
    const ctx = r.ctx, B = CFG.ARCADE.BOOTH;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(B.x + 4, B.y + 5, B.w, B.h);
    ctx.fillStyle = '#243a7a'; U.roundRect(ctx, B.x, B.y, B.w, B.h, 4); ctx.fill();
    ctx.fillStyle = '#ff4fd8'; U.roundRect(ctx, B.x, B.y, B.w, 16, 4); ctx.fill(); ctx.fillRect(B.x, B.y + 12, B.w, 4);
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📸 PHOTOS', B.x + B.w / 2, B.y + 8);
    ctx.fillStyle = '#d62828'; ctx.fillRect(B.x + 3, B.y + 18, 22, B.h - 24);   // the curtain
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 4; i++) ctx.fillRect(B.x + 6 + i * 5.5, B.y + 18, 2, B.h - 24);
    ctx.fillStyle = '#ffe94f'; ctx.fillRect(B.x + 3, B.y + 18, 22, 3);
    ctx.fillStyle = '#9fd8ff'; ctx.fillRect(B.x + 32, B.y + 24, 24, 20);   // the little screen
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(B.x + 32, B.y + 54, 24, 4);     // the photo slot
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(5.5); ctx.fillText('SMILE!', B.x + 44, B.y + 66);
  },
  paintDancePad(r) {
    const ctx = r.ctx, D = CFG.ARCADE.DANCE, h = D.half, s = (h * 2) / 3;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, D.x - h + 3, D.y - h + 4, h * 2, h * 2, 6); ctx.fill();
    ctx.fillStyle = '#111026'; U.roundRect(ctx, D.x - h - 3, D.y - h - 3, h * 2 + 6, h * 2 + 6, 6); ctx.fill();
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      const x = D.x - h + gx * s, y = D.y - h + gy * s, mid = (gx === 1) !== (gy === 1);
      ctx.fillStyle = mid ? '#2a2050' : gx === 1 ? '#3a3a5a' : '#242044'; ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
      if (!mid && !(gx === 1)) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.strokeStyle = 'rgba(63,240,255,0.7)'; ctx.lineWidth = 2; U.roundRect(ctx, D.x - h - 3, D.y - h - 3, h * 2 + 6, h * 2 + 6, 6); ctx.stroke();
    ctx.fillStyle = '#ff7ae6'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💃 DANCE 🕺', D.x, D.y + h + 10);
  },

  // ======================= inside: the live art =======================
  dynamic(r, g) {
    if (!this.st) return;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) { this.drawDoorLights(r, g); return; }
    if (g.area !== 'arcade') return;
    const ctx = r.ctx, A = CFG.ARCADE, st = this.st, t = g.time, pl = st.play;
    // chasing bulbs along the top wall
    const R = A.ROOM, step = Math.floor(t * 5);
    for (let x = R.x0 + 6, i = 0; x < R.x1; x += 14, i++) { const on = (i + step) % 4 === 0; ctx.fillStyle = on ? ['#ff4fd8', '#3ff0ff', '#ffe94f'][i % 3] : 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(x, R.y0 - A.WALL + 3, 2, 0, Math.PI * 2); ctx.fill(); }
    for (const c of A.CABINETS) this.drawScreen(r, g, c, t, pl && pl.kind === 'cab' && pl.key === c.key ? pl : null);
    this.drawPinballLive(r, g);
    this.drawClawLive(r, g);
    this.drawDanceLive(r, g);
    // the photo booth's flash bulb
    const B = A.BOOTH, fl = st.flash / 0.25;
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.5 * fl).toFixed(3)})`; ctx.beginPath(); ctx.arc(B.x + 44, B.y + 34, 26 * fl + 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = fl > 0 ? '#fff' : '#fff3b0'; ctx.beginPath(); ctx.arc(B.x + 44, B.y + 20, 2.5 + fl * 2, 0, Math.PI * 2); ctx.fill();
  },
  // the little screen on each cabinet: attract mode (with the best score on the backglass) or the live score while playing
  drawScreen(r, g, c, t, pl) {
    const ctx = r.ctx, sx = c.x + 8, sy = c.y + 15, sw = c.w - 16, sh = 26, fast = pl ? 3 : 1, best = (g.s.arcade && g.s.arcade.best && g.s.arcade.best[c.key]) || 0;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    ctx.fillStyle = '#061018'; ctx.fillRect(sx, sy, sw, sh);
    if (c.key === 'invaders') {
      const sway = Math.sin(t * 2 * fast) * 5;
      for (let i = 0; i < 10; i++) {
        const x = sx + 9 + (i % 5) * 8 + sway, y = sy + 5 + Math.floor(i / 5) * 6;
        ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(x - 3, y - 2.5); ctx.lineTo(x + 3, y - 2.5); ctx.lineTo(x, y + 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 1, y - 1.5, 2, 1.5);
      }
      const shipX = sx + sw / 2 + Math.sin(t * 1.3 * fast) * 14;
      ctx.fillStyle = '#fff'; ctx.fillRect(shipX - 4, sy + sh - 5, 8, 3); ctx.fillRect(shipX - 2, sy + sh - 8, 4, 3);
      ctx.fillStyle = '#ffe94f'; ctx.fillRect(shipX - 0.5, sy + sh - 9 - ((t * 40 * fast) % (sh - 10)), 1.5, 4);
    } else if (c.key === 'racer') {
      ctx.fillStyle = '#2f9e44'; ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = '#3b3b4a'; ctx.fillRect(sx + 10, sy, sw - 20, sh);
      ctx.fillStyle = '#ffe94f'; for (let y = -((t * 60 * fast) % 10); y < sh; y += 10) ctx.fillRect(sx + sw / 2 - 1, sy + y, 2, 5);
      for (let i = 0; i < 2; i++) { const y = ((t * 28 * fast + i * 19) % (sh + 12)) - 10, x = sx + 15 + i * 14; ctx.fillStyle = i ? '#3b7dd8' : '#ffb347'; ctx.fillRect(x, sy + y, 6, 8); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(x + 1, sy + y + 2, 4, 2); }
      const cx = sx + sw / 2 + Math.sin(t * 1.7 * fast) * 9;
      ctx.fillStyle = '#e53935'; ctx.fillRect(cx - 3, sy + sh - 10, 6, 9); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(cx - 2, sy + sh - 8, 4, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(cx - 4, sy + sh - 9, 1.5, 3); ctx.fillRect(cx + 2.5, sy + sh - 9, 1.5, 3); ctx.fillRect(cx - 4, sy + sh - 4, 1.5, 3); ctx.fillRect(cx + 2.5, sy + sh - 4, 1.5, 3);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 0; y < sh; y += 4) ctx.fillRect(sx + sw / 2 - 0.5, sy + y, 1, 2);
      const bx = sx + 3 + this.tri(t * 0.9 * fast) * (sw - 9), by = sy + 2 + this.tri(t * 1.3 * fast + 0.3) * (sh - 7);
      ctx.fillStyle = '#ffe94f'; ctx.fillRect(sx + 2, sy + 3 + this.tri(t * 1.3 * fast + 0.3 - 0.1) * (sh - 7) - 3, 2, 8); ctx.fillRect(sx + sw - 4, sy + 3 + this.tri(t * 1.3 * fast + 0.3) * (sh - 7) - 3, 2, 8);
      r.drawPizza(bx + 1.5, by + 1.5, 2.2);
    }
    ctx.font = r.font(5); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (pl) { ctx.fillStyle = '#ffe94f'; ctx.fillText(String(pl.score).padStart(4, '0'), sx + 2, sy + 1); }
    else if (best > 0) { ctx.fillStyle = '#fff'; ctx.fillText(`🏆${best}`, sx + 2, sy + 1); }
    ctx.restore();
  },
  drawPinballLive(r, g) {
    const ctx = r.ctx, P = CFG.ARCADE.PINBALL, pin = this.st.pin, t = g.time, pl = this.st.play, playing = pl && pl.key === 'pinball';
    const fx = P.x + 6, fy = P.y + 26, fw = P.w - 12, fh = P.h - 32, best = (g.s.arcade && g.s.arcade.best && g.s.arcade.best.pinball) || 0;
    // the backglass: the live score while playing, the best score (🏆) otherwise
    ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (playing) { ctx.fillStyle = '#ffe94f'; ctx.fillText(String(pl.score).padStart(5, '0'), P.x + P.w / 2, P.y + 16); }
    else { ctx.fillStyle = '#fff'; ctx.fillText(best > 0 ? `🏆 ${best}` : '00000', P.x + P.w / 2, P.y + 16); }
    this.bumpers().forEach((b, i) => {
      const lit = playing ? pl.game.bump[i] > 0 : Math.floor(t * 2) % 3 === i;
      if (lit) { ctx.fillStyle = this.rgba(b.c, 0.35); ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = lit ? b.c : this.rgba(b.c, 0.45); ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = '#ffe94f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    [-1, 1].forEach((d, i) => { const flap = playing ? (0.5 - pl.game.fl[i].ang) * 0.7 : 0, x0 = fx + fw / 2 + d * 16, y0 = fy + fh - 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - d * 11 * Math.cos(0.5 - flap), y0 + 11 * Math.sin(0.5 - flap)); ctx.stroke(); });
    ctx.lineCap = 'butt';
    const b = playing ? { x: fx + 4 + (pl.game.ball.x / CFG.ARCADE.PF.w) * (fw - 8), y: fy + 2 + (U.clamp(pl.game.ball.y, 0, 400) / CFG.ARCADE.PF.h) * (fh - 10) } : this.ball(pin.t);
    ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
  },
  drawClawLive(r, g) {
    const ctx = r.ctx, C = CFG.ARCADE.CLAW, A = CFG.ARCADE, st = this.st, pl = st.play && st.play.kind === 'claw' ? st.play : null, pose = this.clawPose(pl, g.time);
    const prizes = g.s.arcade ? g.s.arcade.prizes : 0;
    // the pile of plushies (the one in the claw hangs from it instead)
    this.plushSlots().forEach((s, i) => { if (pose.carry === i || (pose.drop > 0 && pl && pl.plush === i)) return; this.drawPlush(ctx, s.x, s.y, A.PLUSH[(prizes + i) % 5], 0.8); });
    // carriage, cable and claw
    ctx.fillStyle = '#6b6b8a'; ctx.fillRect(pose.x - 6, C.y + 5, 12, 6);
    ctx.strokeStyle = '#d0d0e0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pose.x, C.y + 11); ctx.lineTo(pose.x, pose.y); ctx.stroke();
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const spread = 0.35 + pose.open * 0.7;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(pose.x, pose.y); ctx.lineTo(pose.x + d * 8 * Math.sin(spread), pose.y + 8 * Math.cos(spread)); ctx.lineTo(pose.x + d * 4 * Math.sin(spread), pose.y + 13 * Math.cos(spread)); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#9a9ab8'; ctx.beginPath(); ctx.arc(pose.x, pose.y, 3, 0, Math.PI * 2); ctx.fill();
    if (pose.carry >= 0) this.drawPlush(ctx, pose.x, pose.y + 16, A.PLUSH[(prizes + pose.carry) % 5], 0.8);
    if (pose.drop > 0 && pl) { ctx.globalAlpha = 1 - pose.drop; this.drawPlush(ctx, C.x + 17, U.lerp(pose.y + 16, C.y + 60, pose.drop), A.PLUSH[(prizes + pl.plush) % 5], 0.8); ctx.globalAlpha = 1; }
  },
  drawDanceLive(r, g) {
    const ctx = r.ctx, D = CFG.ARCADE.DANCE, h = D.half, s = (h * 2) / 3, dn = this.st.dance, t = g.time;
    const dirs = [[1, 0, 0], [2, 1, Math.PI / 2], [1, 2, Math.PI], [0, 1, -Math.PI / 2]];   // N E S W: grid column, row, rotation
    if (dn.on) { const pulse = 0.5 + 0.5 * Math.sin(t * 6); ctx.strokeStyle = `rgba(255,79,216,${(0.4 + 0.5 * pulse).toFixed(3)})`; ctx.lineWidth = 3; U.roundRect(ctx, D.x - h - 6, D.y - h - 6, h * 2 + 12, h * 2 + 12, 8); ctx.stroke(); }
    dirs.forEach(([gx, gy, rot], i) => {
      const cx = D.x - h + gx * s + s / 2, cy = D.y - h + gy * s + s / 2, lit = dn.on && dn.beat === i;
      if (lit) { ctx.fillStyle = '#ff4fd8'; ctx.fillRect(cx - s / 2 + 1, cy - s / 2 + 1, s - 2, s - 2); }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.fillStyle = lit ? '#fff' : 'rgba(255,79,216,0.55)'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, 0); ctx.lineTo(3, 0); ctx.lineTo(3, 7); ctx.lineTo(-3, 7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  },
  entities(r, g, items) {
    if (!this.st || g.area !== 'arcade') return;
    const K = CFG.ARCADE.COUNTER, c = K.clerk, p = g.player, near = U.dist(p.x, p.y, c.x, c.y) < 110;
    items.push({ y: c.y, draw: () => {
      r.drawPerson(c.x, c.y, { shirt: '#8e5bd1', skin: '#e0ac69', hat: 'cap', capColor: '#ff4fd8', facing: 1, moving: false, bob: 0, carry: 0, bowtie: '#ffe94f', pants: '#2d3a4a' });
      if (near) r.drawBubble(c.x + 2, c.y - 62 + Math.sin(g.time * 3) * 2, () => { r.ctx.font = r.font(12); r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle'; r.ctx.fillStyle = '#2b1d14'; r.ctx.fillText('🪙🧸', 0, 0); }, 40);
    } });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'arcade') return;
    const ctx = r.ctx, st = this.st;
    // music notes rising from the dance pad
    for (const n of st.notes) { const k = n.t / 1.6; ctx.globalAlpha = 1 - k; ctx.fillStyle = n.col; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.ch, n.x + Math.sin(n.t * 5) * 4, n.y - k * 40); }
    ctx.globalAlpha = 1;
    // the photo strip sliding out of the booth
    if (st.photo) {
      const B = CFG.ARCADE.BOOTH, k = st.photo.t / st.photo.dur, slide = U.easeOut(Math.min(1, k * 2)), x = B.x + 30 - slide * 34, y = B.y + 58 + slide * 10;
      ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, y + 2, 16, 46);
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 16, 46);
      for (let i = 0; i < 3; i++) {
        const fy = y + 3 + i * 14;
        ctx.fillStyle = '#9fd8ff'; ctx.fillRect(x + 2, fy, 12, 12);
        ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x + 8, fy + 7, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 5, fy + 1, 6, 3);
        ctx.fillStyle = '#2b1d14'; ctx.fillRect(x + 6.5, fy + 6, 1, 1); ctx.fillRect(x + 8.5, fy + 6, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  },
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, st = this.st;
    if (g.area === 'arcade' && st.play && st.play.game) this.drawGame(r, g, W, H);
    if (g.area === 'arcade' && st.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.75 * st.flash / 0.25).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },

  // ======================= the big screen: a cabinet frame around the playfield =======================
  // Frame units: the playfield is PF.w × PF.h at (20, 56); marquee above, the score strip below. Scaled to fit between
  // the HUD at the top and the big button at the bottom, so it works at 390×844 as well as on a desktop.
  layout(W, H) {
    const PF = CFG.ARCADE.PF, FW = PF.w + 40, FH = PF.h + 122, top = 56, bottom = 84;
    const s = Math.min((W - 16) / FW, (H - top - bottom) / FH);
    return { s, ox: (W - FW * s) / 2, oy: top + (H - top - bottom - FH * s) / 2, FW, FH };
  },
  drawGame(r, g, W, H) {
    const ctx = r.ctx, pl = this.st.play, def = ArcadeGames[pl.key], PF = CFG.ARCADE.PF, L = this.layout(W, H), t = g.time, best = (g.s.arcade.best && g.s.arcade.best[pl.key]) || 0;
    ctx.fillStyle = 'rgba(8,4,20,0.72)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
    // the cabinet: body, neon side strips, marquee
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; U.roundRect(ctx, 6, 8, L.FW, L.FH, 18); ctx.fill();
    ctx.fillStyle = '#2d2b55'; U.roundRect(ctx, 0, 0, L.FW, L.FH, 18); ctx.fill();
    ctx.fillStyle = def.color; U.roundRect(ctx, 0, 0, L.FW, 44, 18); ctx.fill(); ctx.fillRect(0, 30, L.FW, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 42, L.FW, 2);
    for (let i = 0; i < 2; i++) { const x = i ? L.FW - 7 : 0; ctx.fillStyle = def.color; ctx.fillRect(x, 60, 7, L.FH - 80); const step = Math.floor(t * 5); for (let k = 0; k < 10; k++) { ctx.fillStyle = (k + step) % 3 === 0 ? '#fff' : 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(x + 3.5, 80 + k * ((L.FH - 120) / 9), 2, 0, Math.PI * 2); ctx.fill(); } }
    ctx.font = r.font(17); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1b1038'; ctx.fillText(`${def.ico} ${def.title}`, 16, 22);
    if (best > 0) { ctx.font = r.font(12); ctx.textAlign = 'right'; ctx.fillText(`🏆 ${best}`, L.FW - 14, 22); }
    // the bezel and the playfield
    ctx.fillStyle = '#0a0a16'; U.roundRect(ctx, 12, 48, PF.w + 16, PF.h + 16, 10); ctx.fill();
    ctx.save(); ctx.translate(20, 56); ctx.beginPath(); ctx.rect(0, 0, PF.w, PF.h); ctx.clip();
    def.draw(r, ctx, pl.game, g, this, pl);
    if (pl.over > 0) this.drawCard(r, g, pl);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.strokeRect(21, 57, PF.w - 2, PF.h - 2);   // the glass
    // the score strip: a big friendly counter and the time bar
    const sy = PF.h + 80;
    ctx.fillStyle = '#1b1038'; U.roundRect(ctx, 12, sy, PF.w + 16, 38, 10); ctx.fill();
    ctx.save(); ctx.translate(30, sy + 19); ctx.scale(1 + pl.bump * 0.25, 1 + pl.bump * 0.25);
    ctx.font = r.font(24); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe94f'; ctx.fillText(`⭐ ${pl.score}`, 0, 1); ctx.restore();
    const bw = 120, bx = PF.w + 20 - bw, left = Math.max(0, 1 - pl.t / pl.dur);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; U.roundRect(ctx, bx, sy + 13, bw, 12, 6); ctx.fill();
    if (left > 0) { ctx.fillStyle = left < 0.2 ? '#ff7a1a' : def.color; U.roundRect(ctx, bx, sy + 13, Math.max(12, bw * left), 12, 6); ctx.fill(); }
    ctx.font = r.font(12); ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText('⏱️', bx - 6, sy + 20);
    ctx.restore();
  },
  // the end-of-round card, with sparkles all over the playfield
  drawCard(r, g, pl) {
    const ctx = r.ctx, PF = CFG.ARCADE.PF, def = ArcadeGames[pl.key], k = 1 - pl.over / CFG.ARCADE.CARD, pop = U.easeOut(Math.min(1, k * 4));
    for (const s of pl.sparks) { if (s.t < 0 || s.t > s.dur) continue; const q = Math.sin((s.t / s.dur) * Math.PI); ctx.globalAlpha = q; ctx.fillStyle = s.col; this.drawStar(ctx, s.x, s.y, s.s * q, s.s * 0.35, 4); }
    ctx.globalAlpha = 1;
    const cw = 250, ch = pl.newBest ? 122 : 100, cx = PF.w / 2, cy = PF.h / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, -cw / 2 + 4, -ch / 2 + 6, cw, ch, 16); ctx.fill();
    ctx.fillStyle = '#fff8e1'; U.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 16); ctx.fill();
    ctx.strokeStyle = def.color; ctx.lineWidth = 5; U.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 16); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = r.font(24); ctx.fillStyle = '#2b1d14'; ctx.fillText('⭐ Great game!', 0, -ch / 2 + 30);
    ctx.font = r.font(22); ctx.fillStyle = '#e4572e'; ctx.fillText(`Score ${pl.score}`, 0, -ch / 2 + 66);
    if (pl.newBest) { ctx.font = r.font(15); ctx.fillStyle = '#2f9e44'; ctx.fillText('🏆 New best!', 0, -ch / 2 + 98); }
    ctx.restore();
  },

  // ======================= art for the playfields =======================
  // a cheeky vegetable: a body, two eyes looking about and a grin with a stuck-out tongue
  drawVeg(ctx, x, y, kind, col, ph) {
    ctx.fillStyle = col;
    let fy = y;
    if (kind === 'broccoli') { ctx.fillStyle = '#a8d56b'; ctx.fillRect(x - 4, y, 8, 12); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - 8, y - 2, 8, 0, Math.PI * 2); ctx.arc(x + 8, y - 2, 8, 0, Math.PI * 2); ctx.arc(x, y - 8, 8, 0, Math.PI * 2); ctx.arc(x, y - 1, 9, 0, Math.PI * 2); ctx.fill(); fy = y - 2; }
    else if (kind === 'carrot') { ctx.beginPath(); ctx.moveTo(x - 9, y - 8); ctx.lineTo(x + 9, y - 8); ctx.lineTo(x, y + 15); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3fa34d'; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.ellipse(x + dx, y - 12, 2.5, 6, dx * 0.08, 0, Math.PI * 2); ctx.fill(); } fy = y - 2; }
    else if (kind === 'tomato') { ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3fa34d'; ctx.beginPath(); ctx.ellipse(x, y - 12, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 1, y - 16, 2, 5); }
    else if (kind === 'mushroom') { ctx.fillStyle = '#f6e7c1'; U.roundRect(ctx, x - 6, y - 2, 12, 15, 4); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 2, 14, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 6, y - 8, 2.5, 0, Math.PI * 2); ctx.arc(x + 5, y - 6, 2, 0, Math.PI * 2); ctx.fill(); fy = y + 6; }
    else { ctx.beginPath(); ctx.ellipse(x, y + 2, 10, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3fa34d'; ctx.beginPath(); ctx.ellipse(x, y - 11, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 1, y - 16, 2, 5); fy = y + 2; }
    const look = Math.sin(ph * 2) * 1.2;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, fy - 1, 2.8, 0, Math.PI * 2); ctx.arc(x + 4, fy - 1, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 4 + look, fy - 0.5, 1.4, 0, Math.PI * 2); ctx.arc(x + 4 + look, fy - 0.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, fy + 2, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#ff7ab8'; ctx.beginPath(); ctx.ellipse(x + 1.5, fy + 5.5, 2, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  },
  drawSlice(ctx, x, y) {
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 7, y + 7); ctx.lineTo(x - 7, y + 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.fillRect(x - 7, y + 5, 14, 3);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x - 1.5, y, 1.8, 0, Math.PI * 2); ctx.arc(x + 2.5, y + 3.5, 1.5, 0, Math.PI * 2); ctx.fill();
  },
  // the chef's rocket: a white ship with a red nose, fins, a flame and the chef in the round window
  drawShip(ctx, x, y, t) {
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(x - 6, y + 14); ctx.lineTo(x + 6, y + 14); ctx.lineTo(x, y + 22 + Math.sin(t * 30) * 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe94f'; ctx.beginPath(); ctx.moveTo(x - 3, y + 14); ctx.lineTo(x + 3, y + 14); ctx.lineTo(x, y + 18 + Math.sin(t * 30) * 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 13, y + 2); ctx.lineTo(x - 22, y + 16); ctx.lineTo(x - 13, y + 14); ctx.closePath(); ctx.moveTo(x + 13, y + 2); ctx.lineTo(x + 22, y + 16); ctx.lineTo(x + 13, y + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4f4f8'; U.roundRect(ctx, x - 13, y - 12, 26, 28, 8); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 13, y - 8); ctx.lineTo(x + 13, y - 8); ctx.lineTo(x, y - 26); ctx.closePath(); ctx.fill(); ctx.fillRect(x - 13, y + 8, 26, 4);
    ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y + 1, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 5, y - 8, 10, 4, 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y - 8, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 2.5, y, 1.5, 1.5); ctx.fillRect(x + 1, y, 1.5, 1.5);
  },
  // a car seen from above; the chef's one has a white hat on the roof
  drawCar(ctx, x, y, color, chef) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, x - 13, y - 22, 30, 50, 8); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (const [dx, dy] of [[-18, -18], [13, -18], [-18, 8], [13, 8]]) { U.roundRect(ctx, x + dx, y + dy, 5, 10, 2); ctx.fill(); }
    ctx.fillStyle = color; U.roundRect(ctx, x - 15, y - 25, 30, 50, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 12, y - 22, 4, 44);
    ctx.fillStyle = '#9fd8ff'; U.roundRect(ctx, x - 11, y - 16, 22, 10, 3); ctx.fill(); U.roundRect(ctx, x - 11, y + 9, 22, 7, 3); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - 11, y - 25, 6, 3); ctx.fillRect(x + 5, y - 25, 6, 3);
    ctx.fillStyle = '#e53935'; ctx.fillRect(x - 11, y + 22, 6, 3); ctx.fillRect(x + 5, y + 22, 6, 3);
    if (chef) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
  },
  drawBox(r, ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, x - 12, y - 11, 28, 28, 4); ctx.fill();
    ctx.fillStyle = '#d9a066'; U.roundRect(ctx, x - 14, y - 14, 28, 28, 4); ctx.fill();
    ctx.fillStyle = '#b8743a'; ctx.fillRect(x - 14, y + 9, 28, 3);
    r.drawPizza(x, y - 1, 8);
  },
};

Game.ext.unshift(ArcadeExt);
Render.ext.push(ArcadeExt);
