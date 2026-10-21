'use strict';
// The Pet Shop: City building 4 (top row, facing Bus Street). Go in through the door under the awning and
// you are in a lively little shop: a puppy pen (two puppies run to the fence and wag when you come close;
// pat them for hearts), a kitten tower with a kitten batting a toy, a fish tank wall with bubbles, a parrot
// that says "Pizza!" when you press its button, a hamster wheel, a bunny hutch and a friendly shopkeeper.
// Two circles: a $4 bag of treats the chef carries for 30 s (the puppies hop out and follow while you have
// it) and a $6 goldfish bowl picture that hangs on the shop wall for good.
// Extension module: registered with Game.ext (first in line) and Render.ext. See js/EXTENSIONS.md.
CFG.PETSHOP = {
  WORLD: { x0: 2300, y0: 3000, x1: 2900, y1: 3400 },          // reserved interior rect for City building 4
  ROOM: { x0: 2330, y0: 3040, x1: 2870, y1: 3370 }, WALL: 24,
  DOOR: { x: 5530, y: 14 },                                      // the door spot on the City sidewalk (building index 4)
  EXIT: { x: 2600, y: 3346 },                                    // the mat inside the door (the door is in the bottom wall)
  COUNTER: { x0: 2350, y0: 3066, x1: 2510, y1: 3104 },
  KEEPER: { x: 2430, y: 3058 },
  PICTURE: { x: 2490, y: 3029, w: 44, h: 30 },                   // where the goldfish bowl picture hangs once bought
  TANK: { x0: 2556, y0: 3044, x1: 2786, y1: 3108 },
  PEN: { x0: 2352, y0: 3150, x1: 2502, y1: 3250 },
  PUPPIES: [{ x: 2392, y: 3205, col: '#e0a85c', dark: '#b8803a' }, { x: 2462, y: 3218, col: '#f4ede0', dark: '#8a5a26', spots: true }],
  PADS: { treats: { x: 2580, y: 3190 }, bowl: { x: 2700, y: 3190 } },
  PERCH: { x: 2760, y: 3262 }, BUTTON: { x: 2794, y: 3272 },
  TOWER: { x0: 2804, y0: 3140, x1: 2858, y1: 3220 },
  HAMSTER: { x0: 2346, y0: 3296, x1: 2420, y1: 3352 },
  HUTCH: { x0: 2776, y0: 3294, x1: 2860, y1: 3352 },
  RUG: { x: 2640, y: 3272, rx: 70, ry: 34 },
  TREATS: 30,                                                    // seconds a bag of treats lasts
  WORDS: ['Pizza! 🍕', 'Hello! 🦜', 'Pretty bird!', 'Pizza! 🍕', 'Yum yum!'],
};
CFG.AREAS.petshop = { WORLD: CFG.PETSHOP.WORLD };

const PetShopExt = {
  defaults: { petshop: { seen: false, bowlPic: false } },
  build(g) {
    if (!g.s.petshop) g.s.petshop = { seen: false, bowlPic: false };
    const K = CFG.PETSHOP;
    this.st = {
      fade: 0, treats: 0, pats: 0,
      puppies: K.PUPPIES.map((h) => ({ x: h.x, y: h.y, home: { x: h.x, y: h.y }, tx: h.x, ty: h.y, facing: 1, moving: false, bob: 0, wag: 0, jump: 0, idle: U.rand(0.5, 2), out: false })),
      parrot: { say: null, sayT: 0, word: 0, flap: 0, presses: 0 },
      cat: { bat: 0, batT: 2, swing: 0.3 },
      bunny: { hop: 0, twitch: 0 },
      hamster: { ang: 0, speed: 3 },
    };
  },
  isInside(g) { return g.area === 'petshop'; },
  onFoot(g) {
    if (g.driving || g.onTrain || g.travel || g.ride || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && CityExt.st && (CityExt.st.cab || CityExt.st.boarding || CityExt.floor)) return false;
    return true;
  },
  atDoor(g) { const D = CFG.PETSHOP.DOOR, p = g.player; return g.area === 'city' && U.dist(p.x, p.y, D.x, D.y) < 30; },

  // ---------- walls and furniture ----------
  blocks() {
    const K = CFG.PETSHOP, R = K.ROOM, w = K.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const b of [K.COUNTER, K.TANK, K.PEN, K.TOWER, K.HAMSTER, K.HUTCH]) o.push({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    o.push({ x: K.PERCH.x - 9, y: K.PERCH.y - 7, w: 18, h: 12 });
    o.push({ x: K.BUTTON.x - 7, y: K.BUTTON.y - 7, w: 14, h: 12 });
    return o;
  },
  obstacles(g) { return this.isInside(g) ? this.blocks() : []; },
  // Can the chef stand here: inside the room and not in a wall or a piece of furniture?
  free(x, y, blocks) {
    const R = CFG.PETSHOP.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of blocks || this.blocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  rescue(g) {
    const p = g.player, E = CFG.PETSHOP.EXIT;
    if (this.free(p.x, p.y)) return false;
    p.x = E.x; p.y = E.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },

  // ---------- doors ----------
  enter(g) {
    const E = CFG.PETSHOP.EXIT, p = g.player;
    g.area = 'petshop'; p.x = E.x; p.y = E.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.petshop.seen) { g.s.petshop.seen = true; g.toast('🐾 Welcome to the Pet Shop!', true); }
  },
  leave(g) {
    const D = CFG.PETSHOP.DOOR, p = g.player;
    g.area = 'city'; p.x = D.x; p.y = D.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.drop();
  },
  home(g) {
    const st = this.st; if (!st) return;
    st.fade = 0; st.treats = 0; st.parrot.say = null; st.parrot.sayT = 0;
    for (const q of st.puppies) { q.x = q.home.x; q.y = q.home.y; q.tx = q.x; q.ty = q.y; q.out = false; q.moving = false; q.jump = 0; }
  },

  // ---------- the big button ----------
  action(g) {
    if (!this.st || !this.onFoot(g)) return null;
    const p = g.player, K = CFG.PETSHOP;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (!this.isInside(g)) return null;
    if (U.dist(p.x, p.y, K.EXIT.x, K.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.nearPen(g)) return { label: '🐾 Pat the puppies', run: (gg) => this.pat(gg) };
    if (this.nearPerch(g)) return { label: '🦜 Press the button', run: (gg) => this.pressButton(gg) };
    return null;
  },
  nearPen(g) { const p = g.player; return g.hitRect(p.x, p.y, 40, this.rect(CFG.PETSHOP.PEN)); },
  nearPerch(g) { const p = g.player, K = CFG.PETSHOP; return U.dist(p.x, p.y, K.PERCH.x, K.PERCH.y) < 52 || U.dist(p.x, p.y, K.BUTTON.x, K.BUTTON.y) < 40; },
  rect(b) { return { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 }; },
  pat(g) {
    const st = this.st; st.pats++;
    g.s.stats = g.s.stats || {}; g.s.stats.puppyPats = (g.s.stats.puppyPats || 0) + 1;
    for (const q of st.puppies) { q.jump = 0.5; for (let i = 0; i < 3; i++) g.floats.push({ x: q.x + U.rand(-12, 12), y: q.y - 30 - i * 6, text: '♥', color: '#ff6b8a', t: -i * 0.12, dur: 1.1, big: i === 0 }); }
    Sfx.pickup(); Haptics.tap();
  },
  pressButton(g) {
    const pr = this.st.parrot, K = CFG.PETSHOP;
    pr.say = K.WORDS[pr.word % K.WORDS.length]; pr.word++; pr.sayT = 2.6; pr.flap = 0.8; pr.presses++;
    Sfx.ding(); Haptics.tap();
  },

  // ---------- circles ----------
  pads(g) {
    if (!this.isInside(g) || !this.st) return [];
    const K = CFG.PETSHOP, out = [{ key: 'petTreats', label: 'Bag of treats', ico: '🦴', pos: K.PADS.treats, price: 4, sub: 'yum yum!' }];
    if (!g.s.petshop.bowlPic) out.push({ key: 'petBowlPic', label: 'Goldfish picture', ico: '🐟', pos: K.PADS.bowl, price: 6, sub: 'for the wall' });
    return out;
  },
  onPad(g, pad) {
    const p = g.player; g.s.stats = g.s.stats || {};
    if (pad.key === 'petTreats') { this.st.treats = CFG.PETSHOP.TREATS; g.s.stats.treatBags = (g.s.stats.treatBags || 0) + 1; g.floats.push({ x: p.x, y: p.y - 60, text: 'Treats! 🦴', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'petBowlPic') { g.s.petshop.bowlPic = true; g.floats.push({ x: p.x, y: p.y - 60, text: 'A picture for the wall! 🐟', color: '#ffe08a', t: 0, dur: 1.6, big: true }); const P = CFG.PETSHOP.PICTURE; for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: P.x + U.rand(-24, 24), y0: P.y + U.rand(-16, 16), x1: 0, y1: 0, t: -i * 0.08, dur: 0.5 }); }
    Haptics.success();
  },

  // ---------- hints ----------
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, K = CFG.PETSHOP, st = this.st;
    if (g.area === 'city') {
      if (!this.onFoot(g) || U.dist(p.x, p.y, K.DOOR.x, K.DOOR.y) > 110) return undefined;
      return { text: 'Go inside the Pet Shop! 🐾', target: this.atDoor(g) ? null : K.DOOR };
    }
    if (!this.isInside(g)) return undefined;
    if (st.parrot.sayT > 0) return { text: 'The parrot can talk! 🦜', target: null };
    if (this.nearPen(g)) return { text: st.treats > 0 ? 'The puppies love treats! 🦴' : 'Pat the puppies! 🐾', target: null };
    if (this.nearPerch(g)) return { text: 'Press the button! 🦜', target: null };
    if (st.treats > 0) return { text: 'The puppies are following you! 🐶', target: null };
    if (g.s.cash >= 4 && !st.pats) return { text: 'Pat the puppies! 🐾', target: { x: K.PEN.x1 + 20, y: (K.PEN.y0 + K.PEN.y1) / 2 } };
    if (g.s.cash >= 4) return { text: 'Buy a bag of treats 🦴', target: K.PADS.treats };
    if (!g.s.petshop.bowlPic && g.s.cash >= 6) return { text: 'Buy the goldfish picture 🐟', target: K.PADS.bowl };
    return { text: 'Say hello to the animals! 🐾', target: null };
  },

  // ---------- simulation ----------
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, K = CFG.PETSHOP;
    st.fade = Math.max(0, st.fade - dt);
    if (st.treats > 0) { st.treats -= dt; if (st.treats <= 0) { st.treats = 0; g.floats.push({ x: p.x, y: p.y - 60, text: 'All gone! 🦴', color: '#ffe08a', t: 0, dur: 1.4, big: true }); } }
    const inside = this.isInside(g);
    if (inside) this.rescue(g);
    // the parrot
    const pr = st.parrot; pr.flap = Math.max(0, pr.flap - dt);
    if (pr.sayT > 0) { pr.sayT -= dt; if (pr.sayT <= 0) { pr.sayT = 0; pr.say = null; } }
    // the kitten bats its toy every couple of seconds (more often when you watch)
    const c = st.cat; c.bat = Math.max(0, c.bat - dt); c.batT -= dt * (inside && U.dist(p.x, p.y, K.TOWER.x0, K.TOWER.y1) < 110 ? 2 : 1);
    if (c.batT <= 0) { c.batT = U.rand(1.6, 3.2); c.bat = 0.35; c.swing = 1; }
    c.swing = Math.max(0.3, c.swing - dt * 0.35);
    // the bunny hops when you come to the hutch; the hamster runs faster
    const b = st.bunny; b.twitch += dt; b.hop = Math.max(0, b.hop - dt);
    const nearHutch = inside && g.hitRect(p.x, p.y, 50, this.rect(K.HUTCH)), nearCage = inside && g.hitRect(p.x, p.y, 50, this.rect(K.HAMSTER));
    if (nearHutch && b.hop <= 0 && Math.random() < dt * 1.2) b.hop = 0.45;
    const h = st.hamster; h.speed += ((nearCage ? 9 : 3) - h.speed) * Math.min(1, dt * 2); h.ang += h.speed * dt;
    // the puppies
    const PEN = K.PEN, nearPen = inside && g.hitRect(p.x, p.y, 100, this.rect(PEN));
    const following = inside && st.treats > 0;
    st.puppies.forEach((q, i) => {
      q.wag += dt * (nearPen || following ? 16 : 6); q.jump = Math.max(0, q.jump - dt);
      if (following) {
        q.out = true;
        q.tx = p.x - p.facing * (30 + i * 28); q.ty = p.y + (i ? 14 : -4);
      } else if (q.out) {
        q.tx = q.home.x; q.ty = q.home.y;
        if (U.dist(q.x, q.y, q.tx, q.ty) < 2) q.out = false;
      } else if (nearPen) {
        // run to the bit of fence nearest the chef and wag
        const side = p.x < PEN.x0 || p.x > PEN.x1;
        q.tx = U.clamp(p.x + (side ? 0 : (i ? 16 : -16)), PEN.x0 + 16, PEN.x1 - 16);
        q.ty = U.clamp(p.y + (side ? (i ? 14 : -14) : 0), PEN.y0 + 20, PEN.y1 - 12);
      } else {
        q.idle -= dt;
        if (q.idle <= 0) { q.idle = U.rand(1.2, 3); q.tx = U.rand(PEN.x0 + 18, PEN.x1 - 18); q.ty = U.rand(PEN.y0 + 22, PEN.y1 - 12); }
      }
      const d = U.dist(q.x, q.y, q.tx, q.ty), speed = following ? 150 : nearPen || q.out ? 130 : 55;
      if (d > (following ? 6 : 1)) { U.moveToward(q, q.tx, q.ty, speed, dt); q.bob += dt * 14; }
      else { q.moving = false; if (nearPen || following) q.facing = p.x < q.x ? -1 : 1; }
    });
  },

  // ---------- static art ----------
  paint: { petshop(r, g) { PetShopExt.paintShop(r, g); } },
  paintShop(r, g) {
    const ctx = r.ctx, K = CFG.PETSHOP, R = K.ROOM, w = K.WALL, W = K.WORLD;
    // outside the shop: the City's pavement, a kerb and the street below
    ctx.fillStyle = '#b9bcc3'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let x = W.x0; x <= W.x1; x += 40) { ctx.beginPath(); ctx.moveTo(x, W.y0); ctx.lineTo(x, W.y1); ctx.stroke(); }
    for (let y = W.y0; y <= W.y1; y += 40) { ctx.beginPath(); ctx.moveTo(W.x0, y); ctx.lineTo(W.x1, y); ctx.stroke(); }
    // floor: cream and mint checks
    ctx.fillStyle = '#f6efe0'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = '#d9efe0';
    for (let y = R.y0, j = 0; y < R.y1; y += 30, j++) for (let x = R.x0 + (j % 2) * 30; x < R.x1; x += 60) ctx.fillRect(x, y, Math.min(30, R.x1 - x), Math.min(30, R.y1 - y));
    // a round rug in the middle of the floor
    const G = K.RUG;
    ctx.fillStyle = '#f2a65a'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7c58a'; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx - 14, G.ry - 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a65a'; for (const [dx, dy] of [[-26, -6], [0, 8], [26, -6]]) this.paw(ctx, G.x + dx, G.y + dy, 1, '#e4874a');
    // walls: warm wood with a lighter top edge
    ctx.fillStyle = '#b8743f';
    ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 5);
    // the door in the bottom wall, with its mat inside
    const E = K.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + w / 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c3a'; U.roundRect(ctx, E.x - 26, E.y - 10, 52, 18, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐾 PET SHOP', E.x, E.y - 1);
    // the counter: wood top, a till and a jar of treats
    const C = K.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 3, C.y0 + 4, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 5); ctx.fill();
    ctx.fillStyle = '#a86b36'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, 14, 5); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, C.x0 + 14, C.y0 - 10, 30, 20, 3); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(C.x0 + 18, C.y0 - 7, 22, 7); ctx.fillStyle = '#ffd166'; ctx.fillRect(C.x0 + 18, C.y0 + 3, 22, 4);
    ctx.fillStyle = 'rgba(190,230,255,0.75)'; U.roundRect(ctx, C.x1 - 40, C.y0 - 12, 24, 24, 5); ctx.fill(); ctx.fillStyle = '#f2a65a'; for (let i = 0; i < 5; i++) ctx.fillRect(C.x1 - 36 + (i % 3) * 6, C.y0 - 2 + Math.floor(i / 3) * 5, 4, 3); ctx.fillStyle = '#c45c3a'; ctx.fillRect(C.x1 - 40, C.y0 - 14, 24, 4);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, C.x0 + 56, C.y0 + 18, 50, 12, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('PAY HERE', C.x0 + 81, C.y0 + 24);
    // the fish tank: a glass box set into the top wall (the fish and bubbles swim in the dynamic pass)
    const T = K.TANK;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(T.x0 - 4, T.y0 - 8, T.x1 - T.x0 + 8, 10);
    const grd = ctx.createLinearGradient(0, T.y0, 0, T.y1); grd.addColorStop(0, '#5fc3f0'); grd.addColorStop(1, '#2d8fd4');
    ctx.fillStyle = grd; ctx.fillRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#d9c38a'; ctx.fillRect(T.x0, T.y1 - 9, T.x1 - T.x0, 9);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = ['#c9a86a', '#e0d0a0', '#b08a52'][i % 3]; ctx.beginPath(); ctx.arc(T.x0 + 6 + ((i * 53) % (T.x1 - T.x0 - 12)), T.y1 - 4 - ((i * 7) % 5), 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#3fa66b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [px, hh] of [[T.x0 + 24, 36], [T.x0 + 36, 26], [T.x1 - 30, 40], [T.x1 - 44, 24], [T.x0 + 150, 30]]) { ctx.beginPath(); ctx.moveTo(px, T.y1 - 8); ctx.quadraticCurveTo(px + 6, T.y1 - 8 - hh / 2, px - 2, T.y1 - 8 - hh); ctx.stroke(); }
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, T.x0 + 110, T.y1 - 22, 26, 16, 3); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(T.x0 + 116, T.y1 - 20, 14, 4);   // a little treasure chest
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(T.x0 + 6, T.y0 + 4, 30, 4);
    // the puppy pen: straw floor and a back fence (the front rail is drawn over the puppies)
    const P = K.PEN;
    ctx.fillStyle = '#f0dba0'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
    ctx.strokeStyle = '#d9b860'; ctx.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const sx = P.x0 + 6 + ((i * 37) % (P.x1 - P.x0 - 12)), sy = P.y0 + 8 + ((i * 23) % (P.y1 - P.y0 - 16)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 7, sy + 3); ctx.stroke(); }
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, P.x0 + 14, P.y0 + 14, 30, 18, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(P.x0 + 29, P.y0 + 23, 10, 5, 0, 0, Math.PI * 2); ctx.fill();   // water bowl
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(P.x1 - 24, P.y0 + 26, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(P.x1 - 26, P.y0 + 24, 2, 0, Math.PI * 2); ctx.fill();   // a ball
    this.fence(ctx, P.x0, P.y0, P.x1 - P.x0, true);
    this.fencePost(ctx, P.x0 + 3, P.y0, P.y1); this.fencePost(ctx, P.x1 - 3, P.y0, P.y1);
    // shelves of pet food on the left wall below the counter
    for (let k = 0; k < 2; k++) { const sy = 3118 + k * 16; ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0, sy, 46, 4); for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883', '#f2b134'][(i + k) % 4]; ctx.fillRect(R.x0 + 2 + i * 11, sy - 10, 8, 10); } }
    // a poster on the top wall between the counter and the tank
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(2518, 3018, 30, 20); ctx.fillStyle = '#e4572e'; ctx.font = r.font(9); ctx.fillText('🐶', 2533, 3028);
  },
  fence(ctx, x, y, len, back) {
    ctx.fillStyle = back ? '#c9975a' : '#d9a86a';
    for (let px = x + 4; px < x + len - 2; px += 12) { U.roundRect(ctx, px, y - 16, 6, 20, 2); ctx.fill(); }
    ctx.fillStyle = back ? '#b8864a' : '#c9975a'; ctx.fillRect(x, y - 12, len, 4); ctx.fillRect(x, y - 3, len, 4);
  },
  fencePost(ctx, x, y0, y1) { ctx.fillStyle = '#c9975a'; ctx.fillRect(x - 3, y0 - 14, 6, y1 - y0 + 14); ctx.fillStyle = '#a8743a'; ctx.fillRect(x - 3, y0 - 14, 6, 4); },
  paw(ctx, x, y, s, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y + 2 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy] of [[-5, -4], [-1.8, -6.5], [1.8, -6.5], [5, -4]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, 1.8 * s, 0, Math.PI * 2); ctx.fill(); }
  },
  // the shop front in the City: a sign over the awning, a paw-print mat and a little window display
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = CFG.CITY.BUILDINGS[4], cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🐾 PET SHOP';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // the paw-print mat on the sidewalk just below the door
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, cx - 18, b.y1 + 4, 40, 14, 4); ctx.fill();
    ctx.fillStyle = '#c45c3a'; U.roundRect(ctx, cx - 20, b.y1 + 2, 40, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(cx - 17, b.y1 + 4, 34, 1); ctx.fillRect(cx - 17, b.y1 + 13, 34, 1);
    this.paw(ctx, cx, b.y1 + 9, 0.8, '#ffe08a');
    // window display: a goldfish bowl on the right, a dog bed with a bone on the left
    const wy = gy + 8;
    ctx.fillStyle = 'rgba(120,200,255,0.9)'; ctx.beginPath(); ctx.arc(cx + 30, wy + 15, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(cx + 30, wy + 16, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 34, wy + 16); ctx.lineTo(cx + 37, wy + 13); ctx.lineTo(cx + 37, wy + 19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, cx - 44, wy + 10, 26, 12, 5); ctx.fill(); ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - 40, wy + 13, 18, 6, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.fillText('🦴', cx - 31, wy + 16);
  },

  // ---------- moving things under people: the fish, the bubbles, the picture ----------
  dynamic(r, g) {
    if (!this.isInside(g) || !this.st) return;
    const ctx = r.ctx, K = CFG.PETSHOP, T = K.TANK, t = g.time, w = T.x1 - T.x0;
    ctx.save(); ctx.beginPath(); ctx.rect(T.x0, T.y0, w, T.y1 - T.y0); ctx.clip();
    const fish = [['#ff7a1a', 0, 0.7, 10, 1], ['#ffd166', 1.1, 1, 24, 0.8], ['#f06292', 2.4, 0.5, 40, 1.1], ['#41b883', 3.6, 0.85, 18, 0.7], ['#8e5bd1', 4.2, 1.3, 32, 0.9], ['#3b7dd8', 5.5, 0.6, 46, 1], ['#ffffff', 2.9, 0.45, 14, 0.6]];
    fish.forEach(([col, ph, sp, dy, s]) => {
      const span = w - 40, u = ((t * 22 * sp + ph * 60) % (span * 2)), k = u < span ? u : span * 2 - u, f = u < span ? 1 : -1;
      const fx = T.x0 + 20 + k, fy = T.y0 + 6 + dy + Math.sin(t * 2 + ph) * 3;
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, fy, 8 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - f * 7 * s, fy); ctx.lineTo(fx - f * 13 * s, fy - 5 * s); ctx.lineTo(fx - f * 13 * s, fy + 5 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(fx + f * 4 * s, fy - 1.5 * s, 1.3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 10; i++) { const bx = T.x0 + 70 + (i % 2) * 150 + Math.sin(t * 3 + i) * 4, by = T.y1 - 10 - ((t * 28 + i * 17) % (T.y1 - T.y0 - 14)); ctx.beginPath(); ctx.arc(bx, by, 1.5 + (i % 3) * 0.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the goldfish bowl picture, once bought: the fish in it swims too
    if (g.s.petshop && g.s.petshop.bowlPic) {
      const P = K.PICTURE;
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(P.x - P.w / 2 - 3, P.y - P.h / 2 - 3, P.w + 6, P.h + 6);
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(P.x - P.w / 2, P.y - P.h / 2, P.w, P.h);
      ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(P.x, P.y + 2, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(P.x - 12, P.y - 12, 24, 5);
      const fx = P.x + Math.sin(t * 1.5) * 5, f = Math.cos(t * 1.5) < 0 ? -1 : 1;
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(fx, P.y + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - f * 3, P.y + 3); ctx.lineTo(fx - f * 7, P.y); ctx.lineTo(fx - f * 7, P.y + 6); ctx.closePath(); ctx.fill();
    }
  },

  // ---------- things that sort with people ----------
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player;
    if (st.treats > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 0.5, draw: () => this.drawBag(r, g) });
    if (!this.isInside(g)) return;
    const K = CFG.PETSHOP;
    items.push({ y: K.KEEPER.y, draw: () => this.drawKeeper(r, g) });
    for (const q of st.puppies) items.push({ y: q.y, draw: () => this.drawPuppy(r, g, q) });
    items.push({ y: K.PEN.y1 + 1, draw: () => { const ctx = r.ctx, P = K.PEN; this.fence(ctx, P.x0, P.y1, P.x1 - P.x0, false); this.fencePost(ctx, P.x0 + 3, P.y1 - 2, P.y1); this.fencePost(ctx, P.x1 - 3, P.y1 - 2, P.y1); } });
    items.push({ y: K.TOWER.y1, draw: () => this.drawTower(r, g) });
    items.push({ y: K.PERCH.y + 6, draw: () => this.drawParrot(r, g) });
    items.push({ y: K.HAMSTER.y1, draw: () => this.drawHamster(r, g) });
    items.push({ y: K.HUTCH.y1, draw: () => this.drawHutch(r, g) });
  },
  drawBag(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 16 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.fillStyle = '#d9a86a'; U.roundRect(ctx, x - 7, y - 8, 14, 16, 3); ctx.fill();
    ctx.fillStyle = '#b8864a'; ctx.fillRect(x - 7, y - 8, 14, 3);
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(x, y + 1, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x - 3, y + 1, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y + 1, 1.5, 0, Math.PI * 2); ctx.fill();
  },
  drawKeeper(r, g) {
    const ctx = r.ctx, K = CFG.PETSHOP, k = K.KEEPER, p = g.player;
    r.drawPerson(k.x, k.y, { shirt: '#41b883', apron: '#fff8ee', skin: '#e0ac69', hair: '#5a3a1a', hairStyle: 1, facing: p.x < k.x ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#4a4a4a' });
    if (g.hitRect(p.x, p.y, 60, this.rect(K.COUNTER))) {
      const txt = this.st.treats > 0 ? 'Enjoy! 🦴' : 'Hello! 🐾';
      r.drawBubble(k.x, k.y - 58 + Math.sin(g.time * 4) * 2, () => { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(txt, 0, 0); }, 70);
    }
  },
  drawPuppy(r, g, q) {
    const ctx = r.ctx, x = q.x, f = q.facing, h = CFG.PETSHOP.PUPPIES[this.st.puppies.indexOf(q)] || CFG.PETSHOP.PUPPIES[0];
    const hop = q.jump > 0 ? Math.sin((0.5 - q.jump) / 0.5 * Math.PI) * 10 : 0, bob = q.moving ? Math.sin(q.bob) * 1.5 : 0, y = q.y - hop;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, q.y + 3, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    const st = q.moving ? Math.sin(q.bob) * 2.5 : 0;
    ctx.fillStyle = h.dark; ctx.fillRect(x - 7, y - 5 + st, 3, 7); ctx.fillRect(x + 4, y - 5 - st, 3, 7); ctx.fillRect(x - 3, y - 5 - st, 3, 7); ctx.fillRect(x + 1, y - 5 + st, 3, 7);
    ctx.fillStyle = h.col; U.roundRect(ctx, x - 10, y - 14 + bob, 20, 11, 5); ctx.fill();
    if (h.spots) { ctx.fillStyle = h.dark; ctx.beginPath(); ctx.ellipse(x - 3, y - 9 + bob, 4, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = h.col; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - f * 9, y - 10 + bob); ctx.lineTo(x - f * 15, y - 17 + bob + Math.sin(q.wag) * 4); ctx.stroke();
    ctx.fillStyle = h.col; ctx.beginPath(); ctx.arc(x + f * 9, y - 16 + bob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = h.dark; ctx.beginPath(); ctx.ellipse(x + f * 4, y - 19 + bob, 3, 5, f * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 15, y - 15 + bob, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + f * 10, y - 18 + bob, 1.4, 0, Math.PI * 2); ctx.fill();
    if (q.jump > 0.1 || (q.moving && this.st.treats > 0)) { ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.ellipse(x + f * 12, y - 11 + bob, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill(); }   // tongue out
  },
  drawTower(r, g) {
    const ctx = r.ctx, T = CFG.PETSHOP.TOWER, c = this.st.cat, t = g.time, cx = (T.x0 + T.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 3, T.y0 + 4, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#b8a78a'; ctx.fillRect(T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0);                        // base carpet
    ctx.fillStyle = '#d9c7a4'; ctx.fillRect(T.x0 + 4, T.y0 + 4, T.x1 - T.x0 - 8, T.y1 - T.y0 - 8);
    ctx.fillStyle = '#c9b48c'; ctx.fillRect(cx - 7, T.y0 - 40, 14, 44);                                    // post (rope-wound)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; for (let y = T.y0 - 38; y < T.y0 + 2; y += 4) { ctx.beginPath(); ctx.moveTo(cx - 7, y); ctx.lineTo(cx + 7, y + 2); ctx.stroke(); }
    ctx.fillStyle = '#b8a78a'; U.roundRect(ctx, cx - 22, T.y0 - 50, 44, 12, 4); ctx.fill();                 // top platform
    ctx.fillStyle = '#d9c7a4'; U.roundRect(ctx, cx - 19, T.y0 - 48, 38, 6, 3); ctx.fill();
    // the toy: a ball on a string from a little arm, swinging; the kitten's paw bats it
    const ang = Math.sin(t * 4) * 0.8 * c.swing, ax = cx + 20, ay = T.y0 - 72;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(cx + 16, T.y0 - 74, 4, 26); ctx.fillRect(cx + 14, T.y0 - 74, 10, 3);
    const bx = ax + Math.sin(ang) * 20, by = ay + Math.cos(ang) * 20;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(bx - 1, by - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    // the kitten, sitting on the top platform
    const kx = cx - 4, ky = T.y0 - 50, paw = c.bat > 0 ? Math.sin(c.bat / 0.35 * Math.PI) * 10 : 0;
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(kx, ky - 7, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(kx - 9, ky - 5); ctx.quadraticCurveTo(kx - 18, ky - 4 + Math.sin(t * 3) * 3, kx - 16, ky - 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(kx + 6, ky - 6); ctx.lineTo(kx + 8 + paw, ky - 10 - paw * 0.6); ctx.stroke();                                              // the batting paw
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(kx + 4, ky - 16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(kx - 2, ky - 20); ctx.lineTo(kx - 1, ky - 27); ctx.lineTo(kx + 3, ky - 22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(kx + 6, ky - 22); ctx.lineTo(kx + 9, ky - 28); ctx.lineTo(kx + 10, ky - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.moveTo(kx - 1, ky - 22); ctx.lineTo(kx, ky - 25); ctx.lineTo(kx + 2, ky - 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.ellipse(kx + 2, ky - 17, 1.6, 2, 0, 0, Math.PI * 2); ctx.ellipse(kx + 7, ky - 17, 1.6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(kx + 5, ky - 13.5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KITTEN', cx, T.y1 - 8);
  },
  drawParrot(r, g) {
    const ctx = r.ctx, K = CFG.PETSHOP, P = K.PERCH, B = K.BUTTON, pr = this.st.parrot, t = g.time;
    // the perch: a round foot, a pole and a crossbar; the button on a little post next to it
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 4, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(P.x, P.y + 2, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(P.x - 2, P.y - 48, 4, 50); ctx.fillRect(P.x - 16, P.y - 50, 32, 4);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 7, B.y - 16, 14, 20, 3); ctx.fill();
    ctx.fillStyle = pr.sayT > 0 ? '#ffd166' : '#e4572e'; ctx.beginPath(); ctx.arc(B.x, B.y - 15, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PUSH', B.x, B.y - 6);
    // the parrot: green body, red head, yellow beak, a long blue tail; it bobs its head and flaps when it talks
    const x = P.x, y = P.y - 50, bob = Math.sin(t * 2.5) * 1.5, flap = pr.flap > 0 ? Math.sin(t * 25) * 6 : 0, f = g.player.x < x ? -1 : 1;
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(x - f * 6, y - 8); ctx.lineTo(x - f * 10, y + 14); ctx.lineTo(x - f * 2, y - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#41b883'; ctx.beginPath(); ctx.ellipse(x, y - 12, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.ellipse(x - f * 4, y - 12 + flap, 5, 8, f * 0.4, 0, Math.PI * 2); ctx.fill();   // wing
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x + f * 3, y - 24 + bob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + f * 6, y - 25 + bob, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + f * 6.5, y - 25 + bob, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x + f * 9, y - 24 + bob); ctx.lineTo(x + f * 15, y - 21 + bob); ctx.lineTo(x + f * 9, y - 18 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 3, y - 3, 2, 4); ctx.fillRect(x + 2, y - 3, 2, 4);
    if (pr.sayT > 0) r.drawBubble(x, y - 50 + Math.sin(t * 6) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(pr.say, 0, 0); }, Math.max(60, pr.say.length * 8 + 16));
  },
  drawHamster(r, g) {
    const ctx = r.ctx, H = CFG.PETSHOP.HAMSTER, h = this.st.hamster, cx = (H.x0 + H.x1) / 2, cy = H.y0 + 26;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(H.x0 + 3, H.y0 + 4, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#f0dba0'; ctx.fillRect(H.x0 + 3, H.y1 - 12, H.x1 - H.x0 - 6, 9);
    // the wheel: a ring with spokes that turn
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + 12, cy, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = h.ang + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 12 + Math.cos(a) * 16, cy + Math.sin(a) * 16); ctx.stroke(); }
    ctx.fillStyle = '#d9a86a'; ctx.beginPath(); ctx.ellipse(cx + 12, cy + 9, 8, 5, 0, 0, Math.PI * 2); ctx.fill();                 // the hamster, running at the bottom of the wheel
    ctx.fillStyle = '#c9905a'; ctx.beginPath(); ctx.arc(cx + 18, cy + 7, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx + 19.5, cy + 6.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(cx + 16, cy + 4, 1.5, 0, Math.PI * 2); ctx.fill();
    const legs = Math.sin(h.ang * 3) * 2; ctx.fillStyle = '#c9905a'; ctx.fillRect(cx + 8 + legs, cy + 12, 2, 3); ctx.fillRect(cx + 14 - legs, cy + 12, 2, 3);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(H.x0 + 8, H.y1 - 18, 10, 8); ctx.fillStyle = '#9ad0ff'; ctx.fillRect(H.x0 + 10, H.y1 - 24, 6, 6);   // the water bottle
    // the cage bars
    ctx.strokeStyle = 'rgba(90,100,110,0.55)'; ctx.lineWidth = 1; for (let x = H.x0 + 5; x < H.x1; x += 6) { ctx.beginPath(); ctx.moveTo(x, H.y0 + 2); ctx.lineTo(x, H.y1 - 2); ctx.stroke(); }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, 4); ctx.fillRect(H.x0, H.y1 - 4, H.x1 - H.x0, 4);
  },
  drawHutch(r, g) {
    const ctx = r.ctx, H = CFG.PETSHOP.HUTCH, b = this.st.bunny, t = g.time, cx = (H.x0 + H.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(H.x0 + 3, H.y0 + 4, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = '#a86b36'; ctx.fillRect(H.x0, H.y0 - 8, H.x1 - H.x0, 10); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(H.x0, H.y0 - 8, H.x1 - H.x0, 3);
    ctx.fillStyle = '#f0dba0'; ctx.fillRect(H.x0 + 6, H.y0 + 8, H.x1 - H.x0 - 12, H.y1 - H.y0 - 14);
    // the bunny: white, pink ears that twitch, a hop when you come close
    const hop = b.hop > 0 ? Math.sin((0.45 - b.hop) / 0.45 * Math.PI) * 8 : 0, x = cx + 6, y = H.y1 - 10 - hop, tw = Math.sin(b.twitch * 3) * 0.15;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y - 8, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 10, y - 14, 7, 0, Math.PI * 2); ctx.fill();
    for (const [dx, rot] of [[-14, -0.25 + tw], [-7, 0.2 - tw]]) { ctx.save(); ctx.translate(x + dx, y - 19); ctx.rotate(rot); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -7, 3.2, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.ellipse(0, -7, 1.6, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 13, y - 15, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(x - 16, y - 12 + Math.sin(t * 9) * 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 11, y - 9, 3.5, 0, Math.PI * 2); ctx.fill();   // fluffy tail
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(H.x0 + 10, H.y1 - 6); ctx.lineTo(H.x0 + 16, H.y1 - 20); ctx.lineTo(H.x0 + 22, H.y1 - 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#41b883'; ctx.fillRect(H.x0 + 14, H.y1 - 25, 4, 6);   // a carrot
    // the mesh front
    ctx.strokeStyle = 'rgba(90,100,110,0.5)'; ctx.lineWidth = 1;
    for (let x2 = H.x0 + 6; x2 < H.x1 - 6; x2 += 7) { ctx.beginPath(); ctx.moveTo(x2, H.y0 + 8); ctx.lineTo(x2, H.y1 - 6); ctx.stroke(); }
    for (let y2 = H.y0 + 8; y2 < H.y1 - 6; y2 += 7) { ctx.beginPath(); ctx.moveTo(H.x0 + 6, y2); ctx.lineTo(H.x1 - 6, y2); ctx.stroke(); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BUNNY', cx, H.y0 - 3);
  },

  // ---------- the short fade when going through the door ----------
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};

Game.ext.unshift(PetShopExt);   // first in line: the shop door's button and hint beat the City's taxis and coins
Render.ext.push(PetShopExt);
