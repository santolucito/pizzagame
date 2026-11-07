'use strict';
// Pizza Pier MIDWAY (CFG.PIER.PLOTS.games): a row of three game booths and a prize counter along the north side of the
// boardwalk. Each booth has a striped awning, a sign with twinkling bulbs, stuffed animals hanging inside and a worker
// behind the counter who cheers when you win. Standing on a booth's spot (on its south side, from the boardwalk) the big
// button opens that game BIG on the screen (the `screen` hook draws it; taps on the canvas are caught while it is open):
//   🎯 Ring toss    bottles slide gently past; the button (or any tap) throws the ring; the hit zone is big and after
//                   two misses in a row the ring homes onto the nearest bottle. Three ringers win.
//   🔨 Whack-a-mole moles (and the odd pizza slice) pop up; tap them (or press the button to bonk the one that is up).
//                   Six bonks win; moles stay up longer and longer if you miss them.
//   🦆 Duck pond    ducks float round a pond; tap one (or the button picks the one under the arrow). Every duck wins.
//   🧸 Prizes       tap a big stuffed animal (or the button takes the one that is lit) to swap 10 tickets for it.
// Every game ends in a win: 10 tickets (🎟️, shown on the prize counter's board and in the game frame). A prize is carried
// by the chef for a while (drawn hugged beside the chef) and the latest one sits on a little shelf on the prize counter
// (saved in g.s.piergames). No failure states, no reading needed.
// Extension module: registered with Game.ext (unshift, so the booth buttons beat the park's own) and Render.ext.
CFG.PIERGAMES = (() => {
  const P = CFG.PIER.PLOTS.games, BW = 150, GAP = 16, X0 = P.x0 + 6, SPOT_Y = 5838;
  const defs = [
    { key: 'ring', ico: '🎯', title: 'RING TOSS', label: '🎯 Play ring toss', awning: '#e53935', dark: '#a91e1e', back: '#ffe2b8', shirt: '#e53935', cap: '#ffd23f', skin: '#f1c27d' },
    { key: 'mole', ico: '🔨', title: 'WHACK-A-MOLE', label: '🔨 Play whack-a-mole', awning: '#1e88e5', dark: '#1259a3', back: '#d3f2c6', shirt: '#43a047', cap: '#1e88e5', skin: '#8d5524' },
    { key: 'duck', ico: '🦆', title: 'DUCK POND', label: '🦆 Pick a duck', awning: '#8e44ad', dark: '#5e2b78', back: '#c9ecff', shirt: '#ffb300', cap: '#8e44ad', skin: '#e0ac69' },
    { key: 'prize', ico: '🧸', title: 'PRIZES', label: '🧸 Pick a prize', awning: '#ff8f00', dark: '#c26100', back: '#ffe0f0', shirt: '#ec407a', cap: '#ff8f00', skin: '#c68642' },
  ];
  return {
    PLOT: P,
    TOP: P.y0, SIGN_Y: P.y0 + 4, AWN_Y: P.y0 + 40, AWN_B: P.y0 + 68,     // sign board, awning band (5640..5668)
    COUNTER_Y: 5766, FRONT_Y: 5806,                                          // counter ledge top; the booth's front edge (obstacle bottom)
    BOOTHS: defs.map((d, i) => { const x0 = X0 + i * (BW + GAP); return Object.assign(d, { x0, x1: x0 + BW, cx: x0 + BW / 2, spot: { x: x0 + BW / 2, y: SPOT_Y } }); }),
    REACH: 36, NEAR: 70,                     // how close counts as "at" a booth spot; the midway hint radius
    TICKETS: 10, COST: 10,                   // tickets a win gives; tickets a prize costs
    CARRY: 90, CARD: 2.4,                    // seconds the chef carries a new prize; seconds the "You win!" card stays
    PF: { w: 360, h: 420 },                  // the big playfield, in its own units (scaled to fit the screen)
    PRIZES: ['bear', 'unicorn', 'pizza', 'dino', 'bunny'],
    VISITORS: [
      { x: 9164, y: 5862, look: { shirt: '#26c6da', skin: '#f1c27d', hair: '#7a4b22', hairStyle: 1, pants: '#3a3f5c' }, balloon: '#ff5c8a' },
      { x: 9496, y: 5866, look: { shirt: '#9ccc65', skin: '#8d5524', hair: '#2b1d14', hairStyle: 2, pants: '#5d4037' }, balloon: '#42a5f5' },
    ],
  };
})();

// ======================= the four big-screen games =======================
// Each game owns a state object `G` (init), steps it (step), answers a tap in playfield units (tap) and the big button
// (press), says when it is won (goal) and draws itself in playfield units (draw). `A` is PierGamesExt (fx helpers).
const PierGames = {
  // ---- RING TOSS: a shelf of bottles slides by; the ring flies straight up from the middle ----
  ring: {
    GOAL: 3, N: 6, SPACE: 60, BY: 214, ZONE: 26, FROM: { x: 180, y: 372 }, FLY: 0.6,
    btn: '🎯 Throw!',
    init() { return { off: 0, fly: null, miss: 0, hits: 0, throws: 0, rings: [0, 0, 0, 0, 0, 0], lying: [], sparks: [], texts: [] }; },
    bx(G, i) { const L = this.N * this.SPACE; return ((i * this.SPACE + G.off) % L + L) % L; },     // 0..360 across the shelf, wrapping
    nearest(G, x) { let best = 0, bd = Infinity; for (let i = 0; i < this.N; i++) { const d = Math.abs(this.bx(G, i) - x); if (d < bd) { bd = d; best = i; } } return { i: best, d: bd }; },
    helping(G) { return G.miss >= 2; },
    willHit(G) { return this.helping(G) || this.nearest(G, this.FROM.x).d < this.ZONE; },
    press(G) {
      if (G.fly) return;
      const n = this.nearest(G, this.FROM.x), hit = this.willHit(G);
      G.fly = { i: n.i, hit, t: 0, x1: this.FROM.x }; G.throws++;
    },
    tap(G) { this.press(G); },
    step(G, dt, A) {
      G.off += dt * (this.helping(G) ? 26 : 40);
      for (const l of G.lying) l.t += dt;
      G.lying = G.lying.filter((l) => l.t < 1.2);
      const f = G.fly; if (!f) return;
      f.t += dt / this.FLY;
      if (f.hit) f.x1 = this.bx(G, f.i);
      if (f.t >= 1) {
        G.fly = null;
        if (f.hit) { G.rings[f.i]++; G.hits++; G.miss = 0; A.burst(G, f.x1, this.BY - 50, 14, ['#ffd23f', '#fff', '#ff5c8a']); A.text(G, f.x1, this.BY - 90, '⭐', '#ffd23f'); if (G.hits < this.GOAL) Sfx.pickup(); }
        else { G.miss++; G.lying.push({ x: f.x1, t: 0 }); A.text(G, f.x1, this.BY - 10, 'Boing!', '#fff'); Sfx.drop(); }
      }
    },
    goal(G) { return G.hits >= this.GOAL; },
    progress(G) { return G.hits; },
    flyPos(G) {
      const f = G.fly, k = f.t, F = this.FROM, y1 = f.hit ? this.BY - 48 : this.BY + 18;
      return { x: U.lerp(F.x, f.x1, k), y: U.lerp(F.y, y1, k) - Math.sin(k * Math.PI) * 90, s: U.lerp(1.25, 0.85, k), spin: k * 9 };
    },
    draw(r, ctx, G, g, A) {
      const PF = CFG.PIERGAMES.PF, t = g.time, BY = this.BY;
      ctx.fillStyle = '#ffe2b8'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = 'rgba(229,57,53,0.12)'; for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(22 + i * 46 + (j % 2) * 23, 22 + j * 34, 8, 0, Math.PI * 2); ctx.fill(); }
      // the shelf the bottles slide along (red cloth with a scalloped white trim)
      ctx.fillStyle = '#c62828'; ctx.fillRect(0, BY, PF.w, 34);
      ctx.fillStyle = '#fff'; for (let x = 0; x < PF.w; x += 20) { ctx.beginPath(); ctx.arc(x + 10, BY + 34, 10, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, BY, PF.w, 4);
      // the floor of the booth
      ctx.fillStyle = '#d9a066'; ctx.fillRect(0, BY + 44, PF.w, PF.h - BY - 44);
      ctx.fillStyle = '#c98b4a'; for (let y = BY + 66; y < PF.h; y += 26) ctx.fillRect(0, y, PF.w, 3);
      // the bottles (and the rings already on them); the one the ring would land on glows
      const aim = this.nearest(G, this.FROM.x), glow = !G.fly && this.willHit(G);
      const cols = ['#2e7d32', '#1565c0', '#6d4c41', '#00897b', '#7b1fa2', '#ef6c00'];
      for (let i = 0; i < this.N; i++) {
        const x = this.bx(G, i);
        for (const xx of [x, x - this.N * this.SPACE, x + this.N * this.SPACE]) {
          if (xx < -30 || xx > PF.w + 30) continue;
          if (glow && i === aim.i && xx === x) { const p = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = `rgba(255,236,120,${(0.35 + 0.35 * p).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(xx, BY - 30, 30, 44, 0, 0, Math.PI * 2); ctx.fill(); }
          this.drawBottle(ctx, xx, BY, cols[i], G.rings[i]);
        }
      }
      // rings that missed: lying on the cloth for a moment
      for (const l of G.lying) { ctx.globalAlpha = l.t > 0.9 ? (1.2 - l.t) / 0.3 : 1; this.drawRing(ctx, l.x, BY + 20, 1, 0, '#ffd23f'); ctx.globalAlpha = 1; }
      // the guide line from the ring to the shelf
      ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(this.FROM.x, this.FROM.y - 16); ctx.lineTo(this.FROM.x, BY + 10); ctx.stroke(); ctx.setLineDash([]);
      // the ring: waiting in front, or flying
      if (G.fly) { const p = this.flyPos(G); this.drawRing(ctx, p.x, p.y, p.s, p.spin, '#ffd23f'); }
      else {
        const bob = Math.sin(t * 4) * 3;
        this.drawRing(ctx, this.FROM.x, this.FROM.y + bob, 1.25, 0, '#ffd23f');
        if (G.throws === 0) { ctx.font = r.font(34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👆', this.FROM.x + 46, this.FROM.y + 22 + Math.sin(t * 6) * 6); }
      }
      A.drawFx(ctx, r, G);
    },
    drawBottle(ctx, x, by, col, rings) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 3, by, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; U.roundRect(ctx, x - 14, by - 46, 28, 46, 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 14, by - 38); ctx.quadraticCurveTo(x - 12, by - 56, x - 5, by - 60); ctx.lineTo(x + 5, by - 60); ctx.quadraticCurveTo(x + 12, by - 56, x + 14, by - 38); ctx.fill();
      ctx.fillRect(x - 5, by - 78, 10, 20);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 6, by - 82, 12, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, x - 10, by - 42, 5, 34, 3); ctx.fill();
      ctx.fillStyle = '#fff8e1'; U.roundRect(ctx, x - 11, by - 30, 22, 14, 3); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, by - 23, 4, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < Math.min(rings, 3); k++) this.drawRing(ctx, x, by - 50 + k * 7, 0.85, 0, ['#ffd23f', '#ff5c8a', '#4fc3f7'][k]);
    },
    drawRing(ctx, x, y, s, spin, col) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const squash = 0.4 + 0.12 * Math.sin(spin);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(1, 2, 22, 22 * squash, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, 22, 22 * squash, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -1, 21, 21 * squash, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
      ctx.restore();
    },
  },

  // ---- WHACK-A-MOLE: six holes; moles (and every third time a pizza slice) pop up and wait to be bonked ----
  mole: {
    GOAL: 6, HOLES: [[66, 206], [180, 206], [294, 206], [66, 346], [180, 346], [294, 346]], S: 1.25,
    btn: '🔨 Bonk!',
    init() { return { holes: this.HOLES.map(() => ({ s: 'down', up: 0, t: 0, stay: 0, kind: 'mole' })), cd: 0.3, hits: 0, n: 0, skipped: 0, hammer: null, taps: 0, sparks: [], texts: [] }; },
    spawn(G) {
      const free = []; G.holes.forEach((h, i) => { if (h.s === 'down') free.push(i); });
      if (!free.length) return;
      const h = G.holes[U.pick(free)];
      h.s = 'up'; h.t = 0; h.stay = G.skipped >= 2 ? 99 : 2.8 + G.skipped; h.kind = G.n++ % 3 === 2 ? 'pizza' : 'mole';
    },
    step(G, dt) {
      G.cd -= dt;
      const up = G.holes.filter((h) => h.s === 'up').length;
      if (G.cd <= 0 && up < 2) { this.spawn(G); G.cd = 1.0; }
      for (const h of G.holes) {
        if (h.s === 'up') { h.up = Math.min(1, h.up + dt * 5); h.t += dt; if (h.t > h.stay) { h.s = 'hide'; G.skipped++; } }
        else if (h.s === 'bonk') { h.t += dt; if (h.t > 0.7) h.s = 'hide'; }
        else if (h.s === 'hide') { h.up -= dt * 4; if (h.up <= 0) { h.up = 0; h.s = 'down'; } }
      }
      if (G.hammer) { G.hammer.t += dt; if (G.hammer.t > 0.3) G.hammer = null; }
    },
    bonk(G, i, A) {
      const h = G.holes[i], [hx, hy] = this.HOLES[i];
      h.s = 'bonk'; h.t = 0; G.hits++; G.skipped = 0;
      G.hammer = { x: hx + 24, y: hy - 84, t: 0 };
      A.burst(G, hx, hy - 60, 10, ['#ffd23f', '#fff', '#ff8f00']); A.text(G, hx, hy - 110, 'Bonk!', '#ffd23f');
      if (G.hits < this.GOAL) Sfx.pickup();
    },
    hitAt(G, x, y) {
      for (let i = 0; i < G.holes.length; i++) { const h = G.holes[i], [hx, hy] = this.HOLES[i]; if (h.s === 'up' && h.up > 0.3 && Math.abs(x - hx) < 60 && y > hy - 124 && y < hy + 40) return i; }
      return -1;
    },
    tap(G, x, y, A) { G.taps++; const i = this.hitAt(G, x, y); if (i >= 0) this.bonk(G, i, A); else G.hammer = { x, y, t: 0 }; },
    press(G, A) {
      let best = -1; G.holes.forEach((h, i) => { if (h.s === 'up' && (best < 0 || h.up > G.holes[best].up)) best = i; });
      G.taps++;
      if (best >= 0) this.bonk(G, best, A); else { this.spawn(G); G.cd = 1.0; }
    },
    goal(G) { return G.hits >= this.GOAL; },
    progress(G) { return G.hits; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.PIERGAMES.PF, t = g.time;
      ctx.fillStyle = '#8bd36b'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = '#7cc45c'; for (let i = 0; i < 26; i++) { const x = (i * 83) % PF.w, y = (i * 137) % PF.h; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + 3, y); ctx.lineTo(x + 6, y + 8); ctx.fill(); }
      ctx.fillStyle = '#ffd23f'; for (let i = 0; i < 8; i++) { const x = (i * 131 + 40) % PF.w, y = 60 + (i * 97) % 330; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
      G.holes.forEach((h, i) => {
        const [hx, hy] = this.HOLES[i];
        ctx.fillStyle = '#5d3a1a'; ctx.beginPath(); ctx.ellipse(hx, hy, 52, 19, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3e2510'; ctx.beginPath(); ctx.ellipse(hx, hy + 3, 44, 14, 0, 0, Math.PI * 2); ctx.fill();
        if (h.up > 0) {
          ctx.save(); ctx.beginPath(); ctx.rect(hx - 60, hy - 150, 120, 152); ctx.clip();
          const y = hy + 60 - h.up * 86;
          ctx.translate(hx, y); ctx.scale(this.S, this.S);
          if (h.kind === 'pizza') this.drawSliceGuy(ctx, 0, 0, h.s === 'bonk', t + i); else this.drawMole(ctx, 0, 0, h.s === 'bonk', t + i);
          ctx.restore();
          if (h.s === 'bonk') { ctx.fillStyle = '#ffd23f'; for (let k = 0; k < 3; k++) { const an = t * 7 + k * 2.1; A.drawStar(ctx, hx + Math.cos(an) * 30, y - 56 + Math.sin(an) * 8, 8, 3.5, 5); } }
        }
        // the dirt lip in front of the hole
        ctx.fillStyle = '#7a4b22'; ctx.beginPath(); ctx.ellipse(hx, hy + 6, 54, 13, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#946033'; ctx.beginPath(); ctx.ellipse(hx, hy + 5, 52, 9, 0, 0, Math.PI); ctx.fill();
      });
      if (G.hammer) this.drawHammer(ctx, G.hammer.x, G.hammer.y, G.hammer.t / 0.3);
      if (!G.taps) { const up = G.holes.findIndex((h) => h.s === 'up' && h.up > 0.6); if (up >= 0) { const [hx, hy] = this.HOLES[up]; ctx.font = r.font(34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👆', hx + 38, hy - 10 + Math.sin(t * 6) * 6); } }
      A.drawFx(ctx, r, G);
    },
    drawMole(ctx, x, y, bonked, t) {
      ctx.fillStyle = '#8d6e63'; U.roundRect(ctx, x - 26, y - 40, 52, 86, 24); ctx.fill();
      ctx.fillStyle = '#bcaaa4'; ctx.beginPath(); ctx.ellipse(x, y + 4, 17, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(x - 20, y - 34, 7, 0, Math.PI * 2); ctx.arc(x + 20, y - 34, 7, 0, Math.PI * 2); ctx.fill();
      this.face(ctx, x, y - 16, bonked);
      ctx.fillStyle = '#ff7ab8'; ctx.beginPath(); ctx.ellipse(x, y - 9, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 4, 3.5, 5); ctx.fillRect(x + 0.5, y - 4, 3.5, 5);
      ctx.fillStyle = '#f8bbd0'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 18, y + 2, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); }   // little paws on the rim
    },
    drawSliceGuy(ctx, x, y, bonked) {
      ctx.fillStyle = '#d98a3c'; U.roundRect(ctx, x - 30, y - 44, 60, 16, 8); ctx.fill();
      ctx.fillStyle = '#ffd45c'; ctx.beginPath(); ctx.moveTo(x - 27, y - 32); ctx.lineTo(x + 27, y - 32); ctx.lineTo(x, y + 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b'; for (const [dx, dy] of [[-12, -18], [12, -16], [0, 10]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy + 6, 5, 0, Math.PI * 2); ctx.fill(); }
      this.face(ctx, x, y - 12, bonked);
    },
    face(ctx, x, y, bonked) {
      ctx.fillStyle = '#2b1d14'; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5;
      if (bonked) { for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x + d * 9, y, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
      else { ctx.beginPath(); ctx.arc(x - 9, y, 3.5, 0, Math.PI * 2); ctx.arc(x + 9, y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 8, y - 1.5, 1.3, 0, Math.PI * 2); ctx.arc(x + 10, y - 1.5, 1.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,120,150,0.5)'; ctx.beginPath(); ctx.arc(x - 15, y + 6, 4, 0, Math.PI * 2); ctx.arc(x + 15, y + 6, 4, 0, Math.PI * 2); ctx.fill();
    },
    drawHammer(ctx, x, y, k) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.9 + Math.min(1, k * 2.5) * 1.2);
      ctx.fillStyle = '#c98b4a'; U.roundRect(ctx, -4, -6, 8, 46, 3); ctx.fill();
      ctx.fillStyle = '#e53935'; U.roundRect(ctx, -22, -24, 44, 22, 8); ctx.fill();
      ctx.fillStyle = '#ffd23f'; U.roundRect(ctx, -22, -24, 8, 22, 4); ctx.fill(); U.roundRect(ctx, 14, -24, 8, 22, 4); ctx.fill();
      ctx.restore();
    },
  },

  // ---- DUCK POND: ducks float round an island; the picked duck jumps up and shows the star under it ----
  duck: {
    GOAL: 1, N: 7, C: { x: 180, y: 238 }, RX: 132, RY: 92, PICK: 1.6,
    btn: '🦆 Pick a duck!',
    init() { return { a: 0.3, pick: null, done: false, sparks: [], texts: [] }; },
    pos(G, i) { const an = G.a + i * Math.PI * 2 / this.N; return { x: this.C.x + Math.cos(an) * this.RX, y: this.C.y + Math.sin(an) * this.RY }; },
    front(G) { let best = 0; for (let i = 1; i < this.N; i++) if (this.pos(G, i).y > this.pos(G, best).y) best = i; return best; },
    choose(G, i) { if (G.pick) return; G.pick = { i, t: 0, from: this.pos(G, i), shown: false }; Sfx.pickup(); },
    tap(G, x, y) {
      if (G.pick || y < 70 || y > 380) return;
      let best = 0, bd = Infinity; for (let i = 0; i < this.N; i++) { const p = this.pos(G, i), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } }
      this.choose(G, best);
    },
    press(G) { this.choose(G, this.front(G)); },
    step(G, dt, A) {
      if (!G.pick) { G.a += dt * 0.42; return; }
      G.pick.t += dt;
      if (!G.pick.shown && G.pick.t >= 0.95) { G.pick.shown = true; A.burst(G, 180, 120, 16, ['#ffd23f', '#fff', '#ff5c8a', '#4fc3f7']); }
      if (G.pick.t >= this.PICK) G.done = true;
    },
    goal(G) { return G.done; },
    progress(G) { return G.done ? 1 : 0; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.PIERGAMES.PF, t = g.time, C = this.C;
      ctx.fillStyle = '#c9ecff'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.strokeStyle = 'rgba(142,68,173,0.18)'; ctx.lineWidth = 4; for (let y = 30; y < PF.h; y += 44) { ctx.beginPath(); for (let x = 0; x <= PF.w; x += 10) ctx.lineTo(x, y + Math.sin(x / 18) * 5); ctx.stroke(); }
      // the pond: a wooden rim, the water channel and the island in the middle
      ctx.fillStyle = '#a0643a'; ctx.beginPath(); ctx.ellipse(C.x, C.y + 8, this.RX + 40, this.RY + 38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98b4a'; ctx.beginPath(); ctx.ellipse(C.x, C.y, this.RX + 38, this.RY + 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#29b6f6'; ctx.beginPath(); ctx.ellipse(C.x, C.y, this.RX + 28, this.RY + 24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3;
      for (let k = 0; k < 10; k++) { const an = k * 0.63 + t * 0.4, x = C.x + Math.cos(an) * (this.RX + 6), y = C.y + Math.sin(an) * (this.RY + 4); ctx.beginPath(); ctx.arc(x, y, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.fillStyle = '#c98b4a'; ctx.beginPath(); ctx.ellipse(C.x, C.y, this.RX - 30, this.RY - 28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8bd36b'; ctx.beginPath(); ctx.ellipse(C.x, C.y - 3, this.RX - 36, this.RY - 33, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = r.font(30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌷', C.x - 40, C.y - 6); ctx.fillText('🌼', C.x + 40, C.y - 2); ctx.fillText('⭐', C.x, C.y - 12 + Math.sin(t * 3) * 3);
      // the ducks, back to front
      const order = [...Array(this.N).keys()].sort((a, b) => this.pos(G, a).y - this.pos(G, b).y);
      for (const i of order) { if (G.pick && G.pick.i === i) continue; const p = this.pos(G, i); this.drawDuck(ctx, p.x, p.y + Math.sin(t * 3 + i) * 2, 0.8 + 0.25 * (p.y - C.y + this.RY) / (2 * this.RY), Math.cos(G.a + i * Math.PI * 2 / this.N) < 0 ? 1 : -1); }
      if (!G.pick) { const p = this.pos(G, this.front(G)); ctx.font = r.font(36); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👇', p.x, p.y - 58 + Math.sin(t * 6) * 6); }
      else {
        // the picked duck jumps up, grows and flips over to show the star on its bottom
        const k = G.pick.t, up = U.easeOut(Math.min(1, k / 0.6)), x = U.lerp(G.pick.from.x, 180, up), y = U.lerp(G.pick.from.y, 132, up), s = U.lerp(1, 2.3, up);
        const flip = k < 0.6 ? 1 : Math.cos(Math.min(1, (k - 0.6) / 0.35) * Math.PI);
        ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(flip) * 1 + 0.001, 1);
        if (flip >= 0) this.drawDuck(ctx, 0, 0, s, 1);
        else this.drawBottom(ctx, 0, 0, s, r);
        ctx.restore();
      }
      A.drawFx(ctx, r, G);
    },
    drawDuck(ctx, x, y, s, dir) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, 14, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(0, 4, 22, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-28, -8); ctx.lineTo(-16, -4); ctx.fill();                // tail
      ctx.beginPath(); ctx.arc(10, -12, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8f00'; ctx.beginPath(); ctx.ellipse(23, -9, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(13, -15, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f5b800'; ctx.beginPath(); ctx.ellipse(-4, 3, 10, 6, -0.3, 0, Math.PI * 2); ctx.fill();   // wing
      ctx.fillStyle = 'rgba(255,120,150,0.5)'; ctx.beginPath(); ctx.arc(8, -9, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
    drawBottom(ctx, x, y, s, r) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f5b800'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ff8f00'; PierGamesExt.drawStar(ctx, 0, 0, 12, 5.5, 5);
      ctx.restore();
    },
  },

  // ---- PRIZES: five big stuffed animals on the shelves; tap one (or the button takes the lit one) ----
  prize: {
    GOAL: 1, SPOTS: [[70, 168], [180, 168], [290, 168], [120, 318], [240, 318]], PICK: 1.2, CYCLE: 0.9,
    btn: '🧸 This one!',
    init() { return { hi: 1, ht: 0, pick: null, done: false, sparks: [], texts: [] }; },
    choose(G, i, A) { if (G.pick) return; G.pick = { i, t: 0 }; const [x, y] = this.SPOTS[i]; A.burst(G, x, y - 30, 14, ['#ffd23f', '#fff', '#ff5c8a']); Sfx.pickup(); },
    tap(G, x, y, A) {
      let best = -1, bd = 80; this.SPOTS.forEach(([sx, sy], i) => { const d = Math.hypot(sx - x, sy - 30 - y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) this.choose(G, best, A);
    },
    press(G, A) { this.choose(G, G.hi, A); },
    step(G, dt) {
      if (!G.pick) { G.ht += dt; if (G.ht >= this.CYCLE) { G.ht = 0; G.hi = (G.hi + 1) % this.SPOTS.length; } return; }
      G.pick.t += dt; if (G.pick.t >= this.PICK) G.done = true;
    },
    goal(G) { return G.done; },
    progress(G) { return G.done ? 1 : 0; },
    kind(i) { return CFG.PIERGAMES.PRIZES[i % CFG.PIERGAMES.PRIZES.length]; },
    draw(r, ctx, G, g, A) {
      const PF = CFG.PIERGAMES.PF, t = g.time;
      ctx.fillStyle = '#ffe0f0'; ctx.fillRect(0, 0, PF.w, PF.h);
      ctx.fillStyle = 'rgba(236,64,122,0.12)'; for (let x = 0; x < PF.w; x += 30) ctx.fillRect(x, 0, 15, PF.h);
      for (const sy of [196, 346]) { ctx.fillStyle = '#a0643a'; ctx.fillRect(10, sy, PF.w - 20, 12); ctx.fillStyle = '#7a4b22'; ctx.fillRect(10, sy + 12, PF.w - 20, 5); }
      this.SPOTS.forEach(([x, y], i) => {
        if (G.pick && G.pick.i === i) return;
        const lit = !G.pick && G.hi === i;
        if (lit) { const p = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = `rgba(255,236,120,${(0.45 + 0.35 * p).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y - 28, 52, 0, Math.PI * 2); ctx.fill(); }
        PierGamesExt.drawPlush(ctx, x, y - 26 + (lit ? -Math.abs(Math.sin(t * 6)) * 6 : 0), this.kind(i), 1.45);
        if (lit) { ctx.font = r.font(30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👇', x, y - 104 + Math.sin(t * 6) * 5); }
      });
      if (G.pick) {
        const k = U.easeOut(Math.min(1, G.pick.t / 0.6)), [x0, y0] = this.SPOTS[G.pick.i];
        PierGamesExt.drawPlush(ctx, U.lerp(x0, 180, k), U.lerp(y0 - 26, 210, k), this.kind(G.pick.i), U.lerp(1.45, 2.6, k));
      }
      A.drawFx(ctx, r, G);
    },
  },
};

const PierGamesExt = {
  st: null,
  // ---------- helpers ----------
  booth(key) { return CFG.PIERGAMES.BOOTHS.find((b) => b.key === key); },
  at(g, spot, d = CFG.PIERGAMES.REACH) { return U.dist(g.player.x, g.player.y, spot.x, spot.y) < d; },
  busy(g) { return !!(g.driving || g.travel || g.onTrain || g.ride); },
  nearBooth(g, d) { let best = null, bd = d; for (const b of CFG.PIERGAMES.BOOTHS) { const k = U.dist(g.player.x, g.player.y, b.spot.x, b.spot.y); if (k < bd) { bd = k; best = b; } } return best; },
  rects() { const K = CFG.PIERGAMES; return K.BOOTHS.map((b) => ({ x: b.x0, y: K.TOP, w: b.x1 - b.x0, h: K.FRONT_Y - K.TOP })); },

  // ---------- game hooks ----------
  defaults: { piergames: { seen: false, tickets: 0, prize: null, prizes: 0, wins: { ring: 0, mole: 0, duck: 0 } } },
  build(g) {
    if (!g.s.piergames) g.s.piergames = JSON.parse(JSON.stringify(this.defaults.piergames));
    if (!g.s.piergames.wins) g.s.piergames.wins = { ring: 0, mole: 0, duck: 0 };
    this.st = { play: null, carry: null, cheer: {}, attract: 0 };
  },
  home(g) { if (!this.st) return; this.st.play = null; this.st.cheer = {}; },
  obstacles(g) { return g.area === 'pizzapier' ? this.rects() : []; },
  // a save or a push that left the chef inside a booth puts them on the nearest booth spot
  rescue(g) {
    const p = g.player;
    if (!this.rects().some((o) => p.x > o.x - 4 && p.x < o.x + o.w + 4 && p.y > o.y && p.y < o.y + o.h)) return false;
    let best = CFG.PIERGAMES.BOOTHS[0], bd = Infinity;
    for (const b of CFG.PIERGAMES.BOOTHS) { const d = Math.abs(b.cx - p.x); if (d < bd) { bd = d; best = b; } }
    p.x = best.spot.x; p.y = best.spot.y; p.moving = false; g.cameraSnap = true;
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, K = CFG.PIERGAMES, p = g.player;
    st.attract += dt;
    for (const k of Object.keys(st.cheer)) { st.cheer[k] -= dt; if (st.cheer[k] <= 0) delete st.cheer[k]; }
    if (st.carry) { st.carry.t -= dt; if (st.carry.t <= 0) st.carry = null; }
    if (g.area !== 'pizzapier') { st.play = null; return; }
    if (!st.play && !this.busy(g)) this.rescue(g);
    if (!g.s.piergames.seen && !this.busy(g) && this.nearBooth(g, K.NEAR)) { g.s.piergames.seen = true; g.toast('🎪 The Midway! Win a prize! 🧸', true); }
    const pl = st.play; if (!pl) return;
    p.x = pl.hold.x; p.y = pl.hold.y; p.moving = false;
    if (pl.over > 0) {
      pl.over -= dt; pl.cardT += dt;
      for (const s of pl.confetti) { s.t += dt; s.y += s.vy * dt; s.x += Math.sin(s.t * 3 + s.ph) * 20 * dt; }
      if (!pl.sang && pl.cardT >= 0.3) { pl.sang = true; Sfx.unlock(); }
      if (pl.over <= 0) this.closeGame(g);
      return;
    }
    const def = PierGames[pl.key];
    pl.t += dt;
    def.step(pl.G, dt, this, g);
    this.stepFx(pl.G, dt);
    if (def.goal(pl.G)) this.win(g);
  },
  action(g) {
    if (!this.st || g.area !== 'pizzapier') return null;
    const st = this.st;
    if (st.play) {
      const pl = st.play, def = PierGames[pl.key];
      if (pl.over > 0) return { label: '🎉 Yay!', run: (gg) => this.closeGame(gg) };
      return { label: def.btn, run: () => def.press(pl.G, this, g) };
    }
    if (this.busy(g)) return null;
    for (const b of CFG.PIERGAMES.BOOTHS) if (this.at(g, b.spot)) {
      if (b.key === 'prize' && g.s.piergames.tickets < CFG.PIERGAMES.COST) return null;
      return { label: b.label, run: (gg) => this.startGame(gg, b) };
    }
    return null;
  },
  hint(g) {
    if (!this.st || g.area !== 'pizzapier' || this.busy(g)) return undefined;
    if (this.st.play) return null;
    const K = CFG.PIERGAMES, b = this.nearBooth(g, K.NEAR);
    if (!b) return undefined;
    if (b.key === 'prize' && g.s.piergames.tickets >= K.COST) return { text: '🎟️ Pick a prize! 🧸', target: null };
    return { text: 'Play a game and win a prize! 🧸', target: null };
  },
  startGame(g, b) {
    const st = this.st, p = g.player;
    if (st.play) return;
    st.play = { key: b.key, booth: b, t: 0, hold: { x: b.spot.x, y: b.spot.y }, G: PierGames[b.key].init(), over: 0, cardT: 0, reward: 0, prize: null, confetti: [], sang: false };
    p.x = b.spot.x; p.y = b.spot.y; p.moving = false;
    Haptics.tap();
  },
  // every game ends here: tickets for a game, a stuffed animal for the prize counter
  win(g) {
    const pl = this.st.play, K = CFG.PIERGAMES, s = g.s.piergames, PF = K.PF;
    if (!pl || pl.over > 0) return;
    if (pl.key === 'prize') {
      const kind = PierGames.prize.kind(pl.G.pick ? pl.G.pick.i : 0);
      s.tickets = Math.max(0, s.tickets - K.COST); s.prize = kind; s.prizes++; pl.prize = kind;
      this.st.carry = { kind, t: K.CARRY };
    } else {
      s.tickets += K.TICKETS; s.wins[pl.key] = (s.wins[pl.key] || 0) + 1; pl.reward = K.TICKETS;
    }
    pl.over = K.CARD; pl.cardT = 0;
    this.st.cheer[pl.key] = K.CARD + 2.5; this.st.cheer.crowd = K.CARD + 2.5;
    for (let i = 0; i < 40; i++) pl.confetti.push({ x: U.rand(0, PF.w), y: U.rand(-PF.h * 0.6, 0), vy: U.rand(90, 170), t: 0, ph: U.rand(0, 6), col: U.pick(['#ffd23f', '#ff5c8a', '#4fc3f7', '#8bd36b', '#fff']), s: U.rand(4, 7) });
    Haptics.success();
  },
  closeGame(g) {
    const pl = this.st.play; if (!pl) return;
    this.st.play = null;
    const p = g.player;
    if (pl.reward) g.floats.push({ x: p.x, y: p.y - 60, text: `🎟️ +${pl.reward}`, color: '#ffe08a', t: 0, dur: 1.8, big: true });
    else if (pl.prize) g.floats.push({ x: p.x, y: p.y - 70, text: '🧸 ❤️', color: '#ffe08a', t: 0, dur: 1.8, big: true });
  },
  // a tap on the canvas while a game is open: the ✖, the card, or the game itself
  screenTap(g, sx, sy) {
    const pl = this.st && this.st.play; if (!pl) return;
    const r = Render, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, L = this.layout(W, H);
    const fx = (sx - L.ox) / L.s, fy = (sy - L.oy) / L.s;
    if (Math.hypot(fx - (L.FW - 26), fy - 26) < 24) { this.st.play = null; return; }     // ✖ closes the game
    if (pl.over > 0) { if (pl.cardT > 0.8) this.closeGame(g); return; }
    PierGames[pl.key].tap(pl.G, fx - 20, fy - 64, this, g);
  },
  // playfield units to page (client) coordinates, for tests and debugging
  toClient(px, py) {
    const r = Render, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, L = this.layout(W, H), rect = r.canvas.getBoundingClientRect();
    return { x: rect.left + L.ox + (px + 20) * L.s, y: rect.top + L.oy + (py + 64) * L.s };
  },
  // ---------- little fx shared by the games ----------
  burst(G, x, y, n, cols) { for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + Math.random(), sp = U.rand(60, 170); G.sparks.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, dur: U.rand(0.4, 0.7), s: U.rand(4, 8), col: U.pick(cols) }); } },
  text(G, x, y, text, col) { G.texts.push({ x, y, text, col, t: 0, dur: 0.9 }); },
  stepFx(G, dt) {
    for (const s of G.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 80 * dt; }
    G.sparks = G.sparks.filter((s) => s.t < s.dur);
    for (const x of G.texts) x.t += dt;
    G.texts = G.texts.filter((x) => x.t < x.dur);
  },
  drawFx(ctx, r, G) {
    for (const s of G.sparks) { const k = s.t / s.dur; ctx.globalAlpha = 1 - k; ctx.fillStyle = s.col; this.drawStar(ctx, s.x, s.y, s.s * (1 - k * 0.5), s.s * 0.4, 5); }
    ctx.globalAlpha = 1;
    for (const x of G.texts) { const k = x.t / x.dur; ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.font = r.font(24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#2b1d14'; ctx.strokeText(x.text, x.x, x.y - k * 30); ctx.fillStyle = x.col; ctx.fillText(x.text, x.x, x.y - k * 30); }
    ctx.globalAlpha = 1;
  },
  drawStar(ctx, x, y, R, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  },

  // ======================= stuffed animals =======================
  // centred on (x, y), about 44 × 64 px at s = 1 (a bear's ears to its feet)
  drawPlush(ctx, x, y, kind, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const C = { bear: ['#b07a4a', '#e8c39e'], unicorn: ['#fdfbff', '#f3e5f5'], dino: ['#5cc96b', '#c8f2a8'], bunny: ['#ffc4dd', '#fff0f6'], pizza: ['#ffd45c', '#d98a3c'] }[kind] || ['#b07a4a', '#e8c39e'];
    const [col, light] = C;
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(0, 30, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1.2;
    if (kind === 'pizza') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(22, -22); ctx.lineTo(0, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = light; U.roundRect(ctx, -25, -32, 50, 13, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c0392b'; for (const [dx, dy] of [[-10, -10], [10, -8], [0, 12]]) { ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = col; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 17, -2, 4, 7, d * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      this.plushFace(ctx, 0, -3, 0.85);
      ctx.restore(); return;
    }
    // body, feet and arms
    ctx.fillStyle = col;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 10, 26, 8, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, 10, 17, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 17, 6, 5.5, 9, d * -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(0, 12, 10, 11, 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'dino') { ctx.fillStyle = '#ff8f00'; for (let k = 0; k < 4; k++) { const a = -2.4 + k * 0.45, px = Math.cos(a) * 18, py = -16 + Math.sin(a) * 18; ctx.beginPath(); ctx.moveTo(px - 4, py + 3); ctx.lineTo(px + Math.cos(a) * 7, py + Math.sin(a) * 7); ctx.lineTo(px + 4, py + 3); ctx.fill(); } }
    // ears
    if (kind === 'bunny') { ctx.fillStyle = col; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 7, -40, 5.5, 14, d * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.ellipse(d * 7, -40, 2.5, 9, d * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; } }
    else if (kind === 'bear' || kind === 'unicorn') { for (const d of [-1, 1]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(d * 12, -30, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = kind === 'unicorn' ? '#f8bbd0' : light; ctx.beginPath(); ctx.arc(d * 12, -30, 3.5, 0, Math.PI * 2); ctx.fill(); } }
    // head
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -17, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (kind === 'unicorn') {
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-4, -31); ctx.lineTo(4, -31); ctx.lineTo(0, -50); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f5a300'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, -36); ctx.lineTo(3, -38); ctx.moveTo(-2, -42); ctx.lineTo(2, -44); ctx.stroke();
      const mane = ['#ff5c8a', '#b388ff', '#4fc3f7', '#ff5c8a', '#b388ff']; mane.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-13 + k * 2.5, -30 + k * 7, 5.5, 0, Math.PI * 2); ctx.fill(); });
    }
    if (kind === 'bear' || kind === 'dino') { ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(0, -11, 7.5, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(0, -13, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill(); }
    if (kind === 'bunny') { ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.arc(0, -13, 2.2, 0, Math.PI * 2); ctx.fill(); }
    this.plushFace(ctx, 0, -19, 1, kind === 'bear' || kind === 'dino');
    if (kind === 'bear') { ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-7, -6); ctx.lineTo(-7, 2); ctx.closePath(); ctx.moveTo(0, -2); ctx.lineTo(7, -6); ctx.lineTo(7, 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },
  plushFace(ctx, x, y, s, noMouth) {
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 6 * s, y, 2.4 * s, 0, Math.PI * 2); ctx.arc(x + 6 * s, y, 2.4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 5.3 * s, y - 0.9 * s, 0.9 * s, 0, Math.PI * 2); ctx.arc(x + 6.7 * s, y - 0.9 * s, 0.9 * s, 0, Math.PI * 2); ctx.fill();
    if (!noMouth) { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y + 4 * s, 3.5 * s, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 2, y + 8, 2.2, 0.1, Math.PI - 0.3); ctx.arc(x + 2, y + 8, 2.2, 0.3, Math.PI - 0.1); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,120,150,0.45)'; ctx.beginPath(); ctx.arc(x - 10 * s, y + 4 * s, 2.6 * s, 0, Math.PI * 2); ctx.arc(x + 10 * s, y + 4 * s, 2.6 * s, 0, Math.PI * 2); ctx.fill();
  },

  // ======================= the booths in the park =======================
  paintAfter(r, g, area) {
    if (area !== 'pizzapier') return;
    const ctx = r.ctx, K = CFG.PIERGAMES, P = K.PLOT, B = K.BOOTHS;
    // the midway's tiled floor in front of the booths
    ctx.fillStyle = '#f3dcb2'; U.roundRect(ctx, P.x0 + 2, K.FRONT_Y - 6, P.x1 - P.x0 - 4, P.y1 - K.FRONT_Y + 4, 10); ctx.fill();
    for (let x = P.x0 + 8, i = 0; x < P.x1 - 14; x += 24, i++) for (let y = K.FRONT_Y + 2, j = 0; y < P.y1 - 10; y += 24, j++) {
      ctx.fillStyle = (i + j) % 2 ? '#f8e7c6' : '#ecd0a0'; ctx.fillRect(x, y, 22, 22);
    }
    for (const b of B) this.paintBooth(r, b);
    // bunting strung between the booth signs
    ctx.strokeStyle = '#7a4b22'; ctx.lineWidth = 1.5;
    for (let i = 0; i < B.length - 1; i++) {
      const xa = B[i].x1 - 16, xb = B[i + 1].x0 + 16, y = K.SIGN_Y + 8;
      ctx.beginPath(); ctx.moveTo(xa, y); ctx.quadraticCurveTo((xa + xb) / 2, y + 22, xb, y); ctx.stroke();
      for (let k = 1; k < 4; k++) {
        const u = k / 4, x = U.lerp(xa, xb, u), yy = y + 2 * u * (1 - u) * 22;
        ctx.fillStyle = ['#ff5c8a', '#ffd23f', '#4fc3f7'][k % 3]; ctx.beginPath(); ctx.moveTo(x - 6, yy); ctx.lineTo(x + 6, yy); ctx.lineTo(x, yy + 11); ctx.closePath(); ctx.fill();
      }
    }
  },
  paintBooth(r, b) {
    const ctx = r.ctx, K = CFG.PIERGAMES, x0 = b.x0, x1 = b.x1, w = x1 - x0, cx = b.cx;
    const sy = K.SIGN_Y, ay = K.AWN_Y, ab = K.AWN_B, cy = K.COUNTER_Y, fy = K.FRONT_Y;
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x0 + 4, fy - 2, w - 2, 10);
    // the back wall with a soft pattern
    ctx.fillStyle = b.back; ctx.fillRect(x0 + 8, ab - 6, w - 16, cy - ab + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let x = x0 + 16; x < x1 - 10; x += 18) for (let y = ab + 8; y < cy - 4; y += 18) { ctx.beginPath(); ctx.arc(x + ((y / 18) % 2) * 9, y, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0 + 8, ab - 6, w - 16, 8);
    // candy-striped corner posts
    for (const px of [x0 + 1, x1 - 11]) {
      ctx.fillStyle = '#fff'; U.roundRect(ctx, px, ay, 10, fy - ay, 4); ctx.fill();
      ctx.fillStyle = b.awning; for (let y = ay + 4; y < fy - 6; y += 12) { ctx.beginPath(); ctx.moveTo(px, y + 6); ctx.lineTo(px + 10, y); ctx.lineTo(px + 10, y + 4); ctx.lineTo(px, y + 10); ctx.closePath(); ctx.fill(); }
    }
    // what the game shows inside
    if (b.key === 'ring') {
      ctx.fillStyle = '#c62828'; ctx.fillRect(x0 + 14, cy - 18, w - 70, 18); ctx.fillStyle = '#fff'; for (let x = x0 + 14; x < x0 + w - 56; x += 10) { ctx.beginPath(); ctx.arc(x + 5, cy, 5, Math.PI, 0); ctx.fill(); }
      const cols = ['#2e7d32', '#1565c0', '#6d4c41', '#00897b', '#7b1fa2'];
      [[x0 + 30, cy - 18], [x0 + 50, cy - 18], [x0 + 70, cy - 18], [x0 + 40, cy - 46], [x0 + 60, cy - 46]].forEach(([x, y], i) => { ctx.save(); ctx.translate(x, y); ctx.scale(0.36, 0.36); PierGames.ring.drawBottle(ctx, 0, 0, cols[i], i === 3 ? 1 : 0); ctx.restore(); });
    } else if (b.key === 'mole') {
      ctx.save(); ctx.translate(x0 + 50, cy - 40); ctx.scale(0.6, 0.6); PierGames.mole.drawMole(ctx, 0, 0, false, 0); ctx.restore();
      ctx.save(); ctx.translate(x0 + 80, cy - 46); ctx.rotate(0.4); ctx.scale(0.55, 0.55); PierGames.mole.drawHammer(ctx, 0, 0, 1); ctx.restore();
    } else if (b.key === 'duck') {
      ctx.strokeStyle = 'rgba(142,68,173,0.3)'; ctx.lineWidth = 3; for (let y = ab + 18; y < cy - 26; y += 14) { ctx.beginPath(); for (let x = x0 + 12; x <= x1 - 12; x += 6) ctx.lineTo(x, y + Math.sin(x / 7) * 3); ctx.stroke(); }
    } else if (b.key === 'prize') {
      ctx.fillStyle = '#a0643a'; ctx.fillRect(x0 + 10, ab + 34, w - 20, 5); ctx.fillRect(x0 + 66, cy - 30, 36, 4);
      K.PRIZES.forEach((k, i) => this.drawPlush(ctx, x0 + 24 + i * 25, ab + 22, k, 0.42));
      this.drawPlush(ctx, x0 + 76, cy - 42, 'bunny', 0.36); this.drawPlush(ctx, x0 + 94, cy - 42, 'dino', 0.36);
    }
    // giant stuffed animals hanging from the awning (the prize booth keeps its own on the shelves)
    if (b.key !== 'prize') {
      ctx.strokeStyle = '#7a4b22'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + 12, ab + 2); ctx.lineTo(x1 - 12, ab + 2); ctx.stroke();
      const hang = { ring: ['bear', 'unicorn'], mole: ['dino', 'pizza'], duck: ['bunny', 'bear'] }[b.key];
      [[x0 + 28, hang[0]], [x1 - 28, hang[1]]].forEach(([x, k]) => { ctx.beginPath(); ctx.moveTo(x, ab + 2); ctx.lineTo(x, ab + 8); ctx.stroke(); this.drawPlush(ctx, x, ab + 30, k, 0.55); });
    }
    // the striped awning with a scalloped edge
    const sw = 15, n = Math.ceil((w + 8) / sw);
    for (let i = 0; i < n; i++) {
      const x = x0 - 4 + i * sw, col = i % 2 ? '#fff' : b.awning;
      ctx.fillStyle = col; ctx.fillRect(x, ay, Math.min(sw, x1 + 4 - x), ab - ay);
      ctx.beginPath(); ctx.arc(x + sw / 2, ab, sw / 2, 0, Math.PI); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0 - 4, ay, w + 8, 4);
    ctx.fillStyle = b.dark; ctx.fillRect(x0 - 4, ay - 3, w + 8, 4);
    // the sign board: the game's picture and its name
    ctx.fillStyle = '#2b1d45'; U.roundRect(ctx, x0 + 12, sy, w - 24, ay - sy, 8); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.5; U.roundRect(ctx, x0 + 15, sy + 3, w - 30, ay - sy - 6, 6); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = r.font(17); ctx.fillText(b.ico, cx - 40, sy + 18); ctx.fillText(b.ico, cx + 40, sy + 18);
    ctx.font = r.font(11); ctx.fillStyle = '#ffd23f'; ctx.fillText(b.title, cx, sy + 18);
  },
  // bulbs around each sign and along each awning edge
  bulbs() {
    if (this._bulbs) return this._bulbs;
    const K = CFG.PIERGAMES, out = [];
    for (const b of K.BOOTHS) {
      for (let x = b.x0 + 18, i = 0; x <= b.x1 - 18; x += 12, i++) out.push({ x, y: K.SIGN_Y, i });
      for (let x = b.x0 + 3, i = 0; x <= b.x1; x += 15, i++) out.push({ x: x + 4, y: K.AWN_B + 9, i: i + 1 });
    }
    return (this._bulbs = out);
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'pizzapier') return;
    const P = CFG.PIERGAMES.PLOT;
    if (P.x1 < r.camX || P.x0 > r.camX + r.viewW || P.y1 < r.camY || P.y0 > r.camY + r.viewH) return;
    const ctx = r.ctx, dusk = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.dusk || 0 : 0, step = Math.floor(g.time * 3);
    const party = Object.keys(this.st.cheer).length > 0;
    if (dusk > 0.05) { ctx.fillStyle = `rgba(255,214,110,${(0.32 * dusk).toFixed(3)})`; for (const b of this.bulbs()) { ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill(); } }
    for (const b of this.bulbs()) {
      const on = party ? (b.i + step) % 2 === 0 : (b.i + step) % 3 !== 0;
      ctx.fillStyle = on ? (dusk > 0.3 ? '#fff6c8' : '#ffe680') : '#c9a54a';
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.8, 0, Math.PI * 2); ctx.fill();
    }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player;
    if (st.carry && !g.driving && !g.onTrain && !g.travel) items.push({ y: p.y + 0.5, draw: () => this.drawCarried(r, g) });
    if (g.area !== 'pizzapier') return;
    const K = CFG.PIERGAMES, P = K.PLOT;
    if (P.x1 < r.camX || P.x0 > r.camX + r.viewW || P.y1 < r.camY || P.y0 > r.camY + r.viewH + 80) return;
    for (const b of K.BOOTHS) items.push({ y: K.FRONT_Y, draw: () => this.drawBoothFront(r, g, b) });
    K.VISITORS.forEach((v, i) => items.push({ y: v.y, draw: () => this.drawVisitor(r, g, v, i) }));
  },
  // the chef hugs the new prize at their side
  drawCarried(r, g) {
    const p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    this.drawPlush(r.ctx, p.x + f * 15, p.y - 18 + bob, this.st.carry.kind, 0.62);
  },
  // the worker and what moves at the counter, then the counter front over the worker's legs
  drawBoothFront(r, g, b) {
    const ctx = r.ctx, K = CFG.PIERGAMES, t = g.time, x0 = b.x0, x1 = b.x1, cy = K.COUNTER_Y, fy = K.FRONT_Y, cx = b.cx, st = this.st;
    const cheer = st.cheer[b.key] > 0, near = !st.play && this.nearBooth(g, 90) === b;
    const wx = cx + 42, hop = cheer ? Math.abs(Math.sin(t * 9)) * 7 : 0;
    r.drawPerson(wx, cy + 8 - hop, { shirt: b.shirt, skin: b.skin, hat: 'cap', capColor: b.cap, facing: -1, moving: false, bob: 0, carry: 0, stripes: true, pants: '#3a3f5c' });
    if (cheer || near) { ctx.font = r.font(cheer ? 16 : 13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(wx + 20, cy - 34 - hop); ctx.rotate(Math.sin(t * (cheer ? 14 : 6)) * 0.35); ctx.fillText('👋', 0, 0); ctx.restore(); }
    if (cheer) { ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.fillText('🎉', wx - 4, cy - 66 - Math.abs(Math.sin(t * 4)) * 6); }
    if (b.key === 'mole') {   // moles bob up and down in three holes on the counter
      for (let i = 0; i < 3; i++) {
        const hx = x0 + 30 + i * 30, up = Math.max(0, Math.sin(t * 1.7 + i * 2.2)) * (cheer ? 1 : 0.9);
        if (up > 0.05) { ctx.save(); ctx.beginPath(); ctx.rect(hx - 15, cy - 40, 30, 40); ctx.clip(); ctx.translate(hx, cy + 14 - up * 30); ctx.scale(0.42, 0.42); PierGames.mole.drawMole(ctx, 0, 0, cheer, t); ctx.restore(); }
        ctx.fillStyle = '#3e2510'; ctx.beginPath(); ctx.ellipse(hx, cy + 1, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (b.key === 'duck') {   // a water channel on the counter with ducks floating along
      ctx.fillStyle = '#29b6f6'; U.roundRect(ctx, x0 + 12, cy - 12, 90, 14, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 5; k++) ctx.fillRect(x0 + 16 + ((k * 19 + t * 14) % 82), cy - 7, 6, 2);
      for (let k = 0; k < 4; k++) { const u = (k * 22.5 + t * 14) % 90; PierGames.duck.drawDuck(ctx, x0 + 14 + u, cy - 8 + Math.sin(t * 3 + k) * 1.2, 0.38, 1); }
    } else if (b.key === 'prize') {   // the little shelf with the latest prize, and a gold star
      const s = g.s.piergames;
      ctx.fillStyle = '#7a4b22'; ctx.fillRect(x0 + 14, cy - 3, 46, 5); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x0 + 14, cy - 5, 46, 2);
      if (s.prize) { this.drawPlush(ctx, x0 + 36, cy - 22, s.prize, 0.5); ctx.fillStyle = '#ffd23f'; this.drawStar(ctx, x0 + 56, cy - 36, 7, 3, 5); }
    }
    // the counter: a wooden ledge and a striped front panel
    ctx.fillStyle = b.awning; ctx.fillRect(x0 + 10, cy + 6, x1 - x0 - 20, fy - cy - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let x = x0 + 16; x < x1 - 14; x += 16) ctx.fillRect(x, cy + 6, 7, fy - cy - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x0 + 10, fy - 5, x1 - x0 - 20, 5);
    ctx.fillStyle = '#c98b4a'; U.roundRect(ctx, x0 + 6, cy, x1 - x0 - 12, 8, 3); ctx.fill();
    ctx.fillStyle = '#a0643a'; ctx.fillRect(x0 + 8, cy + 6, x1 - x0 - 16, 2);
    // the badge on the front: the game's picture, or the ticket count on the prize counter
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (b.key === 'prize') {
      const n = g.s.piergames.tickets;
      ctx.fillStyle = '#fff8e1'; U.roundRect(ctx, cx - 34, cy + 11, 68, 24, 8); ctx.fill(); ctx.strokeStyle = b.dark; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = r.font(13); ctx.fillStyle = '#2b1d14'; ctx.fillText(`🎟️ ${n}`, cx, cy + 24);
    } else {
      ctx.fillStyle = '#fff8e1'; ctx.beginPath(); ctx.arc(cx, cy + 22, 13, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = b.dark; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = r.font(14); ctx.fillText(b.ico, cx, cy + 23);
    }
    // a bouncing arrow on the booth to play at when the chef is close
    if (near && !this.busy(g) && (b.key !== 'prize' || g.s.piergames.tickets >= K.COST)) { ctx.font = r.font(18); ctx.fillText('👇', b.spot.x, b.spot.y - 74 + Math.sin(t * 5) * 4); }
  },
  drawVisitor(r, g, v, i) {
    const ctx = r.ctx, t = g.time, hop = this.st.cheer.crowd > 0 ? Math.abs(Math.sin(t * 8 + i)) * 6 : 0;
    const bx = v.x + 10 + Math.sin(t * 1.3 + i) * 3, by = v.y - 78 - hop + Math.sin(t * 2 + i) * 2;
    ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.x + 14, v.y - 16 - hop); ctx.lineTo(bx, by + 13); ctx.stroke();
    ctx.fillStyle = v.balloon; ctx.beginPath(); ctx.ellipse(bx, by, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(bx - 3, by - 4, 3, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    r.drawPerson(v.x, v.y - hop, Object.assign({ facing: i ? -1 : 1, moving: false, bob: 0, carry: 0 }, v.look));
  },

  // ======================= the big screen: a booth frame around the playfield =======================
  // Frame units: an awning on top (0..56), the playfield PF.w × PF.h at (20, 64), the ticket strip below. Scaled to fit
  // between the HUD at the top and the big button at the bottom, so it works at 390×844 as well as on a desktop.
  layout(W, H) {
    const PF = CFG.PIERGAMES.PF, FW = PF.w + 40, FH = PF.h + 130, top = 56, bottom = 92;
    const s = Math.min((W - 16) / FW, (H - top - bottom) / FH);
    return { s, ox: (W - FW * s) / 2, oy: top + (H - top - bottom - FH * s) / 2, FW, FH };
  },
  screen(r, g) {
    if (!this.st || !this.st.play || g.area !== 'pizzapier') return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, pl = this.st.play, b = pl.booth, def = PierGames[pl.key], PF = CFG.PIERGAMES.PF, L = this.layout(W, H), t = g.time;
    ctx.fillStyle = 'rgba(20,10,30,0.66)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.s, L.s);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, 6, 10, L.FW, L.FH, 20); ctx.fill();
    ctx.fillStyle = '#fff6e6'; U.roundRect(ctx, 0, 0, L.FW, L.FH, 20); ctx.fill();
    // the awning across the top
    ctx.save(); U.roundRect(ctx, 0, 0, L.FW, L.FH, 20); ctx.clip();
    for (let i = 0, x = 0; x < L.FW; i++, x += 25) { ctx.fillStyle = i % 2 ? '#fff' : b.awning; ctx.fillRect(x, 0, 25, 48); ctx.beginPath(); ctx.arc(x + 12.5, 48, 12.5, 0, Math.PI); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = b.dark; ctx.lineWidth = 5; U.roundRect(ctx, 0, 0, L.FW, L.FH, 20); ctx.stroke();
    ctx.fillStyle = '#2b1d45'; U.roundRect(ctx, L.FW / 2 - 110, 8, 220, 32, 10); ctx.fill();
    ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd23f'; ctx.fillText(`${b.ico} ${b.title} ${b.ico}`, L.FW / 2, 25);
    // the ✖ in the corner
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(L.FW - 26, 26, 17, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = b.dark; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(L.FW - 32, 20); ctx.lineTo(L.FW - 20, 32); ctx.moveTo(L.FW - 20, 20); ctx.lineTo(L.FW - 32, 32); ctx.stroke(); ctx.lineCap = 'butt';
    // the playfield
    ctx.save(); ctx.translate(20, 64); ctx.beginPath(); U.roundRect(ctx, 0, 0, PF.w, PF.h, 12); ctx.clip();
    def.draw(r, ctx, pl.G, g, this);
    if (pl.over > 0) this.drawCard(r, g, pl);
    ctx.restore();
    ctx.strokeStyle = b.dark; ctx.lineWidth = 4; U.roundRect(ctx, 20, 64, PF.w, PF.h, 12); ctx.stroke();
    // the strip under it: how far along you are, and your tickets
    const sy = 64 + PF.h + 10;
    ctx.fillStyle = '#2b1d45'; U.roundRect(ctx, 20, sy, PF.w, 44, 12); ctx.fill();
    const goal = def.GOAL, done = Math.min(goal, def.progress(pl.G));
    if (goal > 1) for (let i = 0; i < goal; i++) {
      const x = 46 + i * 34, y = sy + 22, on = i < done;
      ctx.fillStyle = on ? '#ffd23f' : 'rgba(255,255,255,0.18)'; this.drawStar(ctx, x, y, on ? 14 : 12, on ? 6 : 5, 5);
    } else { ctx.font = r.font(24); ctx.textAlign = 'left'; ctx.fillText(b.ico, 36, sy + 23); }
    ctx.font = r.font(22); ctx.textAlign = 'right'; ctx.fillStyle = '#ffe08a'; ctx.fillText(`🎟️ ${g.s.piergames.tickets}`, 20 + PF.w - 14, sy + 23);
    ctx.restore();
  },
  // the "You win!" card: confetti, a cheering worker, the tickets (or the new prize)
  drawCard(r, g, pl) {
    const ctx = r.ctx, PF = CFG.PIERGAMES.PF, b = pl.booth, t = g.time, k = pl.cardT, pop = U.easeOut(Math.min(1, k * 4));
    ctx.fillStyle = 'rgba(20,10,30,0.25)'; ctx.fillRect(0, 0, PF.w, PF.h);
    for (const s of pl.confetti) { ctx.fillStyle = s.col; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.t * 4 + s.ph); ctx.fillRect(-s.s / 2, -s.s / 4, s.s, s.s / 2); ctx.restore(); }
    const cw = 290, ch = 230, cx = PF.w / 2, cy = PF.h / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, -cw / 2 + 5, -ch / 2 + 7, cw, ch, 20); ctx.fill();
    ctx.fillStyle = '#fff8e1'; U.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 20); ctx.fill();
    ctx.strokeStyle = b.awning; ctx.lineWidth = 6; U.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 20); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = r.font(40); ctx.fillText('🎉', -cw / 2 + 36, -ch / 2 + 36); ctx.fillText('🎉', cw / 2 - 36, -ch / 2 + 36);
    ctx.font = r.font(26); ctx.fillStyle = '#2b1d14'; ctx.fillText('You win!', 0, -ch / 2 + 38);
    // the booth worker cheering on the left
    const hop = Math.abs(Math.sin(t * 9)) * 8, wx = -88, wy = ch / 2 - 22 - hop;
    r.drawPerson(wx, wy, { shirt: b.shirt, skin: b.skin, hat: 'cap', capColor: b.cap, facing: 1, moving: false, bob: 0, carry: 0, stripes: true, pants: '#3a3f5c' });
    ctx.font = r.font(24); ctx.save(); ctx.translate(wx + 26, wy - 54); ctx.rotate(Math.sin(t * 14) * 0.4); ctx.fillText('👋', 0, 0); ctx.restore();
    if (pl.prize) this.drawPlush(ctx, 34, 26, pl.prize, 1.7);
    else {
      // a big orange ticket with +10 on it
      ctx.save(); ctx.translate(34, 22); ctx.rotate(-0.08 + Math.sin(t * 3) * 0.05);
      ctx.fillStyle = '#ff8f00'; U.roundRect(ctx, -70, -34, 140, 68, 10); ctx.fill();
      ctx.fillStyle = '#fff8e1'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 70, 0, 11, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); U.roundRect(ctx, -56, -25, 112, 50, 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = r.font(30); ctx.fillStyle = '#fff'; ctx.fillText(`🎟️ +${pl.reward}`, 0, 2);
      ctx.restore();
    }
    ctx.restore();
  },
};

// taps on the game canvas while a booth game is open go to the game (not to the joystick)
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    const X = PierGamesExt;
    if (!X.st || !X.st.play || typeof Game === 'undefined' || Game.area !== 'pizzapier' || !Render.canvas || e.target !== Render.canvas) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { Sfx.init(); Sfx.resume(); } catch (err) { /* ignore */ }
    const rect = Render.canvas.getBoundingClientRect();
    X.screenTap(Game, e.clientX - rect.left, e.clientY - rect.top);
  }, true);
}

Game.ext.unshift(PierGamesExt);
Render.ext.push(PierGamesExt);
