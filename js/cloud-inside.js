'use strict';
// Inside the Sky Terminal at Cloud Harbor (js/airfield.js owns Cloud Harbor itself, the Sky Café and the door spot in
// CFG.CLOUD.DOORS). Walk up to the terminal's glass door and press '🚪 Go inside': a bright, puffy hall seen from above.
//  - the cloud check-in desk with an agent in a cloud hat ("Where to? ☁️"): '🎫 Check in' gets a boarding pass;
//  - a departures board whose letters flip between the sky's places (RAINBOW, PIZZA MOON, HOME 🍕…);
//  - a baggage carousel of fluffy cloud suitcases going round: '🧳 Grab a fluffy bag' and carry it for half a minute;
//  - a big window onto the sky: '👀 Look out' fills the screen with the sky for a few seconds (a rainbow, the blimp, a
//    plane coming in to land on a cloud, balloons drifting by);
//  - three cloud chairs: '☁️ Sit on a cloud' ("So soft!").
// The room's walls, door and name plate come from AirfieldInsideExt.shell (js/airfield-inside.js), so it looks like the
// airfield's other rooms; it is called only while painting, so the two files may load in either order.
// Extension module: registered with Game.ext (first, so its door beats Cloud Harbor's own hints) and Render.ext.

CFG.CLOUD_IN = {
  WALL: 24, FADE: 0.45, DOOR_R: 30, HINT_R: 60, NEAR: 34, CARRY: 30, VIEW: 6, STAND: 0.35,
  ROOM: {
    key: 'cloudterminal', toast: '☁️ Welcome to the Sky Terminal!', hint: 'Go inside the Sky Terminal! ☁️', title: '☁️ SKY TERMINAL',
    WORLD: { x0: 24000, y0: 4000, x1: 24600, y1: 4400 }, ROOM: { x0: 24040, y0: 4100, x1: 24560, y1: 4340 }, BACK_TOP: 4016,
    EXIT: { x: 24300, y: 4322 },
    DESK: { x0: 24058, y0: 4100, x1: 24190, y1: 4140 }, AGENT: { x: 24124, y: 4106 }, CHECKIN: { x: 24124, y: 4168 },
    WINDOW: { x0: 24214, y0: 4026, x1: 24400, y1: 4092 }, LOOK_SPOT: { x: 24307, y: 4130 },
    BOARD: { x0: 24420, y0: 4026, x1: 24548, y1: 4090 },
    CAROUSEL: { x: 24440, y: 4230, rx: 74, ry: 28 }, BAG_SPOT: { x: 24440, y: 4290 },
    CHAIRS: [{ x: 24076, y: 4300 }, { x: 24126, y: 4300 }, { x: 24176, y: 4300 }],
  },
  DESTS: ['RAINBOW', 'PIZZA MOON', 'SUNNY HILL', 'HOME 🍕', 'STAR ISLE', 'BIG CLOUD', 'SAUCE BAY'],
  STATES: [['ON TIME', '#8ef0a0'], ['BOARDING', '#ffd166'], ['FLOATING', '#9fd8ff'], ['GO!', '#8ef0a0']],
  BAG_COLS: ['#ffd6ec', '#cfe8ff', '#fff3b0', '#d4f7dc', '#e6d9ff', '#ffffff'],
};
CFG.AREAS.cloudterminal = { WORLD: CFG.CLOUD_IN.ROOM.WORLD, place: 'cloud' };

const CloudInsideExt = {
  name: 'cloudInside',
  defaults: { cloudIn: { seen: false, checkins: 0, bags: 0, looks: 0, sits: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    if (!g.s.cloudIn) g.s.cloudIn = JSON.parse(JSON.stringify(this.defaults.cloudIn));
    for (const [k, v] of Object.entries(this.defaults.cloudIn)) if (g.s.cloudIn[k] === undefined) g.s.cloudIn[k] = v;
    const C = CFG.CLOUD_IN;
    this.st = {
      fade: 0, agent: 0, bag: 0, view: null, seat: null, still: 0,
      rows: C.DESTS.slice(0, 4).map((d, i) => ({ dest: d, state: i % C.STATES.length, flip: 0 })), flipT: 2.5, flipN: 4,
      obs: this.roomObstacles(),
    };
  },
  roomObstacles() {
    const R = CFG.CLOUD_IN.ROOM, A = R.ROOM, w = CFG.CLOUD_IN.WALL, o = [];
    const box = (x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    box(A.x0 - w, A.y0 - w, A.x1 + w, A.y0); box(A.x0 - w, A.y1, A.x1 + w, A.y1 + w); box(A.x0 - w, A.y0, A.x0, A.y1); box(A.x1, A.y0, A.x1 + w, A.y1);
    const D = R.DESK; box(D.x0, D.y0, D.x1, D.y1);
    const C = R.CAROUSEL; box(C.x - C.rx, C.y - C.ry, C.x + C.rx, C.y + C.ry);
    for (const c of R.CHAIRS) box(c.x - 18, c.y - 28, c.x + 18, c.y - 16);   // the puffy backs (you sit on the cushions)
    return o;
  },
  inside(g) { return g.area === CFG.CLOUD_IN.ROOM.key; },
  free(g, x, y) {
    if (!this.inside(g)) return true;
    const A = CFG.CLOUD_IN.ROOM.ROOM, r = 12;
    if (x < A.x0 + r || x > A.x1 - r || y < A.y0 + r || y > A.y1 - r) return false;
    return !this.st.obs.some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h);
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  // Cloud Harbor's own rides (the bouncy clouds, the glider, a parachute) and the plane's take-off
  airBusy() { const a = typeof AirfieldExt !== 'undefined' ? AirfieldExt.rt : null; return !!(a && (a.ride || a.runup || a.roll)); },
  near(g, s, r) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < (r || CFG.CLOUD_IN.NEAR); },
  doorSpot() { const D = CFG.CLOUD && CFG.CLOUD.DOORS; return D ? D.terminal : null; },
  atDoor(g, r) {
    if (g.area !== 'cloud' || !this.onFoot(g) || this.airBusy()) return false;
    const d = this.doorSpot(); return !!d && this.near(g, d, r);
  },
  chairNear(g, r = 18) { const p = g.player; let best = null, bd = r; for (const c of CFG.CLOUD_IN.ROOM.CHAIRS) { const d = U.dist(p.x, p.y, c.x, c.y); if (d < bd) { bd = d; best = c; } } return best; },

  // ---------- game hooks ----------
  obstacles(g) { return this.inside(g) && this.st ? this.st.obs : []; },
  action(g) {
    if (!this.st) this.build(g);
    const st = this.st, R = CFG.CLOUD_IN.ROOM;
    if (this.atDoor(g, CFG.CLOUD_IN.DOOR_R)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (!this.inside(g) || !this.onFoot(g)) return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (st.view) return { label: '🚶 Done looking', run: (gg) => this.doneLooking(gg) };
    if (this.near(g, R.EXIT, CFG.CLOUD_IN.DOOR_R)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, R.CHECKIN, 36)) return { label: '🎫 Check in', run: (gg) => this.checkIn(gg) };
    if (this.near(g, R.LOOK_SPOT, 36)) return { label: '👀 Look out', run: (gg) => this.lookOut(gg) };
    if (st.bag <= 0 && this.near(g, R.BAG_SPOT, 40)) return { label: '🧳 Grab a fluffy bag', run: (gg) => this.grabBag(gg) };
    const c = this.chairNear(g); if (c) return { label: '☁️ Sit on a cloud', run: (gg) => this.sitDown(gg, c) };
    return null;
  },
  enter(g) {
    const R = CFG.CLOUD_IN.ROOM, p = g.player, st = this.st;
    g.area = R.key; p.x = R.EXIT.x; p.y = R.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.reset(); st.fade = CFG.CLOUD_IN.FADE;
    Sfx.ding(); Haptics.tap();
    if (!g.s.cloudIn.seen) { g.s.cloudIn.seen = true; g.toast(R.toast, true); }
  },
  leave(g) {
    const d = this.doorSpot(), p = g.player;
    g.area = 'cloud'; p.x = d.x; p.y = d.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.reset(); this.st.fade = CFG.CLOUD_IN.FADE; Sfx.drop();
  },
  reset() { const st = this.st; st.seat = null; st.view = null; st.agent = 0; st.still = 0; },
  home(g) { if (!this.st) return; this.reset(); this.st.fade = 0; this.st.bag = 0; },
  // a save or a push that left the chef in a wall or in the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, R = CFG.CLOUD_IN.ROOM;
    if (!this.inside(g) || this.free(g, p.x, p.y)) return false;
    p.x = R.EXIT.x; p.y = R.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  float(g, x, y, text, dur = 1.5) { g.floats.push({ x, y, text, color: '#ffe08a', t: 0, dur, big: true }); },
  checkIn(g) {
    const st = this.st, R = CFG.CLOUD_IN.ROOM, p = g.player;
    st.agent = 3; g.s.cloudIn.checkins++; p.facing = 1;
    this.float(g, p.x, p.y - 74, '🎫 Boarding pass!');
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: R.AGENT.x + U.rand(-20, 20), y0: R.AGENT.y - 30 + U.rand(-14, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 });
    Sfx.ding(); Haptics.tap();
  },
  grabBag(g) {
    const st = this.st, p = g.player;
    st.bag = CFG.CLOUD_IN.CARRY; g.s.cloudIn.bags++;
    this.float(g, p.x, p.y - 70, 'So fluffy! 🧳');
    Sfx.pickup(); Haptics.success();
  },
  lookOut(g) { const st = this.st, p = g.player; st.view = { t: 0 }; st.still = 0; p.moving = false; g.s.cloudIn.looks++; Sfx.chime(); Haptics.tap(); },
  doneLooking(g) { this.st.view = null; this.st.still = 0; Haptics.tap(); },
  sitDown(g, c) {
    const st = this.st, p = g.player;
    st.seat = { x: c.x, y: c.y, t: 0 }; st.still = 0; g.s.cloudIn.sits++;
    p.x = c.x; p.y = c.y; p.moving = false; p.facing = 1;
    this.float(g, p.x, p.y - 70, 'So soft! ☁️');
    Sfx.tone(240, 0.18, 'triangle', 0.04, 260); Haptics.tap();
  },
  standUp(g) { const st = this.st, p = g.player; if (st.seat) { p.x = st.seat.x; p.y = st.seat.y; } st.seat = null; st.still = 0; p.moving = false; Sfx.drop(); },
  pushedAway(g, dt) {
    const st = this.st, a = Input.axis();
    st.still = Math.hypot(a.x, a.y) > 0.6 ? st.still + dt : 0;
    return st.still > CFG.CLOUD_IN.STAND;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, C = CFG.CLOUD_IN;
    st.fade = Math.max(0, st.fade - dt); st.agent = Math.max(0, st.agent - dt); st.bag = Math.max(0, st.bag - dt);
    // the departures board: every few seconds one row flips to a new place, letter by letter
    for (const r of st.rows) r.flip = Math.max(0, r.flip - dt);
    st.flipT -= dt;
    if (st.flipT <= 0) { st.flipT = 2.6; const row = st.rows[st.flipN % st.rows.length]; row.dest = C.DESTS[st.flipN % C.DESTS.length]; row.state = (row.state + 1) % C.STATES.length; row.flip = 0.9; st.flipN++; }
    if (!this.inside(g)) { if (st.seat || st.view) this.reset(); return; }
    if (!this.onFoot(g)) return;
    if (st.seat) {
      st.seat.t += dt; p.x = st.seat.x; p.y = st.seat.y + Math.sin(st.seat.t * 3) * 1.2; p.moving = false; p.facing = 1;
      if (this.pushedAway(g, dt)) this.standUp(g);
      return;
    }
    if (st.view) {
      st.view.t += dt; p.moving = false;
      if (st.view.t >= C.VIEW || this.pushedAway(g, dt)) this.doneLooking(g);
      return;
    }
    this.rescue(g);
  },
  hint(g) {
    if (!this.st) return undefined;
    const st = this.st, p = g.player, s = g.s.cloudIn, C = CFG.CLOUD_IN, R = C.ROOM;
    if (g.area === 'cloud') {
      if (!this.atDoor(g, C.HINT_R)) return undefined;
      const d = this.doorSpot();
      return { text: R.hint, target: U.dist(p.x, p.y, d.x, d.y) < C.DOOR_R ? null : d };
    }
    if (!this.inside(g) || !this.onFoot(g)) return undefined;
    const go = (text, spot, r = 36) => ({ text, target: this.near(g, spot, r) ? null : spot });
    if (st.seat) return { text: 'So soft! Like sitting on a cloud ☁️', target: null };
    if (st.view) return { text: 'Look at the sky! 🌈', target: null };
    if (!s.checkins) return go('Check in at the cloud desk! 🎫', R.CHECKIN);
    if (!s.bags && st.bag <= 0) return go('Grab a fluffy bag from the belt! 🧳', R.BAG_SPOT, 40);
    if (!s.looks) return go('Look out of the big window! 👀', R.LOOK_SPOT);
    if (!s.sits) { const c = this.chairNear(g); return { text: 'Sit on a cloud chair ☁️', target: c ? null : R.CHAIRS[2] }; }
    return go('Back outside through the door 🚪', R.EXIT, 30);
  },

  // ======================= render hooks =======================
  paint: {
    cloudterminal(r, g) { CloudInsideExt.paintRoom(r, g); },
  },
  puff(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 9 * s, 0, Math.PI * 2); ctx.arc(x + 10 * s, y - 5 * s, 12 * s, 0, Math.PI * 2); ctx.arc(x + 22 * s, y, 9 * s, 0, Math.PI * 2); ctx.fill(); },
  paintRoom(r, g) {
    const R = CFG.CLOUD_IN.ROOM, ctx = r.ctx, E = this, AF = typeof AirfieldInsideExt !== 'undefined' ? AirfieldInsideExt : null;
    if (!AF) { const A = R.ROOM; ctx.fillStyle = '#f4f8ff'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); return; }
    AF.shell(r, R, {
      out: '#79c6f2', back: '#eaf6ff', wall: '#bcd7ef', title: R.title, mat: '#3b7dd8',
      floor: (ctx2, A) => {
        AF.tiles('#f7fbff', '#eaf3fc', 30)(ctx2, A);
        ctx2.fillStyle = 'rgba(159,216,255,0.35)'; for (let i = 0; i < 9; i++) E.puff(ctx2, A.x0 + 40 + (i * 157) % (A.x1 - A.x0 - 80), A.y0 + 40 + (i * 83) % (A.y1 - A.y0 - 70), 0.8, 'rgba(159,216,255,0.3)');
        // a rainbow rug in front of the window
        const cx = R.LOOK_SPOT.x, cy = R.LOOK_SPOT.y + 40;
        ['#ff6b6b', '#ffb347', '#ffe066', '#7bd389', '#6cb4ee', '#a78bfa'].forEach((c, i) => { ctx2.strokeStyle = c; ctx2.lineWidth = 5; ctx2.beginPath(); ctx2.ellipse(cx, cy, 64 - i * 5, 26 - i * 3, 0, Math.PI, 0); ctx2.stroke(); });
      },
      backArt: (ctx2, A) => {
        ctx2.fillStyle = '#3b7dd8'; ctx2.fillRect(A.x0 - 24, R.BACK_TOP, A.x1 - A.x0 + 48, 6);
        for (let i = 0; i < 7; i++) E.puff(ctx2, A.x0 - 10 + i * 82, R.BACK_TOP + 22 + (i % 2) * 40, 1, 'rgba(255,255,255,0.9)');
        const B = R.BOARD; ctx2.fillStyle = '#5c6670'; U.roundRect(ctx2, B.x0 - 4, B.y0 - 4, B.x1 - B.x0 + 8, B.y1 - B.y0 + 8, 6); ctx2.fill(); ctx2.fillStyle = '#1e2733'; ctx2.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
        const Wn = R.WINDOW; ctx2.fillStyle = '#fff'; U.roundRect(ctx2, Wn.x0 - 7, Wn.y0 - 7, Wn.x1 - Wn.x0 + 14, Wn.y1 - Wn.y0 + 14, 14); ctx2.fill();
        // a cloud sign with a plane over the check-in desk
        E.puff(ctx2, 24146, 4044, 1.4, '#fff'); ctx2.font = r.font(16); ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.fillText('✈️', 24161, 4039);
      },
    });
    // the carousel: a cloud-white rim, a sky-blue belt, a puffy middle
    const C = R.CAROUSEL;
    ctx.fillStyle = 'rgba(30,80,140,0.15)'; ctx.beginPath(); ctx.ellipse(C.x + 4, C.y + 6, C.rx, C.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dfe9f5'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx, C.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cb4ee'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx - 4, C.ry - 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx - 26, C.ry - 16, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) E.puff(ctx, C.x - 30 + i * 14, C.y + (i % 2 ? 2 : -2), 0.5, '#f4f8ff');
    // the cloud chairs: puffy backs and cushions
    for (const c of R.CHAIRS) {
      ctx.fillStyle = 'rgba(30,80,140,0.15)'; ctx.beginPath(); ctx.ellipse(c.x + 3, c.y + 10, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
      E.puff(ctx, c.x - 20, c.y - 20, 0.95, '#dceeff'); E.puff(ctx, c.x - 20, c.y - 22, 0.9, '#fff');
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 2, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(159,216,255,0.5)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, 18, 5, 0, 0, Math.PI); ctx.fill();
    }
    AF.plant(ctx, 24538, 4318); AF.plant(ctx, 24210, 4120);
  },
  // the check-in desk's front (an entity, so the agent stands behind it): cloud-white with a blue band and puffs
  drawDesk(r) {
    const ctx = r.ctx, D = CFG.CLOUD_IN.ROOM.DESK;
    ctx.fillStyle = 'rgba(30,80,140,0.15)'; ctx.fillRect(D.x0 + 4, D.y1 - 2, D.x1 - D.x0, 6);
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, D.x0, D.y0 - 6, D.x1 - D.x0, 22, 5); ctx.fill();
    ctx.fillStyle = '#6cb4ee'; U.roundRect(ctx, D.x0, D.y0 + 14, D.x1 - D.x0, D.y1 - D.y0 - 14, 4); ctx.fill();
    for (let x = D.x0 + 6; x < D.x1 - 10; x += 26) this.puff(ctx, x, D.y1 - 6, 0.55, '#fff');
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, D.x0 + 12, D.y0 - 2, 22, 12, 2); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(D.x0 + 14, D.y0, 18, 7);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(D.x1 - 18, D.y0 + 4, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(D.x1 - 20, D.y0 + 2, 4, 4);   // the stamp
  },
  drawAgent(r, g) {
    const ctx = r.ctx, st = this.st, Ag = CFG.CLOUD_IN.ROOM.AGENT, p = g.player, d = U.dist(p.x, p.y, Ag.x, Ag.y), t = g.time;
    r.drawPerson(Ag.x, Ag.y, { shirt: '#6cb4ee', skin: '#f1c27d', hair: '#e4572e', hairStyle: 0, facing: p.x < Ag.x - 10 ? -1 : 1, moving: false, bob: 0, carry: 0, bowtie: '#ffd166', pants: '#2d3a4a' });
    this.puff(ctx, Ag.x - 7.5, Ag.y - 49, 0.68, '#dceeff'); this.puff(ctx, Ag.x - 7, Ag.y - 50, 0.62, '#fff');   // a little cloud hat
    if (st.agent > 0 || (d < 110 && this.inside(g) && !st.seat)) {
      const text = st.agent > 0 ? 'Have a fluffy flight! ☁️' : 'Where to? ☁️';
      r.drawBubble(Ag.x, Ag.y - 78 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, st.agent > 0 ? 156 : 96);
    }
  },
  // a fluffy cloud suitcase: soft and round, a puffy top, a pastel colour, a little handle
  drawBag(r, x, y, col, s = 1) {
    const ctx = r.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(30,80,140,0.18)'; ctx.fillRect(-11, 6, 24, 4);
    ctx.fillStyle = col; U.roundRect(ctx, -12, -9, 24, 16, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-6, -9, 5, 0, Math.PI * 2); ctx.arc(1, -11, 6, 0, Math.PI * 2); ctx.arc(8, -9, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-4, -10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6cb4ee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -15); ctx.quadraticCurveTo(0, -20, 4, -15); ctx.stroke();
    ctx.restore();
  },
  // live art: the sky in the window, the board's rows, the bags going round
  dynamic(r, g) {
    if (!this.st || !this.inside(g)) return;
    const ctx = r.ctx, R = CFG.CLOUD_IN.ROOM, st = this.st, t = g.time, Wn = R.WINDOW, x0 = Wn.x0, y0 = Wn.y0, w = Wn.x1 - Wn.x0, h = Wn.y1 - Wn.y0;
    ctx.save(); U.roundRect(ctx, x0, y0, w, h, 8); ctx.clip();
    const sky = ctx.createLinearGradient(0, y0, 0, y0 + h); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#d9f0ff'); ctx.fillStyle = sky; ctx.fillRect(x0, y0, w, h);
    ['#ff6b6b', '#ffb347', '#ffe066', '#7bd389', '#6cb4ee', '#a78bfa'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x0 + w * 0.7, y0 + h + 10, 54 - i * 3, Math.PI, 0); ctx.stroke(); });
    for (let i = 0; i < 4; i++) { const cx = x0 + ((((i * 71 + t * 8) % (w + 60)) + w + 60) % (w + 60)) - 40; this.puff(ctx, cx, y0 + 18 + (i % 3) * 16, 0.8 + (i % 2) * 0.3, 'rgba(255,255,255,0.92)'); }
    const bx = x0 + w + 40 - ((t * 12) % (w + 100)), by = y0 + 16 + Math.sin(t * 0.8) * 2;   // the blimp
    ctx.fillStyle = '#cfe3f7'; ctx.beginPath(); ctx.ellipse(bx, by, 18, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(bx - 4, by + 6, 8, 3);
    const k = (t % 10) / 10, px = x0 - 30 + k * (w + 60);   // a little plane gliding in
    if (typeof AirfieldInsideExt !== 'undefined') AirfieldInsideExt.sidePlane(ctx, px, y0 + 20 + k * 30, 0.4, '#3b7dd8', 1, false);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x0 + w * 0.08, y0); ctx.lineTo(x0 + w * 0.2, y0); ctx.lineTo(x0 + w * 0.1, y0 + h); ctx.lineTo(x0 - w * 0.02, y0 + h); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillRect(x0 + w / 2 - 2, y0, 4, h);
    // the departures board
    const B = R.BOARD, C = CFG.CLOUD_IN, chars = 'ABCDEFGHIJKLMNOPRSTUVWZ';
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☁️ FLIGHTS ☁️', (B.x0 + B.x1) / 2, B.y0 + 7);
    st.rows.forEach((row, i) => {
      const y = B.y0 + 21 + i * 12;
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(B.x0 + 4, y - 5, B.x1 - B.x0 - 8, 10);
      let text = row.dest;
      if (row.flip > 0) { const done = Math.floor((1 - row.flip / 0.9) * text.length); text = Array.from(text).map((ch, j) => j < done || ch === ' ' ? ch : chars[(Math.floor(t * 30) + j * 7 + i) % chars.length]).join(''); }
      ctx.font = r.font(7); ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(text, B.x0 + 7, y);
      const [label, col] = C.STATES[row.state]; ctx.textAlign = 'right'; ctx.fillStyle = row.flip > 0 ? '#9aa0a8' : col; ctx.fillText(label, B.x1 - 7, y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(B.x0 + 4, y - 0.5, B.x1 - B.x0 - 8, 1);
    });
    // fluffy bags going round the belt (the chef's, the pink one, is gone while carried)
    const Cr = R.CAROUSEL, bags = [];
    for (let i = 0; i < 6; i++) { if (i === 0 && st.bag > 0) continue; const a = t * 0.5 + i * Math.PI / 3; bags.push({ i, x: Cr.x + Math.cos(a) * (Cr.rx - 15), y: Cr.y + Math.sin(a) * (Cr.ry - 10) }); }
    bags.sort((a, b) => a.y - b.y);
    for (const b of bags) this.drawBag(r, b.x, b.y, C.BAG_COLS[b.i], 0.85);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, R = CFG.CLOUD_IN.ROOM;
    if (st.bag > 0 && !g.driving && !g.onTrain && !g.travel) items.push({ y: p.y + 1, draw: () => { const f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0; this.drawBag(r, p.x - f * 18, p.y - 6 + bob, CFG.CLOUD_IN.BAG_COLS[0], 0.8); } });
    if (!this.inside(g)) return;
    items.push({ y: R.AGENT.y, draw: () => this.drawAgent(r, g) });
    items.push({ y: R.DESK.y1, draw: () => this.drawDesk(r) });
  },
  // looking out of the big window: the sky fills the screen for a few seconds
  drawView(r, g, W, H) {
    const ctx = r.ctx, v = this.st.view, C = CFG.CLOUD_IN, t = g.time, a = Math.max(0, Math.min(1, v.t / 0.3, (C.VIEW - v.t) / 0.3));
    const pw = Math.min(W - 32, 560), ph = Math.min(H - 170, 320), px = W / 2 - pw / 2, py = Math.max(70, H / 2 - ph / 2 - 20);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,50,90,0.5)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, px - 12, py - 12, pw + 24, ph + 24, 40); ctx.fill();
    ctx.save(); U.roundRect(ctx, px, py, pw, ph, 32); ctx.clip();
    const sky = ctx.createLinearGradient(0, py, 0, py + ph); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(1, '#e3f4ff'); ctx.fillStyle = sky; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(px + pw * 0.85, py + 46, 26, 0, Math.PI * 2); ctx.fill();
    ['#ff6b6b', '#ffb347', '#ffe066', '#7bd389', '#6cb4ee', '#a78bfa'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(px + pw * 0.42, py + ph + 40, ph * 0.75 - i * 9, Math.PI, 0); ctx.stroke(); });
    for (let i = 0; i < 6; i++) { const cx = px + (((i * 137 + t * 22) % (pw + 160)) + pw + 160) % (pw + 160) - 80; this.puff(ctx, cx, py + 50 + (i % 3) * 80 + Math.sin(t + i) * 4, 2 + (i % 2), 'rgba(255,255,255,0.93)'); }
    // a cloud island with a tiny runway, and a plane gliding down onto it
    this.puff(ctx, px + pw * 0.08, py + ph - 26, 4, '#fff'); this.puff(ctx, px + pw * 0.24, py + ph - 20, 3.4, '#fff');
    ctx.fillStyle = '#8d94a3'; ctx.fillRect(px + pw * 0.1, py + ph - 36, pw * 0.3, 10); ctx.fillStyle = '#fff'; for (let x = px + pw * 0.1 + 6; x < px + pw * 0.4 - 10; x += 18) ctx.fillRect(x, py + ph - 32, 9, 2);
    const k = (v.t % C.VIEW) / C.VIEW, lx = px + pw * 0.75 - k * pw * 0.45, ly = py + ph * 0.35 + k * (ph * 0.65 - 44);
    if (typeof AirfieldInsideExt !== 'undefined') AirfieldInsideExt.sidePlane(ctx, lx, ly, 1.3, '#f2b134', -1, false);
    // a few balloons drifting up
    for (let i = 0; i < 3; i++) { const bx = px + pw * (0.2 + i * 0.28) + Math.sin(t * 0.7 + i) * 18, by = py + ph + 40 - ((t * 30 + i * 110) % (ph + 120)), col = ['#e4572e', '#ffd166', '#41b883'][i]; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by, 16, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 8, by + 16); ctx.lineTo(bx - 4, by + 30); ctx.moveTo(bx + 8, by + 16); ctx.lineTo(bx + 4, by + 30); ctx.stroke(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(bx - 5, by + 29, 10, 7); }
    ctx.restore();
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, W / 2 - 110, py + ph + 22, 220, 30, 10); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☁️ What a sky! 🌈', W / 2, py + ph + 37);
    ctx.restore();
  },
  screen(r, g) {
    if (!this.st || g.travel) return;
    const st = this.st, ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (this.inside(g) && st.view) this.drawView(r, g, W, H);
    const a = st.fade > 0 ? st.fade / CFG.CLOUD_IN.FADE : 0;
    if (a > 0) { ctx.fillStyle = `rgba(20,40,70,${Math.min(1, a).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
};
Game.ext.unshift(CloudInsideExt);   // first in line so the door's button and hint beat Cloud Harbor's own
Render.ext.push(CloudInsideExt);
