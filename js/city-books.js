'use strict';
// The bookshop: City building 6 (top row, facing Bus Street, the green one with the BOOKS sign). Step inside for a
// cosy shop: a tall bookcase of colourful spines with a rolling ladder (press the button by it and the chef climbs on
// and rides it along the shelf), a reading nook with a beanbag (sit down and a picture book opens on screen, three
// pages of simple pictures turned with the ◀ ▶ buttons), a storyteller cat on a cushion, a globe that spins when you
// touch it, a quiet "shh" librarian who smiles when you walk by, a $4 bookmark (the book remembers your page) and a
// $7 comic the chef carries around for half a minute.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.BOOKS = {
  BUILDING: 6,                                   // index in CFG.CITY.BUILDINGS: { x0: 5910, y0: -130, x1: 6050, y1: 0 }
  DOOR_OUT: { x: 5980, y: 14 },                  // on the sidewalk just below the door
  WORLD: { x0: 4100, y0: 3000, x1: 4700, y1: 3400 },
  ROOM: { x0: 4140, y0: 3100, x1: 4660, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: the bookcase and window hang on it
  SHELF: { x0: 4152, y0: 3024, x1: 4470, y1: 3098 },                              // the tall bookcase
  LADDER: { x0: 4188, x1: 4436, top: 3030, foot: 3110, ride: 3066, stand: 3124 }, // the ladder slides between x0 and x1; `ride` is where the chef's feet sit on the rung, `stand` the floor spot below it
  WINDOW: { x0: 4502, y0: 3030, x1: 4632, y1: 3088 },
  GLOBE: { x: 4172, y: 3180 },
  NOOK: { rug: { x: 4580, y: 3222, rx: 72, ry: 40 }, bean: { x: 4580, y: 3208 }, lamp: { x: 4640, y: 3150 }, table: { x: 4518, y: 3150 } },
  CAT: { x: 4330, y: 3250 },                     // the storyteller cat on its cushion
  DESK: { x0: 4160, y0: 3206, x1: 4300, y1: 3240 }, LIBRARIAN: { x: 4230, y: 3200 },
  PADS: { bookmark: { x: 4190, y: 3294 }, comic: { x: 4290, y: 3294 } },
  STACKS: [{ x: 4640, y: 3306 }, { x: 4600, y: 3316 }],   // little piles of books on the floor
  EXIT: { x: 4400, y: 3322 },                    // the mat inside the door (the door is in the bottom wall)
  COMIC: 30, CLIMB: 0.6, SLIDE: 120,             // seconds a comic lasts, seconds to climb the ladder, ladder speed in px/s
  PAGES: 3,
  PICS: ['🐭', '🐟', '🌙', '🍕', '🦋', '⭐'],   // the pictures in the cat's story bubble
};
CFG.AREAS.books = { WORLD: CFG.BOOKS.WORLD };

const BooksExt = {
  name: 'books',
  st: null,
  defaults: { books: { seen: false, rides: 0, reads: 0, spins: 0, bookmark: false, page: 0, comics: 0 } },

  // ---------- state ----------
  build(g) {
    const B = CFG.BOOKS;
    if (!g.s.books) g.s.books = { seen: false, rides: 0, reads: 0, spins: 0, bookmark: false, page: 0, comics: 0 };
    this.st = {
      fade: 0,
      ladder: { x: B.LADDER.x0 }, ride: null,                       // ride: { phase: 'up' | 'slide' | 'down', t, to, dir }
      read: null,                                                    // read: { page, flip: { t, dur, from } | null, t }
      globe: { a: 0, v: 0, near: false },
      cat: { tell: 0, pic: 0, picT: 0, tail: 0, purr: 0 },
      lib: { smile: 0, shh: 0, shhT: 3 },
      comic: 0, obs: null,
    };
    const R = B.ROOM, w = B.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: B.GLOBE.x - 13, y: B.GLOBE.y - 12, w: 26, h: 22 });
    o.push({ x: B.NOOK.lamp.x - 9, y: B.NOOK.lamp.y - 8, w: 18, h: 16 });
    o.push({ x: B.NOOK.table.x - 20, y: B.NOOK.table.y - 12, w: 40, h: 24 });
    o.push({ x: B.CAT.x - 22, y: B.CAT.y - 12, w: 44, h: 22 });
    o.push({ x: B.DESK.x0, y: B.DESK.y0, w: B.DESK.x1 - B.DESK.x0, h: B.DESK.y1 - B.DESK.y0 });
    for (const s of B.STACKS) o.push({ x: s.x - 13, y: s.y - 10, w: 26, h: 18 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'books' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.BOOKS.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inCityStreet(g) { return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && CityExt.st.cab))); },
  atDoor(g) { const D = CFG.BOOKS.DOOR_OUT, p = g.player; return this.inCityStreet(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  ladderFoot() { return { x: this.st.ladder.x, y: CFG.BOOKS.LADDER.stand }; },
  nearLadder(g) { const p = g.player, f = this.ladderFoot(); return U.dist(p.x, p.y, f.x, f.y) < 34; },
  nearBean(g) { const p = g.player, b = CFG.BOOKS.NOOK.bean; return U.dist(p.x, p.y, b.x, b.y) < 30; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, B = CFG.BOOKS, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'books') return null;
    if (st.ride) return null;
    if (st.read) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, B.EXIT.x, B.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.nearLadder(g)) return { label: '🪜 Ride the ladder', run: (gg) => this.rideLadder(gg) };
    if (this.nearBean(g)) return { label: '📖 Sit and read', run: (gg) => this.sitDown(gg) };
    return null;
  },
  enter(g) {
    const B = CFG.BOOKS, p = g.player;
    g.area = 'books'; p.x = B.EXIT.x; p.y = B.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.books.seen) { g.s.books.seen = true; g.toast('📚 Welcome to the bookshop!', true); }
  },
  leave(g) {
    const B = CFG.BOOKS, p = g.player;
    this.standUp(g);
    g.area = 'city'; p.x = B.DOOR_OUT.x; p.y = B.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.ride = null; this.st.fade = 0.45; Sfx.drop();
  },
  rideLadder(g) {
    const L = CFG.BOOKS.LADDER, st = this.st, p = g.player;
    const to = st.ladder.x < (L.x0 + L.x1) / 2 ? L.x1 : L.x0;
    st.ride = { phase: 'up', t: 0, to, dir: to > st.ladder.x ? 1 : -1, from: st.ladder.x };
    p.x = st.ladder.x; p.y = L.stand; p.moving = false; p.facing = st.ride.dir;
    Sfx.pickup(); Haptics.tap();
  },
  sitDown(g) {
    const b = CFG.BOOKS.NOOK.bean, p = g.player, s = g.s.books;
    this.st.read = { page: s.bookmark ? U.clamp(s.page | 0, 0, CFG.BOOKS.PAGES - 1) : 0, flip: null, t: 0 };
    p.x = b.x; p.y = b.y - 6; p.moving = false; p.facing = 1;
    s.reads++;
    Sfx.pickup(); Haptics.tap();
    UI.openCatalog({ prev: () => this.turnPage(g, -1), next: () => this.turnPage(g, 1), close: () => this.standUp(g) });
  },
  turnPage(g, dir) {
    const rd = this.st.read; if (!rd || rd.flip) return;
    const to = rd.page + dir; if (to < 0 || to >= CFG.BOOKS.PAGES) return;
    rd.flip = { t: 0, dur: 0.35, from: rd.page }; rd.page = to;
    if (g.s.books.bookmark) g.s.books.page = to;
    Sfx.drop(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st; if (!st.read) return;
    st.read = null; g.player.moving = false; UI.closeCatalog(); Sfx.drop();
  },
  home(g) { if (!this.st) return; this.standUp(g); this.st.ride = null; this.st.fade = 0; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, B = CFG.BOOKS;
    if (this.free(p.x, p.y)) return false;
    p.x = B.EXIT.x; p.y = B.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, B = CFG.BOOKS, L = B.LADDER;
    st.fade = Math.max(0, st.fade - dt);
    st.comic = Math.max(0, st.comic - dt);
    // the globe keeps spinning down wherever you are
    st.globe.v = Math.max(0, st.globe.v - st.globe.v * 0.9 * dt - 0.2 * dt); st.globe.a += st.globe.v * dt;
    if (g.area !== 'books') { if (st.read) this.standUp(g); st.ride = null; st.cat.tell = 0; return; }
    if (st.ride) {
      // riding the ladder: climb on, slide along the bookcase, climb down
      const rd = st.ride; rd.t += dt;
      if (rd.phase === 'up') {
        p.y = U.lerp(L.stand, L.ride, U.easeOut(Math.min(1, rd.t / B.CLIMB)));
        if (rd.t >= B.CLIMB) { rd.phase = 'slide'; rd.t = 0; p.y = L.ride; g.floats.push({ x: p.x, y: p.y - 60, text: 'Wheee! 🪜', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
      } else if (rd.phase === 'slide') {
        st.ladder.x += rd.dir * B.SLIDE * dt; p.y = L.ride;
        if ((rd.dir > 0 && st.ladder.x >= rd.to) || (rd.dir < 0 && st.ladder.x <= rd.to)) { st.ladder.x = rd.to; rd.phase = 'down'; rd.t = 0; }
      } else {
        p.y = U.lerp(L.ride, L.stand, U.easeOut(Math.min(1, rd.t / B.CLIMB)));
        if (rd.t >= B.CLIMB) { st.ride = null; p.y = L.stand; g.s.books.rides++; Sfx.drop(); Haptics.success(); }
      }
      p.x = st.ladder.x; p.moving = false; p.facing = rd.dir;
    } else if (st.read) {
      // sitting in the beanbag with the book open: stay put (the ◀ ▶ buttons turn the pages, the ✕ or the big button closes it)
      const rd = st.read, b = B.NOOK.bean; rd.t += dt;
      p.x = b.x; p.y = b.y - 6; p.moving = false; p.facing = 1;
      if (rd.flip) { rd.flip.t += dt; if (rd.flip.t >= rd.flip.dur) rd.flip = null; }
    } else this.rescue(g);
    // the globe spins when you touch it
    const G = B.GLOBE, touching = !st.ride && !st.read && U.dist(p.x, p.y, G.x, G.y) < 36;
    if (touching && !st.globe.near) {   // one spin per touch: step away and back to spin it again
      st.globe.v = 9; g.s.books.spins++; Sfx.pickup();
      g.floats.push({ x: G.x, y: G.y - 44, text: 'Whirrr! 🌍', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    }
    st.globe.near = touching;
    // the storyteller cat tells a picture story while you are close
    const c = st.cat, near = U.dist(p.x, p.y, B.CAT.x, B.CAT.y) < 70;
    c.tail += dt * (near ? 5 : 2);
    if (near) {
      if (c.tell === 0) { c.pic = U.randInt(0, B.PICS.length - 1); c.picT = 0; }
      c.tell += dt; c.picT += dt;
      if (c.picT > 1.4) { c.picT = 0; c.pic = (c.pic + 1) % B.PICS.length; }
    } else c.tell = 0;
    // the librarian: "shh" now and then, a smile when you walk by
    const lb = st.lib, close = U.dist(p.x, p.y, B.LIBRARIAN.x, B.LIBRARIAN.y) < 90;
    lb.smile = close ? Math.min(1, lb.smile + dt * 4) : Math.max(0, lb.smile - dt * 2);
    if (close) lb.shh = 0;
    else { lb.shh = Math.max(0, lb.shh - dt); lb.shhT -= dt; if (lb.shhT <= 0) { lb.shhT = U.rand(4, 7); lb.shh = 1.6; } }
  },
  pads(g) {
    if (g.area !== 'books') return [];
    const P = CFG.BOOKS.PADS, s = g.s.books;
    return [
      { key: 'booksBookmark', label: 'Bookmark', ico: '🔖', pos: P.bookmark, price: 4, maxed: !!s.bookmark, sub: s.bookmark ? 'yours!' : 'keeps your page' },
      { key: 'booksComic', label: 'Comic', ico: '💥', pos: P.comic, price: 7, sub: 'zap! pow!' },
    ];
  },
  onPad(g, pad) {
    const p = g.player;
    if (pad.key === 'booksBookmark') {
      g.s.books.bookmark = true; g.s.books.page = 0;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'A bookmark! 🔖', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      Haptics.success();
    } else if (pad.key === 'booksComic') {
      this.st.comic = CFG.BOOKS.COMIC; g.s.books.comics++;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'A comic! 💥', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      Haptics.success();
    }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, B = CFG.BOOKS, st = this.st, s = g.s.books;
    if (g.area === 'city') {
      if (!this.inCityStreet(g)) return undefined;
      const d = U.dist(p.x, p.y, B.DOOR_OUT.x, B.DOOR_OUT.y);
      if (d < 110) return { text: 'Visit the bookshop! 📚', target: d < 30 ? null : B.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'books') return undefined;
    if (st.ride) return { text: 'Wheee! Riding the ladder 🪜', target: null };
    if (st.read) return { text: 'Turn the pages with ◀ ▶ 📖', target: null };
    if (!s.rides) return { text: 'Ride the rolling ladder! 🪜', target: this.ladderFoot() };
    if (!s.reads) return { text: 'Sit in the beanbag for a story 📖', target: B.NOOK.bean };
    if (!s.bookmark && g.s.cash + (g.s.padPaid.booksBookmark || 0) >= 4) return { text: 'Buy a bookmark! 🔖', target: B.PADS.bookmark };
    if (st.comic > 0) return { text: 'Zap! Pow! A comic! 💥', target: null };
    if (!s.comics && g.s.cash + (g.s.padPaid.booksComic || 0) >= 7) return { text: 'Buy a comic! 💥', target: B.PADS.comic };
    return { text: 'Shh… it is a quiet bookshop 🤫', target: null };
  },

  // ---------- the City outside: a bookish sign and a welcome mat (static) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.BOOKS.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '📚 BOOKS';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // books on show in the shop windows
    const cols = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#ff8fab', '#8e5bd1'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(b.x0 + 16 + i * 9, gy + 18 - (i % 2) * 3, 7, 14 + (i % 2) * 3); }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = cols[5 - i]; ctx.fillRect(cx + 20, gy + 28 - i * 4, 26, 4); }
    // a welcome mat on the sidewalk in front of the door, with a little open book on it
    const D = CFG.BOOKS.DOOR_OUT;
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(D.x - 15, D.y - 6, 30, 10);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(D.x - 6, D.y - 4, 12, 6); ctx.fillStyle = '#2b1d14'; ctx.fillRect(D.x - 0.5, D.y - 4, 1, 6);
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
  },

  // ---------- the interior, static ----------
  paint: { books(r, g) { BooksExt.paintRoom(r, g); } },
  hash(n) { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); },
  paintRoom(r, g) {
    const ctx = r.ctx, B = CFG.BOOKS, W = B.WORLD, R = B.ROOM, w = B.WALL;
    // outside the shop: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, B.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - B.BACK_TOP);
    // warm wooden floor
    ctx.fillStyle = '#d2a160'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = R.y0; y < R.y1; y += 20) { ctx.fillRect(R.x0, y, R.x1 - R.x0, 1.5); for (let x = R.x0 + ((y / 20) % 2) * 60; x < R.x1; x += 120) ctx.fillRect(x, y, 1.5, 20); }
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = R.y0 + 3; y < R.y1; y += 20) for (let x = R.x0 + 10; x < R.x1; x += 48) ctx.fillRect(x, y, 22, 2);
    // walls: a tall cream back wall with soft stripes; wooden side and bottom walls
    ctx.fillStyle = '#f3e3c3'; ctx.fillRect(R.x0 - w, B.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - B.BACK_TOP);
    ctx.fillStyle = '#ead4ab'; for (let x = R.x0 - w + 6; x < R.x1 + w; x += 16) ctx.fillRect(x, B.BACK_TOP, 6, R.y0 - B.BACK_TOP);
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(R.x0 - w, B.BACK_TOP, R.x1 - R.x0 + 2 * w, 6); ctx.fillStyle = '#ffe08a'; ctx.fillRect(R.x0 - w, B.BACK_TOP + 6, R.x1 - R.x0 + 2 * w, 2);   // cornice
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the tall bookcase: a wooden frame, four shelves of colourful spines, a brass rail along the top for the ladder
    const S = B.SHELF, cols = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#ff8fab', '#8e5bd1', '#4dd0e1', '#f2b134', '#c62828', '#2f9e44'];
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(S.x0 + 4, S.y0 + 4, S.x1 - S.x0, S.y1 - S.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x0 + 4, S.y0 + 4, S.x1 - S.x0 - 8, S.y1 - S.y0 - 8);
    let seed = 1;
    for (let row = 0; row < 4; row++) {
      const sy = S.y0 + 4 + (row + 1) * 18, top = sy - 18;
      for (let x = S.x0 + 6; x < S.x1 - 10;) {
        const bw = 4 + Math.floor(this.hash(seed++) * 5), bh = 11 + Math.floor(this.hash(seed++) * 6), col = cols[Math.floor(this.hash(seed++) * cols.length)];
        if (x + bw > S.x1 - 6) break;
        const lean = this.hash(seed++) < 0.08 && x + bw + 6 < S.x1 - 6;
        ctx.fillStyle = col;
        if (lean) { ctx.save(); ctx.translate(x + bw, sy); ctx.rotate(-0.25); ctx.fillRect(-bw, -bh, bw, bh); ctx.restore(); x += bw + 5; }
        else { ctx.fillRect(x, sy - bh, bw, bh); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 1, sy - bh + 3, bw - 2, 1.5); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 1, sy - 4, bw - 2, 1.5); x += bw + 1; }
      }
      ctx.fillStyle = '#b5773a'; ctx.fillRect(S.x0 + 4, sy, S.x1 - S.x0 - 8, 3); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(S.x0 + 4, sy + 3, S.x1 - S.x0 - 8, 1.5);
      if (row === 0) { ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x0 + 4, top, S.x1 - S.x0 - 8, 2); }
    }
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(S.x0 - 2, S.y0 - 3, S.x1 - S.x0 + 4, 4); ctx.fillStyle = '#b8862c'; ctx.fillRect(S.x0 - 2, S.y0 + 1, S.x1 - S.x0 + 4, 1.5);   // the ladder rail
    // a round window with curtains next to the bookcase; a sunny sky and a plant on the sill
    const Wd = B.WINDOW, wcx = (Wd.x0 + Wd.x1) / 2, wcy = (Wd.y0 + Wd.y1) / 2;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Wd.x0 - 4, Wd.y0 - 4, Wd.x1 - Wd.x0 + 8, Wd.y1 - Wd.y0 + 8, 10); ctx.fill();
    const sky = ctx.createLinearGradient(0, Wd.y0, 0, Wd.y1); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#d9f0ff');
    ctx.fillStyle = sky; U.roundRect(ctx, Wd.x0, Wd.y0, Wd.x1 - Wd.x0, Wd.y1 - Wd.y0, 8); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(wcx + 30, Wd.y0 + 18, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; for (const [dx, dy, rr] of [[-34, 14, 7], [-26, 12, 9], [-18, 15, 6]]) { ctx.beginPath(); ctx.arc(wcx + dx, Wd.y0 + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#79b85e'; ctx.beginPath(); ctx.ellipse(wcx, Wd.y1 + 2, 80, 16, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(wcx - 1.5, Wd.y0, 3, Wd.y1 - Wd.y0); ctx.fillRect(Wd.x0, wcy - 1.5, Wd.x1 - Wd.x0, 3);
    for (const side of [-1, 1]) { const cx0 = side < 0 ? Wd.x0 - 6 : Wd.x1 - 16; ctx.fillStyle = '#e4572e'; U.roundRect(ctx, cx0, Wd.y0 - 8, 22, Wd.y1 - Wd.y0 + 14, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 3; k++) ctx.fillRect(cx0 + 4 + k * 6, Wd.y0 - 4, 2, Wd.y1 - Wd.y0 + 8); ctx.fillStyle = '#ffd166'; ctx.fillRect(cx0 - 2, wcy + 10, 26, 4); }
    ctx.fillStyle = '#b5773a'; ctx.fillRect(Wd.x0 - 10, Wd.y1 + 4, Wd.x1 - Wd.x0 + 20, 5);   // the sill
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, wcx - 8, Wd.y1 - 8, 16, 12, 3); ctx.fill(); ctx.fillStyle = '#3f9a4a'; for (const [dx, dy] of [[-7, -12], [0, -16], [7, -11]]) { ctx.beginPath(); ctx.ellipse(wcx + dx, Wd.y1 + dy, 5, 7, dx * 0.08, 0, Math.PI * 2); ctx.fill(); }
    // an owl picture and a clock on the wall right of the window
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, R.x1 - 18, B.BACK_TOP + 16, 30, 28, 3); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.fillRect(R.x1 - 15, B.BACK_TOP + 19, 24, 22);
    ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🦉', R.x1 - 3, B.BACK_TOP + 31);
    // the nook: a striped round rug, the beanbag's seat is live, a floor lamp, a side table with a stack of books and a mug
    const N = B.NOOK;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(N.rug.x + 3, N.rug.y + 4, N.rug.rx, N.rug.ry, 0, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#e4572e', '#ffd166', '#3b7dd8', '#fff8ee'][k]; ctx.beginPath(); ctx.ellipse(N.rug.x, N.rug.y, N.rug.rx - k * 16, N.rug.ry - k * 9, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(N.lamp.x + 2, N.lamp.y + 8, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.ellipse(N.lamp.x, N.lamp.y + 6, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(N.lamp.x - 1.5, N.lamp.y - 56, 3, 62);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(N.lamp.x - 10, N.lamp.y - 54); ctx.lineTo(N.lamp.x + 10, N.lamp.y - 54); ctx.lineTo(N.lamp.x + 16, N.lamp.y - 34); ctx.lineTo(N.lamp.x - 16, N.lamp.y - 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(N.lamp.x - 16, N.lamp.y - 36, 32, 2);
    const T = N.table;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 10, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(T.x - 16, T.y, 4, 10); ctx.fillRect(T.x + 12, T.y, 4, 10);
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(T.x, T.y - 2, 22, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a86b36'; ctx.beginPath(); ctx.ellipse(T.x, T.y - 4, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
    this.paintStack(r, T.x - 6, T.y - 6, 3);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, T.x + 6, T.y - 14, 9, 10, 2); ctx.fill(); ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(T.x + 16, T.y - 9, 3, -Math.PI / 2, Math.PI / 2); ctx.stroke();   // a mug
    // the cat's cushion (the cat is live)
    const C = B.CAT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(C.x + 2, C.y + 6, 24, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.ellipse(C.x, C.y + 3, 24, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#a97ee0'; ctx.beginPath(); ctx.ellipse(C.x, C.y, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; for (const [dx, dy] of [[-22, 3], [22, 3], [0, 14], [0, -9]]) { ctx.beginPath(); ctx.arc(C.x + dx, C.y + dy, 2.5, 0, Math.PI * 2); ctx.fill(); }
    // the librarian's desk: wood, a "shh" card, a bell, a cup of pencils and a stack of books
    const D = B.DESK;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(D.x0 + 4, D.y0 + 6, D.x1 - D.x0, D.y1 - D.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = D.x0 + 8; x < D.x1 - 6; x += 18) ctx.fillRect(x, D.y0 + 12, 10, D.y1 - D.y0 - 16);
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, D.x0 - 2, D.y0 - 6, D.x1 - D.x0 + 4, 16, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(D.x0 + 4, D.y0 - 4, D.x1 - D.x0 - 8, 2);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, D.x0 + 50, D.y0 + 8, 40, 20, 3); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; U.roundRect(ctx, D.x0 + 50, D.y0 + 8, 40, 20, 3); ctx.stroke();
    ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🤫', D.x0 + 70, D.y0 + 18);
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(D.x0 + 118, D.y0 - 2, 6, Math.PI, 0); ctx.fill(); ctx.fillRect(D.x0 + 110, D.y0 - 2, 16, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(D.x0 + 117, D.y0 - 10, 2, 3);   // the bell
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, D.x0 + 14, D.y0 - 12, 12, 12, 2); ctx.fill(); for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ffd166', '#e4572e', '#41b883'][k]; ctx.fillRect(D.x0 + 16 + k * 3.5, D.y0 - 22 + k * 2, 2, 10); }   // pencils
    this.paintStack(r, D.x0 + 34, D.y0 - 6, 3);
    // little piles of books on the floor
    for (const s of B.STACKS) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(s.x + 2, s.y + 6, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); this.paintStack(r, s.x, s.y + 4, 4); }
    // the door in the bottom wall, its mat, and the shop's name plate below
    const E = B.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(E.x - 21, E.y - 8, 42, 14); ctx.fillStyle = '#fff8ee'; ctx.fillRect(E.x - 17, E.y - 5, 34, 8);
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 46, R.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('📚 BOOKS 📚', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },
  // a little pile of books, bottom at (x, y)
  paintStack(r, x, y, n) {
    const ctx = r.ctx, cols = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#8e5bd1'];
    for (let k = 0; k < n; k++) { const bw = 22 - (k % 2) * 3, off = (k % 2) * 2 - 1; ctx.fillStyle = cols[(k + Math.floor(x / 7)) % cols.length]; U.roundRect(ctx, x - bw / 2 + off, y - 6 - k * 5, bw, 5, 1.5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - bw / 2 + off + 2, y - 5 - k * 5, bw - 4, 1); }
  },

  // ---------- moving things ----------
  // outside the shop's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.BOOKS.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawLadder(r, g) {
    const ctx = r.ctx, L = CFG.BOOKS.LADDER, x = this.st.ladder.x, top = L.top, foot = L.foot, rolling = this.st.ride && this.st.ride.phase === 'slide';
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 9, top + 3, 4, foot - top); ctx.fillRect(x + 9, top + 3, 4, foot - top);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(x - 11, top, 4, foot - top); ctx.fillRect(x + 7, top, 4, foot - top);
    ctx.fillStyle = '#d9a066'; ctx.fillRect(x - 11, top, 1.5, foot - top); ctx.fillRect(x + 7, top, 1.5, foot - top);
    ctx.fillStyle = '#8d5a2b'; for (let y = top + 10; y < foot - 4; y += 12) ctx.fillRect(x - 9, y, 18, 3);
    ctx.fillStyle = '#b8862c'; ctx.fillRect(x - 13, top - 5, 26, 4); ctx.beginPath(); ctx.arc(x - 9, top - 3, 3, 0, Math.PI * 2); ctx.arc(x + 9, top - 3, 3, 0, Math.PI * 2); ctx.fill();   // the hooks on the rail
    // wheels at the bottom, spinning while it rolls
    for (const dx of [-9, 9]) {
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + dx, foot + 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.save(); ctx.translate(x + dx, foot + 2); ctx.rotate(rolling ? g.time * 12 : 0); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.moveTo(0, -3); ctx.lineTo(0, 3); ctx.stroke(); ctx.restore();
    }
  },
  drawBean(r, g, front) {
    const ctx = r.ctx, b = CFG.BOOKS.NOOK.bean, sat = !!this.st.read, sq = sat ? 1.08 : 1;
    if (!front) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(b.x + 3, b.y + 8, 32 * sq, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.ellipse(b.x, b.y - 10, 28 * sq, 26 / sq, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.ellipse(b.x - 4, b.y - 16, 16, 12, -0.3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 32 * sq, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 1, 26 * sq, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(b.x, b.y - 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawGlobe(r, g) {
    const ctx = r.ctx, G = CFG.BOOKS.GLOBE, a = this.st.globe.a, R = 13;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(G.x + 2, G.y + 8, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(G.x, G.y + 6, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(G.x - 2, G.y - 8, 4, 14);
    ctx.save(); ctx.translate(G.x, G.y - 22);
    ctx.fillStyle = '#4fb3e8'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.clip();
    // continents go round: blobs at a longitude, squashed toward the edge, only on the near side
    const blobs = [[0, -4, 6, 4], [1.4, 3, 5, 5], [2.6, -2, 4, 3], [3.9, 5, 7, 3], [5.1, -6, 4, 3]];
    for (const [lon, y, bw, bh] of blobs) { const c = Math.cos(a + lon); if (c <= 0) continue; ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.ellipse(Math.sin(a + lon) * R * 0.95, y, Math.max(0.5, bw * c), bh, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-5, -6, 4, 2.5, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#b8862c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R + 3, Math.PI * 0.35, Math.PI * 1.15, true); ctx.stroke();   // the brass meridian
    ctx.restore();
    if (this.st.globe.v > 1.5) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 3; k++) { const ph = (g.time * 2 + k / 3) % 1; ctx.beginPath(); ctx.arc(G.x + 18 + ph * 8, G.y - 26 + k * 6, 1.5 * (1 - ph), 0, Math.PI * 2); ctx.fill(); } }
  },
  drawCat(r, g) {
    const ctx = r.ctx, C = CFG.BOOKS.CAT, c = this.st.cat, x = C.x, y = C.y - 4, tail = Math.sin(c.tail) * 0.5;
    ctx.fillStyle = '#f2b134';
    ctx.save(); ctx.translate(x + 14, y + 2); ctx.rotate(tail - 0.6); ctx.beginPath(); ctx.ellipse(8, -6, 4, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // the tail swishes
    ctx.beginPath(); ctx.ellipse(x, y, 16, 11, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.fillStyle = '#d9962a'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 8 + k * 6, y - 9, 3, 6);   // stripes
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(x - 6, y - 12, 9, 0, Math.PI * 2); ctx.fill();   // head
    ctx.beginPath(); ctx.moveTo(x - 14, y - 16); ctx.lineTo(x - 12, y - 26); ctx.lineTo(x - 6, y - 19); ctx.closePath(); ctx.moveTo(x + 2, y - 16); ctx.lineTo(x, y - 26); ctx.lineTo(x - 6, y - 19); ctx.closePath(); ctx.fill();   // ears
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(x - 12, y - 17); ctx.lineTo(x - 11, y - 22); ctx.lineTo(x - 8, y - 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 6, y - 7, 6, 4, 0, 0, Math.PI * 2); ctx.fill();   // chest
    const blink = Math.sin(g.time * 1.3) > 0.97;
    ctx.fillStyle = '#2b1d14';
    if (blink) { ctx.fillRect(x - 11, y - 13, 3, 1); ctx.fillRect(x - 4, y - 13, 3, 1); }
    else { ctx.beginPath(); ctx.ellipse(x - 9.5, y - 13, 1.4, 2, 0, 0, Math.PI * 2); ctx.ellipse(x - 2.5, y - 13, 1.4, 2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(x - 7.5, y - 9.5); ctx.lineTo(x - 4.5, y - 9.5); ctx.lineTo(x - 6, y - 7.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x - 6 + d * 4, y - 9); ctx.lineTo(x - 6 + d * 12, y - 11); ctx.moveTo(x - 6 + d * 4, y - 8); ctx.lineTo(x - 6 + d * 12, y - 7); ctx.stroke(); }
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.ellipse(x - 10, y + 7, 5, 3, 0, 0, Math.PI * 2); ctx.ellipse(x + 2, y + 7, 5, 3, 0, 0, Math.PI * 2); ctx.fill();   // paws
    // the story: a bubble of pictures while the chef is close
    if (c.tell > 0) {
      const k = Math.min(1, c.tell * 4), pic = CFG.BOOKS.PICS[c.pic], pop = Math.min(1, c.picT * 5);
      ctx.save(); ctx.globalAlpha = k;
      r.drawBubble(x - 4, y - 42 + Math.sin(g.time * 3) * 2, () => { ctx.font = r.font(Math.round(10 + 6 * pop)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(pic, 0, 1); }, 36);
      ctx.restore();
      if (Math.floor(c.tell * 2) % 2 === 0) { ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#8a7a6a'; ctx.fillText('purr', x + 16, y - 20); }
    }
  },
  drawLibrarian(r, g) {
    const ctx = r.ctx, L = CFG.BOOKS.LIBRARIAN, lb = this.st.lib, p = g.player, x = L.x, y = L.y;
    r.drawPerson(x, y, { shirt: '#8e5bd1', skin: '#e0ac69', hair: '#9aa0a8', hairStyle: 2, facing: p.x < x ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', bowtie: '#ffd166' });
    // round glasses
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 4, y - 39, 3.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 4, y - 39, 3.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 0.5, y - 39); ctx.lineTo(x + 0.5, y - 39); ctx.stroke();
    if (lb.smile > 0.5) {
      // a big smile and rosy cheeks when you walk by
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 34, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,150,0.45)'; ctx.beginPath(); ctx.arc(x - 7, y - 33, 2.5, 0, Math.PI * 2); ctx.arc(x + 7, y - 33, 2.5, 0, Math.PI * 2); ctx.fill();
      r.drawBubble(x + 2, y - 66 + Math.sin(g.time * 3) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('😊', 0, 1); }, 30);
    } else {
      // a finger to the lips, and a "shh" now and then
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 2, y - 32, 4, 1.2);
      ctx.fillStyle = '#e0ac69'; U.roundRect(ctx, x - 1.5, y - 38, 3, 9, 1.5); ctx.fill();
      if (lb.shh > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, lb.shh * 2); r.drawBubble(x + 2, y - 66, () => { ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('shh…', 0, 0); }, 40); ctx.restore(); }
    }
  },
  drawComic(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 22 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(f * 0.15);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, -6, -8, 14, 18, 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, -7, -9, 14, 18, 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-7, -9, 14, 4);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 2.5 : 5.5, an = k * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(an) * rr, 1 + Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(4); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('POW', 0, 1);
    ctx.restore();
    // little sparkle stars pop around the comic now and then
    const ph = (g.time * 1.2) % 1; if (ph < 0.5) { ctx.fillStyle = '#ffd166'; ctx.font = r.font(8 + ph * 8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 1 - ph * 2; ctx.fillText('✦', x + f * 10, y - 12 - ph * 14); ctx.globalAlpha = 1; }
  },
  drawRibbon(r, g) {
    const ctx = r.ctx, p = g.player, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, x = p.x + 4, y = p.y - 19 + bob;
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.lineTo(x + 2, y + 8); ctx.lineTo(x, y + 6); ctx.lineTo(x - 2, y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 2, y, 4, 1.2);
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'books') return;
    const ctx = r.ctx, N = CFG.BOOKS.NOOK, R = CFG.BOOKS.ROOM;
    this.drawOutside(r, g);
    this.drawLadder(r, g);
    // the lamp's warm glow over the nook (kept inside the room)
    const gl = ctx.createRadialGradient(N.lamp.x, N.lamp.y - 30, 6, N.lamp.x, N.lamp.y - 30, 90 + Math.sin(g.time * 2) * 3);
    gl.addColorStop(0, 'rgba(255,230,150,0.35)'); gl.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.save(); ctx.beginPath(); ctx.rect(R.x0, CFG.BOOKS.BACK_TOP, R.x1 - R.x0, R.y1 - CFG.BOOKS.BACK_TOP); ctx.clip();
    ctx.fillStyle = gl; ctx.fillRect(N.lamp.x - 100, N.lamp.y - 130, 200, 200);
    ctx.restore();
    this.drawBean(r, g, false);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, B = CFG.BOOKS;
    if (!g.driving && !g.onTrain) {
      if (st.comic > 0) items.push({ y: p.y + 1, draw: () => this.drawComic(r, g) });
      if (g.s.books && g.s.books.bookmark && !st.read) items.push({ y: p.y + 1, draw: () => this.drawRibbon(r, g) });
    }
    if (g.area !== 'books') return;
    items.push({ y: B.NOOK.bean.y + 2, draw: () => this.drawBean(r, g, true) });
    items.push({ y: B.GLOBE.y, draw: () => this.drawGlobe(r, g) });
    items.push({ y: B.CAT.y + 2, draw: () => this.drawCat(r, g) });
    items.push({ y: B.LIBRARIAN.y, draw: () => this.drawLibrarian(r, g) });
  },

  // ---------- the picture book (screen space) ----------
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'books' && this.st.read) this.drawBook(r, g, W, H);
    if (this.st.fade <= 0) return;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
  drawBook(r, g, W, H) {
    const ctx = r.ctx, rd = this.st.read, n = CFG.BOOKS.PAGES, s = g.s.books;
    ctx.fillStyle = 'rgba(10,8,6,0.72)'; ctx.fillRect(0, 0, W, H);
    const cw = Math.min(360, W - 32), ch = Math.min(440, H - 150), cx = W / 2, cy = 56 + (H - 128) / 2;
    // page flip: the card squashes to a spine and back, the picture switches half way
    let sq = 1, page = rd.page;
    if (rd.flip) { const k = rd.flip.t / rd.flip.dur; sq = Math.abs(Math.cos(k * Math.PI)); if (k < 0.5) page = rd.flip.from; }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.04, sq), 1); ctx.translate(-cx, -cy);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, cx - cw / 2 + 6, cy - ch / 2 + 8, cw, ch, 16); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 16); ctx.fill();
    ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, 16, ch, 16); ctx.fill();
    // the picture board
    const bw = cw - 56, bh = ch - 120, bx = cx + 8, by = cy - 12, t = g.time;
    ctx.save(); ctx.beginPath(); U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.clip();
    ctx.translate(bx, by); const k = Math.min(bw / 300, bh / 300); ctx.scale(k, k);
    this.drawPage(r, g, page, t);
    ctx.restore();
    ctx.strokeStyle = '#e8dcc4'; ctx.lineWidth = 3; U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.stroke();
    const titles = ['Once upon a time…', 'The cat and the butterfly', 'The End ✨'];
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(Math.min(22, cw * 0.06)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(titles[page], cx + 8, cy - ch / 2 + 34);
    if (s.bookmark) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(cx + cw / 2 - 44, cy - ch / 2 - 6); ctx.lineTo(cx + cw / 2 - 30, cy - ch / 2 - 6); ctx.lineTo(cx + cw / 2 - 30, cy - ch / 2 + 58); ctx.lineTo(cx + cw / 2 - 37, cy - ch / 2 + 50); ctx.lineTo(cx + cw / 2 - 44, cy - ch / 2 + 58); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(page < n - 1 ? 'Tap ▶ for the next page' : 'Press the button to stand up', cx + 8, cy + ch / 2 - 40);
    ctx.fillText(`${page + 1} / ${n}`, cx + 8, cy + ch / 2 - 16);
    ctx.restore();
    UI.placeCatalog({ x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch }, page > 0, page < n - 1);   // the ✕ and ◀ ▶ buttons sit on the card
  },
  // one page of simple pictures, drawn in a 300 × 300 box centred on the origin
  drawPage(r, g, page, t) {
    const ctx = r.ctx;
    if (page === 0) {
      // a sunny day: hill, house, tree, and the chef waving
      const sky = ctx.createLinearGradient(0, -150, 0, 60); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#d9f0ff');
      ctx.fillStyle = sky; ctx.fillRect(-150, -150, 300, 300);
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(100, -100, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t * 0.5; ctx.beginPath(); ctx.moveTo(100 + Math.cos(a) * 32, -100 + Math.sin(a) * 32); ctx.lineTo(100 + Math.cos(a) * 42, -100 + Math.sin(a) * 42); ctx.stroke(); }
      ctx.fillStyle = '#fff'; for (const [x, y] of [[-90, -90], [-70, -84], [-50, -92]]) { ctx.beginPath(); ctx.arc(x + Math.sin(t * 0.6) * 6, y, 14, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#79b85e'; ctx.beginPath(); ctx.ellipse(0, 150, 220, 130, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-100, 10, 8, 50); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(-96, -6, 30, 0, Math.PI * 2); ctx.arc(-116, 10, 20, 0, Math.PI * 2); ctx.arc(-76, 10, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e4572e'; ctx.fillRect(30, 10, 70, 50); ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.moveTo(22, 12); ctx.lineTo(65, -24); ctx.lineTo(108, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(42, 24, 16, 14); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(72, 30, 16, 30);
      r.drawPerson(-30, 88, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(-13 + Math.sin(t * 6) * 2, 58 - Math.abs(Math.sin(t * 6)) * 6, 4, 0, Math.PI * 2); ctx.fill();   // the waving hand
      ctx.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { ctx.fillStyle = ['#ff8fab', '#ffd166', '#fff', '#9ad0ff', '#ff6b6b'][k]; ctx.beginPath(); ctx.arc(-120 + k * 55, 120 + Math.sin(k) * 8, 5, 0, Math.PI * 2); ctx.fill(); }
    } else if (page === 1) {
      // the storyteller cat chasing a butterfly through the flowers
      ctx.fillStyle = '#d9f0ff'; ctx.fillRect(-150, -150, 300, 300);
      ctx.fillStyle = '#79b85e'; ctx.fillRect(-150, 40, 300, 110);
      ctx.fillStyle = '#56b862'; for (let k = 0; k < 12; k++) ctx.fillRect(-140 + k * 25, 36 + (k % 2) * 4, 12, 8);
      for (let k = 0; k < 6; k++) { ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-125 + k * 50, 120); ctx.lineTo(-125 + k * 50, 90); ctx.stroke(); ctx.fillStyle = ['#ff8fab', '#ffd166', '#ff6b6b', '#9ad0ff', '#fff', '#ff8fab'][k]; for (let p = 0; p < 5; p++) { ctx.beginPath(); ctx.arc(-125 + k * 50 + Math.cos(p * 1.26) * 7, 86 + Math.sin(p * 1.26) * 7, 5, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(-125 + k * 50, 86, 4, 0, Math.PI * 2); ctx.fill(); }
      // the cat, mid-pounce
      const hop = Math.abs(Math.sin(t * 4)) * 14;
      ctx.save(); ctx.translate(-40, 60 - hop); ctx.scale(2, 2);
      ctx.fillStyle = '#f2b134'; ctx.save(); ctx.rotate(Math.sin(t * 5) * 0.3 - 0.8); ctx.beginPath(); ctx.ellipse(16, -2, 4, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9962a'; for (let k = 0; k < 3; k++) ctx.fillRect(-6 + k * 6, -8, 3, 6);
      ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(14, -10, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(8, -24); ctx.lineTo(13, -17); ctx.closePath(); ctx.moveTo(22, -14); ctx.lineTo(20, -24); ctx.lineTo(15, -17); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(11, -11, 1.5, 0, Math.PI * 2); ctx.arc(18, -11, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(13, -7); ctx.lineTo(16, -7); ctx.lineTo(14.5, -5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.ellipse(-8, 8, 5, 3, 0, 0, Math.PI * 2); ctx.ellipse(8, 8, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // the butterfly flutters ahead
      const bx = 70 + Math.sin(t * 1.5) * 20, byy = -40 + Math.cos(t * 2.2) * 18, flap = Math.abs(Math.sin(t * 12));
      ctx.save(); ctx.translate(bx, byy);
      ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.ellipse(-12 * flap - 2, -4, 14 * Math.max(0.2, flap), 11, -0.4, 0, Math.PI * 2); ctx.ellipse(12 * flap + 2, -4, 14 * Math.max(0.2, flap), 11, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(-10 * flap - 2, 6, 9 * Math.max(0.2, flap), 7, 0.3, 0, Math.PI * 2); ctx.ellipse(10 * flap + 2, 6, 9 * Math.max(0.2, flap), 7, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; for (const dx of [-1, 1]) { ctx.beginPath(); ctx.arc(dx * 10 * flap, -4, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -2, -12, 4, 24, 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(-6, -20); ctx.moveTo(1, -12); ctx.lineTo(6, -20); ctx.stroke();
      ctx.restore();
    } else {
      // night: moon, twinkling stars, a big pizza, and everyone's asleep
      const sky = ctx.createLinearGradient(0, -150, 0, 150); sky.addColorStop(0, '#1b2a4a'); sky.addColorStop(1, '#3b4f7a');
      ctx.fillStyle = sky; ctx.fillRect(-150, -150, 300, 300);
      for (let k = 0; k < 18; k++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7); ctx.fillStyle = `rgba(255,243,176,${(0.4 + tw * 0.6).toFixed(2)})`; ctx.beginPath(); ctx.arc(-140 + ((k * 73) % 280), -140 + ((k * 47) % 170), 1.5 + tw * 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(90, -90, 28, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2a3b63'; ctx.beginPath(); ctx.arc(78, -98, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b3d5c'; ctx.beginPath(); ctx.ellipse(0, 160, 240, 90, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3b7dd8'; ctx.fillRect(-60, 50, 120, 70); ctx.fillStyle = '#2d5a8a'; ctx.beginPath(); ctx.moveTo(-70, 52); ctx.lineTo(0, 0); ctx.lineTo(70, 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(-40, 68, 22, 20); ctx.fillRect(18, 68, 22, 20); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z z', 40 + Math.sin(t * 2) * 4, 40 - (t % 2) * 10);
      r.drawPizza(0, -20 + Math.sin(t * 1.4) * 3, 36);
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✨ The End ✨', 0, 128);
    }
  },
};
Game.ext.unshift(BooksExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(BooksExt);
