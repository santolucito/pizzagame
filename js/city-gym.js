'use strict';
// The gym: City building 11 (middle row, facing Market Street) gets a '🏋️ GYM' sign and a blue rubber mat by the door.
// Step inside for a bright kids' gym: a treadmill you hop on (the belt rolls and the chef runs on the spot), a trampoline
// (three big bounces), a climbing wall whose coloured holds light up as you climb to the bell at the top, a punching bag
// that wobbles when you bump it, foam blocks to walk around, a coach with a whistle who cheers you on, a water fountain,
// a $5 sweatband the chef wears for half a minute and an $8 medal wall picture.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.GYM = {
  BUILDING: 11,                                  // index in CFG.CITY.BUILDINGS: { x0: 5212, y0: 190, x1: 5330, y1: 456 }
  DOOR_OUT: { x: 5271, y: 470 },                 // on the sidewalk just below the door
  DOOR_R: 20, HINT_R: 60,                        // tight: tests/cases/08-taxi.js hails a taxi 21 px away at (5250, 470)
  WORLD: { x0: 8600, y0: 3000, x1: 9200, y1: 3400 },
  ROOM: { x0: 8640, y0: 3112, x1: 9160, y1: 3350 }, WALL: 24, BACK_TOP: 3008,   // the tall back wall holds the climbing wall and the medal picture
  CLIMB: { x0: 8658, y0: 3016, x1: 8754, y1: 3112, base: { x: 8706, y: 3126 }, top: 3060 },   // the chef climbs from the base to `top`
  BELL: { x: 8706, y: 3018 },
  COACH_HOME: { x: 8900, y: 3140 },
  TREAD: { x: 8820, y: 3200 },                   // the middle of the belt; the console sits above it
  TRAMP: { x: 8990, y: 3215, r: 40 },
  BAG: { x: 8700, y: 3262 },                     // where the bag's stand touches the floor (the bag hangs above it)
  FOAM: [{ x: 8768, y: 3296, c: '#ffd166' }, { x: 8800, y: 3318, c: '#41b883' }, { x: 9060, y: 3312, c: '#3b7dd8' }, { x: 9096, y: 3290, c: '#ff8fab' }],
  FOUNTAIN: { x: 9136, y: 3236 },                // against the right wall
  MEDALS: { x0: 9040, y0: 3022, x1: 9140, y1: 3100 },
  PADS: { band: { x: 8990, y: 3302 }, medal: { x: 9090, y: 3152 } },
  EXIT: { x: 8900, y: 3332 },                    // the mat inside the door (the door is in the bottom wall)
  CLIMB_T: 2.6, BOUNCE_T: 0.62, BOUNCES: 3, BAND: 30, CHEER: 2.2,   // seconds (and the number of bounces)
};
CFG.AREAS.gym = { WORLD: CFG.GYM.WORLD };

const GymExt = {
  name: 'gym',
  st: null,
  defaults: { gym: { seen: false, runs: 0, bounces: 0, climbs: 0, drinks: 0, bands: 0, medals: false } },

  // ---------- state ----------
  build(g) {
    const G = CFG.GYM;
    if (!g.s.gym) g.s.gym = { seen: false, runs: 0, bounces: 0, climbs: 0, drinks: 0, bands: 0, medals: false };
    this.st = {
      fade: 0,
      run: null,                                 // { t, zoom } on the treadmill
      bounce: null,                              // { t } on the trampoline
      climb: null,                               // { t, done, down } on the wall
      belt: 0, wobble: 0, wobT: 0, bell: 0, drink: 0, band: 0, cheer: 0, coachBob: 0,
      coach: { x: G.COACH_HOME.x, y: G.COACH_HOME.y, facing: 1 },
      obs: null,
    };
    const R = G.ROOM, w = G.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: G.TREAD.x - 26, y: G.TREAD.y - 46, w: 52, h: 16 });                  // the treadmill's console; the belt is walkable
    o.push({ x: G.BAG.x - 12, y: G.BAG.y - 14, w: 24, h: 18 });                       // the punching bag's stand
    for (const f of G.FOAM) o.push({ x: f.x - 14, y: f.y - 14, w: 28, h: 28 });
    o.push({ x: G.FOUNTAIN.x - 14, y: G.FOUNTAIN.y - 16, w: 28, h: 26 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'gym' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.GYM.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.GYM.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < CFG.GYM.DOOR_R; },
  busy() { const st = this.st; return !!(st.run || st.bounce || st.climb); },
  near(g, pt, r) { const p = g.player; return U.dist(p.x, p.y, pt.x, pt.y) < r; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const G = CFG.GYM, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'gym') return null;
    if (st.run) return { label: '🚶 Hop off', run: (gg) => this.hopOff(gg) };
    if (st.bounce || st.climb) return null;                                           // mid-bounce or mid-climb: just watch
    if (this.near(g, G.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, G.TREAD, 32)) return { label: '🏃 Hop on', run: (gg) => this.hopOn(gg) };
    if (this.near(g, G.TRAMP, G.TRAMP.r + 6)) return { label: '🤸 Bounce!', run: (gg) => this.startBounce(gg) };
    if (this.near(g, G.CLIMB.base, 30)) return { label: '🧗 Climb up', run: (gg) => this.startClimb(gg) };
    if (this.near(g, G.FOUNTAIN, 40)) return { label: '💧 Drink', run: (gg) => this.drink(gg) };
    return null;
  },
  enter(g) {
    const G = CFG.GYM, p = g.player;
    g.area = 'gym'; p.x = G.EXIT.x; p.y = G.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.gym.seen) { g.s.gym.seen = true; g.toast('🏋️ Welcome to the gym!', true); }
  },
  leave(g) {
    const G = CFG.GYM, p = g.player;
    g.area = 'city'; p.x = G.DOOR_OUT.x; p.y = G.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.stop(g); this.st.fade = 0.45; Sfx.drop();
  },
  stop(g) { const st = this.st; st.run = null; st.bounce = null; st.climb = null; st.cheer = 0; },
  cheer(g) { this.st.cheer = CFG.GYM.CHEER; },
  hopOn(g) {
    const T = CFG.GYM.TREAD, p = g.player;
    this.st.run = { t: 0, zoom: 0 }; p.x = T.x; p.y = T.y + 6; p.moving = false; p.facing = 1;
    g.s.gym.runs++; this.cheer(g); this.zoom(g); Sfx.pickup(); Haptics.tap();
  },
  hopOff(g) {
    const T = CFG.GYM.TREAD, p = g.player; if (!this.st.run) return;
    this.st.run = null; p.x = T.x; p.y = T.y + 36; p.moving = false; Sfx.drop();
  },
  zoom(g) { const p = g.player; g.floats.push({ x: p.x, y: p.y - 70, text: 'Zoom!', color: '#ffe08a', t: 0, dur: 1.2, big: true }); },
  startBounce(g) {
    const T = CFG.GYM.TRAMP, p = g.player;
    this.st.bounce = { t: 0, n: 0 }; p.x = T.x; p.y = T.y; p.moving = false;
    g.s.gym.bounces++; this.cheer(g); Sfx.whistle(); Haptics.tap();
  },
  startClimb(g) {
    const C = CFG.GYM.CLIMB, p = g.player;
    this.st.climb = { t: 0, done: false }; p.x = C.base.x; p.y = C.base.y; p.moving = false; p.facing = 1;
    this.cheer(g); Sfx.pickup(); Haptics.tap();
  },
  drink(g) {
    const p = g.player; this.st.drink = 1.4; g.s.gym.drinks++; p.facing = 1;
    g.floats.push({ x: p.x, y: p.y - 66, text: 'Glug glug 💧', color: '#9fd8ff', t: 0, dur: 1.5, big: true });
    Sfx.drop(); Haptics.tap();
  },
  home(g) { if (!this.st) return; this.stop(g); this.st.fade = 0; this.st.drink = 0; },
  // a save or a push that left the chef in a wall or inside the equipment goes back onto the door mat
  rescue(g) {
    const p = g.player, G = CFG.GYM;
    if (this.busy() || this.free(p.x, p.y)) return false;
    this.stop(g); p.x = G.EXIT.x; p.y = G.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  // how high the chef is right now (trampoline bounces and the climb lift the drawn chef)
  bounceHeight() {
    const b = this.st.bounce; if (!b) return 0;
    const ph = (b.t % CFG.GYM.BOUNCE_T) / CFG.GYM.BOUNCE_T;
    return Math.sin(ph * Math.PI) * 64;
  },
  climbFrac() {
    const c = this.st.climb; if (!c) return 0;
    return c.done ? Math.max(0, 1 - (c.t - CFG.GYM.CLIMB_T - 0.6) / 0.5) : U.clamp(c.t / CFG.GYM.CLIMB_T, 0, 1);
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, G = CFG.GYM, s = g.s.gym;
    st.fade = Math.max(0, st.fade - dt);
    st.band = Math.max(0, st.band - dt);
    if (g.area !== 'gym') { if (this.busy()) this.stop(g); return; }
    st.cheer = Math.max(0, st.cheer - dt); st.drink = Math.max(0, st.drink - dt); st.bell = Math.max(0, st.bell - dt);
    st.coachBob = st.cheer > 0 ? st.coachBob + dt * 16 : 0;
    if (st.run) {
      // on the treadmill: the belt rolls, the chef runs on the spot and stays put
      const r = st.run; r.t += dt; r.zoom += dt; st.belt = (st.belt + dt * 160) % 24;
      p.x = G.TREAD.x; p.y = G.TREAD.y + 6; p.moving = true; p.facing = 1; p.bob += dt * 18;
      if (r.zoom > 1.8) { r.zoom = 0; this.zoom(g); }
      if (r.t > 1.5 && st.cheer <= 0 && Math.floor(r.t) % 6 === 0) this.cheer(g);
    } else if (st.bounce) {
      // three big bounces: the chef is pinned to the trampoline and lifted into the air by bounceHeight()
      const b = st.bounce; const was = Math.floor(b.t / G.BOUNCE_T); b.t += dt; const now = Math.floor(b.t / G.BOUNCE_T);
      p.x = G.TRAMP.x; p.moving = false;
      if (now > was && now < G.BOUNCES) g.floats.push({ x: p.x, y: p.y - 80, text: 'Boing!', color: '#ffe08a', t: 0, dur: 1, big: true });
      if (b.t === dt) g.floats.push({ x: p.x, y: p.y - 80, text: 'Boing!', color: '#ffe08a', t: 0, dur: 1, big: true });
      p.y = G.TRAMP.y - (now >= G.BOUNCES ? 0 : this.bounceHeight());   // the chef is lifted into the air; the shadow stays on the mat
      if (now >= G.BOUNCES) { st.bounce = null; for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-20, 20), y0: p.y - 40 + U.rand(-10, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 }); Haptics.success(); }
    } else if (st.climb) {
      // climbing: the chef rises along the wall, the holds light up behind, the bell rings at the top, then a hop down
      const c = st.climb; c.t += dt; p.moving = false; p.facing = 1;
      const C = G.CLIMB, k = this.climbFrac();
      p.x = C.base.x + Math.sin(k * Math.PI * 3) * 10; p.y = C.base.y - (C.base.y - C.top) * k;
      if (!c.done && c.t >= G.CLIMB_T) {
        c.done = true; st.bell = 1.2; s.climbs++; Sfx.ding(); Haptics.success();
        g.floats.push({ x: p.x, y: p.y - 70, text: 'Ding! Top! 🔔', color: '#ffe08a', t: 0, dur: 1.5, big: true });
        for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: G.BELL.x + U.rand(-14, 14), y0: G.BELL.y + U.rand(-6, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 });
      }
      if (c.done && c.t >= G.CLIMB_T + 1.1) { st.climb = null; p.x = C.base.x; p.y = C.base.y; }
    } else {
      this.rescue(g);
      // bumping the punching bag sets it wobbling
      const B = G.BAG, d = U.dist(p.x, p.y, B.x, B.y - 4);
      if (d < 34 && p.moving) { if (st.wobble < 0.5) Sfx.drop(); st.wobble = 1; st.wobT = 0; }
    }
    if (st.wobble > 0) { st.wobT += dt; st.wobble = Math.max(0, st.wobble - dt * 0.45); }
    // the coach stands by the back wall and turns to watch the chef
    st.coach.facing = p.x < st.coach.x - 4 ? -1 : 1;
  },
  pads(g) {
    if (g.area !== 'gym') return [];
    const P = CFG.GYM.PADS;
    return [
      { key: 'gymBand', label: 'Sweatband', ico: '💪', pos: P.band, price: 5, sub: 'sporty!' },
      { key: 'gymMedal', label: 'Medal wall', ico: '🏅', pos: P.medal, price: 8, maxed: !!g.s.gym.medals, sub: g.s.gym.medals ? 'champion!' : 'picture' },
    ];
  },
  onPad(g, pad) {
    const p = g.player;
    if (pad.key === 'gymBand') {
      this.st.band = CFG.GYM.BAND; g.s.gym.bands++;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Sweatband on! 💪', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      Haptics.success();
    } else if (pad.key === 'gymMedal') {
      g.s.gym.medals = true;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Medals! 🏅', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: U.rand(CFG.GYM.MEDALS.x0, CFG.GYM.MEDALS.x1), y0: U.rand(CFG.GYM.MEDALS.y0, CFG.GYM.MEDALS.y1), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
      Sfx.unlock(); Haptics.success();
    }
  },
  bgKey(g) { return g.s && g.s.gym && g.s.gym.medals ? 'gym1' : 'gym0'; },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, G = CFG.GYM, st = this.st, s = g.s.gym;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, G.DOOR_OUT.x, G.DOOR_OUT.y);
      if (d < G.HINT_R) return { text: 'Work out at the gym! 🏋️', target: d < G.DOOR_R ? null : G.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'gym') return undefined;
    if (st.run) return { text: 'Run run run! 🏃', target: null };
    if (st.bounce) return { text: 'Boing boing boing! 🤸', target: null };
    if (st.climb) return { text: st.climb.done ? 'You rang the bell! 🔔' : 'Up up up! 🧗', target: null };
    if (!s.runs) return { text: 'Hop on the treadmill! 🏃', target: G.TREAD };
    if (!s.bounces) return { text: 'Jump on the trampoline! 🤸', target: G.TRAMP };
    if (!s.climbs) return { text: 'Climb up to the bell! 🧗', target: G.CLIMB.base };
    if (!s.drinks) return { text: 'Have a drink of water! 💧', target: G.FOUNTAIN };
    if (!s.bands && g.s.cash + (g.s.padPaid.gymBand || 0) >= 5) return { text: 'Buy a sweatband! 💪', target: G.PADS.band };
    if (!s.medals && g.s.cash + (g.s.padPaid.gymMedal || 0) >= 8) return { text: 'Get a medal wall! 🏅', target: G.PADS.medal };
    if (st.band > 0) return { text: 'Looking sporty! 💪', target: null };
    return { text: 'Strong chef! 💪', target: null };
  },

  // ---------- the City outside: the sign and the door mat (static) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.GYM.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🏋️ GYM';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // a dumbbell in each shop window
    for (const wx of [b.x0 + 10 + (cx - 22 - b.x0) / 2, cx + 12 + (b.x1 - 10 - cx - 12) / 2]) this.drawDumbbell(r, wx, gy + 22, 0.7, '#2d3a4a');
    // a blue rubber mat on the sidewalk in front of the door
    const D = CFG.GYM.DOOR_OUT;
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, D.x - 16, D.y - 6, 32, 11, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 4; i++) ctx.fillRect(D.x - 13 + i * 8, D.y - 4, 4, 7);
  },
  drawDumbbell(r, x, y, sc, col) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-12, -2, 24, 4);
    ctx.fillStyle = col; U.roundRect(ctx, -18, -7, 7, 14, 2); ctx.fill(); U.roundRect(ctx, 11, -7, 7, 14, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-17, -6, 2, 12); ctx.fillRect(12, -6, 2, 12);
    ctx.restore();
  },

  // ---------- the interior, static ----------
  paint: { gym(r, g) { GymExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, G = CFG.GYM, W = G.WORLD, R = G.ROOM, w = G.WALL;
    // outside the gym: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, G.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - G.BACK_TOP);
    // springy blue floor with a running track painted along the bottom and a big centre circle
    ctx.fillStyle = '#5aa9e6'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = R.y0; y < R.y1; y += 30) for (let x = R.x0 + ((y / 30) % 2) * 15; x < R.x1; x += 30) ctx.fillRect(x, y, 28, 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2 + 10, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(R.x0 + 8, R.y1 - 14); ctx.lineTo(R.x1 - 8, R.y1 - 14); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(R.x0, R.y1 - 22, R.x1 - R.x0, 3); ctx.fillRect(R.x0, R.y1 - 6, R.x1 - R.x0, 3);
    // walls: a tall cream back wall with a bright stripe; padded side and bottom walls
    ctx.fillStyle = '#fff3d6'; ctx.fillRect(R.x0 - w, G.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - G.BACK_TOP);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#e4572e', '#ffd166', '#41b883'][i]; ctx.fillRect(R.x0 - w, G.BACK_TOP + i * 3, R.x1 - R.x0 + 2 * w, 3); }
    ctx.fillStyle = '#ffd166'; ctx.fillRect(R.x0 - w, R.y0 - 26, R.x1 - R.x0 + 2 * w, 8);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(R.x0 - w, R.y0 - 18, R.x1 - R.x0 + 2 * w, 4);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 20) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 20) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the climbing wall: a green board with a row of holds (the holds light up live) and the bell at the top
    const C = G.CLIMB;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 4, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#41b883'; ctx.fillRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = C.y0; y < C.y1; y += 16) ctx.fillRect(C.x0, y, C.x1 - C.x0, 2);
    ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 3; ctx.strokeRect(C.x0 + 1.5, C.y0 + 1.5, C.x1 - C.x0 - 3, C.y1 - C.y0 - 3);
    // the bell's bracket
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(G.BELL.x - 12, G.BELL.y - 4, 24, 4);
    // the medal wall: a big gold frame; the medals appear once the picture is bought
    const M = G.MEDALS, owned = g.s && g.s.gym && g.s.gym.medals;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(M.x0 + 4, M.y0 + 4, M.x1 - M.x0, M.y1 - M.y0);
    ctx.fillStyle = owned ? '#e0b44c' : '#c9ccd2'; U.roundRect(ctx, M.x0 - 4, M.y0 - 4, M.x1 - M.x0 + 8, M.y1 - M.y0 + 8, 5); ctx.fill();
    ctx.fillStyle = owned ? '#2d3a4a' : '#fff8ee'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    if (owned) {
      const cols = ['#ffd166', '#c9ccd2', '#cd7f32', '#ffd166', '#c9ccd2', '#cd7f32'];
      for (let i = 0; i < 6; i++) {
        const mx = M.x0 + 18 + (i % 3) * 32, my = M.y0 + 22 + Math.floor(i / 3) * 36;
        ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883'][i % 3]; ctx.beginPath(); ctx.moveTo(mx - 6, my - 18); ctx.lineTo(mx + 6, my - 18); ctx.lineTo(mx + 2, my - 4); ctx.lineTo(mx - 2, my - 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(mx, my + 2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(mx, my + 2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(mx - 2.5, my - 0.5, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CHAMPION 🏅', (M.x0 + M.x1) / 2, M.y1 - 8);
    } else {
      ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(M.x0 + 8, M.y0 + 8, M.x1 - M.x0 - 16, M.y1 - M.y0 - 16); ctx.setLineDash([]);
      ctx.fillStyle = '#c9ccd2'; ctx.font = r.font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏅', (M.x0 + M.x1) / 2, (M.y0 + M.y1) / 2);
    }
    // a motivating poster next to the climbing wall
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, 8772, G.BACK_TOP + 20, 70, 40, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GO GO GO!', 8807, G.BACK_TOP + 34); ctx.font = r.font(12); ctx.fillText('💪', 8807, G.BACK_TOP + 50);
    // a rack of dumbbells on the back wall between the poster and the medals
    ctx.fillStyle = '#5c6670'; ctx.fillRect(8856, G.BACK_TOP + 72, 170, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(8856, G.BACK_TOP + 77, 170, 2);
    ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#8e5bd1'].forEach((c, i) => this.drawDumbbell(r, 8876 + i * 33, G.BACK_TOP + 64, 0.8, c));
    // the treadmill's deck (the belt rolls live) and console
    const T = G.TREAD;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, T.x - 22, T.y - 42 + 4, 50, 72, 6); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, T.x - 26, T.y - 30, 52, 62, 6); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, T.x - 28, T.y - 46, 56, 16, 5); ctx.fill();   // console
    ctx.fillStyle = '#8ef0a0'; ctx.fillRect(T.x - 12, T.y - 42, 24, 6); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(T.x + 18, T.y - 39, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(T.x - 18, T.y - 39, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x - 27, T.y - 32, 5, 40); ctx.fillRect(T.x + 22, T.y - 32, 5, 40);   // handrails
    // the trampoline: legs and the rim (the mat and the chef's shadow are live)
    const P = G.TRAMP;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(P.x + 3, P.y + 8, P.r + 6, P.r * 0.62 + 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; for (const d of [-1, 1]) { ctx.fillRect(P.x + d * (P.r - 8) - 3, P.y + 6, 6, 14); ctx.fillRect(P.x + d * 12 - 3, P.y + 14, 6, 10); }
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.r + 4, P.r * 0.62 + 3, 0, 0, Math.PI * 2); ctx.fill();
    // the punching bag's stand base
    const B = G.BAG;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(B.x + 2, B.y + 2, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.ellipse(B.x, B.y, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(B.x + 14, B.y - 92, 5, 92); ctx.fillRect(B.x - 2, B.y - 94, 21, 5);   // the pole and the arm the bag hangs from
    // foam blocks
    for (const f of G.FOAM) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(f.x - 12, f.y - 10, 28, 26);
      ctx.fillStyle = f.c; U.roundRect(ctx, f.x - 14, f.y - 14, 28, 28, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(f.x - 10, f.y - 10, 20, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(f.x - 10, f.y + 6, 20, 4);
    }
    // the water fountain against the right wall (the splash is live)
    const F = G.FOUNTAIN;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(F.x - 10, F.y - 12, 28, 26);
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, F.x - 14, F.y - 16, 28, 26, 5); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, F.x - 11, F.y - 30, 22, 16, 4); ctx.fill();
    ctx.fillStyle = '#dff3ff'; U.roundRect(ctx, F.x - 8, F.y - 27, 16, 10, 3); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(F.x - 3, F.y - 34, 4, 6);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(F.x + 8, F.y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
    // the door in the bottom wall, its mat and the gym's name plate below
    const E = G.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, E.x - 21, E.y - 8, 42, 14, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 5; i++) ctx.fillRect(E.x - 18 + i * 8, E.y - 6, 4, 10);
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 40, R.y1 + w + 4, 80, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🏋️ GYM 🏋️', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the gym's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.GYM.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawHolds(r, g) {
    const ctx = r.ctx, C = CFG.GYM.CLIMB, st = this.st, t = g.time, k = this.climbFrac(), lit = st.climb ? k : 0;
    const cols = ['#e4572e', '#ffd166', '#ff8fab', '#8e5bd1', '#3b7dd8', '#fff'];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), hx = C.x0 + 18 + ((i * 37) % (C.x1 - C.x0 - 36)), hy = C.y1 - 10 - f * (C.y1 - C.y0 - 24), on = st.climb && f <= lit + 0.02;
      if (on) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(hx, hy, 10 + Math.sin(t * 8 + i) * 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.ellipse(hx, hy, 6, 4.5, (i % 3) * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(hx - 1.5, hy - 1.5, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the bell swings and shines when rung
    const B = CFG.GYM.BELL, ring = st.bell > 0 ? Math.sin(t * 30) * 0.4 * st.bell : 0;
    ctx.save(); ctx.translate(B.x, B.y); ctx.rotate(ring);
    if (st.bell > 0) { ctx.fillStyle = `rgba(255,224,138,${(st.bell * 0.5).toFixed(2)})`; ctx.beginPath(); ctx.arc(0, 8, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.moveTo(-8, 12); ctx.quadraticCurveTo(-8, 0, 0, 0); ctx.quadraticCurveTo(8, 0, 8, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b8862c'; ctx.fillRect(-9, 11, 18, 3); ctx.beginPath(); ctx.arc(0, 15, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawBelt(r, g) {
    const ctx = r.ctx, T = CFG.GYM.TREAD, st = this.st;
    ctx.save(); ctx.beginPath(); ctx.rect(T.x - 22, T.y - 26, 44, 54); ctx.clip();
    ctx.fillStyle = '#2b2f3a'; ctx.fillRect(T.x - 22, T.y - 26, 44, 54);
    ctx.fillStyle = '#4a5160'; for (let y = T.y - 26 - 24 + st.belt; y < T.y + 30; y += 12) ctx.fillRect(T.x - 22, y, 44, 5);
    ctx.restore();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; ctx.strokeRect(T.x - 22, T.y - 26, 44, 54);
  },
  drawTramp(r, g) {
    const ctx = r.ctx, P = CFG.GYM.TRAMP, b = this.st.bounce, h = this.bounceHeight();
    // the mat dips when the chef lands and the shadow grows when the chef is high up
    const dip = b ? Math.max(0, 1 - h / 20) * 4 : 0;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(P.x, P.y + dip, P.r - 6, (P.r - 6) * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(P.x, P.y + dip, P.r - 16, (P.r - 16) * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) { ctx.beginPath(); ctx.moveTo(P.x + Math.cos(a) * (P.r - 6), P.y + dip + Math.sin(a) * (P.r - 6) * 0.62); ctx.lineTo(P.x + Math.cos(a) * (P.r + 2), P.y + Math.sin(a) * (P.r + 2) * 0.62); ctx.stroke(); }
    if (b) { const sc = 1 + h / 60; ctx.fillStyle = `rgba(0,0,0,${(0.3 - h / 400).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(P.x, P.y + 4, 16 * sc, 7 * sc, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  drawBag(r, g) {
    const ctx = r.ctx, B = CFG.GYM.BAG, st = this.st, a = st.wobble > 0 ? Math.sin(st.wobT * 9) * 0.35 * st.wobble : 0;
    ctx.save(); ctx.translate(B.x + 6, B.y - 90); ctx.rotate(a);
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke();   // chain
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, -11, 17, 26, 60, 10); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -13, 14, 26, 60, 10); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-13, 22, 26, 5); ctx.fillRect(-13, 62, 26, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-9, 30, 5, 28);
    ctx.fillStyle = '#ffd166'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💥', 0, 45);
    ctx.restore();
  },
  drawFountain(r, g) {
    const ctx = r.ctx, F = CFG.GYM.FOUNTAIN, st = this.st, t = g.time;
    if (st.drink <= 0) return;
    // an arc of water and a couple of drops while the chef drinks
    ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(F.x - 1, F.y - 34); ctx.quadraticCurveTo(F.x - 10, F.y - 48, F.x - 18, F.y - 36); ctx.stroke();
    for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; ctx.fillStyle = `rgba(159,216,255,${(1 - ph).toFixed(2)})`; ctx.beginPath(); ctx.arc(F.x - 14 - k * 4, F.y - 40 + ph * 16, 2, 0, Math.PI * 2); ctx.fill(); }
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'gym') return;
    this.drawOutside(r, g);
    this.drawHolds(r, g);
    this.drawBelt(r, g);
    this.drawTramp(r, g);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, G = CFG.GYM;
    if (st.band > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawBand(r, g) });
    if (g.area !== 'gym') return;
    items.push({ y: G.BAG.y, draw: () => this.drawBag(r, g) });
    items.push({ y: st.coach.y, draw: () => this.drawCoach(r, g) });
    items.push({ y: G.FOUNTAIN.y + 20, draw: () => this.drawFountain(r, g) });
  },
  drawBand(r, g) {
    const p = g.player;
    this.drawBandAt(r, p.x, p.y, p.moving ? Math.sin(p.bob || 0) * 2 : 0);
  },
  // the sweatband: a red band with a white stripe hugging the head just under the hat
  drawBandAt(r, x, y, bob) {
    const ctx = r.ctx;
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 11, y - 47 + bob, 22, 5.5, 2.5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 9, y - 45 + bob, 18, 1.5);
  },
  drawCoach(r, g) {
    const ctx = r.ctx, c = this.st.coach, st = this.st, t = g.time, jump = st.cheer > 0 ? Math.abs(Math.sin(st.coachBob)) * 8 : 0;
    r.drawPerson(c.x, c.y - jump, { shirt: '#e4572e', stripes: true, skin: '#e0ac69', hat: 'cap', capColor: '#2d3a4a', facing: c.facing, moving: st.cheer > 0, bob: st.coachBob, carry: 0, pants: '#2d3a4a' });
    // the whistle on a lanyard
    const wy = c.y - jump - 20 + (st.cheer > 0 ? Math.sin(st.coachBob) * 2 : 0);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(c.x - 5, c.y - jump - 30); ctx.lineTo(c.x, wy); ctx.lineTo(c.x + 5, c.y - jump - 30); ctx.stroke();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, c.x - 4, wy, 8, 5, 2); ctx.fill(); ctx.fillStyle = '#e0b44c'; ctx.fillRect(c.x + 3, wy + 1, 4, 2.5);
    if (st.cheer > 0) {
      r.drawBubble(c.x, c.y - jump - 72 + Math.sin(t * 6) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Go go go! 💪', 0, 0); }, 104);
    }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(GymExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(GymExt);
