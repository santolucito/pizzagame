'use strict';
// The cinema: City building 12 (middle row, facing Market Street) gets a bulb-lit marquee, a "NOW SHOWING" poster and a
// red carpet out to the sidewalk. Step inside for a lobby with a ticket booth ($3 for a ticket the chef holds until the
// usher takes it), a popcorn machine with popping kernels ($4 for a bucket the chef carries around for half a minute),
// two pizza-parody posters and a red-rope queue; through the curtain is the screening room: rows of red seats, a big
// screen, a flickering projector beam, a few moviegoers and an usher with a torch. Sit down and the lights dim while a
// short silent movie plays (a 20 s loop: a pizza-slice hero chases a runaway cheese across town, catches a rocket to the
// cheese moon, THE END); the chef munches popcorn if they have some.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.CINEMA = {
  BUILDING: 12,                                  // index in CFG.CITY.BUILDINGS: { x0: 5910, y0: 150, x1: 6040, y1: 456 }
  DOOR_OUT: { x: 5975, y: 470 },                 // on the sidewalk just below the door
  WORLD: { x0: 9500, y0: 3000, x1: 10100, y1: 3400 },
  WALL: 24, BACK_TOP: 3016,                      // the back walls are tall: posters, the booth and the screen hang on them
  LOBBY: { x0: 9524, y0: 3110, x1: 9800, y1: 3340 },
  HALL: { x0: 9824, y0: 3130, x1: 10076, y1: 3340 },
  CURTAIN: { x: 9812, y0: 3240, y1: 3304 },      // the gap in the wall between the lobby and the hall, hung with a curtain
  BOOTH: { x0: 9542, y0: 3030, x1: 9632, y1: 3116 }, SELLER: { x: 9587, y: 3100 },
  POSTERS: [{ x: 9669, y: 3054 }, { x: 9717, y: 3054 }],   // centres of the 42 × 58 frames on the lobby's back wall
  MACHINE: { x: 9770, y: 3090 }, GLASS: { x0: 9750, y0: 3038, x1: 9790, y1: 3088 },
  PADS: { ticket: { x: 9587, y: 3152 }, popcorn: { x: 9762, y: 3158 } },
  POSTS: [[9546, 3200], [9546, 3250], [9546, 3300], [9628, 3200], [9628, 3250], [9628, 3300]],   // the red-rope queue
  SCREEN: { x0: 9850, y0: 3022, x1: 10050, y1: 3120 },
  ROWS: [3166, 3206, 3246, 3286], COLS: [9858, 9886, 9914, 9986, 10014, 10042],   // seats; the aisle runs down the middle
  AUDIENCE: [{ r: 0, c: 1 }, { r: 2, c: 4 }, { r: 3, c: 0 }],
  USHER_HOME: { x: 9852, y: 3318 }, USHER_FAR: { x: 10048, y: 3318 }, AISLE_X: 9950,
  PROJECTOR: { x: 9950, y: 3348 },
  EXIT: { x: 9587, y: 3322 },                    // the mat inside the door (the door is in the lobby's bottom wall)
  POPCORN: 30, MOVIE: 20, GREET: 1.6,            // seconds: how long a bucket lasts, the movie loop, the usher's torch check
};
CFG.AREAS.cinema = { WORLD: CFG.CINEMA.WORLD };

const CinemaExt = {
  name: 'cinema',
  st: null,
  defaults: { cinema: { seen: false, tickets: 0, popcorns: 0, movies: 0 } },

  // ---------- state ----------
  build(g) {
    const C = CFG.CINEMA;
    if (!g.s.cinema) g.s.cinema = { seen: false, tickets: 0, popcorns: 0, movies: 0 };
    const seats = [];
    C.ROWS.forEach((y, r) => C.COLS.forEach((x, c) => seats.push({ x, y, r, c, taken: C.AUDIENCE.some((a) => a.r === r && a.c === c) })));
    const G = C.GLASS, kernels = [];
    for (let i = 0; i < 9; i++) kernels.push({ x: U.rand(G.x0 + 5, G.x1 - 5), y: G.y1 - 4, vx: 0, vy: 0, wait: U.rand(0, 1.5) });
    this.st = {
      fade: 0, dim: 0, seat: null,                                   // seat: { seat, t, greeted, ended }
      movieT: 0, ticket: false, popcorn: 0, munch: 0,
      usher: { x: C.USHER_HOME.x, y: C.USHER_HOME.y, facing: 1, moving: false, bob: 0, shine: 0, wait: 1, goal: C.USHER_FAR },
      seller: { bob: 0 }, kernels, curtain: 0, seats, obs: null,
    };
    const W = C.WORLD, L = C.LOBBY, H = C.HALL, w = C.WALL, o = [];
    o.push({ x: W.x0, y: L.y0 - w, w: L.x1 - W.x0, h: w });                       // the lobby's back wall band
    o.push({ x: L.x1, y: L.y0 - w, w: W.x1 - L.x1, h: H.y0 - L.y0 + w });          // the hall's (taller) back wall band
    o.push({ x: W.x0, y: L.y1, w: W.x1 - W.x0, h: w });                            // bottom wall
    o.push({ x: W.x0, y: L.y0, w, h: L.y1 - L.y0 }, { x: H.x1, y: H.y0, w, h: H.y1 - H.y0 });   // side walls
    o.push({ x: L.x1, y: L.y0, w: H.x0 - L.x1, h: C.CURTAIN.y0 - L.y0 }, { x: L.x1, y: C.CURTAIN.y1, w: H.x0 - L.x1, h: L.y1 - C.CURTAIN.y1 });   // the wall between, split by the curtain
    o.push({ x: C.BOOTH.x0, y: L.y0 - w, w: C.BOOTH.x1 - C.BOOTH.x0, h: C.BOOTH.y1 - L.y0 + w });
    o.push({ x: C.MACHINE.x - 24, y: L.y0 - w, w: 48, h: 36 });
    for (const [x, y] of C.POSTS) o.push({ x: x - 5, y: y - 5, w: 10, h: 10 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'cinema' && this.st ? this.st.obs : []; },
  free(x, y) {
    const C = CFG.CINEMA, L = C.LOBBY, H = C.HALL, r = 11;
    const inL = x > L.x0 + r && x < L.x1 - r && y > L.y0 + r && y < L.y1 - r;
    const inH = x > H.x0 + r && x < H.x1 - r && y > H.y0 + r && y < H.y1 - r;
    const inC = x > L.x1 - r - 2 && x < H.x0 + r + 2 && y > C.CURTAIN.y0 + r && y < C.CURTAIN.y1 - r;
    if (!inL && !inH && !inC) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inCityStreet(g) { return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  atDoor(g) { const D = CFG.CINEMA.DOOR_OUT, p = g.player; return this.inCityStreet(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  nearSeat(g) { const p = g.player; return this.st.seats.find((s) => !s.taken && U.dist(p.x, p.y, s.x, s.y) < 18) || null; },
  nearestFreeSeat(p) { let best = null, bd = Infinity; for (const s of this.st.seats) { if (s.taken) continue; const d = U.dist(p.x, p.y, s.x, s.y); if (d < bd) { bd = d; best = s; } } return best; },
  inHall(p) { const H = CFG.CINEMA.HALL; return p.x > H.x0 - 10; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, C = CFG.CINEMA, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'cinema') return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, C.EXIT.x, C.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    const s = this.nearSeat(g); if (s) return { label: '🪑 Sit down', run: (gg) => this.sitDown(gg, s) };
    return null;
  },
  enter(g) {
    const C = CFG.CINEMA, p = g.player;
    g.area = 'cinema'; p.x = C.EXIT.x; p.y = C.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.cinema.seen) { g.s.cinema.seen = true; g.toast('🎬 Welcome to the cinema!', true); }
  },
  leave(g) {
    const C = CFG.CINEMA, p = g.player;
    g.area = 'city'; p.x = C.DOOR_OUT.x; p.y = C.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.seat = null; this.st.dim = 0; this.st.fade = 0.45; Sfx.drop();
  },
  sitDown(g, seat) {
    const p = g.player;
    this.st.seat = { seat, t: 0, greeted: false, ended: false };
    this.st.movieT = 0; this.st.munch = 0;
    p.x = seat.x; p.y = seat.y; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st; if (!st.seat) return;
    st.seat = null; st.usher.shine = 0; g.player.moving = false; Sfx.drop();
  },
  home(g) {
    if (!this.st) return;
    const st = this.st, C = CFG.CINEMA;
    st.seat = null; st.fade = 0; st.dim = 0; st.movieT = 0;
    const u = st.usher; u.x = C.USHER_HOME.x; u.y = C.USHER_HOME.y; u.moving = false; u.shine = 0; u.wait = 1; u.goal = C.USHER_FAR;
  },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, C = CFG.CINEMA;
    if (this.free(p.x, p.y)) return false;
    p.x = C.EXIT.x; p.y = C.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, C = CFG.CINEMA;
    st.fade = Math.max(0, st.fade - dt);
    st.popcorn = Math.max(0, st.popcorn - dt);
    if (g.area !== 'cinema') { if (st.seat) st.seat = null; st.dim = 0; return; }
    const u = st.usher;
    if (st.seat) {
      // sitting: stay put, the lights go down and the movie rolls; the usher comes by with the torch once
      const s = st.seat; s.t += dt;
      p.x = s.seat.x; p.y = s.seat.y; p.moving = false; p.facing = 1;
      st.dim = Math.min(1, st.dim + dt * 1.4);
      const before = st.movieT; st.movieT = (st.movieT + dt) % C.MOVIE;
      if (before < 16 && st.movieT >= 16 && !s.ended) {
        s.ended = true; g.s.cinema.movies++;
        g.floats.push({ x: p.x, y: p.y - 76, text: 'The End! 🎬', color: '#ffe08a', t: 0, dur: 1.6, big: true });
        for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-18, 18), y0: p.y - 50 + U.rand(-10, 10), x1: 0, y1: 0, t: -i * 0.08, dur: 0.6 });
        Sfx.chime(); Haptics.success();
      }
      if (st.popcorn > 0) st.munch = (st.munch + dt) % 1.3;
      if (!s.greeted) {
        if (!u.shine) {
          if (U.moveToward(u, C.AISLE_X, s.seat.y + 12, 70, dt)) { u.shine = C.GREET; u.facing = s.seat.x < u.x ? -1 : 1; }
        } else {
          u.shine -= dt; u.moving = false;
          if (u.shine <= 0) {
            u.shine = 0; s.greeted = true; u.wait = 0.4;
            if (st.ticket) { st.ticket = false; g.floats.push({ x: p.x, y: p.y - 70, text: 'Enjoy the show! 🎟️', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
          }
        }
      } else this.paceUsher(g, dt);
    } else {
      this.rescue(g);
      st.dim = Math.max(0, st.dim - dt * 2);
      u.shine = 0;
      this.paceUsher(g, dt);
    }
    u.bob = u.moving ? u.bob + dt * 14 : 0;
    // the curtain parts as the chef walks up to it
    const cd = U.dist(p.x, p.y, C.CURTAIN.x, (C.CURTAIN.y0 + C.CURTAIN.y1) / 2), want = cd < 46 ? 1 : 0;
    st.curtain += (want - st.curtain) * Math.min(1, dt * 6);
    // the ticket seller sways a little; the popcorn pops
    st.seller.bob += dt;
    const G = C.GLASS;
    for (const k of st.kernels) {
      k.wait -= dt;
      if (k.y >= G.y1 - 4 && k.vy >= 0) { k.vy = 0; k.vx = 0; k.y = G.y1 - 4; if (k.wait <= 0) { k.vy = -U.rand(110, 200); k.vx = U.rand(-40, 40); k.wait = U.rand(0.4, 1.8); } }
      else { k.vy += 420 * dt; k.x += k.vx * dt; k.y += k.vy * dt; if (k.x < G.x0 + 4) { k.x = G.x0 + 4; k.vx = Math.abs(k.vx); } if (k.x > G.x1 - 4) { k.x = G.x1 - 4; k.vx = -Math.abs(k.vx); } if (k.y < G.y0 + 10) { k.y = G.y0 + 10; k.vy = Math.abs(k.vy) * 0.4; } }
    }
  },
  paceUsher(g, dt) {
    const u = this.st.usher, C = CFG.CINEMA;
    if (u.wait > 0) { u.wait -= dt; u.moving = false; return; }
    if (U.moveToward(u, u.goal.x, u.goal.y, 40, dt)) { u.wait = U.rand(1.5, 3); u.goal = u.goal === C.USHER_HOME ? C.USHER_FAR : C.USHER_HOME; }
  },
  pads(g) {
    if (g.area !== 'cinema') return [];
    const P = CFG.CINEMA.PADS;
    return [
      { key: 'cinemaTicket', label: 'Ticket', ico: '🎟️', pos: P.ticket, price: 3, sub: 'one, please!' },
      { key: 'cinemaPopcorn', label: 'Popcorn', ico: '🍿', pos: P.popcorn, price: 4, sub: 'hot & buttery' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, st = this.st;
    if (pad.key === 'cinemaTicket') { st.ticket = true; g.s.cinema.tickets++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A ticket! 🎟️', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
    else if (pad.key === 'cinemaPopcorn') { st.popcorn = CFG.CINEMA.POPCORN; g.s.cinema.popcorns++; g.floats.push({ x: p.x, y: p.y - 60, text: 'Popcorn! 🍿', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, C = CFG.CINEMA, st = this.st, s = g.s.cinema;
    if (g.area === 'city') {
      if (!this.inCityStreet(g)) return undefined;
      const d = U.dist(p.x, p.y, C.DOOR_OUT.x, C.DOOR_OUT.y);
      if (d < 70) return { text: 'Watch a movie at the cinema! 🎬', target: d < 30 ? null : C.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'cinema') return undefined;
    if (st.seat) return st.popcorn > 0 ? { text: 'Munch munch… enjoy the show! 🍿', target: null } : { text: 'Shh… enjoy the show! 🎬', target: null };
    const can = (key, price) => g.s.cash + (g.s.padPaid[key] || 0) >= price;
    if (!st.ticket && !s.tickets && can('cinemaTicket', 3)) return { text: 'Buy a ticket at the booth! 🎟️', target: C.PADS.ticket };
    if (!s.popcorns && st.popcorn <= 0 && can('cinemaPopcorn', 4)) return { text: 'Get some popcorn! 🍿', target: C.PADS.popcorn };
    if (!this.inHall(p)) return { text: 'Go through the curtain to the movie 🎬', target: { x: C.CURTAIN.x, y: (C.CURTAIN.y0 + C.CURTAIN.y1) / 2 } };
    return { text: 'Sit down and watch the movie 🪑', target: this.nearestFreeSeat(p) };
  },

  // ---------- the City outside: the marquee, the poster and the red carpet (static); blinking bulbs (live) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.CINEMA.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40;
    // the marquee replaces the plain sign: a black board with a cream panel and a row of bulb sockets
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, cx - 54, gy - 30, 112, 30, 5); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - 58, gy - 34, 116, 30, 5); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - 50, gy - 29, 100, 20, 3); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎬 CINEMA', cx, gy - 19);
    ctx.fillStyle = '#5c4a3a'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(cx - 48 + i * 12, gy - 32, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx - 48 + i * 12, gy - 6, 2, 0, Math.PI * 2); ctx.fill(); }
    // a NOW SHOWING poster in the right-hand window
    ctx.fillStyle = '#fbe9c8'; ctx.fillRect(cx + 16, gy + 10, 38, 20);
    ctx.strokeStyle = '#b8401c'; ctx.lineWidth = 1.5; ctx.strokeRect(cx + 17, gy + 11, 36, 18);
    this.drawSlice(ctx, cx + 26, gy + 20, 10, 0, 0); this.drawCheese(ctx, cx + 44, gy + 21, 8, 0);
    ctx.fillStyle = '#b8401c'; ctx.font = r.font(5); ctx.fillText('NOW SHOWING', cx + 35, gy + 13);
    // the red carpet from the door across the sidewalk
    const D = CFG.CINEMA.DOOR_OUT;
    ctx.fillStyle = '#c62828'; ctx.fillRect(cx - 14, b.y1, 28, D.y + 10 - b.y1);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(cx - 14, b.y1, 3, D.y + 10 - b.y1); ctx.fillRect(cx + 11, b.y1, 3, D.y + 10 - b.y1);
  },

  // ---------- the interior, static ----------
  paint: { cinema(r, g) { CinemaExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.CINEMA, W = C.WORLD, L = C.LOBBY, H = C.HALL, w = C.WALL;
    // outside the building: dark plum with a faint tile pattern
    ctx.fillStyle = '#2a2238'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(W.x0 + 8, C.BACK_TOP + 10, W.x1 - W.x0, L.y1 + w - C.BACK_TOP);
    // the lobby floor: red carpet with a gold diamond pattern
    ctx.fillStyle = '#b3262e'; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    ctx.fillStyle = 'rgba(255,215,120,0.22)';
    for (let y = L.y0; y < L.y1; y += 24) for (let x = L.x0 + ((y / 24) % 2) * 12; x < L.x1; x += 24) { ctx.beginPath(); ctx.moveTo(x + 12, y + 2); ctx.lineTo(x + 20, y + 12); ctx.lineTo(x + 12, y + 22); ctx.lineTo(x + 4, y + 12); ctx.closePath(); ctx.fill(); }
    // the hall floor: deep blue carpet with a red aisle runner
    ctx.fillStyle = '#2f2a5a'; ctx.fillRect(H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = H.y0; y < H.y1; y += 16) for (let x = H.x0 + ((y / 16) % 2) * 8; x < H.x1; x += 16) ctx.fillRect(x + 3, y + 3, 4, 4);
    ctx.fillStyle = '#8e2430'; ctx.fillRect(C.AISLE_X - 18, H.y0, 36, H.y1 - H.y0); ctx.fillStyle = '#e0b44c'; ctx.fillRect(C.AISLE_X - 18, H.y0, 2, H.y1 - H.y0); ctx.fillRect(C.AISLE_X + 16, H.y0, 2, H.y1 - H.y0);
    for (let y = H.y0 + 6; y < H.y1; y += 20) { ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(C.AISLE_X - 22, y, 1.5, 0, Math.PI * 2); ctx.arc(C.AISLE_X + 22, y, 1.5, 0, Math.PI * 2); ctx.fill(); }   // aisle lights
    // the lobby's back wall: cream art-deco stripes and a gold cornice
    ctx.fillStyle = '#f3dca0'; ctx.fillRect(W.x0, C.BACK_TOP, L.x1 - W.x0, L.y0 - C.BACK_TOP);
    ctx.fillStyle = '#ecc97f'; for (let x = W.x0 + 6; x < L.x1; x += 16) ctx.fillRect(x, C.BACK_TOP, 6, L.y0 - C.BACK_TOP);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(W.x0, C.BACK_TOP, L.x1 - W.x0, 5); ctx.fillStyle = '#c62828'; ctx.fillRect(W.x0, C.BACK_TOP + 5, L.x1 - W.x0, 3);
    ctx.fillStyle = '#6b3a2e'; ctx.fillRect(W.x0, L.y0 - 6, L.x1 - W.x0, 6);
    // the hall's back wall: maroon with the big screen, silver frame and red drapes on both sides
    ctx.fillStyle = '#4a1a2a'; ctx.fillRect(L.x1, C.BACK_TOP, W.x1 - L.x1, H.y0 - C.BACK_TOP);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(L.x1, C.BACK_TOP, W.x1 - L.x1, 5);
    ctx.fillStyle = '#6b3a2e'; ctx.fillRect(L.x1, H.y0 - 6, W.x1 - L.x1, 6);
    const S = C.SCREEN;
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, S.x0 - 6, S.y0 - 6, S.x1 - S.x0 + 12, S.y1 - S.y0 + 12, 5); ctx.fill();
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    for (const side of [-1, 1]) {   // drapes
      const dx = side < 0 ? S.x0 - 24 : S.x1 + 8;
      ctx.fillStyle = '#9b1c2c'; ctx.fillRect(dx, C.BACK_TOP + 4, 16, H.y0 - C.BACK_TOP - 6);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let k = 0; k < 3; k++) ctx.fillRect(dx + 3 + k * 5, C.BACK_TOP + 4, 2, H.y0 - C.BACK_TOP - 6);
      ctx.fillStyle = '#e0b44c'; ctx.fillRect(dx - 2, C.BACK_TOP + 50, 20, 4);   // tie-back
    }
    // the outer walls, the partition and the gap for the curtain (its rail is gold)
    ctx.fillStyle = '#6b3a2e';
    ctx.fillRect(W.x0, L.y1, W.x1 - W.x0, w); ctx.fillRect(W.x0, L.y0, w, L.y1 - L.y0); ctx.fillRect(H.x1, H.y0, w, H.y1 - H.y0);
    ctx.fillRect(L.x1, L.y0, H.x0 - L.x1, C.CURTAIN.y0 - L.y0); ctx.fillRect(L.x1, C.CURTAIN.y1, H.x0 - L.x1, L.y1 - C.CURTAIN.y1);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = W.x0; x < W.x1; x += 16) ctx.fillRect(x, L.y1, 2, w); for (let y = L.y0; y < L.y1; y += 16) { ctx.fillRect(W.x0, y, w, 2); ctx.fillRect(H.x1, y, w, 2); ctx.fillRect(L.x1, y, H.x0 - L.x1, 2); }
    ctx.fillStyle = '#4a2a1e'; ctx.fillRect(W.x0, L.y1, W.x1 - W.x0, 3); ctx.fillRect(W.x0, L.y0, 3, L.y1 - L.y0); ctx.fillRect(W.x1 - 3, H.y0, 3, H.y1 - H.y0);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(L.x1 - 2, C.CURTAIN.y0 - 4, H.x0 - L.x1 + 4, 4);
    ctx.fillStyle = '#2f9e44'; U.roundRect(ctx, C.CURTAIN.x - 14, C.CURTAIN.y0 - 18, 28, 11, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MOVIE', C.CURTAIN.x, C.CURTAIN.y0 - 12.5);
    // the ticket booth: a gold-and-red kiosk with a glass window and a TICKETS sign (the seller is drawn live)
    const B = C.BOOTH;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 6); ctx.fill();
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0 - 8, 16);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.fillText('TICKETS', (B.x0 + B.x1) / 2, B.y0 + 12);
    ctx.fillStyle = '#dff3ff'; ctx.fillRect(B.x0 + 10, B.y0 + 24, B.x1 - B.x0 - 20, 54);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(B.x0 + 12, B.y0 + 26, 8, 50);
    // the posters: pizza parodies in gold frames
    this.drawPoster(r, C.POSTERS[0], 0); this.drawPoster(r, C.POSTERS[1], 1);
    // the popcorn machine's cart (the glass box pops live)
    const M = C.MACHINE;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(M.x - 20, M.y + 4, 48, 30);
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, M.x - 24, M.y, 48, 30, 4); ctx.fill();
    ctx.fillStyle = '#fff8ee'; for (let k = 0; k < 3; k++) ctx.fillRect(M.x - 18 + k * 16, M.y + 3, 6, 24);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(M.x - 24, M.y + 12, 48, 7); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.fillText('POPCORN', M.x, M.y + 15.5);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(M.x - 26, M.y - 2, 52, 3);
    // the red-rope queue: gold posts, velvet ropes sagging between them
    ctx.strokeStyle = '#c62828'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < C.POSTS.length - 1; i++) { if (i === 2) continue; const [ax, ay] = C.POSTS[i], [bx, by] = C.POSTS[i + 1]; ctx.beginPath(); ctx.moveTo(ax, ay - 12); ctx.quadraticCurveTo((ax + bx) / 2 + 7, (ay + by) / 2 - 4, bx, by - 12); ctx.stroke(); }
    for (const [x, y] of C.POSTS) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 2, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b8862c'; ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0b44c'; ctx.fillRect(x - 2, y - 16, 4, 16); ctx.beginPath(); ctx.arc(x, y - 17, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // seat cushions and their shadows (backs and armrests are drawn live so the chef can sit between them)
    for (const sy of C.ROWS) for (const sx of C.COLS) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx - 11, sy - 4, 24, 14); ctx.fillStyle = '#a81e2a'; U.roundRect(ctx, sx - 12, sy - 6, 24, 14, 4); ctx.fill(); }
    // the projector in the bottom wall and a little booth window
    const P = C.PROJECTOR;
    ctx.fillStyle = '#3a3f4a'; U.roundRect(ctx, P.x - 18, P.y - 12, 36, 20, 4); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(P.x - 8, P.y - 16, 7, 0, Math.PI * 2); ctx.arc(P.x + 8, P.y - 16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(P.x - 8, P.y - 16, 2.5, 0, Math.PI * 2); ctx.arc(P.x + 8, P.y - 16, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(P.x, P.y - 6, 4, 0, Math.PI * 2); ctx.fill();   // the lens
    // the door in the lobby's bottom wall, its mat, and the name plate below
    const E = C.EXIT;
    ctx.fillStyle = '#4a2a1e'; ctx.fillRect(E.x - 22, L.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, L.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, L.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, E.x - 21, E.y - 8, 42, 14, 3); ctx.fill(); ctx.fillStyle = '#c62828'; U.roundRect(ctx, E.x - 18, E.y - 6, 36, 10, 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(7); ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (L.x0 + L.x1) / 2 - 46, L.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🎬 CINEMA 🎬', (L.x0 + L.x1) / 2, L.y1 + w + 11);
  },
  drawPoster(r, P, i) {
    const ctx = r.ctx, x0 = P.x - 21, y0 = P.y - 29;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 + 3, y0 + 3, 42, 58);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(x0, y0, 42, 58);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (i === 0) {
      // "THE GREAT CHEESE CHASE": a sunny yellow poster, the slice hero after the cheese
      ctx.fillStyle = '#ffd166'; ctx.fillRect(x0 + 3, y0 + 3, 36, 52);
      ctx.fillStyle = '#9fd8ff'; ctx.fillRect(x0 + 3, y0 + 3, 36, 18);
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.ellipse(x0 + 21, y0 + 30, 22, 9, 0, Math.PI, 0); ctx.fill();
      this.drawSlice(ctx, x0 + 13, y0 + 34, 14, 1, 0.5); this.drawCheese(ctx, x0 + 30, y0 + 35, 10, 1);
      ctx.fillStyle = '#b8401c'; ctx.font = r.font(5.5); ctx.fillText('THE GREAT', x0 + 21, y0 + 46); ctx.font = r.font(6.5); ctx.fillText('CHEESE CHASE', x0 + 21, y0 + 52);
    } else {
      // "PIZZA WARS": a starry night poster with a slice holding a glowing breadstick
      ctx.fillStyle = '#1b2a5b'; ctx.fillRect(x0 + 3, y0 + 3, 36, 52);
      ctx.fillStyle = '#fff'; for (let k = 0; k < 14; k++) { const h = this.hash(k * 3 + 1), v = this.hash(k * 5 + 2); ctx.fillRect(x0 + 5 + h * 32, y0 + 5 + v * 36, 1.5, 1.5); }
      ctx.strokeStyle = '#8ef0a0'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + 26, y0 + 30); ctx.lineTo(x0 + 34, y0 + 10); ctx.stroke();
      ctx.strokeStyle = 'rgba(142,240,160,0.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 + 26, y0 + 30); ctx.lineTo(x0 + 34, y0 + 10); ctx.stroke();
      this.drawSlice(ctx, x0 + 19, y0 + 30, 16, 0, 0);
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('PIZZA', x0 + 21, y0 + 45); ctx.fillText('WARS', x0 + 21, y0 + 52);
    }
  },
  hash(i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); },

  // ---------- the movie's cast: a pizza slice hero and a runaway cheese ----------
  drawSlice(ctx, x, y, s, run, phase) {
    // a slice standing on its tip, crust on top, little legs running when `run` > 0
    const legs = run ? Math.sin(phase) * s * 0.3 : 0;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = Math.max(1, s * 0.12); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.12, y + s * 0.3); ctx.lineTo(x - s * 0.22 + legs, y + s * 0.62); ctx.moveTo(x + s * 0.12, y + s * 0.3); ctx.lineTo(x + s * 0.22 - legs, y + s * 0.62); ctx.stroke();
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(x - s * 0.55, y - s * 0.45); ctx.lineTo(x + s * 0.55, y - s * 0.45); ctx.lineTo(x, y + s * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(x - s * 0.58, y - s * 0.5); ctx.lineTo(x + s * 0.58, y - s * 0.5); ctx.lineTo(x + s * 0.5, y - s * 0.3); ctx.lineTo(x - s * 0.5, y - s * 0.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 0.12, s * 0.09, 0, Math.PI * 2); ctx.arc(x + s * 0.22, y - s * 0.1, s * 0.09, 0, Math.PI * 2); ctx.arc(x, y + s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - s * 0.08, y - s * 0.18, s * 0.06, 0, Math.PI * 2); ctx.arc(x + s * 0.08, y - s * 0.18, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = Math.max(0.8, s * 0.06); ctx.beginPath(); ctx.arc(x, y - s * 0.04, s * 0.1, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  },
  drawCheese(ctx, x, y, s, run, phase) {
    const legs = run ? Math.sin((phase || 0) + 1) * s * 0.3 : 0;
    if (run) { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = Math.max(1, s * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - s * 0.15, y + s * 0.35); ctx.lineTo(x - s * 0.25 + legs, y + s * 0.7); ctx.moveTo(x + s * 0.2, y + s * 0.35); ctx.lineTo(x + s * 0.3 - legs, y + s * 0.7); ctx.stroke(); }
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x - s * 0.55, y + s * 0.4); ctx.lineTo(x + s * 0.55, y + s * 0.4); ctx.lineTo(x + s * 0.55, y - s * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.15, s * 0.1, 0, Math.PI * 2); ctx.arc(x + s * 0.05, y + s * 0.28, s * 0.07, 0, Math.PI * 2); ctx.arc(x + s * 0.38, y - s * 0.18, s * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + s * 0.12, y + s * 0.02, s * 0.06, 0, Math.PI * 2); ctx.arc(x + s * 0.3, y - s * 0.08, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = Math.max(0.8, s * 0.06); ctx.beginPath(); ctx.arc(x + s * 0.22, y + s * 0.14, s * 0.1, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  },
  // the 20-second silent picture, drawn in the screen's own coordinates (0..200 × 0..98). t < 0 shows the idle slide.
  drawMovie(r, t) {
    const ctx = r.ctx, S = CFG.CINEMA.SCREEN, W = S.x1 - S.x0, H = S.y1 - S.y0;
    ctx.save(); ctx.beginPath(); ctx.rect(S.x0, S.y0, W, H); ctx.clip(); ctx.translate(S.x0, S.y0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (t < 0) {
      ctx.fillStyle = '#2b2b36'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5c6670'; ctx.font = r.font(12); ctx.fillText('🎞️ PIZZA PICTURES', W / 2, H / 2 - 8);
      ctx.font = r.font(8); ctx.fillText('sit down for the show', W / 2, H / 2 + 10);
      ctx.restore(); return;
    }
    const ground = H - 16;
    if (t < 4) {
      // title card
      const k = t / 4; ctx.fillStyle = '#fbe9c8'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8401c'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, W - 12, H - 12); ctx.lineWidth = 1; ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(0.94 + k * 0.06, 0.94 + k * 0.06);
      ctx.fillStyle = '#6b3a2e'; ctx.font = r.font(9); ctx.fillText('PIZZA PICTURES presents', 0, -30);
      ctx.fillStyle = '#b8401c'; ctx.font = r.font(11); ctx.fillText('THE GREAT', 0, -14); ctx.font = r.font(14); ctx.fillText('CHEESE CHASE', 0, 3);
      this.drawSlice(ctx, -76, 8, 22, 0, 0); this.drawCheese(ctx, 76, 10, 18, 0);
      ctx.fillStyle = '#6b3a2e'; ctx.font = r.font(7); ctx.fillText('a silent picture', 0, 24);
      ctx.restore();
    } else if (t < 7.5 || (t >= 9 && t < 11)) {
      // the chase across town: the cheese bounces ahead, the slice runs after it, houses roll by
      const ct = t < 7.5 ? t - 4 : t - 5.5, off = (ct * 70) % 60;
      ctx.fillStyle = '#9fd8ff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(170, 18, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { const cx = ((k * 90 - ct * 20) % (W + 60) + W + 60) % (W + 60) - 30; ctx.beginPath(); ctx.arc(cx, 20 + k * 6, 8, 0, Math.PI * 2); ctx.arc(cx + 9, 18 + k * 6, 6, 0, Math.PI * 2); ctx.arc(cx - 9, 22 + k * 6, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#8bd17c'; ctx.beginPath(); ctx.ellipse(40 - off * 0.3, 60, 70, 16, 0, Math.PI, 0); ctx.ellipse(160 - off * 0.3, 62, 80, 18, 0, Math.PI, 0); ctx.fill();
      for (let k = -1; k < 5; k++) {
        const hx = k * 60 - off, col = ['#ef8a62', '#7fc8f8', '#f6c453', '#b39ddb', '#e8a0bf', '#a5d6a7'][((k + 10) % 6)];
        ctx.fillStyle = col; ctx.fillRect(hx, 44, 30, 26); ctx.fillStyle = '#b8401c'; ctx.beginPath(); ctx.moveTo(hx - 4, 44); ctx.lineTo(hx + 15, 30); ctx.lineTo(hx + 34, 44); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(hx + 5, 50, 7, 7); ctx.fillRect(hx + 18, 50, 7, 7); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(hx + 12, 59, 7, 11);
      }
      ctx.fillStyle = '#3f9a4a'; ctx.fillRect(0, ground - 2, W, H - ground + 2); ctx.fillStyle = '#b5773a'; ctx.fillRect(0, ground + 4, W, 6);
      const hop = Math.abs(Math.sin(ct * 9)) * 9;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(140, ground + 2, 10, 3, 0, 0, Math.PI * 2); ctx.ellipse(58, ground + 2, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
      this.drawCheese(ctx, 140 + Math.sin(ct * 3) * 6, ground - 12 - hop, 18, 1, ct * 14);
      this.drawSlice(ctx, 58, ground - 14, 24, 1, ct * 14);
      for (let k = 0; k < 3; k++) { const ph = (ct * 2 + k / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - ph)).toFixed(2)})`; ctx.beginPath(); ctx.arc(44 - ph * 18, ground - 2 - ph * 6, 2 + ph * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(9); ctx.fillText('!', 150, ground - 36 - hop);
    } else if (t < 9) {
      // intertitle
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#fbe9c8'; ctx.lineWidth = 1.5; ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.fillStyle = '#fbe9c8'; ctx.font = r.font(12); ctx.fillText('"Come back, Cheese!"', W / 2, H / 2);
    } else if (t < 16) {
      // the rocket: the slice blasts off to the moon, where the cheese is waiting (the moon IS cheese)
      const k = U.clamp((t - 11) / 4.6, 0, 1), e = U.easeOut(k);
      ctx.fillStyle = '#1b2a5b'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 22; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 4 + i); ctx.globalAlpha = 0.4 + tw * 0.6; ctx.fillRect(this.hash(i * 7 + 3) * W, this.hash(i * 11 + 5) * (H - 20), 1.6, 1.6); } ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(160, 26, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(154, 22, 3.5, 0, Math.PI * 2); ctx.arc(166, 32, 2.8, 0, Math.PI * 2); ctx.arc(167, 18, 2, 0, Math.PI * 2); ctx.fill();
      if (k > 0.8) this.drawCheese(ctx, 160, 8, 12, 0);
      ctx.fillStyle = '#4a5c7a'; ctx.beginPath(); ctx.ellipse(W / 2, H + 10, 140, 30, 0, Math.PI, 0); ctx.fill();   // the hill left behind
      const rx = 36 + e * 108, ry = ground - 8 - e * 70, ang = -0.55;
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(ang);
      if (k < 1) for (let i = 0; i < 3; i++) { const fl = 10 + Math.sin(t * 40 + i * 2) * 4; ctx.fillStyle = ['#ff8c42', '#ffd166', '#fff'][i]; ctx.beginPath(); ctx.moveTo(-6 + i * 2, 14); ctx.lineTo(6 - i * 2, 14); ctx.lineTo(0, 14 + fl * (1 - i * 0.25)); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(-9, 14); ctx.lineTo(-15, 20); ctx.lineTo(-9, 4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, 14); ctx.lineTo(15, 20); ctx.lineTo(9, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f3f3f3'; U.roundRect(ctx, -9, -18, 18, 32, 6); ctx.fill();
      ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(-9, -16); ctx.lineTo(0, -30); ctx.lineTo(9, -16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(0, -4, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 1.5; ctx.stroke();
      this.drawSlice(ctx, 0, -4, 8, 0, 0);
      ctx.restore();
      for (let i = 0; i < 4; i++) { const ph = (t * 1.5 + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.5 * (1 - ph)).toFixed(2)})`; ctx.beginPath(); ctx.arc(rx - 14 - ph * 16, ry + 14 + ph * 12, 3 + ph * 5, 0, Math.PI * 2); ctx.fill(); }
    } else {
      // the end card: friends again
      ctx.fillStyle = '#fbe9c8'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8401c'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, W - 12, H - 12);
      ctx.fillStyle = '#b8401c'; ctx.font = r.font(22); ctx.fillText('THE END', W / 2, 32);
      this.drawSlice(ctx, 74, 68, 24, 0, 0); this.drawCheese(ctx, 124, 70, 18, 0);
      const beat = 1 + Math.sin(t * 6) * 0.15; ctx.fillStyle = '#ff5c8a'; ctx.font = r.font(12 * beat); ctx.fillText('❤', 100, 60);
      for (let i = 0; i < 5; i++) { const ph = (t * 0.8 + i / 5) % 1; ctx.fillStyle = `rgba(255,209,102,${(1 - ph).toFixed(2)})`; ctx.font = r.font(6 + ph * 6); ctx.fillText('✦', 20 + i * 40, 80 - ph * 50); }
    }
    // silent-picture finish: flicker, a vignette and the odd scratch; a quick black blink at each cut
    const fl = this.hash(Math.floor(t * 24)) * 0.08;
    ctx.fillStyle = `rgba(0,0,0,${(0.04 + fl).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (this.hash(Math.floor(t * 8) + 99) < 0.25) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(this.hash(Math.floor(t * 8) + 7) * W, 0, 1, H); }
    for (const cut of [4, 7.5, 9, 11, 16]) { const a = 1 - Math.abs(t - cut) / 0.2; if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a.toFixed(2)})`; ctx.fillRect(0, 0, W, H); } }
    ctx.restore();
  },

  // ---------- moving things ----------
  // outside the building's little map the screen would show the dark backdrop: paint it around the rooms
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.CINEMA.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#2a2238';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawMachineGlass(r, g) {
    const ctx = r.ctx, G = CFG.CINEMA.GLASS, t = g.time;
    ctx.fillStyle = 'rgba(223,243,255,0.55)'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
    ctx.fillStyle = `rgba(255,160,60,${(0.25 + 0.1 * Math.sin(t * 9)).toFixed(2)})`; ctx.fillRect(G.x0 + 2, G.y0 + 2, G.x1 - G.x0 - 4, 10);   // the heat lamp's glow
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (G.x0 + G.x1) / 2 - 9, G.y0 + 4, 18, 10, 3); ctx.fill();   // the kettle
    ctx.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { const x = G.x0 + 5 + ((i * 37) % (G.x1 - G.x0 - 10)), y = G.y1 - 5 - ((i * 13) % 7); ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }   // the pile
    for (const k of this.st.kernels) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(k.x, k.y, 2.6, 0, Math.PI * 2); ctx.arc(k.x + 2, k.y - 1.5, 1.8, 0, Math.PI * 2); ctx.arc(k.x - 2, k.y - 1, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(k.x + 0.5, k.y + 0.5, 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#c62828'; ctx.lineWidth = 3; ctx.strokeRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0); ctx.fillStyle = '#c62828'; ctx.fillRect(G.x0 - 4, G.y0 - 6, G.x1 - G.x0 + 8, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(G.x0 + 3, G.y0 + 14, 4, G.y1 - G.y0 - 18);
    for (let k = 0; k < 2; k++) { const ph = (t * 0.7 + k * 0.5) % 1; ctx.fillStyle = `rgba(255,255,255,${(0.35 * (1 - ph)).toFixed(2)})`; ctx.beginPath(); ctx.arc(G.x0 + 10 + k * 20 + Math.sin(ph * 6) * 4, G.y0 - 8 - ph * 16, 3 + ph * 3, 0, Math.PI * 2); ctx.fill(); }   // steam
  },
  drawCurtain(r, g) {
    const ctx = r.ctx, C = CFG.CINEMA.CURTAIN, k = this.st.curtain, h = C.y1 - C.y0, open = k * (h / 2 - 6);
    for (const side of [-1, 1]) {
      const y0 = side < 0 ? C.y0 : C.y1 - (h / 2 - open), hh = h / 2 - open;
      ctx.fillStyle = '#9b1c2c'; ctx.fillRect(C.x - 13, y0, 26, hh);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let x = C.x - 10; x < C.x + 12; x += 6) ctx.fillRect(x, y0, 2, hh);
      ctx.fillStyle = '#e0b44c'; ctx.fillRect(C.x - 14, side < 0 ? y0 + hh - 3 : y0, 28, 3);
    }
  },
  drawSeatBack(r, s) { const ctx = r.ctx; ctx.fillStyle = '#8e1a24'; U.roundRect(ctx, s.x - 13, s.y - 30, 26, 26, 6); ctx.fill(); ctx.fillStyle = '#c62828'; U.roundRect(ctx, s.x - 10, s.y - 27, 20, 18, 5); ctx.fill(); },
  drawSeatArms(r, s) { const ctx = r.ctx; ctx.fillStyle = '#6b3a2e'; U.roundRect(ctx, s.x - 16, s.y - 14, 5, 18, 2); ctx.fill(); U.roundRect(ctx, s.x + 11, s.y - 14, 5, 18, 2); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(s.x - 16, s.y - 14, 5, 2); ctx.fillRect(s.x + 11, s.y - 14, 5, 2); },
  drawBucket(ctx, x, y, s) {
    // a striped popcorn bucket with a puff of popcorn on top; s scales it
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 6 * s, y - 6 * s, 12 * s, 14 * s, 2 * s); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.fillRect(x - 4.5 * s, y - 6 * s, 2.5 * s, 14 * s); ctx.fillRect(x + 1 * s, y - 6 * s, 2.5 * s, 14 * s);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4 * s, y - 7 * s, 3 * s, 0, Math.PI * 2); ctx.arc(x + 1 * s, y - 9 * s, 3.4 * s, 0, Math.PI * 2); ctx.arc(x + 5 * s, y - 6.5 * s, 2.8 * s, 0, Math.PI * 2); ctx.arc(x - 1 * s, y - 5 * s, 2.6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x - 3 * s, y - 6 * s, 1 * s, 0, Math.PI * 2); ctx.arc(x + 2 * s, y - 9 * s, 1 * s, 0, Math.PI * 2); ctx.fill();
  },
  drawPopcorn(r, g) {
    const ctx = r.ctx, p = g.player, st = this.st, f = p.facing || 1, x = p.x + f * 16, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    this.drawBucket(ctx, x, y, 1);
    if (st.seat && st.popcorn > 0) {
      // munching: a piece sails from the bucket to the chef's mouth
      const k = U.clamp(st.munch / 0.6, 0, 1), mx = p.x + f * 2, my = p.y - 34, px = U.lerp(x, mx, k), py = U.lerp(y - 10, my, k) - Math.sin(k * Math.PI) * 10;
      if (k < 1) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.arc(px + 2, py - 1, 1.8, 0, Math.PI * 2); ctx.fill(); }
      else if (st.munch < 1.0) { ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('munch', p.x - f * 20, p.y - 44 - (st.munch - 0.6) * 20); }
    }
  },
  drawTicket(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x - f * 16, y = p.y - 18 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3 * f);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, -8, -5, 16, 10, 2); ctx.fill(); ctx.fillStyle = '#c62828'; ctx.fillRect(-8, -5, 16, 2); ctx.fillRect(-8, 3, 16, 2);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ADMIT 1', 0, 0);
    ctx.restore();
  },
  drawSeller(r, g) {
    const ctx = r.ctx, S = CFG.CINEMA.SELLER, sb = Math.sin(this.st.seller.bob * 1.5) * 1.5;
    r.drawPerson(S.x, S.y + sb, { shirt: '#c62828', skin: '#c68642', hat: 'cap', capColor: '#e0b44c', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', bowtie: '#2b1d14' });
    ctx.fillStyle = '#ffd166'; ctx.fillRect(S.x + 10, S.y - 20 + sb, 10, 6); ctx.fillStyle = '#c62828'; ctx.fillRect(S.x + 10, S.y - 20 + sb, 10, 1.5);   // a ticket roll in hand
  },
  drawBoothFront(r, g) {
    const ctx = r.ctx, B = CFG.CINEMA.BOOTH;
    ctx.fillStyle = '#c62828'; ctx.fillRect(B.x0, B.y0 + 78, B.x1 - B.x0, B.y1 - B.y0 - 78);
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, B.x0 - 2, B.y0 + 74, B.x1 - B.x0 + 4, 10, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$3', (B.x0 + B.x1) / 2, B.y1 - 8);
  },
  drawUsher(r, g) {
    const ctx = r.ctx, u = this.st.usher;
    r.drawPerson(u.x, u.y, { shirt: '#8e2430', skin: '#f1c27d', hat: 'cap', capColor: '#8e2430', facing: u.facing, moving: u.moving, bob: u.bob, carry: 0, pants: '#2d3a4a', belt: true });
    const f = u.facing || 1;   // the torch in the leading hand
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, u.x + f * 12 - 3, u.y - 22, 6, 10, 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(u.x + f * 12 - 3, u.y - 14, 6, 3);
  },
  drawAudience(r, g, a, s) {
    const looks = [
      { shirt: '#41b883', skin: '#f1c27d', hair: '#8d5a2b', hairStyle: 2, pants: '#4a4a4a' },
      { shirt: '#3b7dd8', skin: '#c68642', hair: '#2b1d14', hairStyle: 1, pants: '#2d3a4a' },
      { shirt: '#ffd166', skin: '#e0ac69', hair: '#e4572e', hairStyle: 0, pants: '#5b3a1a' },
    ][a % 3];
    const dy = a === 1 ? Math.sin(g.time * 2 + a) * 1.2 : 0;
    r.drawPerson(s.x, s.y + 2 + dy, Object.assign({ facing: 1, moving: false, bob: 0, carry: 0 }, looks));
    if (a === 2) this.drawBucket(r.ctx, s.x + 14, s.y - 18 + dy, 0.8);
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      // the marquee's bulbs chase around the board
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, on = Math.floor(t * 4) % 3;
      for (let i = 0; i < 9; i++) { ctx.fillStyle = (i % 3) === on ? '#ffe08a' : 'rgba(255,224,138,0.3)'; ctx.beginPath(); ctx.arc(cx - 48 + i * 12, gy - 32, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = ((i + 1) % 3) === on ? '#ffe08a' : 'rgba(255,224,138,0.3)'; ctx.beginPath(); ctx.arc(cx - 48 + i * 12, gy - 6, 2.5, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    if (g.area !== 'cinema') return;
    this.drawOutside(r, g);
    this.drawMovie(r, this.st.seat ? this.st.movieT : -1);
    this.drawMachineGlass(r, g);
    this.drawCurtain(r, g);
    for (const s of this.st.seats) this.drawSeatBack(r, s);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, C = CFG.CINEMA;
    if (st.popcorn > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawPopcorn(r, g) });
    if (g.area !== 'cinema') return;
    if (st.ticket) items.push({ y: p.y + 1, draw: () => this.drawTicket(r, g) });
    items.push({ y: C.SELLER.y - 30, draw: () => this.drawSeller(r, g) });
    items.push({ y: C.BOOTH.y1 + 1, draw: () => this.drawBoothFront(r, g) });
    items.push({ y: st.usher.y, draw: () => this.drawUsher(r, g) });
    C.AUDIENCE.forEach((a, i) => { const s = st.seats[a.r * C.COLS.length + a.c]; items.push({ y: s.y + 2, draw: () => this.drawAudience(r, g, i, s) }); });
    for (const s of st.seats) items.push({ y: s.y + 3, draw: () => this.drawSeatArms(r, s) });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'cinema') return;
    const ctx = r.ctx, st = this.st, C = CFG.CINEMA, S = C.SCREEN, P = C.PROJECTOR, t = g.time;
    const x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    // the lights go down while the chef is seated (the screen itself stays bright)
    if (st.dim > 0) {
      ctx.fillStyle = `rgba(8,4,24,${(0.55 * st.dim).toFixed(3)})`;
      ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); ctx.fill('evenodd');
    }
    // the projector beam, flickering, brighter in the dark
    const fl = 0.7 + this.hash(Math.floor(t * 20)) * 0.3, a = (0.05 + 0.1 * st.dim) * fl;
    const bg = ctx.createLinearGradient(P.x, P.y - 6, P.x, S.y1); bg.addColorStop(0, `rgba(255,240,190,${(a * 1.6).toFixed(3)})`); bg.addColorStop(1, `rgba(255,240,190,${(a * 0.5).toFixed(3)})`);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(P.x - 5, P.y - 6); ctx.lineTo(P.x + 5, P.y - 6); ctx.lineTo(S.x1, S.y1); ctx.lineTo(S.x0, S.y1); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++) { const ph = (t * 0.25 + i / 6) % 1, k = this.hash(i * 9 + 1); ctx.fillStyle = `rgba(255,255,255,${(0.35 * st.dim * (1 - ph)).toFixed(2)})`; ctx.beginPath(); ctx.arc(U.lerp(P.x, S.x0 + (S.x1 - S.x0) * k, ph), U.lerp(P.y - 6, S.y1, ph), 1.2, 0, Math.PI * 2); ctx.fill(); }   // dust in the beam
    // the usher's torch: a cone of light ahead of him, pointed at the chef while checking the ticket
    const u = st.usher, f = u.facing || 1, hx = u.x + f * 12, hy = u.y - 18;
    const tx = u.shine > 0 ? g.player.x : u.x + f * 70, ty = u.shine > 0 ? g.player.y - 20 : u.y + 16;
    const ang = Math.atan2(ty - hy, tx - hx), len = u.shine > 0 ? U.dist(hx, hy, tx, ty) + 10 : 70, spread = 0.28;
    const tg = ctx.createRadialGradient(hx, hy, 2, hx, hy, len); tg.addColorStop(0, `rgba(255,236,160,${(0.35 + 0.25 * st.dim).toFixed(2)})`); tg.addColorStop(1, 'rgba(255,236,160,0)');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.arc(hx, hy, len, ang - spread, ang + spread); ctx.closePath(); ctx.fill();
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(CinemaExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(CinemaExt);
