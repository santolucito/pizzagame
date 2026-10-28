'use strict';
// The candy shop: City building 7 (top row, east end of Bus Street) gets a '🍬 CANDY' sign and a giant lollipop by the
// door. Inside is a rainbow sweet shop: jars of sweets on the shelves, a gumball machine (press the button and a gumball
// rolls down the spiral into the chef's hand), a chocolate fountain, a cotton-candy machine that spins up when you stand
// by it ($3 for a pink cloud to carry around), a pick-and-mix counter ($5 for a bag of sweets), a licorice ladder up to
// the top shelf, a candy-cane forest in the corner and a shopkeeper with a very big smile.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.CANDY = {
  BUILDING: 7,                                   // index in CFG.CITY.BUILDINGS: { x0: 6062, y0: -160, x1: 6190, y1: 0 }
  DOOR_OUT: { x: 6126, y: 14 },                  // on the sidewalk just below the door
  WORLD: { x0: 5000, y0: 3000, x1: 5600, y1: 3400 },
  ROOM: { x0: 5040, y0: 3100, x1: 5560, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: shelves and the rainbow hang on it
  SHELF_L: { x0: 5062, y0: 3030, x1: 5236, y1: 3096 },
  SHELF_R: { x0: 5364, y0: 3030, x1: 5538, y1: 3096 },
  LADDER: { x: 5300, top: 3024, bottom: 3098 },  // the licorice ladder leans on the back wall between the shelves
  GUMBALL: { x: 5092, y: 3196 }, BUTTON: { x: 5126, y: 3200 },   // the machine by the left wall; stand at BUTTON to press it
  FOUNTAIN: { x: 5300, y: 3176 },
  COTTON: { x: 5492, y: 3166 },
  PICKMIX: { x0: 5338, y0: 3236, x1: 5472, y1: 3276 }, KEEPER: { x: 5405, y: 3228 },
  PADS: { cotton: { x: 5492, y: 3218 }, mix: { x: 5405, y: 3306 } },
  CANES: [{ x: 5066, y: 3284, c: '#e4572e' }, { x: 5108, y: 3302, c: '#41b883' }, { x: 5072, y: 3328, c: '#3b7dd8' }, { x: 5142, y: 3326, c: '#e4572e' }, { x: 5122, y: 3264, c: '#8e5bd1' }],
  RUG: { x: 5226, y: 3270 },
  EXIT: { x: 5300, y: 3322 },                    // the mat inside the door (the door is in the bottom wall)
  GUM_SPIRAL: 1.5, GUM_DROP: 0.35, GUM_FLY: 0.3,  // seconds: the gumball's spiral, the drop into the chute, the flight to the chef's hand
  COTTON_T: 30, BAG_T: 20,                       // seconds: how long the cotton candy and the bag of sweets last
  GUMS: [['#ff5c8a', '🔴'], ['#ffd166', '🟡'], ['#41b883', '🟢'], ['#3b7dd8', '🔵'], ['#8e5bd1', '🟣'], ['#ff8c42', '🟠']],
};
CFG.AREAS.candy = { WORLD: CFG.CANDY.WORLD };

const CandyExt = {
  name: 'candy',
  st: null,
  defaults: { candy: { seen: false, gumballs: 0, cottons: 0, mixes: 0 } },

  // ---------- state ----------
  build(g) {
    const C = CFG.CANDY;
    if (!g.s.candy) g.s.candy = { seen: false, gumballs: 0, cottons: 0, mixes: 0 };
    this.st = {
      fade: 0,
      gum: null,                                                     // { t, col, emo }: the gumball rolling down the spiral
      spin: 0, drum: 0,                                              // the cotton-candy machine: how fast it spins, its angle
      cotton: 0, bag: 0,                                             // seconds left on the carried cotton candy / bag of sweets
      wisps: [],
      obs: null,
    };
    const R = C.ROOM, w = C.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: C.GUMBALL.x - 18, y: C.GUMBALL.y - 20, w: 36, h: 28 });
    o.push({ x: C.FOUNTAIN.x - 38, y: C.FOUNTAIN.y - 14, w: 76, h: 30 });
    o.push({ x: C.COTTON.x - 24, y: C.COTTON.y - 20, w: 48, h: 32 });
    o.push({ x: C.PICKMIX.x0, y: C.PICKMIX.y0, w: C.PICKMIX.x1 - C.PICKMIX.x0, h: C.PICKMIX.y1 - C.PICKMIX.y0 });
    o.push({ x: C.KEEPER.x - 13, y: C.KEEPER.y - 14, w: 26, h: 20 });
    for (const c of C.CANES) o.push({ x: c.x - 9, y: c.y - 6, w: 14, h: 10 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'candy' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.CANDY.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inCityStreet(g) { return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && CityExt.st.cab))); },
  atDoor(g) { const D = CFG.CANDY.DOOR_OUT, p = g.player; return this.inCityStreet(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  nearButton(g) { const B = CFG.CANDY.BUTTON, p = g.player; return U.dist(p.x, p.y, B.x, B.y) < 34; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, C = CFG.CANDY, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'candy') return null;
    if (U.dist(p.x, p.y, C.EXIT.x, C.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (!st.gum && this.nearButton(g)) return { label: '🔴 Press the button', run: (gg) => this.pressButton(gg) };
    return null;
  },
  enter(g) {
    const C = CFG.CANDY, p = g.player;
    g.area = 'candy'; p.x = C.EXIT.x; p.y = C.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.candy.seen) { g.s.candy.seen = true; g.toast('🍬 Welcome to the candy shop!', true); }
  },
  leave(g) {
    const C = CFG.CANDY, p = g.player;
    g.area = 'city'; p.x = C.DOOR_OUT.x; p.y = C.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.gum = null; this.st.fade = 0.45; Sfx.drop();
  },
  pressButton(g) {
    const [col, emo] = U.pick(CFG.CANDY.GUMS);
    this.st.gum = { t: 0, col, emo };
    g.player.facing = -1;   // the machine is on the chef's left
    Sfx.pickup(); Haptics.tap();
  },
  home(g) { if (!this.st) return; this.st.gum = null; this.st.fade = 0; this.st.spin = 0; this.st.wisps = []; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, C = CFG.CANDY;
    if (this.free(p.x, p.y)) return false;
    p.x = C.EXIT.x; p.y = C.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, C = CFG.CANDY;
    st.fade = Math.max(0, st.fade - dt);
    st.cotton = Math.max(0, st.cotton - dt);
    st.bag = Math.max(0, st.bag - dt);
    if (g.area !== 'candy') { st.gum = null; st.spin = Math.max(0, st.spin - dt); st.wisps = []; return; }
    this.rescue(g);
    // the gumball: around the spiral, down the chute, then into the chef's hand
    if (st.gum) {
      const gm = st.gum; gm.t += dt;
      if (gm.t >= C.GUM_SPIRAL + C.GUM_DROP + C.GUM_FLY) {
        st.gum = null; g.s.candy.gumballs++;
        g.floats.push({ x: p.x, y: p.y - 64, text: 'Gumball! ' + gm.emo, color: gm.col, t: 0, dur: 1.6, big: true });
        for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-14, 14), y0: p.y - 30 + U.rand(-10, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 });
        Sfx.cash(); Haptics.success();
      }
    }
    // the cotton-candy machine spins up while the chef stands by it and winds down when they leave
    const near = U.dist(p.x, p.y, C.COTTON.x, C.COTTON.y) < 70;
    st.spin = U.clamp(st.spin + (near ? dt / 1.2 : -dt / 2), 0, 1);
    st.drum += st.spin * dt * 14;
    for (const w of st.wisps) w.t += dt;
    st.wisps = st.wisps.filter((w) => w.t < 1.2);
    if (st.spin > 0.3 && Math.random() < st.spin * 0.25) st.wisps.push({ a: U.rand(0, Math.PI * 2), r: U.rand(10, 20), t: 0 });
  },
  pads(g) {
    if (g.area !== 'candy' || !this.st) return [];
    // each circle hides while the chef still holds that treat, so standing there does not buy it over and over
    const P = CFG.CANDY.PADS, out = [];
    if (this.st.cotton <= 0) out.push({ key: 'candyCotton', label: 'Cotton Candy', ico: '☁️', pos: P.cotton, price: 3, sub: 'fluffy!' });
    if (this.st.bag <= 0) out.push({ key: 'candyMix', label: 'Pick & Mix', ico: '🍬', pos: P.mix, price: 5, sub: 'a bag of sweets' });
    return out;
  },
  onPad(g, pad) {
    const p = g.player, C = CFG.CANDY;
    if (pad.key === 'candyCotton') {
      this.st.cotton = C.COTTON_T; g.s.candy.cottons++;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Cotton candy! ☁️', color: '#ff8fab', t: 0, dur: 1.5, big: true });
      Haptics.success();
    } else if (pad.key === 'candyMix') {
      this.st.bag = C.BAG_T; g.s.candy.mixes++;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'Yum!', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      Haptics.success();
    }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, C = CFG.CANDY, st = this.st, s = g.s.candy;
    if (g.area === 'city') {
      if (!this.inCityStreet(g)) return undefined;
      const d = U.dist(p.x, p.y, C.DOOR_OUT.x, C.DOOR_OUT.y);
      if (d < 110) return { text: 'Sweets at the candy shop! 🍬', target: d < 30 ? null : C.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'candy') return undefined;
    if (st.gum) return { text: 'Here it comes! ' + st.gum.emo, target: null };
    if (!s.gumballs) return { text: 'Press the gumball button! 🔴', target: C.BUTTON };
    if (!s.cottons && g.s.cash + (g.s.padPaid.candyCotton || 0) >= 3) return { text: 'Get a cotton candy! ☁️', target: C.PADS.cotton };
    if (!s.mixes && g.s.cash + (g.s.padPaid.candyMix || 0) >= 5) return { text: 'Pick and mix some sweets! 🍬', target: C.PADS.mix };
    if (st.cotton > 0) return { text: 'Mmm, fluffy cotton candy! ☁️', target: null };
    if (st.bag > 0) return { text: 'Yum, sweets! 🍬', target: null };
    return { text: 'So many sweets! 🍬', target: null };
  },

  // ---------- the City outside: the sign and the mat (static), the giant lollipop (live) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.CANDY.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🍬 CANDY';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // a pink-and-white striped mat on the sidewalk in front of the door
    const D = CFG.CANDY.DOOR_OUT;
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#ff8fab'; ctx.fillRect(D.x - 15 + i * 6, D.y - 6, 6, 10); }
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
  },
  drawLollipop(r, g, x, y, rad, spin) {
    // a round swirled lollipop: the disc at (x, y), the stick hanging below it
    const ctx = r.ctx;
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = rad * 0.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + rad - 2); ctx.lineTo(x, y + rad * 2.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + rad * 0.14, y + rad); ctx.lineTo(x + rad * 0.14, y + rad * 2.3); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(x + 2, y + 2, rad, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = rad * 0.22; ctx.lineCap = 'round'; ctx.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.25) { const rr = a / (Math.PI * 6) * rad * 0.82; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, rad - 1, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
  },

  // ---------- the interior, static ----------
  paint: { candy(r, g) { CandyExt.paintRoom(r, g); } },
  paintJar(r, x, y, w, h, lid, kind, col) {
    // a glass jar sitting on a shelf with its base at y, filled with sweets of one kind
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; U.roundRect(ctx, x - w / 2, y - h, w, h, 5); ctx.fill();
    ctx.save(); U.roundRect(ctx, x - w / 2 + 1, y - h + 1, w - 2, h - 2, 4); ctx.clip();
    const fillTop = y - h * 0.72;
    if (kind === 0) {          // gumballs
      for (let j = 0; j < 14; j++) { ctx.fillStyle = CFG.CANDY.GUMS[j % 6][0]; ctx.beginPath(); ctx.arc(x - w / 2 + 4 + ((j * 7) % (w - 6)), fillTop + 4 + Math.floor(j * 7 / (w - 6)) * 6, 3, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 1) {   // jelly beans
      for (let j = 0; j < 12; j++) { ctx.fillStyle = j % 2 ? col : '#fff8ee'; ctx.beginPath(); ctx.ellipse(x - w / 2 + 5 + ((j * 9) % (w - 8)), fillTop + 4 + Math.floor(j * 9 / (w - 8)) * 7, 3.5, 2.2, (j % 3) * 0.7, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 2) {   // candy sticks, standing
      for (let j = 0; j < 5; j++) { ctx.fillStyle = j % 2 ? col : '#fff8ee'; ctx.fillRect(x - w / 2 + 3 + j * (w - 6) / 5, fillTop - 6, (w - 6) / 5 - 1, h); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - w / 2 + 3 + j * (w - 6) / 5, fillTop - 6, 1.5, h); }
    } else {                   // wrapped sweets
      ctx.fillStyle = col; ctx.fillRect(x - w / 2, fillTop, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.ellipse(x - w / 2 + 5 + ((j * 8) % (w - 6)), fillTop + 5 + Math.floor(j * 8 / (w - 6)) * 8, 4, 2, 0.5, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - w / 2 + 3, y - h + 5, 3, h - 10);   // glass shine
    ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1; U.roundRect(ctx, x - w / 2, y - h, w, h, 5); ctx.stroke();
    ctx.fillStyle = lid; U.roundRect(ctx, x - w / 2 - 1, y - h - 5, w + 2, 7, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - w / 2 + 1, y - h - 4, w - 2, 2);
  },
  paintShelf(r, S, seed) {
    const ctx = r.ctx, lids = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#8e5bd1', '#ff8fab'], cols = ['#ff5c8a', '#41b883', '#3b7dd8', '#ffd166', '#8e5bd1', '#ff8c42'];
    for (let row = 0; row < 2; row++) {
      const sy = S.y0 + 30 + row * 34;
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(S.x0 - 4, sy, S.x1 - S.x0 + 8, 5); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(S.x0 - 4, sy + 5, S.x1 - S.x0 + 8, 2);
      ctx.fillStyle = '#ff8fab'; for (let x = S.x0 - 4; x < S.x1 + 4; x += 10) ctx.fillRect(x, sy + 1, 5, 2);   // candy-striped shelf edge
      const n = 6, step = (S.x1 - S.x0) / n;
      for (let i = 0; i < n; i++) {
        const k = seed + row * 7 + i * 3, w = 18 + (k % 3) * 3, h = 20 + ((k * 5) % 3) * 3;
        this.paintJar(r, S.x0 + step * (i + 0.5), sy - 1, w, h, lids[k % 6], (k + row) % 4, cols[(k * 2 + row) % 6]);
      }
    }
  },
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.CANDY, W = C.WORLD, R = C.ROOM, w = C.WALL;
    // outside the shop: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, C.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - C.BACK_TOP);
    // checker floor: pink and cream tiles, a sprinkle on each cream one
    const ts = 24;
    for (let y = R.y0, j = 0; y < R.y1; y += ts, j++) for (let x = R.x0, i = 0; x < R.x1; x += ts, i++) {
      ctx.fillStyle = (i + j) % 2 ? '#ffd1e3' : '#fff8ee'; ctx.fillRect(x, y, Math.min(ts, R.x1 - x), Math.min(ts, R.y1 - y));
      if ((i + j) % 2 === 0) { ctx.fillStyle = ['#ff8fab', '#41b883', '#3b7dd8', '#ffd166'][(i * 3 + j) % 4]; ctx.fillRect(x + 8 + ((i * 5) % 7), y + 9 + ((j * 3) % 6), 5, 2); }
    }
    // a round rainbow rug
    const Rg = C.RUG, rings = ['#e4572e', '#ff8c42', '#ffd166', '#41b883', '#3b7dd8', '#8e5bd1'];
    for (let i = 0; i < rings.length; i++) { ctx.fillStyle = rings[i]; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, 42 - i * 6, 26 - i * 3.7, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    // walls: a tall cream back wall with polka dots and a rainbow, candy-striped side and bottom walls
    ctx.fillStyle = '#fff3f8'; ctx.fillRect(R.x0 - w, C.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - C.BACK_TOP);
    ctx.fillStyle = 'rgba(255,143,171,0.35)'; for (let y = C.BACK_TOP + 10; y < R.y0; y += 16) for (let x = R.x0 - w + 8 + ((y / 16) % 2) * 8; x < R.x1 + w; x += 16) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
    const rcx = C.LADDER.x, rcy = R.y0 - 2;
    for (let i = 0; i < rings.length; i++) { ctx.strokeStyle = rings[i]; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(rcx, rcy, 76 - i * 7, Math.PI, 0); ctx.stroke(); }
    ctx.fillStyle = '#fff'; for (const [dx, dy] of [[-70, -4], [70, -4]]) { ctx.beginPath(); ctx.arc(rcx + dx, rcy + dy, 10, 0, Math.PI * 2); ctx.arc(rcx + dx - 10, rcy + dy + 4, 7, 0, Math.PI * 2); ctx.arc(rcx + dx + 10, rcy + dy + 4, 7, 0, Math.PI * 2); ctx.fill(); }   // clouds at the rainbow's feet
    // bunting along the top of the back wall
    for (let x = R.x0 - w, i = 0; x < R.x1 + w; x += 18, i++) { ctx.fillStyle = ['#ff8fab', '#ffd166', '#41b883', '#3b7dd8', '#8e5bd1'][i % 5]; ctx.beginPath(); ctx.moveTo(x, C.BACK_TOP); ctx.lineTo(x + 18, C.BACK_TOP); ctx.lineTo(x + 9, C.BACK_TOP + 12); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    const stripes = (x, y, ww, hh, vertical) => {
      ctx.fillStyle = '#ff8fab'; ctx.fillRect(x, y, ww, hh);
      ctx.fillStyle = '#fff8ee';
      if (vertical) { for (let yy = y; yy < y + hh; yy += 16) ctx.fillRect(x, yy, ww, 8); } else { for (let xx = x; xx < x + ww; xx += 16) ctx.fillRect(xx, y, 8, hh); }
    };
    stripes(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w, false); stripes(R.x0 - w, R.y0, w, R.y1 - R.y0, true); stripes(R.x1, R.y0, w, R.y1 - R.y0, true);
    ctx.fillStyle = '#e4a0b8'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // shelves of jars, the licorice ladder between them
    this.paintShelf(r, C.SHELF_L, 1); this.paintShelf(r, C.SHELF_R, 5);
    const L = C.LADDER;
    ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) { const yy = L.bottom - 8 - k * 12, lean = (L.bottom - yy) / (L.bottom - L.top) * 4; ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L.x - 12 + lean, yy); ctx.lineTo(L.x + 12 - lean, yy); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(L.x - 12 + lean, yy); ctx.lineTo(L.x + 12 - lean, yy); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(L.x - 14, L.bottom); ctx.lineTo(L.x - 10, L.top); ctx.moveTo(L.x + 14, L.bottom); ctx.lineTo(L.x + 10, L.top); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L.x - 15, L.bottom); ctx.lineTo(L.x - 11, L.top); ctx.moveTo(L.x + 13, L.bottom); ctx.lineTo(L.x + 9, L.top); ctx.stroke();
    // the gumball machine's chrome plate and the fountain's drip tray (the machines themselves are drawn live)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(C.GUMBALL.x + 2, C.GUMBALL.y + 10, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(C.FOUNTAIN.x + 2, C.FOUNTAIN.y + 10, 44, 16, 0, 0, Math.PI * 2); ctx.fill();
    // the pick-and-mix counter: a white counter with rows of candy bins and scoops, a paper-bag holder
    const P = C.PICKMIX;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(P.x0 + 4, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0);
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 6); ctx.fill();
    ctx.fillStyle = '#fff8ee'; for (let x = P.x0 + 8; x < P.x1 - 6; x += 16) ctx.fillRect(x, P.y0 + 16, 8, P.y1 - P.y0 - 20);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, P.x0 - 2, P.y0 - 8, P.x1 - P.x0 + 4, 24, 6); ctx.fill();
    const binCols = ['#ff5c8a', '#ffd166', '#41b883', '#3b7dd8', '#8e5bd1', '#ff8c42'];
    for (let i = 0; i < 6; i++) {
      const bx = P.x0 + 10 + i * 20, by = P.y0 - 4;
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; U.roundRect(ctx, bx, by, 17, 16, 3); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1; U.roundRect(ctx, bx, by, 17, 16, 3); ctx.stroke();
      for (let j = 0; j < 6; j++) { ctx.fillStyle = j % 3 === 2 ? '#fff8ee' : binCols[i]; ctx.beginPath(); ctx.arc(bx + 4 + (j % 3) * 5, by + 5 + Math.floor(j / 3) * 6, 2.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 13, by + 2); ctx.lineTo(bx + 16, by - 5); ctx.stroke();   // a scoop handle
    }
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(P.x1 - 24, P.y0 - 20, 14, 18); ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1; ctx.strokeRect(P.x1 - 24, P.y0 - 20, 14, 18); ctx.fillStyle = '#e4572e'; for (let k = 0; k < 3; k++) ctx.fillRect(P.x1 - 22 + k * 5, P.y0 - 18, 2, 14);   // striped paper bags
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (P.x0 + P.x1) / 2 - 34, P.y1 - 14, 68, 12, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PICK & MIX', (P.x0 + P.x1) / 2, P.y1 - 8);
    // gumdrops in the candy-cane corner
    for (const c of C.CANES) for (let k = 0; k < 2; k++) { ctx.fillStyle = k ? '#ffd166' : '#41b883'; ctx.beginPath(); ctx.arc(c.x + 10 + k * 7, c.y + 2 + k * 3, 3.5, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(c.x + 8 + k * 7, c.y + 1 + k * 3, 2, 1); }
    // the door in the bottom wall, its mat, and the shop's name plate below
    const E = C.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#ff8fab'; ctx.fillRect(E.x - 21 + i * 6, E.y - 8, 6, 14); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 46, R.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🍬 CANDY 🍬', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the shop's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.CANDY.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  gumPos(g) {
    // where the rolling gumball is right now (world coords), or null
    const gm = this.st.gum; if (!gm) return null;
    const C = CFG.CANDY, G = C.GUMBALL, gx = G.x, gy = G.y - 50, p = g.player;
    if (gm.t < C.GUM_SPIRAL) { const k = U.easeOut(gm.t / C.GUM_SPIRAL), a = Math.PI / 2 + k * Math.PI * 6, rad = 2 + k * 14; return { x: gx + Math.cos(a) * rad, y: gy + Math.sin(a) * rad * 0.85, phase: 0 }; }
    if (gm.t < C.GUM_SPIRAL + C.GUM_DROP) { const k = (gm.t - C.GUM_SPIRAL) / C.GUM_DROP; return { x: gx, y: U.lerp(gy + 14, G.y - 6, k * k), phase: 1 }; }
    const k = U.clamp((gm.t - C.GUM_SPIRAL - C.GUM_DROP) / C.GUM_FLY, 0, 1), f = p.facing || 1;
    return { x: U.lerp(gx, p.x + f * 14, k), y: U.lerp(G.y - 6, p.y - 18, k) - Math.sin(k * Math.PI) * 24, phase: 2 };
  },
  drawGumballMachine(r, g) {
    const ctx = r.ctx, C = CFG.CANDY, G = C.GUMBALL, x = G.x, y = G.y, st = this.st, pressed = st.gum && st.gum.t < 0.25;
    // base, chute flap and post
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, x - 16, y - 22, 32, 30, 6); ctx.fill();
    ctx.fillStyle = '#e53935'; U.roundRect(ctx, x - 13, y - 19, 26, 20, 5); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x - 7, y - 12, 14, 10, 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 5, y - 6, 10, 2);
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, x - 11, y - 30, 22, 10, 3); ctx.fill();
    // the big red button on a chrome plate, right of the base
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x + 14, y - 20, 14, 12, 3); ctx.fill();
    ctx.fillStyle = pressed ? '#b71c1c' : '#ff5252'; ctx.beginPath(); ctx.arc(x + 21, y - 14, pressed ? 3.5 : 4.5, 0, Math.PI * 2); ctx.fill();
    if (!pressed) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x + 20, y - 15.5, 1.5, 0, Math.PI * 2); ctx.fill(); }
    // the glass globe full of gumballs, with the spiral track
    const gy = y - 50;
    ctx.fillStyle = 'rgba(220,240,255,0.6)'; ctx.beginPath(); ctx.arc(x, gy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, gy, 19, 0, Math.PI * 2); ctx.clip();
    for (let j = 0; j < 22; j++) { const h = Math.sin(j * 12.99) * 43758.5; const fr = h - Math.floor(h), a = fr * Math.PI * 2, rad = 6 + ((j * 7) % 13); ctx.fillStyle = C.GUMS[j % 6][0]; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rad, gy + Math.sin(a) * rad * 0.9 + 2, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rad - 1, gy + Math.sin(a) * rad * 0.9 + 1, 1.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let a = 0; a <= Math.PI * 6; a += 0.2) { const k = a / (Math.PI * 6), rad = 2 + k * 14, px = x + Math.cos(Math.PI / 2 + a) * rad, py = gy + Math.sin(Math.PI / 2 + a) * rad * 0.85; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
    const gp = this.gumPos(g);
    if (gp && gp.phase === 0) { ctx.fillStyle = st.gum.col; ctx.beginPath(); ctx.arc(gp.x, gp.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(gp.x - 1.5, gp.y - 1.5, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - 9, gy - 9, 4, 7, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, gy, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(x, gy - 20, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(x, gy - 22, 2.5, 0, Math.PI * 2); ctx.fill();
    if (gp && gp.phase === 1) { ctx.fillStyle = st.gum.col; ctx.beginPath(); ctx.arc(gp.x, gp.y, 4.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GUMBALLS', x, y - 26);
  },
  drawFountain(r, g) {
    const ctx = r.ctx, F = CFG.CANDY.FOUNTAIN, x = F.x, y = F.y, t = g.time, choc = '#6b3a1a', light = '#8d4f24', dark = '#4a2612';
    // the basin: a pool of chocolate with shimmering ripples
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(x, y + 4, 40, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(x, y + 6, 40, 17, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = choc; ctx.beginPath(); ctx.ellipse(x, y + 2, 34, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(x, y + 4, 6 + ph * 26, 2.5 + ph * 9, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // the column and three tiers, chocolate sheeting over each edge with a wavy animated hem
    const tiers = [{ y: y - 46, rx: 9 }, { y: y - 30, rx: 17 }, { y: y - 14, rx: 25 }];
    ctx.fillStyle = light; ctx.fillRect(x - 4, y - 52, 8, 56);
    for (let i = 0; i < tiers.length; i++) {
      const T = tiers[i], next = tiers[i + 1] ? tiers[i + 1].y : y + 2;
      ctx.fillStyle = choc; ctx.beginPath(); ctx.moveTo(x - T.rx, T.y);
      for (let k = 0; k <= 10; k++) { const px = x - T.rx + (k / 10) * T.rx * 2, wave = Math.sin(k * 1.7 + t * 6 + i) * 2.5; ctx.lineTo(px, next + 2 + wave); }
      ctx.lineTo(x + T.rx, T.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(x, T.y, T.rx, T.rx * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x - T.rx * 0.3, T.y - 1, T.rx * 0.4, T.rx * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = dark; for (let k = 0; k < 3; k++) { const ph = (t * 1.3 + k * 0.33 + i * 0.2) % 1; ctx.beginPath(); ctx.arc(x - T.rx + 4 + ((k * 11 + i * 5) % (T.rx * 2 - 8)), next + 2 + ph * 6, 1.8 * (1 - ph) + 0.6, 0, Math.PI * 2); ctx.fill(); }
    }
    // the spout on top, chocolate welling up
    const well = 1 + Math.sin(t * 5) * 0.25;
    ctx.fillStyle = choc; ctx.beginPath(); ctx.ellipse(x, y - 54, 5 * well, 4 * well, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - 1.5, y - 56, 1.5, 0, Math.PI * 2); ctx.fill();
    // strawberries and marshmallows on sticks at the rim
    for (let k = 0; k < 4; k++) {
      const sx = [x - 36, x - 24, x + 18, x + 30][k], sy = y + 12;
      ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy - 14); ctx.stroke();
      if (k % 2) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(sx + 4, sy - 11); ctx.lineTo(sx + 9, sy - 19); ctx.lineTo(sx - 1, sy - 19); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#41b883'; ctx.fillRect(sx + 1, sy - 21, 6, 2.5); } else { ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, sx, sy - 21, 8, 8, 2); ctx.fill(); ctx.fillStyle = choc; U.roundRect(ctx, sx, sy - 16, 8, 3, 1); ctx.fill(); }
    }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CHOCOLATE', x, y + 14);
  },
  drawCottonMachine(r, g) {
    const ctx = r.ctx, C = CFG.CANDY.COTTON, x = C.x, y = C.y, st = this.st, spin = st.spin;
    // the stand
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 18, y - 2, 5, 12); ctx.fillRect(x + 13, y - 2, 5, 12); ctx.fillRect(x - 22, y + 8, 44, 4);
    // the drum: a silver bowl with a pink inside and a whirling spinner
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x - 24, y - 20, 48, 20, 6); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(x - 24, y - 12, 48, 3);
    ctx.fillStyle = '#ffb6d5'; ctx.beginPath(); ctx.ellipse(x, y - 20, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd1e3'; ctx.beginPath(); ctx.ellipse(x, y - 20, 18, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const a = st.drum + k * Math.PI * 2 / 3; ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x + Math.cos(a) * 16, y - 20 + Math.sin(a) * 5.5); ctx.stroke(); }
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(x, y - 20, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y - 20, 24, 9, 0, 0, Math.PI * 2); ctx.stroke();
    // pink floss whirling out of the drum while it spins
    if (spin > 0.05) {
      ctx.fillStyle = `rgba(255,182,213,${(0.35 + spin * 0.4).toFixed(2)})`;
      for (const w of st.wisps) { const k = w.t / 1.2, a = w.a + st.drum * 0.4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * w.r * (1 + k * 0.4), y - 22 + Math.sin(a) * w.r * 0.35 - k * 18, 3 + k * 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,143,171,0.6)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const a = st.drum * 0.8 + k * 2.1; ctx.beginPath(); ctx.arc(x, y - 20, 12 + k * 3, a, a + 1.2 * spin); ctx.stroke(); }
    }
    // a cup of paper sticks and a little sign
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x + 26, y - 6, 10, 12, 2); ctx.fill(); ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 28 + k * 3, y - 6); ctx.lineTo(x + 27 + k * 4, y - 20); ctx.stroke(); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COTTON CANDY', x, y - 6);
  },
  drawCane(r, g, c) {
    const ctx = r.ctx, x = c.x, y = c.y;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 2, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    const path = () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.arc(x - 7, y - 40, 7, 0, Math.PI, true); ctx.lineTo(x - 14, y - 32); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 11; path(); ctx.stroke();
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 9; path(); ctx.stroke();
    ctx.strokeStyle = c.c; ctx.lineWidth = 9; ctx.setLineDash([6, 6]); ctx.lineCap = 'butt'; path(); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 3, y - 2); ctx.lineTo(x - 3, y - 38); ctx.stroke();
  },
  drawKeeper(r, g) {
    const ctx = r.ctx, K = CFG.CANDY.KEEPER, p = g.player, t = g.time, f = p.x < K.x ? -1 : 1, x = K.x;
    // waves when the chef comes near: a happy hop and a 👋 beside the head (no arm reaching up)
    const near = U.dist(p.x, p.y, K.x, K.y) < 110, y = K.y - (near ? Math.abs(Math.sin(t * 7)) * 3 : 0);
    r.drawPerson(x, y, { shirt: '#ff8fab', stripes: true, skin: '#c68642', hat: 'cap', capColor: '#ffd166', facing: f, moving: false, bob: 0, carry: 0, pants: '#4a4a4a', apron: '#fff8ee' });
    // a very big smile over the little one
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + f * 2, y - 35, 5.5, Math.PI * 0.08, Math.PI * 0.92); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + f * 2, y - 35, 5.5, Math.PI * 0.08, Math.PI * 0.92); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x + f * 2, y - 32, 2.2, 0, Math.PI); ctx.fill();
    if (near) { ctx.save(); ctx.translate(x + f * 22, y - 46); ctx.rotate(Math.sin(t * 9) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore(); }
  },
  drawCotton(r, g) {
    // the pink cloud on a stick in the chef's hand
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 24 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y + 16); ctx.stroke();
    ctx.fillStyle = '#ffb6d5';
    for (const [dx, dy, rr] of [[0, -4, 8], [-6, 0, 6], [6, 0, 6], [-3, -9, 5], [4, -9, 5], [0, 3, 5]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy + Math.sin(t * 3 + dx) * 0.5, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - 3, y - 7, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  drawBag(r, g) {
    // the striped pick-and-mix bag in the chef's other hand
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x - f * 15, y = p.y - 14 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 6, y - 8, 12, 16, 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 5 + k * 4, y - 7, 2, 14);
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; U.roundRect(ctx, x - 6, y - 8, 12, 16, 2); ctx.stroke();
    for (const [dx, col] of [[-3, '#ffd166'], [1, '#41b883'], [4, '#3b7dd8']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + dx, y - 9, 2.4, 0, Math.PI * 2); ctx.fill(); }
  },
  dynamic(r, g) {
    if (!this.st) return;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      // the giant lollipop stands against the facade right of the door, clear of whoever stands there
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40;
      this.drawLollipop(r, g, cx + 42, gy + 10, 15, g.time * 0.8);
      return;
    }
    if (g.area !== 'candy') return;
    this.drawOutside(r, g);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, C = CFG.CANDY;
    if (!g.driving && !g.onTrain) {
      if (st.cotton > 0) items.push({ y: p.y + 1, draw: () => this.drawCotton(r, g) });
      if (st.bag > 0) items.push({ y: p.y + 1, draw: () => this.drawBag(r, g) });
    }
    if (g.area !== 'candy') return;
    items.push({ y: C.GUMBALL.y + 8, draw: () => this.drawGumballMachine(r, g) });
    items.push({ y: C.FOUNTAIN.y + 16, draw: () => this.drawFountain(r, g) });
    items.push({ y: C.COTTON.y + 12, draw: () => this.drawCottonMachine(r, g) });
    for (const c of C.CANES) items.push({ y: c.y, draw: () => this.drawCane(r, g, c) });
    items.push({ y: C.KEEPER.y, draw: () => this.drawKeeper(r, g) });
    const gp = this.gumPos(g);
    if (gp && gp.phase === 2) items.push({ y: p.y + 2, draw: () => { const ctx = r.ctx; ctx.fillStyle = st.gum.col; ctx.beginPath(); ctx.arc(gp.x, gp.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(gp.x - 1.5, gp.y - 1.5, 1.5, 0, Math.PI * 2); ctx.fill(); } });
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(CandyExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(CandyExt);
