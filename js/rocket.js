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
};

const RocketExt = {
  name: 'rocket',
  defaults: { rocket: { visits: 0 } },
  st: null,   // runtime only: workers, the crane's clock, sparks, bubbles, the countdown, a launch or landing, smoke

  // ---------- state ----------
  build(g) {
    if (!g.s.rocket) g.s.rocket = { visits: 0 };
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
  },
  // 0: a bare frame, 1: most panels on and the nose cone on the crane, 2: finished and ready to fly
  stage(g) { const v = (g && g.s && g.s.rocket && g.s.rocket.visits) || 0; return U.clamp(v - 1, 0, 2); },
  ready(g) { return this.stage(g) >= 2; },
  canFly(g) { return this.ready(g) && !!CFG.AREAS.moon && typeof MoonExt !== 'undefined'; },
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
    else { g.toast('🚀 The rocket is ready! Hop in!', true); st.swing = 0; st.cheerT = 1.5; }
    if (stage > 0) {
      for (let i = 0; i < 10; i++) g.fx.push({ kind: 'sparkle', x0: R.BASE.x + U.rand(-40, 40), y0: R.BASE.y - U.rand(20, H), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 });
      Sfx.chime(); Haptics.success();
    }
  },

  // ---------- game hooks ----------
  obstacles(g, forCar) { return g.area === 'islands' && this.st && !forCar ? this.st.obs : []; },
  action(g) {
    const st = this.st;
    if (!st || st.fly || g.area !== 'islands' || !this.onFoot(g) || !this.nearAsk(g)) return null;
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
  home(g) {
    const st = this.st; if (!st) return;
    st.ask = null; st.count = null; st.sparks = []; st.fly = null; st.smoke = []; st.puff = null; st.cheer = null;
    st.wasOn = false;
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
    if (g.area !== 'islands' || !this.onFoot(g) || !this.onRocketIsle(g) || this.nearMissionDoor(g)) return undefined;
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
    if (g.area !== 'islands') { st.sparks.length = 0; return; }
    const R = CFG.ISLANDS.ROCKET, p = g.player, t = g.time, stage = this.stage(g), chefNear = (w) => this.onFoot(g) && U.dist(p.x, p.y, w.x, w.y - w.z) < CFG.ROCKETISLE.WAVE_R;
    // a save (or a push) that left the chef inside the rocket's feet puts them back at its door
    const foot = st.obs[0];
    if (!st.fly && this.onFoot(g) && p.x > foot.x && p.x < foot.x + foot.w && p.y > foot.y && p.y < foot.y + foot.h) { p.x = R.ASK.x; p.y = R.ASK.y; p.moving = false; }
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
    // the concrete pad with hazard stripes round the edge and a flame trench grate under the rocket
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, P.x0 + 5, P.y0 + 6, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.fill();
    ctx.fillStyle = '#b9bcc2'; U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let x = P.x0 + 40; x < P.x1; x += 40) ctx.fillRect(x, P.y0 + 4, 2, P.y1 - P.y0 - 8); for (let y = P.y0 + 40; y < P.y1; y += 40) ctx.fillRect(P.x0 + 4, y, P.x1 - P.x0 - 8, 2);
    ctx.save(); U.roundRect(ctx, P.x0, P.y0, P.x1 - P.x0, P.y1 - P.y0, 14); ctx.clip();
    for (let i = -20; i < 60; i++) { ctx.fillStyle = i % 2 ? '#2b1d14' : '#ffd166'; const x = P.x0 + i * 14; ctx.beginPath(); ctx.moveTo(x, P.y0); ctx.lineTo(x + 14, P.y0); ctx.lineTo(x + 24, P.y0 + 10); ctx.lineTo(x + 10, P.y0 + 10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, P.y1 - 10); ctx.lineTo(x + 14, P.y1 - 10); ctx.lineTo(x + 24, P.y1); ctx.lineTo(x + 10, P.y1); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(B.x, B.y - 10, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x - 40, B.y - 26, 80, 30, 6); ctx.fill();
    ctx.fillStyle = '#3e424a'; for (let x = B.x - 34; x < B.x + 36; x += 8) ctx.fillRect(x, B.y - 22, 4, 22);
    // a painted pizza on the pad, for luck
    r.drawPizza(P.x0 + 44, P.y1 - 44, 16);
    // traffic cones along the edge
    for (const [x, y] of [[P.x0 + 10, P.y0 + 30], [P.x0 + 10, P.y1 - 90], [P.x1 - 10, P.y1 - 30], [P.x1 - 10, P.y0 + 90]]) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.lineTo(x, y - 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 3.5, y - 9, 7, 3); ctx.fillStyle = '#3e424a'; ctx.fillRect(x - 8, y - 1, 16, 3); }
    // the fuel hose from the truck to the rocket
    const T = R.TRUCK;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x + 44, T.y - 4); ctx.bezierCurveTo(T.x + 110, T.y + 20, B.x - 90, B.y + 30, B.x - 24, B.y - 4); ctx.stroke();
    ctx.strokeStyle = '#41b883'; ctx.lineWidth = 2; ctx.stroke();
    this.paintMission(r, g);
    this.paintSign(r, g);
    // the crane's footing: tracks in the sand
    const C = R.CRANE; ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = -2; k <= 2; k++) ctx.fillRect(C.x - 30, C.y + k * 8 + 22, 60, 3);
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
    // only bother when Rocket Island is somewhere near the screen (the rocket and crane are tall)
    if (!fs && (r.camY + r.viewH < R.PAD.y0 - 420 || r.camX > R.CRANE.x + 120 || r.camX + r.viewW < R.MISSION.x - 120)) return;
    const stage = this.stage(g);
    items.push({ y: B.y, draw: () => this.drawPadRocket(r, g, B, stage, fs) });
    items.push({ y: B.y + 1, draw: () => this.drawScaffold(r, g) });
    items.push({ y: R.CRANE.y + 18, draw: () => this.drawCrane(r, g) });
    items.push({ y: R.TRUCK.y + 14, draw: () => this.drawTruck(r, g) });
    items.push({ y: R.PARTS.y + 10, draw: () => this.drawParts(r, g) });
    for (const w of st.workers) items.push({ y: w.z > 4 && (w.role === 'climb' || w.role === 'weldHigh') ? B.y + 2 : w.y, draw: () => this.drawWorker(r, g, w) });
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
    const R = CFG.ISLANDS.ROCKET, C = R.CRANE, B = R.BASE, P = R.PARTS, T = CFG.ROCKETISLE.CRANE_PERIOD, k = this.st.crane / T;
    const jibY = C.y - C.h + 10;
    if (stage >= 2) return { x: C.x - 90, hy: jibY + 30, load: false, jibY, ph: 'parked' };
    const nose = stage === 1, rest = nose ? jibY + 12 : jibY + 40, pileX = P.x, rocketX = B.x + 2;
    const low = nose ? P.y - 82 : P.y - 26, topY = nose ? B.y - CFG.ROCKETISLE.ROCKET_H + 60 - 74 : B.y - CFG.ROCKETISLE.ROCKET_H + 70;
    const seg = [[0.12, 'down'], [0.24, 'up'], [0.4, 'over'], [0.5, 'lower'], [0.64, 'hold'], [0.74, 'raise'], [0.9, 'back'], [1, 'rest']];
    let i = 0; while (k > seg[i][0]) i++;
    const a = i ? seg[i - 1][0] : 0, q = U.clamp((k - a) / (seg[i][0] - a), 0, 1), e = q * q * (3 - 2 * q), ph = seg[i][1];
    let x = pileX, hy = rest, load = nose;
    if (ph === 'down') { hy = U.lerp(rest, low, e); }
    else if (ph === 'up') { hy = U.lerp(low, rest, e); load = true; }
    else if (ph === 'over') { x = U.lerp(pileX, rocketX, e); load = true; }
    else if (ph === 'lower') { x = rocketX; hy = U.lerp(rest, topY, e); load = true; }
    else if (ph === 'hold') { x = rocketX; hy = topY; load = true; }
    else if (ph === 'raise') { x = rocketX; hy = U.lerp(topY, rest, e); }
    else if (ph === 'back') { x = U.lerp(rocketX, pileX, e); }
    return { x, hy, load, jibY, ph, nose };
  },
  drawCrane(r, g) {
    const ctx = r.ctx, C = CFG.ISLANDS.ROCKET.CRANE, stage = this.stage(g), cs = this.craneState(stage), top = cs.jibY;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x - 22, C.y + 10, 48, 10);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, C.x - 22, C.y - 6, 44, 22, 4); ctx.fill();
    // the mast: two yellow rails with zigzag bracing
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C.x - 8, C.y - 4); ctx.lineTo(C.x - 8, top); ctx.moveTo(C.x + 8, C.y - 4); ctx.lineTo(C.x + 8, top); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = C.y - 4, k = 0; y > top; y -= 16, k++) { ctx.moveTo(C.x + (k % 2 ? 8 : -8), y); ctx.lineTo(C.x + (k % 2 ? -8 : 8), y - 16); } ctx.stroke();
    // finished: the whole top turns round, so the jib points east, away from the rocket's way up
    ctx.save(); if (stage >= 2) { ctx.translate(C.x, 0); ctx.scale(-1, 1); ctx.translate(-C.x, 0); }
    // the jib out to the left over the rocket, the counter-jib with its weight to the right
    const jx0 = CFG.ISLANDS.ROCKET.BASE.x - 40, jx1 = C.x + 70;
    ctx.strokeStyle = '#f2b705'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(jx0, top); ctx.lineTo(jx1, top); ctx.moveTo(jx0 + 20, top + 10); ctx.lineTo(C.x, top + 10); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = jx0 + 20, k = 0; x < C.x; x += 14, k++) { ctx.moveTo(x, top + (k % 2 ? 0 : 10)); ctx.lineTo(x + 14, top + (k % 2 ? 10 : 0)); } ctx.stroke();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C.x, top - 30); ctx.lineTo(jx0 + 10, top); ctx.moveTo(C.x, top - 30); ctx.lineTo(jx1 - 6, top); ctx.stroke();
    ctx.fillStyle = '#f2b705'; ctx.fillRect(C.x - 3, top - 32, 6, 32);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(jx1 - 30, top + 2, 28, 18);   // counterweight
    // the cab with its driver
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, C.x + 10, top + 4, 22, 20, 4); ctx.fill(); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(C.x + 13, top + 7, 16, 9);
    ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(C.x + 21, top + 13, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(C.x + 21, top + 11, 4.5, Math.PI, 0); ctx.fill();
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
    if (stage >= 2) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(jx0, top); ctx.lineTo(jx0 - 18, top - 7 + Math.sin(g.time * 4) * 2); ctx.lineTo(jx0, top - 14); ctx.closePath(); ctx.fill(); }   // a pennant on the jib's end
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
      if (w.role === 'climb' && w.bang > 0) { ctx.fillStyle = '#3e424a'; U.roundRect(ctx, 14, -30, 10, 6, 2); ctx.fill(); }   // the hammer, mid-bang
    }
    // the hard hat
    ctx.fillStyle = w.hat; ctx.beginPath(); ctx.arc(0, -42, 11.5, Math.PI, 0); ctx.fill();
    U.roundRect(ctx, -14, -43, 28, 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-1.5, -53, 3, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-4, -48, 3, 0, Math.PI * 2); ctx.fill();
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
