'use strict';
// Pizza Pier (the park itself): a Coney Island style seaside amusement park at the end of subway Line 2. This file
// paints the whole 'pizzapier' map (sky and far skyline, the back fence, the plazas, the colourful paths, the wide
// boardwalk with its railing, lamps and bunting, the beach and the sea), and runs the parts the park agent owns:
//   - the open-air Line 2 terminal (west end): the purple train waits at its platform; '🚇 Ride home' takes it back to
//     the City ('pierline'); arriving puts the chef on the platform under the "🍕 PIZZA PIER 🎡" arch;
//   - the big Ferris wheel (east end): '🎡 Ride the Ferris wheel' seats the chef in a gondola for one slow turn
//     (the camera follows; "What a view! 🌊" at the top; off at the bottom by itself);
//   - the Pizza Drop, a ride still being built: '🔨 Help build' and the crane lowers one more piece of the tower (the
//     count is saved); once it reaches the top, every help gives a little test run;
//   - three free food stands on the boardwalk's north edge (cotton candy, pizza slice, lemonade), carried for a while;
//   - life: visitors strolling the boardwalk, people on benches and in the gondolas, seagulls, the odd balloon.
// The other plots (coaster, bumper cars, games) are left as light paved plazas for js/pier-*.js to paint over.
// Layout: CFG.PIER (js/pier-layout.js). Extension module: Game.ext (unshift) and Render.ext. See js/EXTENSIONS.md.
CFG.PIERPARK = {
  STATION: { x0: 8000, y0: 5110, x1: 8420, y1: 5530 },          // the terminal hall behind the track (solid)
  TRACK: { x0: 8000, x1: 8404, y0: 5530, y1: 5642 },             // the track bed and the train on it (solid)
  TRAIN: { x0: 8022, x1: 8380, y: 5630, car: 116 },              // three purple cars, the front at the east end
  PLATFORM: { x0: 8000, x1: 8384, y0: 5642, y1: 5880 },
  POSTS: [8066, 8190, 8326], POST_Y: 5662,                        // the canopy's posts along the platform edge
  BOARD: { x: 8258, y: 5694 },                                    // '🚇 Ride home', by the train's door
  ARCH: { x: 8210, y: 5884, half: 96 },                           // the entrance arch over the platform's gate
  FENCE_Y: 5880,                                                  // the low fence along the platform's south edge
  LANES: [{ x0: 8384, x1: 8460, y0: 5560, y1: 5900 }, { x0: 8960, x1: 9000, y0: 5560, y1: 5900 },
    { x0: 9660, x1: 9944, y0: 5560, y1: 5900 }, { x0: 8384, x1: 9944, y0: 5560, y1: 5600 }],
  STANDS: [
    { key: 'pizza', x: 8060, ico: '🍕', label: '🍕 Get a pizza slice', name: 'PIZZA', awn: '#e4572e', body: '#fff3d6', say: 'A hot slice! 🍕', hint: 'A slice of pizza! 🍕' },
    { key: 'candy', x: 8980, ico: '🍭', label: '🍭 Get cotton candy', name: 'CANDY', awn: '#ff7eb6', body: '#fff0f7', say: 'Fluffy cotton candy! 🍭', hint: 'Cotton candy! 🍭' },
    { key: 'lemon', x: 9746, ico: '🍋', label: '🍋 Get a lemonade', name: 'LEMONADE', awn: '#ffd23f', body: '#fffbe0', say: 'Cold lemonade! 🍋', hint: 'Cool lemonade! 🍋' },
  ],
  STAND_Y: 5904, STAND_W: 76, SPOT_DY: 26, TREAT_T: 25,           // the counter's front edge; you stand SPOT_DY below it
  WHEEL: { x: 10130, y: 5629, R: 155, N: 10, base: 5852, IDLE: 40, RIDE: 15, BOARD_T: 0.8, OFF_T: 0.6,
    VISITORS: [1, 4, 7], BOARD: { x: 10130, y: 5886 }, EXIT: { x: 10100, y: 5892 } },
  WHEEL_ZONE: { x0: 9950, y0: 5110, x1: 10400, y1: 5852 },        // under and behind the wheel (solid)
  BUILD: {
    TOWER: { x: 9662, y: 5432 }, SEG: 30, START: 3, MAX: 8, HALF: 30,
    CRANE: { x: 9852, y: 5404, top: 5096, jib0: 9580, jib1: 9930 },
    MIXER: { x: 9538, y: 5508 }, PILE: { x: 9880, y: 5506 }, HELP: { x: 9688, y: 5486 },
    SIGN: { x: 9790, y: 5548 }, CONES: [9512, 9590, 9706, 9874, 9926], CONE_Y: 5554,
    WORKERS: [{ x: 9620, y: 5476 }, { x: 9740, y: 5470 }],
    LOWER_T: 1.3, SHOW_T: 4.2,
  },
  RAIL_Y: 6060, STAIRS: [8300, 8920, 9560, 10160], STAIR_HALF: 44,
  LAMPS: [8130, 8450, 8770, 9090, 9410, 9730, 10050, 10330],
  BENCHES: [[8610, 'Ice cream?', 1], [9250, null, 2], [9890, null, 0]],
  UMBRELLAS: [[8180, 6150, '#e4572e'], [8560, 6120, '#3b7dd8'], [8840, 6175, '#2f9e44'], [9480, 6130, '#ff7eb6'], [9760, 6170, '#ffd23f'], [10240, 6140, '#8e44ad']],
  CASTLE: { x: 9180, y: 6166 },
  SAFE: [{ x: 8210, y: 5840 }, { x: 10100, y: 5892 }, { x: 9688, y: 5486 }, { x: 8700, y: 5980 }, { x: 9300, y: 5980 }, { x: 9900, y: 5980 }, { x: 8300, y: 5980 }, { x: 10250, y: 5980 }],
};

const PizzaPierExt = {
  name: 'pizzapier',
  st: null,
  defaults: { pizzapier: { seen: false, visits: 0, wheel: 0, built: 3, helps: 0, shows: 0, treats: 0 } },

  // ---------- state ----------
  build(g) {
    const d = JSON.parse(JSON.stringify(this.defaults.pizzapier));
    const s = Object.assign(d, g.s.pizzapier || {});
    const B = CFG.PIERPARK.BUILD;
    s.built = U.clamp(Math.round(+s.built || B.START), 0, B.MAX);
    g.s.pizzapier = s;
    const looks = [
      { shirt: '#3b7dd8', hair: '#2b1d14', hairStyle: 0, skin: '#f1c27d', pants: '#2d3a4a' },
      { shirt: '#ff7eb6', hair: '#8a4b20', hairStyle: 1, skin: '#c68642', pants: '#4a4a4a', stripes: true },
      { shirt: '#2f9e44', hair: '#f2c14e', hairStyle: 2, skin: '#f1c27d', pants: '#3a3f5c' },
      { shirt: '#ffd23f', hair: '#2b1d14', hairStyle: 3, skin: '#8d5524', pants: '#2d3a4a' },
      { shirt: '#8e44ad', hair: '#b5651d', hairStyle: 1, skin: '#f1c27d', pants: '#4a4a4a' },
      { shirt: '#e4572e', hair: '#2b1d14', hairStyle: 0, skin: '#e0ac69', pants: '#3a3f5c', stripes: true },
      { shirt: '#4ecdc4', hair: '#5a3825', hairStyle: 2, skin: '#c68642', pants: '#2d3a4a' },
    ];
    this.st = {
      wheelA: 0, ride: null, treat: null, piece: null, show: null, fade: 0,
      walkers: looks.map((look, i) => ({ x: 8100 + ((i * 677) % 2200), y: 5935 + (i % 4) * 30, dir: i % 2 ? -1 : 1, sp: 38 + (i % 3) * 10, wait: 0, bob: 0, look, balloon: i % 3 === 0 ? ['#ff5252', '#3b7dd8', '#ffd23f'][i % 3 === 0 ? (i / 3) % 3 : 0] : null })),
      gulls: [0, 1, 2, 3, 4].map((i) => ({ cx: 8300 + i * 480, cy: 6180 + (i % 2) * 60, ax: 160 + i * 20, w: 0.12 + i * 0.03, ph: i * 1.7 })),
      balloons: [], balloonT: 4,
      worker: { x: CFG.PIERPARK.BUILD.WORKERS[1].x, y: CFG.PIERPARK.BUILD.WORKERS[1].y, to: 1, wait: 1, carry: true, bob: 0 },
    };
    this.st.obs = this.buildObs();
  },
  save(g) { if (!this.st || !g.s.pizzapier) this.build(g); return g.s.pizzapier; },
  buildObs() {
    const P = CFG.PIERPARK, o = [], box = (b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    o.push(box(P.STATION), box(P.TRACK), box(P.WHEEL_ZONE));
    for (const x of P.POSTS) o.push({ x: x - 5, y: P.POST_Y - 5, w: 10, h: 10 });
    // the platform's south fence, with the arch as its gate (the pillars are solid too)
    const A = P.ARCH;
    o.push({ x: P.PLATFORM.x0, y: P.FENCE_Y - 4, w: A.x - A.half - 12 - P.PLATFORM.x0, h: 8 });
    o.push({ x: A.x + A.half + 12, y: P.FENCE_Y - 4, w: P.PLATFORM.x1 - (A.x + A.half + 12), h: 8 });
    for (const sx of [-1, 1]) o.push({ x: A.x + sx * A.half - 12, y: A.y - 10, w: 24, h: 14 });
    // the food stands (their counters)
    for (const s of P.STANDS) o.push({ x: s.x - P.STAND_W / 2, y: P.STAND_Y - 24, w: P.STAND_W, h: 24 });
    // the railing on the sea side, with gaps for the stairs down to the beach
    const cuts = P.STAIRS.map((x) => [x - P.STAIR_HALF, x + P.STAIR_HALF]);
    let x = 8000;
    for (const [a, b] of cuts) { o.push({ x, y: P.RAIL_Y - 5, w: a - x, h: 10 }); x = b; }
    o.push({ x, y: P.RAIL_Y - 5, w: 10400 - x, h: 10 });
    // the beach: umbrella poles and the sandcastle
    for (const [ux, uy] of P.UMBRELLAS) o.push({ x: ux - 4, y: uy - 4, w: 8, h: 8 });
    o.push({ x: P.CASTLE.x - 34, y: P.CASTLE.y - 16, w: 68, h: 22 });
    // the building site: the tower, the crane, the cement mixer, the pile of parts
    const B = P.BUILD;
    o.push({ x: B.TOWER.x - 36, y: B.TOWER.y - 40, w: 72, h: 44 });
    o.push({ x: B.CRANE.x - 20, y: B.CRANE.y - 22, w: 40, h: 26 });
    o.push({ x: B.MIXER.x - 58, y: B.MIXER.y - 24, w: 116, h: 26 });
    o.push({ x: B.PILE.x - 32, y: B.PILE.y - 18, w: 64, h: 22 });
    // the sea
    o.push({ x: 8000, y: CFG.PIER.SEA_Y, w: 2400, h: 6400 - CFG.PIER.SEA_Y + 40 });
    return o;
  },

  // ---------- helpers ----------
  here(g) { return g.area === 'pizzapier'; },
  // busy elsewhere: driving (a bumper car), on the roller coaster, at a midway game, on a train, in the City's taxi...
  busy(g) {
    return !!(g.onTrain || g.ride || g.travel || g.fishing || g.driving ||
      (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) ||
      (typeof PierCoasterExt !== 'undefined' && PierCoasterExt.riding && PierCoasterExt.riding(g)) ||
      (typeof PierGamesExt !== 'undefined' && PierGamesExt.st && PierGamesExt.st.play));
  },
  onFoot(g) { return this.here(g) && !this.busy(g) && !(this.st && this.st.ride); },
  near(g, s, d) { return U.dist(g.player.x, g.player.y, s.x, s.y) < d; },
  hash(i) { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); },
  say(g, x, y, text, color, big = true, dur = 1.5) { g.floats.push({ x, y, text, color: color || '#ffe08a', t: 0, dur, big }); },
  sparkle(g, x, y, n = 8, spread = 26) { for (let i = 0; i < n; i++) g.fx.push({ kind: 'sparkle', x0: x + U.rand(-spread, spread), y0: y + U.rand(-spread, spread * 0.6), x1: 0, y1: 0, t: -i * 0.05, dur: 0.6 }); },
  free(g, x, y, r = 12) { const W = CFG.PIER.WORLD; return y >= W.walkY0 - 1 && x > W.x0 + 12 && x < W.x1 - 12 && !this.st.obs.some((o) => g.hitRect(x, y, r, o)); },
  dusk() { return typeof AtmosphereExt !== 'undefined' ? (AtmosphereExt.dusk || 0) : 0; },
  standSpot(s) { return { x: s.x, y: CFG.PIERPARK.STAND_Y + CFG.PIERPARK.SPOT_DY }; },
  otherPlots() { const P = CFG.PIER.PLOTS; return [P.coaster, P.bumper, P.games]; },
  // the wheel: where gondola i's pivot is for wheel angle A
  pivot(i, A) { const W = CFG.PIERPARK.WHEEL, a = A + i * Math.PI * 2 / W.N; return { x: W.x + Math.cos(a) * W.R, y: W.y + Math.sin(a) * W.R }; },
  seat(i, A) { const p = this.pivot(i, A); return { x: p.x, y: p.y + 84 }; },
  ease(k) { k = U.clamp(k, 0, 1); return k * k * (3 - 2 * k); },
  rideK() { const r = this.st && this.st.ride; return r && r.phase === 'ride' ? U.clamp(r.t / CFG.PIERPARK.WHEEL.RIDE, 0, 1) : 0; },

  // ---------- game hooks ----------
  obstacles(g) {
    if (!this.st) this.build(g);
    if (!this.here(g)) return [];
    return this.st.obs;
  },
  action(g) {
    if (!this.st) this.build(g);
    if (!this.onFoot(g)) return null;
    const P = CFG.PIERPARK, st = this.st;
    if (this.near(g, P.BOARD, 40)) return { label: '🚇 Ride home', run: (gg) => this.rideHome(gg) };
    if (this.near(g, P.WHEEL.BOARD, 40)) return { label: '🎡 Ride the Ferris wheel', run: (gg) => this.boardWheel(gg) };
    if (this.near(g, P.BUILD.HELP, 44)) {
      if (st.piece || st.show) return null;
      return { label: '🔨 Help build', run: (gg) => this.helpBuild(gg) };
    }
    for (const s of P.STANDS) if (this.near(g, this.standSpot(s), 38)) return { label: s.label, run: (gg) => this.getTreat(gg, s) };
    return null;
  },
  hint(g) {
    if (!this.st || !this.here(g) || g.travel) return undefined;
    if (this.busy(g)) return undefined;
    const P = CFG.PIERPARK, st = this.st, p = g.player, s = this.save(g);
    if (st.ride) {
      const k = this.rideK();
      if (st.ride.phase === 'ride' && k > 0.38 && k < 0.66) return { text: 'What a view! 🌊', target: null };
      if (st.ride.phase === 'off') return { text: 'Wasn\'t that fun? 🎡', target: null };
      return { text: 'Wheee! Round and round 🎡', target: null };
    }
    if (this.near(g, P.BOARD, 70)) return { text: 'Ride the train home 🚇', target: this.near(g, P.BOARD, 34) ? null : P.BOARD };
    if (this.near(g, P.WHEEL.BOARD, 70)) return { text: 'Ride the Ferris wheel! 🎡', target: this.near(g, P.WHEEL.BOARD, 34) ? null : P.WHEEL.BOARD };
    if (this.near(g, P.BUILD.HELP, 70)) {
      if (st.piece) return { text: 'Here comes the next piece! 🏗️', target: null };
      if (st.show) return { text: 'Test run! Wheee! 🎢', target: null };
      return { text: s.built >= P.BUILD.MAX ? 'Help again for a test run! 🎢' : 'Help the workers build the Pizza Drop! 🔨', target: this.near(g, P.BUILD.HELP, 34) ? null : P.BUILD.HELP };
    }
    for (const sd of P.STANDS) { const sp = this.standSpot(sd); if (this.near(g, sp, 60)) return { text: sd.hint, target: this.near(g, sp, 30) ? null : sp }; }
    return this.generalHint(g);
  },
  // the park-wide hint is the least important one: a later extension with something to say (a ride's entrance,
  // a shiny coin nearby) goes first, so this never hides the coaster's, the bumper cars' or the games' hints
  generalHint(g) {
    const i = g.ext.indexOf(this);
    for (let j = i + 1; j < g.ext.length; j++) { const e = g.ext[j]; if (e.hint && e.hint(g) !== undefined) return undefined; }
    const P = CFG.PIERPARK, s = this.save(g), st = this.st;
    if (st.treat) return { text: { candy: 'Yum, cotton candy! 🍭', pizza: 'Yum, pizza! 🍕', lemon: 'Ahh, lemonade! 🍋' }[st.treat.key], target: null };
    if (!s.wheel) return { text: 'Ride the big Ferris wheel! 🎡', target: P.WHEEL.BOARD };
    if (!s.helps) return { text: 'Help build the new ride! 🔨', target: P.BUILD.HELP };
    return { text: 'Have fun at Pizza Pier! 🎡', target: null };
  },
  arrive(g, tr) {
    if (!this.st) this.build(g);
    if (tr.to !== 'pizzapier') return;
    const A = CFG.PIER.ARRIVE, p = g.player, s = this.save(g);
    this.st.ride = null; this.st.fade = 0.5;
    p.x = A.x; p.y = A.y; p.facing = 1; p.moving = false; p.hasMoved = true;
    g.cameraSnap = true;
    s.visits++;
    if (!s.seen) { s.seen = true; g.toast('🎡 Welcome to Pizza Pier!', true); }
    else this.say(g, A.x, A.y - 80, 'Pizza Pier! 🎡', '#ffffff', true, 1.6);
    if (g.save) g.save();
  },
  home(g) {
    if (!this.st) return;
    const st = this.st;
    st.ride = null; st.treat = null; st.piece = null; st.show = null; st.fade = 0;
  },

  // ---------- the terminal ----------
  rideHome(g) {
    this.st.treat = null;
    Sfx.chime(); Haptics.tap();
    g.startTravel('subway', 'pierline', CFG.SUBWAY ? CFG.SUBWAY.RIDE : 6);
  },

  // ---------- the Ferris wheel ----------
  boardWheel(g) {
    const W = CFG.PIERPARK.WHEEL, st = this.st, p = g.player, TAU = Math.PI * 2;
    // the empty gondola that reaches the bottom first: the wheel eases round to it and stops for a moment
    let best = 0, bd = Infinity;
    for (let i = 0; i < W.N; i++) {
      if (W.VISITORS.includes(i)) continue;
      const a = st.wheelA + i * TAU / W.N, d = (((Math.PI / 2 - a) % TAU) + TAU) % TAU;
      if (d < bd) { bd = d; best = i; }
    }
    st.ride = { phase: 'board', t: 0, i: best, a0: st.wheelA, aT: st.wheelA + bd, from: { x: p.x, y: p.y }, top: false };
    p.moving = false;
    Sfx.pickup(); Haptics.tap();
  },
  stepRide(g, dt) {
    const W = CFG.PIERPARK.WHEEL, st = this.st, r = st.ride, p = g.player;
    r.t += dt;
    if (r.phase === 'board') {
      const k = this.ease(r.t / W.BOARD_T);
      st.wheelA = U.lerp(r.a0, r.aT, k);
      const s = this.seat(r.i, st.wheelA);
      p.x = U.lerp(r.from.x, s.x, k); p.y = U.lerp(r.from.y, s.y, k);
      if (r.t >= W.BOARD_T) { r.phase = 'ride'; r.t = 0; this.save(g).wheel++; }
    } else if (r.phase === 'ride') {
      const k = U.clamp(r.t / W.RIDE, 0, 1);
      st.wheelA = r.aT + Math.PI * 2 * this.ease(k);
      const s = this.seat(r.i, st.wheelA);
      p.x = s.x; p.y = s.y;
      if (!r.top && k >= 0.5) {
        r.top = true;
        this.say(g, p.x, p.y - 96, 'What a view! 🌊', '#ffffff', true, 2.4);
        this.sparkle(g, p.x, p.y - 60, 10, 40);
        Sfx.ding(); Haptics.success();
      }
      if (k >= 1) { r.phase = 'off'; r.t = 0; r.from = { x: p.x, y: p.y }; }
    } else {
      const k = this.ease(r.t / W.OFF_T);
      p.x = U.lerp(r.from.x, W.EXIT.x, k); p.y = U.lerp(r.from.y, W.EXIT.y, k);
      if (r.t >= W.OFF_T) { st.ride = null; p.x = W.EXIT.x; p.y = W.EXIT.y; }
    }
    p.moving = r.phase !== 'ride' && !!st.ride; if (p.moving) p.bob += dt * 12;
    p.facing = r.phase === 'off' ? -1 : 1; p.hasMoved = true;
  },

  // ---------- the Pizza Drop (being built) ----------
  helpBuild(g) {
    const B = CFG.PIERPARK.BUILD, st = this.st, s = this.save(g), p = g.player;
    s.helps++;
    p.facing = -1;
    const w = B.WORKERS[0];
    if (s.built < B.MAX) {
      st.piece = { t: 0 };
      this.say(g, p.x, p.y - 80, 'Bonk bonk! 🔨', '#ffe08a', true, 1.2);
      this.say(g, w.x, w.y - 84, 'Thank you! 👷', '#ffffff', true, 1.8);
      Sfx.drop(); Haptics.tap();
    } else {
      this.startShow(g, 'Test run! 🎢');
    }
  },
  startShow(g, text) {
    const B = CFG.PIERPARK.BUILD;
    this.st.show = { t: 0 };
    this.save(g).shows++;
    this.say(g, B.TOWER.x, B.TOWER.y - B.MAX * B.SEG - 70, text, '#ffffff', true, 2);
    Sfx.unlock(); Haptics.success();
  },
  stepBuild(g, dt) {
    const B = CFG.PIERPARK.BUILD, st = this.st, s = this.save(g);
    if (st.piece) {
      st.piece.t += dt;
      if (st.piece.t >= B.LOWER_T) {
        st.piece = null; s.built = Math.min(B.MAX, s.built + 1);
        const top = B.TOWER.y - s.built * B.SEG;
        this.sparkle(g, B.TOWER.x, top + 10, 8, 30);
        if (s.built >= B.MAX) this.startShow(g, 'The Pizza Drop is built! 🎉');
        else this.say(g, B.TOWER.x, top - 20, `${s.built} / ${B.MAX} 🏗️`, '#ffffff', true, 1.4);
      }
    }
    if (st.show) {
      st.show.t += dt;
      const t = st.show.t;
      if (t > 2.4 && !st.show.drop) { st.show.drop = true; this.say(g, B.TOWER.x, B.TOWER.y - 120, 'Wheee! 🎢', '#ffe08a', true, 1.4); }
      if (t > 3 && !st.show.cheer) { st.show.cheer = true; const w = B.WORKERS[0]; this.say(g, w.x, w.y - 84, 'Hooray! 🎉', '#ffffff', true, 1.6); this.sparkle(g, B.TOWER.x, B.TOWER.y - 40, 12, 50); }
      if (t >= B.SHOW_T) st.show = null;
    }
    // the second worker carries beams from the pile to the tower and back
    const w = st.worker, tg = w.to ? { x: B.PILE.x - 46, y: B.PILE.y + 18 } : { x: B.TOWER.x + 52, y: B.TOWER.y + 30 };
    if (w.wait > 0) { w.wait -= dt; w.moving = false; }
    else if (U.moveToward(w, tg.x, tg.y, 46, dt)) { w.to = 1 - w.to; w.carry = !w.to; w.wait = 1.4; w.moving = false; }
    else { w.moving = true; w.bob += dt * 10; w.facing = tg.x < w.x ? -1 : 1; }
  },

  // ---------- the food stands ----------
  getTreat(g, s) {
    const st = this.st, p = g.player;
    st.treat = { key: s.key, t: CFG.PIERPARK.TREAT_T };
    this.save(g).treats++;
    p.facing = 1;
    this.say(g, s.x, CFG.PIERPARK.STAND_Y - 96, s.say, '#ffffff', true, 1.6);
    Sfx.pickup(); Haptics.tap();
  },

  // ---------- life: strollers, gulls, balloons ----------
  stepLife(g, dt) {
    const st = this.st;
    for (const w of st.walkers) {
      if (w.wait > 0) { w.wait -= dt; w.moving = false; continue; }
      w.x += w.dir * w.sp * dt; w.moving = true; w.bob += dt * 9;
      if (w.x > 10340) { w.x = 10340; w.dir = -1; }
      if (w.x < 8060) { w.x = 8060; w.dir = 1; }
      if (Math.random() < dt * 0.06) w.wait = U.rand(1, 3);
    }
    for (const b of st.balloons) b.t += dt;
    st.balloons = st.balloons.filter((b) => b.t < 7);
    st.balloonT -= dt;
    if (st.balloonT <= 0 && st.balloons.length < 3) {
      st.balloonT = U.rand(7, 13);
      const w = U.pick(st.walkers);
      st.balloons.push({ x: w.x + 10, y: w.y - 60, t: 0, col: U.pick(['#ff5252', '#3b7dd8', '#ffd23f', '#2f9e44', '#ff7eb6', '#8e44ad']), sway: U.rand(0, 6) });
    }
  },

  // ---------- update ----------
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, P = CFG.PIERPARK;
    if (!this.here(g)) { if (st.ride && !g.travel) st.ride = null; st.piece = null; st.show = null; if (st.treat && !g.travel) st.treat = null; return; }
    st.fade = Math.max(0, st.fade - dt);
    if (st.treat) { st.treat.t -= dt; if (st.treat.t <= 0) { st.treat = null; this.say(g, p.x, p.y - 74, 'All gone! 😋', '#ffffff', false, 1.2); } }
    if (!st.ride) st.wheelA += dt * Math.PI * 2 / P.WHEEL.IDLE;
    this.stepLife(g, dt);
    this.stepBuild(g, dt);
    if (g.travel) return;
    if (st.ride) {
      if (this.busy(g)) { st.ride = null; return; }
      this.stepRide(g, dt); return;
    }
    if (this.busy(g)) return;
    // rescue: a save or a push that left the chef inside something (a wall, the wheel, the sea) puts them somewhere free
    if (!this.free(g, p.x, p.y, 8)) {
      const spot = P.SAFE.slice().sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y)).find((q) => this.free(g, q.x, q.y)) || CFG.PIER.ARRIVE;
      p.x = spot.x; p.y = spot.y; p.moving = false; g.cameraSnap = true;
    }
  },

  // ================= art =================
  paint: {
    pizzapier(r, g) { PizzaPierExt.paintPark(r, g); },
  },
  bgKey() { return ''; },

  paintPark(r, g) {
    const ctx = r.ctx, PW = CFG.PIER, W = PW.WORLD, P = CFG.PIERPARK, h = (i) => this.hash(i);
    const BW = PW.BOARDWALK, BE = PW.BEACH, SEA = PW.SEA_Y;
    // ---- the park's ground: warm paving with a faint tile grid
    ctx.fillStyle = '#ecdcbf'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, BW.y0 - W.y0);
    ctx.fillStyle = 'rgba(160,120,70,0.10)';
    for (let x = W.x0; x < W.x1; x += 48) ctx.fillRect(x, W.walkY0, 2, BW.y0 - W.walkY0);
    for (let y = W.walkY0; y < BW.y0; y += 48) ctx.fillRect(W.x0, y, W.x1 - W.x0, 2);
    // ---- the plots the other parts paint over: light paved plazas with a kerb
    for (const pl of this.otherPlots()) this.paintPlaza(r, pl);
    // ---- the lanes between the plots: bright brick paths
    this.paintLanes(r);
    // ---- the terminal: track, platform, the hall
    this.paintTerminal(r, g);
    // ---- the building site and the wheel's plaza
    this.paintSite(r);
    this.paintWheelPlaza(r);
    // ---- colourful paths from the boardwalk into each plot's south edge
    const stub = (x, y0, y1, c1, c2) => {
      ctx.fillStyle = 'rgba(120,80,40,0.25)'; U.roundRect(ctx, x - 44, y0 - 4, 88, y1 - y0 + 4, 12); ctx.fill();
      ctx.fillStyle = c1; U.roundRect(ctx, x - 40, y0, 80, y1 - y0, 10); ctx.fill();
      ctx.save(); U.roundRect(ctx, x - 40, y0, 80, y1 - y0, 10); ctx.clip();
      ctx.fillStyle = c2; for (let y = y0, row = 0; y < y1; y += 16, row++) for (let xx = x - 40 + (row % 2) * 16; xx < x + 40; xx += 32) { U.roundRect(ctx, xx + 2, y + 2, 12, 12, 3); ctx.fill(); }
      ctx.restore();
    };
    const PL = PW.PLOTS;
    stub((PL.bumper.x0 + PL.bumper.x1) / 2, PL.bumper.y1 - 30, BW.y0 + 2, '#ff8fab', '#ffd6e2');
    stub((PL.games.x0 + PL.games.x1) / 2, PL.games.y1 - 30, BW.y0 + 2, '#5ec8f2', '#d2f1ff');
    stub((PL.coaster.x0 + PL.coaster.x1) / 2, PL.coaster.y1 - 30, PL.coaster.y1 + 40, '#ffcf4d', '#fff1c2');
    stub(9860, 5800, BW.y0 + 2, '#7bd88f', '#d8f7df');
    // ---- the beach
    ctx.fillStyle = '#f6dfa2'; ctx.fillRect(W.x0, BW.y1, W.x1 - W.x0, SEA - BW.y1);
    ctx.fillStyle = '#ead08a'; ctx.fillRect(W.x0, SEA - 26, W.x1 - W.x0, 26);
    for (let i = 0; i < 260; i++) { const x = W.x0 + h(i) * (W.x1 - W.x0), y = BE.y0 + 10 + h(i + 500) * (SEA - BE.y0 - 30); ctx.fillStyle = i % 4 ? 'rgba(190,150,80,0.25)' : 'rgba(255,255,255,0.6)'; ctx.fillRect(x, y, 2, 2); }
    for (let i = 0; i < 18; i++) { const x = W.x0 + 40 + h(i + 900) * (W.x1 - W.x0 - 80), y = BE.y0 + 30 + h(i + 950) * 140; this.paintShell(ctx, x, y, i); }
    // towels and a few footprints
    const towels = [[8240, 6196, '#3b7dd8'], [8620, 6168, '#ff7eb6'], [8900, 6214, '#ffd23f'], [9540, 6186, '#2f9e44'], [9820, 6214, '#e4572e'], [10300, 6188, '#4ecdc4']];
    for (const [x, y, c] of towels) { ctx.fillStyle = 'rgba(150,110,50,0.18)'; ctx.fillRect(x - 26, y - 13, 56, 30); ctx.fillStyle = c; ctx.fillRect(x - 28, y - 15, 56, 28); ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 28, y - 11 + k * 9, 56, 3); }
    ctx.fillStyle = 'rgba(170,130,70,0.3)';
    for (let i = 0; i < 16; i++) { const x = 8930 + i * 26, y = 6110 + Math.sin(i * 0.8) * 16 + (i % 2 ? 5 : -5); ctx.beginPath(); ctx.ellipse(x, y, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    // a bucket and spade by the sandcastle
    { const C = P.CASTLE; ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(C.x - 66, C.y - 14); ctx.lineTo(C.x - 50, C.y - 14); ctx.lineTo(C.x - 53, C.y + 4); ctx.lineTo(C.x - 63, C.y + 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(C.x + 46, C.y - 6, 18, 5); ctx.fillRect(C.x + 62, C.y - 9, 8, 11); }
    // ---- the sea, with gentle waves
    const sg = ctx.createLinearGradient(0, SEA, 0, W.y1); sg.addColorStop(0, '#5cc2ee'); sg.addColorStop(1, '#2d86c8');
    ctx.fillStyle = sg; ctx.fillRect(W.x0, SEA, W.x1 - W.x0, W.y1 - SEA);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const x = W.x0 + h(i + 1300) * (W.x1 - W.x0), y = SEA + 30 + h(i + 1400) * (W.y1 - SEA - 40); ctx.beginPath(); ctx.arc(x, y + 10, 12, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    ctx.lineCap = 'butt';
    // a buoy and a little island of rocks far out
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(9020, 6340, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(9011, 6337, 18, 4);
    // ---- the boardwalk: planks across the walk, beams along its edges
    ctx.fillStyle = '#c99a63'; ctx.fillRect(W.x0, BW.y0, W.x1 - W.x0, BW.y1 - BW.y0);
    for (let x = W.x0, i = 0; x < W.x1; x += 16, i++) {
      ctx.fillStyle = h(i + 2000) < 0.33 ? '#d4a76f' : h(i + 2000) < 0.66 ? '#c3925a' : '#cc9f66'; ctx.fillRect(x, BW.y0, 15, BW.y1 - BW.y0);
      ctx.fillStyle = 'rgba(90,55,25,0.35)'; ctx.fillRect(x + 15, BW.y0, 1, BW.y1 - BW.y0);
      if (h(i + 2100) < 0.5) { ctx.fillStyle = 'rgba(90,55,25,0.25)'; ctx.fillRect(x, BW.y0 + 20 + h(i + 2200) * 110, 15, 1); }
      ctx.fillStyle = 'rgba(70,45,20,0.5)'; ctx.fillRect(x + 7, BW.y0 + 8, 2, 2); ctx.fillRect(x + 7, BW.y1 - 10, 2, 2);
    }
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(W.x0, BW.y0 - 4, W.x1 - W.x0, 6); ctx.fillRect(W.x0, BW.y1 - 4, W.x1 - W.x0, 8);
    // the stairs down to the beach
    for (const x of P.STAIRS) {
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#b98a55' : '#c99a63'; ctx.fillRect(x - P.STAIR_HALF + 4, BW.y1 + 4 + k * 9, P.STAIR_HALF * 2 - 8, 9); ctx.fillStyle = 'rgba(90,55,25,0.4)'; ctx.fillRect(x - P.STAIR_HALF + 4, BW.y1 + 12 + k * 9, P.STAIR_HALF * 2 - 8, 1); }
    }
    // the spots
    this.paintSpot(r, P.BOARD, '🚇', '#8e44ad');
    this.paintSpot(r, P.WHEEL.BOARD, '🎡', '#e4572e');
    this.paintSpot(r, P.BUILD.HELP, '🔨', '#ff8c1a');
    for (const s of P.STANDS) this.paintSpot(r, this.standSpot(s), s.ico, s.awn);
    // ---- the top band: sky, the far skyline and the park's back fence
    this.paintSky(r);
  },
  paintPlaza(r, pl) {
    const ctx = r.ctx;
    ctx.fillStyle = '#d9c7a6'; U.roundRect(ctx, pl.x0 - 4, pl.y0 - 4, pl.x1 - pl.x0 + 8, pl.y1 - pl.y0 + 8, 14); ctx.fill();
    ctx.fillStyle = '#f7f0e2'; U.roundRect(ctx, pl.x0, pl.y0, pl.x1 - pl.x0, pl.y1 - pl.y0, 12); ctx.fill();
    ctx.fillStyle = 'rgba(180,150,110,0.14)';
    for (let x = pl.x0 + 30; x < pl.x1; x += 30) ctx.fillRect(x, pl.y0 + 2, 1.5, pl.y1 - pl.y0 - 4);
    for (let y = pl.y0 + 30; y < pl.y1; y += 30) ctx.fillRect(pl.x0 + 2, y, pl.x1 - pl.x0 - 4, 1.5);
  },
  paintLanes(r) {
    const ctx = r.ctx, P = CFG.PIERPARK;
    for (const L of P.LANES) {
      ctx.fillStyle = '#e9785f'; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
      ctx.fillStyle = '#f39a82';
      for (let y = L.y0, row = 0; y < L.y1; y += 12, row++) for (let x = L.x0 + (row % 2) * 12; x < L.x1; x += 24) ctx.fillRect(x + 1, y + 1, 10, 10);
    }
  },
  paintShell(ctx, x, y, i) {
    const c = ['#ffb3c7', '#ffe0a3', '#ffffff', '#c9b6ff'][i % 4];
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.arc(x, y + 4, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,80,0.5)'; ctx.lineWidth = 1; for (const d of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + d, y - 1); ctx.stroke(); }
  },
  paintSpot(r, s, ico, col) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.ellipse(s.x, s.y, 26, 12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ico, s.x, s.y + 1);
  },
  paintSky(r) {
    const ctx = r.ctx, W = CFG.PIER.WORLD, h = (i) => this.hash(i), base = W.walkY0 - 6;
    const sky = ctx.createLinearGradient(0, W.y0, 0, base); sky.addColorStop(0, '#74c4f4'); sky.addColorStop(1, '#d6f0ff');
    ctx.fillStyle = sky; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, base - W.y0 + 2);
    ctx.fillStyle = '#fff4b8'; ctx.beginPath(); ctx.arc(10180, W.y0 + 34, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 9; i++) { const x = W.x0 + 120 + i * 270 + h(i + 40) * 80, y = W.y0 + 18 + h(i + 60) * 30; ctx.beginPath(); ctx.ellipse(x, y, 34, 9, 0, 0, Math.PI * 2); ctx.ellipse(x + 18, y - 6, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); }
    // the City far away: two rows of pale towers (the Pizza Tower among them)
    const row = (step, hmin, hmax, col, win, off) => {
      for (let x = W.x0 - 20, i = 0; x < W.x1; i++) {
        const w = step * (0.6 + h(i * 3.3 + off) * 0.7), bh = hmin + (hmax - hmin) * h(i * 1.9 + off);
        ctx.fillStyle = col; ctx.fillRect(x, base - bh, w - 3, bh);
        if (h(i + off * 2) < 0.3) { ctx.fillRect(x + w / 2 - 4, base - bh - 8, 6, 8); }
        ctx.fillStyle = win; for (let yy = base - bh + 6; yy < base - 6; yy += 9) for (let xx = x + 4; xx < x + w - 8; xx += 8) if (h(xx * 0.7 + yy) < 0.5) ctx.fillRect(xx, yy, 3, 4);
        x += w;
      }
    };
    row(56, 26, 70, '#b9cbe2', 'rgba(255,255,255,0.55)', 7);
    row(44, 14, 40, '#9fb6d3', 'rgba(255,248,210,0.6)', 19);
    // the Pizza Tower, the tallest of all
    const tx = 8860;
    ctx.fillStyle = '#9fb6d3'; ctx.fillRect(tx - 10, base - 92, 20, 92); ctx.beginPath(); ctx.moveTo(tx - 16, base - 92); ctx.lineTo(tx + 16, base - 92); ctx.lineTo(tx, base - 106); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.arc(tx, base - 100, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(tx - 2, base - 101, 1.8, 0, Math.PI * 2); ctx.arc(tx + 3, base - 98, 1.8, 0, Math.PI * 2); ctx.fill();
    // a soft haze at the foot of the skyline, then the back fence along the park's edge
    ctx.fillStyle = 'rgba(214,240,255,0.7)'; ctx.fillRect(W.x0, base - 8, W.x1 - W.x0, 8);
    ctx.fillStyle = '#b48a5a'; ctx.fillRect(W.x0, base, W.x1 - W.x0, W.walkY0 - base + 4);
    for (let x = W.x0 + 6; x < W.x1; x += 22) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, base - 16, 10, 20); ctx.beginPath(); ctx.moveTo(x, base - 16); ctx.lineTo(x + 5, base - 22); ctx.lineTo(x + 10, base - 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(120,90,60,0.25)'; ctx.fillRect(x + 8, base - 14, 2, 18);
    }
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(W.x0, base - 10, W.x1 - W.x0, 4); ctx.fillRect(W.x0, base - 1, W.x1 - W.x0, 3);
  },
  paintTerminal(r) {
    const ctx = r.ctx, P = CFG.PIERPARK, S = P.STATION, T = P.TRACK, PF = P.PLATFORM, h = (i) => this.hash(i);
    // the platform: pale concrete slabs with a yellow safety strip along the track
    ctx.fillStyle = '#d6d1c7'; ctx.fillRect(PF.x0, PF.y0, PF.x1 - PF.x0, PF.y1 - PF.y0);
    ctx.fillStyle = 'rgba(120,110,100,0.18)';
    for (let x = PF.x0 + 60; x < PF.x1; x += 60) ctx.fillRect(x, PF.y0, 2, PF.y1 - PF.y0);
    for (let y = PF.y0 + 50; y < PF.y1; y += 50) ctx.fillRect(PF.x0, y, PF.x1 - PF.x0, 2);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(PF.x0, PF.y0, PF.x1 - PF.x0, 10);
    ctx.fillStyle = 'rgba(160,120,0,0.4)'; for (let x = PF.x0 + 3; x < PF.x1; x += 8) ctx.fillRect(x, PF.y0 + 3, 3, 4);
    ctx.fillStyle = '#9b958a'; ctx.fillRect(PF.x1 - 4, PF.y0, 4, PF.y1 - PF.y0);
    // a purple "2" on the platform floor
    ctx.fillStyle = 'rgba(142,68,173,0.18)'; ctx.beginPath(); ctx.arc(8110, 5780, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(142,68,173,0.45)'; ctx.font = r.font(34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('2', 8110, 5782);
    // the track: gravel, sleepers and two rails running in from the west edge to the buffer stop
    ctx.fillStyle = '#9a8f82'; ctx.fillRect(T.x0, T.y0 + 30, T.x1 - T.x0, T.y1 - T.y0 - 30);
    for (let i = 0; i < 200; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(60,50,40,0.2)'; ctx.fillRect(T.x0 + h(i + 3000) * (T.x1 - T.x0), T.y0 + 32 + h(i + 3100) * (T.y1 - T.y0 - 34), 3, 2); }
    ctx.fillStyle = '#7a5a3a'; for (let x = T.x0 + 4; x < T.x1 - 20; x += 18) ctx.fillRect(x, T.y0 + 76, 9, 46 - 6);
    ctx.fillStyle = '#5f6670'; ctx.fillRect(T.x0, 5614, T.x1 - T.x0 - 18, 4); ctx.fillRect(T.x0, 5632, T.x1 - T.x0 - 18, 4);
    ctx.fillStyle = '#c7ccd3'; ctx.fillRect(T.x0, 5614, T.x1 - T.x0 - 18, 1.5); ctx.fillRect(T.x0, 5632, T.x1 - T.x0 - 18, 1.5);
    // the buffer stop
    ctx.fillStyle = '#e4572e'; ctx.fillRect(T.x1 - 22, 5596, 14, 42); ctx.fillStyle = '#ffd23f'; ctx.fillRect(T.x1 - 22, 5604, 14, 6); ctx.fillRect(T.x1 - 22, 5620, 14, 6);
    // ---- the hall behind the track: a cream and brick terminal with tall arched windows and a teal vaulted roof
    const fy = 5340;   // where its front wall starts (above it is the roof)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(S.x0, S.y1, S.x1 - S.x0, 10);
    ctx.fillStyle = '#f1dfb8'; ctx.fillRect(S.x0, fy, S.x1 - S.x0, S.y1 - fy);
    ctx.fillStyle = '#b5523b'; ctx.fillRect(S.x0, S.y1 - 40, S.x1 - S.x0, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = S.y1 - 36; y < S.y1; y += 8) for (let x = S.x0 + ((y / 8) % 2) * 10; x < S.x1; x += 20) ctx.fillRect(x, y, 18, 1.5);
    for (let i = 0; i < 4; i++) {
      const wx = S.x0 + 40 + i * 92, ww = 62, wy = fy + 52, wh = 100;
      ctx.fillStyle = '#8e44ad'; U.roundRect(ctx, wx - 4, wy - 4, ww + 8, wh + 8, 30); ctx.fill();
      ctx.fillStyle = '#bfe6ff'; U.roundRect(ctx, wx, wy, ww, wh, 28); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(wx + 8, wy + 10, 8, wh - 22);
      ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + 44); ctx.lineTo(wx + ww, wy + 44); ctx.stroke();
    }
    // the roof: a teal vault with ribs, seen from above, and a cornice
    const rg = ctx.createLinearGradient(0, S.y0, 0, fy); rg.addColorStop(0, '#2f8f84'); rg.addColorStop(1, '#55b9a8');
    ctx.fillStyle = rg; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, fy - S.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; for (let x = S.x0 + 26; x < S.x1; x += 34) ctx.fillRect(x, S.y0, 4, fy - S.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = S.x0 + 60; x < S.x1 - 20; x += 120) { U.roundRect(ctx, x, S.y0 + 40, 60, 120, 10); ctx.fill(); }
    ctx.fillStyle = '#f7ead0'; ctx.fillRect(S.x0, fy - 10, S.x1 - S.x0, 14);
    ctx.fillStyle = '#8e44ad'; ctx.fillRect(S.x0, fy + 2, S.x1 - S.x0, 6);
    // the sign: a purple "2" bullet and the name
    const sx = (S.x0 + S.x1) / 2, sy = fy + 22;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, sx - 120, sy - 16, 240, 30, 8); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; U.roundRect(ctx, sx - 120, sy - 16, 240, 30, 8); ctx.stroke();
    ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.arc(sx - 96, sy - 1, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('2', sx - 96, sy);
    ctx.fillText('PIZZA PIER  🎡', sx + 10, sy);
    // a clock over the middle windows
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, fy - 30, 18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx, fy - 30); ctx.lineTo(sx, fy - 42); ctx.moveTo(sx, fy - 30); ctx.lineTo(sx + 8, fy - 27); ctx.stroke();
  },
  paintSite(r) {
    const ctx = r.ctx, PL = CFG.PIER.PLOTS.building, B = CFG.PIERPARK.BUILD, h = (i) => this.hash(i);
    const x0 = PL.x0, x1 = 9944, y0 = PL.y0, y1 = PL.y1;
    ctx.fillStyle = '#c99e6a'; U.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 12); ctx.fill();
    ctx.fillStyle = '#d8b07a'; U.roundRect(ctx, x0 + 10, y0 + 10, x1 - x0 - 20, y1 - y0 - 20, 10); ctx.fill();
    for (let i = 0; i < 140; i++) { ctx.fillStyle = i % 3 ? 'rgba(120,80,40,0.25)' : 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 14 + h(i + 4000) * (x1 - x0 - 28), y0 + 14 + h(i + 4100) * (y1 - y0 - 28), 3, 2); }
    // tyre tracks and a puddle
    ctx.strokeStyle = 'rgba(110,75,40,0.25)'; ctx.lineWidth = 8; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(9500, 5540); ctx.quadraticCurveTo(9560, 5440, 9520, 5300); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9530, 5545); ctx.quadraticCurveTo(9590, 5440, 9550, 5300); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(110,170,220,0.6)'; ctx.beginPath(); ctx.ellipse(9790, 5300, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
    // the tower's concrete footing and chalk marks
    ctx.fillStyle = '#b8b3aa'; ctx.fillRect(B.TOWER.x - 46, B.TOWER.y - 18, 92, 26);
    ctx.fillStyle = '#d0ccc4'; ctx.fillRect(B.TOWER.x - 46, B.TOWER.y - 18, 92, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(B.TOWER.x - 70, B.TOWER.y - 34, 140, 60); ctx.setLineDash([]);
    // the crane's footing
    ctx.fillStyle = '#b8b3aa'; ctx.fillRect(B.CRANE.x - 26, B.CRANE.y - 16, 52, 22);
    // a big "2" style dashed outline where the drop tower's queue will go
    ctx.strokeStyle = 'rgba(255,140,26,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); U.roundRect(ctx, 9500, 5180, 220, 120, 14); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = r.font(12); ctx.fillStyle = 'rgba(160,80,10,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('QUEUE HERE SOON', 9610, 5240);
  },
  paintWheelPlaza(r) {
    const ctx = r.ctx, PL = CFG.PIER.PLOTS.wheel, Wh = CFG.PIERPARK.WHEEL, Z = CFG.PIERPARK.WHEEL_ZONE;
    // the plaza in front of the wheel: a sunburst of coloured tiles
    ctx.fillStyle = '#d9c7a6'; U.roundRect(ctx, PL.x0 - 4, PL.y0 - 4, PL.x1 - PL.x0 + 8, PL.y1 - PL.y0 + 8, 14); ctx.fill();
    ctx.fillStyle = '#f9eed8'; U.roundRect(ctx, PL.x0, PL.y0, PL.x1 - PL.x0, PL.y1 - PL.y0, 12); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(Z.x0, PL.y0, PL.x1 - Z.x0, PL.y1 - PL.y0); ctx.clip();
    const cols = ['#ffd6e2', '#d2f1ff', '#fff1c2', '#d8f7df'];
    for (let i = 0; i < 16; i++) { const a0 = Math.PI + i * Math.PI / 16, a1 = a0 + Math.PI / 16; ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.moveTo(Wh.x, Wh.base); ctx.arc(Wh.x, Wh.base, 260, a0, a1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // concrete pads for the legs, and the boarding deck
    ctx.fillStyle = '#b8b3aa'; for (const dx of [-122, 122]) { ctx.fillRect(Wh.x + dx - 22, Wh.base - 14, 44, 18); }
    ctx.fillStyle = '#8a5a2b'; U.roundRect(ctx, Wh.x - 92, Wh.base - 22, 184, 46, 8); ctx.fill();
    ctx.fillStyle = '#c99a63'; U.roundRect(ctx, Wh.x - 88, Wh.base - 20, 176, 40, 6); ctx.fill();
    ctx.fillStyle = 'rgba(90,55,25,0.35)'; for (let x = Wh.x - 84; x < Wh.x + 88; x += 14) ctx.fillRect(x, Wh.base - 20, 1.5, 40);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(Wh.x - 88, Wh.base + 16, 176, 4);
    // the queue ropes beside the gate
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(Wh.x + 40, Wh.base + 30); ctx.quadraticCurveTo(Wh.x + 80, Wh.base + 36, Wh.x + 120, Wh.base + 30); ctx.stroke();
  },

  // ---- each frame
  dynamic(r, g) {
    if (!this.st || !this.here(g)) return;
    const ctx = r.ctx, W = CFG.PIER.WORLD, SEA = CFG.PIER.SEA_Y, t = g.time;
    // above the map's top edge (seen under the HUD): more sky
    if (r.camY < W.y0) { ctx.fillStyle = '#74c4f4'; ctx.fillRect(r.camX - 10, r.camY - 10, r.viewW + 20, W.y0 - r.camY + 10); }
    // the waves lapping the sand, and glints moving on the water
    const x0 = Math.max(W.x0, r.camX - 20), x1 = Math.min(W.x1, r.camX + r.viewW + 20);
    if (r.camY + r.viewH > SEA - 30 && x1 > x0) {
      const lap = Math.sin(t * 1.1) * 6;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(x0, SEA + 4);
      for (let x = Math.floor(x0 / 20) * 20; x <= x1 + 20; x += 20) ctx.lineTo(x, SEA - 2 + lap + Math.sin(x * 0.03 + t * 1.6) * 4);
      ctx.lineTo(x1 + 20, SEA + 10); ctx.lineTo(x0, SEA + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(92,194,238,0.9)'; ctx.fillRect(x0, SEA + 9, x1 - x0 + 20, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) for (let k = 0; k < 2; k++) {
        const yy = SEA + 40 + k * 55 + ((x / 90) % 2) * 20, dx = Math.sin(t * 0.6 + x * 0.01 + k) * 14;
        ctx.beginPath(); ctx.moveTo(x + dx - 12, yy); ctx.quadraticCurveTo(x + dx, yy - 6, x + dx + 12, yy); ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
  },
  entities(r, g, items) {
    if (!this.st || !this.here(g)) return;
    const st = this.st, P = CFG.PIERPARK, p = g.player;
    const vx0 = r.camX - 140, vx1 = r.camX + r.viewW + 140, vy0 = r.camY - 60, vy1 = r.camY + r.viewH + 460;
    const vis = (x0, x1, y) => x1 > vx0 && x0 < vx1 && y > vy0 && y < vy1;
    if (vis(P.TRAIN.x0, P.TRAIN.x1, P.TRAIN.y)) items.push({ y: P.TRAIN.y, draw: () => this.drawTrain(r, g) });
    if (vis(8000, 8400, P.POST_Y)) items.push({ y: P.POST_Y, draw: () => this.drawCanopy(r, g) });
    if (vis(8000, 8400, P.ARCH.y)) items.push({ y: P.ARCH.y, draw: () => this.drawArch(r, g) });
    for (const s of P.STANDS) if (vis(s.x - 60, s.x + 60, P.STAND_Y)) items.push({ y: P.STAND_Y, draw: () => this.drawStand(r, g, s) });
    if (vis(8000, 10400, P.RAIL_Y)) items.push({ y: P.RAIL_Y + 2, draw: () => this.drawRailing(r, g) });
    P.BENCHES.forEach((b, i) => { if (vis(b[0] - 50, b[0] + 50, P.RAIL_Y - 14)) items.push({ y: P.RAIL_Y - 14, draw: () => this.drawBench(r, g, b, i) }); });
    for (const u of P.UMBRELLAS) if (vis(u[0] - 60, u[0] + 60, u[1])) items.push({ y: u[1], draw: () => this.drawUmbrella(r, u) });
    if (vis(P.CASTLE.x - 60, P.CASTLE.x + 60, P.CASTLE.y)) items.push({ y: P.CASTLE.y + 4, draw: () => this.drawCastle(r, g) });
    { const kx = P.CASTLE.x - 80, ky = P.CASTLE.y + 30; if (vis(kx - 30, kx + 30, ky)) items.push({ y: ky, draw: () => this.drawSeated(r, kx, ky, { shirt: '#ffd23f', hair: '#8a4b20', hairStyle: 2, skin: '#f1c27d', facing: 1, pants: '#3b7dd8' }, 8) }); }
    // the wheel, and the chef's own gondola drawn after it (and after the chef, who is redrawn sitting in it)
    const Wh = P.WHEEL;
    if (vis(Wh.x - 260, Wh.x + 260, Wh.base)) items.push({ y: Wh.base, draw: () => this.drawWheel(r, g) });
    if (st.ride && st.ride.phase !== 'off' && !g.driving) {
      const k = st.ride.phase === 'board' ? this.ease(st.ride.t / Wh.BOARD_T) : 1;
      items.push({ y: Math.max(p.y, Wh.base) + 30, draw: () => this.drawChefGondola(r, g, k) });
    }
    // the building site
    const B = P.BUILD;
    if (vis(9480, 9960, B.TOWER.y)) {
      items.push({ y: B.TOWER.y, draw: () => this.drawTower(r, g) });
      items.push({ y: B.CRANE.y, draw: () => this.drawCrane(r, g) });
      items.push({ y: B.MIXER.y, draw: () => this.drawMixer(r, g) });
      items.push({ y: B.PILE.y, draw: () => this.drawPile(r) });
      items.push({ y: B.SIGN.y, draw: () => this.drawSign(r) });
      for (const cx of B.CONES) items.push({ y: B.CONE_Y, draw: () => this.drawCone(r.ctx, cx, B.CONE_Y) });
      const w0 = B.WORKERS[0];
      items.push({ y: w0.y, draw: () => this.drawWorker(r, g, w0.x, w0.y, { facing: 1, hammer: true }) });
      const w = st.worker;
      items.push({ y: w.y, draw: () => this.drawWorker(r, g, w.x, w.y, { facing: w.facing || 1, moving: w.moving, bob: w.bob, beam: w.carry }) });
    }
    // strollers
    for (const w of st.walkers) if (vis(w.x - 30, w.x + 30, w.y)) items.push({ y: w.y, draw: () => this.drawWalker(r, g, w) });
    // a few visitors queuing by the wheel's gate
    for (const [qx, qy, li] of [[Wh.x + 64, Wh.base + 40, 3], [Wh.x + 100, Wh.base + 44, 6]]) if (vis(qx - 30, qx + 30, qy)) items.push({ y: qy, draw: () => { const lk = Object.assign({}, st.walkers[li].look, { facing: -1, moving: false }); r.drawPerson(qx, qy, lk); } });
    // what the chef is eating or drinking
    if (st.treat && !st.ride && !g.driving) items.push({ y: p.y + 1, draw: () => this.drawTreat(r, g, p.x, p.y, p.facing || 1, p.moving ? Math.sin(p.bob || 0) * 2 : 0) });
  },
  overlay(r, g) {
    if (!this.st || !this.here(g)) return;
    const ctx = r.ctx, st = this.st, t = g.time;
    // seagulls gliding over the beach
    for (const q of st.gulls) {
      const x = q.cx + Math.sin(t * q.w + q.ph) * q.ax, y = q.cy + Math.sin(t * q.w * 2.3 + q.ph) * 30 - 120;
      if (x < r.camX - 40 || x > r.camX + r.viewW + 40 || y < r.camY - 40 || y > r.camY + r.viewH + 40) continue;
      const dir = Math.cos(t * q.w + q.ph) >= 0 ? 1 : -1, flap = Math.sin(t * 7 + q.ph) * 6;
      ctx.fillStyle = 'rgba(40,60,90,0.12)'; ctx.beginPath(); ctx.ellipse(x, y + 140, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7d8591'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 16, y - flap); ctx.quadraticCurveTo(x - 8, y - 6 - flap * 0.4, x, y); ctx.quadraticCurveTo(x + 8, y - 6 - flap * 0.4, x + 16, y - flap); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y + 1, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.moveTo(x + dir * 7, y); ctx.lineTo(x + dir * 12, y + 1); ctx.lineTo(x + dir * 7, y + 2.5); ctx.closePath(); ctx.fill();
      ctx.lineCap = 'butt';
    }
    // balloons drifting up and away
    for (const b of st.balloons) {
      const x = b.x + Math.sin(b.t * 1.4 + b.sway) * 14 + b.t * 6, y = b.y - b.t * 46;
      if (x < r.camX - 30 || x > r.camX + r.viewW + 30 || y < r.camY - 40 || y > r.camY + r.viewH + 40) continue;
      this.drawBalloon(ctx, x, y, b.col, Math.max(0, 1 - Math.max(0, b.t - 5.5) / 1.5));
    }
  },
  screen(r, g) {
    const st = this.st;
    if (!st || !this.here(g) || st.fade <= 0) return;
    const ctx = r.ctx;
    ctx.fillStyle = `rgba(255,255,255,${U.clamp(st.fade / 0.5, 0, 1).toFixed(3)})`; ctx.fillRect(0, 0, r.canvas.width / r.dpr, r.canvas.height / r.dpr);
  },

  // ---- drawing helpers
  glow(ctx, x, y, rad, col, a) {
    if (a <= 0.01) return;
    ctx.fillStyle = `rgba(${col},${(0.18 * a).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${col},${(0.3 * a).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad * 0.55, 0, Math.PI * 2); ctx.fill();
  },
  bulb(ctx, x, y, col, on) { ctx.fillStyle = on ? col : 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); },
  drawBalloon(ctx, x, y, col, a) {
    ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(60,60,60,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x - 4, y + 26, x + 1, y + 38); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 3, y + 15); ctx.lineTo(x + 3, y + 15); ctx.lineTo(x, y + 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 5, 2.5, 4, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  },
  hardHat(ctx, x, y, bob) {
    ctx.fillStyle = '#ffc107'; ctx.beginPath(); ctx.arc(x, y - 43 + bob, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - 15, y - 44 + bob, 30, 4); ctx.fillStyle = '#ffdf6e'; ctx.fillRect(x - 2, y - 55 + bob, 4, 10);
  },
  drawWorker(r, g, x, y, o) {
    const ctx = r.ctx, bob = o.moving ? Math.sin(o.bob || 0) * 2 : 0;
    r.drawPerson(x, y, { shirt: '#ff8c1a', skin: o.facing > 0 ? '#c68642' : '#f1c27d', hair: '#2b1d14', facing: o.facing, moving: !!o.moving, bob: o.bob || 0, pants: '#3a5a8c', stripes: true });
    this.hardHat(ctx, x, y, bob);
    if (o.hammer) {   // a hammer bonking the tower's bolts
      const a = Math.abs(Math.sin(g.time * 5)) * 0.9 - 0.3;
      ctx.save(); ctx.translate(x + 16, y - 16); ctx.rotate(-a);
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-2, -16, 4, 18); ctx.fillStyle = '#5c6670'; ctx.fillRect(-7, -20, 14, 7);
      ctx.restore();
    }
    if (o.beam) {   // a red beam on the shoulder
      ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 26, y - 34 + bob, 52, 6); ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = -22; k < 26; k += 10) ctx.fillRect(x + k, y - 33 + bob, 4, 4);
    }
  },
  // someone sitting (on a bench, on the sand): legs tucked out of sight under the seat line
  drawSeated(r, x, y, look, cut) {
    const ctx = r.ctx;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 40, y - 100, 80, 100 - cut); ctx.clip();
    r.drawPerson(x, y, look);
    ctx.restore();
  },
  drawWalker(r, g, w) {
    const look = Object.assign({}, w.look, { facing: w.dir, moving: w.moving, bob: w.bob });
    r.drawPerson(w.x, w.y, look);
    if (w.balloon) { const bx = w.x + w.dir * 14, by = w.y - 82 + Math.sin(g.time * 2 + w.x * 0.01) * 3; const c = r.ctx; c.strokeStyle = 'rgba(60,60,60,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w.x + w.dir * 14, w.y - 16); c.lineTo(bx, by + 14); c.stroke(); this.drawBalloon(c, bx, by, w.balloon, 1); }
  },
  drawTreat(r, g, px, py, f, bob) {
    const ctx = r.ctx, st = this.st, x = px + f * 18, y = py - 20 + bob;
    if (!st.treat) return;
    const k = st.treat.key, left = st.treat.t / CFG.PIERPARK.TREAT_T;
    if (k === 'candy') {
      ctx.fillStyle = '#f2e6c9'; ctx.fillRect(x - 1.5, y - 12, 3, 16);
      const rr = 7 + 6 * left;
      ctx.fillStyle = '#ff9ccc'; ctx.beginPath(); ctx.arc(x, y - 14 - rr * 0.6, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffc6e2'; ctx.beginPath(); ctx.arc(x - rr * 0.35, y - 16 - rr * 0.7, rr * 0.55, 0, Math.PI * 2); ctx.arc(x + rr * 0.4, y - 12 - rr * 0.6, rr * 0.45, 0, Math.PI * 2); ctx.fill();
    } else if (k === 'pizza') {
      ctx.save(); ctx.translate(x, y - 6); ctx.rotate(f * -0.5);
      ctx.fillStyle = '#e8a94e'; ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(0, 10 - (1 - left) * 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, -7); ctx.lineTo(0, 8 - (1 - left) * 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-2, -3, 2, 0, Math.PI * 2); ctx.arc(3, -1, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; ctx.fillRect(-10, -12, 20, 4);
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 7, y - 16); ctx.lineTo(x + 7, y - 16); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.moveTo(x - 6, y - 16 + 16 * (1 - left)); ctx.lineTo(x + 6, y - 16 + 16 * (1 - left)); ctx.lineTo(x + 5, y + 3); ctx.lineTo(x - 5, y + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 2, y - 10); ctx.lineTo(x + 6, y - 24); ctx.stroke();
      ctx.fillStyle = '#7bd88f'; ctx.beginPath(); ctx.arc(x - 6, y - 16, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawTrain(r, g) {
    const ctx = r.ctx, T = CFG.PIERPARK.TRAIN, y = T.y, k = this.dusk();
    const cars = 3, gap = 6, cw = (T.x1 - T.x0 - gap * (cars - 1)) / cars, top = y - 70;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(T.x0 + 4, y - 4, T.x1 - T.x0, 8);
    for (let c = 0; c < cars; c++) {
      const x = T.x0 + c * (cw + gap), front = c === cars - 1;
      ctx.fillStyle = '#2b2f36'; for (const wx of [x + 20, x + 36, x + cw - 36, x + cw - 20]) { ctx.beginPath(); ctx.arc(wx, y - 2, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#8e44ad'; U.roundRect(ctx, x, top, cw, 64, front ? 14 : 8); ctx.fill();
      ctx.fillStyle = '#a861c4'; ctx.fillRect(x + 4, top + 4, cw - 8, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, top + 40, cw, 6);
      ctx.fillStyle = '#d7c3e6'; ctx.fillRect(x, top + 50, cw, 10);
      // windows, doors
      for (let wx = x + 10; wx < x + cw - 20; wx += 24) { ctx.fillStyle = k > 0.3 ? '#fff1b8' : '#cfe9ff'; U.roundRect(ctx, wx, top + 12, 18, 22, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(wx + 3, top + 14, 4, 16); }
      ctx.fillStyle = '#6c3483'; ctx.fillRect(x + cw / 2 - 12, top + 10, 24, 50); ctx.fillStyle = k > 0.3 ? '#fff1b8' : '#cfe9ff'; ctx.fillRect(x + cw / 2 - 10, top + 13, 9, 22); ctx.fillRect(x + cw / 2 + 1, top + 13, 9, 22);
      if (front) {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + cw - 20, top + 26, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8e44ad'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('2', x + cw - 20, top + 27);
        ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(x + cw - 6, top + 52, 4, 0, Math.PI * 2); ctx.fill();
        this.glow(ctx, x + cw - 6, top + 52, 26, '255,230,120', k);
      }
      if (c === 0) { ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎡', x + 16, top + 24); }
    }
  },
  drawCanopy(r, g) {
    const ctx = r.ctx, P = CFG.PIERPARK, y = P.POST_Y, rt = 5468, k = this.dusk(), t = g.time;
    for (const x of P.POSTS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 3, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6c3483'; ctx.fillRect(x - 5, rt + 30, 10, y - rt - 30); ctx.fillStyle = '#a861c4'; ctx.fillRect(x - 5, rt + 30, 3, y - rt - 30);
      ctx.fillStyle = '#8e44ad'; ctx.fillRect(x - 9, y - 10, 18, 10);
    }
    // the roof: a shallow purple and white vault over the track
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(8000, rt + 34, 404, 8);
    ctx.fillStyle = '#ffffff'; U.roundRect(ctx, 8000, rt, 404, 36, 8); ctx.fill();
    for (let x = 8004, i = 0; x < 8400; x += 26, i++) { ctx.fillStyle = i % 2 ? '#8e44ad' : '#b07cc6'; ctx.fillRect(x, rt + 4, 13, 24); }
    ctx.fillStyle = '#6c3483'; ctx.fillRect(8000, rt + 28, 404, 8);
    for (let x = 8012, i = 0; x < 8400; x += 20, i++) { const on = k > 0.2 ? (Math.floor(t * 3 + i) % 3 !== 0) : i % 2 === 0; this.bulb(ctx, x, rt + 32, '#ffe14d', on); }
    if (k > 0.2) for (const x of P.POSTS) this.glow(ctx, x, rt + 50, 50, '255,230,140', k);
  },
  drawArch(r, g) {
    const ctx = r.ctx, P = CFG.PIERPARK, A = P.ARCH, k = this.dusk(), t = g.time;
    const xl = A.x - A.half, xr = A.x + A.half, top = A.y - 150, PF = P.PLATFORM;
    // the low fence along the platform's edge, either side of the gate
    const fence = (x0, x1) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, P.FENCE_Y - 22, x1 - x0, 4); ctx.fillRect(x0, P.FENCE_Y - 12, x1 - x0, 4);
      for (let x = x0 + 2; x < x1; x += 16) { ctx.fillStyle = '#8e44ad'; ctx.fillRect(x, P.FENCE_Y - 26, 5, 28); }
    };
    fence(PF.x0, xl - 12); fence(xr + 12, PF.x1);
    // the pillars: red and white like a barber's pole, with gold caps
    for (const x of [xl, xr]) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 4, A.y + 2, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 10, top + 20, 20, A.y - top - 20);
      ctx.save(); ctx.beginPath(); ctx.rect(x - 10, top + 20, 20, A.y - top - 20); ctx.clip();
      ctx.fillStyle = '#e4572e'; for (let yy = top; yy < A.y + 20; yy += 24) { ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.lineTo(x + 10, yy - 12); ctx.lineTo(x + 10, yy - 2); ctx.lineTo(x - 10, yy + 10); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#ffcf4d'; ctx.fillRect(x - 14, A.y - 8, 28, 8); ctx.fillRect(x - 13, top + 14, 26, 8);
      ctx.beginPath(); ctx.arc(x, top + 10, 9, 0, Math.PI * 2); ctx.fill();
    }
    // the arch with bulbs and the big sign
    ctx.strokeStyle = '#ffcf4d'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(xl, top + 20); ctx.quadraticCurveTo(A.x, top - 50, xr, top + 20); ctx.stroke();
    for (let i = 0; i <= 14; i++) { const u = i / 14, bx = (1 - u) * (1 - u) * xl + 2 * u * (1 - u) * A.x + u * u * xr, by = (1 - u) * (1 - u) * (top + 20) + 2 * u * (1 - u) * (top - 50) + u * u * (top + 20); this.bulb(ctx, bx, by, ['#ff5252', '#ffe14d', '#5ec8f2'][i % 3], k > 0.2 ? Math.floor(t * 4 + i) % 2 === 0 : true); }
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, A.x - 104, top + 2, 208, 40, 12); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; U.roundRect(ctx, A.x - 104, top + 2, 208, 40, 12); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 PIZZA PIER 🎡', A.x, top + 23);
    // a big pizza on top of the arch
    r.drawPizza(A.x, top - 22, 16);
    if (k > 0.2) this.glow(ctx, A.x, top + 22, 120, '255,200,120', k * 0.7);
  },
  drawStand(r, g, s) {
    const ctx = r.ctx, P = CFG.PIERPARK, y = P.STAND_Y, hw = P.STAND_W / 2, x = s.x, k = this.dusk();
    // the back wall and the vendor behind the counter
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - hw + 4, y - 2, P.STAND_W, 6);
    ctx.fillStyle = s.body; ctx.fillRect(x - hw, y - 92, P.STAND_W, 70);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(x - hw, y - 92, P.STAND_W, 8);
    const look = { shirt: '#ffffff', skin: s.key === 'candy' ? '#c68642' : s.key === 'lemon' ? '#8d5524' : '#f1c27d', hat: 'cap', capColor: s.awn, facing: 1, moving: false, pants: '#2d3a4a', apron: s.awn };
    r.drawPerson(x - 8, y - 18, look);
    // the counter, with the treat in a big pile on top
    ctx.fillStyle = s.awn; ctx.fillRect(x - hw, y - 32, P.STAND_W, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < P.STAND_W; i += 12) ctx.fillRect(x - hw + i, y - 32, 6, 32);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw - 4, y - 36, P.STAND_W + 8, 6);
    if (s.key === 'candy') { for (const [dx, c] of [[-28, '#ff9ccc'], [14, '#9fd8ff'], [27, '#ff9ccc']]) { ctx.fillStyle = '#f2e6c9'; ctx.fillRect(x + dx - 1, y - 52, 2, 16); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx, y - 56, 8, 0, Math.PI * 2); ctx.fill(); } }
    else if (s.key === 'pizza') { r.drawPizza(x + 18, y - 42, 12); ctx.fillStyle = '#e8a94e'; ctx.beginPath(); ctx.moveTo(x - 28, y - 46); ctx.lineTo(x - 12, y - 46); ctx.lineTo(x - 20, y - 38); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.8)'; U.roundRect(ctx, x + 6, y - 64, 24, 28, 4); ctx.fill(); ctx.fillStyle = '#ffe14d'; ctx.fillRect(x + 8, y - 54, 20, 16); ctx.fillStyle = '#7bd88f'; ctx.beginPath(); ctx.arc(x - 22, y - 42, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(x - 12, y - 42, 5, 0, Math.PI * 2); ctx.fill(); }
    // the striped awning on two poles, scalloped
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw - 2, y - 104, 4, 72); ctx.fillRect(x + hw - 2, y - 104, 4, 72);
    const ay = y - 112;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw - 8, ay, P.STAND_W + 16, 20);
    ctx.fillStyle = s.awn; for (let i = 0; i < P.STAND_W + 16; i += 16) ctx.fillRect(x - hw - 8 + i, ay, 8, 20);
    for (let i = 0; i < P.STAND_W + 16; i += 16) { ctx.fillStyle = (i / 16) % 2 ? '#ffffff' : s.awn; ctx.beginPath(); ctx.arc(x - hw - 0 + i, ay + 20, 8, 0, Math.PI); ctx.fill(); }
    // the sign on top
    ctx.font = r.font(11); const tw = Math.max(ctx.measureText(s.name).width + 34, 60);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, x - tw / 2, ay - 26, tw, 24, 8); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.ico + ' ' + s.name, x, ay - 13);
    if (k > 0.2) this.glow(ctx, x, y - 50, 70, '255,225,150', k * 0.8);
  },
  drawRailing(r, g) {
    const ctx = r.ctx, P = CFG.PIERPARK, y = P.RAIL_Y, k = this.dusk(), t = g.time;
    const x0 = Math.max(8000, r.camX - 60), x1 = Math.min(10400, r.camX + r.viewW + 60);
    const inGap = (x) => P.STAIRS.some((sx) => Math.abs(x - sx) < P.STAIR_HALF);
    // posts, two white rails, gaps at the stairs (with little gate posts and a sign for the beach)
    for (let x = Math.floor(x0 / 32) * 32; x < x1; x += 32) {
      if (inGap(x) || inGap(x + 32)) continue;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y - 30, 32, 4); ctx.fillRect(x, y - 16, 32, 4);
      ctx.fillStyle = '#5ec8f2'; ctx.fillRect(x - 3, y - 34, 6, 38);
    }
    for (const sx of P.STAIRS) {
      if (sx < x0 - 60 || sx > x1 + 60) continue;
      for (const d of [-1, 1]) { const px = sx + d * P.STAIR_HALF; ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 5, y - 40, 10, 44); ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.arc(px, y - 42, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - P.STAIR_HALF + 20, y + 3, 4, 26);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, sx - P.STAIR_HALF + 4, y + 2, 36, 18, 5); ctx.fill();
      ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏖️', sx - P.STAIR_HALF + 22, y + 11);
    }
    // the lamp posts, with bunting strung between them
    const L = P.LAMPS, cols = ['#ff5252', '#ffd23f', '#3b7dd8', '#2f9e44', '#ff7eb6', '#8e44ad'];
    for (let i = 0; i < L.length - 1; i++) {
      const a = L[i], b = L[i + 1]; if (b < x0 - 40 || a > x1 + 40) continue;
      const ya = y - 106, sag = 26;
      ctx.strokeStyle = 'rgba(80,60,40,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a, ya); ctx.quadraticCurveTo((a + b) / 2, ya + sag * 2, b, ya); ctx.stroke();
      const n = Math.round((b - a) / 26);
      for (let j = 1; j < n; j++) {
        const u = j / n, fx = a + (b - a) * u, fy = ya + sag * 2 * 2 * u * (1 - u) * 1, sw = Math.sin(t * 2 + j + i) * 1.5;
        ctx.fillStyle = cols[(j + i) % cols.length]; ctx.beginPath(); ctx.moveTo(fx - 7, fy); ctx.lineTo(fx + 7, fy); ctx.lineTo(fx + sw, fy + 15); ctx.closePath(); ctx.fill();
      }
    }
    for (const lx of L) {
      if (lx < x0 - 40 || lx > x1 + 40) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(lx + 4, y + 2, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d5a4a'; ctx.fillRect(lx - 4, y - 112, 8, 114); ctx.fillRect(lx - 9, y - 6, 18, 8);
      ctx.fillRect(lx - 18, y - 116, 36, 5);
      for (const d of [-1, 1]) {
        const bx = lx + d * 16;
        ctx.fillStyle = '#2d5a4a'; ctx.fillRect(bx - 6, y - 112, 12, 4);
        ctx.fillStyle = k > 0.2 ? '#fff4b8' : '#fffbe8'; ctx.beginPath(); ctx.arc(bx, y - 103, 7, 0, Math.PI * 2); ctx.fill();
        if (k > 0.2) this.glow(ctx, bx, y - 103, 46, '255,230,140', k);
      }
      ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.arc(lx, y - 122, 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawBench(r, g, b, i) {
    const ctx = r.ctx, x = b[0], y = CFG.PIERPARK.RAIL_Y - 14;
    // people sitting with their backs to the sea, watching the park
    const sit = [[x - 18, { shirt: '#3b7dd8', hair: '#c0c0c0', hairStyle: 0, skin: '#f1c27d', pants: '#4a4a4a' }], [x + 18, { shirt: '#ff7eb6', hair: '#c0c0c0', hairStyle: 3, skin: '#f1c27d', pants: '#4a4a4a' }]];
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 40, y + 2, 84, 6);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(x - 36, y - 6, 4, 10); ctx.fillRect(x + 32, y - 6, 4, 10);
    if (b[2] > 0) for (let k = 0; k < Math.min(2, b[2]); k++) { const [sx, lk] = sit[k]; this.drawSeated(r, sx, y + 2, Object.assign({ facing: k ? -1 : 1, moving: false }, lk), 12); }
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 40, y - 14, 80, 7);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 40, y - 34, 80, 5); ctx.fillRect(x - 40, y - 26, 80, 5);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(x - 38, y - 36, 4, 30); ctx.fillRect(x + 34, y - 36, 4, 30);
  },
  drawUmbrella(r, u) {
    const ctx = r.ctx, [x, y, col] = u, top = y - 92;
    ctx.fillStyle = 'rgba(150,110,50,0.25)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 2, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(x - 2, top, 4, y - top);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 48, top + 22); ctx.quadraticCurveTo(x, top - 26, x + 48, top + 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [a, b] of [[-0.62, -0.31], [0.0, 0.31]]) { ctx.beginPath(); ctx.moveTo(x, top - 2); ctx.lineTo(x + 48 * Math.sin(a * 2.4), top + 22); ctx.lineTo(x + 48 * Math.sin(b * 2.4), top + 22); ctx.closePath(); ctx.fill(); }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : col; ctx.beginPath(); ctx.arc(x - 40 + i * 16, top + 22, 8, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, top - 4, 4, 0, Math.PI * 2); ctx.fill();
  },
  drawCastle(r, g) {
    const ctx = r.ctx, C = CFG.PIERPARK.CASTLE, x = C.x, y = C.y;
    ctx.fillStyle = 'rgba(150,110,50,0.25)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 4, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
    const sand = '#e8c27a', dark = '#d1a65c';
    ctx.fillStyle = sand; ctx.fillRect(x - 34, y - 26, 68, 30);
    for (const tx of [-28, 28]) { ctx.fillStyle = sand; ctx.fillRect(x + tx - 10, y - 50, 20, 52); ctx.fillStyle = dark; for (let k = 0; k < 3; k++) ctx.fillRect(x + tx - 10 + k * 8, y - 56, 5, 7); }
    ctx.fillStyle = sand; ctx.fillRect(x - 12, y - 64, 24, 40); ctx.fillStyle = dark; for (let k = 0; k < 3; k++) ctx.fillRect(x - 12 + k * 9, y - 70, 6, 7);
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(x, y + 4, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 34, y - 26, 68, 3);
    // a flag on the top
    ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x, y - 92); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x, y - 92); ctx.lineTo(x + 14 + Math.sin(g.time * 4) * 2, y - 87); ctx.lineTo(x, y - 82); ctx.closePath(); ctx.fill();
    for (const [dx, c] of [[-20, '#ffb3c7'], [16, '#ffffff']]) this.paintShell(ctx, x + dx, y - 14, c === '#ffffff' ? 2 : 0);
  },

  // ---- the Ferris wheel
  drawWheel(r, g) {
    const ctx = r.ctx, Wh = CFG.PIERPARK.WHEEL, st = this.st, A = st.wheelA, k = this.dusk(), t = g.time;
    const cx = Wh.x, cy = Wh.y, R = Wh.R;
    // the back legs
    ctx.strokeStyle = '#c8ced6'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 96, Wh.base - 4); ctx.lineTo(cx, cy); ctx.lineTo(cx + 96, Wh.base - 4); ctx.stroke();
    // the rim: two rings joined by spokes and cross-braces
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    for (let i = 0; i < Wh.N * 2; i++) { const a = A + i * Math.PI / Wh.N; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffcf4d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R - 18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < Wh.N * 2; i++) { const a = A + i * Math.PI / Wh.N, b = a + Math.PI / Wh.N; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - 18), cy + Math.sin(a) * (R - 18)); ctx.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.stroke(); }
    ctx.strokeStyle = '#5ec8f2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
    // lights round the rim: chasing colours (brighter, with a glow, at dusk)
    const cols = ['#ff5252', '#ffe14d', '#5ec8f2', '#7bd88f', '#ff7eb6'];
    for (let i = 0; i < 40; i++) {
      const a = A + i * Math.PI / 20, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, on = Math.floor(t * 4 - i) % 4 !== 0;
      this.bulb(ctx, x, y, cols[i % cols.length], on);
      if (k > 0.25 && on && i % 2 === 0) this.glow(ctx, x, y, 12, '255,230,150', k);
    }
    // the gondolas (the chef's own is drawn on top of everything, after the chef)
    const mine = st.ride && st.ride.phase !== 'off' ? st.ride.i : -1;
    for (let i = 0; i < Wh.N; i++) {
      if (i === mine) continue;
      const pv = this.pivot(i, A);
      this.drawGondola(r, g, pv.x, pv.y, i, Wh.VISITORS.includes(i) ? i : -1);
    }
    // the front legs and the hub
    ctx.strokeStyle = '#eef1f5'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(cx - 120, Wh.base + 2); ctx.lineTo(cx, cy); ctx.lineTo(cx + 120, Wh.base + 2); ctx.stroke();
    ctx.strokeStyle = '#c8ced6'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 76, cy + 140); ctx.lineTo(cx + 76, cy + 140); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    r.drawPizza(cx, cy, 10);
    if (k > 0.25) this.glow(ctx, cx, cy, 60, '255,210,140', k * 0.8);
    // the boarding gate: a little arch with a sign
    const gx = Wh.BOARD.x, gy = Wh.base + 22;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(gx - 40, gy - 30, 5, 32); ctx.fillRect(gx + 35, gy - 30, 5, 32);
    ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.arc(gx - 37.5, gy - 32, 5, 0, Math.PI * 2); ctx.arc(gx + 37.5, gy - 32, 5, 0, Math.PI * 2); ctx.fill();
    const sx = gx - 150, sy = gy;
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(sx - 3, sy - 60, 6, 62);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, sx - 50, sy - 84, 100, 26, 8); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; U.roundRect(ctx, sx - 50, sy - 84, 100, 26, 8); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎡 GO ROUND!', sx, sy - 70);
  },
  gondolaColor(i) { return ['#e4572e', '#3b7dd8', '#ffcf4d', '#2f9e44', '#ff7eb6', '#8e44ad', '#4ecdc4', '#ff8c1a', '#5ec8f2', '#7bd88f'][i % 10]; },
  drawGondolaBack(ctx, x, y, col) {
    ctx.strokeStyle = '#6a7380'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x - 24, y + 16, 48, 44);   // the seat back, seen through
    ctx.fillStyle = col; ctx.fillRect(x - 24, y + 16, 4, 44); ctx.fillRect(x + 20, y + 16, 4, 44);
    // the canopy
    ctx.beginPath(); ctx.moveTo(x - 30, y + 20); ctx.quadraticCurveTo(x, y - 4, x + 30, y + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 22 + k * 15, y + 20, 5, 0, Math.PI); ctx.fill(); }
  },
  drawGondolaFront(ctx, x, y, col) {
    ctx.fillStyle = col; U.roundRect(ctx, x - 27, y + 56, 54, 32, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - 27, y + 64, 54, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 22, y + 80, 44, 4);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y + 76, 5, 0, Math.PI * 2); ctx.fill();
  },
  drawGondola(r, g, x, y, i, visitor) {
    const ctx = r.ctx, col = this.gondolaColor(i);
    this.drawGondolaBack(ctx, x, y, col);
    if (visitor >= 0) {
      const lk = Object.assign({}, this.st.walkers[visitor % this.st.walkers.length].look, { facing: i % 2 ? -1 : 1, moving: false, balloon: null });
      r.drawPerson(x + (i % 2 ? 8 : -8), y + 84, lk);
      if (i === 4) r.drawPerson(x - 10, y + 84, Object.assign({}, this.st.walkers[2].look, { facing: 1, moving: false }));
    }
    this.drawGondolaFront(ctx, x, y, col);
  },
  // the chef sitting in their gondola (k: how far they have stepped in, while boarding)
  drawChefGondola(r, g, k) {
    const st = this.st, rd = st.ride, p = g.player, pv = this.pivot(rd.i, st.wheelA), col = this.gondolaColor(rd.i), ctx = r.ctx;
    this.drawGondolaBack(ctx, pv.x, pv.y, col);
    r.drawPlayer(g);
    if (st.treat) this.drawTreat(r, g, p.x, p.y, p.facing || 1, 0);
    this.drawGondolaFront(ctx, pv.x, pv.y, col);
    if (k < 1) return;
    // a little flag waving on the chef's gondola
    ctx.strokeStyle = '#6a7380'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pv.x + 24, pv.y + 12); ctx.lineTo(pv.x + 24, pv.y - 12); ctx.stroke();
    ctx.fillStyle = '#ffcf4d'; ctx.beginPath(); ctx.moveTo(pv.x + 24, pv.y - 12); ctx.lineTo(pv.x + 40 + Math.sin(g.time * 6) * 2, pv.y - 7); ctx.lineTo(pv.x + 24, pv.y - 2); ctx.closePath(); ctx.fill();
  },

  // ---- the building site
  drawTower(r, g) {
    const ctx = r.ctx, B = CFG.PIERPARK.BUILD, s = this.save(g), x = B.TOWER.x, y = B.TOWER.y, hw = B.HALF, st = this.st, t = g.time;
    const n = s.built, top = y - n * B.SEG;
    // the lattice segments, red and yellow
    for (let i = 0; i < n; i++) {
      const y1 = y - i * B.SEG, y0 = y1 - B.SEG, col = i % 2 ? '#ffcf4d' : '#e4572e';
      ctx.fillStyle = col; ctx.fillRect(x - hw, y0, 6, B.SEG); ctx.fillRect(x + hw - 6, y0, 6, B.SEG); ctx.fillRect(x - hw, y0, hw * 2, 4);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - hw + 4, y1); ctx.lineTo(x + hw - 4, y0 + 2); ctx.moveTo(x + hw - 4, y1); ctx.lineTo(x - hw + 4, y0 + 2); ctx.stroke();
    }
    // the ride's car: a ring of seats round the tower's foot (it zooms up and drops in a test run)
    let lift = 0;
    if (st.show) {
      const tt = st.show.t, H = n * B.SEG - 40;
      lift = tt < 0.4 ? 0 : tt < 2.0 ? H * this.ease((tt - 0.4) / 1.6) : tt < 2.4 ? H : tt < 2.75 ? H * (1 - Math.pow((tt - 2.4) / 0.35, 2)) : Math.abs(Math.sin((tt - 2.75) * 9)) * 14 * Math.max(0, 1 - (tt - 2.75) / 1.2);
    }
    const cy = y - 6 - lift;
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - hw - 18, cy - 22, hw * 2 + 36, 22, 6); ctx.fill();
    ctx.fillStyle = '#5ec8f2'; for (let k = 0; k < 5; k++) { U.roundRect(ctx, x - hw - 14 + k * 17, cy - 40, 13, 20, 4); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - hw - 18, cy - 14, hw * 2 + 36, 3);
    // scaffolding round the lower part: wooden poles and planks
    const sh = Math.min(n, 4) * B.SEG + 10;
    ctx.fillStyle = '#b07a45';
    for (const dx of [-hw - 30, -hw - 10, hw + 10, hw + 30]) ctx.fillRect(x + dx - 2, y - sh, 4, sh);
    for (let k = 1; k * 2 * B.SEG <= sh; k++) { const py = y - k * 2 * B.SEG; ctx.fillStyle = '#c99a63'; ctx.fillRect(x - hw - 34, py, 28, 5); ctx.fillRect(x + hw + 6, py, 28, 5); }
    // on top: the finished crown with a giant slice of pizza and the name, or a worker's flag on the half-built top
    if (n >= B.MAX) {
      ctx.fillStyle = '#8e44ad'; U.roundRect(ctx, x - hw - 8, top - 18, hw * 2 + 16, 18, 6); ctx.fill();
      ctx.fillStyle = '#e8a94e'; ctx.beginPath(); ctx.moveTo(x - 28, top - 60); ctx.lineTo(x + 28, top - 60); ctx.lineTo(x, top - 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.moveTo(x - 22, top - 56); ctx.lineTo(x + 22, top - 56); ctx.lineTo(x, top - 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b'; for (const [dx, dy] of [[-8, -48], [6, -46], [0, -34]]) { ctx.beginPath(); ctx.arc(x + dx, top + dy, 3.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, x - 30, top - 64, 60, 8, 4); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA DROP', x, top - 9);
      const k = this.dusk(); for (let i = 0; i < 6; i++) this.bulb(ctx, x - hw - 4 + i * (hw * 2 + 8) / 5, top - 18, ['#ff5252', '#ffe14d', '#5ec8f2'][i % 3], Math.floor(t * 3 + i) % 2 === 0 || k < 0.2);
    } else {
      ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + hw - 4, top); ctx.lineTo(x + hw - 4, top - 26); ctx.stroke();
      ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.moveTo(x + hw - 4, top - 26); ctx.lineTo(x + hw + 12 + Math.sin(t * 5) * 2, top - 21); ctx.lineTo(x + hw - 4, top - 16); ctx.closePath(); ctx.fill();
    }
  },
  drawCrane(r, g) {
    const ctx = r.ctx, B = CFG.PIERPARK.BUILD, C = B.CRANE, s = this.save(g), st = this.st, t = g.time;
    const top = C.top, mx = C.x;
    // the mast: a yellow lattice
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(mx - 18, C.y - 4, 40, 8);
    ctx.fillStyle = '#ffc107'; ctx.fillRect(mx - 12, top, 4, C.y - top); ctx.fillRect(mx + 8, top, 4, C.y - top);
    ctx.strokeStyle = '#ffc107'; ctx.lineWidth = 2; ctx.beginPath();
    for (let y = C.y; y > top + 12; y -= 20) { ctx.moveTo(mx - 10, y); ctx.lineTo(mx + 10, y - 20); ctx.moveTo(mx - 10, y - 20); ctx.lineTo(mx + 10, y - 20); }
    ctx.stroke();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(mx - 20, C.y - 10, 40, 12);
    // the jib along the top, the counterweight, the cab
    ctx.fillStyle = '#ffc107'; ctx.fillRect(C.jib0, top - 2, C.jib1 - C.jib0, 5); ctx.fillRect(C.jib0, top + 10, mx - C.jib0, 3);
    ctx.strokeStyle = '#ffc107'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = C.jib0; x < mx; x += 16) { ctx.moveTo(x, top + 11); ctx.lineTo(x + 8, top); ctx.lineTo(x + 16, top + 11); } ctx.stroke();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx, top - 30); ctx.lineTo(C.jib0 + 40, top); ctx.moveTo(mx, top - 30); ctx.lineTo(C.jib1, top); ctx.stroke();
    ctx.fillStyle = '#ffc107'; ctx.fillRect(mx - 3, top - 32, 6, 32);
    ctx.fillStyle = '#8a8f99'; ctx.fillRect(C.jib1 - 34, top + 2, 30, 18);
    ctx.fillStyle = '#ff8c1a'; U.roundRect(ctx, mx - 16, top + 4, 26, 22, 4); ctx.fill(); ctx.fillStyle = '#cfe9ff'; ctx.fillRect(mx - 12, top + 8, 12, 10);
    // the trolley over the tower, the cable and the hook with the next piece hanging on it
    const tx = B.TOWER.x, towerTop = B.TOWER.y - s.built * B.SEG;
    let hookY = towerTop - 64, sway = Math.sin(t * 1.3) * 3, piece = s.built < B.MAX;
    if (st.piece) { const k = this.ease(st.piece.t / B.LOWER_T); hookY = U.lerp(towerTop - 64, towerTop - B.SEG - 12, k); sway *= 1 - k; }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(tx - 8, top + 1, 16, 7);
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx, top + 8); ctx.lineTo(tx + sway, hookY); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(tx + sway - 5, hookY, 10, 6);
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx + sway, hookY + 9, 4, 0, Math.PI); ctx.stroke();
    if (piece) {
      const px = tx + sway, py = hookY + 12, col = s.built % 2 ? '#ffcf4d' : '#e4572e', hw = B.HALF;
      ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - hw + 3, py + 8); ctx.moveTo(px, py); ctx.lineTo(px + hw - 3, py + 8); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(px - hw, py + 8, 6, B.SEG); ctx.fillRect(px + hw - 6, py + 8, 6, B.SEG); ctx.fillRect(px - hw, py + 8, hw * 2, 4);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - hw + 4, py + 8 + B.SEG); ctx.lineTo(px + hw - 4, py + 10); ctx.moveTo(px + hw - 4, py + 8 + B.SEG); ctx.lineTo(px - hw + 4, py + 10); ctx.stroke();
    }
  },
  drawMixer(r, g) {
    const ctx = r.ctx, M = CFG.PIERPARK.BUILD.MIXER, x = M.x, y = M.y, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 56, y - 2, 118, 8);
    ctx.fillStyle = '#2b2f36'; for (const wx of [x - 38, x - 14, x + 38]) { ctx.beginPath(); ctx.arc(wx, y - 4, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8a8f99'; ctx.beginPath(); ctx.arc(wx, y - 4, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b2f36'; }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 54, y - 18, 100, 8);
    // the cab
    ctx.fillStyle = '#ffc107'; U.roundRect(ctx, x + 22, y - 54, 34, 40, 6); ctx.fill();
    ctx.fillStyle = '#cfe9ff'; ctx.fillRect(x + 32, y - 48, 18, 14);
    // the drum, turning (its stripes slide round)
    ctx.save(); ctx.translate(x - 16, y - 40); ctx.rotate(-0.18);
    ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.ellipse(0, 0, 38, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 38, 22, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#ffffff'; const off = (t * 30) % 24; for (let k = -60; k < 60; k += 24) { ctx.beginPath(); ctx.moveTo(k + off, -24); ctx.lineTo(k + off + 10, -24); ctx.lineTo(k + off - 2, 24); ctx.lineTo(k + off - 12, 24); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.ellipse(-36, 0, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawPile(r) {
    const ctx = r.ctx, P = CFG.PIERPARK.BUILD.PILE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(P.x - 32, P.y - 2, 66, 6);
    ctx.fillStyle = '#c99a63'; ctx.fillRect(P.x - 34, P.y - 8, 68, 8);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#ffcf4d' : '#e4572e'; ctx.fillRect(P.x - 30 + (k % 2) * 4, P.y - 14 - k * 6, 60, 6); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let j = 0; j < 5; j++) ctx.fillRect(P.x - 26 + j * 12 + (k % 2) * 4, P.y - 13 - k * 6, 4, 4); }
  },
  drawSign(r) {
    const ctx = r.ctx, S = CFG.PIERPARK.BUILD.SIGN, x = S.x, y = S.y;
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(x - 40, y - 46, 5, 48); ctx.fillRect(x + 35, y - 46, 5, 48);
    ctx.fillStyle = '#ffc107'; U.roundRect(ctx, x - 64, y - 92, 128, 50, 8); ctx.fill();
    ctx.save(); ctx.beginPath(); U.roundRect(ctx, x - 64, y - 92, 128, 50, 8); ctx.clip();
    ctx.fillStyle = '#2b1d14'; for (let k = -70; k < 70; k += 20) { ctx.beginPath(); ctx.moveTo(x + k, y - 50); ctx.lineTo(x + k + 10, y - 50); ctx.lineTo(x + k + 18, y - 42); ctx.lineTo(x + k + 8, y - 42); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COMING SOON 🚧', x, y - 74);
    ctx.font = r.font(10); ctx.fillText('THE PIZZA DROP', x, y - 59);
  },
  drawCone(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 9, y - 1, 20, 4);
    ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 2, y - 22); ctx.lineTo(x + 2, y - 22); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 5, y - 12, 10, 4);
    ctx.fillStyle = '#e06d00'; ctx.fillRect(x - 10, y - 2, 20, 3);
  },
};
Game.ext.unshift(PizzaPierExt);   // ahead of the outer maps: at the pier its buttons and hints count
Render.ext.push(PizzaPierExt);
