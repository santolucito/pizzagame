'use strict';
// Inside the barn: its own little map behind the big door on the farm. A cosy barn with a goat and a pig to pat, hens
// that scatter and lay eggs, hay bales (one to sit on), a ladder up to the hayloft with a window onto the farm, a tractor
// poster, a sleeping cat, swallows under the roof and dust in the sunbeam. Extension module (see js/EXTENSIONS.md).
CFG.AREAS.barn = { WORLD: { x0: 0, y0: 4000, x1: 600, y1: 4400 } };
CFG.BARN = {
  // where you stand on the farm to go in: on the grass right in front of the big door on the barn's right wall
  DOOR_OUT: { x: -774, y: 232 },
  room: { x0: 48, y0: 4130, x1: 552, y1: 4364 }, wall: 22,     // the floor; the back wall carries the hayloft
  loft: { x0: 48, y0: 4040, x1: 552, y1: 4108, walk: { x0: 70, y0: 4050, x1: 530, y1: 4100 } },
  roof: { y0: 4000, y1: 4040 },                               // the back wall up under the rafters (window, poster, swallows)
  ladder: { x: 424, foot: { x: 424, y: 4152 }, top: { x: 424, y: 4086 } },
  window: { x: 300, y: 4021, r: 15 }, eye: { x: 300, y: 4084 },   // stand at the eye spot in the loft to look out
  poster: { x: 170, y: 4020 },
  nest: { x: 548, y: 4014 },
  stalls: {
    goat: { x0: 64, y0: 4146, x1: 180, y1: 4226, at: { x: 120, y: 4196 } },
    pig: { x0: 64, y0: 4246, x1: 180, y1: 4326, at: { x: 120, y: 4296 } },
  },
  bales: [{ x: 300, y: 4316 }, { x: 348, y: 4316 }, { x: 236, y: 4316, seat: true }],
  baleW: 48, baleH: 30,
  sack: { x: 508, y: 4158 }, cat: { x: 508, y: 4150 },
  barrow: { x: 470, y: 4336 },
  bucket: { x: 200, y: 4344 },
  exit: { x: 520, y: 4252 }, door: { y0: 4212, y1: 4292 },    // the big door is in the right wall; the mat is inside it
  henArea: { x0: 215, y0: 4168, x1: 468, y1: 4280 },
  VIEW: 5, PAT: 1.6, EGG_MAX: 2,
};

const BarnExt = {
  name: 'barn',
  st: null,
  defaults: { barn: { eggs: 0, seen: false } },

  build(g) {
    if (!g.s.barn) g.s.barn = { eggs: 0, seen: false };
    this.st = {
      fade: 0, loft: false, view: 0, seat: null,
      goat: { happy: 0, t: 0, pats: 0 }, pig: { happy: 0, t: 0, pats: 0 },
      hens: [{ x: 300, y: 4210, c: '#c97a3a' }, { x: 380, y: 4240, c: '#f5f0dc' }, { x: 420, y: 4200, c: '#8d5a2b' }].map((h, i) => ({ x: h.x, y: h.y, col: h.c, facing: i % 2 ? -1 : 1, target: null, wait: U.rand(0.5, 2), flee: 0, vx: 0, vy: 0, bob: 0, peck: 0, bok: 0 })),
      eggs: [], eggT: 0, bokT: 0,
      cat: { z: 0 }, obs: null,
    };
    this.st.obs = this.floorBlocks();
  },

  // ---------- geometry ----------
  floorBlocks() {
    const K = CFG.BARN, R = K.room, w = K.wall, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const s of [K.stalls.goat, K.stalls.pig]) o.push({ x: s.x0, y: s.y0, w: s.x1 - s.x0, h: s.y1 - s.y0 });
    for (const b of K.bales) o.push({ x: b.x - K.baleW / 2, y: b.y - 18, w: K.baleW, h: 26 });
    o.push({ x: K.sack.x - 26, y: K.sack.y - 18, w: 52, h: 30 });
    o.push({ x: K.barrow.x - 24, y: K.barrow.y - 12, w: 48, h: 22 });
    o.push({ x: K.bucket.x - 8, y: K.bucket.y - 8, w: 16, h: 12 });
    return o;
  },
  loftEdges() {
    const L = CFG.BARN.loft.walk, W = CFG.AREAS.barn.WORLD;
    return [
      { x: W.x0, y: W.y0, w: W.x1 - W.x0, h: L.y0 - W.y0 }, { x: W.x0, y: L.y1, w: W.x1 - W.x0, h: W.y1 - L.y1 },
      { x: W.x0, y: W.y0, w: L.x0 - W.x0, h: W.y1 - W.y0 }, { x: L.x1, y: W.y0, w: W.x1 - L.x1, h: W.y1 - W.y0 },
    ];
  },
  // Is this somewhere the chef can stand: on the floor clear of the walls and the furniture, or on the loft planks?
  free(x, y) {
    const K = CFG.BARN, r = 12;
    if (this.st.loft) { const L = K.loft.walk; return x >= L.x0 + r && x <= L.x1 - r && y >= L.y0 + r && y <= L.y1 - r; }
    const R = K.room;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // Rescue: a save (or a push) that left the chef in a wall or inside the furniture goes back onto the door mat.
  rescue(g) {
    const p = g.player, K = CFG.BARN;
    if (this.free(p.x, p.y)) return false;
    if (this.st.loft) { p.x = K.ladder.top.x; p.y = K.ladder.top.y; }
    else { p.x = K.exit.x; p.y = K.exit.y - 8; }
    p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  seatBale() { return CFG.BARN.bales.find((b) => b.seat); },

  // ---------- game hooks ----------
  obstacles(g) { return g.area === 'barn' && this.st ? this.st.obs : []; },
  obstaclesOverride(g) { return g.area === 'barn' && this.st && this.st.loft ? this.loftEdges() : null; },
  action(g) {
    if (!this.st) return null;
    const p = g.player, K = CFG.BARN, st = this.st;
    if (g.driving || g.onTrain || g.ride || g.travel) return null;
    if (g.area === 'town') return U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y) < 30 ? { label: '🚪 Go into the barn', run: (gg) => this.enter(gg) } : null;
    if (g.area !== 'barn') return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (st.loft) {
      if (st.view <= 0 && U.dist(p.x, p.y, K.eye.x, K.eye.y) < 40) return { label: '🪟 Look outside', run: (gg) => this.lookOut(gg) };
      return { label: '🪜 Climb down', run: (gg) => this.climbDown(gg) };
    }
    if (U.dist(p.x, p.y, K.exit.x, K.exit.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (U.dist(p.x, p.y, K.ladder.foot.x, K.ladder.foot.y) < 34) return { label: '🪜 Climb up', run: (gg) => this.climbUp(gg) };
    if (U.dist(p.x, p.y, K.stalls.goat.at.x, K.stalls.goat.at.y) < 100) return { label: '🐐 Pat the goat', run: (gg) => this.pat(gg, 'goat') };
    if (U.dist(p.x, p.y, K.stalls.pig.at.x, K.stalls.pig.at.y) < 100) return { label: '🐷 Pat the pig', run: (gg) => this.pat(gg, 'pig') };
    const b = this.seatBale();
    if (U.dist(p.x, p.y, b.x, b.y) < 48) return { label: '🪑 Sit on the hay', run: (gg) => this.sit(gg) };
    return null;
  },
  enter(g) {
    const K = CFG.BARN, p = g.player;
    g.area = 'barn'; p.x = K.exit.x; p.y = K.exit.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.loft = false; this.st.seat = null; this.st.view = 0; Sfx.ding(); Haptics.tap();
    if (!g.s.barn.seen) { g.s.barn.seen = true; g.toast('🐐 Welcome to the barn!', true); }
  },
  leave(g) {
    const K = CFG.BARN, p = g.player;
    g.area = 'town'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.loft = false; this.st.seat = null; this.st.view = 0; Sfx.drop();
  },
  climbUp(g) {
    const K = CFG.BARN, p = g.player, st = this.st;
    st.loft = true; p.x = K.eye.x; p.y = K.eye.y; p.moving = false; p.facing = 1; st.fade = 0.45; st.view = K.VIEW;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Up in the hayloft! 🌾', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  climbDown(g) {
    const K = CFG.BARN, p = g.player, st = this.st;
    st.loft = false; st.view = 0; p.x = K.ladder.foot.x; p.y = K.ladder.foot.y + 4; p.moving = false; st.fade = 0.45; Sfx.drop();
  },
  lookOut(g) { const K = CFG.BARN, p = g.player; p.x = K.eye.x; p.y = K.eye.y; p.moving = false; this.st.view = K.VIEW; Sfx.chime(); Haptics.tap(); },
  pat(g, who) {
    const K = CFG.BARN, a = this.st[who], at = K.stalls[who].at, p = g.player;
    a.happy = K.PAT; a.pats++; p.facing = at.x < p.x ? -1 : 1;
    g.floats.push({ x: at.x + 10, y: at.y - 46, text: who === 'goat' ? 'Baa! 💛' : 'Oink! 💗', color: who === 'goat' ? '#ffe08a' : '#ffb6c1', t: 0, dur: 1.4, big: true });
    g.fx.push({ kind: 'sparkle', x0: at.x, y0: at.y - 10, x1: at.x, y1: at.y - 10, t: 0, dur: 0.6 });
    if (who === 'goat') Sfx.ding(); else Sfx.chime();
    Haptics.tap();
  },
  sit(g) {
    const b = this.seatBale(), p = g.player;
    this.st.seat = { x: b.x, y: b.y - 8 }; p.x = b.x; p.y = b.y - 8; p.moving = false; p.facing = 1;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Comfy! 🌾', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) { const b = this.seatBale(), p = g.player; this.st.seat = null; p.x = b.x; p.y = b.y + 28; p.moving = false; Sfx.drop(); },
  home() { if (!this.st) return; this.st.loft = false; this.st.seat = null; this.st.view = 0; this.st.fade = 0; },

  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st;
    st.fade = Math.max(0, st.fade - dt);
    if (g.area !== 'barn') { if (st.loft || st.seat) { st.loft = false; st.seat = null; st.view = 0; } return; }
    const p = g.player, K = CFG.BARN;
    if (st.seat) { p.x = st.seat.x; p.y = st.seat.y; p.moving = false; }
    else this.rescue(g);
    if (st.view > 0) { st.view = Math.max(0, st.view - dt); if (p.moving) st.view = Math.min(st.view, 0.5); }
    for (const who of ['goat', 'pig']) { const a = st[who]; a.happy = Math.max(0, a.happy - dt); a.t += dt; }
    // the hens: wander and peck; when the chef comes close they scatter, and sometimes one leaves an egg behind
    st.eggT = Math.max(0, st.eggT - dt); st.bokT = Math.max(0, st.bokT - dt);
    const A = K.henArea;
    for (const h of st.hens) {
      h.bob += dt * 10;
      const d = st.loft ? 1e9 : U.dist(p.x, p.y, h.x, h.y);
      if (h.flee <= 0 && d < 58) {
        const ang = Math.atan2(h.y - p.y, h.x - p.x) + U.rand(-0.5, 0.5);
        h.flee = U.rand(0.45, 0.7); h.vx = Math.cos(ang) * 150; h.vy = Math.sin(ang) * 150; h.target = null; h.wait = U.rand(1, 2.5);
        if (st.bokT <= 0) { st.bokT = 1.2; g.floats.push({ x: h.x, y: h.y - 30, text: 'Bok bok!', color: '#2b1d14', t: 0, dur: 1, big: true }); }
        if (st.eggT <= 0 && st.eggs.length < K.EGG_MAX) { st.eggT = 6; st.eggs.push({ x: h.x, y: h.y + 4, t: 0 }); }
      }
      if (h.flee > 0) {
        h.flee -= dt; h.x += h.vx * dt; h.y += h.vy * dt; h.facing = h.vx < 0 ? -1 : 1;
        if (h.x < A.x0 || h.x > A.x1) h.vx = -h.vx;
        if (h.y < A.y0 || h.y > A.y1) h.vy = -h.vy;
      } else if (h.target) {
        if (U.moveToward(h, h.target.x, h.target.y, 36, dt)) { h.target = null; h.wait = U.rand(1, 3); h.peck = 1.2; }
      } else {
        h.wait -= dt; h.peck = Math.max(0, h.peck - dt);
        if (h.wait <= 0) { h.target = { x: U.rand(A.x0, A.x1), y: U.rand(A.y0, A.y1) }; h.facing = h.target.x < h.x ? -1 : 1; }
      }
      h.x = U.clamp(h.x, A.x0, A.x1); h.y = U.clamp(h.y, A.y0, A.y1);
    }
    // eggs: walk over one to pick it up
    for (const e of st.eggs) e.t += dt;
    if (!st.loft && !st.seat) {
      const got = st.eggs.find((e) => U.dist(p.x, p.y, e.x, e.y) < 24);
      if (got) {
        st.eggs.splice(st.eggs.indexOf(got), 1); g.s.barn.eggs++;
        g.floats.push({ x: got.x, y: got.y - 34, text: '🥚 +1', color: '#ffe08a', t: 0, dur: 1, big: true });
        g.fx.push({ kind: 'sparkle', x0: got.x, y0: got.y, x1: got.x, y1: got.y, t: 0, dur: 0.5 });
        Sfx.pickup(); Haptics.tap();
      }
    }
    // the cat snores when you are near
    st.cat.z -= dt;
    if (st.cat.z <= 0) { st.cat.z = 2.4; if (!st.loft && U.dist(p.x, p.y, K.cat.x, K.cat.y) < 110) g.floats.push({ x: K.cat.x + 14, y: K.cat.y - 22, text: 'z', color: '#9ad0ff', t: 0, dur: 1.4 }); }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, K = CFG.BARN, st = this.st;
    if (g.area === 'town') {
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d < 110 && !g.driving) return { text: 'Go into the barn! 🐐', target: d < 30 ? null : K.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'barn') return undefined;
    if (st.seat) return { text: 'Comfy on the hay 🌾', target: null };
    if (st.loft) {
      if (st.view > 0) return { text: 'What a view! 🌾', target: null };
      if (U.dist(p.x, p.y, K.eye.x, K.eye.y) < 40) return { text: 'Look out of the window 🪟', target: null };
      return { text: 'Climb back down the ladder 🪜', target: K.ladder.top };
    }
    const egg = st.eggs[0];
    if (egg) return { text: 'Pick up the egg! 🥚', target: egg };
    if (!st.goat.pats) return { text: 'Pat the goat! 🐐', target: { x: K.stalls.goat.x1 + 24, y: K.stalls.goat.at.y } };
    if (!st.pig.pats) return { text: 'Pat the pig! 🐷', target: { x: K.stalls.pig.x1 + 24, y: K.stalls.pig.at.y } };
    if (U.dist(p.x, p.y, K.exit.x, K.exit.y) < 30) return { text: 'Press the button to go outside', target: null };
    return { text: 'Climb the ladder to the hayloft 🪜', target: K.ladder.foot };
  },

  // ---------- static art ----------
  // a little worn patch of earth where you stand to go in, so the spot by the door is easy to find
  paintTown(r) {
    const ctx = r.ctx, D = CFG.BARN.DOOR_OUT;
    ctx.fillStyle = '#c9a36b'; ctx.beginPath(); ctx.ellipse(D.x, D.y + 2, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 1.5; for (const [dx, dy, a] of [[-8, -2, 0.3], [4, 4, -0.5], [9, -4, 0.9]]) { ctx.beginPath(); ctx.moveTo(D.x + dx, D.y + dy); ctx.lineTo(D.x + dx + Math.cos(a) * 7, D.y + dy + Math.sin(a) * 7); ctx.stroke(); }
  },
  paint: { barn(r, g) { BarnExt.paintBarn(r, g); } },
  paintBarn(r, g) {
    const ctx = r.ctx, K = CFG.BARN, R = K.room, w = K.wall, W = CFG.AREAS.barn.WORLD, L = K.loft;
    ctx.fillStyle = '#4a2c17'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    const planks = (x0, y0, x1, y1, a, b, step, vertical) => {
      for (let v = vertical ? x0 : y0, k = 0; v < (vertical ? x1 : y1); v += step, k++) {
        ctx.fillStyle = k % 2 ? a : b;
        if (vertical) ctx.fillRect(v, y0, Math.min(step, x1 - v), y1 - y0); else ctx.fillRect(x0, v, x1 - x0, Math.min(step, y1 - v));
        ctx.fillStyle = 'rgba(0,0,0,0.14)'; if (vertical) ctx.fillRect(v, y0, 1.5, y1 - y0); else ctx.fillRect(x0, v, x1 - x0, 1.5);
      }
    };
    // the back wall up under the rafters: red boards, a beam, the round hayloft window, the tractor poster and a nest
    planks(W.x0, K.roof.y0, W.x1, K.roof.y1, '#8e2a2a', '#9c3232', 20, true);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(W.x0, K.roof.y1 - 6, W.x1 - W.x0, 6);
    const wn = K.window;
    ctx.fillStyle = '#f5f0dc'; ctx.beginPath(); ctx.arc(wn.x, wn.y, wn.r + 4, 0, Math.PI * 2); ctx.fill();
    const sky = ctx.createLinearGradient(0, wn.y - wn.r, 0, wn.y + wn.r); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(0.62, '#bfe6ff'); sky.addColorStop(0.63, '#79b85e'); sky.addColorStop(1, '#5fa04a');
    ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(wn.x, wn.y, wn.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(wn.x + 7, wn.y - 6, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(wn.x - 1, wn.y - wn.r, 2, wn.r * 2); ctx.fillRect(wn.x - wn.r, wn.y - 1, wn.r * 2, 2);
    const po = K.poster;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(po.x - 30, po.y - 13, 64, 30);
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(po.x - 32, po.y - 15, 64, 30);
    ctx.fillStyle = '#bfe6ff'; ctx.fillRect(po.x - 29, po.y - 12, 58, 14); ctx.fillStyle = '#79b85e'; ctx.fillRect(po.x - 29, po.y + 2, 58, 10);
    ctx.fillStyle = '#2e8b57'; U.roundRect(ctx, po.x - 12, po.y - 7, 22, 10, 2); ctx.fill(); ctx.fillRect(po.x - 2, po.y - 12, 9, 6);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(po.x + 8, po.y + 4, 6, 0, Math.PI * 2); ctx.arc(po.x - 10, po.y + 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(po.x + 8, po.y + 4, 2.5, 0, Math.PI * 2); ctx.arc(po.x - 10, po.y + 5, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TRACTOR!', po.x + 12, po.y - 8);
    ctx.fillStyle = '#e4572e'; for (const [dx, dy] of [[-29, -12], [27, -12], [-29, 10], [27, 10]]) { ctx.beginPath(); ctx.arc(po.x + dx, po.y + dy, 1.8, 0, Math.PI * 2); ctx.fill(); }
    const ne = K.nest;
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(ne.x, ne.y + 6, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a36b'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(ne.x - 14 + k * 4.5, ne.y + 2); ctx.lineTo(ne.x - 10 + k * 4.5, ne.y + 11); ctx.stroke(); }
    ctx.fillStyle = '#2d3a4a'; for (const dx of [-5, 4]) { ctx.beginPath(); ctx.arc(ne.x + dx, ne.y + 1, 3.5, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#ffd166'; for (const dx of [-5, 4]) { ctx.beginPath(); ctx.moveTo(ne.x + dx + 2, ne.y + 1); ctx.lineTo(ne.x + dx + 6, ne.y + 2); ctx.lineTo(ne.x + dx + 2, ne.y + 3); ctx.closePath(); ctx.fill(); }
    // cobweb in the top-left corner
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) { const a = k * 0.5; ctx.beginPath(); ctx.moveTo(W.x0 + 2, W.y0 + 2); ctx.lineTo(W.x0 + 2 + Math.cos(a) * 26, W.y0 + 2 + Math.sin(a) * 26); ctx.stroke(); }
    for (let rad = 8; rad <= 24; rad += 8) { ctx.beginPath(); ctx.arc(W.x0 + 2, W.y0 + 2, rad, 0, Math.PI / 2); ctx.stroke(); }
    // the hayloft: planks, soft heaps of hay at both ends, a pitchfork, a front beam with a rail
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, 4);
    planks(L.x0, L.y0, L.x1, L.y1, '#c9a36b', '#bf9860', 12, false);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = L.x0 + 40; x < L.x1; x += 90) ctx.fillRect(x, L.y0, 1.5, L.y1 - L.y0);
    const hay = (x, y, rx, ry) => {
      ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f0cf7a'; ctx.beginPath(); ctx.ellipse(x - rx * 0.2, y - ry * 0.25, rx * 0.55, ry * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b8862c'; ctx.lineWidth = 1.2; for (let k = 0; k < 9; k++) { const a = k * 0.7, len = 6 + (k % 3) * 3; const sx = x + Math.cos(a) * rx * 0.7, sy = y + Math.sin(a) * ry * 0.7; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a + 1) * len, sy + Math.sin(a + 1) * len * 0.6); ctx.stroke(); }
    };
    hay(118, 4068, 56, 22); hay(500, 4066, 40, 20); hay(150, 4082, 30, 12);
    ctx.fillStyle = '#8d5a2b'; ctx.save(); ctx.translate(72, 4080); ctx.rotate(-0.9); ctx.fillRect(-2, -34, 4, 36); ctx.fillStyle = '#9aa0a8'; for (const dx of [-7, -2.5, 2, 6.5]) ctx.fillRect(dx - 1, -46, 2, 13); ctx.fillRect(-8, -34, 16, 3); ctx.restore();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(L.x0, L.y1 - 8, L.x1 - L.x0, 8); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(L.x0, L.y1 - 2, L.x1 - L.x0, 2);
    ctx.fillStyle = '#d7b98a'; for (let x = L.x0 + 10; x < L.x1; x += 56) if (Math.abs(x - K.ladder.x) > 22) ctx.fillRect(x - 2, L.y1 - 18, 4, 12);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(L.x0, L.y1 - 20, L.x1 - L.x0, 3);
    // the floor: wide boards with straw and dirt scattered about
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 5);
    planks(R.x0, R.y0, R.x1, R.y1, '#b5773a', '#ad7036', 26, false);
    ctx.fillStyle = 'rgba(0,0,0,0.13)'; for (let i = 0; i < 18; i++) ctx.fillRect(R.x0 + ((i * 131) % 480) + 10, R.y0 + Math.floor(((i * 71) % 230) / 26) * 26, 1.5, 26);
    ctx.strokeStyle = 'rgba(240,207,122,0.8)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 70; i++) { const x = R.x0 + 14 + ((i * 173) % 476), y = R.y0 + 10 + ((i * 97) % 214), a = (i * 1.3) % 6.3; if (x < 190 && y < 4330) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 4); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.ellipse(R.x0 + 20 + ((i * 211) % 470), R.y0 + 16 + ((i * 59) % 210), 7, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    // the side and bottom walls: red boards with white trim
    const wallRect = (x, y, ww, hh, vertical) => { planks(x, y, x + ww, y + hh, '#8e2a2a', '#9c3232', 20, !vertical); ctx.fillStyle = '#f5f0dc'; if (vertical) { ctx.fillRect(x, y, 3, hh); ctx.fillRect(x + ww - 3, y, 3, hh); } else { ctx.fillRect(x, y, ww, 3); ctx.fillRect(x, y + hh - 3, ww, 3); } };
    wallRect(R.x0 - w, R.y0 - w, w, R.y1 - R.y0 + 2 * w, true); wallRect(R.x1, R.y0 - w, w, R.y1 - R.y0 + 2 * w, true); wallRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w, false);
    // the big door in the right wall: the opening shows the farm, the two white-framed leaves stand open against the wall
    const D = K.door;
    const out = ctx.createLinearGradient(0, D.y0, 0, D.y1); out.addColorStop(0, '#bfe6ff'); out.addColorStop(0.3, '#79b85e'); out.addColorStop(1, '#5fa04a');
    ctx.fillStyle = out; ctx.fillRect(R.x1, D.y0, w, D.y1 - D.y0);
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect(R.x1 - 3, D.y0 - 6, w + 3, 6); ctx.fillRect(R.x1 - 3, D.y1, w + 3, 6); ctx.fillRect(R.x1 - 3, D.y0 - 6, 3, D.y1 - D.y0 + 12);
    for (const [y0, y1] of [[D.y0 - 46, D.y0 - 6], [D.y1 + 6, D.y1 + 46]]) { ctx.fillStyle = '#f5f0dc'; ctx.fillRect(R.x1 + 2, y0, w - 4, y1 - y0); ctx.fillStyle = '#b23a3a'; ctx.fillRect(R.x1 + 5, y0 + 3, w - 10, y1 - y0 - 6); ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R.x1 + 5, y0 + 3); ctx.lineTo(R.x1 + w - 5, y1 - 3); ctx.moveTo(R.x1 + w - 5, y0 + 3); ctx.lineTo(R.x1 + 5, y1 - 3); ctx.stroke(); }
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(R.x1 + w / 2, D.y0 - 14, 6, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#8e2a2a'; ctx.beginPath(); ctx.arc(R.x1 + w / 2, D.y0 - 14, 3, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(R.x1 + w / 2 - 6, D.y0 - 14, 2, 4); ctx.fillRect(R.x1 + w / 2 + 4, D.y0 - 14, 2, 4);   // a lucky horseshoe
    const E = K.exit;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(E.x - 20, E.y - 6, 42, 16);
    ctx.fillStyle = '#b8862c'; U.roundRect(ctx, E.x - 22, E.y - 8, 44, 16, 3); ctx.fill(); ctx.fillStyle = '#d9a066'; U.roundRect(ctx, E.x - 18, E.y - 5, 36, 10, 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OUT ➜', E.x, E.y);
    // the stalls: straw floors, a hay rack and a water bowl, wooden rails with a nameplate on the front
    const stall = (S, ico) => {
      ctx.fillStyle = '#f0cf7a'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
      ctx.strokeStyle = '#d9a844'; ctx.lineWidth = 1.5; for (let i = 0; i < 16; i++) { const x = S.x0 + 6 + ((i * 37) % (S.x1 - S.x0 - 12)), y = S.y0 + 6 + ((i * 53) % (S.y1 - S.y0 - 12)), a = i * 0.9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 4); ctx.stroke(); }
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0 + 4, S.y0 + 6, 30, 14); ctx.fillStyle = '#e0b44c'; for (let k = 0; k < 4; k++) ctx.fillRect(S.x0 + 7 + k * 7, S.y0 + 2, 4, 10); ctx.fillStyle = '#6b4a2b'; for (let k = 0; k < 4; k++) ctx.fillRect(S.x0 + 6 + k * 7, S.y0 + 6, 2, 14);
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(S.x1 - 22, S.y0 + 14, 11, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.ellipse(S.x1 - 22, S.y0 + 13, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d7b98a'; ctx.fillRect(S.x1 - 8, S.y0, 4, S.y1 - S.y0); ctx.fillRect(S.x1 - 2, S.y0, 4, S.y1 - S.y0); ctx.fillRect(S.x0, S.y1 - 6, S.x1 - S.x0, 4); ctx.fillRect(S.x0, S.y1 - 12, S.x1 - S.x0, 3);
      for (let y = S.y0; y <= S.y1; y += 26) ctx.fillRect(S.x1 - 11, y - 2, 13, 5);
      for (let x = S.x0; x <= S.x1 - 10; x += 29) ctx.fillRect(x - 2, S.y1 - 16, 5, 18);
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, S.x1 - 4, S.y0 + 8, 24, 16, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, S.x1 + 8, S.y0 + 16);
    };
    stall(K.stalls.goat, '🐐'); stall(K.stalls.pig, '🐷');
    // a lantern and a coil of rope on the left wall, a bucket by the stalls
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, R.x0 - 18, 4234, 14, 18, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(R.x0 - 15, 4238, 8, 10); ctx.fillStyle = '#2d3a4a'; ctx.fillRect(R.x0 - 12, 4230, 2, 4);
    ctx.strokeStyle = '#d7b98a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(R.x0 - 11, 4345, 8, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(R.x0 - 11, 4345, 8, 0, Math.PI * 2); ctx.stroke();
    const bk = K.bucket;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(bk.x + 2, bk.y + 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, bk.x - 8, bk.y - 8, 16, 14, 3); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.ellipse(bk.x, bk.y - 7, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6e7177'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bk.x, bk.y - 8, 8, Math.PI, 0); ctx.stroke();
    // hay bales: the one with the red blanket is for sitting on
    for (const b of K.bales) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(b.x - K.baleW / 2 + 3, b.y - K.baleH / 2 + 5, K.baleW, K.baleH);
      ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, b.x - K.baleW / 2, b.y - K.baleH / 2, K.baleW, K.baleH, 5); ctx.fill();
      ctx.fillStyle = '#f0cf7a'; U.roundRect(ctx, b.x - K.baleW / 2 + 3, b.y - K.baleH / 2 + 3, K.baleW - 6, 9, 3); ctx.fill();
      ctx.strokeStyle = '#d9a844'; ctx.lineWidth = 1; for (let k = 0; k < 10; k++) { const x = b.x - K.baleW / 2 + 4 + ((k * 17) % (K.baleW - 8)), y = b.y - K.baleH / 2 + 5 + ((k * 11) % (K.baleH - 10)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 2); ctx.stroke(); }
      ctx.fillStyle = '#b8862c'; ctx.fillRect(b.x - K.baleW / 2, b.y - 5, K.baleW, 2.5); ctx.fillRect(b.x - K.baleW / 2, b.y + 4, K.baleW, 2.5);
      if (b.seat) { ctx.fillStyle = '#e4572e'; U.roundRect(ctx, b.x - 16, b.y - 12, 32, 16, 3); ctx.fill(); ctx.fillStyle = '#ffd166'; for (let k = 0; k < 3; k++) ctx.fillRect(b.x - 12, b.y - 9 + k * 5, 24, 1.5); }
    }
    // the feed sack in the corner (the cat sleeps on it) and a wheelbarrow by the door
    const sk = K.sack;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(sk.x + 3, sk.y + 10, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9c39a'; U.roundRect(ctx, sk.x - 26, sk.y - 16, 52, 30, 10); ctx.fill(); ctx.fillStyle = '#c4ad84'; U.roundRect(ctx, sk.x - 26, sk.y - 16, 52, 8, 6); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FEED', sk.x, sk.y + 6);
    const wb = K.barrow;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(wb.x + 2, wb.y + 10, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(wb.x + 18, wb.y - 4, 22, 3); ctx.fillRect(wb.x + 18, wb.y + 3, 22, 3);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(wb.x - 22, wb.y + 4, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(wb.x - 22, wb.y + 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, wb.x - 22, wb.y - 12, 42, 22, 5); ctx.fill(); ctx.fillStyle = '#2f66b8'; U.roundRect(ctx, wb.x - 18, wb.y - 9, 34, 16, 4); ctx.fill();
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(wb.x - 1, wb.y - 2, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
    // the ladder from the floor up to the loft
    const ld = K.ladder;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(ld.x - 12, L.y1 - 26, 30, R.y0 + 18 - (L.y1 - 26));
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(ld.x - 14, L.y1 - 30, 5, R.y0 + 16 - (L.y1 - 30)); ctx.fillRect(ld.x + 9, L.y1 - 30, 5, R.y0 + 16 - (L.y1 - 30));
    ctx.fillStyle = '#c9a36b'; for (let y = L.y1 - 22; y < R.y0 + 12; y += 9) ctx.fillRect(ld.x - 12, y, 24, 3.5);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(ld.foot.x, ld.foot.y + 6, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- moving things ----------
  dynamic(r, g) {
    if (g.area !== 'barn' || !this.st) return;
    const ctx = r.ctx, K = CFG.BARN, W = CFG.AREAS.barn.WORLD, R = K.room, t = g.time;
    // the view is bigger than this little map: dark timbers over whatever shows outside it
    const vx0 = r.camX - 10, vy0 = r.camY - 10, vx1 = r.camX + r.viewW + 10, vy1 = r.camY + r.viewH + 10;
    ctx.fillStyle = '#3a2213';
    if (vy0 < W.y0) ctx.fillRect(vx0, vy0, vx1 - vx0, W.y0 - vy0);
    if (vy1 > W.y1) ctx.fillRect(vx0, W.y1, vx1 - vx0, vy1 - W.y1);
    if (vx0 < W.x0) ctx.fillRect(vx0, W.y0, W.x0 - vx0, W.y1 - W.y0);
    if (vx1 > W.x1) ctx.fillRect(W.x1, W.y0, vx1 - W.x1, W.y1 - W.y0);
    // the sunbeam through the big door, with dust drifting in it
    const D = K.door, bx = 330;
    const beam = ctx.createLinearGradient(R.x1, 0, bx, 0); beam.addColorStop(0, 'rgba(255,236,160,0.34)'); beam.addColorStop(1, 'rgba(255,236,160,0)');
    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(R.x1, D.y0); ctx.lineTo(bx, D.y0 - 40); ctx.lineTo(bx, D.y1 + 60); ctx.lineTo(R.x1, D.y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,220,0.85)';
    for (let i = 0; i < 26; i++) {
      const k = (i * 0.618 + t * 0.012 * (1 + (i % 3))) % 1, x = R.x1 - k * (R.x1 - bx - 10), span = 40 + k * 60;
      const y = (D.y0 + D.y1) / 2 + Math.sin(i * 2.3 + t * 0.6) * span + Math.sin(t * 1.7 + i) * 4;
      ctx.globalAlpha = 0.35 + 0.4 * Math.sin(t * 2 + i) * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // swallows under the roof
    for (let i = 0; i < 3; i++) {
      const ph = t * (0.5 + i * 0.13) + i * 2.1, x = 300 + Math.sin(ph) * (230 - i * 40), y = K.roof.y0 + 16 + Math.sin(ph * 2.3 + i) * 8, dir = Math.cos(ph) < 0 ? -1 : 1, flap = Math.sin(t * 14 + i) * 4;
      ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 9, y - flap); ctx.quadraticCurveTo(x - 4, y + 2, x, y); ctx.quadraticCurveTo(x + 4, y + 2, x + 9, y - flap); ctx.stroke();
      ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.ellipse(x, y + 1, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - dir * 4, y + 1); ctx.lineTo(x - dir * 10, y - 2); ctx.lineTo(x - dir * 10, y + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x + dir * 4, y + 1, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    // hearts above a patted animal
    for (const who of ['goat', 'pig']) {
      const a = this.st[who]; if (a.happy <= 0) continue;
      const at = K.stalls[who].at, k = 1 - a.happy / K.PAT;
      ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = who === 'goat' ? '#ffd166' : '#ff8fab';
      for (let i = 0; i < 3; i++) { const kk = (k + i * 0.33) % 1; ctx.globalAlpha = 1 - kk; ctx.fillText('♥', at.x - 14 + i * 14 + Math.sin(kk * 6 + i) * 4, at.y - 30 - kk * 30); }
      ctx.globalAlpha = 1;
    }
  },
  entities(r, g, items) {
    if (g.area !== 'barn' || !this.st) return;
    const K = CFG.BARN, st = this.st;
    items.push({ y: K.stalls.goat.at.y + 2, draw: () => this.drawGoat(r, g) });
    items.push({ y: K.stalls.pig.at.y + 2, draw: () => this.drawPig(r, g) });
    items.push({ y: K.cat.y + 2, draw: () => this.drawCat(r, g) });
    for (const h of st.hens) items.push({ y: h.y + 1, draw: () => this.drawHen(r, g, h) });
    for (const e of st.eggs) items.push({ y: e.y - 2, draw: () => this.drawEgg(r, g, e) });
  },
  drawGoat(r, g) {
    const ctx = r.ctx, a = this.st.goat, at = CFG.BARN.stalls.goat.at, t = g.time, x = at.x, hop = a.happy > 0 ? Math.abs(Math.sin(t * 12)) * 6 : 0, y = at.y - hop;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(at.x, at.y + 6, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; for (const dx of [-14, -6, 6, 14]) ctx.fillRect(x + dx - 2, y - 6, 4, 12);
    ctx.fillStyle = '#f5f0dc'; U.roundRect(ctx, x - 20, y - 24, 40, 22, 9); ctx.fill();
    ctx.fillStyle = '#e9dfc4'; ctx.beginPath(); ctx.ellipse(x - 4, y - 12, 10, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f0dc'; ctx.beginPath(); ctx.moveTo(x - 20, y - 20); ctx.lineTo(x - 27, y - 26); ctx.lineTo(x - 20, y - 14); ctx.closePath(); ctx.fill();   // tail
    // head with horns, beard and floppy ears, looking at you
    const hx = x + 18, hy = y - 30 + Math.sin(t * 2) * 1.5 + (a.happy > 0 ? -3 : 0);
    ctx.fillStyle = '#f5f0dc'; U.roundRect(ctx, hx - 9, hy - 8, 20, 18, 7); ctx.fill();
    ctx.fillStyle = '#d7b98a'; ctx.beginPath(); ctx.ellipse(hx - 10, hy + 2, 5, 3, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx + 11, hy + 2, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - 4, hy - 8); ctx.lineTo(hx - 7, hy - 16); ctx.moveTo(hx + 6, hy - 8); ctx.lineTo(hx + 9, hy - 16); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(hx - 3, hy - 1, 2.5, 2.5); ctx.fillRect(hx + 4, hy - 1, 2.5, 2.5);
    ctx.fillStyle = '#f8c8dc'; ctx.beginPath(); ctx.ellipse(hx + 1, hy + 6, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9dfc4'; ctx.beginPath(); ctx.moveTo(hx - 3, hy + 9); ctx.lineTo(hx + 1, hy + 16); ctx.lineTo(hx + 5, hy + 9); ctx.closePath(); ctx.fill();   // beard
    ctx.fillStyle = '#e4572e'; ctx.fillRect(hx - 9, hy + 1, 20, 2.5); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(hx + 1, hy + 4, 2, 0, Math.PI * 2); ctx.fill();   // collar with a bell
  },
  drawPig(r, g) {
    const ctx = r.ctx, a = this.st.pig, at = CFG.BARN.stalls.pig.at, t = g.time, x = at.x, wig = a.happy > 0 ? Math.sin(t * 16) * 3 : 0, y = at.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a0b4'; for (const dx of [-14, -6, 6, 14]) ctx.fillRect(x + dx - 2.5, y - 6, 5, 11);
    ctx.fillStyle = '#f6b6c8'; U.roundRect(ctx, x - 22, y - 24, 44, 24, 12); ctx.fill();
    ctx.fillStyle = '#fbcad8'; ctx.beginPath(); ctx.ellipse(x - 2, y - 10, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8a0b4'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 22, y - 16); ctx.quadraticCurveTo(x - 30, y - 22 + wig, x - 26, y - 26 + wig); ctx.quadraticCurveTo(x - 24, y - 20, x - 30, y - 18 + wig); ctx.stroke();   // curly tail
    const hx = x + 18, hy = y - 28 + Math.sin(t * 1.7) * 1.5 + (a.happy > 0 ? -2 : 0);
    ctx.fillStyle = '#f6b6c8'; ctx.beginPath(); ctx.arc(hx, hy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a0b4'; ctx.beginPath(); ctx.moveTo(hx - 10, hy - 6); ctx.lineTo(hx - 12, hy - 16); ctx.lineTo(hx - 3, hy - 10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 10, hy - 6); ctx.lineTo(hx + 12, hy - 16); ctx.lineTo(hx + 3, hy - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(hx - 6, hy - 3, 2.5, 2.5); ctx.fillRect(hx + 3, hy - 3, 2.5, 2.5);
    ctx.fillStyle = '#e8a0b4'; ctx.beginPath(); ctx.ellipse(hx, hy + 5, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c97a90'; ctx.beginPath(); ctx.arc(hx - 2.5, hy + 5, 1.3, 0, Math.PI * 2); ctx.arc(hx + 2.5, hy + 5, 1.3, 0, Math.PI * 2); ctx.fill();
    if (a.happy > 0) { ctx.strokeStyle = '#c97a90'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, hy + 8, 5, 0.3, Math.PI - 0.3); ctx.stroke(); }
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(x + 2, y + 2, 10, 3, 0, 0, Math.PI * 2); ctx.fill();   // a bit of mud
  },
  drawHen(r, g, h) {
    const ctx = r.ctx, x = h.x, f = h.facing, moving = h.flee > 0 || !!h.target, bob = moving ? Math.abs(Math.sin(h.bob)) * 2 : 0, y = h.y - bob;
    const peck = h.peck > 0 ? Math.max(0, Math.sin(h.peck * 12)) * 5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(h.x, h.y + 3, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb347'; ctx.fillRect(x - 4, y - 4, 2, 7); ctx.fillRect(x + 2, y - 4 + (moving ? Math.sin(h.bob) * 2 : 0), 2, 7);
    ctx.fillStyle = h.col; ctx.beginPath(); ctx.ellipse(x, y - 10, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(x - f * 2, y - 11, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = h.col; ctx.beginPath(); ctx.moveTo(x - f * 9, y - 12); ctx.lineTo(x - f * 16, y - 20); ctx.lineTo(x - f * 13, y - 10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x + f * 8, y - 18 + peck, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x + f * 8, y - 23 + peck, 2.2, 0, Math.PI * 2); ctx.arc(x + f * 10.5, y - 22 + peck, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + f * 9, y - 13 + peck, 1.6, 2.4, 0, 0, Math.PI * 2); ctx.fill();   // wattle
    ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(x + f * 12, y - 18 + peck); ctx.lineTo(x + f * 18, y - 16 + peck); ctx.lineTo(x + f * 12, y - 14 + peck); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 9, y - 19 + peck, 1.2, 0, Math.PI * 2); ctx.fill();
  },
  drawEgg(r, g, e) {
    const ctx = r.ctx, k = Math.min(1, e.t / 0.4), s = 0.6 + 0.4 * k;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + 3, 6 * s, 2.5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 3 * s, 5.5 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(e.x - 1.5 * s, e.y - 6 * s, 1.6 * s, 2.4 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✨', e.x + 8, e.y - 14 + Math.sin(g.time * 4) * 2);
  },
  drawCat(r, g) {
    const ctx = r.ctx, c = CFG.BARN.cat, t = g.time, br = 1 + Math.sin(t * 1.4) * 0.03, x = c.x, y = c.y;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, br); ctx.translate(-x, -y);
    ctx.fillStyle = '#e8923a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c4702a'; ctx.lineWidth = 2; for (const dx of [-8, -1, 6]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 13); ctx.lineTo(x + dx + 2, y - 7); ctx.stroke(); }
    ctx.strokeStyle = '#e8923a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.quadraticCurveTo(x + 26, y + 4, x + 22, y - 10); ctx.stroke();
    ctx.restore();
    const hx = x - 12, hy = y - 2;
    ctx.fillStyle = '#e8923a'; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 7, hy - 4); ctx.lineTo(hx - 6, hy - 12); ctx.lineTo(hx - 1, hy - 7); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 7, hy - 4); ctx.lineTo(hx + 6, hy - 12); ctx.lineTo(hx + 1, hy - 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8c8dc'; ctx.beginPath(); ctx.moveTo(hx - 5, hy - 5); ctx.lineTo(hx - 5, hy - 9); ctx.lineTo(hx - 2, hy - 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx - 3, hy, 1.8, Math.PI, 0, true); ctx.arc(hx + 3, hy, 1.8, Math.PI, 0, true); ctx.stroke();
    ctx.fillStyle = '#f8c8dc'; ctx.beginPath(); ctx.ellipse(hx, hy + 3, 1.6, 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 0.8; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * 3, hy + 3); ctx.lineTo(hx + d * 11, hy + 1); ctx.moveTo(hx + d * 3, hy + 4); ctx.lineTo(hx + d * 11, hy + 6); ctx.stroke(); }
  },

  // ---------- screen: the hayloft window view and the door fade ----------
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'barn' && this.st.loft && this.st.view > 0) this.drawView(r, g, W, H);
    if (this.st.fade <= 0) return;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
  // the farm seen from the hayloft window: fields, the cow pen, the woods, the tractor and a few birds
  drawView(r, g, W, H) {
    const ctx = r.ctx, t = g.time, K = CFG.BARN, k = this.st.view / K.VIEW, a = k > 0.85 ? (1 - k) / 0.15 : k < 0.15 ? k / 0.15 : 1;
    const pw = Math.min(W - 32, 520), ph = Math.min(H - 150, 300), px = W / 2 - pw / 2, py = Math.max(70, H / 2 - ph / 2);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(43,29,20,0.45)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f5f0dc'; U.roundRect(ctx, px - 12, py - 12, pw + 24, ph + 24, 18); ctx.fill();
    ctx.fillStyle = '#8e2a2a'; U.roundRect(ctx, px - 6, py - 6, pw + 12, ph + 12, 14); ctx.fill();
    ctx.save(); U.roundRect(ctx, px, py, pw, ph, 10); ctx.clip();
    ctx.translate(px, py); ctx.scale(pw / 520, ph / 300);
    const sky = ctx.createLinearGradient(0, 0, 0, 130); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#bfe6ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 520, 130);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(440, 40, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 4; i++) { const cx = (((i * 150 + t * 14) % 640) + 640) % 640 - 60, cy = 30 + (i % 2) * 30, s = 0.8 + (i % 3) * 0.3; ctx.beginPath(); ctx.arc(cx, cy, 14 * s, 0, Math.PI * 2); ctx.arc(cx + 16 * s, cy - 8 * s, 18 * s, 0, Math.PI * 2); ctx.arc(cx + 36 * s, cy, 13 * s, 0, Math.PI * 2); ctx.fill(); }
    // the woods on the far left and the hills, then the fields
    ctx.fillStyle = '#6fae5a'; ctx.beginPath(); ctx.moveTo(0, 130); ctx.quadraticCurveTo(130, 96, 260, 122); ctx.quadraticCurveTo(400, 100, 520, 126); ctx.lineTo(520, 140); ctx.lineTo(0, 140); ctx.fill();
    for (let i = 0; i < 9; i++) { const x = 10 + i * 20, y = 118 + (i % 2) * 6, s = 0.9 + (i % 3) * 0.2; ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 2, y, 4, 14); ctx.fillStyle = i % 2 ? '#2f8f46' : '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y - 4 * s, 12 * s, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#79b85e'; ctx.fillRect(0, 138, 520, 162);
    const soil = (x0, y0, w, h) => { ctx.fillStyle = '#8d6a3f'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = y0 + 6; y < y0 + h; y += 12) ctx.fillRect(x0, y, w, 2.5); };
    soil(60, 190, 150, 70); soil(250, 190, 170, 70);
    for (let i = 0; i < 12; i++) { const x = 74 + (i % 6) * 24, y = 200 + Math.floor(i / 6) * 32; ctx.fillStyle = '#5db04a'; ctx.beginPath(); ctx.ellipse(x, y + 8, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x - 3, y + 2, 3.5, 0, Math.PI * 2); ctx.arc(x + 4, y + 5, 3, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 14; i++) { const x = 262 + (i % 7) * 23, y = 196 + Math.floor(i / 7) * 32, sw = Math.sin(t * 1.5 + i) * 2; ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 2; for (let k2 = -1; k2 <= 1; k2++) { ctx.beginPath(); ctx.moveTo(x + k2 * 5, y + 22); ctx.lineTo(x + k2 * 5 + sw, y + 4); ctx.stroke(); } ctx.fillStyle = '#f2c94c'; for (let k2 = -1; k2 <= 1; k2++) { ctx.beginPath(); ctx.ellipse(x + k2 * 5 + sw, y + 3, 2.5, 5, 0, 0, Math.PI * 2); ctx.fill(); } }
    // the cow pen and the cow, fences and the scarecrow
    const fence = (x0, y, len) => { ctx.fillStyle = '#d7b98a'; ctx.fillRect(x0, y, len, 3); ctx.fillRect(x0, y + 7, len, 3); for (let x = x0; x <= x0 + len; x += 22) ctx.fillRect(x - 1.5, y - 5, 4, 18); };
    fence(300, 150, 170); fence(0, 268, 520);
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(318, 160, 134, 16);
    const cx = 380 + Math.sin(t * 0.4) * 20, cy = 168;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(cx - 10, cy, 3, 7); ctx.fillRect(cx + 7, cy, 3, 7);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, cx - 14, cy - 14, 28, 15, 6); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 8, 5, 4, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, cx + 10, cy - 18, 12, 11, 4); ctx.fill(); ctx.fillStyle = '#f8c8dc'; ctx.fillRect(cx + 15, cy - 12, 7, 4);
    const sx = 230, sy = 232;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(sx - 1.5, sy - 30, 3, 36); ctx.fillRect(sx - 14, sy - 18, 28, 3);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, sx - 8, sy - 21, 16, 17, 3); ctx.fill(); ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(sx, sy - 27, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(sx - 9, sy - 33, 18, 3);
    // the tractor puttering along the bottom field, birds, and a little dandelion fluff
    const tx = (((t * 18) % 640) + 640) % 640 - 60, ty = 282;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(tx - 10, ty, 9, 0, Math.PI * 2); ctx.arc(tx + 12, ty + 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e8b57'; U.roundRect(ctx, tx - 16, ty - 14, 34, 12, 3); ctx.fill(); ctx.fillRect(tx - 8, ty - 24, 12, 10); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(tx - 10, ty, 3.5, 0, Math.PI * 2); ctx.arc(tx + 12, ty + 2, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(tx - 2, ty - 27, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(tx - 6, ty - 31, 8, 3);
    ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const bx = 120 + i * 40 + Math.sin(t * 0.5 + i) * 30, by = 50 + i * 12 + Math.sin(t * 0.9 + i * 2) * 6, fl = Math.sin(t * 10 + i) * 3; ctx.beginPath(); ctx.moveTo(bx - 7, by - fl); ctx.quadraticCurveTo(bx, by + 3, bx + 7, by - fl); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 6; i++) { const fx = (((i * 97 + t * 12) % 560) + 560) % 560 - 20, fy = 150 + (i * 37) % 120 + Math.sin(t * 1.3 + i) * 8; ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the window's cross bars over the glass
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px + pw / 2, py); ctx.lineTo(px + pw / 2, py + ph); ctx.moveTo(px, py + ph / 2); ctx.lineTo(px + pw, py + ph / 2); ctx.stroke();
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, W / 2 - 110, py + ph + 18, 220, 30, 10); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌾 What a view!', W / 2, py + ph + 33);
    ctx.restore();
  },
};
Game.ext.unshift(BarnExt);
Render.ext.push(BarnExt);
