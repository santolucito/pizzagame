'use strict';
// The Grand Hotel on Bus Street in the City (building 5, the one with the HOTEL sign and the water tower). Walk in
// through the revolving door: a lobby with a red carpet, a reception desk where the concierge rings the bell and says
// hello, a bellhop pushing a luggage cart round and round, a fountain, potted palms, armchairs to sit in, a lift that
// brings a guest down when you press its button, a room-service trolley with a pizza under the cloche, and a cookie jar.
// Extension module: registered first in Game.ext (so its door beats the City's taxis) and in Render.ext. See js/EXTENSIONS.md.

// ---------- config ----------
CFG.HOTEL = {
  WORLD: { x0: 3200, y0: 3000, x1: 3800, y1: 3400 },      // the interior rectangle reserved for City building 5
  ROOM: { x0: 3230, y0: 3074, x1: 3770, y1: 3370 }, WALL: 24, BACK: 3026,   // the floor; the back wall face runs BACK..ROOM.y0
  DOOR: { x: 5686, y: 14 },                               // on the City sidewalk, under the hotel awning
  EXIT: { x: 3500, y: 3340 },                             // the mat inside the revolving door
  REVOLVE: { x: 3500, y: 3376, r: 30 },                   // the revolving door, set into the bottom wall
  DESK: { x0: 3416, y0: 3104, x1: 3584, y1: 3140 },
  CONCIERGE: { x: 3446, y: 3098 },
  BELL: { x: 3536, y: 3110 },
  JAR: { x: 3572, y: 3108 },
  LIFT: { x0: 3262, y0: 3074, x1: 3334, y1: 3126, button: { x: 3356, y: 3140 }, spot: { x: 3298, y: 3150 }, inside: { x: 3298, y: 3112 } },
  TROLLEY: { x: 3700, y: 3200 },
  FOUNTAIN: { x: 3660, y: 3300, rx: 40, ry: 24 },
  PALMS: [{ x: 3412, y: 3338 }, { x: 3588, y: 3338 }],
  TABLE: { x: 3330, y: 3270 },
  CHAIRS: [{ x: 3276, y: 3270, facing: 1 }, { x: 3384, y: 3270, facing: -1 }],
  RUG: { x: 3330, y: 3272, rx: 92, ry: 56 },
  CARPET: { x0: 3468, x1: 3532 },
  PADS: { cookie: { x: 3640, y: 3150 } },
  ROUTE: [{ x: 3450, y: 3190 }, { x: 3600, y: 3190 }, { x: 3600, y: 3270 }, { x: 3450, y: 3270 }],   // the bellhop's round
  COOKIE: 30, CLOCHE: 3, WALK: 70,                        // seconds a cookie lasts; seconds the cloche stays up; guest walking speed
};
CFG.AREAS.hotel = { WORLD: CFG.HOTEL.WORLD };

const HotelExt = {
  name: 'hotel',
  st: null,
  defaults: { hotel: { seen: false } },
  build(g) {
    if (!g.s.hotel) g.s.hotel = { seen: false };
    const R = CFG.HOTEL.ROUTE[0];
    this.st = {
      fade: 0, seat: null, bell: 0, welcome: 0, cookie: 0,
      guest: null, lift: { open: 0, ding: 0 }, cloche: { up: 0, hold: 0 },
      hop: { x: R.x, y: R.y, i: 1, pause: 0, facing: 1, moving: false, bob: 0, dirx: 1, diry: 0, cart: { x: R.x + 34, y: R.y, roll: 0 } },
      seenLift: false, seenCloche: false, sat: false,
    };
  },
  ready(g) { if (!this.st) this.build(g); return this.st; },

  // ---------- geometry ----------
  blocks() {
    if (this._blocks) return this._blocks;
    const H = CFG.HOTEL, R = H.ROOM, w = H.WALL, L = H.LIFT, D = H.DESK, T = H.TROLLEY, F = H.FOUNTAIN, o = [];
    o.push({ x: R.x0 - w, y: H.BACK, w: R.x1 - R.x0 + 2 * w, h: R.y0 - H.BACK }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: L.x0, y: L.y0, w: L.x1 - L.x0, h: L.y1 - L.y0 });
    o.push({ x: D.x0, y: D.y0, w: D.x1 - D.x0, h: D.y1 - D.y0 });
    o.push({ x: T.x - 22, y: T.y - 16, w: 44, h: 32 });
    o.push({ x: F.x - F.rx, y: F.y - F.ry, w: F.rx * 2, h: F.ry * 2 });
    for (const p of H.PALMS) o.push({ x: p.x - 12, y: p.y - 10, w: 24, h: 22 });
    o.push({ x: H.TABLE.x - 22, y: H.TABLE.y - 16, w: 44, h: 34 });
    for (const c of H.CHAIRS) o.push({ x: c.x - 10, y: c.y - 9, w: 20, h: 18 });
    this._blocks = o;
    return o;
  },
  obstacles(g) { return g.area === 'hotel' ? this.blocks() : []; },
  // somewhere the chef can stand: on the floor and not inside a wall or a piece of furniture
  free(x, y) {
    const R = CFG.HOTEL.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.blocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // a save (or a push) that left the chef in a wall or inside furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, H = CFG.HOTEL;
    if (this.free(p.x, p.y)) return false;
    p.x = H.EXIT.x; p.y = H.EXIT.y - 10; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  atDoor(g) {
    const p = g.player, D = CFG.HOTEL.DOOR;
    if (g.area !== 'city' || g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return false;
    return U.dist(p.x, p.y, D.x, D.y) < 30;
  },
  nearChair(g) { const p = g.player; for (const c of CFG.HOTEL.CHAIRS) if (U.dist(p.x, p.y, c.x, c.y) < 30) return c; return null; },

  // ---------- going in and out ----------
  enter(g) {
    const H = CFG.HOTEL, p = g.player, st = this.ready(g);
    g.area = 'hotel'; p.x = H.EXIT.x; p.y = H.EXIT.y - 10; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.fade = 0.45; st.bell = 0.7; st.welcome = 2.6;
    Sfx.ding(); Haptics.tap();
    if (!g.s.hotel.seen) { g.s.hotel.seen = true; g.toast('🏨 Welcome to the Grand Hotel!', true); }
  },
  leave(g) {
    const H = CFG.HOTEL, p = g.player, st = this.st;
    g.area = 'city'; p.x = H.DOOR.x; p.y = H.DOOR.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.welcome = 0; st.fade = 0.45; Sfx.drop();
  },
  // the core's Take-me-home button: drop the seat and any overlay; the core moves the chef itself
  home(g) { const st = this.st; if (!st) return; st.seat = null; st.welcome = 0; st.fade = 0; },

  // ---------- the one big button ----------
  action(g) {
    const p = g.player, H = CFG.HOTEL, st = this.ready(g);
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return null;
    if (g.area === 'city') return this.atDoor(g) ? { label: '🚪 Go inside', run: (gg) => this.enter(gg) } : null;
    if (g.area !== 'hotel') return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, H.EXIT.x, H.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (!st.guest && U.dist(p.x, p.y, H.LIFT.button.x, H.LIFT.button.y) < 40) return { label: '🛗 Call the lift', run: (gg) => this.callLift(gg) };
    if (st.cloche.hold <= 0 && U.dist(p.x, p.y, H.TROLLEY.x, H.TROLLEY.y) < 56) return { label: '🍽️ Lift the cloche', run: (gg) => this.liftCloche(gg) };
    const chair = this.nearChair(g); if (chair) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg, chair) };
    return null;
  },
  sitDown(g, chair) {
    const p = g.player, st = this.st;
    st.seat = { x: chair.x, y: chair.y, facing: chair.facing }; st.sat = true;
    p.x = chair.x; p.y = chair.y; p.moving = false; p.facing = chair.facing;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Ahh, comfy! 🛋️', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.chime(); Haptics.tap();
  },
  standUp(g) {
    const p = g.player, st = this.st, s = st.seat;
    st.seat = null; p.moving = false;
    if (s) { p.x = s.x; p.y = s.y + 28; }   // step off the chair onto the rug, never inside the chair itself
    Sfx.drop();
  },
  callLift(g) {
    const st = this.st, L = CFG.HOTEL.LIFT;
    if (st.guest) return;
    st.guest = Object.assign({ x: L.inside.x, y: L.inside.y, phase: 'out', wait: 0, moving: false, facing: 1, bob: 0 }, this.guestLook());
    st.seenLift = true; st.lift.ding = 1;
    g.floats.push({ x: L.button.x, y: L.button.y - 46, text: 'Ding! 🛗', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Sfx.ding(); Haptics.tap();
  },
  guestLook() {
    return { shirt: U.pick(['#ffcc80', '#80cbc4', '#f48fb1', '#b39ddb', '#aed581', '#7fc8f8']), skin: U.pick(['#f1c27d', '#e0ac69', '#c68642', '#8d5524']), hair: U.pick(['#2b1d14', '#6b4423', '#e6b422', '#9e9e9e']), hairStyle: U.randInt(0, 3), pants: U.pick(['#4a4a4a', '#2d3a4a', '#5b3a1a']), bag: U.pick(['#c62828', '#3b7dd8', '#2f9e44', '#f2b134']) };
  },
  liftCloche(g) {
    const st = this.st, T = CFG.HOTEL.TROLLEY;
    if (st.cloche.hold > 0) return;
    st.cloche.hold = CFG.HOTEL.CLOCHE; st.seenCloche = true;
    g.floats.push({ x: T.x, y: T.y - 66, text: 'Room service! 🍕', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    g.fx.push({ kind: 'sparkle', x0: T.x, y0: T.y - 30, x1: T.x, y1: T.y - 30, t: 0, dur: 0.7 });
    Sfx.pickup(); Haptics.tap();
  },

  // ---------- the cookie jar ----------
  // the circle takes a break while the chef is still munching the last cookie
  pads(g) {
    if (g.area !== 'hotel' || (this.st && this.st.cookie > 0)) return [];
    return [{ key: 'hotelCookie', label: 'Hotel Cookie', ico: '🍪', pos: CFG.HOTEL.PADS.cookie, price: 6, sub: 'warm & gooey' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'hotelCookie') return;
    const st = this.ready(g), p = g.player;
    st.cookie = CFG.HOTEL.COOKIE;
    g.s.stats = g.s.stats || {}; g.s.stats.cookies = (g.s.stats.cookies || 0) + 1;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Mmm, a cookie! 🍪', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },

  // ---------- hints: only at the door and inside ----------
  hint(g) {
    const st = this.ready(g), p = g.player, H = CFG.HOTEL;
    if (g.area === 'city') {
      if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return undefined;
      if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return undefined;
      const d = U.dist(p.x, p.y, H.DOOR.x, H.DOOR.y);
      if (d < 30) return { text: 'Press the button to go inside! 🏨', target: null };
      if (d < 90) return { text: 'Go inside the Hotel! 🏨', target: H.DOOR };
      return undefined;
    }
    if (g.area !== 'hotel') return undefined;
    if (st.seat) return { text: 'Ahh, comfy! What a fancy hotel 🛋️', target: null };
    if (st.guest) return { text: 'A guest is coming down! 🛎️', target: null };
    if (U.dist(p.x, p.y, H.LIFT.button.x, H.LIFT.button.y) < 40) return { text: 'Press the button to call the lift! 🛗', target: null };
    if (st.cloche.hold <= 0 && U.dist(p.x, p.y, H.TROLLEY.x, H.TROLLEY.y) < 56) return { text: 'Lift the cloche! 🍽️', target: null };
    if (!st.seenLift) return { text: 'Call the lift! 🛗', target: H.LIFT.button };
    if (!st.seenCloche) return { text: 'Peek under the cloche! 🍽️', target: H.TROLLEY };
    if (st.cookie <= 0 && g.s.cash >= 6) return { text: 'Try a hotel cookie! 🍪', target: H.PADS.cookie };
    if (!st.sat) return { text: 'Have a seat in an armchair 🛋️', target: H.CHAIRS[0] };
    return { text: 'Fancy! Enjoy the Grand Hotel 🏨', target: null };
  },

  // ---------- every step ----------
  update(g, dt) {
    const st = this.ready(g);
    st.fade = Math.max(0, st.fade - dt); st.cookie = Math.max(0, st.cookie - dt);
    if (g.area !== 'hotel') { st.seat = null; st.welcome = 0; return; }
    const p = g.player;
    st.bell = Math.max(0, st.bell - dt); st.welcome = Math.max(0, st.welcome - dt);
    if (st.seat) { p.x = st.seat.x; p.y = st.seat.y; p.moving = false; p.facing = st.seat.facing; }
    else this.rescue(g);
    this.updateBellhop(dt);
    this.updateLift(dt);
    const c = st.cloche; c.hold = Math.max(0, c.hold - dt); c.up = U.clamp(c.up + (c.hold > 0 ? dt / 0.35 : -dt / 0.5), 0, 1);
  },
  // the bellhop pushes his luggage cart round the lobby, pausing at each corner
  updateBellhop(dt) {
    const b = this.st.hop, R = CFG.HOTEL.ROUTE;
    if (b.pause > 0) { b.pause -= dt; b.moving = false; }
    else {
      const w = R[b.i], dx = w.x - b.x, dy = w.y - b.y, d = Math.hypot(dx, dy);
      if (d > 0.5) { b.dirx = dx / d; b.diry = dy / d; if (Math.abs(b.dirx) > 0.3) b.facing = b.dirx < 0 ? -1 : 1; }
      if (U.moveToward(b, w.x, w.y, 55, dt)) { b.i = (b.i + 1) % R.length; b.pause = U.rand(0.8, 1.6); }
      else { b.moving = true; b.bob += dt * 14; }
    }
    const c = b.cart, k = Math.min(1, dt * 6), ox = c.x, oy = c.y;
    c.x = U.lerp(c.x, b.x + b.dirx * 34, k); c.y = U.lerp(c.y, b.y + b.diry * 34, k);
    c.roll += Math.hypot(c.x - ox, c.y - oy);
  },
  // the lift: its doors open when a guest is on the way in or out; the guest walks to the desk, asks for a key and rides back up
  updateLift(dt) {
    const st = this.st, H = CFG.HOTEL, L = H.LIFT, gu = st.guest, lf = st.lift, walk = H.WALK;
    lf.ding = Math.max(0, lf.ding - dt);
    const wantOpen = !!gu && (gu.phase === 'out' || gu.phase === 'in' || gu.phase === 'done' || (gu.phase === 'toLift' && U.dist(gu.x, gu.y, L.spot.x, L.spot.y) < 50));
    lf.open = U.clamp(lf.open + (wantOpen ? dt / 0.6 : -dt / 0.6), 0, 1);
    if (!gu) return;
    if (gu.moving) gu.bob += dt * 14;
    if (gu.phase === 'out') { gu.moving = false; if (lf.open > 0.95 && U.moveToward(gu, L.spot.x, L.spot.y, walk, dt)) gu.phase = 'toDesk'; }
    else if (gu.phase === 'toDesk') { if (U.moveToward(gu, H.CONCIERGE.x + 6, H.DESK.y1 + 26, walk, dt)) { gu.phase = 'talk'; gu.wait = 2; gu.facing = 1; st.bell = 0.6; Sfx.ding(); } }
    else if (gu.phase === 'talk') { gu.moving = false; gu.wait -= dt; if (gu.wait <= 0) gu.phase = 'toLift'; }
    else if (gu.phase === 'toLift') { if (U.moveToward(gu, L.spot.x, L.spot.y, walk, dt)) gu.phase = 'in'; }
    else if (gu.phase === 'in') { gu.moving = false; if (lf.open > 0.95 && U.moveToward(gu, L.inside.x, L.inside.y, walk, dt)) { gu.phase = 'done'; gu.wait = 0.4; gu.facing = 1; } }
    else if (gu.phase === 'done') { gu.moving = false; gu.wait -= dt; if (gu.wait <= 0) gu.phase = 'closing'; }
    else if (gu.phase === 'closing') { gu.moving = false; if (lf.open <= 0) st.guest = null; }
  },

  // ======================= drawing =======================
  paint: {
    hotel(r, g) { HotelExt.paintLobby(r, g); },
  },
  paintLobby(r, g) {
    const ctx = r.ctx, H = CFG.HOTEL, R = H.ROOM, w = H.WALL, W = H.WORLD, L = H.LIFT, F = H.FOUNTAIN;
    // outside the building: night-blue
    ctx.fillStyle = '#1b2740'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // walls: blue sides and front, a taller wallpapered back wall with a gold dado rail
    ctx.fillStyle = '#2d5a8a'; ctx.fillRect(R.x0 - w, H.BACK, R.x1 - R.x0 + 2 * w, R.y1 + w - H.BACK);
    ctx.fillStyle = '#3b6ea5'; ctx.fillRect(R.x0, H.BACK + 8, R.x1 - R.x0, R.y0 - H.BACK - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; for (let x = R.x0 + 8; x < R.x1; x += 18) ctx.fillRect(x, H.BACK + 8, 6, R.y0 - H.BACK - 8);
    ctx.fillStyle = '#f2b134'; ctx.fillRect(R.x0, R.y0 - 3, R.x1 - R.x0, 3);
    ctx.fillStyle = '#1b2740'; ctx.fillRect(R.x0 - w, H.BACK - 2, R.x1 - R.x0 + 2 * w, 2);
    // marble floor with a soft chandelier glow
    ctx.fillStyle = '#f3e9d2'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = '#ebdfc3'; for (let ty = R.y0; ty < R.y1; ty += 36) for (let tx = R.x0; tx < R.x1; tx += 36) if (((tx - R.x0) / 36 + (ty - R.y0) / 36) % 2 === 0) ctx.fillRect(tx, ty, Math.min(36, R.x1 - tx), Math.min(36, R.y1 - ty));
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1; for (let tx = R.x0; tx <= R.x1; tx += 36) { ctx.beginPath(); ctx.moveTo(tx, R.y0); ctx.lineTo(tx, R.y1); ctx.stroke(); } for (let ty = R.y0; ty <= R.y1; ty += 36) { ctx.beginPath(); ctx.moveTo(R.x0, ty); ctx.lineTo(R.x1, ty); ctx.stroke(); }
    const glow = ctx.createRadialGradient(3500, 3220, 10, 3500, 3220, 200); glow.addColorStop(0, 'rgba(255,240,180,0.35)'); glow.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = glow; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    // the red carpet from the desk to the door, gold-edged
    ctx.fillStyle = '#c62828'; ctx.fillRect(H.CARPET.x0, H.DESK.y1 + 2, H.CARPET.x1 - H.CARPET.x0, R.y1 - H.DESK.y1 - 2);
    ctx.fillStyle = '#f2b134'; ctx.fillRect(H.CARPET.x0, H.DESK.y1 + 2, 4, R.y1 - H.DESK.y1 - 2); ctx.fillRect(H.CARPET.x1 - 4, H.DESK.y1 + 2, 4, R.y1 - H.DESK.y1 - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = H.DESK.y1 + 20; y < R.y1 - 10; y += 40) ctx.fillRect(H.CARPET.x0 + 8, y, H.CARPET.x1 - H.CARPET.x0 - 16, 3);
    // the seating corner: a round rug, a little table with flowers, two armchairs
    const RG = H.RUG;
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.ellipse(RG.x, RG.y, RG.rx, RG.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b6ea5'; ctx.beginPath(); ctx.ellipse(RG.x, RG.y, RG.rx - 4, RG.ry - 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b8def'; ctx.beginPath(); ctx.ellipse(RG.x, RG.y, RG.rx - 22, RG.ry - 16, 0, 0, Math.PI * 2); ctx.fill();
    for (const c of H.CHAIRS) this.paintArmchair(r, c);
    const T = H.TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 12, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(T.x, T.y + 8, 20, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(T.x - 20, T.y - 2, 40, 10);
    ctx.fillStyle = '#a86f3a'; ctx.beginPath(); ctx.ellipse(T.x, T.y - 2, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fc8f8'; ctx.fillRect(T.x - 4, T.y - 16, 8, 14); ctx.fillStyle = '#2f9e44'; ctx.fillRect(T.x - 1, T.y - 26, 2, 12);
    for (const [dx, dy, col] of [[-6, -26, '#ff6b8a'], [0, -32, '#ffe08a'], [6, -25, '#f48fb1']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(T.x + dx, T.y + dy, 4, 0, Math.PI * 2); ctx.fill(); }
    // the fountain basin (the water moves in `dynamic`)
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(F.x + 3, F.y + 4, F.rx, F.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(F.x, F.y, F.rx, F.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c3c8ce'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 3, F.rx, F.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fc8f8'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 2, F.rx - 8, F.ry - 7, 0, 0, Math.PI * 2); ctx.fill();
    // the lift shaft set into the back wall: a steel frame around a mirrored cab (the doors are drawn live)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(L.x0 + 4, L.y0 + 4, L.x1 - L.x0, L.y1 - L.y0);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(L.x0, L.y0 - 30, L.x1 - L.x0, L.y1 - L.y0 + 30);
    ctx.fillStyle = '#cfd8dc'; ctx.fillRect(L.x0 + 6, L.y0 - 22, L.x1 - L.x0 - 12, L.y1 - L.y0 + 20);
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(L.x0 + 6, L.y1 - 10, L.x1 - L.x0 - 12, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(L.x0 + 10, L.y0 - 18, 4, 28);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (L.x0 + L.x1) / 2 - 16, L.y0 - 42, 32, 10, 3); ctx.fill();
    // the call button: a brass panel on a little post beside the lift
    const B = L.button;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(B.x + 2, B.y + 2, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(B.x - 3, B.y - 30, 6, 30);
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, B.x - 9, B.y - 44, 18, 20, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(B.x, B.y - 34, 4.5, 0, Math.PI * 2); ctx.fill();
    // the back wall: key rack, GRAND HOTEL sign, clock, a framed picture
    const KR = { x: 3350, y: H.BACK + 12 };
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, KR.x, KR.y, 56, 30, 3); ctx.fill();
    for (let i = 0; i < 8; i++) { const kx = KR.x + 8 + (i % 4) * 13, ky = KR.y + 8 + Math.floor(i / 4) * 14; ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(kx, ky, 2.5, 0, Math.PI * 2); ctx.fill(); if (i !== 2 && i !== 5) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(kx - 1, ky + 2, 2, 6); ctx.fillRect(kx - 1, ky + 7, 3, 1.5); } }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 3545 - 66, H.BACK + 11, 132, 24, 6); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★ GRAND HOTEL ★', 3545, H.BACK + 23);
    const CK = { x: 3642, y: H.BACK + 26 };
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(CK.x, CK.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(CK.x, CK.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(CK.x, CK.y); ctx.lineTo(CK.x, CK.y - 7); ctx.moveTo(CK.x, CK.y); ctx.lineTo(CK.x + 5, CK.y + 3); ctx.stroke();
    ctx.fillStyle = '#f2b134'; ctx.fillRect(3700, H.BACK + 12, 44, 30); ctx.fillStyle = '#7fc8f8'; ctx.fillRect(3704, H.BACK + 16, 36, 22);
    ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.moveTo(3704, H.BACK + 38); ctx.lineTo(3716, H.BACK + 24); ctx.lineTo(3726, H.BACK + 32); ctx.lineTo(3732, H.BACK + 27); ctx.lineTo(3740, H.BACK + 38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(3732, H.BACK + 21, 3, 0, Math.PI * 2); ctx.fill();
    // the revolving door: a round opening in the front wall (the glass wings turn in `dynamic`); the welcome mat inside
    const RV = H.REVOLVE;
    ctx.fillStyle = '#3b444d'; ctx.beginPath(); ctx.arc(RV.x, RV.y, RV.r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b7480'; ctx.beginPath(); ctx.arc(RV.x, RV.y, RV.r, 0, Math.PI * 2); ctx.fill();
    const E = H.EXIT;
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, E.x - 24, E.y - 10, 48, 20, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WELCOME', E.x, E.y);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.fillText('🏨 GRAND HOTEL LOBBY', 3660, R.y1 + 12);
  },
  paintArmchair(r, c) {
    const ctx = r.ctx, f = c.facing;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(c.x + 3, c.y + 14, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8e2a36'; U.roundRect(ctx, c.x - 16, c.y - 4, 32, 18, 5); ctx.fill();            // seat
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, c.x - 16, c.y - 2, 32, 12, 5); ctx.fill();
    ctx.fillStyle = '#8e2a36'; U.roundRect(ctx, c.x - f * 20 - 6, c.y - 26, 12, 40, 5); ctx.fill();    // high back away from the table
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, c.x - f * 20 - 4, c.y - 24, 8, 36, 4); ctx.fill();
    ctx.fillStyle = '#8e2a36'; U.roundRect(ctx, c.x - 16, c.y - 14, 32, 7, 3); ctx.fill();            // armrest on the far side
    ctx.fillStyle = '#f2b134'; for (const dx of [-12, 10]) ctx.fillRect(c.x + dx, c.y + 13, 4, 4);   // gold feet
  },
  // ---------- moving things under people ----------
  dynamic(r, g) {
    if (g.area !== 'hotel' || !this.st) return;
    const ctx = r.ctx, H = CFG.HOTEL, F = H.FOUNTAIN, RV = H.REVOLVE, t = g.time, p = g.player;
    // the fountain: a spout with droplets and rings on the water
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { const ph = (t * 0.45 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(F.x, F.y - 2, 4 + ph * (F.rx - 12), 2 + ph * (F.ry - 9), 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#c3c8ce'; ctx.fillRect(F.x - 4, F.y - 30, 8, 28); ctx.beginPath(); ctx.ellipse(F.x, F.y - 30, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(F.x, F.y - 2, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff';
    for (let i = 0; i < 8; i++) { const ph = (t * 1.3 + i / 8) % 1, side = i % 2 ? 1 : -1, dx = side * ph * 16 * (0.6 + (i % 3) * 0.2), dy = -34 - Math.sin(ph * Math.PI) * 16 + ph * 32; ctx.globalAlpha = 0.9 - ph * 0.6; ctx.beginPath(); ctx.arc(F.x + dx, F.y + dy, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // the revolving door turns, faster when the chef is close
    const near = U.dist(p.x, p.y, H.EXIT.x, H.EXIT.y) < 60, a = t * (near ? 2.4 : 0.7);
    ctx.save(); ctx.translate(RV.x, RV.y);
    for (let k = 0; k < 4; k++) {
      const ang = a + k * Math.PI / 2, cx = Math.cos(ang) * RV.r, cy = Math.sin(ang) * RV.r;
      ctx.strokeStyle = 'rgba(191,227,255,0.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cx, cy); ctx.stroke();
    }
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, RV.r, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, RV.r, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.restore();
  },
  // ---------- people and furniture, y-sorted with the chef ----------
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    if (st.cookie > 0 && !g.driving && !g.onTrain) items.push({ y: g.player.y + 1, draw: () => this.drawCookie(r, g) });
    if (g.area !== 'hotel') return;
    const H = CFG.HOTEL, b = st.hop;
    items.push({ y: H.CONCIERGE.y, draw: () => this.drawConcierge(r, g) });
    items.push({ y: H.DESK.y1, draw: () => this.drawDesk(r, g) });
    items.push({ y: H.LIFT.y1, draw: () => this.drawLiftDoors(r, g) });
    if (st.guest) items.push({ y: st.guest.y, draw: () => this.drawGuest(r, g, st.guest) });
    items.push({ y: b.y, draw: () => this.drawBellhop(r, g) });
    items.push({ y: b.cart.y + 6, draw: () => this.drawCart(r, g) });
    items.push({ y: H.TROLLEY.y + 12, draw: () => this.drawTrolley(r, g) });
    for (const p of H.PALMS) items.push({ y: p.y + 10, draw: () => this.drawPalm(r, p) });
  },
  drawConcierge(r, g) {
    const ctx = r.ctx, C = CFG.HOTEL.CONCIERGE, st = this.st;
    r.drawPerson(C.x, C.y, { shirt: '#2d3a4a', skin: '#f1c27d', hair: '#9e9e9e', hairStyle: 0, bowtie: '#c62828', pants: '#2d3a4a', facing: 1, moving: false, bob: 0, carry: 0 });
    ctx.fillStyle = '#f2b134'; ctx.fillRect(C.x + 4, C.y - 24, 6, 3);   // name badge
    if (st.welcome > 0) r.drawBubble(C.x + 10, C.y - 64 + Math.sin(g.time * 5) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Welcome!', 0, 0); }, 84);
  },
  drawDesk(r, g) {
    const ctx = r.ctx, H = CFG.HOTEL, D = H.DESK, st = this.st, w = D.x1 - D.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(D.x0 + 4, D.y0 + 6, w, D.y1 - D.y0);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(D.x0, D.y0 + 8, w, D.y1 - D.y0 - 8);
    ctx.fillStyle = '#4a2e14'; for (let x = D.x0 + 12; x < D.x1 - 8; x += 28) ctx.fillRect(x, D.y0 + 14, 18, D.y1 - D.y0 - 18);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(D.x0 - 3, D.y0, w + 6, 10);
    ctx.fillStyle = '#a86f3a'; ctx.fillRect(D.x0 - 3, D.y0, w + 6, 4);
    ctx.fillStyle = '#f2b134'; ctx.fillRect(D.x0, D.y0 + 10, w, 2);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, D.x0 + w / 2 - 34, D.y0 + 16, 68, 14, 3); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('RECEPTION', D.x0 + w / 2, D.y0 + 23);
    // the bell: wobbles and rings when the concierge taps it
    const B = H.BELL, wob = st.bell > 0 ? Math.sin(st.bell * 40) * 0.25 : 0;
    ctx.save(); ctx.translate(B.x, B.y); ctx.rotate(wob);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(0, 1, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(0, -3, 7, Math.PI, 0); ctx.fill(); ctx.fillRect(-7, -3, 14, 3);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-1.5, -12, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-3, -6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (st.bell > 0) { ctx.strokeStyle = `rgba(255,224,138,${st.bell.toFixed(2)})`; ctx.lineWidth = 2; for (const k of [1, 2]) { ctx.beginPath(); ctx.arc(B.x, B.y - 4, 10 + (0.7 - st.bell) * 14 * k, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
    // the cookie jar at the end of the desk
    const J = H.JAR;
    ctx.fillStyle = 'rgba(191,227,255,0.8)'; U.roundRect(ctx, J.x - 8, J.y - 14, 16, 20, 4); ctx.fill();
    ctx.fillStyle = '#b86f2d'; for (const [dx, dy] of [[-3, -1], [3, -4], [0, 2], [-2, -7]]) { ctx.beginPath(); ctx.arc(J.x + dx, J.y + dy, 3.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; for (const [dx, dy] of [[-3, -1], [4, -4], [-1, 2]]) ctx.fillRect(J.x + dx - 0.5, J.y + dy - 0.5, 1.2, 1.2);
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, J.x - 9, J.y - 18, 18, 5, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; U.roundRect(ctx, J.x - 8, J.y - 14, 16, 20, 4); ctx.stroke();
  },
  drawLiftDoors(r, g) {
    const ctx = r.ctx, L = CFG.HOTEL.LIFT, lf = this.st.lift, w = L.x1 - L.x0 - 12, half = w / 2, x0 = L.x0 + 6, y0 = L.y0 - 22, h = L.y1 - L.y0 + 20;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    const slide = lf.open * (half - 2);
    for (const side of [-1, 1]) {
      const dx = side < 0 ? x0 - slide : x0 + half + slide;
      ctx.fillStyle = '#b0bec5'; ctx.fillRect(dx, y0, half, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(dx + 3, y0 + 3, half - 6, 4);
      ctx.fillStyle = '#78909c'; ctx.fillRect(side < 0 ? dx + half - 2 : dx, y0, 2, h);
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(dx + half / 2 - 4, y0 + 14, 8, 10);
    }
    ctx.restore();
    // the floor light above the doors glows when the lift is called
    const lit = lf.ding > 0 || lf.open > 0, cx = (L.x0 + L.x1) / 2;
    ctx.fillStyle = lit ? '#ffe08a' : '#6b7480'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lit ? '▼ 1' : '▲ 7', cx, L.y0 - 37);
  },
  drawGuest(r, g, gu) {
    const ctx = r.ctx, f = gu.facing || 1;
    r.drawPerson(gu.x, gu.y, { shirt: gu.shirt, skin: gu.skin, hair: gu.hair, hairStyle: gu.hairStyle, pants: gu.pants, facing: f, moving: gu.moving, bob: gu.bob, carry: 0 });
    // a little suitcase in the trailing hand
    const bx = gu.x - f * 17, by = gu.y - 12;
    ctx.fillStyle = gu.bag; U.roundRect(ctx, bx - 6, by - 8, 12, 16, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(bx - 6, by - 2, 12, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(bx - 2, by - 10, 4, 2);
    if (gu.phase === 'talk') r.drawBubble(gu.x - 8, gu.y - 64 + Math.sin(g.time * 5) * 2, () => { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🔑?', 0, 0); }, 44);
  },
  drawBellhop(r, g) {
    const ctx = r.ctx, b = this.st.hop;
    r.drawPerson(b.x, b.y, { shirt: '#c62828', skin: '#e0ac69', hat: 'cap', capColor: '#c62828', pants: '#2d3a4a', belt: true, facing: b.facing, moving: b.moving, bob: b.bob, carry: 0 });
    const bob = b.moving ? Math.sin(b.bob) * 2 : 0;
    ctx.fillStyle = '#f2b134'; for (const dy of [-26, -21]) { ctx.beginPath(); ctx.arc(b.x - 4, b.y + dy + bob, 1.6, 0, Math.PI * 2); ctx.arc(b.x + 4, b.y + dy + bob, 1.6, 0, Math.PI * 2); ctx.fill(); }
  },
  drawCart(r, g) {
    const ctx = r.ctx, c = this.st.hop.cart, x = c.x, y = c.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 8, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    // brass frame: a base, two posts and a top bar
    ctx.fillStyle = '#f2b134'; ctx.fillRect(x - 22, y - 2, 44, 6); ctx.fillRect(x - 20, y - 54, 4, 54); ctx.fillRect(x + 16, y - 54, 4, 54); ctx.fillRect(x - 22, y - 56, 44, 4);
    // luggage: a red case, a blue one, a hat box
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, x - 16, y - 20, 32, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 16, y - 12, 32, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 3, y - 22, 6, 3);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - 13, y - 34, 26, 14, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 13, y - 28, 26, 2);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.ellipse(x, y - 40, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f48fb1'; ctx.beginPath(); ctx.ellipse(x, y - 42, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    // wheels turn as it rolls
    for (const dx of [-15, 15]) {
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + dx, y + 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; const a = c.roll / 5; ctx.beginPath(); ctx.moveTo(x + dx - Math.cos(a) * 4, y + 6 - Math.sin(a) * 4); ctx.lineTo(x + dx + Math.cos(a) * 4, y + 6 + Math.sin(a) * 4); ctx.moveTo(x + dx - Math.sin(a) * 4, y + 6 + Math.cos(a) * 4); ctx.lineTo(x + dx + Math.sin(a) * 4, y + 6 - Math.cos(a) * 4); ctx.stroke();
    }
  },
  drawTrolley(r, g) {
    const ctx = r.ctx, T = CFG.HOTEL.TROLLEY, c = this.st.cloche, x = T.x, y = T.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    for (const dx of [-16, 16]) { ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x + dx - 1.5, y - 6, 3, 14); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + dx, y + 9, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 24, y - 30, 48, 26, 4); ctx.fill();                   // the tablecloth
    ctx.fillStyle = '#f48fb1'; ctx.fillRect(x - 24, y - 8, 48, 4);
    ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1; U.roundRect(ctx, x - 24, y - 30, 48, 26, 4); ctx.stroke();
    ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.ellipse(x, y - 30, 20, 8, 0, 0, Math.PI * 2); ctx.fill();   // the plate
    ctx.fillStyle = '#c3c8ce'; ctx.beginPath(); ctx.ellipse(x, y - 30, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (c.up > 0.05) r.drawPizza(x, y - 32, 11);                                                         // the pizza under the cloche
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 20, y - 18, 3, 0, Math.PI * 2); ctx.fill();   // a little flower vase
    ctx.fillStyle = '#7fc8f8'; ctx.fillRect(x + 18, y - 16, 4, 6);
    // the cloche lifts and tilts away
    const lift = U.easeOut(c.up) * 36;
    ctx.save(); ctx.translate(x - 16, y - 32 - lift); ctx.rotate(-c.up * 0.45); ctx.translate(16, 0);
    ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -2, 16, 14, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-16, -2, 32, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-6, -8, 4, 2.5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.arc(0, -16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawPalm(r, p) {
    const ctx = r.ctx, x = p.x, y = p.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8401c'; U.roundRect(ctx, x - 14, y - 10, 28, 22, 4); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 15, y - 12, 30, 6);
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.quadraticCurveTo(x + 4, y - 30, x + 2, y - 46); ctx.stroke();
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55; ctx.fillStyle = k % 2 ? '#2f9e44' : '#4caf50'; ctx.save(); ctx.translate(x + 2, y - 46); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(16, 0, 18, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(x + 2, y - 46, 3, 0, Math.PI * 2); ctx.fill();
  },
  drawCookie(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (const [dx, dy] of [[-2, -1.5], [2, -2], [1, 2], [-2, 2.5]]) ctx.fillRect(x + dx - 0.7, y + dy - 0.7, 1.4, 1.4);
    ctx.fillStyle = '#f3e9d2'; ctx.beginPath(); ctx.arc(x + f * 4, y - 4, 2.6, 0, Math.PI * 2); ctx.fill();   // a bite taken
  },
  // ---------- screen space: the night outside the building, and a short fade through the door ----------
  screen(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, Hh = r.canvas.height / r.dpr;
    if (g.area === 'hotel') {
      const B = CFG.HOTEL.WORLD, x0 = (B.x0 - r.camX) * r.scale, y0 = (B.y0 - r.camY) * r.scale, x1 = (B.x1 - r.camX) * r.scale, y1 = (B.y1 - r.camY) * r.scale;
      ctx.fillStyle = '#1b2740';
      if (x0 > 0) ctx.fillRect(0, 0, x0, Hh);
      if (x1 < W) ctx.fillRect(x1, 0, W - x1, Hh);
      if (y0 > 0) ctx.fillRect(0, 0, W, y0);
      if (y1 < Hh) ctx.fillRect(0, y1, W, Hh - y1);
    }
    if (st.fade <= 0) return;
    ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, Hh);
  },
};
Game.ext.unshift(HotelExt);
Render.ext.push(HotelExt);
