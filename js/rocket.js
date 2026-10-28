'use strict';
// Rocket Island: the newest island, east of Starfish Cove over a rope bridge. A big launch pad holds a tall pizza
// rocket that is built over three visits: scaffolding with ladders, a crane swinging panels (then the nose cone) up
// to the top, welders throwing sparks, a fuel truck with its hose, and a mission-control hut with blinking screens
// (its inside lives in js/islands-inside.js). Little workers in hard hats carry parts, climb, weld and wave.
//
// Visits: every time the chef comes back onto Rocket Island's land after being away (off the island, or on another
// map; mission control's inside counts as still being there) `g.s.rocket.visits` goes up by one.
//   1st visit: a bare frame in the scaffolding, a few panels.   2nd: most panels on, the crane lifting the nose cone.
//   3rd visit: finished and painted, the scaffold's arms swing away, the crane turns aside, the workers cheer and the
//   sign reads "READY FOR LAUNCH!". Standing at the rocket's door then offers '🚀 Blast off!': the chef climbs in,
//   3-2-1 with smoke and flames, the rocket lifts off the pad and leaves the screen, and the 'rocket' cut-scene flies
//   to Pizza Moon (js/moon.js). Flying home plays it backwards and the rocket lands back on its pad.
// The launch, the landing, the smoke and the cut-scene live here and work on any map (the moon uses them too).
//
// Rocket #2: east of the pad the island goes on to a fenced lot ("COMING SOON: ROCKET #2"). Once the first rocket is
// finished (stage 2) a second launch pad opens there with a half-built rocket that stays half-built for ever: a second
// crane lifting panels, a tool shed, stacks of panels, workers in hard hats (a carrier, welders throwing sparks, one
// hammering up top; they hop and show 👋 bubbles). Tall scaffolding stands round it: '🪜 Climb up' at the ladder's foot
// takes the chef up to a walkway in front of the rocket (level 1), a second ladder leads to a higher, narrower one (level
// 2) beside the rocket's open hatch: '👀 Peek inside' shows the half-built cabin with its wires and a worker waving.
// While the chef is up there `obstaclesOverride` leaves only the walkway's edges as walls, so nobody falls off, and the
// chef is drawn over the scaffold art. '🪜 Climb down' from each level. `g.s.rocket.up` remembers a save made up there:
// the reload puts the chef back on the ground at the ladder's foot.
// Reads its spots from CFG.ISLANDS.ROCKET (js/islands.js, loaded first).
// Extension module: registered with Game.ext (first, so its button and hint beat the islands' own) and Render.ext.

CFG.ROCKETISLE = {
  LINES: ['Almost ready!', 'Blast-off soon!', 'Pass the bolts!', 'More pizza fuel! 🍕', 'Just one more panel!', 'Coming soon!'],
  ASK_R: 50,           // stand this close to the ask spot (the rocket's door)
  HINT_R: 200,         // "A real rocket!" within this of the rocket
  WAVE_R: 110,         // workers wave when the chef walks this close
  CRANE_PERIOD: 16,    // seconds for the crane to fetch a panel, lift it to the top and come back
  ROCKET_H: 260,       // the rocket's height, feet to nose
  VISITS: 3,           // visits until it is ready to fly
  ANSWERS: ['2 more visits!', '1 more visit!'],
  GREET: ["We're building a rocket! Come back soon!", 'We made progress! Come back soon!', "It's ready! Hop in!"],
  CHEER: [{ x: 4062, y: 2862 }, { x: 4112, y: 2884 }, { x: 4256, y: 2878 }, { x: 4318, y: 2852 }, { x: 4116, y: 2712 }],
  // the launch: walk in, 3-2-1, lift off; the flight; the landing
  BOARD: 0.6, MARKS: [0.9, 1.7, 2.5, 3.3], LIFTOFF: 3.3, FLIGHT: 8, LAND: 2.8, LAND_H: 900,
  // Rocket #2 (spots in CFG.ISLANDS.ROCKET.SITE2): its height, the two scaffold walkways (height above the ground and
  // half-width), how close the ladders and the hatch answer, the crane's round trip, the climb's speed, the peek's length
  SITE2: { H: 300, DECKS: [{ z: 70, half: 100 }, { z: 150, half: 66 }], LADDER_R: 34, HINT_R: 70, HATCH_R: 40, CRANE_PERIOD: 13, CLIMB_SPEED: 210, PEEK: 5 },
};

const RocketExt = {
  name: 'rocket',
  defaults: { rocket: { visits: 0, up: 0 } },
  st: null,   // runtime only: workers, the crane's clock, sparks, bubbles, the countdown, a launch or landing, smoke

  // ---------- state ----------
  build(g) {
    if (!g.s.rocket) g.s.rocket = { visits: 0, up: 0 };
    if (!(g.s.rocket.visits >= 0)) g.s.rocket.visits = 0;
    const R = CFG.ISLANDS.ROCKET, B = R.BASE, S = R.SCAFFOLD, P = R.PARTS;
    const W = (o) => Object.assign({ facing: 1, moving: false, bob: 0, z: 0, wave: 0, waveCd: 0, weld: 0, hop: 0 }, o);
    this.st = {
      workers: [
        // carries panels from the parts pile to the rocket and walks back for more
        W({ role: 'carry', x: P.x - 30, y: P.y - 26, path: [{ x: P.x - 34, y: P.y - 24 }, { x: B.x - 70, y: B.y + 44 }], leg: 1, pause: 0, carrying: true, hat: '#ffd166', shirt: '#ff8c42', skin: '#e0ac69' }),
        // climbs the scaffold ladder up and down, hammering at the top
        W({ role: 'climb', x: S.x1 - 4, y: S.y + 10, dir: 1, pause: 0, bang: 0, hat: '#ff8c42', shirt: '#ffd166', skin: '#8d5524' }),
        // welds high up on the scaffold, next to the rocket
        W({ role: 'weldHigh', x: S.x0 + 14, y: S.y + 2, z: S.h / 2, facing: -1, hat: '#ffffff', shirt: '#4dd0e1', skin: '#f1c27d' }),
        // welds a fin down on the pad
        W({ role: 'weldLow', x: B.x - 56, y: B.y + 18, facing: 1, hat: '#ffd166', shirt: '#41b883', skin: '#c68642' }),
        // the foreman with the clipboard walks round the pad
        W({ role: 'boss', x: 4076, y: 2830, path: [{ x: 4076, y: 2830 }, { x: 4076, y: 2668 }, { x: 4140, y: 2650 }, { x: 4320, y: 2650 }, { x: 4320, y: 2760 }, { x: 4140, y: 2650 }, { x: 4076, y: 2668 }], leg: 1, pause: 0, hat: '#e4572e', shirt: '#3b7dd8', skin: '#f1c27d' }),
      ],
      crane: 0, sparks: [], sparkT: 0,
      ask: null, askN: 0, count: null,
      obs: null,
      wasOn: false,                                // was the chef on Rocket Island's land last step (for counting visits)
      swing: this.stage(g) >= 2 ? 1 : 0,           // the scaffold's arms swinging away once it is finished (0..1)
      cheer: null, cheerT: 2,                      // a worker's cheering bubble once it is finished
      fly: null,                                   // a launch or a landing in progress (on any map)
      smoke: [], puff: null,                       // smoke particles, and the big cloud on the pad
      up: 0, climb: null, peek: null,              // Rocket #2's scaffold: which walkway the chef is on, a climb in progress, the hatch view
      s2: this.buildSite2(),                       // Rocket #2's workers, crane and sparks
    };
    this.st.wasOn = this.onRocketLand(g) || g.area === 'missionctl';   // reloading on the island is not a new visit
    const C = R.CRANE, M = R.MISSION, T = R.TRUCK, SG = R.SIGN;
    this.st.obs = [
      { x: B.x - 30, y: B.y - 32, w: S.x1 - (B.x - 30), h: 38 },          // the rocket's feet and the scaffold's legs
      { x: C.x - 20, y: C.y - 18, w: 40, h: 36 },                          // the crane's base
      { x: T.x - 48, y: T.y - 16, w: 96, h: 30 },                          // the fuel truck
      { x: M.x - M.w / 2, y: M.y - M.h / 2, w: M.w, h: M.h },              // mission control
      { x: SG.x - 98, y: SG.y - 6, w: 10, h: 10 }, { x: SG.x + 88, y: SG.y - 6, w: 10, h: 10 },   // the sign's posts
      { x: P.x - 34, y: P.y - 14, w: 68, h: 26 },                          // the pile of parts
    ];
    // east of the pad: the fenced lot while the first rocket is built, then Rocket #2's site
    const S2 = R.SITE2, L = S2.LOT, G = this.geo(), D1 = G.D[1], SH = S2.SHED, C2 = S2.CRANE, P2 = S2.PARTS, ST = S2.STACK;
    this.st.obsLot = this.st.obs.concat([{ x: L.x0, y: L.y0, w: L.x1 - L.x0, h: L.y1 - L.y0 }]);
    this.st.obsSite = this.st.obs.concat([
      { x: D1.x0 - 2, y: S2.PAD.y0 - 16, w: D1.x1 - D1.x0 + 4, h: G.B.y + 34 - (S2.PAD.y0 - 16) },   // the rocket and the scaffold's legs (and the pad behind them)
      { x: SH.x - SH.w / 2, y: SH.y - SH.h / 2, w: SH.w, h: SH.h },                                    // the tool shed
      { x: C2.x - 20, y: C2.y - 18, w: 40, h: 36 },                                                     // the crane's base
      { x: P2.x - 34, y: P2.y - 14, w: 68, h: 26 },                                                     // the panels for the crane
      { x: ST.x - 34, y: ST.y - 12, w: 68, h: 24 },                                                     // the panels for the carrier
    ]);
    // a save made up on the scaffold reloads on the ground at the ladder's foot
    if (g.s.rocket.up) { if (g.area === 'islands') { g.player.x = G.L1.foot.x; g.player.y = G.L1.foot.y; g.player.moving = false; } g.s.rocket.up = 0; }
  },
  buildSite2() {
    const S2 = CFG.ISLANDS.ROCKET.SITE2, G = this.geo(), B = G.B, ST = S2.STACK;
    const W = (o) => Object.assign({ facing: 1, moving: false, bob: 0, z: 0, wave: 0, waveCd: 0, weld: 0, hop: 0, deck: 0, bang: 0, pause: 0, ph: 0 }, o);
    return {
      workers: [
        // carries panels from the stack to the scaffold's foot and walks back for more
        W({ role: 'carry', x: ST.x - 30, y: ST.y - 24, path: [{ x: ST.x - 30, y: ST.y - 24 }, { x: B.x + 34, y: B.y + 50 }], leg: 1, carrying: true, hat: '#ff8c42', shirt: '#3b7dd8', skin: '#f1c27d' }),
        // welds a fin down on the pad
        W({ role: 'weldLow', x: B.x + 70, y: B.y + 46, facing: -1, ph: 0.7, hat: '#ffd166', shirt: '#e4572e', skin: '#8d5524' }),
        // welds the rocket's side from the back of the first walkway (off the chef's way)
        W({ role: 'weldHigh', deck: 1, x: B.x - 58, y: G.D[1].yb + 6, facing: 1, ph: 2.1, hat: '#ffffff', shirt: '#41b883', skin: '#e0ac69' }),
        // hammers at the top, at the back of the second walkway
        W({ role: 'hammer', deck: 2, x: B.x - 46, y: G.D[2].yb + 6, facing: 1, hat: '#ffd166', shirt: '#ff8fab', skin: '#c68642' }),
      ],
      crane: 4, sparks: [], sparkT: 0,
    };
  },
  // Rocket #2's scaffold, worked out from its feet: the two walkways (z: height, x0..x1: the planks, yb/yf: the back
  // and front edges as drawn, walk: where the chef's feet may be), the two ladders (foot, top: where the chef stands
  // before and after the climb; x, y0, y1: the ladder as drawn), and the hatch spot on the top walkway
  geo() {
    if (this._geo) return this._geo;
    const B = CFG.ISLANDS.ROCKET.SITE2.BASE, K = CFG.ROCKETISLE.SITE2;
    const deck = (d) => { const x0 = B.x - d.half, x1 = B.x + d.half; return { z: d.z, x0, x1, yb: B.y - 22 - d.z, yf: B.y + 22 - d.z, walk: { x0: x0 + 14, x1: x1 - 14, y0: B.y - 6 - d.z, y1: B.y + 16 - d.z } }; };
    const D1 = deck(K.DECKS[0]), D2 = deck(K.DECKS[1]);
    this._geo = {
      B, D: [null, D1, D2],
      L1: { x: D1.x0 - 8, y0: B.y + 40, y1: D1.yf - 26, foot: { x: D1.x0 - 10, y: B.y + 56 }, top: { x: D1.walk.x0 + 8, y: D1.walk.y0 + 12 } },
      L2: { x: D2.x1 + 12, y0: D1.walk.y0 + 18, y1: D2.yf - 26, foot: { x: D2.x1 + 4, y: D1.walk.y0 + 12 }, top: { x: D2.walk.x1 - 6, y: D2.walk.y0 + 12 } },
      HATCH: { x: B.x, y: D2.walk.y0 },
    };
    return this._geo;
  },
  // 0: a bare frame, 1: most panels on and the nose cone on the crane, 2: finished and ready to fly
  stage(g) { const v = (g && g.s && g.s.rocket && g.s.rocket.visits) || 0; return U.clamp(v - 1, 0, 2); },
  ready(g) { return this.stage(g) >= 2; },
  canFly(g) { return this.ready(g) && !!CFG.AREAS.moon && typeof MoonExt !== 'undefined'; },
  site2On(g) { return this.stage(g) >= 2; },   // Rocket #2's site opens once the first rocket is finished
  island() { return CFG.ISLANDS.ISLANDS.find((q) => q.key === 'rocket'); },
  onRocketIsle(g) { const s = this.island(), p = g.player; return g.area === 'islands' && p.x > s.x0 && p.x < s.x1 && p.y > s.y0 && p.y < s.y1; },
  // properly on the island's sand (the jet ski nosing up to the beach does not count)
  onRocketLand(g) { const s = this.island(), p = g.player, m = 20; return g.area === 'islands' && p.x > s.x0 + m && p.x < s.x1 - m && p.y > s.y0 + m && p.y < s.y1 - m; },
  busy(g) { const C = typeof CityExt !== 'undefined' ? CityExt : null; return !!(C && ((C.st && (C.st.cab || C.st.boarding)) || C.floor)); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && !this.busy(g); },
  nearAsk(g) { const A = CFG.ISLANDS.ROCKET.ASK, p = g.player; return U.dist(p.x, p.y, A.x, A.y) < CFG.ROCKETISLE.ASK_R; },
  nearMissionDoor(g) { const M = CFG.ISLANDS.ROCKET.MISSION, p = g.player; return U.dist(p.x, p.y, M.x, M.y + M.h / 2 + 20) < 90; },
  groundWorkerNear(x, y) {
    let who = null, bd = Infinity;
    for (const w of this.st.workers) { if (w.z > 4) continue; const d = U.dist(x, y, w.x, w.y); if (d < bd) { bd = d; who = w; } }
    return who;
  },

  // ---------- visits ----------
  countVisit(g) {
    const st = this.st;
    if (g.travel || st.fly) return;
    if (g.area === 'missionctl') return;   // mission control's inside is still Rocket Island
    const on = this.onRocketLand(g);
    if (on && !st.wasOn) this.visit(g);
    st.wasOn = on;
  },
  visit(g) {
    const st = this.st, s = g.s.rocket, p = g.player, R = CFG.ISLANDS.ROCKET, H = CFG.ROCKETISLE.ROCKET_H;
    s.visits++;
    if (s.visits > CFG.ROCKETISLE.VISITS) return;   // long finished: nothing new to see
    const stage = this.stage(g), who = this.groundWorkerNear(p.x, p.y);
    st.ask = { t: 0, line: CFG.ROCKETISLE.GREET[stage], who, dur: 4.2 }; st.count = null;
    if (who) { who.facing = p.x < who.x ? -1 : 1; who.wave = 1.6; who.waveCd = 7; }
    if (stage === 0) g.toast('🚧 Come back later to see it grow!');   // the islands already welcome the chef here
    else if (stage === 1) g.toast('🚀 The rocket grew! Come back once more!', true);
    else {
      g.toast('🚀 The rocket is ready! Hop in!', true); st.swing = 0; st.cheerT = 1.5;
      const B2 = R.SITE2.BASE; g.floats.push({ x: B2.x, y: B2.y - 300, text: 'Rocket #2! 🚧', color: '#ffe08a', t: 0, dur: 2.2, big: true });
    }
    if (stage > 0) {
      for (let i = 0; i < 10; i++) g.fx.push({ kind: 'sparkle', x0: R.BASE.x + U.rand(-40, 40), y0: R.BASE.y - U.rand(20, H), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 });
      Sfx.chime(); Haptics.success();
    }
  },

  // ---------- game hooks ----------
  obstacles(g, forCar) { return g.area === 'islands' && this.st && !forCar ? (this.site2On(g) ? this.st.obsSite : this.st.obsLot) : []; },
  // up on the scaffold only the walkway's edges count (thick walls just outside it, their inner faces 12 px past the
  // walkable edge so the chef's body stays on the planks), like walking on a roof
  obstaclesOverride(g) {
    const st = this.st;
    if (!st || !st.up || st.climb || g.area !== 'islands') return null;
    const W = this.geo().D[st.up].walk, T = 80, r = 12;
    const x = W.x0 - r - T, y = W.y0 - r - T, w = W.x1 - W.x0 + 2 * r + 2 * T, h = W.y1 - W.y0 + 2 * r;
    return [{ x, y, w, h: T }, { x, y: W.y1 + r, w, h: T }, { x, y: W.y0 - r, w: T, h }, { x: W.x1 + r, y: W.y0 - r, w: T, h }];
  },
  nearLadder(g) { const F = this.geo().L1.foot, p = g.player; return U.dist(p.x, p.y, F.x, F.y) < CFG.ROCKETISLE.SITE2.LADDER_R; },
  nearHatch(g) { const H = this.geo().HATCH, p = g.player; return this.st.up === 2 && Math.abs(p.x - H.x) < CFG.ROCKETISLE.SITE2.HATCH_R; },
  onDeck(g, lv) { const W = this.geo().D[lv].walk, p = g.player, m = 30; return p.x > W.x0 - m && p.x < W.x1 + m && p.y > W.y0 - m && p.y < W.y1 + m; },
  action(g) {
    const st = this.st;
    if (!st || st.fly || g.area !== 'islands' || !this.onFoot(g)) return null;
    if (st.climb) return null;
    if (st.up) return this.deckAction(g);
    if (this.site2On(g) && this.nearLadder(g)) return { label: '🪜 Climb up', run: (gg) => this.climb(gg, 1) };
    if (!this.nearAsk(g)) return null;
    if (this.canFly(g)) return { label: '🚀 Blast off!', run: (gg) => this.startLaunch(gg, CFG.ISLANDS.ROCKET.BASE, 'moon') };
    return { label: '🚀 Ask about the rocket', run: (gg) => this.ask(gg) };
  },
  ask(g) {
    const st = this.st, p = g.player, stage = this.stage(g);
    // a cheery line, and above it how many more visits until it is finished
    const line = CFG.ROCKETISLE.LINES[st.askN % CFG.ROCKETISLE.LINES.length], more = stage < 2 ? CFG.ROCKETISLE.ANSWERS[stage] : 'Ready! 🚀';
    const who = this.groundWorkerNear(p.x, p.y);
    st.ask = { t: 0, line, more, who, dur: 3 };
    st.askN++;
    if (who) { who.facing = p.x < who.x ? -1 : 1; who.wave = 1.2; }
    st.count = { t: 0, n: 0 };
    Sfx.ding(); Haptics.tap();
  },
  // on a walkway: the next ladder up, a peek in the hatch at the top, otherwise back down a level
  deckAction(g) {
    const st = this.st, G = this.geo(), p = g.player;
    if (st.up === 1) {
      if (U.dist(p.x, p.y, G.L2.foot.x, G.L2.foot.y) < CFG.ROCKETISLE.SITE2.LADDER_R) return { label: '🪜 Climb up', run: (gg) => this.climb(gg, 2) };
      return { label: '🪜 Climb down', run: (gg) => this.climb(gg, 0) };
    }
    if (this.nearHatch(g)) return { label: '👀 Peek inside', run: (gg) => this.peek(gg) };
    return { label: '🪜 Climb down', run: (gg) => this.climb(gg, 1) };
  },
  // climb a ladder to walkway `to` (0 = the ground): along the ladder, then a step onto the planks (or the ground)
  climb(g, to) {
    const st = this.st, G = this.geo(), p = g.player, from = st.up, L = (to === 2 || from === 2) ? G.L2 : G.L1, up = to > from;
    const pts = up ? [{ x: p.x, y: p.y }, { x: L.x, y: p.y }, { x: L.x, y: L.top.y }, L.top]
      : [{ x: p.x, y: p.y }, L.top, { x: L.x, y: L.top.y }, { x: L.x, y: L.foot.y }, L.foot];
    const b = up ? L.top : L.foot;
    let len = 0; for (let i = 1; i < pts.length; i++) len += U.dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    st.climb = { pts, len: Math.max(1, len), d: 0, to, from };
    st.peek = null;
    g.s.rocket.up = Math.max(from, to);   // a save mid-climb still counts as up there
    p.moving = false; p.hasMoved = true; p.facing = b.x < p.x ? -1 : 1;
    if (up) Sfx.pickup(); else Sfx.drop();
    Haptics.tap();
  },
  updateClimb(g, dt) {
    const st = this.st, c = st.climb, p = g.player;
    c.d = Math.min(c.len, c.d + CFG.ROCKETISLE.SITE2.CLIMB_SPEED * dt);
    let left = c.d, i = 1;
    for (; i < c.pts.length - 1; i++) { const seg = U.dist(c.pts[i - 1].x, c.pts[i - 1].y, c.pts[i].x, c.pts[i].y); if (left <= seg) break; left -= seg; }
    const A = c.pts[i - 1], Bp = c.pts[i], seg = Math.max(1e-6, U.dist(A.x, A.y, Bp.x, Bp.y)), k = Math.min(1, left / seg);
    p.x = U.lerp(A.x, Bp.x, k); p.y = U.lerp(A.y, Bp.y, k); p.moving = true; p.bob += dt * 12;
    if (c.d < c.len) return;
    const end = c.pts[c.pts.length - 1];
    p.x = end.x; p.y = end.y; p.moving = false; st.climb = null; st.up = c.to; g.s.rocket.up = c.to;
    if (c.to === 1 && c.from === 0) g.floats.push({ x: p.x, y: p.y - 70, text: 'Up on the scaffold! 🪜', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    if (c.to === 2) { g.floats.push({ x: p.x - 30, y: p.y - 80, text: 'What a view! 🚀', color: '#ffe08a', t: 0, dur: 1.8, big: true }); Haptics.success(); }
  },
  // the peek through Rocket #2's open hatch (drawn full screen by `screen`)
  peek(g) {
    const st = this.st, H = this.geo().HATCH, p = g.player;
    st.peek = { t: 0 }; p.facing = H.x < p.x ? -1 : 1; p.moving = false;
    Sfx.chime(); Haptics.tap();
  },
  leaveScaffold(g) { const st = this.st; st.up = 0; st.climb = null; st.peek = null; if (g.s.rocket) g.s.rocket.up = 0; },
  home(g) {
    const st = this.st; if (!st) return;
    st.ask = null; st.count = null; st.sparks = []; st.fly = null; st.smoke = []; st.puff = null; st.cheer = null;
    st.wasOn = false;
    this.leaveScaffold(g); st.s2.sparks = [];
  },
  flyHint() {
    const f = this.st && this.st.fly; if (!f) return undefined;
    if (f.kind === 'land') return { text: 'Touchdown! 🚀', target: null };
    return { text: f.t < CFG.ROCKETISLE.LIFTOFF ? '3… 2… 1… 🚀' : 'Blast off! 🚀', target: null };
  },
  hint(g) {
    const st = this.st;
    if (!st || g.travel) return undefined;
    if (st.fly) return this.flyHint();
    if (g.area !== 'islands' || !this.onFoot(g)) return undefined;
    const s2 = this.scaffoldHint(g); if (s2 !== undefined) return s2;
    if (!this.onRocketIsle(g) || this.nearMissionDoor(g)) return undefined;
    if (g.player.carry > 0 && typeof IslandsExt !== 'undefined' && IslandsExt.rt && IslandsExt.rt.huts.some((h) => h.order)) return undefined;   // a delivery comes first
    const p = g.player, A = CFG.ISLANDS.ROCKET.ASK, d = U.dist(p.x, p.y, A.x, A.y), ready = this.canFly(g);
    if (ready) {
      if (d < CFG.ROCKETISLE.ASK_R) return { text: 'Press the button to blast off! 🚀', target: null };
      if (d < CFG.ROCKETISLE.HINT_R || (st.ask && st.ask.t < st.ask.dur)) return { text: 'The rocket is ready! Hop in! 🚀', target: A };
      return undefined;
    }
    if (st.ask && st.ask.t < 2.6) return { text: 'Come back later! The rocket is growing 🚧', target: null };
    if (d < CFG.ROCKETISLE.ASK_R) return { text: 'Ask the workers about the rocket! 🚀', target: null };
    if (d < CFG.ROCKETISLE.HINT_R) return { text: 'A real rocket! 🚀', target: A };
    return undefined;
  },
  // Rocket #2's scaffold: at the ladder's foot, on the walkways, while climbing
  scaffoldHint(g) {
    const st = this.st, G = this.geo(), p = g.player, K = CFG.ROCKETISLE.SITE2;
    if (st.climb) return { text: st.climb.to > st.climb.from ? 'Up we go! 🪜' : 'Down we go! 🪜', target: null };
    if (st.up === 2) {
      if (st.peek) return { text: 'Hello in there! 👋', target: null };
      return { text: 'Peek in the hatch! 👀', target: this.nearHatch(g) ? null : G.HATCH };
    }
    if (st.up === 1) { const F = G.L2.foot; return { text: 'Climb up to the top! 🪜', target: U.dist(p.x, p.y, F.x, F.y) < K.LADDER_R ? null : F }; }
    if (!this.site2On(g)) return undefined;
    const F = G.L1.foot, d = U.dist(p.x, p.y, F.x, F.y);
    if (d < K.HINT_R) return { text: 'Climb the scaffolding! 🪜', target: d < K.LADDER_R ? null : F };
    return undefined;
  },
  arrive(g, tr) {
    if (tr.via !== 'rocket' || tr.to !== 'islands') return;
    this.startLanding(g, CFG.ISLANDS.ROCKET.BASE);
    g.floats.push({ x: g.player.x, y: CFG.ISLANDS.ROCKET.BASE.y - 320, text: 'Home again! 🏝️', color: '#ffe08a', t: 0, dur: 1.8, big: true });
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st;
    this.countVisit(g);
    if (st.fly) this.updateFly(g, dt);
    this.updateSmoke(g, dt);
    // off the scaffold when something else moved the chef (another map, a ride, a teleport)
    if ((st.up || st.climb) && (g.area !== 'islands' || !this.onFoot(g) || (st.up && !st.climb && !this.onDeck(g, st.up)))) this.leaveScaffold(g);
    if (st.climb) this.updateClimb(g, dt);
    if (st.peek) { st.peek.t += dt; if (st.peek.t > CFG.ROCKETISLE.SITE2.PEEK || !this.nearHatch(g)) st.peek = null; }
    if (g.area !== 'islands') { st.sparks.length = 0; st.s2.sparks.length = 0; return; }
    const R = CFG.ISLANDS.ROCKET, p = g.player, t = g.time, stage = this.stage(g), chefNear = (w) => this.onFoot(g) && U.dist(p.x, p.y, w.x, w.y - w.z) < CFG.ROCKETISLE.WAVE_R;
    // a save (or a push) that left the chef inside the rocket's feet puts them back at its door
    const foot = st.obs[0], inside = (o) => p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h;
    if (!st.fly && !st.up && !st.climb && this.onFoot(g)) {
      if (inside(foot)) { p.x = R.ASK.x; p.y = R.ASK.y; p.moving = false; }
      // ... and one inside Rocket #2's site (or the fenced lot before it opens) at the scaffold's ladder (or before the lot)
      const L = R.SITE2.LOT, F = this.geo().L1.foot;
      if (this.site2On(g)) { if (st.obsSite.slice(st.obs.length).some(inside)) { p.x = F.x; p.y = F.y; p.moving = false; } }
      else if (p.x > L.x0 - 12 && p.x < L.x1 + 12 && p.y > L.y0 - 12 && p.y < L.y1 + 12) { p.x = L.x0 - 30; p.y = (R.PAD.y0 + R.PAD.y1) / 2 + 20; p.moving = false; }
    }
    if (this.site2On(g)) this.updateSite2(g, dt);
    st.crane = (st.crane + dt) % CFG.ROCKETISLE.CRANE_PERIOD;
    st.swing = stage >= 2 ? Math.min(1, st.swing + dt / 2.5) : 0;
    st.workers.forEach((w, i) => {
      w.waveCd = Math.max(0, w.waveCd - dt); w.wave = Math.max(0, w.wave - dt);
      // a friendly wave when the chef comes by (not from up a ladder): a little hop and a 👋 bubble
      if (w.z <= 4 && w.waveCd <= 0 && chefNear(w)) { w.wave = 1.6; w.waveCd = 7; w.facing = p.x < w.x ? -1 : 1; }
      if (stage >= 2) { this.updateCheer(g, w, i, dt); return; }
      w.hop = w.wave > 0 ? Math.abs(Math.sin(t * 11)) * 5 : 0;
      if (w.wave > 0) { w.moving = false; w.bob = 0; w.weld = 0; return; }
      if (w.role === 'carry' || w.role === 'boss') {
        if (w.pause > 0) { w.pause -= dt; w.moving = false; return; }
        const to = w.path[w.leg], arrived = U.moveToward(w, to.x, to.y, w.role === 'boss' ? 42 : 56, dt);
        w.bob = w.moving ? w.bob + dt * 12 : 0;
        if (arrived) {
          w.leg = (w.leg + 1) % w.path.length; w.pause = w.role === 'boss' ? 1.4 : 1.1;
          if (w.role === 'carry') w.carrying = w.leg === 1;   // picked one up at the pile, put it down by the rocket
        }
      } else if (w.role === 'climb') {
        // up the ladder, a little hammering at the top, back down, a breather at the bottom
        w.bang = Math.max(0, w.bang - dt);
        if (w.pause > 0) { w.pause -= dt; if (w.z > 60 && Math.floor(w.pause * 3) !== Math.floor((w.pause + dt) * 3)) w.bang = 0.18; return; }
        w.z += w.dir * 46 * dt; w.bob += dt * 10;
        const topZ = CFG.ISLANDS.ROCKET.SCAFFOLD.h * 0.75;
        if (w.z >= topZ) { w.z = topZ; w.dir = -1; w.pause = 2.6; } else if (w.z <= 0) { w.z = 0; w.dir = 1; w.pause = 2; }
      } else {
        // welders: a couple of seconds of sparks, then a look at the work
        w.weld = (Math.sin(t * 1.3 + (w.role === 'weldLow' ? 2 : 0)) > -0.3) ? 1 : 0;
      }
    });
    // sparks fly from the welding torches
    st.sparkT -= dt;
    if (st.sparkT <= 0) {
      st.sparkT = 0.05;
      for (const w of st.workers) if (w.weld) { const tx = w.x + w.facing * 18, ty = w.y - w.z - 18; for (let k = 0; k < 2; k++) st.sparks.push({ x: tx, y: ty, vx: U.rand(-70, 70), vy: U.rand(-110, -20), t: 0, life: U.rand(0.3, 0.6), floor: w.y - w.z + 2 }); }
    }
    for (const s of st.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 380 * dt; if (s.y > s.floor) { s.y = s.floor; s.vy *= -0.3; s.vx *= 0.5; } }
    st.sparks = st.sparks.filter((s) => s.t < s.life);
    if (st.sparks.length > 160) st.sparks.splice(0, st.sparks.length - 160);
    // a cheering bubble now and then once the rocket is finished
    if (st.cheer) { st.cheer.t += dt; if (st.cheer.t > 1.8) st.cheer = null; }
    if (stage >= 2 && !st.fly) { st.cheerT -= dt; if (st.cheerT <= 0) { st.cheerT = U.rand(2.2, 3.6); const w = U.pick(st.workers.filter((q) => q.z <= 0 && q !== (st.ask && st.ask.who))); if (w) st.cheer = { who: w, t: 0, text: U.pick(['🎉', 'Hooray!', '🚀', 'Yay!']) }; } }
    // the answer bubble and the countdown that never quite gets there
    if (st.ask) { st.ask.t += dt; if (st.ask.t > (st.ask.dur || 3)) st.ask = null; }
    if (st.count) {
      const c = st.count, top = { x: R.BASE.x, y: R.BASE.y - CFG.ROCKETISLE.ROCKET_H - 20 };
      c.t += dt;
      const marks = ['3…', '2…', '1…', '🚧 Not yet! Coming soon!'];
      while (c.n < marks.length && c.t >= c.n * 0.6) {
        const last = c.n === marks.length - 1;
        g.floats.push({ x: top.x, y: top.y + (last ? 40 : 0), text: marks[c.n], color: last ? '#ffe08a' : '#fff', t: 0, dur: last ? 1.8 : 0.7, big: true });
        c.n++;
      }
      if (c.n >= marks.length) st.count = null;
    }
  },
  // Rocket #2's busy site (it never gets finished): the crane goes round and round, the carrier fetches panels, the
  // welders throw sparks, the one at the top hammers away; each hops and waves 👋 at a chef close by on the same level
  updateSite2(g, dt) {
    const s2 = this.st.s2, st = this.st, p = g.player, t = g.time, lv = st.climb ? -1 : st.up;
    s2.crane = (s2.crane + dt) % CFG.ROCKETISLE.SITE2.CRANE_PERIOD;
    for (const w of s2.workers) {
      w.waveCd = Math.max(0, w.waveCd - dt); w.wave = Math.max(0, w.wave - dt); w.bang = Math.max(0, w.bang - dt);
      if (w.waveCd <= 0 && lv === w.deck && this.onFoot(g) && U.dist(p.x, p.y, w.x, w.y) < CFG.ROCKETISLE.WAVE_R) { w.wave = 1.6; w.waveCd = 7; w.facing = p.x < w.x ? -1 : 1; }
      w.hop = w.wave > 0 ? Math.abs(Math.sin(t * 11)) * 5 : 0;
      if (w.wave > 0) { w.moving = false; w.bob = 0; w.weld = 0; continue; }
      if (w.role === 'carry') {
        if (w.pause > 0) { w.pause -= dt; w.moving = false; continue; }
        const to = w.path[w.leg], arrived = U.moveToward(w, to.x, to.y, 50, dt);
        w.bob = w.moving ? w.bob + dt * 12 : 0;
        if (arrived) { w.leg = (w.leg + 1) % w.path.length; w.pause = 1.2; w.carrying = w.leg === 1; }
      } else if (w.role === 'hammer') {
        // a few bangs, a look at the work, again
        w.facing = 1; const c = (t + 0.4) % 3.4;
        if (c < 2 && (c % 0.5) < dt * 1.5) w.bang = 0.16;
      } else {
        w.facing = w.role === 'weldLow' ? -1 : 1;
        w.weld = Math.sin(t * 1.3 + w.ph) > -0.3 ? 1 : 0;
      }
    }
    s2.sparkT -= dt;
    if (s2.sparkT <= 0) {
      s2.sparkT = 0.05;
      for (const w of s2.workers) if (w.weld) { const tx = w.x + w.facing * 18, ty = w.y - 18; for (let k = 0; k < 2; k++) s2.sparks.push({ x: tx, y: ty, vx: U.rand(-70, 70), vy: U.rand(-110, -20), t: 0, life: U.rand(0.3, 0.6), floor: w.y + 2 }); }
    }
    for (const q of s2.sparks) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 380 * dt; if (q.y > q.floor) { q.y = q.floor; q.vy *= -0.3; q.vx *= 0.5; } }
    s2.sparks = s2.sparks.filter((q) => q.t < q.life);
    if (s2.sparks.length > 120) s2.sparks.splice(0, s2.sparks.length - 120);
  },
  // finished: everyone climbs down, gathers round the pad and hops for joy
  updateCheer(g, w, i, dt) {
    const spot = CFG.ROCKETISLE.CHEER[i % CFG.ROCKETISLE.CHEER.length];
    w.weld = 0; w.bang = 0; w.carrying = false; w.pause = 0;
    if (w.z > 0) { w.z = Math.max(0, w.z - 70 * dt); w.bob += dt * 10; w.hop = 0; w.moving = false; return; }
    if (!U.moveToward(w, spot.x, spot.y, 60, dt)) { w.bob += dt * 12; w.hop = 0; return; }
    w.moving = false; w.bob = 0;
    const p = g.player; if (!w.wave) w.facing = p.x < w.x ? -1 : 1;
    const t = g.time * 7 + i * 1.7;
    w.hop = Math.sin(g.time * 1.1 + i) > 0 || w.wave > 0 ? Math.abs(Math.sin(t)) * 10 : 0;
  },

  // ---------- launch, flight, landing (any map) ----------
  startLaunch(g, base, to) {
    const p = g.player, st = this.st;
    st.fly = { kind: 'launch', t: 0, area: g.area, base: { x: base.x, y: base.y }, to, from: { x: p.x, y: p.y }, n: 0, lift: 0 };
    st.ask = null; st.count = null; st.cheer = null; st.puff = null;
    p.moving = false; p.hasMoved = true;
    g.floats.push({ x: base.x, y: base.y - CFG.ROCKETISLE.ROCKET_H - 30, text: 'All aboard! 🚀', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Haptics.tap();
  },
  startLanding(g, base) {
    const p = g.player, st = this.st, Hh = CFG.ROCKETISLE.LAND_H;
    st.fly = { kind: 'land', t: 0, area: g.area, base: { x: base.x, y: base.y }, lift: Hh };
    st.smoke = []; st.puff = null; st.ask = null; st.count = null;
    p.x = base.x; p.y = base.y - 20 - Hh; p.moving = false; p.hasMoved = true;
    g.cameraSnap = true;
  },
  updateFly(g, dt) {
    const st = this.st, f = st.fly, p = g.player, C = CFG.ROCKETISLE, B = f.base, H = C.ROCKET_H;
    if (g.area !== f.area || g.driving || g.travel) { st.fly = null; return; }   // something else moved the chef: never mind
    f.t += dt;
    if (f.kind === 'launch') {
      // walk up the steps and in through the hatch, then sit tight behind the rocket's skin
      if (f.t < C.BOARD) { const k = f.t / C.BOARD; p.x = U.lerp(f.from.x, B.x, k); p.y = U.lerp(f.from.y, B.y + 16, k); p.moving = true; p.bob += dt * 14; }
      else { p.x = B.x; p.y = B.y - 20; p.moving = false; }
      const marks = ['3', '2', '1', '🚀 BLAST OFF!'];
      while (f.n < marks.length && f.t >= C.MARKS[f.n]) {
        const last = f.n === marks.length - 1;
        g.floats.push({ x: B.x + (last ? 0 : 70), y: B.y - H * (last ? 0.55 : 0.75), text: marks[f.n], color: last ? '#ffe08a' : '#fff', t: 0, dur: last ? 1.6 : 0.75, big: true });
        if (last) { Sfx.tone(110, 1.6, 'sawtooth', 0.04, 260); Haptics.success(); } else Sfx.tone(660 + f.n * 110, 0.12, 'triangle', 0.035);
        f.n++;
      }
      if (f.t > C.MARKS[0]) this.spawnSmoke(g, f, dt, f.t < C.LIFTOFF ? 0.35 : 1);
      if (f.t >= C.LIFTOFF - 0.3 && !st.puff) st.puff = { x: B.x, y: B.y, area: f.area, t: 0, grow: 0.5, fade: 0 };
      if (f.t >= C.LIFTOFF) { const u = f.t - C.LIFTOFF; f.lift = 30 * u + 240 * u * u; }
      // gone off the top of the screen (or long enough): the flight takes over
      const R = Render, off = R && R.viewH ? B.y - f.lift + 40 < R.camY - 20 : false;
      if (f.t >= C.LIFTOFF && (off || f.t > C.LIFTOFF + 4)) {
        st.fly = null; st.puff = null; st.smoke = [];
        g.startTravel(f.to, 'rocket', C.FLIGHT);
      }
    } else {
      const k = Math.min(1, f.t / C.LAND), e = 1 - Math.pow(1 - k, 3);
      f.lift = (1 - e) * C.LAND_H;
      p.x = B.x; p.y = B.y - 20 - f.lift; p.moving = false;   // the camera rides down with the rocket
      if (f.lift < 260) this.spawnSmoke(g, f, dt, 0.8);
      if (k >= 1) {
        f.lift = 0; st.fly = null;
        st.puff = { x: B.x, y: B.y, area: f.area, t: 0, grow: 0.01, fade: 1.2 };
        p.x = B.x; p.y = B.y + 44; p.facing = 1; p.moving = false;   // out of the hatch, down the steps
        g.floats.push({ x: B.x, y: B.y - 80, text: 'Touchdown! 🚀', color: '#ffe08a', t: 0, dur: 1.4, big: true });
        Haptics.success();
      }
    }
  },
  // the current lift, flame, shake and hatch for the rocket on `area`'s pad (null when nothing is happening there)
  flyState(g, area) {
    const f = this.st && this.st.fly, C = CFG.ROCKETISLE;
    if (!f || f.area !== area) return null;
    const t = g.time;
    if (f.kind === 'launch') {
      const flame = f.t < C.MARKS[2] ? 0 : f.t < C.LIFTOFF ? 0.4 + 0.1 * Math.sin(t * 30) : 1;
      const shake = f.t > C.MARKS[1] && f.t < C.LIFTOFF + 1.2 ? Math.sin(t * 70) * (f.t < C.LIFTOFF ? 1 : 2) : 0;
      return { lift: f.lift, flame, shake, door: f.t < C.BOARD + 0.15 ? 1 : 0 };
    }
    return { lift: f.lift, flame: f.lift > 1 ? 0.75 + 0.1 * Math.sin(t * 30) : 0, shake: Math.sin(t * 60) * 0.8, door: 0 };
  },
  spawnSmoke(g, f, dt, rate) {
    const st = this.st, B = f.base, n = Math.random() < rate * dt * 40 ? 2 : 0, y = B.y - f.lift;
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? -1 : 1, near = f.lift < 160;
      st.smoke.push({ area: f.area, x: B.x + U.rand(-10, 10), y: near ? B.y + U.rand(-8, 8) : y + 30, vx: near ? side * U.rand(50, 170) : U.rand(-25, 25), vy: near ? U.rand(-25, 5) : U.rand(20, 60), r: U.rand(10, 16), t: 0, life: U.rand(1.2, 2.2) });
    }
    if (st.smoke.length > 220) st.smoke.splice(0, st.smoke.length - 220);
  },
  updateSmoke(g, dt) {
    const st = this.st;
    for (const s of st.smoke) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - dt * 1.2; s.vy *= 1 - dt * 1.2; s.r += dt * 16; }
    st.smoke = st.smoke.filter((s) => s.t < s.life);
    if (st.puff) { st.puff.t += dt; if (st.puff.fade && st.puff.t > st.puff.fade) st.puff = null; }
  },

  // ---------- static art on the island ----------
  bgKey(g) { return 'rocket' + this.stage(g); },
  paintAfter(r, g, area) {
    if (area !== 'islands') return;
    const ctx = r.ctx, R = CFG.ISLANDS.ROCKET, P = R.PAD, B = R.BASE;
    this.paintPad(r, P, B);
    // a painted pizza on the pad, for luck
    r.drawPizza(P.x0 + 44, P.y1 - 44, 16);
    // traffic cones along the edge
    for (const [x, y] of [[P.x0 + 10, P.y0 + 30], [P.x0 + 10, P.y1 - 90], [P.x1 - 10, P.y1 - 30], [P.x1 - 10, P.y0 + 90]]) this.paintCone(ctx, x, y);
    // the fuel hose from the truck to the rocket
    const T = R.TRUCK;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x + 44, T.y - 4); ctx.bezierCurveTo(T.x + 110, T.y + 20, B.x - 90, B.y + 30, B.x - 24, B.y - 4); ctx.stroke();
    ctx.strokeStyle = '#41b883'; ctx.lineWidth = 2; ctx.stroke();
    this.paintMission(r, g);
    this.paintSign(r, g);
    // the crane's footing: tracks in the sand
    const C = R.CRANE; ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = -2; k <= 2; k++) ctx.fillRect(C.x - 30, C.y + k * 8 + 22, 60, 3);
    this.paintSite2(r, g);
  },
  paintCone(ctx, x, y) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.lineTo(x, y - 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 3.5, y - 9, 7, 3); ctx.fillStyle = '#3e424a'; ctx.fillRect(x - 8, y - 1, 16, 3); },
  // a concrete launch pad with hazard stripes round the edge and a flame trench grate under the rocket's feet B
  paintPad(r, P, B) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, P.x0 + 5, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.fill();
    ctx.fillStyle = '#b9bcc2'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let x = P.x0 + 40; x < P.x1; x += 40) ctx.fillRect(x, P.y0 + 4, 2, P.y1 - P.y0 - 8); for (let y = P.y0 + 40; y < P.y1; y += 40) ctx.fillRect(P.x0 + 4, y, P.x1 - P.x0 - 8, 2);
    ctx.save(); U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.clip();
    for (let i = -20; i < 60; i++) { ctx.fillStyle = i % 2 ? '#2b1d14' : '#ffd166'; const x = P.x0 + i * 14; ctx.beginPath(); ctx.moveTo(x, P.y0); ctx.lineTo(x + 14, P.y0); ctx.lineTo(x + 24, P.y0 + 10); ctx.lineTo(x + 10, P.y0 + 10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, P.y1 - 10); ctx.lineTo(x + 14, P.y1 - 10); ctx.lineTo(x + 24, P.y1); ctx.lineTo(x + 10, P.y1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(B.x, B.y - 10, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 40, B.y - 26, 80, 30, 6); ctx.fill();
    ctx.fillStyle = '#3e424a'; for (let x = B.x - 34; x < B.x + 36; x += 8) ctx.fillRect(x, B.y - 22, 4, 22);
  },
  // east of the pad: a fenced lot with a COMING SOON sign and a rocket chalked on the sand while the first rocket is
  // built; then Rocket #2's pad (the rocket, scaffold, crane, shed and panels are live entities)
  paintSite2(r, g) {
    const ctx = r.ctx, S2 = CFG.ISLANDS.ROCKET.SITE2, L = S2.LOT, B = S2.BASE;
    if (!this.site2On(g)) {
      ctx.fillStyle = 'rgba(160,120,60,0.12)'; U.roundRect(ctx, L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0, 10); ctx.fill();
      // tyre tracks, survey stakes with pink ribbons, and the next rocket chalked out where it will stand
      ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let k = 0; k < 9; k++) { ctx.fillRect(L.x0 + 30 + k * 6, L.y0 + 30 + k * 34, 46, 3); ctx.fillRect(L.x1 - 70 - k * 4, L.y0 + 44 + k * 34, 40, 3); }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(B.x, B.y - 110, 70, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(B.x - 18, B.y - 50); ctx.lineTo(B.x - 18, B.y - 150); ctx.quadraticCurveTo(B.x, B.y - 196, B.x + 18, B.y - 150); ctx.lineTo(B.x + 18, B.y - 50); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(B.x - 18, B.y - 80); ctx.lineTo(B.x - 36, B.y - 50); ctx.lineTo(B.x - 18, B.y - 50); ctx.moveTo(B.x + 18, B.y - 80); ctx.lineTo(B.x + 36, B.y - 50); ctx.lineTo(B.x + 18, B.y - 50); ctx.stroke();
      ctx.setLineDash([]);
      for (const [x, y] of [[L.x0 + 26, L.y0 + 30], [L.x1 - 26, L.y0 + 30], [L.x0 + 26, L.y1 - 26], [L.x1 - 26, L.y1 - 26], [B.x, B.y - 206]]) { ctx.fillStyle = '#c9975f'; ctx.fillRect(x - 2, y - 18, 4, 18); ctx.fillStyle = '#ff6fa5'; ctx.beginPath(); ctx.moveTo(x + 2, y - 18); ctx.lineTo(x + 14, y - 14); ctx.lineTo(x + 2, y - 10); ctx.closePath(); ctx.fill(); }
      // the fence: orange-and-white barrier boards between posts all round the lot
      const post = (x, y) => { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 2, y - 1, 8, 4); ctx.fillStyle = '#7d8591'; ctx.fillRect(x - 2, y - 22, 4, 22); };
      const rail = (x0, y0, x1, y1) => {
        const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 12));
        for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; ctx.strokeStyle = i % 2 ? '#fff' : '#ff8c42'; ctx.lineWidth = 5; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(U.lerp(x0, x1, a), U.lerp(y0, y1, a) - 16); ctx.lineTo(U.lerp(x0, x1, b), U.lerp(y0, y1, b) - 16); ctx.stroke(); }
      };
      rail(L.x0, L.y0, L.x1, L.y0); rail(L.x0, L.y0, L.x0, L.y1); rail(L.x1, L.y0, L.x1, L.y1); rail(L.x0, L.y1, L.x1, L.y1);
      for (let x = L.x0; x <= L.x1 + 1; x += (L.x1 - L.x0) / 5) { post(x, L.y0); post(x, L.y1); }
      for (let y = L.y0; y <= L.y1 + 1; y += (L.y1 - L.y0) / 8) { post(L.x0, y); post(L.x1, y); }
      // the sign in the middle: COMING SOON: ROCKET #2
      const sx = (L.x0 + L.x1) / 2, sy = L.y1 - 34, w = 176, h = 62, y0 = sy - 92;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(sx - w / 2 + 6, sy - 2, w, 6);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(sx - 74, y0 + 10, 6, sy - y0 - 8); ctx.fillRect(sx + 68, y0 + 10, 6, sy - y0 - 8);
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, sx - w / 2, y0, w, h, 6); ctx.fill();
      ctx.save(); U.roundRect(ctx, sx - w / 2, y0, w, h, 6); ctx.clip();
      for (let i = -2; i < 26; i++) { ctx.fillStyle = '#2b1d14'; const x = sx - w / 2 + i * 14; ctx.beginPath(); ctx.moveTo(x, y0 + h - 7); ctx.lineTo(x + 7, y0 + h - 7); ctx.lineTo(x + 14, y0 + h); ctx.lineTo(x + 7, y0 + h); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; U.roundRect(ctx, sx - w / 2, y0, w, h, 6); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(12); ctx.fillText('🚧 COMING SOON:', sx, y0 + 15);
      ctx.fillStyle = '#e4572e'; ctx.font = r.font(18); ctx.fillText('🚀 ROCKET #2', sx, y0 + 37);
      return;
    }
    const P = S2.PAD;
    this.paintPad(r, P, B);
    // the scaffold's shadow, a big "2" painted by the ladder, cones, the crane's tracks and a path of planks to the shed
    ctx.fillStyle = 'rgba(0,0,0,0.09)'; ctx.fillRect(B.x - 104, B.y - 22, 212, 50);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(P.x0 + 30, P.y1 - 26, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('2', P.x0 + 30, P.y1 - 25);
    for (const [x, y] of [[P.x1 - 10, P.y1 - 40], [P.x0 + 64, P.y1 - 12], [P.x1 - 12, P.y0 + 24]]) this.paintCone(ctx, x, y);
    const C = S2.CRANE; ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = -2; k <= 2; k++) ctx.fillRect(C.x - 26, C.y + k * 8 + 22, 44, 3);
  },
  paintMission(r, g) {
    const ctx = r.ctx, M = CFG.ISLANDS.ROCKET.MISSION, x0 = M.x - M.w / 2, y0 = M.y - M.h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x0 + 6, y0 + 8, M.w, M.h, 10); ctx.fill();
    // the front wall faces south, under a flat white roof with a red stripe
    ctx.fillStyle = '#e8edf2'; ctx.fillRect(x0 + 4, M.y - 2, M.w - 8, M.h / 2 + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = M.y + 4; y < y0 + M.h; y += 7) ctx.fillRect(x0 + 4, y, M.w - 8, 1.5);
    ctx.fillStyle = '#f5f7fa'; U.roundRect(ctx, x0, y0, M.w, M.h / 2 + 4, 10); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x0, M.y - 2, M.w, 6);
    ctx.fillStyle = '#c9ccd2'; for (const [dx, dy] of [[18, 12], [M.w - 30, 10]]) { U.roundRect(ctx, x0 + dx, y0 + dy, 14, 10, 3); ctx.fill(); }   // roof vents
    // the door and the window frames (the screens behind them blink live)
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, M.x - 11, M.y + 12, 22, M.h / 2 - 12, 3); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(M.x - 7, M.y + 16, 14, 8); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(M.x + 7, M.y + 30, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; for (const dx of [-46, 20]) { U.roundRect(ctx, M.x + dx, M.y + 10, 26, 18, 3); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, M.x - 54, y0 + M.h + 4, 108, 14, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛰️ MISSION CONTROL', M.x, y0 + M.h + 11);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(M.x - 12, y0 + M.h, 24, 26);   // the path to the door
  },
  // "COMING SOON!" with a row of progress dots while it is built, a green "READY FOR LAUNCH!" once it is done
  paintSign(r, g) {
    const ctx = r.ctx, S = CFG.ISLANDS.ROCKET.SIGN, w = 214, h = 50, y0 = S.y - 66, stage = this.stage(g), done = stage >= 2;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x - w / 2 + 6, S.y - 2, w, 6);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x - 96, y0 + 10, 6, S.y - y0 - 8); ctx.fillRect(S.x + 90, y0 + 10, 6, S.y - y0 - 8);
    ctx.fillStyle = done ? '#41b883' : '#ffd166'; U.roundRect(ctx, S.x - w / 2, y0, w, h, 6); ctx.fill();
    ctx.save(); U.roundRect(ctx, S.x - w / 2, y0, w, h, 6); ctx.clip();
    for (let i = -2; i < 30; i++) { ctx.fillStyle = done ? (i % 2 ? '#fff' : '#e4572e') : '#2b1d14'; const x = S.x - w / 2 + i * 14; ctx.beginPath(); ctx.moveTo(x, y0 + h - 7); ctx.lineTo(x + 7, y0 + h - 7); ctx.lineTo(x + 14, y0 + h); ctx.lineTo(x + 7, y0 + h); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; U.roundRect(ctx, S.x - w / 2, y0, w, h, 6); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (done) {
      ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.fillText('🚀 THE PIZZA ROCKET', S.x, y0 + 13);
      ctx.font = r.font(14); ctx.fillStyle = '#ffe08a'; ctx.fillText('🚀 READY FOR LAUNCH!', S.x, y0 + 31);
      return;
    }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(11); ctx.fillText('🚀 ROCKET UNDER CONSTRUCTION', S.x, y0 + 13);
    ctx.font = r.font(13); ctx.fillStyle = '#e4572e'; ctx.fillText('COMING SOON!', S.x - 14, y0 + 30);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i <= stage ? '#e4572e' : 'rgba(43,29,20,0.25)'; ctx.beginPath(); ctx.arc(S.x + 62 + i * 11, y0 + 30, 4, 0, Math.PI * 2); ctx.fill(); }
  },

  // ---------- live art ----------
  dynamic(r, g) {
    if (!this.st || g.area !== 'islands') return;
    const ctx = r.ctx, t = g.time, M = CFG.ISLANDS.ROCKET.MISSION, T = CFG.ISLANDS.ROCKET.TRUCK;
    // mission control's screens blink and a dish on the roof turns
    for (const [i, dx] of [[0, -46], [1, 20]]) {
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, M.x + dx + 2, M.y + 12, 22, 14, 2); ctx.fill();
      for (let k = 0; k < 3; k++) { const on = Math.sin(t * (2 + k) + i * 2 + k) > 0; ctx.fillStyle = on ? ['#8ef0a0', '#ffd166', '#4dd0e1'][k] : 'rgba(255,255,255,0.15)'; ctx.fillRect(M.x + dx + 5 + k * 6, M.y + 15, 4, 8 - k * 2); }
    }
    const da = Math.sin(t * 0.6) * 0.8, dx0 = M.x + M.w / 2 - 22, dy0 = M.y - M.h / 2 + 4;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(dx0 - 2, dy0 - 10, 4, 12);
    ctx.save(); ctx.translate(dx0, dy0 - 12); ctx.rotate(da); ctx.fillStyle = '#f5f7fa'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -10, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // the fuel truck's light blinks
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = 'rgba(255,209,102,0.5)'; ctx.beginPath(); ctx.arc(T.x - 34, T.y - 40, 9, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    this.smokeItem(r, g, items);
    if (g.area !== 'islands') return;
    const R = CFG.ISLANDS.ROCKET, B = R.BASE, st = this.st, fs = this.flyState(g, 'islands');
    // only bother when Rocket Island is somewhere near the screen (the rockets and cranes are tall)
    const isle = this.island();
    if (!fs && (r.camY + r.viewH < isle.y0 - 360 || r.camY > isle.y1 + 40 || r.camX > isle.x1 + 80 || r.camX + r.viewW < isle.x0 - 80)) return;
    const stage = this.stage(g);
    if (stage >= 2) this.site2Items(r, g, items);
    items.push({ y: B.y, draw: () => this.drawPadRocket(r, g, B, stage, fs) });
    items.push({ y: B.y + 1, draw: () => this.drawScaffold(r, g) });
    items.push({ y: R.CRANE.y + 18, draw: () => this.drawCrane(r, g) });
    items.push({ y: R.TRUCK.y + 14, draw: () => this.drawTruck(r, g) });
    items.push({ y: R.PARTS.y + 10, draw: () => this.drawParts(r, g) });
    for (const w of st.workers) items.push({ y: w.z > 4 && (w.role === 'climb' || w.role === 'weldHigh') ? B.y + 2 : w.y, draw: () => this.drawWorker(r, g, w) });
  },
  // Rocket #2's site, y-sorted: the rocket, then the scaffold, the workers up on it, the chef up there (or on a ladder),
  // and last the walkways' front rails, so the chef stands on the planks behind the railing; the crane, shed and panels
  site2Items(r, g, items) {
    const S2 = CFG.ISLANDS.ROCKET.SITE2, G = this.geo(), B = G.B, st = this.st, SH = S2.SHED;
    items.push({ y: B.y, draw: () => this.drawRocket2(r.ctx, B.x, B.y, g.time) });
    items.push({ y: B.y + 1, draw: () => this.drawScaffold2(r, g) });
    for (const w of st.s2.workers) items.push({ y: w.deck ? B.y + 2 : w.y, draw: () => this.drawWorker(r, g, w) });
    if ((st.up || st.climb) && !g.driving && !g.onTrain) items.push({ y: B.y + 3, draw: () => r.drawPlayer(g) });
    items.push({ y: B.y + 4, draw: () => this.drawScaffold2Front(r, g) });
    items.push({ y: S2.CRANE.y + 18, draw: () => this.drawCrane2(r, g) });
    items.push({ y: S2.PARTS.y + 10, draw: () => this.drawPanels(r, S2.PARTS.x, S2.PARTS.y, 3, true) });
    items.push({ y: S2.STACK.y + 10, draw: () => this.drawPanels(r, S2.STACK.x, S2.STACK.y, 4, false) });
    items.push({ y: SH.y + SH.h / 2, draw: () => this.drawShed(r, g) });
  },
  // the rocket standing on a pad (Rocket Island's or the moon's): steps up to its hatch once it is finished, and
  // while it flies its shadow stays on the ground, shrinking, under the flames
  drawPadRocket(r, g, B, stage, fs) {
    const ctx = r.ctx, lift = fs ? fs.lift : 0;
    if (stage >= 2 && lift < 30) this.drawSteps(ctx, B.x, B.y);
    if (lift > 0) { const a = Math.max(0, 0.2 - lift / 2500); ctx.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`; ctx.beginPath(); ctx.ellipse(B.x + 6, B.y + 2, 44, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    this.drawRocket(ctx, B.x + (fs ? fs.shake : 0), B.y - lift, g.time, 1, stage, { flame: fs ? fs.flame : 0, door: fs ? fs.door : 0, noShadow: lift > 0 });
  },
  // little metal steps from the hatch down onto the pad
  drawSteps(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(x - 12, y - 14); ctx.lineTo(x + 14, y - 14); ctx.lineTo(x + 20, y + 32); ctx.lineTo(x - 14, y + 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(x - 11, y - 16); ctx.lineTo(x + 11, y - 16); ctx.lineTo(x + 15, y + 28); ctx.lineTo(x - 15, y + 28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5c6670'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 12 - k * 0.7, y - 10 + k * 8.5, 24 + k * 1.4, 2.5);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 16, y + 26, 3, 4); ctx.fillRect(x + 13, y + 26, 3, 4);
  },
  // smoke from a launch or a landing, on whichever map it happens: puffs and the big billow round the pad
  smokeItem(r, g, items) {
    const st = this.st, pf = st.puff && st.puff.area === g.area ? st.puff : null, list = st.smoke.filter((s) => s.area === g.area);
    if (!pf && !list.length) return;
    const by = pf ? pf.y : (st.fly ? st.fly.base.y : list[0].y);
    items.push({ y: by + 30, draw: () => {
      const ctx = r.ctx;
      for (const s of list) { const k = s.t / s.life; ctx.fillStyle = `rgba(${k < 0.15 ? '255,236,190' : '238,238,238'},${(0.85 * (1 - k)).toFixed(3)})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
      if (pf) {
        const grow = Math.min(1, pf.t / (pf.grow || 0.01)), fade = pf.fade ? Math.max(0, 1 - pf.t / pf.fade) : 1, t = g.time;
        if (fade <= 0) return;
        ctx.globalAlpha = fade;
        const blobs = [[0, -40, 46], [-38, -18, 36], [38, -18, 36], [-22, -64, 30], [24, -66, 30], [-60, 6, 26], [60, 6, 26], [0, -2, 40], [0, -84, 24]];
        for (const [dx, dy, rr] of blobs) { const w = Math.sin(t * 3 + dx) * 3; ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.arc(pf.x + dx * grow + 3, pf.y + dy * grow + 4, (rr + w) * grow, 0, Math.PI * 2); ctx.fill(); }
        for (const [dx, dy, rr] of blobs) { const w = Math.sin(t * 3 + dx) * 3; ctx.fillStyle = '#f6f6f6'; ctx.beginPath(); ctx.arc(pf.x + dx * grow, pf.y + dy * grow, (rr + w - 4) * grow, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
    } });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'islands') return;
    const ctx = r.ctx, st = this.st;
    ctx.lineCap = 'round';
    for (const s of st.sparks) { const k = s.t / s.life; ctx.strokeStyle = k < 0.4 ? '#fffbe0' : '#ffd166'; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const w of st.workers) if (w.weld) { const fl = 0.6 + Math.random() * 0.4; ctx.fillStyle = `rgba(200,240,255,${(0.7 * fl).toFixed(2)})`; ctx.beginPath(); ctx.arc(w.x + w.facing * 18, w.y - w.z - 18, 5 + fl * 4, 0, Math.PI * 2); ctx.fill(); }
    // the climber's hammer goes bang
    const c = st.workers.find((w) => w.role === 'climb');
    if (c && c.bang > 0) { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('bang!', c.x + 22, c.y - c.z - 50); }
    const say = (w, text, bob) => { ctx.font = r.font(13); const tw = ctx.measureText(text).width + 22; r.drawBubble(w.x, w.y - w.z - (w.hop || 0) - 70 + bob, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, tw); };
    if (st.ask && st.ask.who) {
      const w = st.ask.who, bob = Math.sin(st.ask.t * 5) * 2;
      say(w, st.ask.line, bob);
      if (st.ask.more) { const text = '🚧 ' + st.ask.more; ctx.font = r.font(14); const tw = ctx.measureText(text).width + 24; r.drawBubble(w.x, w.y - w.z - (w.hop || 0) - 102 + bob, () => { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e4572e'; ctx.fillText(text, 0, 0); }, tw, '#ffe08a'); }
    }
    if (st.cheer && (!st.ask || st.ask.who !== st.cheer.who)) say(st.cheer.who, st.cheer.text, 0);
    for (const w of st.workers) if (w.wave > 0.4 && (!st.ask || st.ask.who !== w) && (!st.cheer || st.cheer.who !== w)) r.drawBubble(w.x, w.y - w.z - (w.hop || 0) - 66, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👋', 0, 0); }, 30);
    if (!this.site2On(g)) return;
    // Rocket #2's site: sparks, torch glows, the hammer's bang and the workers' waves
    const s2 = st.s2;
    ctx.lineCap = 'round';
    for (const q of s2.sparks) { const k = q.t / q.life; ctx.strokeStyle = k < 0.4 ? '#fffbe0' : '#ffd166'; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const w of s2.workers) {
      if (w.weld) { const fl = 0.6 + Math.random() * 0.4; ctx.fillStyle = `rgba(200,240,255,${(0.7 * fl).toFixed(2)})`; ctx.beginPath(); ctx.arc(w.x + w.facing * 18, w.y - 18, 5 + fl * 4, 0, Math.PI * 2); ctx.fill(); }
      if (w.bang > 0) { ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('bang!', w.x + w.facing * 24, w.y - 50); }
      if (w.wave > 0.4) r.drawBubble(w.x, w.y - (w.hop || 0) - 66, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👋', 0, 0); }, 30);
    }
  },

  // The rocket, side on, standing on its feet at (x, y). `s` scales it (mission control's screens draw it small);
  // `stage` (default: how far it is built) picks the look: 0 a bare frame with a few panels, 1 mostly panelled with
  // no nose cone yet, 2 finished and painted with a nose cone, a hatch and the PIZZA name down the side.
  // `o`: { flame 0..1, door 0..1 (hatch open), noShadow, chef (the chef's face in the porthole) }.
  drawRocket(ctx, x, y, t, s, stage, o) {
    const H = CFG.ROCKETISLE.ROCKET_H, ty = -H + 60;
    if (stage === undefined || stage === null) stage = this.stage(typeof Game !== 'undefined' ? Game : null);
    o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (!o.noShadow) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(6, 2, 44, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    if (o.flame > 0) this.drawFlame(ctx, o.flame, t);
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(14, -16); ctx.lineTo(20, 0); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill();   // engine bell
    // fins: one bare-metal fin at first (the other is being welded on the pad), primer orange, then painted red
    for (const d of stage === 0 ? [-1] : [-1, 1]) {
      ctx.fillStyle = stage === 0 ? '#9aa0a8' : stage === 1 ? '#ff8c42' : '#e4572e';
      ctx.beginPath(); ctx.moveTo(d * 24, -80); ctx.lineTo(d * 46, -24); ctx.lineTo(d * 46, 0); ctx.lineTo(d * 24, -18); ctx.closePath(); ctx.fill();
      if (stage === 2) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(d * 40, -38); ctx.lineTo(d * 46, -24); ctx.lineTo(d * 46, -14); ctx.lineTo(d * 36, -30); ctx.closePath(); ctx.fill(); }
    }
    if (stage === 0) {
      // the bare frame: dark inside, four rails, a ring every 20 px, cross braces, a few panels bolted on low down
      ctx.fillStyle = 'rgba(46,50,58,0.6)'; U.roundRect(ctx, -26, ty, 52, H - 74, 6); ctx.fill();
      ctx.strokeStyle = '#b9bcc2'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let yy = -14, k = 0; yy > ty + 10; yy -= 20, k++) { ctx.moveTo(-24, yy); ctx.lineTo(-8, yy - 20); ctx.moveTo(8, yy - (k % 2 ? 0 : 20)); ctx.lineTo(24, yy - (k % 2 ? 20 : 0)); }
      ctx.stroke();
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.beginPath(); for (const rx of [-25, -8, 8, 25]) { ctx.moveTo(rx, -14); ctx.lineTo(rx, ty); } ctx.stroke();
      ctx.lineWidth = 2.5; ctx.beginPath(); for (let yy = -14; yy >= ty; yy -= 20) { ctx.moveTo(-26, yy); ctx.lineTo(26, yy); } ctx.stroke();
      for (const [px, py, pw, ph, col] of [[-26, -54, 18, 40, '#e8edf2'], [-8, -54, 16, 40, '#e8edf2'], [8, -34, 18, 20, '#ff8c42'], [-26, -94, 18, 40, '#e8edf2'], [8, -114, 18, 20, '#ff8c42']]) {
        ctx.fillStyle = col; ctx.fillRect(px, py, pw, ph); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px, py + ph - 3, pw, 3);
        ctx.fillStyle = '#7d8591'; for (const [bx, by] of [[px + 3, py + 3], [px + pw - 3, py + 3], [px + 3, py + ph - 5], [px + pw - 3, py + ph - 5]]) { ctx.beginPath(); ctx.arc(bx, by, 1.2, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(0, ty, 26, 4, 0, 0, Math.PI * 2); ctx.fill();   // the open top ring
      ctx.restore();
      return;
    }
    // the body: a soft gradient so it reads round
    const bg = ctx.createLinearGradient(-26, 0, 26, 0); bg.addColorStop(0, '#d9dde3'); bg.addColorStop(0.35, '#ffffff'); bg.addColorStop(1, '#c9ccd2');
    ctx.fillStyle = bg; U.roundRect(ctx, -26, ty, 52, H - 74, 10); ctx.fill();
    // the porthole (a pizza slice, or the chef, looking out)
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(6, -110, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(6, -110, 10, 0, Math.PI * 2); ctx.fill();
    if (o.chef) {
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(6, -107, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3, -114, 4, 0, Math.PI * 2); ctx.arc(9, -114, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(1, -114, 10, 4);
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(3.5, -108, 1.6, 1.6); ctx.fillRect(7.5, -108, 1.6, 1.6); ctx.beginPath(); ctx.arc(6, -104.5, 1.6, 0, Math.PI); ctx.fill();
    } else { ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(6, -116); ctx.lineTo(1, -104); ctx.lineTo(11, -104); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(6, -107, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(2, -114, 2.5, 0, Math.PI * 2); ctx.fill();
    if (stage === 1) {
      // most panels on, some still in primer orange; the top section shows its ribs; no nose cone yet
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(-26, -70, 22, 18); ctx.fillRect(8, -150, 18, 22); ctx.fillRect(-26, -170, 16, 18);
      ctx.fillStyle = '#7d8591'; ctx.fillRect(-4, ty, 30, 40);
      ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-4, ty + 6 + k * 14); ctx.lineTo(26, ty + 6 + k * 14); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(10, ty); ctx.lineTo(10, ty + 40); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let yy = -30; yy > ty + 10; yy -= 24) ctx.fillRect(-26, yy, 52, 1.5);   // panel seams
      ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(0, ty + 1, 26, 4, 0, 0, Math.PI * 2); ctx.fill();   // the open top, waiting for the nose
      ctx.restore();
      return;
    }
    // finished and painted: red bands, a yellow stripe, the name down the side, a pizza badge and the hatch
    ctx.fillStyle = '#e4572e'; ctx.fillRect(-26, -70, 52, 10); ctx.fillRect(-26, -150, 52, 6); ctx.fillRect(-26, ty + 4, 52, 6);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(-26, -60, 52, 3); ctx.fillRect(-26, -144, 52, 2);
    ctx.fillStyle = '#3b7dd8'; ctx.font = '800 9px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ['P', 'I', 'Z', 'Z', 'A'].forEach((ch, i) => ctx.fillText(ch, -12, -132 + i * 11));
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(8, -168, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.arc(8, -168, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; for (const [dx, dy] of [[-2, -2], [2, 2], [-2, 3]]) { ctx.beginPath(); ctx.arc(8 + dx, -168 + dy, 1.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-18, ty + 14, 5, H - 104);   // a shine down the body
    // the hatch, low on the body: dark inside when open
    ctx.fillStyle = '#7d8591'; U.roundRect(ctx, -12, -54, 24, 38, 8); ctx.fill();
    ctx.fillStyle = (o.door || 0) > 0.5 ? '#2b1d14' : '#d9dde3'; U.roundRect(ctx, -10, -52, 20, 34, 7); ctx.fill();
    if (!((o.door || 0) > 0.5)) { ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(0, -42, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(5, -32, 3, 5); }
    this.drawNose(ctx, 0, ty, t, true);
    ctx.restore();
  },
  // the red nose cone, its round base centred at (x, y), 60 tall, with a blinking tip light
  drawNose(ctx, x, y, t, light) {
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 26, y + 2); ctx.quadraticCurveTo(x - 24, y - 40, x, y - 60); ctx.quadraticCurveTo(x + 24, y - 40, x + 26, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x - 12, y - 30, x - 2, y - 54); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = light && Math.floor(t * 1.5) % 2 ? '#ff3b3b' : 'rgba(255,59,59,0.35)'; ctx.beginPath(); ctx.arc(x, y - 62, 3.5, 0, Math.PI * 2); ctx.fill();
  },
  // flames under the engine bell (the rocket's feet are at 0, the flames reach down), `f` 0..1 how big
  drawFlame(ctx, f, t) {
    const len = 24 + 70 * f + Math.sin(t * 40) * 6 * f, w = 12 + 8 * f;
    for (const [k, col] of [[1, '#ff8c42'], [0.72, '#ffd166'], [0.42, '#fffbe0']]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w * k, -2); ctx.quadraticCurveTo(-w * k * 1.1, len * k * 0.5, 0, len * k + (k < 1 ? 0 : Math.sin(t * 23) * 4)); ctx.quadraticCurveTo(w * k * 1.1, len * k * 0.5, w * k, -2); ctx.closePath(); ctx.fill();
    }
  },
  // the scaffold tower beside the rocket: lattice legs, four decks with walkways to the rocket, a ladder on the right.
  // Once the rocket is finished the walkways swing up and away from it.
  drawScaffold(r, g) {
    const ctx = r.ctx, S = CFG.ISLANDS.ROCKET.SCAFFOLD, B = CFG.ISLANDS.ROCKET.BASE, y = S.y, top = y - S.h, sw = this.st ? this.st.swing : 0;
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3;
    for (const x of [S.x0, S.x1 - 10]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, top); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#b9bcc2';
    const deck = S.h / 4;
    for (let k = 0; k < 4; k++) { const ya = y - k * deck, yb = ya - deck; ctx.beginPath(); ctx.moveTo(S.x0, ya); ctx.lineTo(S.x1 - 10, yb); ctx.moveTo(S.x1 - 10, ya); ctx.lineTo(S.x0, yb); ctx.stroke(); }
    const armLen = S.x0 - (B.x + 20), a = -sw * Math.PI * 0.42;
    for (let k = 1; k <= 4; k++) {
      const dy = y - k * deck;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, dy - 3, S.x1 - S.x0 - 6, 6);                // the deck inside the tower
      // the walkway out to the rocket, hinged at the tower
      ctx.save(); ctx.translate(S.x0, dy); ctx.rotate(-a); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(-armLen, -3, armLen, 6); ctx.fillStyle = '#ffd166'; ctx.fillRect(-armLen, -3, 4, 6); ctx.restore();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(S.x0 - 2, dy - 18, S.x1 - S.x0 - 6, 2.5);        // a yellow handrail
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(S.x0 - 2, dy - 18, 2, 15); ctx.fillRect(S.x1 - 12, dy - 18, 2, 15);
    }
    // the ladder up the right side
    const lx = S.x1 - 4;
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx - 5, y); ctx.lineTo(lx - 5, top + 40); ctx.moveTo(lx + 5, y); ctx.lineTo(lx + 5, top + 40); ctx.stroke();
    ctx.lineWidth = 1.5; for (let yy = y - 6; yy > top + 40; yy -= 9) { ctx.beginPath(); ctx.moveTo(lx - 5, yy); ctx.lineTo(lx + 5, yy); ctx.stroke(); }
    // a work lamp on top, blinking (a green "go" light once it is finished)
    const done = sw > 0.99;
    ctx.fillStyle = done ? (Math.floor(g.time * 2) % 2 ? '#8ef0a0' : '#41b883') : (Math.floor(g.time * 2) % 2 ? '#ffd166' : '#b8862c'); ctx.beginPath(); ctx.arc(S.x0 + 8, top - 4, 4, 0, Math.PI * 2); ctx.fill();
  },
  // the tower crane: mast, jib out over the rocket, a trolley running along it and a hook that fetches panels
  // (stage 0), the nose cone (stage 1), or nothing: once the rocket is finished it turns its jib away to the east
  craneState(stage) {
    const R = CFG.ISLANDS.ROCKET, C = R.CRANE, B = R.BASE, P = R.PARTS, k = this.st.crane / CFG.ROCKETISLE.CRANE_PERIOD;
    const jibY = C.y - C.h + 10;
    if (stage >= 2) return { x: C.x - 90, hy: jibY + 30, load: false, jibY, ph: 'parked' };
    const nose = stage === 1, rest = nose ? jibY + 12 : jibY + 40;
    const low = nose ? P.y - 82 : P.y - 26, topY = nose ? B.y - CFG.ROCKETISLE.ROCKET_H + 60 - 74 : B.y - CFG.ROCKETISLE.ROCKET_H + 70;
    return Object.assign(this.craneCalc(k, P.x, B.x + 2, rest, low, topY, nose), { jibY, nose });
  },
  // Rocket #2's crane: panels up to the top, round and round (it never gets finished)
  crane2State() {
    const S2 = CFG.ISLANDS.ROCKET.SITE2, C = S2.CRANE, B = S2.BASE, P = S2.PARTS, k = this.st.s2.crane / CFG.ROCKETISLE.SITE2.CRANE_PERIOD, jibY = C.y - C.h + 10;
    return Object.assign(this.craneCalc(k, P.x, B.x + 2, jibY + 40, P.y - 26, B.y - CFG.ROCKETISLE.SITE2.H + 60, false), { jibY, nose: false });
  },
  // one round trip of a crane's hook (k 0..1): down to the pile, up, over to the rocket, lower, hold, raise, back, rest
  craneCalc(k, pileX, rocketX, rest, low, topY, nose) {
    const seg = [[0.12, 'down'], [0.24, 'up'], [0.4, 'over'], [0.5, 'lower'], [0.64, 'hold'], [0.74, 'raise'], [0.9, 'back'], [1, 'rest']];
    let i = 0; while (i < seg.length - 1 && k > seg[i][0]) i++;
    const a = i ? seg[i - 1][0] : 0, q = U.clamp((k - a) / (seg[i][0] - a), 0, 1), e = q * q * (3 - 2 * q), ph = seg[i][1];
    let x = pileX, hy = rest, load = nose;
    if (ph === 'down') { hy = U.lerp(rest, low, e); }
    else if (ph === 'up') { hy = U.lerp(low, rest, e); load = true; }
    else if (ph === 'over') { x = U.lerp(pileX, rocketX, e); load = true; }
    else if (ph === 'lower') { x = rocketX; hy = U.lerp(rest, topY, e); load = true; }
    else if (ph === 'hold') { x = rocketX; hy = topY; load = true; }
    else if (ph === 'raise') { x = rocketX; hy = U.lerp(topY, rest, e); }
    else if (ph === 'back') { x = U.lerp(rocketX, pileX, e); }
    return { x, hy, load, ph };
  },
  drawCrane(r, g) {
    const R = CFG.ISLANDS.ROCKET, stage = this.stage(g);
    this.drawCraneAt(r, g, R.CRANE, this.craneState(stage), R.BASE.x - 40, R.CRANE.x + 70, stage >= 2, '#e0ac69');
  },
  drawCrane2(r, g) {
    const S2 = CFG.ISLANDS.ROCKET.SITE2;
    this.drawCraneAt(r, g, S2.CRANE, this.crane2State(), S2.BASE.x - 40, S2.CRANE.x + 44, false, '#8d5524');
  },
  // a tower crane at C: mast, jib from jx0 to the counter-jib's end jx1, a trolley running along it and a hook carrying
  // cs's load; `parked`: turned round to point the other way, with a pennant
  drawCraneAt(r, g, C, cs, jx0, jx1, parked, driver) {
    const ctx = r.ctx, top = cs.jibY;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x - 22, C.y + 10, 48, 10);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, C.x - 22, C.y - 6, 44, 22, 4); ctx.fill();
    // the mast: two yellow rails with zigzag bracing
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C.x - 8, C.y - 4); ctx.lineTo(C.x - 8, top); ctx.moveTo(C.x + 8, C.y - 4); ctx.lineTo(C.x + 8, top); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = C.y - 4, k = 0; y > top; y -= 16, k++) { ctx.moveTo(C.x + (k % 2 ? 8 : -8), y); ctx.lineTo(C.x + (k % 2 ? -8 : 8), y - 16); } ctx.stroke();
    // parked: the whole top turns round, so the jib points the other way, away from the rocket's way up
    ctx.save(); if (parked) { ctx.translate(C.x, 0); ctx.scale(-1, 1); ctx.translate(-C.x, 0); }
    // the jib out to the left over the rocket, the counter-jib with its weight to the right
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(jx0, top); ctx.lineTo(jx1, top); ctx.moveTo(jx0 + 20, top + 10); ctx.lineTo(C.x, top + 10); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = jx0 + 20, k = 0; x < C.x; x += 14, k++) { ctx.moveTo(x, top + (k % 2 ? 0 : 10)); ctx.lineTo(x + 14, top + (k % 2 ? 10 : 0)); } ctx.stroke();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C.x, top - 30); ctx.lineTo(jx0 + 10, top); ctx.moveTo(C.x, top - 30); ctx.lineTo(jx1 - 6, top); ctx.stroke();
    ctx.fillStyle = '#f2b705'; ctx.fillRect(C.x - 3, top - 32, 6, 32);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(jx1 - 30, top + 2, 28, 18);   // counterweight
    // the cab with its driver
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, C.x + 10, top + 4, 22, 20, 4); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(C.x + 13, top + 7, 16, 9);
    ctx.fillStyle = driver; ctx.beginPath(); ctx.arc(C.x + 21, top + 13, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(C.x + 21, top + 11, 4.5, Math.PI, 0); ctx.fill();
    // trolley, cable, hook and whatever it carries
    ctx.fillStyle = '#3e424a'; ctx.fillRect(cs.x - 7, top - 3, 14, 7);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cs.x - 2, top + 4); ctx.lineTo(cs.x - 2, cs.hy); ctx.moveTo(cs.x + 2, top + 4); ctx.lineTo(cs.x + 2, cs.hy); ctx.stroke();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, cs.x - 5, cs.hy - 2, 10, 8, 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cs.x, cs.hy + 10, 4, 0, Math.PI); ctx.stroke();
    if (cs.load && cs.nose) {
      // the nose cone hangs in two slings, tip up
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cs.x, cs.hy + 12); ctx.lineTo(cs.x - 18, cs.hy + 54); ctx.moveTo(cs.x, cs.hy + 12); ctx.lineTo(cs.x + 18, cs.hy + 54); ctx.stroke();
      this.drawNose(ctx, cs.x, cs.hy + 76, g.time, false);
    } else if (cs.load) { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cs.x, cs.hy + 12); ctx.lineTo(cs.x - 12, cs.hy + 22); ctx.moveTo(cs.x, cs.hy + 12); ctx.lineTo(cs.x + 12, cs.hy + 22); ctx.stroke(); ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, cs.x - 14, cs.hy + 22, 28, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cs.x - 12, cs.hy + 24, 24, 3); ctx.fillStyle = '#c9ccd2'; for (const dx of [-9, 9]) { ctx.beginPath(); ctx.arc(cs.x + dx, cs.hy + 34, 1.6, 0, Math.PI * 2); ctx.fill(); } }
    if (parked) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(jx0, top); ctx.lineTo(jx0 - 18, top - 7 + Math.sin(g.time * 4) * 2); ctx.lineTo(jx0, top - 14); ctx.closePath(); ctx.fill(); }   // a pennant on the jib's end
    ctx.restore();
  },
  drawTruck(r, g) {
    const ctx = r.ctx, T = CFG.ISLANDS.ROCKET.TRUCK, x = T.x, y = T.y;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 12, 52, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (const dx of [-30, 18, 34]) { ctx.beginPath(); ctx.arc(x + dx, y + 6, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(x + dx, y + 6, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; }
    // the cab faces west
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 48, y - 32, 30, 34, 6); ctx.fill(); ctx.fillStyle = '#bfe3ff'; U.roundRect(ctx, x - 44, y - 28, 14, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x - 34, y - 36, 4, 0, Math.PI * 2); ctx.fill();   // the roof light (its glow blinks live)
    // the round tank with FUEL on it
    ctx.fillStyle = '#f5f7fa'; U.roundRect(ctx, x - 16, y - 34, 64, 34, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x - 12, y - 10, 56, 4);
    ctx.fillStyle = '#41b883'; ctx.fillRect(x - 16, y - 22, 64, 9);
    ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ROCKET FUEL', x + 16, y - 17);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 16, y - 2, 64, 6);
  },
  drawParts(r, g) {
    const ctx = r.ctx, P = CFG.ISLANDS.ROCKET.PARTS, x = P.x, y = P.y, n = 3 - this.stage(g);   // the pile shrinks as the rocket grows
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 34, y + 6, 72, 8);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 34, y - 6, 68, 14); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 34, y, 68, 2);   // a pallet
    for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#ff8c42' : '#d9dde3'; U.roundRect(ctx, x - 30 + k * 4, y - 14 - k * 7, 44, 8, 2); ctx.fill(); }   // a stack of panels
    ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + 22, y - 6 - k * 7, 4, 0, Math.PI * 2); ctx.fill(); }   // pipes, end on
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, x + 14, y - 34, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BOLTS', x + 23, y - 28);
  },
  // a little worker: hi-vis vest, hard hat; carries a panel, climbs, welds behind a visor; waves and cheers with a hop
  drawWorker(r, g, w) {
    const ctx = r.ctx, x = w.x, y = w.y - w.z - (w.hop || 0), s = 0.82, climbing = w.role === 'climb' && w.z > 0 && w.pause <= 0;
    if (w.hop > 0.5) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, w.y - w.z + 2, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (climbing) {
      // seen from behind on the ladder: hands and feet taking turns
      const k = Math.sin(w.bob * 1.5) * 4;
      ctx.fillStyle = '#3a3f5c'; U.roundRect(ctx, -8, -12 + k, 6, 14, 3); ctx.fill(); U.roundRect(ctx, 2, -12 - k, 6, 14, 3); ctx.fill();
      ctx.fillStyle = w.shirt; U.roundRect(ctx, -12, -32, 24, 24, 8); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(-12, -22, 24, 3);
      ctx.fillStyle = w.skin; ctx.beginPath(); ctx.arc(-13, -34 - k, 3.5, 0, Math.PI * 2); ctx.arc(13, -34 + k, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -40, 10, 0, Math.PI * 2); ctx.fill();
    } else {
      r.drawPerson(0, 0, { shirt: w.shirt, stripes: true, skin: w.skin, hair: '#2b1d14', hairStyle: 0, facing: w.facing, moving: w.moving, bob: w.bob, carry: 0, pants: '#3a3f5c' });
      if (w.weld) { ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -9 + w.facing * 3, -44, 16, 11, 3); ctx.fill(); ctx.fillStyle = '#4dd0e1'; ctx.fillRect(-6 + w.facing * 3, -41, 10, 3); ctx.fillStyle = '#5c6670'; U.roundRect(ctx, w.facing * 12 - 3, -20, 8, 5, 2); ctx.fill(); }   // visor and torch
      if (w.role === 'carry' && w.carrying) { ctx.fillStyle = '#ff8c42'; U.roundRect(ctx, -16, -34, 32, 14, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-14, -32, 28, 3); }
      if (w.role === 'boss') { ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, w.facing * 8 - 6, -30, 12, 15, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(w.facing * 8 - 4, -27, 8, 10); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(w.facing * 8 - 3, -25 + k * 3, 6, 1); }
      if ((w.role === 'climb' || w.role === 'hammer') && w.bang > 0) { ctx.fillStyle = '#3e424a'; U.roundRect(ctx, w.facing < 0 ? -24 : 14, -30, 10, 6, 2); ctx.fill(); }   // the hammer, mid-bang
    }
    // the hard hat
    ctx.fillStyle = w.hat; ctx.beginPath(); ctx.arc(0, -42, 11.5, Math.PI, 0); ctx.fill();
    U.roundRect(ctx, -14, -43, 28, 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-1.5, -53, 3, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-4, -48, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  // ---------- Rocket #2 ----------
  // Rocket #2, side on, feet at (x, y): panelled up past its open hatch, a bare frame above, one fin in primer and one
  // still bare metal, wires hanging out of the hatch, "#2" on the side. It stays like this for ever.
  drawRocket2(ctx, x, y, t) {
    const H = CFG.ROCKETISLE.SITE2.H, ty = -H, hb = -(CFG.ROCKETISLE.SITE2.DECKS[1].z + 26), pt = hb - 52;   // the hatch's sill (just above the top walkway), the panels' top
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(6, 2, 44, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(14, -16); ctx.lineTo(20, 0); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill();   // engine bell
    for (const d of [-1, 1]) { ctx.fillStyle = d < 0 ? '#ff8c42' : '#9aa0a8'; ctx.beginPath(); ctx.moveTo(d * 24, -80); ctx.lineTo(d * 46, -24); ctx.lineTo(d * 46, 0); ctx.lineTo(d * 24, -18); ctx.closePath(); ctx.fill(); }
    // the frame: dark inside, four rails, rings every 20 px, cross braces
    ctx.fillStyle = 'rgba(46,50,58,0.65)'; U.roundRect(ctx, -26, ty, 52, H - 14, 6); ctx.fill();
    ctx.strokeStyle = '#b9bcc2'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let yy = -14, k = 0; yy > ty + 10; yy -= 20, k++) { ctx.moveTo(-24, yy); ctx.lineTo(-8, yy - 20); ctx.moveTo(8, yy - (k % 2 ? 0 : 20)); ctx.lineTo(24, yy - (k % 2 ? 20 : 0)); }
    ctx.stroke();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.beginPath(); for (const rx of [-25, -8, 8, 25]) { ctx.moveTo(rx, -14); ctx.lineTo(rx, ty); } ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); for (let yy = -14; yy >= ty; yy -= 20) { ctx.moveTo(-26, yy); ctx.lineTo(26, yy); } ctx.stroke();
    // panels: all the way round low down, up past the hatch on the left, a few patches higher up
    const bg = ctx.createLinearGradient(-26, 0, 26, 0); bg.addColorStop(0, '#d9dde3'); bg.addColorStop(0.35, '#ffffff'); bg.addColorStop(1, '#c9ccd2');
    ctx.fillStyle = bg; ctx.fillRect(-26, pt, 52, -14 - pt); ctx.fillRect(-26, pt - 24, 22, 24);
    ctx.fillStyle = '#ff8c42'; ctx.fillRect(4, -150, 22, 20); ctx.fillRect(-26, -110, 18, 22); ctx.fillRect(8, pt - 20, 18, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let yy = -34; yy > pt; yy -= 22) ctx.fillRect(-26, yy, 52, 1.5);
    ctx.fillStyle = '#7d8591'; for (let yy = -40; yy > pt; yy -= 22) for (const bx of [-22, 22]) { ctx.beginPath(); ctx.arc(bx, yy, 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-18, pt + 4, 4, -24 - pt);
    // "#2" in blue beside the hatch, and the open top ring waiting for more frame
    ctx.fillStyle = '#3b7dd8'; ctx.font = '800 13px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('#2', 19, hb - 30);
    ctx.fillStyle = '#7d8591'; ctx.beginPath(); ctx.ellipse(0, ty, 26, 4, 0, 0, Math.PI * 2); ctx.fill();
    // the open hatch: a warm work light inside, wires spilling out, its door swung open to the right
    ctx.fillStyle = '#7d8591'; U.roundRect(ctx, -14, hb - 46, 28, 46, 9); ctx.fill();
    ctx.fillStyle = '#1a1f29'; U.roundRect(ctx, -11, hb - 43, 22, 40, 8); ctx.fill();
    const glow = 0.3 + 0.08 * Math.sin(t * 3); ctx.fillStyle = `rgba(255,209,102,${glow.toFixed(3)})`; ctx.beginPath(); ctx.arc(0, hb - 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const [col, dx, sag] of [['#e4572e', -5, 14], ['#ffd166', 1, 20], ['#4dd0e1', 6, 11]]) { const sw = Math.sin(t * 1.6 + dx) * 2; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(dx, hb - 6); ctx.quadraticCurveTo(dx + sw, hb - 6 + sag, dx + 4 + sw, hb + 2 + sag * 0.6); ctx.stroke(); }
    ctx.fillStyle = '#d9dde3'; U.roundRect(ctx, 14, hb - 43, 7, 40, 3); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(17.5, hb - 30, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // a walkway's planks seen from above (with a darker strip at the back where the workers stand) and its striped edge
  drawDeck(ctx, D) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(D.x0 + 4, D.yb + 6, D.x1 - D.x0, D.yf - D.yb + 6);
    ctx.fillStyle = '#b98a55'; ctx.fillRect(D.x0, D.yb, D.x1 - D.x0, D.yf - D.yb);
    ctx.fillStyle = '#a77a48'; ctx.fillRect(D.x0, D.yb, D.x1 - D.x0, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.13)'; for (let x = D.x0 + 12; x < D.x1; x += 12) ctx.fillRect(x, D.yb, 1.5, D.yf - D.yb);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(D.x0, D.yb, D.x1 - D.x0, 2);
    ctx.save(); ctx.beginPath(); ctx.rect(D.x0, D.yf, D.x1 - D.x0, 7); ctx.clip();
    for (let x = D.x0 - 14; x < D.x1; x += 14) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x, D.yf, 14, 7); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x, D.yf); ctx.lineTo(x + 7, D.yf); ctx.lineTo(x + 14, D.yf + 7); ctx.lineTo(x + 7, D.yf + 7); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },
  drawLadder(ctx, x, y0, y1) {
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 6, y0); ctx.lineTo(x - 6, y1); ctx.moveTo(x + 6, y0); ctx.lineTo(x + 6, y1); ctx.stroke();
    ctx.lineWidth = 1.8; for (let yy = y0 - 6; yy > y1 + 2; yy -= 9) { ctx.beginPath(); ctx.moveTo(x - 6, yy); ctx.lineTo(x + 6, yy); ctx.stroke(); }
  },
  // the scaffold round Rocket #2: poles, braces in the end bays, the two walkways and the two ladders, a work lamp
  drawScaffold2(r, g) {
    const ctx = r.ctx, G = this.geo(), B = G.B, D1 = G.D[1], D2 = G.D[2], line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
    ctx.lineCap = 'butt';
    // back poles and the back handrail (it stops short of the rocket)
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3;
    for (const x of [D1.x0 + 4, D1.x1 - 4]) line(x, B.y - 30, x, D1.yb - 26);
    for (const x of [D2.x0 + 4, D2.x1 - 4]) line(x, D1.yb, x, D2.yb - 26);
    ctx.fillStyle = '#ffd166';
    for (const [D, gap] of [[D1, 36], [D2, 34]]) { ctx.fillRect(D.x0, D.yb - 22, B.x - gap - D.x0, 2.5); ctx.fillRect(B.x + gap, D.yb - 22, D.x1 - B.x - gap, 2.5); }
    // the lower bays: front poles from the sand up to the first walkway, crossed braces at both ends
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3;
    for (const x of [D1.x0 + 4, D1.x0 + 34, D1.x1 - 34, D1.x1 - 4]) line(x, B.y + 30, x, D1.yf + 6);
    ctx.strokeStyle = '#b9bcc2'; ctx.lineWidth = 1.5;
    for (const [xa, xb] of [[D1.x0 + 4, D1.x0 + 34], [D1.x1 - 34, D1.x1 - 4]]) { line(xa, B.y + 30, xb, D1.yf + 6); line(xb, B.y + 30, xa, D1.yf + 6); }
    // the upper bays: from the first walkway's back up to the second, crossed too
    for (const [xa, xb] of [[D2.x0 + 4, D2.x0 + 26], [D2.x1 - 26, D2.x1 - 4]]) { line(xa, D1.yb, xb, D2.yf + 6); line(xb, D1.yb, xa, D2.yf + 6); }
    this.drawDeck(ctx, D1);
    this.drawDeck(ctx, D2);
    // a toolbox and a coil of cable on the walkways' back strips
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, D1.x1 - 40, D1.yb + 1, 20, 10, 2); ctx.fill(); ctx.fillStyle = '#5c6670'; ctx.fillRect(D1.x1 - 34, D1.yb - 2, 8, 3);
    ctx.strokeStyle = '#41b883'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(D2.x1 - 22, D2.yb + 7, 8, 4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(D2.x1 - 22, D2.yb + 7, 5, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    // the ladders: from the sand up to the first walkway on the left, from it up to the second on the right
    this.drawLadder(ctx, G.L1.x, G.L1.y0, G.L1.y1);
    this.drawLadder(ctx, G.L2.x, G.L2.y0, G.L2.y1);
    // a work lamp on a pole at the top, blinking
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(D2.x0 + 2, D2.yb - 60, 3, 36);
    ctx.fillStyle = Math.floor(g.time * 2) % 2 ? '#ffd166' : '#b8862c'; ctx.beginPath(); ctx.arc(D2.x0 + 3.5, D2.yb - 62, 5, 0, Math.PI * 2); ctx.fill();
  },
  // the walkways' front railings (after the chef: they stand on the planks behind them) and the ROCKET #2 banner
  drawScaffold2Front(r, g) {
    const ctx = r.ctx, G = this.geo(), B = G.B, D1 = G.D[1], D2 = G.D[2];
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.lineCap = 'butt';
    for (const x of [D2.x0 + 4, D2.x1 - 4]) { ctx.beginPath(); ctx.moveTo(x, D1.yf); ctx.lineTo(x, D2.yf); ctx.stroke(); }   // the upper walkway's front poles
    for (const D of [D1, D2]) {
      ctx.fillStyle = '#9aa0a8'; for (let x = D.x0 + 2; x <= D.x1 - 2; x += (D.x1 - D.x0 - 4) / Math.round((D.x1 - D.x0) / 44)) ctx.fillRect(x - 1.5, D.yf - 26, 3, 26);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(D.x0, D.yf - 27, D.x1 - D.x0, 3.5); ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.fillRect(D.x0, D.yf - 14, D.x1 - D.x0, 2.5);
    }
    // the banner hanging from the lower walkway's edge
    const bw = 88, bx = B.x - bw / 2, by = D1.yf + 5;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(bx + 6, D1.yf + 2, 2, 5); ctx.fillRect(bx + bw - 8, D1.yf + 2, 2, 5);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, bx, by, bw, 20, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ROCKET #2', B.x, by + 10.5);
  },
  // panels stacked on a pallet (`bolts`: with the box of bolts on top)
  drawPanels(r, x, y, n, bolts) {
    const ctx = r.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 34, y + 6, 72, 8);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 34, y - 6, 68, 14); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 34, y, 68, 2);
    for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#ff8c42' : '#d9dde3'; U.roundRect(ctx, x - 30 + (k % 2) * 4, y - 14 - k * 7, 56, 8, 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 30 + (k % 2) * 4, y - 8 - k * 7, 56, 2); }
    if (bolts) { ctx.fillStyle = '#5c6670'; U.roundRect(ctx, x + 10, y - 22 - n * 7, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BOLTS', x + 19, y - 16 - n * 7); }
  },
  // the tool shed: a little blue hut with a sloping tin roof, its door open on the tools
  drawShed(r, g) {
    const ctx = r.ctx, SH = CFG.ISLANDS.ROCKET.SITE2.SHED, x0 = SH.x - SH.w / 2, y0 = SH.y - SH.h / 2, w = SH.w, h = SH.h;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0 + 5, y0 + 8, w, h);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(x0 + 2, y0 + 16, w - 4, h - 16);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = x0 + 8; x < x0 + w - 4; x += 8) ctx.fillRect(x, y0 + 16, 1.5, h - 16);
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(x0 - 4, y0 + 20); ctx.lineTo(x0 + 6, y0 - 6); ctx.lineTo(x0 + w - 6, y0 - 6); ctx.lineTo(x0 + w + 4, y0 + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = x0 + 4; x < x0 + w; x += 9) ctx.fillRect(x, y0 - 4, 2, 22);
    // the open door with a spade and a saw hanging inside, and a sign
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(SH.x - 12, y0 + 24, 24, h - 24);
    ctx.strokeStyle = '#c9975f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(SH.x - 6, y0 + 28); ctx.lineTo(SH.x - 6, y0 + 44); ctx.stroke(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(SH.x - 9, y0 + 42, 6, 6);
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(SH.x + 2, y0 + 30); ctx.lineTo(SH.x + 9, y0 + 30); ctx.lineTo(SH.x + 9, y0 + 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a9be6'; ctx.fillRect(SH.x + 12, y0 + 24, 7, h - 24);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x0 + 6, y0 + 20, 22, 11, 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔧', x0 + 17, y0 + 26);
    // a wheelbarrow by the door
    const wx = x0 + w - 12, wy = y0 + h + 4;
    ctx.fillStyle = '#41b883'; ctx.beginPath(); ctx.moveTo(wx - 12, wy - 10); ctx.lineTo(wx + 10, wy - 10); ctx.lineTo(wx + 6, wy - 2); ctx.lineTo(wx - 8, wy - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(wx + 6, wy, 3, 0, Math.PI * 2); ctx.fill();
  },
  // the peek through the hatch, in screen space: the half-built cabin, its wires, and a worker inside who waves
  screen(r, g) {
    const st = this.st;
    if (!st || !st.peek || g.area !== 'islands') return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, t = g.time, pk = st.peek;
    const a = Math.min(1, pk.t / 0.25, (CFG.ROCKETISLE.SITE2.PEEK - pk.t) / 0.3);
    if (a <= 0) return;
    const pw = Math.min(W - 32, 400), s = pw / 380, ph = 236 * s, x = (W - pw) / 2, y = Math.max(80, (H - ph) / 2 - 60);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,24,34,0.35)'; ctx.fillRect(0, 0, W, H);
    ctx.translate(x, y + (1 - a) * 20); ctx.scale(s, s);
    // the hatch's frame, with rivets
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, 6, 10, 380, 236, 30); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, 0, 0, 380, 236, 30); ctx.fill();
    ctx.fillStyle = '#7d8591'; U.roundRect(ctx, 6, 6, 368, 224, 26); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 12; i++) { const px = 22 + i * 30.5; ctx.beginPath(); ctx.arc(px, 9, 2.5, 0, Math.PI * 2); ctx.arc(px, 227, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); U.roundRect(ctx, 14, 14, 352, 208, 20); ctx.clip();
    // the cabin: dark walls with ribs, a metal floor, a work lamp hanging from the ceiling
    const wall = ctx.createLinearGradient(0, 14, 0, 222); wall.addColorStop(0, '#24303f'); wall.addColorStop(1, '#3a4a5e'); ctx.fillStyle = wall; ctx.fillRect(14, 14, 352, 208);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let rx = 34; rx < 366; rx += 44) ctx.fillRect(rx, 14, 8, 170);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(14, 184, 352, 38); ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let fx = 14; fx < 366; fx += 32) ctx.fillRect(fx, 184, 1.5, 38);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(14, 184, 352, 2);
    const lg = ctx.createRadialGradient(190, 40, 4, 190, 40, 150); lg.addColorStop(0, 'rgba(255,224,138,0.45)'); lg.addColorStop(1, 'rgba(255,224,138,0)'); ctx.fillStyle = lg; ctx.fillRect(14, 14, 352, 208);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(190 + Math.sin(t * 1.4) * 3, 14); ctx.lineTo(190 + Math.sin(t * 1.4) * 6, 32); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(190 + Math.sin(t * 1.4) * 6, 36, 7, 0, Math.PI * 2); ctx.fill();
    // two seats: one with its cushion on, one still a bare frame
    const seat = (sx, done) => {
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(sx - 3, 166, 6, 20); ctx.fillRect(sx - 18, 184, 36, 4);
      if (done) { ctx.fillStyle = '#e4572e'; U.roundRect(ctx, sx - 18, 116, 30, 46, 8); ctx.fill(); U.roundRect(ctx, sx - 20, 150, 40, 18, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(sx - 14, 120, 4, 36); }
      else { ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; U.roundRect(ctx, sx - 18, 116, 30, 46, 8); ctx.stroke(); U.roundRect(ctx, sx - 20, 150, 40, 18, 6); ctx.stroke(); }
    };
    seat(66, true); seat(126, false);
    // the control panel: a screen showing a pizza, blinking lights, a gap where buttons will go
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, 246, 74, 100, 84, 8); ctx.fill();
    ctx.fillStyle = '#1a1f29'; U.roundRect(ctx, 256, 84, 44, 32, 4); ctx.fill();
    r.drawPizza(278, 100, 10);
    for (let i = 0; i < 4; i++) { const on = Math.sin(t * (3 + i) + i * 1.7) > 0; ctx.fillStyle = on ? ['#8ef0a0', '#ffd166', '#4dd0e1', '#ff6b6b'][i] : 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(314 + (i % 2) * 18, 92 + Math.floor(i / 2) * 18, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); U.roundRect(ctx, 258, 126, 76, 22, 4); ctx.stroke(); ctx.setLineDash([]);
    // wires dangling from the ceiling and out of the panel
    ctx.lineCap = 'round'; ctx.lineWidth = 3;
    for (const [col, x0, x1, sag, ph2] of [['#e4572e', 230, 262, 70, 0], ['#ffd166', 238, 284, 92, 1.3], ['#4dd0e1', 300, 330, 60, 2.1], ['#41b883', 160, 140, 64, 0.7]]) {
      const sw = Math.sin(t * 1.8 + ph2) * 5; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x0, 14); ctx.quadraticCurveTo((x0 + x1) / 2 + sw, 14 + sag * 1.6, x1 + sw * 0.5, 14 + sag); ctx.stroke();
    }
    ctx.strokeStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(296, 158); ctx.quadraticCurveTo(300 + Math.sin(t * 2) * 4, 186, 284, 196); ctx.stroke();
    // a toolbox on the floor
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, 102, 196, 38, 18, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(114, 190, 14, 4); ctx.fillStyle = '#ffd166'; ctx.fillRect(102, 202, 38, 3);
    // the worker inside, hopping and waving
    const hop = Math.abs(Math.sin(t * 9)) * 6;
    ctx.save(); ctx.translate(196, 206); ctx.scale(1.45, 1.45);
    this.drawWorker(r, g, { x: 0, y: 0, z: 0, hop, facing: -1, moving: false, bob: 0, role: 'peek', weld: 0, hat: '#ffd166', shirt: '#ff8c42', skin: '#e0ac69' });
    ctx.restore();
    r.drawBubble(196, 206 - hop * 1.45 - 98, () => { ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👋', 0, 0); }, 36);
    ctx.restore();
    // a little plate on the frame
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, 130, -6, 120, 20, 6); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚀 ROCKET #2', 190, 4.5);
    ctx.restore();
  },

  // ---------- the flight, full screen ----------
  // Going up: the islands shrink below, clouds rush past, the sky turns dark and starry, the Earth falls away behind
  // and a little pizza-shaped moon comes closer. Flying home plays the same trip backwards: the moon falls away, the
  // Earth grows, the sky turns blue again and the islands come up to meet the rocket, which turns tail-first to land.
  hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  mix(a, b, k) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
  },
  travel: {
    rocket(r, g, W, H) {
      const E = RocketExt, ctx = r.ctx, tr = g.travel, t = g.time, home = tr.to !== 'moon';
      const k = U.clamp(tr.t / tr.dur, 0, 1), ease = k < 0.08 ? k / 0.08 : k > 0.92 ? (1 - k) / 0.08 : 1;
      const q = home ? 1 - k : k, dir = home ? -1 : 1;   // q: how far from the Earth (0 on the pad, 1 at the moon)
      const sm = (a, b, v) => { const x = U.clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
      const dark = sm(0.1, 0.4, q), M = Math.min(W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, E.mix('#3f9fe6', '#05061a', dark)); sky.addColorStop(1, E.mix('#d9f0ff', '#141a3a', dark));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // stars, drifting past the way we are not going
      const sa = sm(0.18, 0.45, q);
      if (sa > 0) for (let i = 0; i < 140; i++) {
        const x = E.hash(i) * W, y = ((E.hash(i + 500) * H + tr.t * (14 + E.hash(i + 900) * 30) * dir) % H + H) % H, tw = 0.6 + 0.4 * Math.sin(t * 3 + i);
        ctx.fillStyle = `rgba(255,255,240,${(sa * tw).toFixed(3)})`; ctx.fillRect(x, y, i % 9 === 0 ? 2.5 : 1.5, i % 9 === 0 ? 2.5 : 1.5);
      }
      // the Earth: a huge sea with the islands at first, then a blue ball shrinking away into the corner
      const R = Math.exp(U.lerp(Math.log(9000), Math.log(M * 0.075), sm(0.04, 0.85, q)));
      const cx = U.lerp(W / 2, W * 0.18, sm(0.3, 0.9, q)), yTop = U.lerp(H * 0.72, H * 0.88 - 2 * M * 0.075, sm(0.3, 0.9, q)), cy = yTop + R;
      E.sceneEarth(r, ctx, cx, cy, R, yTop, t);
      // clouds whoosh past low in the sky
      const ca = 1 - sm(0.12, 0.32, q);
      if (ca > 0) {
        const cloud = (x, y, s) => { ctx.beginPath(); ctx.arc(x, y, 18 * s, 0, Math.PI * 2); ctx.arc(x + 20 * s, y - 10 * s, 24 * s, 0, Math.PI * 2); ctx.arc(x + 46 * s, y, 17 * s, 0, Math.PI * 2); ctx.arc(x + 24 * s, y + 6 * s, 20 * s, 0, Math.PI * 2); ctx.fill(); };
        ctx.fillStyle = `rgba(255,255,255,${(0.9 * ca).toFixed(3)})`;
        for (let i = 0; i < 9; i++) { const span = H + 300, y = ((E.hash(i + 40) * span + tr.t * (260 + E.hash(i) * 200) * dir) % span + span) % span - 150; cloud(E.hash(i + 70) * W - 40, y, 1 + E.hash(i + 3) * 1.2); }
      }
      // Pizza Moon, coming closer
      if (q > 0.4) {
        const mq = sm(0.42, 1, q), mr = Math.exp(U.lerp(Math.log(5), Math.log(M * 0.42), mq));
        E.sceneMoon(r, ctx, U.lerp(W * 0.8, W * 0.62, mq), U.lerp(H * 0.16, H * 0.26, mq), mr, t);
      }
      // the rocket: nose up while it climbs (or lands tail-first), aimed at the moon or the Earth out in space
      const sc = Math.min(0.75, M / 640), rx = W * 0.44, ry = H * 0.6 + Math.sin(t * 2.2) * 5;
      const aimMoon = 0.45, aimEarth = Math.atan2(cx - rx, -(cy - R * 0.2 - ry));
      const ang = home ? aimEarth * sm(0.3, 0.6, q) : aimMoon * sm(0.45, 0.7, q);
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(ang); ctx.translate(0, CFG.ROCKETISLE.ROCKET_H * sc / 2);
      // exhaust puffs trailing behind
      for (let i = 0; i < 8; i++) { const age = ((t * 2 + i * 0.37) % 3) / 3; ctx.fillStyle = `rgba(${dark > 0.6 ? '255,210,140' : '255,255,255'},${(0.6 * (1 - age)).toFixed(3)})`; ctx.beginPath(); ctx.arc(Math.sin(i * 2.1) * 8 * age * sc * 3, (60 + age * 260) * sc, (8 + age * 26) * sc, 0, Math.PI * 2); ctx.fill(); }
      E.drawRocket(ctx, 0, 0, t, sc, 2, { flame: 1, noShadow: true, chef: true });
      ctx.restore();
      // banner and progress bar, like the other rides
      const msg = home ? '🚀 Next stop: Rocket Island! 🏝️' : '🚀 Next stop: Pizza Moon! 🌙';
      ctx.fillStyle = 'rgba(43,29,20,0.85)'; const bw = Math.min(W - 24, 380); U.roundRect(ctx, W / 2 - bw / 2, 60, bw, 44, 12); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(bw < 320 ? 14 : 17); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(msg, W / 2, 82);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, bw - 32, 6, 3); ctx.fill();
      ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, W / 2 - bw / 2 + 16, 110, (bw - 32) * k, 6, 3); ctx.fill();
      if (ease < 1) { ctx.fillStyle = `rgba(5,6,26,${(1 - ease).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    },
  },
  // the Earth as a circle (centre cx,cy, radius R; yTop its top edge): sea, continents, clouds, and the islands
  // around the top point, drawn at a size that shrinks with R (full size when R is 9000)
  sceneEarth(r, ctx, cx, cy, R, yTop, t) {
    if (R < 4000) { ctx.fillStyle = 'rgba(120,200,255,0.25)'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.08 + 4, 0, Math.PI * 2); ctx.fill(); }   // a glow of air round it
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const sea = ctx.createLinearGradient(0, yTop, 0, yTop + Math.min(R * 2, 1200)); sea.addColorStop(0, '#3fa7e8'); sea.addColorStop(1, '#1d5fa8'); ctx.fillStyle = sea; ctx.fillRect(cx - R - 2, yTop - 2, R * 2 + 4, R * 2 + 4);
    // continents and clouds, placed as fractions of the radius
    ctx.fillStyle = '#5fb35a';
    for (const [fx, fy, fr] of [[-0.45, -0.3, 0.32], [-0.2, -0.45, 0.2], [0.42, 0.05, 0.3], [0.3, -0.38, 0.16], [-0.3, 0.35, 0.26], [0.1, 0.5, 0.18]]) { ctx.beginPath(); ctx.ellipse(cx + fx * R, cy + fy * R, fr * R, fr * R * 0.7, fx * 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [fx, fy, fr] of [[-0.1, -0.2, 0.22], [0.5, -0.3, 0.12], [-0.55, 0.15, 0.15], [0.25, 0.3, 0.2]]) { ctx.beginPath(); ctx.ellipse(cx + fx * R, cy + fy * R, fr * R, fr * R * 0.25, 0.3, 0, Math.PI * 2); ctx.fill(); }
    // the islands, right under the rocket at the start
    const s = R / 9000;
    if (s > 0.004) {
      const isle = (dx, dy, w, h, col) => { ctx.fillStyle = '#f2d98d'; ctx.beginPath(); ctx.ellipse(cx + dx * s, yTop + dy * s, w * s, h * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + dx * s, yTop + dy * s - 2 * s, w * s * 0.8, h * s * 0.7, 0, 0, Math.PI * 2); ctx.fill(); };
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(cx, yTop + 120 * s, 620 * s, 120 * s, 0, 0, Math.PI * 2); ctx.fill();   // shallows
      isle(-380, 90, 120, 50, '#79c35a'); isle(-160, 150, 90, 38, '#f2d98d'); isle(120, 70, 70, 30, '#79c35a'); isle(330, 140, 100, 42, '#79c35a'); isle(-30, 40, 40, 18, '#79c35a');
      // Rocket Island with its grey pad, right in the middle
      isle(0, 120, 110, 46, '#f2d98d'); ctx.fillStyle = '#b9bcc2'; ctx.fillRect(cx - 22 * s, yTop + 104 * s, 44 * s, 30 * s);
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(cx + 34 * s, yTop + 128 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      if (s > 0.25) { ctx.fillStyle = '#3f9a4a'; for (const [px, py] of [[-400, 80], [-360, 100], [330, 128], [360, 150], [-170, 146], [130, 64]]) { ctx.beginPath(); ctx.arc(cx + px * s, yTop + py * s, 9 * s, 0, Math.PI * 2); ctx.fill(); } }
    }
    // the night side: a soft shadow on the right
    if (R < 3000) { const sh = ctx.createLinearGradient(cx - R, 0, cx + R, 0); sh.addColorStop(0.55, 'rgba(5,6,26,0)'); sh.addColorStop(1, 'rgba(5,6,26,0.45)'); ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); }
    ctx.restore();
  },
  // Pizza Moon: a round cheese moon with a crust rim, pepperoni craters and a few bubbles
  sceneMoon(r, ctx, x, y, R, t) {
    const glow = ctx.createRadialGradient(x, y, R * 0.9, x, y, R * 1.3 + 4); glow.addColorStop(0, 'rgba(255,224,138,0.35)'); glow.addColorStop(1, 'rgba(255,224,138,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, R * 1.3 + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6c84f'; ctx.beginPath(); ctx.arc(x, y, R * 0.86, 0, Math.PI * 2); ctx.fill();
    if (R < 4) return;
    ctx.fillStyle = 'rgba(255,240,170,0.7)'; for (const [fx, fy, fr] of [[-0.3, -0.4, 0.1], [0.35, 0.3, 0.08], [-0.1, 0.55, 0.07], [0.55, -0.15, 0.06]]) { ctx.beginPath(); ctx.ellipse(x + fx * R, y + fy * R, fr * R, fr * R * 0.7, 0, 0, Math.PI * 2); ctx.fill(); }
    for (const [fx, fy, fr] of [[-0.35, -0.05, 0.17], [0.2, -0.42, 0.13], [0.3, 0.12, 0.15], [-0.12, 0.42, 0.12], [-0.5, 0.35, 0.09], [0.55, 0.45, 0.08]]) {
      ctx.fillStyle = '#b8342a'; ctx.beginPath(); ctx.arc(x + fx * R, y + fy * R, fr * R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9473a'; ctx.beginPath(); ctx.arc(x + fx * R - fr * R * 0.12, y + fy * R - fr * R * 0.12, fr * R * 0.82, 0, Math.PI * 2); ctx.fill();
      if (R > 30) { ctx.fillStyle = '#9c2a20'; for (const [a, b] of [[-0.3, 0.2], [0.25, -0.2], [0.1, 0.35]]) { ctx.beginPath(); ctx.arc(x + (fx + a * fr) * R, y + (fy + b * fr) * R, fr * R * 0.12, 0, Math.PI * 2); ctx.fill(); } }
    }
    // a soft shadow on the far side
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(60,30,10,0.22)'; ctx.beginPath(); ctx.rect(x - R, y - R, R * 2, R * 2); ctx.arc(x - R * 0.28, y - R * 0.28, R * 1.08, 0, Math.PI * 2, true); ctx.fill();
    ctx.restore();
  },
};
Game.ext.unshift(RocketExt);   // ahead of the islands' own button and hints
Render.ext.push(RocketExt);
