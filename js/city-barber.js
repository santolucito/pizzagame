'use strict';
// The barber shop: City building 1 (top row, facing Bus Street) gets a '💈 BARBER' sign and a spinning pole by the
// door. Step inside for a checker-floored shop with two barber chairs (sit down: the chair spins and the barber gives
// your hat a quick trim), a big mirror that reflects the chef, a shelf of hair-product bottles, a waiting bench with a
// customer reading a magazine, a radio playing notes and a $5 lollipop to carry around for a while.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.BARBER = {
  BUILDING: 1,                                   // index in CFG.CITY.BUILDINGS: { x0: 4752, y0: -120, x1: 4890, y1: 0 }
  DOOR_OUT: { x: 4821, y: 14 },                  // on the sidewalk just below the door
  WORLD: { x0: -400, y0: 3000, x1: 200, y1: 3400 },
  ROOM: { x0: -360, y0: 3100, x1: 160, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: the mirror and shelves hang on it
  MIRROR: { x0: -336, y0: 3028, x1: -96, y1: 3094 },
  COUNTER: { x0: -340, y0: 3096, x1: -92, y1: 3118 },           // the ledge under the mirror: combs, sprays, scissors
  CHAIRS: [{ x: -276, y: 3180 }, { x: -156, y: 3180 }],
  BARBER_HOME: { x: -216, y: 3144 },
  SHELF: { x0: -60, y0: 3034, x1: 126, y1: 3094 },
  RADIO: { x: 100, y: 3078 },
  BENCH: { x0: 112, y0: 3150, x1: 152, y1: 3256 }, CUSTOMER: { x: 132, y: 3214 },
  RECEPTION: { x0: -40, y0: 3266, x1: 80, y1: 3304 }, JAR: { x: -12, y: 3262 }, REGISTER: { x: 50, y: 3262 },
  PADS: { lolly: { x: 20, y: 3222 } },
  PLANTS: [{ x: 138, y: 3308 }, { x: -334, y: 3308 }],
  EXIT: { x: -230, y: 3322 },                    // the mat inside the door (the door is in the bottom wall)
  SPIN: 0.9, TRIM: 2.4, LOLLY: 30,               // seconds: the chair's spin, the trim, how long the lollipop lasts
};
CFG.AREAS.barber = { WORLD: CFG.BARBER.WORLD };

const BarberExt = {
  name: 'barber',
  st: null,
  defaults: { barber: { seen: false, trims: 0, lollies: 0 } },

  // ---------- state ----------
  build(g) {
    const B = CFG.BARBER;
    if (!g.s.barber) g.s.barber = { seen: false, trims: 0, lollies: 0 };
    this.st = {
      fade: 0, seat: null,                                           // seat: { i, t, trim, done }
      barber: { x: B.BARBER_HOME.x, y: B.BARBER_HOME.y, facing: 1, moving: false, bob: 0, snip: 0 },
      lolly: 0, notes: [], noteT: 0, page: 0, flip: 0,
      obs: null,
    };
    const R = B.ROOM, w = B.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: B.COUNTER.x0, y: R.y0, w: B.COUNTER.x1 - B.COUNTER.x0, h: B.COUNTER.y1 - R.y0 });
    o.push({ x: B.BENCH.x0 - 4, y: B.BENCH.y0 - 4, w: B.BENCH.x1 - B.BENCH.x0 + 8, h: B.BENCH.y1 - B.BENCH.y0 + 8 });
    o.push({ x: B.RECEPTION.x0, y: B.RECEPTION.y0, w: B.RECEPTION.x1 - B.RECEPTION.x0, h: B.RECEPTION.y1 - B.RECEPTION.y0 });
    for (const p of B.PLANTS) o.push({ x: p.x - 14, y: p.y - 14, w: 28, h: 26 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'barber' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.BARBER.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  atDoor(g) { const D = CFG.BARBER.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && CityExt.st.cab))) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  nearChair(g) { const p = g.player; return CFG.BARBER.CHAIRS.findIndex((c) => U.dist(p.x, p.y, c.x, c.y) < 26); },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, B = CFG.BARBER, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'barber') return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, B.EXIT.x, B.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    const i = this.nearChair(g); if (i >= 0) return { label: '💈 Sit in the chair', run: (gg) => this.sitDown(gg, i) };
    return null;
  },
  enter(g) {
    const B = CFG.BARBER, p = g.player;
    g.area = 'barber'; p.x = B.EXIT.x; p.y = B.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.barber.seen) { g.s.barber.seen = true; g.toast('💈 Welcome to the barber shop!', true); }
  },
  leave(g) {
    const B = CFG.BARBER, p = g.player;
    g.area = 'city'; p.x = B.DOOR_OUT.x; p.y = B.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.seat = null; this.st.fade = 0.45; Sfx.drop();
  },
  sitDown(g, i) {
    const c = CFG.BARBER.CHAIRS[i], p = g.player;
    this.st.seat = { i, t: 0, trim: 0, done: false };
    p.x = c.x; p.y = c.y; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st; if (!st.seat) return;
    st.seat = null; st.barber.snip = 0; g.player.moving = false; Sfx.drop();
  },
  home(g) { if (!this.st) return; this.st.seat = null; this.st.fade = 0; this.st.barber.snip = 0; const H = CFG.BARBER.BARBER_HOME; this.st.barber.x = H.x; this.st.barber.y = H.y; this.st.barber.moving = false; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, B = CFG.BARBER;
    if (this.free(p.x, p.y)) return false;
    p.x = B.EXIT.x; p.y = B.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, B = CFG.BARBER;
    st.fade = Math.max(0, st.fade - dt);
    st.lolly = Math.max(0, st.lolly - dt);
    if (g.area !== 'barber') { if (st.seat) st.seat = null; return; }
    const bb = st.barber;
    if (st.seat) {
      // sitting: stay in the chair; the chair spins first, then the barber comes over and snips
      const s = st.seat, c = B.CHAIRS[s.i]; s.t += dt;
      p.x = c.x; p.y = c.y; p.moving = false;
      p.facing = s.t < B.SPIN ? (Math.cos(U.easeOut(s.t / B.SPIN) * Math.PI * 2) >= 0 ? 1 : -1) : 1;
      const arrived = U.moveToward(bb, c.x + 36, c.y - 6, 80, dt);
      if (arrived) bb.facing = -1;
      if (arrived && s.t > B.SPIN && !s.done) {
        s.trim += dt; bb.snip += dt;
        if (s.trim >= B.TRIM) {
          s.done = true; bb.snip = 0; g.s.barber.trims++;
          for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-16, 16), y0: p.y - 56 + U.rand(-10, 8), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
          g.floats.push({ x: p.x, y: p.y - 76, text: 'Looking sharp! ✂️', color: '#ffe08a', t: 0, dur: 1.6, big: true });
          Sfx.chime(); Haptics.success();
        }
      } else bb.snip = 0;
    } else {
      this.rescue(g);
      bb.snip = 0;
      U.moveToward(bb, B.BARBER_HOME.x, B.BARBER_HOME.y, 80, dt);
      if (!bb.moving) bb.facing = p.x < bb.x ? -1 : 1;
    }
    bb.bob = bb.moving ? bb.bob + dt * 14 : 0;
    // the radio plays: notes drift up from it
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.8);
    st.noteT -= dt; if (st.noteT <= 0) { st.noteT = 0.7; st.notes.push({ x: B.RADIO.x + U.rand(-10, 10), y: B.RADIO.y - 14, ch: U.pick(['♪', '♫', '♩']), t: 0 }); }
    // the waiting customer turns a page now and then
    st.page += dt; if (st.flip > 0) st.flip = Math.max(0, st.flip - dt); else if (st.page > 3.2) { st.page = 0; st.flip = 0.35; }
  },
  pads(g) {
    if (g.area !== 'barber') return [];
    return [{ key: 'barberLolly', label: 'Lollipop', ico: '🍭', pos: CFG.BARBER.PADS.lolly, price: 5, sub: 'sweet!' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'barberLolly') return;
    const p = g.player; this.st.lolly = CFG.BARBER.LOLLY; g.s.barber.lollies++;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'A lollipop! 🍭', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, B = CFG.BARBER, st = this.st, s = g.s.barber;
    if (g.area === 'city') {
      if (!this.onFoot(g) || (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && CityExt.st.cab)))) return undefined;
      const d = U.dist(p.x, p.y, B.DOOR_OUT.x, B.DOOR_OUT.y);
      if (d < 110) return { text: 'Get a trim at the barber! 💈', target: d < 30 ? null : B.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'barber') return undefined;
    if (st.seat) return st.seat.done ? { text: 'Looking sharp! Press the button to stand up', target: null } : { text: 'Snip snip! Hold still ✂️', target: null };
    if (!s.trims) return { text: 'Sit in the barber chair! 💈', target: B.CHAIRS[0] };
    if (!s.lollies && g.s.cash + (g.s.padPaid.barberLolly || 0) >= 5) return { text: 'Buy a lollipop! 🍭', target: B.PADS.lolly };
    if (st.lolly > 0) return { text: 'Mmm, lollipop! 🍭', target: null };
    return { text: 'Looking sharp! 💈', target: null };
  },

  // ---------- the City outside: the sign (static) and the spinning pole (live) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.BARBER.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '💈 BARBER';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // a striped welcome mat on the sidewalk in front of the door
    const D = CFG.BARBER.DOOR_OUT;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#fff8ee', '#3b7dd8'][i]; ctx.fillRect(D.x - 15 + i * 10, D.y - 6, 10, 10); }
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
  },
  drawPole(r, g, x, y0, h, big) {
    const ctx = r.ctx, t = g.time, w = big ? 12 : 8, cap = big ? 4 : 3;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - w / 2 + 2, y0 + 2, w, h, w / 2); ctx.fill();
    ctx.save(); U.roundRect(ctx, x - w / 2, y0, w, h, w / 2); ctx.clip();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - w / 2, y0, w, h);
    const period = big ? 30 : 20, off = (t * (big ? 36 : 24)) % period, cols = ['#e4572e', '#3b7dd8'];
    for (let k = -2; k < h / period + 2; k++) {
      const y = y0 + k * period + off;
      for (let c = 0; c < 2; c++) {
        const yy = y + c * period / 2;
        ctx.fillStyle = cols[c]; ctx.beginPath(); ctx.moveTo(x - w / 2, yy + w * 0.8); ctx.lineTo(x + w / 2, yy); ctx.lineTo(x + w / 2, yy + period / 4); ctx.lineTo(x - w / 2, yy + period / 4 + w * 0.8); ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - w / 2 + 1, y0, w * 0.3, h);
    ctx.restore();
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, x - w / 2 - 2, y0 - cap, w + 4, cap + 1, 2); ctx.fill(); U.roundRect(ctx, x - w / 2 - 2, y0 + h - 1, w + 4, cap + 1, 2); ctx.fill();
    ctx.fillStyle = '#b8862c'; ctx.beginPath(); ctx.arc(x, y0 - cap - 2, cap * 0.9, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- the interior, static ----------
  paint: { barber(r, g) { BarberExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, B = CFG.BARBER, W = B.WORLD, R = B.ROOM, w = B.WALL;
    // outside the shop: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, B.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - B.BACK_TOP);
    // checker floor: cream and teal tiles
    const ts = 24;
    for (let y = R.y0, j = 0; y < R.y1; y += ts, j++) for (let x = R.x0, i = 0; x < R.x1; x += ts, i++) { ctx.fillStyle = (i + j) % 2 ? '#5cc1b5' : '#f7f1e3'; ctx.fillRect(x, y, Math.min(ts, R.x1 - x), Math.min(ts, R.y1 - y)); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = R.y0; y < R.y1; y += ts) for (let x = R.x0; x < R.x1; x += ts) ctx.fillRect(x + 2, y + 2, 6, 2);
    // walls: a tall back wall with striped paper and a dado rail; wooden side and bottom walls
    ctx.fillStyle = '#ffe9c2'; ctx.fillRect(R.x0 - w, B.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - B.BACK_TOP);
    ctx.fillStyle = '#f6d9a0'; for (let x = R.x0 - w + 6; x < R.x1 + w; x += 14) ctx.fillRect(x, B.BACK_TOP, 5, R.y0 - B.BACK_TOP);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#fff8ee', '#3b7dd8'][i]; ctx.fillRect(R.x0 - w, B.BACK_TOP + i * 3, R.x1 - R.x0 + 2 * w, 3); }   // striped cornice
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the big mirror: gold frame, pale glass (the chef's reflection is drawn live), bulbs along the top
    const M = B.MIRROR;
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, M.x0 - 6, M.y0 - 6, M.x1 - M.x0 + 12, M.y1 - M.y0 + 12, 8); ctx.fill();
    ctx.fillStyle = '#b8862c'; U.roundRect(ctx, M.x0 - 3, M.y0 - 3, M.x1 - M.x0 + 6, M.y1 - M.y0 + 6, 6); ctx.fill();
    const gl = ctx.createLinearGradient(M.x0, M.y0, M.x1, M.y1); gl.addColorStop(0, '#dff3ff'); gl.addColorStop(1, '#b7dcf5');
    ctx.fillStyle = gl; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(M.x0 + 18 + i * 34, M.y0 - 12, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,243,176,0.35)'; ctx.beginPath(); ctx.arc(M.x0 + 18 + i * 34, M.y0 - 12, 8, 0, Math.PI * 2); ctx.fill(); }
    // the ledge under the mirror: combs in a blue jar, spray bottles, a towel, scissors
    const C = B.COUNTER;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 4); ctx.fill();
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0, C.y0 - 4, C.x1 - C.x0, 12, 4); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, C.x0 + 14, C.y0 - 18, 14, 18, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 3; k++) ctx.fillRect(C.x0 + 17 + k * 4, C.y0 - 24, 2, 8);   // comb jar
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ff8fab', '#41b883', '#ffd166'][i]; U.roundRect(ctx, C.x0 + 44 + i * 16, C.y0 - 16, 10, 16, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(C.x0 + 47 + i * 16, C.y0 - 21, 4, 6); }   // spray bottles
    ctx.fillStyle = '#fff'; U.roundRect(ctx, C.x0 + 110, C.y0 - 10, 34, 12, 3); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(C.x0 + 110, C.y0 - 6, 34, 2);   // folded towel
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(C.x0 + 170, C.y0 - 4); ctx.lineTo(C.x0 + 190, C.y0 - 16); ctx.moveTo(C.x0 + 172, C.y0 - 14); ctx.lineTo(C.x0 + 190, C.y0 - 2); ctx.stroke();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(C.x0 + 168, C.y0 - 2, 3, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(C.x0 + 170, C.y0 - 16, 3, 0, Math.PI * 2); ctx.stroke();   // scissors
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(C.x0 + 220, C.y0 - 6, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(C.x0 + 218, C.y0 - 8, 2.5, 0, Math.PI * 2); ctx.fill();   // a ball of shaving foam
    // the shelves of hair products and the radio
    const S = B.SHELF;
    const cols = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#ff8fab', '#8e5bd1', '#4dd0e1', '#f2b134'];
    for (let row = 0; row < 2; row++) {
      const sy = S.y0 + 26 + row * 30;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, sy, S.x1 - S.x0, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x0, sy + 5, S.x1 - S.x0, 2);
      const n = row ? 8 : 9;
      for (let i = 0; i < n; i++) {
        if (row === 1 && i > 5) continue;   // the radio sits at the right end of the lower shelf
        const x = S.x0 + 8 + i * 17, h = 12 + ((i * 5 + row * 3) % 3) * 4, col = cols[(i + row * 3) % cols.length];
        ctx.fillStyle = col; U.roundRect(ctx, x, sy - h, 11, h, 3); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x + 2, sy - h + 5, 7, 4);
        ctx.fillStyle = '#2b1d14'; ctx.fillRect(x + 3, sy - h - 4, 5, 4);
      }
    }
    const Rd = B.RADIO;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Rd.x - 18, Rd.y - 14, 36, 22, 4); ctx.fill();
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, Rd.x - 15, Rd.y - 11, 18, 16, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(Rd.x - 13, Rd.y - 9 + k * 4, 14, 1.5);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Rd.x + 10, Rd.y - 4, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(Rd.x + 10, Rd.y + 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Rd.x + 12, Rd.y - 14); ctx.lineTo(Rd.x + 22, Rd.y - 30); ctx.stroke();   // aerial
    // a framed hairstyle poster on the back wall by the shelves
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, R.x1 - 26, B.BACK_TOP + 14, 30, 26, 3); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.fillRect(R.x1 - 23, B.BACK_TOP + 17, 24, 20);
    ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('✂️', R.x1 - 11, B.BACK_TOP + 28);
    // the waiting bench (a long cushioned seat along the right wall) and a little magazine rack
    const Bn = B.BENCH;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Bn.x0 + 3, Bn.y0 + 4, Bn.x1 - Bn.x0, Bn.y1 - Bn.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Bn.x0, Bn.y0, Bn.x1 - Bn.x0, Bn.y1 - Bn.y0, 6); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Bn.x0 + 4, Bn.y0 + 4, Bn.x1 - Bn.x0 - 8, Bn.y1 - Bn.y0 - 8, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = Bn.y0 + 14; y < Bn.y1 - 8; y += 24) ctx.fillRect(Bn.x0 + 6, y, Bn.x1 - Bn.x0 - 12, 2);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(Bn.x1 - 2, Bn.y0 - 4, 6, Bn.y1 - Bn.y0 + 8);   // the bench's back against the wall
    // the reception counter: blue front, cream top, a till and the lollipop jar
    const Rc = B.RECEPTION;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Rc.x0 + 4, Rc.y0 + 6, Rc.x1 - Rc.x0, Rc.y1 - Rc.y0);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Rc.x0, Rc.y0, Rc.x1 - Rc.x0, Rc.y1 - Rc.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = Rc.x0 + 8; x < Rc.x1 - 6; x += 16) ctx.fillRect(x, Rc.y0 + 14, 8, Rc.y1 - Rc.y0 - 18);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, Rc.x0 - 2, Rc.y0 - 8, Rc.x1 - Rc.x0 + 4, 20, 6); ctx.fill();
    const Rg = B.REGISTER;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, Rg.x - 14, Rg.y - 14, 28, 18, 4); ctx.fill(); ctx.fillStyle = '#8ef0a0'; ctx.fillRect(Rg.x - 10, Rg.y - 11, 20, 6); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(Rg.x - 9 + k * 7, Rg.y - 3, 5, 3);
    const J = B.JAR;
    ctx.fillStyle = 'rgba(159,216,255,0.6)'; U.roundRect(ctx, J.x - 11, J.y - 20, 22, 22, 5); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; U.roundRect(ctx, J.x - 11, J.y - 20, 22, 22, 5); ctx.stroke();
    [['#ff8fab', -6, -26], ['#ffd166', 0, -29], ['#41b883', 6, -25], ['#3b7dd8', -3, -22]].forEach(([col, dx, dy]) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(J.x + dx, J.y + dy + 4); ctx.lineTo(J.x + dx, J.y - 2); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(J.x + dx, J.y + dy, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(J.x + dx, J.y + dy, 2.2, 0, Math.PI * 1.5); ctx.stroke(); });
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LOLLIPOPS', J.x + 6, J.y + 10);
    // potted plants in the corners
    for (const P of B.PLANTS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 14, 12, 0, Math.PI * 2); ctx.arc(P.x - 10, P.y - 8, 8, 0, Math.PI * 2); ctx.arc(P.x + 10, P.y - 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 18, 5, 0, Math.PI * 2); ctx.fill();
    }
    // the chair bases are static (the seats spin live)
    for (const c of B.CHAIRS) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(c.x + 2, c.y + 14, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 12, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 10, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the door in the bottom wall, its mat, and the shop's name plate below
    const E = B.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#fff8ee', '#3b7dd8'][i]; ctx.fillRect(E.x - 21 + i * 14, E.y - 8, 14, 14); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 46, R.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('💈 BARBER 💈', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the shop's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.BARBER.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  chairAngle() {
    const s = this.st.seat; if (!s) return 0;
    return U.easeOut(Math.min(1, s.t / CFG.BARBER.SPIN)) * Math.PI * 2;
  },
  drawChair(r, g, i, front) {
    const ctx = r.ctx, c = CFG.BARBER.CHAIRS[i], seated = this.st.seat && this.st.seat.i === i, a = seated ? this.chairAngle() : 0;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(a);
    if (!front) {
      ctx.fillStyle = '#5c6670'; ctx.fillRect(-4, -4, 8, 16);                                       // pump pole
      ctx.fillStyle = '#c62828'; U.roundRect(ctx, -16, -44, 32, 30, 8); ctx.fill();                   // back
      ctx.fillStyle = '#e53935'; U.roundRect(ctx, -12, -40, 24, 22, 6); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -9, -50, 18, 10, 4); ctx.fill();                     // headrest
      ctx.fillStyle = '#c62828'; U.roundRect(ctx, -22, -16, 44, 18, 7); ctx.fill();                   // seat
      ctx.fillStyle = '#e53935'; U.roundRect(ctx, -18, -13, 36, 11, 5); ctx.fill();
    } else {
      ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, -26, -22, 7, 20, 3); ctx.fill(); U.roundRect(ctx, 19, -22, 7, 20, 3); ctx.fill();   // armrests
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-26, -22, 7, 3); ctx.fillRect(19, -22, 7, 3);
      ctx.fillStyle = '#5c6670'; U.roundRect(ctx, -12, 4, 24, 6, 3); ctx.fill();                       // footrest
    }
    ctx.restore();
  },
  drawReflection(r, g) {
    const ctx = r.ctx, M = CFG.BARBER.MIRROR, p = g.player, st = this.st;
    if (p.x < M.x0 - 10 || p.x > M.x1 + 10 || p.y > 3290) return;
    const depth = U.clamp((p.y - 3100) / 190, 0, 1), sc = 0.9 - depth * 0.25, fy = M.y1 - 4 - depth * 22;
    ctx.save(); ctx.beginPath(); ctx.rect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0); ctx.clip();
    ctx.translate(p.x, fy); ctx.scale(sc, sc); ctx.globalAlpha = 0.9;
    r.drawPerson(0, 0, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: -(p.facing || 1), moving: p.moving && !st.seat, bob: p.bob, carry: 0, pants: '#2d3a4a' });
    ctx.restore();
    ctx.fillStyle = 'rgba(183,220,245,0.22)'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(M.x0 + 20, M.y1 - 6); ctx.lineTo(M.x0 + 64, M.y0 + 6); ctx.moveTo(M.x0 + 34, M.y1 - 6); ctx.lineTo(M.x0 + 78, M.y0 + 6); ctx.stroke();
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40;
      // the pole hangs on the facade left of the awning, clear of whoever stands at the door
      ctx.fillStyle = '#5c6670'; ctx.fillRect(cx - 34, gy + 2, 10, 4); ctx.fillRect(cx - 34, gy + 34, 10, 4);   // wall brackets
      this.drawPole(r, g, cx - 36, gy + 6, 30, true);
      return;
    }
    if (g.area !== 'barber') return;
    this.drawOutside(r, g);
    this.drawReflection(r, g);
    for (let i = 0; i < 2; i++) this.drawChair(r, g, i, false);
    // the radio's speaker thumps along with the music
    const Rd = CFG.BARBER.RADIO, th = 0.5 + 0.5 * Math.sin(t * 8);
    ctx.fillStyle = `rgba(255,209,102,${(0.15 + th * 0.25).toFixed(2)})`; ctx.beginPath(); ctx.arc(Rd.x - 6, Rd.y - 3, 10 + th * 3, 0, Math.PI * 2); ctx.fill();
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, B = CFG.BARBER;
    if (st.lolly > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawLolly(r, g) });
    if (g.area !== 'barber') return;
    for (let i = 0; i < 2; i++) items.push({ y: B.CHAIRS[i].y + 1, draw: () => this.drawChair(r, g, i, true) });
    items.push({ y: st.barber.y, draw: () => this.drawBarber(r, g) });
    items.push({ y: B.CUSTOMER.y, draw: () => this.drawCustomer(r, g) });
  },
  drawLolly(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 22 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y + 14); ctx.stroke();
    ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.arc(x, y - 3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y - 3); ctx.rotate(t * 1.5);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.3) { const rr = a / (Math.PI * 4) * 5.5; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 2.5, y - 5.5, 1.6, 0, Math.PI * 2); ctx.fill();
  },
  drawBarber(r, g) {
    const ctx = r.ctx, b = this.st.barber, t = g.time;
    r.drawPerson(b.x, b.y, { shirt: '#fff', stripes: false, skin: '#e0ac69', hair: '#2b1d14', hairStyle: 3, facing: b.facing, moving: b.moving, bob: b.bob, carry: 0, pants: '#2d3a4a', bowtie: '#e4572e', apron: '#3b7dd8' });
    // a comb in the breast pocket
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(b.x + 5, b.y - 30, 1.5, 7);
    if (b.snip > 0) {
      // snipping away at the chef's hat: the scissors open and close by the brim
      const p = g.player, sx = p.x + 16, sy = p.y - 58 + Math.sin(t * 7) * 2, open = Math.abs(Math.sin(t * 14)) * 0.45;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.5);
      ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.save(); ctx.rotate(d * open); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, 0); ctx.stroke(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(7, d * 3, 3.2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2.5; }
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // little tufts flying off
      for (let k = 0; k < 3; k++) { const ph = (t * 1.6 + k / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${(1 - ph).toFixed(2)})`; ctx.beginPath(); ctx.arc(sx - 10 + Math.sin(ph * 5 + k) * 6 - ph * 8, sy - 4 + ph * 18, 1.5, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  drawCustomer(r, g) {
    const ctx = r.ctx, C = CFG.BARBER.CUSTOMER, st = this.st, x = C.x, y = C.y;
    r.drawPerson(x, y - 6, { shirt: '#41b883', skin: '#f1c27d', hair: '#8d5a2b', hairStyle: 2, facing: -1, moving: false, bob: 0, carry: 0, pants: '#4a4a4a' });
    // the magazine held up in front, one page turning now and then
    const mx = x - 16, my = y - 26, k = st.flip > 0 ? 1 - st.flip / 0.35 : 0;
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, mx - 12, my - 9, 24, 18, 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; U.roundRect(ctx, mx - 12, my - 9, 24, 18, 2); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(mx - 1, my - 9, 2, 18);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(mx - 9, my - 6, 7, 5); ctx.fillStyle = '#9aa0a8'; for (let i = 0; i < 3; i++) { ctx.fillRect(mx - 9, my + 1 + i * 2.5, 7, 1); ctx.fillRect(mx + 3, my - 6 + i * 2.5, 7, 1); }
    r.drawPizza(mx + 6, my + 4, 3);
    if (k > 0) { const sx = Math.cos(k * Math.PI); ctx.save(); ctx.translate(mx, my); ctx.scale(sx, 1); ctx.fillStyle = sx > 0 ? '#fff8ee' : '#f6e7cf'; ctx.fillRect(0, -8, 11, 16); ctx.restore(); }
    if (st.flip > 0.3) { ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('…', x - 6, y - 52); }
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'barber') return;
    const ctx = r.ctx;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of this.st.notes) {
      const k = n.t / 1.8;
      ctx.globalAlpha = 1 - k; ctx.font = r.font(12 + k * 6); ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883'][n.ch === '♪' ? 0 : n.ch === '♫' ? 1 : 2];
      ctx.fillText(n.ch, n.x + Math.sin(n.t * 4) * 6, n.y - k * 44);
    }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(BarberExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(BarberExt);
