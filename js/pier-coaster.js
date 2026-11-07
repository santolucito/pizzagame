'use strict';
// THE PIZZA COASTER: a white wooden roller coaster in Pizza Pier's coaster plot (CFG.PIER.PLOTS.coaster), north of the
// bumper cars and the midway games. Seen top-down with height like the rest of the game: the track is drawn higher on
// screen the higher it runs, with white lattice posts down to its shadow on the lawn. One loop round the plot: out of
// the station heading west, a gentle bump, the west turn, then the north side is the show seen from the side: the lift
// hill (click, click, click), the big drop, two bunny hills; the east turn and the brake run back into the station.
// Two trains of four bright cars take happy visitors round all day; one of them always waits at the station so the chef
// never waits more than a moment. '🎢 Ride the coaster' on the platform: the chef sits in the front car, the camera
// follows, the train clacks up the lift, whooshes down the drop ("Wheee! 🎢", hands up 🙌 and a little side-view swoop
// card), and after one lap (about 17 s) the chef steps off on the platform by themselves; '🎢 Again!' right after.
// The queue path comes up from the plot's south edge, through the 40-px alley between the bumper cars and the games.
// Extension module: registered with Game.ext (unshift) and Render.ext.
CFG.PIER_COASTER = {
  FENCE: { x0: 8476, y0: 5216, x1: 9424, y1: 5484 },     // the ride's lawn, fenced: the track, its posts and the station house
  HOUSE: { x0: 8872, y0: 5392, x1: 9092, y1: 5450, h: 62 },   // the station house behind the track (inside the fence)
  PLATFORM: { x0: 8860, y0: 5484, x1: 9100, y1: 5530 },  // the boarding deck right in front of the train
  GATE: { x0: 8958, x1: 9008 },                          // the opening in the platform's south railing
  BOARD: { x: 8930, y: 5506 },                           // where the chef gets on (next to the front car) and off again
  ENTRANCE: { x: 8983, y: 5550 },                        // the queue's start at the plot's south edge
  QUEUE: [{ x: 9046, y: 5500 }, { x: 9076, y: 5514 }],   // visitors waiting on the platform
  // the loop (ground): south straight y 5470, north straight y 5262, turns of radius 104 round x 8600 and x 9300;
  // the front car stops at x 8930 heading west. The chef's seat never goes above the park's walkable top (y 5110): the
  // lift hill tops out at 140 px
  SOUTH_Y: 5470, NORTH_Y: 5262, WX: 8600, EX: 9300, R: 104, STOP_X: 8930,
  CARS: 4, CAR_GAP: 44,          // cars per train, spacing along the track
  DWELL: 3, BOARD_T: 0.5, OFF_T: 0.4, AGAIN: 10,          // seconds: a visitor train's stop; hopping in; hopping out; how long "Again!" shows
  HINT_R: 70,
};

const PierCoasterExt = {
  st: null,
  defaults: { pierCoaster: { rides: 0 } },
  LOOK: {
    shirts: ['#ff6b8a', '#3b7dd8', '#2f9e44', '#ffd166', '#9b5de5', '#ff8c1a', '#00bbf9', '#e4572e'],
    skins: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'],
    hairs: ['#2b1d14', '#6b3e1f', '#e8c07d', '#b5651d', '#111111', '#d9534f'],
    cars: [['#e4572e', '#ffd166', '#3b7dd8', '#2f9e44'], ['#9b5de5', '#ff8fab', '#00bbf9', '#ff8c1a']],
  },

  // ---------- the track ----------
  // heights (px above the ground) at ground distances along the loop; smooth (cosine) between keys, straight on the lift
  keys() {
    const C = CFG.PIER_COASTER, arc = Math.PI * C.R;
    const sB = C.STOP_X - C.WX, sC = sB + arc, sD = sC + (C.EX - C.WX), sE = sD + arc, sEnd = sE + (C.EX - C.STOP_X);
    const K = [
      [0, 16], [110, 16], [200, 34], [290, 20], [sB + arc / 2, 34], [sC, 40],
      [sC + 290, 138, 'lin'], [sC + 322, 140], [sC + 410, 14], [sC + 480, 84], [sC + 545, 24], [sC + 610, 60],
      [sD, 30], [sD + arc / 2, 50], [sE, 26], [sE + 150, 18], [sEnd, 16],
    ];
    return { K, sB, sC, sD, sE, sEnd };
  },
  hOfS(s) {
    const K = this.P.K;
    for (let i = 1; i < K.length; i++) {
      if (s <= K[i][0]) {
        const a = K[i - 1], b = K[i], k = U.clamp((s - a[0]) / (b[0] - a[0]), 0, 1);
        return b[2] === 'lin' ? a[1] + (b[1] - a[1]) * k : a[1] + (b[1] - a[1]) * (1 - Math.cos(k * Math.PI)) / 2;
      }
    }
    return K[K.length - 1][1];
  },
  // track speed (px/s along the rail) at ground distance s with height h
  speedAt(s, h) {
    const P = this.P, sm = (k) => { k = U.clamp(k, 0, 1); return k * k * (3 - 2 * k); };
    const energy = (ss, hh) => U.clamp(Math.sqrt(52 * 52 + 1100 * Math.max(0, 140 - 0.05 * (ss - (P.sC + 322)) - hh)), 52, 340);
    if (s < P.sC) return Math.min(60 + 120 * sm((s - 20) / 180), 70 + (P.sC - s) * 0.6);
    if (s < P.sC + 290) return 70;                                      // the lift: click, click, click
    if (s < P.sC + 322) return U.lerp(70, 52, (s - P.sC - 290) / 32);   // over the top, slowly...
    if (s < P.sE) return energy(s, h);                                  // ...then whoosh
    const v0 = energy(P.sE, this.hOfS(P.sE));
    return Math.max(60, U.lerp(v0, 60, sm((s - P.sE) / 340)));         // the brake run into the station
  },
  buildPath() {
    const C = CFG.PIER_COASTER, P = this.P = this.keys();
    const pts = [];
    const line = (x0, x1, y) => { const n = Math.ceil(Math.abs(x1 - x0) / 2); for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, y]); };
    const turn = (cx, a0, a1) => { const n = Math.ceil(Math.abs(a1 - a0) * C.R / 2), cy = (C.SOUTH_Y + C.NORTH_Y) / 2; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + C.R * Math.cos(a), cy + C.R * Math.sin(a)]); } };
    line(C.STOP_X, C.WX, C.SOUTH_Y);
    turn(C.WX, Math.PI / 2, Math.PI * 1.5);
    line(C.WX, C.EX, C.NORTH_Y);
    turn(C.EX, -Math.PI / 2, Math.PI / 2);
    line(C.EX, C.STOP_X, C.SOUTH_Y);
    pts.push([C.STOP_X, C.SOUTH_Y]);
    // ground distance s, height h, rail length u for every sample
    const smp = []; let s = 0, u = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i) { const ds = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); s += ds; }
      const h = this.hOfS(s);
      if (i) u += Math.hypot(s - smp[i - 1].s, h - smp[i - 1].h);
      smp.push({ x: pts[i][0], y: pts[i][1], s, h, u });
    }
    this.ground = smp;
    // an even table along the rail (every 2 px): ground x/y, height, ground distance, speed
    const L = u, DU = 2, N = Math.ceil(L / DU);
    const T = { L, DU, N, X: new Float32Array(N + 1), Y: new Float32Array(N + 1), H: new Float32Array(N + 1), S: new Float32Array(N + 1), V: new Float32Array(N + 1) };
    let j = 0;
    for (let i = 0; i <= N; i++) {
      const uu = Math.min(i * DU, L);
      while (j < smp.length - 2 && smp[j + 1].u < uu) j++;
      const a = smp[j], b = smp[j + 1], k = b.u > a.u ? U.clamp((uu - a.u) / (b.u - a.u), 0, 1) : 0;
      T.X[i] = U.lerp(a.x, b.x, k); T.Y[i] = U.lerp(a.y, b.y, k); T.H[i] = U.lerp(a.h, b.h, k); T.S[i] = U.lerp(a.s, b.s, k);
      T.V[i] = this.speedAt(T.S[i], T.H[i]);
    }
    this.tab = T;
    const uOfS = (ss) => { const g = smp.find((q) => q.s >= ss); return g ? g.u : L; };
    const back = (C.CARS - 1) * C.CAR_GAP;
    this.U = {
      L, LIFT0: uOfS(P.sC), LIFT1: uOfS(P.sC + 290), DROP0: uOfS(P.sC + 318), DROP1: uOfS(P.sC + 410), HANDS1: uOfS(P.sC + 615),
      WAIT: L - back - C.CAR_GAP - 50,        // where a train waits while the station is taken
      CLEAR: back + 40,                       // a departing train's last car has left the station
    };
  },
  // where the rail is at rail distance u: ground x/y, height, screen y (rail level), ground distance
  at(u) {
    const T = this.tab, L = T.L;
    u = ((u % L) + L) % L;
    const f = u / T.DU, i = Math.min(T.N - 1, Math.floor(f)), k = f - i;
    const x = T.X[i] + (T.X[i + 1] - T.X[i]) * k, y = T.Y[i] + (T.Y[i + 1] - T.Y[i]) * k, h = T.H[i] + (T.H[i + 1] - T.H[i]) * k;
    return { x, gy: y, h, y: y - h, s: T.S[i] + (T.S[i + 1] - T.S[i]) * k, v: T.V[i] + (T.V[i + 1] - T.V[i]) * k };
  },
  lapTime() { const T = this.tab; let t = 0; for (let i = 0; i < T.N; i++) t += T.DU / T.V[i]; return t; },

  // ---------- state ----------
  build(g) {
    if (!this.tab) this.buildPath();
    const L = this.U.L;
    this.st = {
      trains: [this.newTrain(0, 0, 'park'), this.newTrain(1, L * 0.5, 'run')],
      ride: null, again: 0, swoop: 0,
      queue: CFG.PIER_COASTER.QUEUE.map(() => this.newLook()),
    };
  },
  newLook() {
    const K = this.LOOK;
    return { shirt: U.pick(K.shirts), skin: U.pick(K.skins), hair: U.pick(K.hairs), hairStyle: U.randInt(0, 3), stripes: Math.random() < 0.3, pants: '#4a4a4a', facing: 1, moving: false, bob: 0, carry: 0 };
  },
  newTrain(i, u, state) {
    const riders = [];
    for (let k = 0; k < CFG.PIER_COASTER.CARS; k++) riders.push(k === 2 && i === 1 ? null : this.newLook());
    return { id: i, u, state, dwell: 0, riders, cols: this.LOOK.cars[i % 2] };
  },
  save(g) { if (!g.s.pierCoaster) g.s.pierCoaster = { rides: 0 }; return g.s.pierCoaster; },

  // ---------- helpers ----------
  busy(g) {
    return !!(g.onTrain || g.ride || g.travel || g.fishing || g.driving ||
      (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) ||
      (typeof PizzaPierExt !== 'undefined' && PizzaPierExt.st && PizzaPierExt.st.ride) ||          // on the Ferris wheel
      (typeof PierGamesExt !== 'undefined' && PierGamesExt.st && PierGamesExt.st.play));            // playing a midway game
  },
  riding(g) { return !!(this.st && this.st.ride); },
  here(g) { return g.area === 'pizzapier'; },
  onPlatform(p) { const P = CFG.PIER_COASTER.PLATFORM; return p.x >= P.x0 && p.x <= P.x1 && p.y >= P.y0 && p.y <= P.y1 + 4; },
  parked() { return this.st && this.st.trains.find((t) => t.state === 'park' && !(this.st.ride && this.st.ride.train === t)) || null; },
  obs() {
    const C = CFG.PIER_COASTER, F = C.FENCE, P = C.PLATFORM, G = C.GATE;
    return [
      { x: F.x0, y: F.y0, w: F.x1 - F.x0, h: F.y1 - F.y0 },                // the ride's fenced lawn: track, posts, station house
      { x: P.x0, y: P.y1 - 3, w: G.x0 - P.x0, h: 6 },                       // the platform's south railing, left of the gate
      { x: G.x1, y: P.y1 - 3, w: P.x1 - G.x1, h: 6 },                       // ...and right of it
      { x: P.x0 - 4, y: P.y0, w: 6, h: P.y1 - P.y0 + 3 },                   // the platform's ends
      { x: P.x1 - 2, y: P.y0, w: 6, h: P.y1 - P.y0 + 3 },
    ];
  },
  say(g, x, y, text, dur = 1.4, color = '#ffe08a') { g.floats.push({ x, y, text, color, t: 0, dur, big: true }); },

  // ---------- Game hooks ----------
  obstacles(g) { return g.area === 'pizzapier' ? this.obs() : []; },
  // while the chef sits in the coaster nothing else's walls apply to them (they are up on the track)
  obstaclesOverride(g) { return this.st && this.st.ride && g.area === 'pizzapier' ? [] : null; },

  action(g) {
    if (!this.st || !this.here(g)) return null;
    const st = this.st;
    if (st.ride) return st.ride.phase === 'go' ? { label: '🙌 Hands up!', run: (gg) => this.handsUp(gg) } : null;
    if (this.busy(g)) return null;
    if (!this.onPlatform(g.player) || !this.parked()) return null;
    return { label: st.again > 0 ? '🎢 Again!' : '🎢 Ride the coaster', run: (gg) => this.startRide(gg) };
  },
  hint(g) {
    if (!this.st || !this.here(g)) return undefined;
    const st = this.st, C = CFG.PIER_COASTER, p = g.player;
    if (st.ride) {
      const R = st.ride, u = R.train.u, U2 = this.U;
      if (R.phase === 'board') return { text: 'All aboard! 🎢', target: null };
      if (R.phase === 'off') return { text: 'That was fun! 🎉', target: null };
      if (u >= U2.LIFT0 && u < U2.DROP0) return { text: 'Click, click, click… up we go! ⛰️', target: null };
      if (u >= U2.DROP0 && u < U2.HANDS1) return { text: 'Wheee! Hands up! 🙌', target: null };
      if (u >= U2.HANDS1) return { text: 'Back to the station! 🎢', target: null };
      return { text: 'Here we go! 🎢', target: null };
    }
    if (this.busy(g)) return undefined;
    const atEntrance = U.dist(p.x, p.y, C.ENTRANCE.x, C.ENTRANCE.y) <= C.HINT_R;
    if (this.onPlatform(p)) {
      if (!this.parked()) return { text: 'Here comes the train! 🎢', target: null };
      return { text: st.again > 0 ? 'Again? Hop back in! 🎢' : 'Ride the roller coaster! 🎢', target: U.dist(p.x, p.y, C.BOARD.x, C.BOARD.y) > 30 ? C.BOARD : null };
    }
    if (atEntrance) return { text: 'Ride the roller coaster! 🎢', target: C.BOARD };
    return undefined;
  },
  home(g) {
    if (!this.st) return;
    const R = this.st.ride;
    if (R) { R.train.chef = false; if (R.train.state === 'park' && R.phase === 'board') R.train.dwell = 0; }
    this.st.ride = null; this.st.again = 0; this.st.swoop = 0;
  },

  startRide(g) {
    const T = this.parked(); if (!T) return;
    const p = g.player;
    this.st.ride = { train: T, phase: 'board', t: 0, from: { x: p.x, y: p.y }, click: 0, said: false, hands: 0, dropT: -1 };
    T.chef = true; T.riders[0] = null;   // the front seat is the chef's
    this.st.again = 0;
    p.moving = false;
    Sfx.pickup(); Haptics.tap();
  },
  handsUp(g) {
    const R = this.st.ride; if (!R) return;
    R.hands = 1.6;
    const c = this.at(R.train.u);
    this.say(g, c.x, c.y - 90, '🙌 Wheee!', 1.1, '#ffffff');
  },
  endRide(g) {
    const R = this.st.ride, C = CFG.PIER_COASTER, p = g.player;
    if (!R) return;
    R.train.chef = false;
    this.st.ride = null; this.st.swoop = 0;
    p.x = C.BOARD.x; p.y = C.BOARD.y; p.moving = false; p.facing = 1; p.hasMoved = true;
    this.st.again = C.AGAIN;
    this.save(g).rides++;
    g.cameraSnap = false;
    Sfx.drop();
    this.say(g, p.x, p.y - 80, 'That was fun! 🎉', 1.6);
  },

  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st;
    if (g.area !== 'pizzapier') { if (st.ride) this.home(g); return; }
    st.again = Math.max(0, st.again - dt);
    this.stepTrains(g, dt);
    if (st.ride) { this.stepRide(g, dt); return; }
    // rescue: a save or a push that left the chef inside the ride's fence or the platform rails puts them on the platform
    const p = g.player, C = CFG.PIER_COASTER;
    if (!this.busy(g) && this.obs().some((o) => g.hitRect(p.x, p.y, 8, o))) { p.x = C.BOARD.x; p.y = C.BOARD.y; p.moving = false; }
  },
  stationBusy(o) { return o.state === 'park' || (o.state === 'run' && (o.u < this.U.CLEAR || o.u > this.U.WAIT)); },
  stepTrains(g, dt) {
    const st = this.st, U2 = this.U, C = CFG.PIER_COASTER;
    for (const T of st.trains) {
      const O = st.trains.find((x) => x !== T), mine = st.ride && st.ride.train === T;
      if (T.state === 'park') {
        T.dwell += dt;
        if (mine) {
          if (st.ride.phase === 'board' && st.ride.t >= C.BOARD_T) { T.state = 'run'; T.dwell = 0; st.ride.phase = 'go'; st.ride.t = 0; }
        } else {
          const chefWaiting = !st.ride && this.onPlatform(g.player);
          // leave when the other train is waiting its turn, or straight away (after a short stop) while the chef is out
          // riding the other one, so the station is free when the chef comes back
          if ((O.state === 'wait' && T.dwell >= (chefWaiting ? 8 : C.DWELL)) || (O.chef && O.state === 'run' && T.dwell >= C.DWELL)) {
            T.state = 'run'; T.dwell = 0;
            for (let k = 0; k < T.riders.length; k++) if (!T.riders[k] && Math.random() < 0.8) T.riders[k] = this.newLook();   // new visitors hop in
          }
        }
      } else if (T.state === 'wait') {
        if (!this.stationBusy(O)) T.state = 'run';
      } else {
        const v = this.at(T.u).v, nu = T.u + v * dt;
        if (T.u < U2.WAIT && nu >= U2.WAIT && this.stationBusy(O)) { T.u = U2.WAIT; T.state = 'wait'; }
        else if (nu >= U2.L && !mine && O.chef && O.state === 'run' && O.u > U2.L / 2) T.u = nu - U2.L;   // the chef is out riding a good way behind: roll straight through
        else if (nu >= U2.L) { T.u = 0; T.state = 'park'; T.dwell = 0; if (mine) { st.ride.phase = 'off'; st.ride.t = 0; } }
        else T.u = nu;
      }
    }
  },
  seat(u) { const c = this.at(u); return { x: c.x, y: c.y - 8, c }; },
  stepRide(g, dt) {
    const st = this.st, R = st.ride, C = CFG.PIER_COASTER, U2 = this.U, p = g.player, T = R.train;
    R.t += dt; R.hands = Math.max(0, R.hands - dt);
    p.moving = false; p.hasMoved = true;
    if (R.phase === 'board') {
      const s = this.seat(T.u), k = U.clamp(R.t / (C.BOARD_T * 0.8), 0, 1);
      p.x = U.lerp(R.from.x, s.x, k); p.y = U.lerp(R.from.y, s.y, k); p.facing = -1;
      return;
    }
    const s = this.seat(T.u);
    p.x = s.x; p.y = s.y;
    if (R.phase === 'off') { if (R.t >= C.OFF_T) this.endRide(g); return; }
    const ahead = this.at(T.u + 6);
    if (Math.abs(ahead.x - s.x) > 1.5) p.facing = ahead.x < s.x ? -1 : 1;
    const u = T.u;
    if (u >= U2.LIFT0 && u < U2.LIFT1) {
      R.click -= dt;
      if (R.click <= 0) { R.click = 0.55; Sfx.tone(1500, 0.025, 'square', 0.018); }
      if (!R.liftSaid) { R.liftSaid = true; this.say(g, s.x, s.y - 80, 'Up, up, up! ⛰️', 1.3, '#ffffff'); }
    }
    if (!R.said && u >= U2.DROP0) {
      R.said = true; R.dropT = 0;
      this.say(g, s.x + 30, s.y - 70, 'Wheee! 🎢', 1.6);
      Sfx.tone(880, 0.55, 'triangle', 0.045, -560); Haptics.success();
    }
    if (R.dropT >= 0) R.dropT += dt;
    if (R.t > 60) { T.u = 0; T.state = 'park'; T.dwell = 0; this.endRide(g); }   // never stuck on the ride
  },
  handsUpNow(u) { return u >= this.U.DROP0 && u < this.U.HANDS1; },

  // ---------- Render hooks ----------
  inView(r, x, y, m) { return x > r.camX - m && x < r.camX + r.viewW + m && y > r.camY - m && y < r.camY + r.viewH + m; },

  paintAfter(r, g, area) {
    if (area !== 'pizzapier') return;
    if (!this.tab) this.buildPath();
    const ctx = r.ctx, C = CFG.PIER_COASTER, F = C.FENCE, P = C.PLATFORM, G = C.GATE;
    // the lawn inside the fence, mown in stripes
    ctx.fillStyle = '#8fd16a'; U.roundRect(ctx, F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0, 34); ctx.fill();
    ctx.save(); U.roundRect(ctx, F.x0, F.y0, F.x1 - F.x0, F.y1 - F.y0, 34); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.09)'; for (let x = F.x0; x < F.x1; x += 56) ctx.fillRect(x, F.y0, 28, F.y1 - F.y0);
    // flower beds in the middle of the loop
    const flowers = ['#ff6b8a', '#ffd166', '#ffffff', '#9b5de5'];
    for (let i = 0; i < 26; i++) { const x = 8640 + ((i * 197) % 620), y = 5292 + ((i * 89) % 86); ctx.fillStyle = '#5cae4a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = flowers[i % 4]; ctx.beginPath(); ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2); ctx.arc(x + 3, y + 1, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the queue path: planks from the plot's south edge up to the platform gate, with rope posts
    const qx0 = G.x0 + 2, qx1 = G.x1 - 2, qy1 = CFG.PIER.PLOTS.coaster.y1 + 40;
    ctx.fillStyle = '#d9a066'; ctx.fillRect(qx0, P.y1 - 2, qx1 - qx0, qy1 - P.y1 + 2);
    ctx.strokeStyle = 'rgba(90,58,34,0.35)'; ctx.lineWidth = 1.5;
    for (let y = P.y1 + 6; y < qy1; y += 9) { ctx.beginPath(); ctx.moveTo(qx0, y); ctx.lineTo(qx1, y); ctx.stroke(); }
    for (const x of [qx0 - 4, qx1 + 4]) for (let y = P.y1 + 8; y < CFG.PIER.PLOTS.coaster.y1 + 6; y += 26) { ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 2, y - 12, 4, 14); ctx.beginPath(); ctx.arc(x, y - 13, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.5;
    for (const x of [qx0 - 4, qx1 + 4]) { ctx.beginPath(); for (let y = P.y1 + 8; y + 26 < CFG.PIER.PLOTS.coaster.y1 + 6; y += 26) { ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 1, y + 4, x, y + 17); } ctx.stroke(); }
    // the track's shadow on the lawn
    ctx.strokeStyle = 'rgba(40,70,30,0.18)'; ctx.lineWidth = 16; ctx.lineJoin = 'round';
    ctx.beginPath(); this.ground.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
    // the back fence (north and the ends), then the front fence either side of the platform
    this.paintFence(ctx, F.x0 + 34, F.x1 - 34, F.y0, 'h');
    this.paintFence(ctx, F.y0 + 34, F.y1, F.x0, 'v');
    this.paintFence(ctx, F.y0 + 34, F.y1, F.x1, 'v');
    // tall things back to front: the track pieces and the station house
    const items = this.trackPieces().map((pc) => ({ y: pc.key, draw: () => this.paintPiece(ctx, pc) }));
    items.push({ y: C.HOUSE.y1 - 1, draw: () => this.paintHouse(r, ctx) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
    // the platform deck in front of the train, then the front fence
    ctx.fillStyle = '#c98b4f'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0);
    ctx.strokeStyle = 'rgba(90,58,34,0.35)'; ctx.lineWidth = 1.5;
    for (let x = P.x0 + 12; x < P.x1; x += 12) { ctx.beginPath(); ctx.moveTo(x, P.y0 + 6); ctx.lineTo(x, P.y1); ctx.stroke(); }
    ctx.fillStyle = '#ffd166'; ctx.fillRect(P.x0, P.y0, P.x1 - P.x0, 5);   // the yellow "stand back" line
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍕', C.BOARD.x, C.BOARD.y + 12);
    this.paintFence(ctx, F.x0 + 34, P.x0, F.y1, 'h');
    this.paintFence(ctx, P.x1, F.x1 - 34, F.y1, 'h');
    // the platform's railings: the south rail with its gate, and the two ends
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c9b79c'; ctx.lineWidth = 1;
    const rail = (x0, x1) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, P.y1 - 14, x1 - x0, 4); for (let x = x0; x <= x1; x += 16) ctx.fillRect(Math.min(x, x1 - 3), P.y1 - 14, 3, 16); ctx.fillStyle = '#e4572e'; ctx.fillRect(x0, P.y1 - 15, x1 - x0, 2); };
    rail(P.x0, G.x0); rail(G.x1, P.x1);
    for (const x of [P.x0 - 2, P.x1 - 1]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, P.y0 - 10, 3, P.y1 - P.y0 + 10); }
    // gate posts with little flags
    for (const x of [G.x0, G.x1]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, P.y1 - 30, 6, 32); ctx.fillStyle = x === G.x0 ? '#e4572e' : '#3b7dd8'; ctx.beginPath(); ctx.moveTo(x + 3, P.y1 - 30); ctx.lineTo(x + 16, P.y1 - 25); ctx.lineTo(x + 3, P.y1 - 20); ctx.closePath(); ctx.fill(); }
  },
  paintFence(ctx, a, b, at, dir) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(120,100,80,0.45)'; ctx.lineWidth = 1;
    if (dir === 'h') {
      ctx.fillRect(a, at - 9, b - a, 3); ctx.fillRect(a, at - 3, b - a, 3);
      for (let x = a; x < b; x += 9) { ctx.beginPath(); ctx.moveTo(x, at + 2); ctx.lineTo(x, at - 12); ctx.lineTo(x + 2.5, at - 15); ctx.lineTo(x + 5, at - 12); ctx.lineTo(x + 5, at + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    } else {
      for (let y = a; y < b; y += 9) { ctx.fillRect(at - 2.5, y - 13, 5, 14); ctx.strokeRect(at - 2.5, y - 13, 5, 14); }
    }
  },
  // the track cut into pieces between support bents (every 26 px of ground), each drawn as one back-to-front item
  trackPieces() {
    const gr = this.ground, out = [];
    let a = 0;
    while (a < gr.length - 1) {
      let b = a; while (b < gr.length - 1 && gr[b].s - gr[a].s < 26) b++;
      out.push({ a, b, key: (gr[a].y + gr[b].y) / 2 });
      a = b;
    }
    return out;
  },
  normal(i) {
    const gr = this.ground, q0 = gr[Math.max(0, i - 1)], q1 = gr[Math.min(gr.length - 1, i + 1)];
    const dx = q1.x - q0.x, dy = q1.y - q0.y, l = Math.hypot(dx, dy) || 1;
    return { nx: -dy / l, ny: dx / l };
  },
  paintPiece(ctx, pc) {
    const gr = this.ground, A = gr[pc.a], B = gr[pc.b], W = 7;
    const nA = this.normal(pc.a), nB = this.normal(pc.b);
    // which side is the back (further north on screen)
    const sideA = nA.ny > 0 ? 1 : -1, sideB = nB.ny > 0 ? 1 : -1;
    const post = (q, n, side, col, w) => { if (q.h < 6) return; const x = q.x + n.nx * W * side, y = q.y + n.ny * W * side; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y - q.h); ctx.lineTo(x, y); ctx.stroke(); };
    const lattice = (side, col) => {
      if (A.h < 22 || B.h < 22) return;
      const ax = A.x + nA.nx * W * side, ay = A.y + nA.ny * W * side, bx = B.x + nB.nx * W * side, by = B.y + nB.ny * W * side;
      ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath();
      const top = Math.min(A.h, B.h);
      for (let hh = 0; hh + 18 < top; hh += 30) {
        const h2 = Math.min(top, hh + 30);
        ctx.moveTo(ax, ay - hh); ctx.lineTo(bx, by - h2); ctx.moveTo(bx, by - hh); ctx.lineTo(ax, ay - h2);
        ctx.moveTo(ax, ay - h2); ctx.lineTo(bx, by - h2);
      }
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    post(A, nA, -sideA, '#d9cdb6', 3); post(B, nB, -sideB, '#d9cdb6', 3);
    lattice(-sideA, 'rgba(201,183,156,0.9)');
    post(A, nA, sideA, '#fffaf0', 3.5); post(B, nB, sideB, '#fffaf0', 3.5);
    lattice(sideA, 'rgba(255,250,240,0.95)');
    // rail bed between the two rails, cross-ties, then the red rails
    const L = [], R = [];
    for (let i = pc.a; i <= pc.b; i++) { const q = gr[i], n = this.normal(i); L.push([q.x - n.nx * W, q.y - n.ny * W - q.h]); R.push([q.x + n.nx * W, q.y + n.ny * W - q.h]); }
    ctx.fillStyle = '#8a5a3a'; ctx.beginPath();
    L.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
    for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = pc.a; i <= pc.b; i++) { const q = gr[i]; if (i === pc.a) ctx.moveTo(q.x, q.y - q.h); else ctx.lineTo(q.x, q.y - q.h); }
    ctx.stroke();
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < L.length; i += 4) { ctx.moveTo(L[i][0], L[i][1]); ctx.lineTo(R[i][0], R[i][1]); }
    ctx.stroke();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.6; ctx.beginPath();
    L.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
    R.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
    ctx.stroke();
    ctx.lineCap = 'butt';
  },
  paintHouse(r, ctx) {
    const H = CFG.PIER_COASTER.HOUSE, top = H.y1 - H.h, w = H.x1 - H.x0, cx = (H.x0 + H.x1) / 2;
    // the roof seen from above (a striped slab), then the front wall facing the track
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(H.x0 + 6, H.y0, w, H.y1 - H.y0);
    ctx.fillStyle = '#fff3d6'; ctx.fillRect(H.x0, top, w, H.h);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(H.x0, top - (H.y1 - H.y0) + 10, w, H.y1 - H.y0 - 10);
    for (let i = 0, x = H.x0; x < H.x1; x += 22, i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#e4572e'; ctx.fillRect(x, top - (H.y1 - H.y0) + 10, Math.min(22, H.x1 - x), H.y1 - H.y0 - 10); }
    // scalloped awning edge along the front
    for (let i = 0, x = H.x0; x < H.x1; x += 22, i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#e4572e'; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 22, top); ctx.arc(x + 11, top, 11, 0, Math.PI); ctx.fill(); }
    ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(H.x0, top - (H.y1 - H.y0) + 10, w, H.y1 - H.y0 - 10 + H.h);
    // windows with happy round tops and a door in the middle
    for (const x of [H.x0 + 26, H.x0 + 70, H.x1 - 70, H.x1 - 26]) {
      ctx.fillStyle = '#7fd3ff'; ctx.beginPath(); ctx.moveTo(x - 13, H.y1 - 12); ctx.lineTo(x - 13, top + 24); ctx.arc(x, top + 24, 13, Math.PI, 0); ctx.lineTo(x + 13, H.y1 - 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, cx - 16, top + 18, 32, H.h - 18, 6); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx + 9, H.y1 - 20, 2.5, 0, Math.PI * 2); ctx.fill();
    // bunting along the awning
    const cols = ['#ffd166', '#3b7dd8', '#2f9e44', '#ff6b8a', '#9b5de5'];
    for (let i = 0, x = H.x0 + 4; x < H.x1 - 10; x += 16, i++) { ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x, top + 13); ctx.lineTo(x + 12, top + 13); ctx.lineTo(x + 6, top + 22); ctx.closePath(); ctx.fill(); }
    // the big sign on the roof: 🎢 PIZZA COASTER
    const sy = top - (H.y1 - H.y0) - 34, sw = 216;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 70, sy + 30, 4, 16); ctx.fillRect(cx + 66, sy + 30, 4, 16);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, cx - sw / 2, sy, sw, 36, 12); ctx.fill();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, cx - sw / 2 + 4, sy + 4, sw - 8, 28, 9); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.font = r.font(18, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎢 PIZZA COASTER', cx, sy + 19);
  },

  // the signs' and station's light bulbs twinkle at dusk; the lift hill gets a string of lights too
  dynamic(r, g) {
    if (g.area !== 'pizzapier' || !this.tab) return;
    const k = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.dusk : 0;
    if (k < 0.05) return;
    const ctx = r.ctx, H = CFG.PIER_COASTER.HOUSE, t = g.time, top = H.y1 - H.h;
    if (!this.inView(r, (H.x0 + H.x1) / 2, top, 600)) return;
    const cols = ['#fff3b0', '#ffd166', '#ff8fab', '#9be7ff'];
    const bulb = (x, y, i) => { const a = k * (0.55 + 0.45 * Math.sin(t * 3 + i * 1.7)); ctx.globalAlpha = a * 0.35; ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill(); };
    let i = 0;
    for (let x = H.x0 + 6; x < H.x1; x += 16) bulb(x, top + 3, i++);
    const sy = top - (H.y1 - H.y0) - 34, cx = (H.x0 + H.x1) / 2;
    for (let x = cx - 104; x <= cx + 104; x += 16) { bulb(x, sy - 1, i++); bulb(x, sy + 37, i++); }
    for (const q of this.ground) if (q.h > 30 && Math.round(q.s) % 32 < 2 && q.y < 5300) bulb(q.x, q.y - q.h - 9, i++);
    ctx.globalAlpha = 1;
  },

  entities(r, g, items) {
    if (g.area !== 'pizzapier' || !this.st) return;
    const st = this.st, C = CFG.PIER_COASTER, ride = st.ride;
    for (const T of st.trains) {
      for (let i = 0; i < C.CARS; i++) {
        const u = T.u - i * C.CAR_GAP, c = this.at(u);
        if (!this.inView(r, c.x, c.y, 140)) continue;
        const chefCar = ride && ride.train === T && i === 0 && ride.phase !== 'board';
        const hands = (this.handsUpNow(T.u) && T.state === 'run') || (chefCar && ride.hands > 0);
        const pose = this.carPose(u, c);
        if (chefCar) {
          const p = g.player;
          items.push({ y: p.y - 0.5, draw: () => this.drawCarBack(r, c, pose, T.cols[i]) });
          items.push({ y: p.y + 0.5, draw: () => { this.drawCarFront(r, c, pose, T.cols[i]); if (hands) this.drawHands(r, p.x, p.y - 78, g.time); } });
        } else {
          const look = T.riders[i];
          items.push({ y: c.y - 7.5, draw: () => {
            this.drawCarBack(r, c, pose, T.cols[i]);
            if (look) { look.facing = pose.dir; r.drawPerson(c.x, c.y - 8, look); }
            this.drawCarFront(r, c, pose, T.cols[i]);
            if (look && hands) this.drawHands(r, c.x, c.y - 66, g.time + i);
          } });
        }
      }
    }
    // visitors waiting on the platform (they step aside while the chef boards)
    C.QUEUE.forEach((q, i) => {
      const look = st.queue[i]; if (!look || !this.inView(r, q.x, q.y, 100)) return;
      look.facing = -1;
      items.push({ y: q.y, draw: () => r.drawPerson(q.x, q.y + Math.sin(g.time * 2 + i) * 0.8, look) });
    });
  },
  // how a car sits on the rail at u: tilt along the slope (east-west runs), width (narrower seen end-on on the turns)
  carPose(u, c) {
    const a = this.at(u - 4), b = this.at(u + 4), gx = b.x - a.x, gyd = b.gy - a.gy, sx = b.x - a.x, sy = b.y - a.y;
    const across = Math.abs(gx) / (Math.hypot(gx, gyd) || 1);   // 1 running east-west, 0 running north-south
    const tilt = Math.abs(sx) > 0.5 ? (sx < 0 ? Math.atan2(-sy, -sx) : Math.atan2(sy, sx)) : 0;   // upright whichever way it runs
    return { tilt: U.clamp(tilt, -0.75, 0.75) * across, w: 30 + 14 * across, dir: sx < -0.3 ? -1 : 1 };
  },
  drawCarBack(r, c, pose, col) {
    const ctx = r.ctx, w = pose.w;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(pose.tilt);
    ctx.fillStyle = '#3e424a'; U.roundRect(ctx, -w / 2 + 2, -6, w - 4, 6, 3); ctx.fill();   // the chassis on the rail
    ctx.fillStyle = this.shade(col); U.roundRect(ctx, -w / 2 + 3, -40, w - 6, 24, 8); ctx.fill();   // the seat back
    ctx.restore();
  },
  drawCarFront(r, c, pose, col) {
    const ctx = r.ctx, w = pose.w, d = pose.dir;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(pose.tilt);
    ctx.fillStyle = col; U.roundRect(ctx, -w / 2, -25, w, 21, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (w > 36) { ctx.beginPath(); ctx.moveTo(d * (w / 2 - 2), -24); ctx.quadraticCurveTo(d * (w / 2 + 9), -18, d * (w / 2 - 1), -6); ctx.closePath(); ctx.fill(); }   // a little nose
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-w / 2 + 4, -21, w - 8, 3);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -13, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (const x of [-w / 2 + 7, w / 2 - 7]) { ctx.beginPath(); ctx.arc(x, -2, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  shade(col) {
    const n = parseInt(col.slice(1), 16), f = 0.72;
    return `rgb(${Math.round((n >> 16) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
  },
  drawHands(r, x, y, t) {
    const ctx = r.ctx;
    const yy = y + Math.sin(t * 12) * 1.5;
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, yy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14';
    ctx.fillText('🙌', x, yy + 1);
  },

  // the side-view swoop card while the chef goes over the top and down the big drop
  screen(r, g) {
    const st = this.st;
    if (!st || !st.ride || st.ride.phase !== 'go' || g.area !== 'pizzapier' || g.travel) return;
    const P = this.P, s1 = P.sC + 230, s2 = P.sC + 640, front = this.at(st.ride.train.u);
    if (st.ride.train.u < this.U.LIFT0 || front.s < s1 + 50 || front.s > s2 - 10) return;
    const k = U.clamp(Math.min((front.s - s1 - 50) / 30, (s2 - 10 - front.s) / 30), 0, 1);
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    const w = Math.min(330, W - 32), h = Math.round(w * 0.42), x0 = (W - w) / 2, y0 = Math.max(H * 0.45, H - h - 120);   // low on the screen: the train itself is up top
    ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, x0 - 5, y0 - 5, w + 10, h + 10, 18); ctx.fill();
    ctx.save(); U.roundRect(ctx, x0, y0, w, h, 14); ctx.clip();
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = '#ffffff'; for (const [cx, cy, rr] of [[0.2, 0.22, 10], [0.27, 0.2, 13], [0.78, 0.3, 11], [0.85, 0.27, 9]]) { ctx.beginPath(); ctx.arc(x0 + cx * w, y0 + cy * h, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#7ccf6b'; ctx.fillRect(x0, y0 + h - 16, w, 16);
    const px = (s) => x0 + 10 + (s - s1) / (s2 - s1) * (w - 20), py = (hh) => y0 + h - 16 - hh / 150 * (h - 30);
    ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let s = s1; s <= s2; s += 14) { ctx.moveTo(px(s), py(this.hOfS(s))); ctx.lineTo(px(s), y0 + h - 16); } ctx.stroke();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.beginPath(); for (let s = s1; s <= s2; s += 4) { const X = px(s), Y = py(this.hOfS(s)); if (s === s1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } ctx.stroke();
    // the chef's car on the profile, with speed lines when fast
    const cs = U.clamp(front.s, s1, s2), cx = px(cs), cy = py(this.hOfS(cs)), dy = py(this.hOfS(cs + 3)) - py(this.hOfS(cs - 3)), dx = px(cs + 3) - px(cs - 3);
    const ang = Math.atan2(dy, dx);
    if (front.v > 150) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - Math.cos(ang) * (18 + i * 4) - 4, cy - 12 + i * 6 - Math.sin(ang) * 18); ctx.lineTo(cx - Math.cos(ang) * (34 + i * 4) - 4, cy - 12 + i * 6 - Math.sin(ang) * 34); ctx.stroke(); } }
    ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(0, -17, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, -5, -30, 10, 7, 2); ctx.fill(); ctx.beginPath(); ctx.arc(-3, -31, 4, 0, Math.PI * 2); ctx.arc(3, -31, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, -12, -12, 24, 10, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(-7, -2, 2.5, 0, Math.PI * 2); ctx.arc(7, -2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = r.font(Math.round(w / 12), 900); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#e4572e';
    const bounce = Math.sin(g.time * 10) * 2;
    ctx.strokeText('Wheee! 🎢', x0 + 12, y0 + 8 + bounce); ctx.fillText('Wheee! 🎢', x0 + 12, y0 + 8 + bounce);
    ctx.restore();
  },
};
Game.ext.unshift(PierCoasterExt);
Render.ext.push(PierCoasterExt);
