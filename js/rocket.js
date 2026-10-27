'use strict';
// Rocket Island: the newest island, east of Starfish Cove over a rope bridge. A big launch pad holds a tall pizza
// rocket under construction: scaffolding with ladders, a crane swinging panels up to the top and back, welders
// throwing sparks, a fuel truck with its hose, and a mission-control hut with blinking screens (its inside lives in
// js/islands-inside.js). Little workers in hard hats carry parts, climb the scaffold, weld and wave at the chef.
// Standing in front of the rocket offers '🚀 Ask about the rocket': a worker answers in a bubble and a countdown
// float runs… and nothing launches. It is a placeholder: the rocket will one day fly to a new place.
// Reads its spots from CFG.ISLANDS.ROCKET (js/islands.js, loaded first).
// Extension module: registered with Game.ext (first, so its button and hint beat the islands' own) and Render.ext.

CFG.ROCKETISLE = {
  LINES: ['Almost ready!', 'Blast-off soon!', 'Pass the bolts!', 'More pizza fuel! 🍕', 'Just one more panel!', 'Coming soon!'],
  ASK_R: 50,           // stand this close to the ask spot
  HINT_R: 200,         // "A real rocket!" within this of the rocket
  WAVE_R: 110,         // workers wave when the chef walks this close
  CRANE_PERIOD: 16,    // seconds for the crane to fetch a panel, lift it to the top and come back
  ROCKET_H: 260,       // the rocket's height, feet to nose
};

const RocketExt = {
  name: 'rocket',
  st: null,   // runtime only: workers, the crane's clock, sparks, the answer bubble and the countdown

  // ---------- state ----------
  build(g) {
    const R = CFG.ISLANDS.ROCKET, B = R.BASE, S = R.SCAFFOLD, P = R.PARTS;
    const W = (o) => Object.assign({ facing: 1, moving: false, bob: 0, z: 0, wave: 0, waveCd: 0, weld: 0 }, o);
    this.st = {
      workers: [
        // carries panels from the parts pile to the rocket and walks back for more
        W({ role: 'carry', x: P.x - 30, y: P.y - 26, path: [{ x: P.x - 34, y: P.y - 24 }, { x: B.x - 70, y: B.y + 44 }], leg: 1, pause: 0, carrying: true, hat: '#ffd166', shirt: '#ff8c42', skin: '#e0ac69' }),
        // climbs the scaffold ladder up and down, hammering at the top
        W({ role: 'climb', x: S.x1 - 4, y: S.y + 10, dir: 1, pause: 0, bang: 0, hat: '#ff8c42', shirt: '#ffd166', skin: '#8d5524' }),
        // welds high up on the scaffold, next to the rocket
        W({ role: 'weldHigh', x: S.x0 + 14, y: S.y + 2, z: S.h / 2, facing: -1, hat: '#ffffff', shirt: '#4dd0e1', skin: '#f1c27d' }),
        // welds a fin down on the pad
        W({ role: 'weldLow', x: B.x - 56, y: B.y + 18, facing: 1, hat: '#ffd166', shirt: '#41b883', skin: '#c68642' }),
        // the foreman with the clipboard walks round the pad
        W({ role: 'boss', x: 4076, y: 2830, path: [{ x: 4076, y: 2830 }, { x: 4076, y: 2668 }, { x: 4140, y: 2650 }, { x: 4320, y: 2650 }, { x: 4320, y: 2760 }, { x: 4140, y: 2650 }, { x: 4076, y: 2668 }], leg: 1, pause: 0, hat: '#e4572e', shirt: '#3b7dd8', skin: '#f1c27d' }),
      ],
      crane: 0, sparks: [], sparkT: 0,
      ask: null, askN: 0, count: null,
      obs: null,
    };
    const C = R.CRANE, M = R.MISSION, T = R.TRUCK, SG = R.SIGN;
    this.st.obs = [
      { x: B.x - 30, y: B.y - 32, w: S.x1 - (B.x - 30), h: 38 },          // the rocket's feet and the scaffold's legs
      { x: C.x - 20, y: C.y - 18, w: 40, h: 36 },                          // the crane's base
      { x: T.x - 48, y: T.y - 16, w: 96, h: 30 },                          // the fuel truck
      { x: M.x - M.w / 2, y: M.y - M.h / 2, w: M.w, h: M.h },              // mission control
      { x: SG.x - 98, y: SG.y - 6, w: 10, h: 10 }, { x: SG.x + 88, y: SG.y - 6, w: 10, h: 10 },   // the sign's posts
      { x: P.x - 34, y: P.y - 14, w: 68, h: 26 },                          // the pile of parts
    ];
  },
  onRocketIsle(g) { const s = CFG.ISLANDS.ISLANDS.find((q) => q.key === 'rocket'), p = g.player; return g.area === 'islands' && p.x > s.x0 && p.x < s.x1 && p.y > s.y0 && p.y < s.y1; },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  nearAsk(g) { const A = CFG.ISLANDS.ROCKET.ASK, p = g.player; return U.dist(p.x, p.y, A.x, A.y) < CFG.ROCKETISLE.ASK_R; },
  nearMissionDoor(g) { const M = CFG.ISLANDS.ROCKET.MISSION, p = g.player; return U.dist(p.x, p.y, M.x, M.y + M.h / 2 + 20) < 90; },

  // ---------- game hooks ----------
  obstacles(g, forCar) { return g.area === 'islands' && this.st && !forCar ? this.st.obs : []; },
  action(g) {
    if (!this.st || g.area !== 'islands' || !this.onFoot(g) || !this.nearAsk(g)) return null;
    return { label: '🚀 Ask about the rocket', run: (gg) => this.ask(gg) };
  },
  ask(g) {
    const st = this.st, L = CFG.ROCKETISLE.LINES, p = g.player;
    // the nearest worker on the ground answers
    let who = null, bd = Infinity;
    for (const w of st.workers) { if (w.z > 4) continue; const d = U.dist(p.x, p.y, w.x, w.y); if (d < bd) { bd = d; who = w; } }
    st.ask = { t: 0, line: L[st.askN % L.length], who };
    st.askN++;
    if (who) { who.facing = p.x < who.x ? -1 : 1; who.wave = 1.2; }
    st.count = { t: 0, n: 0 };
    Sfx.ding(); Haptics.tap();
  },
  home(g) { if (!this.st) return; this.st.ask = null; this.st.count = null; this.st.sparks = []; },
  hint(g) {
    if (!this.st || g.area !== 'islands' || !this.onFoot(g) || !this.onRocketIsle(g) || this.nearMissionDoor(g)) return undefined;
    if (g.player.carry > 0 && typeof IslandsExt !== 'undefined' && IslandsExt.rt && IslandsExt.rt.huts.some((h) => h.order)) return undefined;   // a delivery comes first
    const p = g.player, A = CFG.ISLANDS.ROCKET.ASK, d = U.dist(p.x, p.y, A.x, A.y);
    if (this.st.ask && this.st.ask.t < 2.6) return { text: 'Blast-off… someday! 🚀', target: null };
    if (d < CFG.ROCKETISLE.ASK_R) return { text: 'Ask the workers about the rocket! 🚀', target: null };
    if (d < CFG.ROCKETISLE.HINT_R) return { text: 'A real rocket! 🚀', target: A };
    return undefined;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st;
    if (g.area !== 'islands') { st.sparks.length = 0; return; }
    const R = CFG.ISLANDS.ROCKET, p = g.player, t = g.time, chefNear = (w) => this.onFoot(g) && U.dist(p.x, p.y, w.x, w.y - w.z) < CFG.ROCKETISLE.WAVE_R;
    st.crane = (st.crane + dt) % CFG.ROCKETISLE.CRANE_PERIOD;
    for (const w of st.workers) {
      w.waveCd = Math.max(0, w.waveCd - dt); w.wave = Math.max(0, w.wave - dt);
      // a friendly wave when the chef comes by (not from up a ladder)
      if (w.role !== 'climb' && w.waveCd <= 0 && chefNear(w)) { w.wave = 1.6; w.waveCd = 7; w.facing = p.x < w.x ? -1 : 1; }
      if (w.wave > 0) { w.moving = false; w.bob = 0; w.weld = 0; continue; }
      if (w.role === 'carry' || w.role === 'boss') {
        if (w.pause > 0) { w.pause -= dt; w.moving = false; continue; }
        const to = w.path[w.leg], arrived = U.moveToward(w, to.x, to.y, w.role === 'boss' ? 42 : 56, dt);
        w.bob = w.moving ? w.bob + dt * 12 : 0;
        if (arrived) {
          w.leg = (w.leg + 1) % w.path.length; w.pause = w.role === 'boss' ? 1.4 : 1.1;
          if (w.role === 'carry') w.carrying = w.leg === 1;   // picked one up at the pile, put it down by the rocket
        }
      } else if (w.role === 'climb') {
        // up the ladder, a little hammering at the top, back down, a breather at the bottom
        w.bang = Math.max(0, w.bang - dt);
        if (w.pause > 0) { w.pause -= dt; if (w.z > 60 && Math.floor(w.pause * 3) !== Math.floor((w.pause + dt) * 3)) w.bang = 0.18; continue; }
        w.z += w.dir * 46 * dt; w.bob += dt * 10;
        const topZ = CFG.ISLANDS.ROCKET.SCAFFOLD.h * 0.75;
        if (w.z >= topZ) { w.z = topZ; w.dir = -1; w.pause = 2.6; } else if (w.z <= 0) { w.z = 0; w.dir = 1; w.pause = 2; }
      } else {
        // welders: a couple of seconds of sparks, then a look at the work
        w.weld = (Math.sin(t * 1.3 + (w.role === 'weldLow' ? 2 : 0)) > -0.3) ? 1 : 0;
      }
    }
    // sparks fly from the welding torches
    st.sparkT -= dt;
    if (st.sparkT <= 0) {
      st.sparkT = 0.05;
      for (const w of st.workers) if (w.weld) { const tx = w.x + w.facing * 18, ty = w.y - w.z - 18; for (let k = 0; k < 2; k++) st.sparks.push({ x: tx, y: ty, vx: U.rand(-70, 70), vy: U.rand(-110, -20), t: 0, life: U.rand(0.3, 0.6), floor: w.y - w.z + 2 }); }
    }
    for (const s of st.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 380 * dt; if (s.y > s.floor) { s.y = s.floor; s.vy *= -0.3; s.vx *= 0.5; } }
    st.sparks = st.sparks.filter((s) => s.t < s.life);
    if (st.sparks.length > 160) st.sparks.splice(0, st.sparks.length - 160);
    // the answer bubble and the countdown that never quite gets there
    if (st.ask) { st.ask.t += dt; if (st.ask.t > 3) st.ask = null; }
    if (st.count) {
      const c = st.count, top = { x: R.BASE.x, y: R.BASE.y - CFG.ROCKETISLE.ROCKET_H - 20 };
      c.t += dt;
      const marks = ['3…', '2…', '1…', '🚧 Not yet! Coming soon!'];
      while (c.n < marks.length && c.t >= c.n * 0.6) {
        const last = c.n === marks.length - 1;
        g.floats.push({ x: top.x, y: top.y + (last ? 40 : 0), text: marks[c.n], color: last ? '#ffe08a' : '#fff', t: 0, dur: last ? 1.8 : 0.7, big: true });
        c.n++;
      }
      if (c.n >= marks.length) st.count = null;
    }
  },

  // ---------- static art on the island ----------
  paintAfter(r, g, area) {
    if (area !== 'islands') return;
    const ctx = r.ctx, R = CFG.ISLANDS.ROCKET, P = R.PAD, B = R.BASE;
    // the concrete pad with hazard stripes round the edge and a flame trench grate under the rocket
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, P.x0 + 5, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.fill();
    ctx.fillStyle = '#b9bcc2'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let x = P.x0 + 40; x < P.x1; x += 40) ctx.fillRect(x, P.y0 + 4, 2, P.y1 - P.y0 - 8); for (let y = P.y0 + 40; y < P.y1; y += 40) ctx.fillRect(P.x0 + 4, y, P.x1 - P.x0 - 8, 2);
    ctx.save(); U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.clip();
    for (let i = -20; i < 60; i++) { ctx.fillStyle = i % 2 ? '#2b1d14' : '#ffd166'; const x = P.x0 + i * 14; ctx.beginPath(); ctx.moveTo(x, P.y0); ctx.lineTo(x + 14, P.y0); ctx.lineTo(x + 24, P.y0 + 10); ctx.lineTo(x + 10, P.y0 + 10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, P.y1 - 10); ctx.lineTo(x + 14, P.y1 - 10); ctx.lineTo(x + 24, P.y1); ctx.lineTo(x + 10, P.y1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(B.x, B.y - 10, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 40, B.y - 26, 80, 30, 6); ctx.fill();
    ctx.fillStyle = '#3e424a'; for (let x = B.x - 34; x < B.x + 36; x += 8) ctx.fillRect(x, B.y - 22, 4, 22);
    // a painted pizza on the pad, for luck
    r.drawPizza(P.x0 + 44, P.y1 - 44, 16);
    // traffic cones along the edge
    for (const [x, y] of [[P.x0 + 10, P.y0 + 30], [P.x0 + 10, P.y1 - 90], [P.x1 - 10, P.y1 - 30], [P.x1 - 10, P.y0 + 90]]) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.lineTo(x, y - 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 3.5, y - 9, 7, 3); ctx.fillStyle = '#3e424a'; ctx.fillRect(x - 8, y - 1, 16, 3); }
    // the fuel hose from the truck to the rocket
    const T = R.TRUCK;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x + 44, T.y - 4); ctx.bezierCurveTo(T.x + 110, T.y + 20, B.x - 90, B.y + 30, B.x - 24, B.y - 4); ctx.stroke();
    ctx.strokeStyle = '#41b883'; ctx.lineWidth = 2; ctx.stroke();
    this.paintMission(r, g);
    this.paintSign(r, g);
    // the crane's footing: tracks in the sand
    const C = R.CRANE; ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = -2; k <= 2; k++) ctx.fillRect(C.x - 30, C.y + k * 8 + 22, 60, 3);
  },
  paintMission(r, g) {
    const ctx = r.ctx, M = CFG.ISLANDS.ROCKET.MISSION, x0 = M.x - M.w / 2, y0 = M.y - M.h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x0 + 6, y0 + 8, M.w, M.h, 10); ctx.fill();
    // the front wall faces south, under a flat white roof with a red stripe
    ctx.fillStyle = '#e8edf2'; ctx.fillRect(x0 + 4, M.y - 2, M.w - 8, M.h / 2 + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = M.y + 4; y < y0 + M.h; y += 7) ctx.fillRect(x0 + 4, y, M.w - 8, 1.5);
    ctx.fillStyle = '#f5f7fa'; U.roundRect(ctx, x0, y0, M.w, M.h / 2 + 4, 10); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x0, M.y - 2, M.w, 6);
    ctx.fillStyle = '#c9ccd2'; for (const [dx, dy] of [[18, 12], [M.w - 30, 10]]) { U.roundRect(ctx, x0 + dx, y0 + dy, 14, 10, 3); ctx.fill(); }   // roof vents
    // the door and the window frames (the screens behind them blink live)
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, M.x - 11, M.y + 12, 22, M.h / 2 - 12, 3); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(M.x - 7, M.y + 16, 14, 8); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(M.x + 7, M.y + 30, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; for (const dx of [-46, 20]) { U.roundRect(ctx, M.x + dx, M.y + 10, 26, 18, 3); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, M.x - 54, y0 + M.h + 4, 108, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛰️ MISSION CONTROL', M.x, y0 + M.h + 11);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(M.x - 12, y0 + M.h, 24, 26);   // the path to the door
  },
  paintSign(r, g) {
    const ctx = r.ctx, S = CFG.ISLANDS.ROCKET.SIGN, w = 214, h = 50, y0 = S.y - 66;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x - w / 2 + 6, S.y - 2, w, 6);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x - 96, y0 + 10, 6, S.y - y0 - 8); ctx.fillRect(S.x + 90, y0 + 10, 6, S.y - y0 - 8);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, S.x - w / 2, y0, w, h, 6); ctx.fill();
    ctx.save(); U.roundRect(ctx, S.x - w / 2, y0, w, h, 6); ctx.clip();
    for (let i = -2; i < 30; i++) { ctx.fillStyle = '#2b1d14'; const x = S.x - w / 2 + i * 14; ctx.beginPath(); ctx.moveTo(x, y0 + h - 7); ctx.lineTo(x + 7, y0 + h - 7); ctx.lineTo(x + 14, y0 + h); ctx.lineTo(x + 7, y0 + h); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; U.roundRect(ctx, S.x - w / 2, y0, w, h, 6); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = r.font(11); ctx.fillText('🚀 ROCKET UNDER CONSTRUCTION', S.x, y0 + 14);
    ctx.font = r.font(13); ctx.fillStyle = '#e4572e'; ctx.fillText('COMING SOON!', S.x, y0 + 31);
  },

  // ---------- live art ----------
  dynamic(r, g) {
    if (!this.st || g.area !== 'islands') return;
    const ctx = r.ctx, t = g.time, M = CFG.ISLANDS.ROCKET.MISSION, T = CFG.ISLANDS.ROCKET.TRUCK;
    // mission control's screens blink and a dish on the roof turns
    for (const [i, dx] of [[0, -46], [1, 20]]) {
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, M.x + dx + 2, M.y + 12, 22, 14, 2); ctx.fill();
      for (let k = 0; k < 3; k++) { const on = Math.sin(t * (2 + k) + i * 2 + k) > 0; ctx.fillStyle = on ? ['#8ef0a0', '#ffd166', '#4dd0e1'][k] : 'rgba(255,255,255,0.15)'; ctx.fillRect(M.x + dx + 5 + k * 6, M.y + 15, 4, 8 - k * 2); }
    }
    const da = Math.sin(t * 0.6) * 0.8, dx0 = M.x + M.w / 2 - 22, dy0 = M.y - M.h / 2 + 4;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(dx0 - 2, dy0 - 10, 4, 12);
    ctx.save(); ctx.translate(dx0, dy0 - 12); ctx.rotate(da); ctx.fillStyle = '#f5f7fa'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -10, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // the fuel truck's light blinks
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = 'rgba(255,209,102,0.5)'; ctx.beginPath(); ctx.arc(T.x - 34, T.y - 40, 9, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st || g.area !== 'islands') return;
    const R = CFG.ISLANDS.ROCKET, B = R.BASE, st = this.st;
    // only bother when Rocket Island is somewhere near the screen (the rocket and crane are tall)
    if (r.camY + r.viewH < R.PAD.y0 - 420 || r.camX > R.CRANE.x + 120 || r.camX + r.viewW < R.MISSION.x - 120) return;
    items.push({ y: B.y, draw: () => this.drawRocket(r.ctx, B.x, B.y, g.time, 1) });
    items.push({ y: B.y + 1, draw: () => this.drawScaffold(r, g) });
    items.push({ y: R.CRANE.y + 18, draw: () => this.drawCrane(r, g) });
    items.push({ y: R.TRUCK.y + 14, draw: () => this.drawTruck(r, g) });
    items.push({ y: R.PARTS.y + 10, draw: () => this.drawParts(r, g) });
    for (const w of st.workers) items.push({ y: w.role === 'climb' || w.role === 'weldHigh' ? B.y + 2 : w.y, draw: () => this.drawWorker(r, g, w) });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'islands') return;
    const ctx = r.ctx, st = this.st;
    ctx.lineCap = 'round';
    for (const s of st.sparks) { const k = s.t / s.life; ctx.strokeStyle = k < 0.4 ? '#fffbe0' : '#ffd166'; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const w of st.workers) if (w.weld) { const fl = 0.6 + Math.random() * 0.4; ctx.fillStyle = `rgba(200,240,255,${(0.7 * fl).toFixed(2)})`; ctx.beginPath(); ctx.arc(w.x + w.facing * 18, w.y - w.z - 18, 5 + fl * 4, 0, Math.PI * 2); ctx.fill(); }
    // the climber's hammer goes bang
    const c = st.workers.find((w) => w.role === 'climb');
    if (c && c.bang > 0) { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('bang!', c.x + 22, c.y - c.z - 50); }
    if (st.ask && st.ask.who) {
      const w = st.ask.who, bob = Math.sin(st.ask.t * 5) * 2;
      ctx.font = r.font(13); const tw = ctx.measureText(st.ask.line).width + 22;
      r.drawBubble(w.x, w.y - w.z - 70 + bob, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(st.ask.line, 0, 0); }, tw);
    }
    for (const w of st.workers) if (w.wave > 0.4 && (!st.ask || st.ask.who !== w)) r.drawBubble(w.x, w.y - w.z - 66, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👋', 0, 0); }, 30);
  },

  // The rocket, side on, standing on its feet at (x, y): fins, an engine bell, a white body with a pizza porthole,
  // a red nose, and panels still missing near the top where the ribs show. `s` scales it (mission control's screen).
  drawRocket(ctx, x, y, t, s) {
    const H = CFG.ROCKETISLE.ROCKET_H;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(6, 2, 44, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(14, -16); ctx.lineTo(20, 0); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill();   // engine bell
    ctx.fillStyle = '#e4572e';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 24, -80); ctx.lineTo(d * 46, -24); ctx.lineTo(d * 46, 0); ctx.lineTo(d * 24, -18); ctx.closePath(); ctx.fill(); }   // fins
    // the body: a soft gradient so it reads round
    const bg = ctx.createLinearGradient(-26, 0, 26, 0); bg.addColorStop(0, '#d9dde3'); bg.addColorStop(0.35, '#ffffff'); bg.addColorStop(1, '#c9ccd2');
    ctx.fillStyle = bg; U.roundRect(ctx, -26, -H + 60, 52, H - 74, 10); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(-26, -70, 52, 10); ctx.fillRect(-26, -150, 52, 6);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(-26, -60, 52, 3);
    // the name down the side
    ctx.fillStyle = '#3b7dd8'; ctx.font = '800 9px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ['P', 'I', 'Z', 'Z', 'A'].forEach((ch, i) => ctx.fillText(ch, -12, -132 + i * 11));
    // a porthole with a pizza slice looking out
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(6, -110, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(6, -110, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(6, -116); ctx.lineTo(1, -104); ctx.lineTo(11, -104); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(6, -107, 1.6, 0, Math.PI * 2); ctx.fill();
    // unfinished: the top section shows its ribs where panels are still missing
    const ty = -H + 60;
    ctx.fillStyle = '#7d8591'; ctx.fillRect(-4, ty, 30, 70);
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-4, ty + 6 + k * 14); ctx.lineTo(26, ty + 6 + k * 14); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(10, ty); ctx.lineTo(10, ty + 70); ctx.stroke();
    ctx.fillStyle = '#ff8c42'; ctx.fillRect(-4, ty + 50, 14, 20);   // one fresh panel, still in primer orange
    // the nose cone with a tip light
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-26, ty + 2); ctx.quadraticCurveTo(-24, ty - 40, 0, -H); ctx.quadraticCurveTo(24, ty - 40, 26, ty + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(-14, ty); ctx.quadraticCurveTo(-12, ty - 30, -2, -H + 6); ctx.lineTo(-6, ty); ctx.closePath(); ctx.fill();
    ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#ff3b3b' : 'rgba(255,59,59,0.35)'; ctx.beginPath(); ctx.arc(0, -H - 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // the scaffold tower beside the rocket: lattice legs, four decks with walkways to the rocket, a ladder on the right
  drawScaffold(r, g) {
    const ctx = r.ctx, S = CFG.ISLANDS.ROCKET.SCAFFOLD, B = CFG.ISLANDS.ROCKET.BASE, y = S.y, top = y - S.h;
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3;
    for (const x of [S.x0, S.x1 - 10]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#b9bcc2';
    const deck = S.h / 4;
    for (let k = 0; k < 4; k++) { const ya = y - k * deck, yb = ya - deck; ctx.beginPath(); ctx.moveTo(S.x0, ya); ctx.lineTo(S.x1 - 10, yb); ctx.moveTo(S.x1 - 10, ya); ctx.lineTo(S.x0, yb); ctx.stroke(); }
    for (let k = 1; k <= 4; k++) {
      const dy = y - k * deck;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x + 20, dy - 3, S.x1 - B.x - 26, 6);          // deck planks, reaching to the rocket
      ctx.fillStyle = '#ffd166'; ctx.fillRect(S.x0 - 2, dy - 18, S.x1 - S.x0 - 6, 2.5);        // a yellow handrail
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(S.x0 - 2, dy - 18, 2, 15); ctx.fillRect(S.x1 - 12, dy - 18, 2, 15);
    }
    // the ladder up the right side
    const lx = S.x1 - 4;
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx - 5, y); ctx.lineTo(lx - 5, top + 40); ctx.moveTo(lx + 5, y); ctx.lineTo(lx + 5, top + 40); ctx.stroke();
    ctx.lineWidth = 1.5; for (let yy = y - 6; yy > top + 40; yy -= 9) { ctx.beginPath(); ctx.moveTo(lx - 5, yy); ctx.lineTo(lx + 5, yy); ctx.stroke(); }
    // a work lamp on top, blinking
    ctx.fillStyle = Math.floor(g.time * 2) % 2 ? '#ffd166' : '#b8862c'; ctx.beginPath(); ctx.arc(S.x0 + 8, top - 4, 4, 0, Math.PI * 2); ctx.fill();
  },
  // the tower crane: mast, jib out over the rocket, a trolley running along it and a hook that fetches panels
  craneState() {
    const R = CFG.ISLANDS.ROCKET, C = R.CRANE, B = R.BASE, P = R.PARTS, T = CFG.ROCKETISLE.CRANE_PERIOD, k = this.st.crane / T;
    const jibY = C.y - C.h + 10, pileX = P.x, rocketX = B.x + 2, low = P.y - 26, topY = B.y - CFG.ROCKETISLE.ROCKET_H + 70;
    const seg = [[0.12, 'down'], [0.24, 'up'], [0.4, 'over'], [0.5, 'lower'], [0.64, 'hold'], [0.74, 'raise'], [0.9, 'back'], [1, 'rest']];
    let i = 0; while (k > seg[i][0]) i++;
    const a = i ? seg[i - 1][0] : 0, q = U.clamp((k - a) / (seg[i][0] - a), 0, 1), e = q * q * (3 - 2 * q), ph = seg[i][1];
    let x = pileX, hy = jibY + 40, load = false;
    if (ph === 'down') { hy = U.lerp(jibY + 40, low, e); }
    else if (ph === 'up') { hy = U.lerp(low, jibY + 40, e); load = true; }
    else if (ph === 'over') { x = U.lerp(pileX, rocketX, e); load = true; }
    else if (ph === 'lower') { x = rocketX; hy = U.lerp(jibY + 40, topY, e); load = true; }
    else if (ph === 'hold') { x = rocketX; hy = topY; load = true; }
    else if (ph === 'raise') { x = rocketX; hy = U.lerp(topY, jibY + 40, e); }
    else if (ph === 'back') { x = U.lerp(rocketX, pileX, e); }
    return { x, hy, load, jibY, ph };
  },
  drawCrane(r, g) {
    const ctx = r.ctx, C = CFG.ISLANDS.ROCKET.CRANE, cs = this.craneState(), top = cs.jibY;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x - 22, C.y + 10, 48, 10);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, C.x - 22, C.y - 6, 44, 22, 4); ctx.fill();
    // the mast: two yellow rails with zigzag bracing
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C.x - 8, C.y - 4); ctx.lineTo(C.x - 8, top); ctx.moveTo(C.x + 8, C.y - 4); ctx.lineTo(C.x + 8, top); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = C.y - 4, k = 0; y > top; y -= 16, k++) { ctx.moveTo(C.x + (k % 2 ? 8 : -8), y); ctx.lineTo(C.x + (k % 2 ? -8 : 8), y - 16); } ctx.stroke();
    // the jib out to the left over the rocket, the counter-jib with its weight to the right
    const jx0 = CFG.ISLANDS.ROCKET.BASE.x - 40, jx1 = C.x + 70;
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(jx0, top); ctx.lineTo(jx1, top); ctx.moveTo(jx0 + 20, top + 10); ctx.lineTo(C.x, top + 10); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = jx0 + 20, k = 0; x < C.x; x += 14, k++) { ctx.moveTo(x, top + (k % 2 ? 0 : 10)); ctx.lineTo(x + 14, top + (k % 2 ? 10 : 0)); } ctx.stroke();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C.x, top - 30); ctx.lineTo(jx0 + 10, top); ctx.moveTo(C.x, top - 30); ctx.lineTo(jx1 - 6, top); ctx.stroke();
    ctx.fillStyle = '#f2b705'; ctx.fillRect(C.x - 3, top - 32, 6, 32);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(jx1 - 30, top + 2, 28, 18);   // counterweight
    // the cab with its driver
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, C.x + 10, top + 4, 22, 20, 4); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(C.x + 13, top + 7, 16, 9);
    ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(C.x + 21, top + 13, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(C.x + 21, top + 11, 4.5, Math.PI, 0); ctx.fill();
    // trolley, cable, hook and whatever it carries
    ctx.fillStyle = '#3e424a'; ctx.fillRect(cs.x - 7, top - 3, 14, 7);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cs.x - 2, top + 4); ctx.lineTo(cs.x - 2, cs.hy); ctx.moveTo(cs.x + 2, top + 4); ctx.lineTo(cs.x + 2, cs.hy); ctx.stroke();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, cs.x - 5, cs.hy - 2, 10, 8, 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cs.x, cs.hy + 10, 4, 0, Math.PI); ctx.stroke();
    if (cs.load) { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cs.x, cs.hy + 12); ctx.lineTo(cs.x - 12, cs.hy + 22); ctx.moveTo(cs.x, cs.hy + 12); ctx.lineTo(cs.x + 12, cs.hy + 22); ctx.stroke(); ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, cs.x - 14, cs.hy + 22, 28, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cs.x - 12, cs.hy + 24, 24, 3); ctx.fillStyle = '#c9ccd2'; for (const dx of [-9, 9]) { ctx.beginPath(); ctx.arc(cs.x + dx, cs.hy + 34, 1.6, 0, Math.PI * 2); ctx.fill(); } }
  },
  drawTruck(r, g) {
    const ctx = r.ctx, T = CFG.ISLANDS.ROCKET.TRUCK, x = T.x, y = T.y;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 12, 52, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (const dx of [-30, 18, 34]) { ctx.beginPath(); ctx.arc(x + dx, y + 6, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(x + dx, y + 6, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; }
    // the cab faces west
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 48, y - 32, 30, 34, 6); ctx.fill(); ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, x - 44, y - 28, 14, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x - 34, y - 36, 4, 0, Math.PI * 2); ctx.fill();   // the roof light (its glow blinks live)
    // the round tank with FUEL on it
    ctx.fillStyle = '#f5f7fa'; U.roundRect(ctx, x - 16, y - 34, 64, 34, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x - 12, y - 10, 56, 4);
    ctx.fillStyle = '#41b883'; ctx.fillRect(x - 16, y - 22, 64, 9);
    ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ROCKET FUEL', x + 16, y - 17);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 16, y - 2, 64, 6);
  },
  drawParts(r, g) {
    const ctx = r.ctx, P = CFG.ISLANDS.ROCKET.PARTS, x = P.x, y = P.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 34, y + 6, 72, 8);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 34, y - 6, 68, 14); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 34, y, 68, 2);   // a pallet
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#ff8c42' : '#d9dde3'; U.roundRect(ctx, x - 30 + k * 4, y - 14 - k * 7, 44, 8, 2); ctx.fill(); }   // a stack of panels
    ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + 22, y - 6 - k * 7, 4, 0, Math.PI * 2); ctx.fill(); }   // pipes, end on
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, x + 14, y - 34, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BOLTS', x + 23, y - 28);
  },
  // a little worker: hi-vis vest, hard hat; carries a panel, climbs, welds behind a visor, or waves
  drawWorker(r, g, w) {
    const ctx = r.ctx, x = w.x, y = w.y - w.z, s = 0.82, climbing = w.role === 'climb' && w.z > 0 && w.pause <= 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (climbing) {
      // seen from behind on the ladder: arms and legs taking turns
      const k = Math.sin(w.bob * 1.5) * 4;
      ctx.fillStyle = '#3a3f5c'; U.roundRect(ctx, -8, -12 + k, 6, 14, 3); ctx.fill(); U.roundRect(ctx, 2, -12 - k, 6, 14, 3); ctx.fill();
      ctx.fillStyle = w.shirt; U.roundRect(ctx, -12, -32, 24, 24, 8); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(-12, -22, 24, 3);
      ctx.fillStyle = w.skin; ctx.beginPath(); ctx.arc(-13, -34 - k, 3.5, 0, Math.PI * 2); ctx.arc(13, -34 + k, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -40, 10, 0, Math.PI * 2); ctx.fill();
    } else {
      r.drawPerson(0, 0, { shirt: w.shirt, stripes: true, skin: w.skin, hair: '#2b1d14', hairStyle: 0, facing: w.facing, moving: w.moving, bob: w.bob, carry: 0, pants: '#3a3f5c' });
      if (w.weld) { ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -9 + w.facing * 3, -44, 16, 11, 3); ctx.fill(); ctx.fillStyle = '#4dd0e1'; ctx.fillRect(-6 + w.facing * 3, -41, 10, 3); ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w.facing * 12, -16); ctx.lineTo(w.facing * 22, -22); ctx.stroke(); }
      if (w.role === 'carry' && w.carrying) { ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, -16, -34, 32, 14, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-14, -32, 28, 3); }
      if (w.role === 'boss') { ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, w.facing * 8 - 6, -30, 12, 15, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(w.facing * 8 - 4, -27, 8, 10); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(w.facing * 8 - 3, -25 + k * 3, 6, 1); }
      if (w.role === 'climb' && w.bang > 0) { ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -16); ctx.lineTo(22, -30); ctx.stroke(); ctx.fillStyle = '#3e424a'; ctx.fillRect(18, -34, 9, 5); }
      if (w.wave > 0) { const up = Math.sin(g.time * 14) * 4; ctx.fillStyle = w.skin; ctx.beginPath(); ctx.arc(w.facing * 15 + up * 0.5, -52, 4, 0, Math.PI * 2); ctx.fill(); }
    }
    // the hard hat
    ctx.fillStyle = w.hat; ctx.beginPath(); ctx.arc(0, -42, 11.5, Math.PI, 0); ctx.fill();
    U.roundRect(ctx, -14, -43, 28, 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-1.5, -53, 3, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-4, -48, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
};
Game.ext.unshift(RocketExt);   // ahead of the islands' own button and hints
Render.ext.push(RocketExt);
