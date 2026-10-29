'use strict';
// Pizza Moon: where the finished rocket from Rocket Island flies (js/rocket.js owns the rocket, its launch, landing
// and the flight cut-scene; this file is the place itself). A cheese-yellow moon covered in craters, with
// pepperoni-red rocks, a black starry sky along the top edge and the Earth hanging in it.
//   - The rocket lands on its pad; standing at its hatch offers '🚪 Go inside the rocket' (the same three decks as on
//     Rocket Island, js/rocketinside.js; its flight deck's '🚀 Fly home' flies back to Rocket Island). Without that file
//     the hatch offers '🚀 Fly home' straight away.
//   - Craters: walk into one and the chef bounces right up out of it, "Boing!" (the button bounces again).
//   - A flag kit on a little hill: '🚩 Plant the flag' (saved; it waves there from then on).
//   - A friendly little alien by its parked saucer waves (a hop and a 👋 bubble) and hands out a free moon pizza
//     that the chef carries for 30 s.
//   - A moon buggy (vehicle kind 'buggy') to drive around; it stays on the moon.
// Map: CFG.AREAS.moon, the rectangle 0..2000 × 5000..6200 (free; nothing else uses it).
// Extension module: registered first in Game.ext (after js/rocket.js) and in Render.ext.

CFG.MOON = {
  WORLD: { x0: 0, y0: 5000, x1: 2000, y1: 6200 },
  SKY_H: 176,                                  // the black starry strip along the top edge (not walkable)
  BASE: { x: 420, y: 5430 },                   // the rocket's feet on its pad
  PAD: { x0: 300, y0: 5300, x1: 540, y1: 5520 },
  DOOR: { x: 420, y: 5474 },                   // where the chef steps out (and asks to fly home)
  DOOR_R: 50,
  SIGN: { x: 620, y: 5600 },
  FLAG: { x: 880, y: 5372 }, FLAG_R: 48,
  CRATERS: [
    { x: 770, y: 5610, rx: 66, ry: 32 }, { x: 1130, y: 5440, rx: 56, ry: 27 }, { x: 1190, y: 5960, rx: 84, ry: 40 },
    { x: 380, y: 5980, rx: 60, ry: 29 }, { x: 1770, y: 5560, rx: 64, ry: 30 }, { x: 1640, y: 6060, rx: 52, ry: 25 },
  ],
  // pepperoni rocks: [x, y, r, solid]
  ROCKS: [[640, 5250, 26, 1], [990, 5790, 22, 1], [1360, 5320, 30, 1], [1880, 5300, 20, 0], [190, 5420, 18, 0], [1900, 5900, 28, 1],
    [150, 6120, 22, 0], [1460, 6110, 24, 1], [880, 6090, 16, 0], [1250, 5650, 14, 0], [120, 5700, 24, 1], [1600, 5420, 15, 0]],
  ALIEN: { x: 1420, y: 5800, range: 46 }, ALIEN_R: 64, WAVE_R: 130,
  SAUCER: { x: 1550, y: 5760 },
  BUGGY: { x: 700, y: 5860 },
  EARTH: { x: 590, y: 5080, r: 44 },
  TREAT: 30,                                   // seconds the moon pizza is carried
  BOING: { dur: 1.0, h: 84 },
};
CFG.AREAS.moon = { WORLD: CFG.MOON.WORLD, noSky: true };
CFG.VEHICLES.buggy = { speed: 250, radius: 22, label: '🚙 Drive', exit: '🚶 Hop out' };

const MoonExt = {
  name: 'moon',
  defaults: { moon: { seen: false, flag: false, pizzas: 0, drove: false, boings: 0 } },
  st: null,   // runtime: the buggy, the alien, a bounce in progress, the moon pizza in hand, dust, obstacles

  // ---------- state ----------
  build(g) {
    if (!g.s.moon) g.s.moon = JSON.parse(JSON.stringify(this.defaults.moon));
    const M = CFG.MOON, B = M.BASE, S = M.SAUCER;
    this.st = {
      buggy: { kind: 'buggy', x: M.BUGGY.x, y: M.BUGGY.y, angle: 0, vx: 0, vy: 0 },
      alien: { x: M.ALIEN.x, y: M.ALIEN.y, dir: 1, facing: -1, moving: false, bob: 0, pause: 1, wave: 0, waveCd: 0, hop: 0, say: null },
      boing: null, crater: -1, treat: null, dust: [], dustT: 0, bumpCd: 0,
      shoot: { t: -4, x: 0, y: 0 },
    };
    const o = [
      { x: M.WORLD.x0, y: M.WORLD.y0, w: M.WORLD.x1 - M.WORLD.x0, h: M.SKY_H + 8 },   // the sky
      { x: B.x - 30, y: B.y - 32, w: 60, h: 38 },                                       // the rocket's feet
      { x: S.x - 44, y: S.y - 14, w: 88, h: 26 },                                       // the alien's saucer
    ];
    for (const [x, y, r, solid] of M.ROCKS) if (solid) o.push({ x: x - r * 0.75, y: y - r * 0.5, w: r * 1.5, h: r * 0.85 });
    this.st.obs = o;
  },
  rocketBusy() { return typeof RocketExt !== 'undefined' && RocketExt.st && RocketExt.st.fly; },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && !this.rocketBusy() && !(this.st && this.st.boing); },
  craterAt(x, y) { const C = CFG.MOON.CRATERS; for (let i = 0; i < C.length; i++) { const c = C[i], dx = (x - c.x) / c.rx, dy = (y - c.y) / c.ry; if (dx * dx + dy * dy < 0.5) return i; } return -1; },
  nearDoor(g) { const D = CFG.MOON.DOOR, p = g.player; return U.dist(p.x, p.y, D.x, D.y) < CFG.MOON.DOOR_R; },
  nearFlag(g) { const F = CFG.MOON.FLAG, p = g.player; return U.dist(p.x, p.y, F.x, F.y + 20) < CFG.MOON.FLAG_R; },
  nearAlien(g) { const a = this.st.alien, p = g.player; return U.dist(p.x, p.y, a.x, a.y) < CFG.MOON.ALIEN_R; },
  free(g, x, y) { const W = CFG.MOON.WORLD; if (x < W.x0 + 16 || x > W.x1 - 16 || y < W.y0 + 16 || y > W.y1 - 16) return false; return !this.st.obs.some((o) => g.hitRect(x, y, 12, o)); },

  // ---------- game hooks ----------
  obstacles(g, forCar) { return g.area === 'moon' && this.st ? this.st.obs : []; },
  vehicles(g) { return this.st ? [this.st.buggy] : []; },
  action(g) {
    if (!this.st || g.area !== 'moon' || !this.onFoot(g)) return null;
    if (this.nearDoor(g)) {
      if (RocketExt.hasInside()) return { label: '🚪 Go inside the rocket', run: (gg) => RocketInsideExt.enter(gg, 'moon') };
      return { label: '🚀 Fly home', run: (gg) => RocketExt.startLaunch(gg, CFG.MOON.BASE, 'islands') };
    }
    if (!g.s.moon.flag && this.nearFlag(g)) return { label: '🚩 Plant the flag', run: (gg) => this.plantFlag(gg) };
    if (this.nearAlien(g)) return this.st.treat ? { label: '👋 Say hi', run: (gg) => this.sayHi(gg) } : { label: '🍕 Moon pizza, please!', run: (gg) => this.getPizza(gg) };
    const c = this.craterAt(g.player.x, g.player.y);
    if (c >= 0) return { label: '🌕 Boing!', run: (gg) => this.startBoing(gg) };
    return null;
  },
  plantFlag(g) {
    const F = CFG.MOON.FLAG;
    g.s.moon.flag = true;
    g.floats.push({ x: F.x, y: F.y - 90, text: 'Hooray! 🚩', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    for (let i = 0; i < 10; i++) g.fx.push({ kind: 'sparkle', x0: F.x + U.rand(-30, 30), y0: F.y - U.rand(10, 80), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
    Sfx.unlock(); Haptics.success(); g.save();
  },
  getPizza(g) {
    const a = this.st.alien, p = g.player;
    this.st.treat = { t: CFG.MOON.TREAT };
    g.s.moon.pizzas++;
    a.say = { text: 'Here! A moon pizza! 🍕', t: 0, dur: 2.4 }; a.facing = p.x < a.x ? -1 : 1; a.wave = 1.2;
    g.fx.push({ kind: 'pizza', x0: a.x, y0: a.y - 30, x1: p.x, y1: p.y - 30, t: 0, dur: 0.35 });
    Sfx.pickup(); Haptics.tap();
  },
  sayHi(g) {
    const a = this.st.alien, p = g.player;
    a.say = { text: U.pick(['Zib zib! Hello! 👽', 'Yum, pizza! 🍕', 'Bleep bloop! 👋']), t: 0, dur: 2 }; a.facing = p.x < a.x ? -1 : 1; a.wave = 1.4;
    Sfx.chime(); Haptics.tap();
  },
  startBoing(g) {
    const p = g.player, st = this.st;
    st.boing = { x: p.x, y: p.y, t: 0, lift: 0 }; st.crater = this.craterAt(p.x, p.y);
    g.s.moon.boings++;
    g.floats.push({ x: p.x, y: p.y - 80, text: 'Boing! 🌕', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Sfx.tone(300, 0.35, 'sine', 0.05, 500); Haptics.tap();
  },
  arrive(g, tr) {
    if (tr.via !== 'rocket' || tr.to !== 'moon') return;
    const st = this.st, M = CFG.MOON;
    st.boing = null; st.crater = -1; st.dust = [];
    RocketExt.startLanding(g, M.BASE);
    if (!g.s.moon.seen) { g.s.moon.seen = true; g.toast('🌙 Welcome to Pizza Moon!', true); }
    else g.floats.push({ x: M.BASE.x, y: M.BASE.y - 320, text: 'Back on the moon! 🌙', color: '#ffe08a', t: 0, dur: 1.8, big: true });
  },
  home(g) {
    const st = this.st; if (!st) return;
    const B = CFG.MOON.BUGGY;
    st.boing = null; st.crater = -1; st.treat = null; st.dust = []; st.alien.say = null;
    Object.assign(st.buggy, { x: B.x, y: B.y, angle: 0, vx: 0, vy: 0 });   // the buggy goes back to its spot, so it is never stranded
  },
  hint(g) {
    if (!this.st || g.area !== 'moon' || g.travel) return undefined;
    if (this.rocketBusy()) return RocketExt.flyHint();
    const p = g.player, M = CFG.MOON, st = this.st, a = st.alien, s = g.s.moon;
    if (g.driving) return g.vehicle && g.vehicle.kind === 'buggy' ? { text: 'Vroom! Drive the moon buggy 🚙', target: null } : null;
    if (st.boing) return { text: 'Boing! 🌕', target: null };
    if (this.nearDoor(g)) return { text: RocketExt.hasInside() ? 'Go inside the rocket to fly home! 🚀' : 'Press the button to fly home! 🚀', target: null };
    if (!s.flag && this.nearFlag(g)) return { text: 'Plant the flag on the moon! 🚩', target: null };
    if (this.nearAlien(g)) return st.treat ? { text: 'Yum! A moon pizza 🍕', target: null } : { text: 'Ask the alien for a moon pizza! 👽', target: null };
    if (this.craterAt(p.x, p.y) >= 0) return { text: 'Press the button to bounce! 🌕', target: null };
    const bd = U.dist(p.x, p.y, st.buggy.x, st.buggy.y);
    if (bd < 70) return { text: 'Hop in the moon buggy! 🚙', target: null };
    if (!s.flag) return { text: 'Plant a flag on the moon! 🚩', target: { x: M.FLAG.x, y: M.FLAG.y + 20 } };
    if (!s.pizzas) return { text: 'Say hi to the alien! 👽', target: { x: a.x, y: a.y } };
    if (!s.drove) return { text: 'Drive the moon buggy! 🚙', target: st.buggy };
    if (!s.boings) { const c = M.CRATERS[0]; return { text: 'Jump in a crater! Boing! 🌕', target: { x: c.x, y: c.y } }; }
    return { text: 'Fly home in the rocket! 🚀', target: M.DOOR };
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, M = CFG.MOON;
    if (st.treat) { st.treat.t -= dt; if (st.treat.t <= 0) st.treat = null; }
    for (const d of st.dust) { d.t += dt; d.r += dt * 14; d.y -= dt * 6; }
    st.dust = st.dust.filter((d) => d.t < d.life);
    if (g.area !== 'moon') { st.dust.length = 0; st.boing = null; return; }
    this.updateAlien(g, dt);
    const sh = st.shoot; sh.t += dt; if (sh.t > 1.2) { sh.t = -U.rand(5, 10); sh.x = U.rand(M.WORLD.x0 + 100, M.WORLD.x1 - 300); sh.y = M.WORLD.y0 + U.rand(10, 70); }
    if (g.travel || this.rocketBusy()) return;
    // driving the buggy: dust behind the wheels, a bump through the craters
    if (g.driving) {
      const v = g.vehicle; if (!v || v.kind !== 'buggy') return;
      g.s.moon.drove = true;
      const sp = Math.hypot(v.vx, v.vy);
      st.dustT -= dt; if (sp > 40 && st.dustT <= 0) { st.dustT = 0.06; const bx = v.x - Math.cos(v.angle) * 24, by = v.y - Math.sin(v.angle) * 24; st.dust.push({ x: bx + U.rand(-8, 8), y: by + U.rand(-8, 8), r: 6, t: 0, life: 0.9 }); }
      st.bumpCd = Math.max(0, st.bumpCd - dt);
      const c = this.craterAt(v.x, v.y);
      if (c >= 0 && c !== st.crater && st.bumpCd <= 0 && sp > 40) { st.bumpCd = 1; g.floats.push({ x: v.x, y: v.y - 50, text: 'Boing! 🌕', color: '#ffe08a', t: 0, dur: 1, big: true }); Haptics.tap(); }
      st.crater = c;
      return;
    }
    // a bounce out of a crater: up and down on the spot, the shadow stays on the ground
    if (st.boing) {
      const b = st.boing; b.t += dt;
      const k = Math.min(1, b.t / M.BOING.dur); b.lift = Math.sin(k * Math.PI) * M.BOING.h;
      p.x = b.x; p.y = b.y - b.lift; p.moving = false; p.hasMoved = true;
      if (k >= 1) { p.x = b.x; p.y = b.y; st.boing = null; st.crater = this.craterAt(p.x, p.y); g.floats.push({ x: p.x, y: p.y - 40, text: 'puff!', color: '#fff6d5', t: 0, dur: 0.7 }); for (let i = 0; i < 6; i++) st.dust.push({ x: p.x + U.rand(-16, 16), y: p.y + U.rand(-4, 4), r: 5, t: 0, life: 0.8 }); }
      return;
    }
    if (!this.onFoot(g)) return;
    // a save (or a push) that left the chef in the sky, a rock or the rocket puts them back at the rocket's hatch
    if (!this.free(g, p.x, p.y)) { p.x = M.DOOR.x; p.y = M.DOOR.y; p.moving = false; st.crater = -1; return; }
    // walking into a crater: boing!
    const c = this.craterAt(p.x, p.y);
    if (c >= 0 && c !== st.crater) { this.startBoing(g); return; }
    st.crater = c;
    // low gravity: little puffs of moon dust at every step
    st.dustT -= dt; if (p.moving && st.dustT <= 0) { st.dustT = 0.22; st.dust.push({ x: p.x + U.rand(-6, 6), y: p.y + 2, r: 4, t: 0, life: 0.7 }); }
  },
  updateAlien(g, dt) {
    const a = this.st.alien, A = CFG.MOON.ALIEN, p = g.player, t = g.time;
    a.waveCd = Math.max(0, a.waveCd - dt); a.wave = Math.max(0, a.wave - dt);
    if (a.say) { a.say.t += dt; if (a.say.t > a.say.dur) a.say = null; }
    const near = !g.driving && U.dist(p.x, p.y, a.x, a.y) < CFG.MOON.WAVE_R;
    if (near && a.waveCd <= 0) { a.wave = 1.6; a.waveCd = 6; }
    if (near || a.wave > 0 || a.say) { a.facing = p.x < a.x ? -1 : 1; a.moving = false; a.hop = a.wave > 0 || a.say ? Math.abs(Math.sin(t * 9)) * 9 : 0; return; }
    a.hop = 0;
    if (a.pause > 0) { a.pause -= dt; a.moving = false; return; }
    const tx = A.x + a.dir * A.range;
    a.facing = a.dir; a.moving = true; a.bob += dt * 10;
    if (U.moveToward(a, tx, A.y, 30, dt)) { a.dir *= -1; a.pause = U.rand(1, 2.5); a.moving = false; }
  },

  // ---------- art ----------
  paint: {
    moon(r, g) { MoonExt.paintMoon(r, g); },
  },
  paintMoon(r, g) {
    const ctx = r.ctx, M = CFG.MOON, W = M.WORLD, h = (i) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
    const top = W.y0 + M.SKY_H;
    // the cheese surface, a little lighter in the middle, with bubbles and toasty spots
    const sg = ctx.createLinearGradient(0, top, 0, W.y1); sg.addColorStop(0, '#f7d35c'); sg.addColorStop(1, '#efbf45');
    ctx.fillStyle = sg; ctx.fillRect(W.x0, top - 20, W.x1 - W.x0, W.y1 - top + 20);
    for (let i = 0; i < 170; i++) {
      const x = W.x0 + h(i) * (W.x1 - W.x0), y = top + 20 + h(i + 300) * (W.y1 - top - 20), rr = 6 + h(i + 600) * 24;
      ctx.fillStyle = i % 3 ? 'rgba(255,236,150,0.55)' : 'rgba(214,150,40,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // the sky along the top, the stars and the Earth
    const sky = ctx.createLinearGradient(0, W.y0, 0, top); sky.addColorStop(0, '#05061a'); sky.addColorStop(1, '#1a2048');
    ctx.fillStyle = sky; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, M.SKY_H + 4);
    for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(255,255,240,${(0.4 + h(i + 50) * 0.6).toFixed(2)})`; const s = i % 7 ? 1.5 : 2.5; ctx.fillRect(W.x0 + h(i + 900) * (W.x1 - W.x0), W.y0 + h(i + 1200) * (M.SKY_H - 20), s, s); }
    this.drawEarth(ctx, M.EARTH.x, M.EARTH.y, M.EARTH.r);
    // the horizon: the moon's crusty edge, bumpy
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(W.x0, top + 14);
    for (let x = W.x0; x <= W.x1; x += 20) ctx.lineTo(x, top - 6 - Math.abs(Math.sin(x * 0.031)) * 10 - h(x) * 4);
    ctx.lineTo(W.x1, top + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b86f2d'; ctx.fillRect(W.x0, top + 8, W.x1 - W.x0, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = W.x0 + 10; x < W.x1; x += 37) ctx.fillRect(x, top - 4 - Math.abs(Math.sin(x * 0.031)) * 6, 12, 3);
    // footprints from the pad out onto the moon
    ctx.fillStyle = 'rgba(160,110,30,0.28)';
    for (let i = 0; i < 16; i++) { const x = M.DOOR.x + 40 + i * 26, y = M.DOOR.y + 30 + Math.sin(i * 0.6) * 16 + (i % 2 ? 6 : -6); ctx.beginPath(); ctx.ellipse(x, y, 5, 3, 0.2, 0, Math.PI * 2); ctx.fill(); }
    // craters
    for (const c of M.CRATERS) this.paintCrater(ctx, c);
    // pepperoni rocks
    for (const [x, y, rr] of M.ROCKS) this.paintRock(ctx, x, y, rr);
    // the flag's little hill
    const F = M.FLAG;
    ctx.fillStyle = 'rgba(200,140,40,0.35)'; ctx.beginPath(); ctx.ellipse(F.x + 4, F.y + 8, 58, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbe07a'; ctx.beginPath(); ctx.ellipse(F.x, F.y + 2, 54, 18, 0, 0, Math.PI * 2); ctx.fill();
    // the landing pad: a round metal plate, a yellow ring and a moon painted on it
    const P = M.PAD, B = M.BASE, pcx = (P.x0 + P.x1) / 2, pcy = (P.y0 + P.y1) / 2;
    ctx.fillStyle = 'rgba(120,80,20,0.25)'; ctx.beginPath(); ctx.ellipse(pcx + 6, pcy + 8, (P.x1 - P.x0) / 2, (P.y1 - P.y0) / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b9bcc2'; ctx.beginPath(); ctx.ellipse(pcx, pcy, (P.x1 - P.x0) / 2, (P.y1 - P.y0) / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(pcx, pcy); ctx.rotate(k * Math.PI / 6); ctx.fillRect(-(P.x1 - P.x0) / 2, -1, P.x1 - P.x0, 2); ctx.restore(); }
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(pcx, pcy, (P.x1 - P.x0) / 2 - 12, (P.y1 - P.y0) / 2 - 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 40, B.y - 26, 80, 30, 6); ctx.fill();
    ctx.fillStyle = '#3e424a'; for (let x = B.x - 34; x < B.x + 36; x += 8) ctx.fillRect(x, B.y - 22, 4, 22);
    for (const [dx, dy] of [[-100, 0], [100, 0], [0, -96], [-70, 70], [70, 70]]) { ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(pcx + dx, pcy + dy, 5, 0, Math.PI * 2); ctx.fill(); }
    // the welcome sign
    const S = M.SIGN, sw = 130;
    ctx.fillStyle = 'rgba(120,80,20,0.25)'; ctx.fillRect(S.x - sw / 2 + 6, S.y - 2, sw, 6);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(S.x - 56, S.y - 46, 5, 46); ctx.fillRect(S.x + 51, S.y - 46, 5, 46);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, S.x - sw / 2, S.y - 72, sw, 36, 6); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; U.roundRect(ctx, S.x - sw / 2, S.y - 72, sw, 36, 6); ctx.stroke();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌙 PIZZA MOON', S.x, S.y - 54);
  },
  drawEarth(ctx, x, y, R) {
    ctx.fillStyle = 'rgba(120,200,255,0.25)'; ctx.beginPath(); ctx.arc(x, y, R + 8, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#2e86de'; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.fillStyle = '#5fb35a'; for (const [fx, fy, fr] of [[-0.4, -0.3, 0.35], [0.4, 0.1, 0.3], [-0.2, 0.45, 0.25], [0.25, -0.5, 0.15]]) { ctx.beginPath(); ctx.ellipse(x + fx * R, y + fy * R, fr * R, fr * R * 0.7, fx, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (const [fx, fy, fr] of [[-0.1, -0.15, 0.3], [0.35, 0.45, 0.2], [-0.5, 0.2, 0.18]]) { ctx.beginPath(); ctx.ellipse(x + fx * R, y + fy * R, fr * R, fr * R * 0.22, 0.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(5,6,26,0.4)'; ctx.beginPath(); ctx.rect(x - R, y - R, R * 2, R * 2); ctx.arc(x - R * 0.3, y - R * 0.25, R * 1.05, 0, Math.PI * 2, true); ctx.fill();
    ctx.restore();
  },
  paintCrater(ctx, c) {
    ctx.fillStyle = 'rgba(255,240,170,0.9)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, c.rx + 8, c.ry + 6, 0, 0, Math.PI * 2); ctx.fill();   // the raised rim
    ctx.fillStyle = '#d9a632'; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c38f24'; ctx.beginPath(); ctx.ellipse(c.x, c.y - c.ry * 0.25, c.rx * 0.92, c.ry * 0.7, 0, Math.PI, 0); ctx.fill();     // shade under the far rim
    ctx.fillStyle = 'rgba(255,240,170,0.35)'; ctx.beginPath(); ctx.ellipse(c.x + c.rx * 0.15, c.y + c.ry * 0.3, c.rx * 0.5, c.ry * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  },
  // a pepperoni slice lying on the moon like a rock: red dome, darker rim, little spots and a shine
  paintRock(ctx, x, y, rr) {
    ctx.fillStyle = 'rgba(120,60,10,0.25)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 4, rr, rr * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#962d22'; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c63a2c'; ctx.beginPath(); ctx.ellipse(x, y - rr * 0.12, rr * 0.9, rr * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a2219'; for (const [a, b] of [[-0.4, -0.1], [0.3, 0.05], [0, -0.3], [0.45, -0.3], [-0.15, 0.15]]) { ctx.beginPath(); ctx.ellipse(x + a * rr, y + b * rr, rr * 0.1, rr * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - rr * 0.35, y - rr * 0.3, rr * 0.22, rr * 0.1, -0.3, 0, Math.PI * 2); ctx.fill();
  },

  // above the map's top edge (seen under the HUD) is space too, not the town's blue sky; twinkles and a shooting star
  dynamic(r, g) {
    if (!this.st || g.area !== 'moon') return;
    const ctx = r.ctx, M = CFG.MOON, W = M.WORLD, t = g.time;
    if (r.camY < W.y0) {
      ctx.fillStyle = '#05061a'; ctx.fillRect(r.camX - 10, r.camY - 10, r.viewW + 20, W.y0 - r.camY + 10);
      ctx.fillStyle = 'rgba(255,255,240,0.7)'; for (let i = 0; i < 30; i++) { const x = W.x0 + ((i * 397) % (W.x1 - W.x0)), y = W.y0 - 6 - ((i * 53) % 80); if (y > r.camY) ctx.fillRect(x, y, 1.5, 1.5); }
    }
    for (let i = 0; i < 14; i++) { const a = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.7); if (a < 0.6) continue; const x = W.x0 + ((i * 613 + 97) % (W.x1 - W.x0)), y = W.y0 + 12 + ((i * 37) % (M.SKY_H - 50)); ctx.fillStyle = `rgba(255,255,220,${a.toFixed(2)})`; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 1.5, y - 1.5); ctx.lineTo(x + 5, y); ctx.lineTo(x + 1.5, y + 1.5); ctx.lineTo(x, y + 5); ctx.lineTo(x - 1.5, y + 1.5); ctx.lineTo(x - 5, y); ctx.lineTo(x - 1.5, y - 1.5); ctx.closePath(); ctx.fill(); }
    const sh = this.st.shoot;
    if (sh.t > 0) { const k = sh.t / 1.2, x = sh.x + k * 260, y = sh.y + k * 60; const gr = ctx.createLinearGradient(x - 60, y - 14, x, y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${(1 - k).toFixed(2)})`); ctx.strokeStyle = gr; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 60, y - 14); ctx.lineTo(x, y); ctx.stroke(); }
    // moon dust puffs
    for (const d of this.st.dust) { const k = d.t / d.life; ctx.fillStyle = `rgba(255,246,213,${(0.75 * (1 - k)).toFixed(3)})`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); }
    // the chef's shadow stays on the ground while bouncing
    const b = this.st.boing; if (b) { const s = 1 - b.lift / (M.BOING.h * 1.6); ctx.fillStyle = 'rgba(120,70,10,0.3)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 14 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const p = g.player, st = this.st;
    if (st.treat && g.area === 'moon' && !g.driving && !g.travel && !this.rocketBusy()) items.push({ y: p.y + 1, draw: () => this.drawMoonPizza(r, g) });
    if (g.area !== 'moon') return;
    const M = CFG.MOON;
    items.push({ y: M.BASE.y, draw: () => RocketExt.drawPadRocket(r, g, M.BASE, 2, RocketExt.flyState(g, 'moon')) });
    items.push({ y: M.SAUCER.y + 12, draw: () => this.drawSaucer(r, g) });
    items.push({ y: st.alien.y, draw: () => this.drawAlien(r, g) });
    items.push({ y: M.FLAG.y + 22, draw: () => this.drawFlag(r, g) });
    items.push({ y: st.buggy.y + 10, draw: () => r.drawSiteVehicle(g, st.buggy, 26) });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'moon') return;
    const ctx = r.ctx, a = this.st.alien, M = CFG.MOON, t = g.time;
    const bubble = (x, y, text) => { ctx.font = r.font(13); const tw = ctx.measureText(text).width + 22; r.drawBubble(x, y, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, tw); };
    if (a.say) bubble(a.x, a.y - a.hop - 74, a.say.text);
    else if (a.wave > 0.3) bubble(a.x, a.y - a.hop - 70, '👋');
    // a little 🚩 bubble over the flag kit until it is planted
    if (!g.s.moon.flag && !g.driving) bubble(M.FLAG.x, M.FLAG.y - 30 + Math.sin(t * 4) * 3, '🚩');
  },
  // the moon pizza in the chef's hand: a little pizza with pepperoni craters and a sparkle
  drawMoonPizza(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 17, y = p.y - 22 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    ctx.fillStyle = 'rgba(255,240,150,0.35)'; ctx.beginPath(); ctx.arc(x, y, 13 + Math.sin(t * 5) * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7d35c'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c63a2c'; for (const [dx, dy] of [[-3, -2], [3, 1], [-1, 4]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.8, 0, Math.PI * 2); ctx.fill(); }
    if (Math.floor(t * 3) % 2) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 7, y - 11, 2, 6); ctx.fillRect(x + 5, y - 9, 6, 2); }
  },
  // the friendly alien: round and green, big eyes, an antenna with a glowing tip, little feet; hops when it waves
  drawAlien(r, g) {
    const ctx = r.ctx, a = this.st.alien, t = g.time, x = a.x, y = a.y - a.hop, f = a.facing, step = a.moving ? Math.sin(a.bob) * 3 : 0;
    ctx.fillStyle = 'rgba(120,70,10,0.3)'; ctx.beginPath(); ctx.ellipse(a.x, a.y + 2, 14 * (1 - a.hop / 40), 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9a3f'; U.roundRect(ctx, x - 9 + step, y - 6, 8, 6, 3); ctx.fill(); U.roundRect(ctx, x + 1 - step, y - 6, 8, 6, 3); ctx.fill();   // feet
    ctx.fillStyle = '#6cc04a'; ctx.beginPath(); ctx.ellipse(x, y - 16, 12, 12, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y - 16, 4, 0, Math.PI * 2); ctx.fill();                // a pizza badge
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x - 1, y - 17, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cc04a'; ctx.beginPath(); ctx.arc(x - 12, y - 16, 3.5, 0, Math.PI * 2); ctx.arc(x + 12, y - 16, 3.5, 0, Math.PI * 2); ctx.fill();   // little hands
    ctx.fillStyle = '#7ed957'; ctx.beginPath(); ctx.ellipse(x, y - 38, 17, 14, 0, 0, Math.PI * 2); ctx.fill();   // head
    ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 51); ctx.lineTo(x + f * 3, y - 62); ctx.stroke();   // antenna
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffe08a' : '#ffd166'; ctx.beginPath(); ctx.arc(x + f * 3, y - 64, 4, 0, Math.PI * 2); ctx.fill();
    for (const d of [-1, 1]) { ctx.fillStyle = '#1e1e2e'; ctx.beginPath(); ctx.ellipse(x + d * 7 + f * 2, y - 40, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + d * 7 + f * 2 - 1.5, y - 42.5, 1.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#2b5a2b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x + f * 2, y - 32, 4, 0.2, Math.PI - 0.2); ctx.stroke();   // a smile
  },
  drawSaucer(r, g) {
    const ctx = r.ctx, S = CFG.MOON.SAUCER, t = g.time, x = S.x, y = S.y;
    ctx.fillStyle = 'rgba(120,70,10,0.3)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 12, 50, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7d8591'; for (const d of [-30, 30]) { ctx.fillRect(x + d - 2, y, 4, 12); ctx.fillRect(x + d - 6, y + 10, 12, 3); }   // little legs
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.ellipse(x, y - 16, 22, 18, 0, Math.PI, 0); ctx.fill();   // the glass dome
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - 8, y - 24, 6, 4, -0.4, 0, Math.PI * 2); ctx.fill();
    const sg = ctx.createLinearGradient(0, y - 18, 0, y + 6); sg.addColorStop(0, '#e8edf2'); sg.addColorStop(1, '#9aa0a8');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(x, y - 4, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) { const on = (Math.floor(t * 4) + i) % 3 === 0; ctx.fillStyle = on ? ['#ff6b6b', '#ffd166', '#8ef0a0'][i % 3] : 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - 35 + i * 14, y - 2 + Math.abs(i - 2.5) * -0.6, 3, 0, Math.PI * 2); ctx.fill(); }
  },
  // the flag: a little crate waiting on the hill, then (once planted) a pole with a checked pizza flag waving
  drawFlag(r, g) {
    const ctx = r.ctx, F = CFG.MOON.FLAG, t = g.time;
    if (!g.s.moon.flag) {
      ctx.strokeStyle = 'rgba(184,111,45,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(F.x, F.y + 4, 22, 9, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#a8763e'; U.roundRect(ctx, F.x + 18, F.y - 4, 26, 18, 3); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.fillRect(F.x + 22, F.y - 1, 18, 5); ctx.fillStyle = '#fff'; ctx.fillRect(F.x + 22, F.y + 5, 18, 4);
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(F.x + 14, F.y - 10, 34, 3);   // the pole, lying across the crate
      return;
    }
    ctx.fillStyle = 'rgba(120,70,10,0.3)'; ctx.beginPath(); ctx.ellipse(F.x + 3, F.y + 3, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(F.x - 2, F.y - 84, 4, 86); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(F.x, F.y - 86, 4, 0, Math.PI * 2); ctx.fill();
    // the flag cloth: a grid of red and white squares that ripple, a pizza in the middle
    const fw = 50, fh = 32, cols = 6, rows = 4, x0 = F.x + 2, y0 = F.y - 82;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const wv = (u) => Math.sin(t * 4 - u * 0.25) * u * 0.12, xa = x0 + i * fw / cols, xb = x0 + (i + 1) * fw / cols;
      ctx.fillStyle = (i + j) % 2 ? '#fff' : '#e4572e';
      ctx.beginPath(); ctx.moveTo(xa, y0 + j * fh / rows + wv(xa - x0)); ctx.lineTo(xb, y0 + j * fh / rows + wv(xb - x0)); ctx.lineTo(xb, y0 + (j + 1) * fh / rows + wv(xb - x0)); ctx.lineTo(xa, y0 + (j + 1) * fh / rows + wv(xa - x0)); ctx.closePath(); ctx.fill();
    }
    r.drawPizza(x0 + fw / 2, y0 + fh / 2 + Math.sin(t * 4 - 6) * 3, 8);
  },
  // ---------- vehicle art: the moon buggy, seen from above, nose +x ----------
  vehicleArt: {
    buggy(r, g, color, v, h) {
      const ctx = r.ctx, c = r.paintColor(color, g) || '#3b7dd8', t = g.time, moving = v && Math.hypot(v.vx || 0, v.vy || 0) > 20;
      ctx.fillStyle = 'rgba(120,70,10,0.28)'; ctx.beginPath(); ctx.ellipse(3, 4, 34, 24, 0, 0, Math.PI * 2); ctx.fill();
      // four big balloon wheels with treads that roll
      for (const [wx, wy] of [[-17, -19], [17, -19], [-17, 19], [17, 19]]) {
        ctx.fillStyle = '#2b2f36'; U.roundRect(ctx, wx - 10, wy - 6, 20, 12, 5); ctx.fill();
        ctx.fillStyle = '#5c6670'; for (let k = 0; k < 4; k++) { const tx = wx - 8 + ((k * 5 + (moving ? t * 40 : 0)) % 18); ctx.fillRect(tx, wy - 6, 2, 12); }
      }
      // the frame and the body
      ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, -26, -14, 52, 28, 6); ctx.fill();
      ctx.fillStyle = c; U.roundRect(ctx, -22, -12, 44, 24, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; U.roundRect(ctx, -18, -10, 36, 5, 2); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -14, -8, 14, 16, 4); ctx.fill();   // the seat
      ctx.fillStyle = '#ffe08a'; for (const d of [-8, 8]) { ctx.beginPath(); ctx.arc(24, d, 3, 0, Math.PI * 2); ctx.fill(); }   // headlights
      // a dish and a little antenna with a pizza flag
      ctx.fillStyle = '#f5f7fa'; ctx.beginPath(); ctx.arc(10, 6, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(10, 6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(-20, -9, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-20, -9); ctx.lineTo(-32, -13 + Math.sin(t * 6) * 2); ctx.lineTo(-20, -17); ctx.closePath(); ctx.fill();
      r.drawPizza(10, -6, 4);
    },
  },
};
Game.ext.unshift(MoonExt);   // ahead of everything: on the moon only its button and hints count
Render.ext.push(MoonExt);
