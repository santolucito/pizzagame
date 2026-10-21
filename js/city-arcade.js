'use strict';
// The ARCADE: City building 3 on Bus Street (the purple one under the pizza billboard). Blinking bulbs frame its door;
// inside is a glowing games room with its own little map: a row of cabinets with animated screens, a pinball table,
// a claw machine that always wins, a dance pad, a photo booth, a prize counter with a clerk and a token bag to buy.
// Nothing can go wrong in here: every game is one press and ends with a prize or a cheer.
// Extension module: registered with Game.ext (unshift: the door beats the City's own buttons) and Render.ext.
CFG.ARCADE = {
  BUILDING: 3,                                   // index in CFG.CITY.BUILDINGS
  DOOR: { x: 5256, y: 14 },                      // on the sidewalk right below the door
  WORLD: { x0: 1400, y0: 3000, x1: 2000, y1: 3400 },
  ROOM: { x0: 1430, y0: 3040, x1: 1970, y1: 3370 }, WALL: 26,
  EXIT: { x: 1700, y: 3348 },                    // the mat inside the door; you arrive just above it
  REACH: 34, PLAY: 3,                            // how close counts as "at" a machine; seconds a game lasts
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

  // ---------- game hooks ----------
  defaults: { arcade: { seen: false, tokens: 0, prizes: 0, photos: 0, pinball: 0, plays: 0, danced: false } },
  build(g) {
    if (!g.s.arcade) g.s.arcade = JSON.parse(JSON.stringify(this.defaults.arcade));
    this.st = {
      fade: 0, flash: 0, play: null, photo: null, notes: [],
      dance: { on: false, t: 0, beat: -1 },
      pin: { t: 0, score: 0, bump: [0, 0, 0] },
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
    const st = this.st, p = g.player, A = CFG.ARCADE;
    st.fade = Math.max(0, st.fade - dt); st.flash = Math.max(0, st.flash - dt);
    if (st.photo) { st.photo.t += dt; if (st.photo.t >= st.photo.dur) st.photo = null; }
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.6);
    if (g.area !== 'arcade') { st.play = null; st.dance.on = false; return; }
    this.rescue(g);
    // pinball keeps rolling on its own; fast while you play it
    const pin = st.pin, playingPin = st.play && st.play.kind === 'pinball';
    pin.t += dt * (playingPin ? 3.2 : 0.9);
    for (let i = 0; i < 3; i++) pin.bump[i] = Math.max(0, pin.bump[i] - dt);
    if (playingPin) { const b = this.ball(pin.t); this.bumpers().forEach((bp, i) => { if (U.dist(b.x, b.y, bp.x, bp.y) < 11 && pin.bump[i] <= 0) { pin.bump[i] = 0.35; pin.score += 100; } }); }
    // a game in progress: the chef stays at the machine until it is over
    if (st.play) {
      const pl = st.play; pl.t += dt; p.x = pl.hold.x; p.y = pl.hold.y; p.moving = false; p.facing = pl.facing;
      if (pl.kind === 'booth') for (const at of [0.7, 1.4, 2.1]) if (pl.t - dt < at && pl.t >= at) { st.flash = 0.25; pl.flashes = (pl.flashes || 0) + 1; }
      if (pl.t >= pl.dur) { this.finishPlay(g, pl); st.play = null; }
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
    if (st.play) return { label: { claw: '🧸 Grabbing…', pinball: '🪩 Playing…', cab: '🕹️ Playing…', booth: '📸 Smile…' }[st.play.kind], run: () => {} };
    if (this.at(g, A.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.at(g, A.CLAW.spot)) return { label: '🧸 Grab a prize', run: (gg) => this.startPlay(gg, 'claw', A.CLAW.spot) };
    if (this.at(g, A.PINBALL.spot)) return { label: '🪩 Play pinball', run: (gg) => this.startPlay(gg, 'pinball', A.PINBALL.spot) };
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
  startPlay(g, kind, spot, key) {
    const st = this.st, a = g.s.arcade, p = g.player;
    if (st.play) return;
    const pl = { kind, key, t: 0, dur: CFG.ARCADE.PLAY, hold: { x: spot.x, y: spot.y }, facing: kind === 'booth' ? 1 : p.facing, flashes: 0 };
    if (kind === 'claw') pl.plush = a.prizes % 4;
    if (kind === 'pinball') st.pin.score = 0;
    st.play = pl; p.x = spot.x; p.y = spot.y; p.moving = false;
    a.plays++;
    if (a.tokens > 0) { a.tokens--; g.floats.push({ x: p.x, y: p.y - 46, text: '🪙', color: '#ffe94f', t: 0, dur: 0.9 }); }
    Sfx.pickup(); Haptics.tap();
  },
  finishPlay(g, pl) {
    const a = g.s.arcade, p = g.player, A = CFG.ARCADE;
    let text = '⭐ High score!';
    if (pl.kind === 'claw') { a.prizes++; text = 'You got a prize! 🧸'; g.fx.push({ kind: 'sparkle', x0: A.CLAW.x + 17, y0: A.CLAW.y + 70, x1: A.CLAW.x + 17, y1: A.CLAW.y + 70, t: 0, dur: 0.8 }); }
    else if (pl.kind === 'pinball') { a.pinball++; text = '⭐ Great score!'; }
    else if (pl.kind === 'booth') { a.photos++; text = '📸 Say cheese!'; this.st.photo = { t: 0, dur: 3 }; }
    g.floats.push({ x: p.x, y: p.y - 50, text, color: '#ffe08a', t: 0, dur: 1.8, big: true });
    Sfx.ding(); Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    if (g.area === 'city') return this.atDoor(g, 64) ? { text: 'Go inside the Arcade! 🕹️', target: CFG.ARCADE.DOOR } : undefined;
    if (g.area !== 'arcade') return undefined;
    const A = CFG.ARCADE, st = this.st, a = g.s.arcade;
    if (st.play) return { text: { claw: 'Grabbing a prize… 🧸', pinball: 'Ding ding ding! 🪩', cab: 'Pew pew pew! 🕹️', booth: 'Smile! 📸' }[st.play.kind], target: null };
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
  // where the claw is during a grab: { x, y, open (0..1), carry (plush index or -1), drop (0..1 fall of the prize into the chute) }
  clawPose(pl) {
    const C = CFG.ARCADE.CLAW, rest = { x: C.x + C.w - 18, y: C.y + 14 }, chute = { x: C.x + 17 };
    if (!pl) return { x: rest.x, y: rest.y, open: 1, carry: -1, drop: 0 };
    const s = this.plushSlots()[pl.plush], t = pl.t, e = U.easeOut;
    if (t < 0.8) return { x: U.lerp(rest.x, s.x, e(t / 0.8)), y: rest.y, open: 1, carry: -1, drop: 0 };
    if (t < 1.3) return { x: s.x, y: U.lerp(rest.y, s.y - 8, e((t - 0.8) / 0.5)), open: 1, carry: -1, drop: 0 };
    if (t < 1.6) return { x: s.x, y: s.y - 8, open: 1 - (t - 1.3) / 0.3, carry: -1, drop: 0 };
    if (t < 2.1) return { x: s.x, y: U.lerp(s.y - 8, rest.y, e((t - 1.6) / 0.5)), open: 0, carry: pl.plush, drop: 0 };
    if (t < 2.6) return { x: U.lerp(s.x, chute.x, e((t - 2.1) / 0.5)), y: rest.y, open: 0, carry: pl.plush, drop: 0 };
    return { x: chute.x, y: rest.y, open: Math.min(1, (t - 2.6) / 0.2), carry: -1, drop: Math.min(1, (t - 2.6) / 0.4) };
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
    for (const c of A.CABINETS) this.drawScreen(r, c, t, pl && pl.kind === 'cab' && pl.key === c.key ? pl : null);
    this.drawPinballLive(r, g);
    this.drawClawLive(r, g);
    this.drawDanceLive(r, g);
    // the photo booth's flash bulb
    const B = A.BOOTH, fl = st.flash / 0.25;
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.5 * fl).toFixed(3)})`; ctx.beginPath(); ctx.arc(B.x + 44, B.y + 34, 26 * fl + 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = fl > 0 ? '#fff' : '#fff3b0'; ctx.beginPath(); ctx.arc(B.x + 44, B.y + 20, 2.5 + fl * 2, 0, Math.PI * 2); ctx.fill();
  },
  drawScreen(r, c, t, pl) {
    const ctx = r.ctx, sx = c.x + 8, sy = c.y + 15, sw = c.w - 16, sh = 26, k = pl ? pl.t / pl.dur : 0, fast = pl ? 3 : 1;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    ctx.fillStyle = '#061018'; ctx.fillRect(sx, sy, sw, sh);
    if (c.key === 'invaders') {
      const sway = Math.sin(t * 2 * fast) * 5, gone = pl ? Math.floor(k * 10) : -1;
      for (let i = 0; i < 10; i++) {
        const x = sx + 9 + (i % 5) * 8 + sway, y = sy + 5 + Math.floor(i / 5) * 6;
        if (i < gone) continue;
        if (i === gone) { ctx.fillStyle = '#ffe94f'; this.drawStar(ctx, x, y, 4, 1.5, 5); continue; }
        ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(x - 3, y - 2.5); ctx.lineTo(x + 3, y - 2.5); ctx.lineTo(x, y + 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 1, y - 1.5, 2, 1.5);
      }
      const shipX = sx + sw / 2 + Math.sin(t * 1.3 * fast) * 14;
      ctx.fillStyle = '#fff'; ctx.fillRect(shipX - 4, sy + sh - 5, 8, 3); ctx.fillRect(shipX - 2, sy + sh - 8, 4, 3);
      ctx.fillStyle = '#ffe94f'; ctx.fillRect(shipX - 0.5, sy + sh - 9 - ((t * 40 * fast) % (sh - 10)), 1.5, 4);
      if (pl) { ctx.fillStyle = '#ffe94f'; ctx.font = r.font(5); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(Math.floor(k * 10) * 100).padStart(4, '0'), sx + 2, sy + 1); }
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
      ctx.fillStyle = '#fff'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(pl ? `${Math.floor(k * 9)}  ${Math.floor(k * 4)}` : '3  2', sx + sw / 2, sy + 1);
    }
    ctx.restore();
  },
  drawPinballLive(r, g) {
    const ctx = r.ctx, P = CFG.ARCADE.PINBALL, pin = this.st.pin, t = g.time, playing = this.st.play && this.st.play.kind === 'pinball';
    const fx = P.x + 6, fy = P.y + 26, fw = P.w - 12, fh = P.h - 32;
    ctx.fillStyle = '#ffe94f'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(pin.score).padStart(5, '0'), P.x + P.w / 2, P.y + 16);
    this.bumpers().forEach((b, i) => {
      const lit = playing ? pin.bump[i] > 0 : Math.floor(t * 2) % 3 === i;
      if (lit) { ctx.fillStyle = this.rgba(b.c, 0.35); ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = lit ? b.c : this.rgba(b.c, 0.45); ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    const flap = playing ? Math.abs(Math.sin(pin.t * 4)) * 0.7 : 0;
    ctx.strokeStyle = '#ffe94f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { const x0 = fx + fw / 2 + d * 16, y0 = fy + fh - 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - d * 11 * Math.cos(0.5 - flap), y0 + 11 * Math.sin(0.5 - flap)); ctx.stroke(); }
    ctx.lineCap = 'butt';
    const b = this.ball(pin.t);
    ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x - 1, b.y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
  },
  drawClawLive(r, g) {
    const ctx = r.ctx, C = CFG.ARCADE.CLAW, A = CFG.ARCADE, st = this.st, pl = st.play && st.play.kind === 'claw' ? st.play : null, pose = this.clawPose(pl);
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
    if (g.area === 'arcade' && st.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.75 * st.flash / 0.25).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
};

Game.ext.unshift(ArcadeExt);
Render.ext.push(ArcadeExt);
