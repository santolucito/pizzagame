'use strict';
// The town fire station next to the pizzeria opens up: a little door on its west wall (below the truck's bay door) leads
// into the engine bay. Inside: the town's own red fire truck in its bay whenever it is home (climb into the cab: the
// lights flash and the siren goes wee-woo once; while the truck is out on its pizza run the bay is empty, with an oil
// stain and a BACK SOON cone), a brass pole from the upstairs gallery (climb the stairs, slide down), a wall of helmets to
// try on, a hose reel and a practice target to spray, a bell that calls the crew down the pole to line up, a sleepy
// Dalmatian that follows you about, a kitchen corner with a pot of chili bubbling ($3 a bowl), a fire-safety poster
// starring the chef (stop, drop and roll!) and the station's cat. Reads Game.fireTruck, never changes it.
// Extension module: registered with Game.ext (first, so the door beats the town's own hints) and Render.ext (see js/EXTENSIONS.md).
CFG.FIRESTATION = {
  DOOR_OUT: { x: 1326, y: 516 },                 // on the sidewalk by the little door, below the truck's bay door (the truck drives out along y 460)
  WORLD: { x0: 3000, y0: 4000, x1: 3600, y1: 4400 },
  ROOM: { x0: 3040, y0: 4100, x1: 3560, y1: 4340 }, WALL: 24, BACK_TOP: 4016,   // the back wall is tall: poster, helmets, bell and the gallery hang on it
  BAY: { x0: 3070, y0: 4160, x1: 3230, y1: 4244 },             // the yellow parking box
  TRUCK: { x: 3150, y: 4200 },                   // the town truck parks here, nose to the bay door in the left wall
  TRUCK_BOX: { x: 3086, y: 4172, w: 128, h: 56 },
  BAY_DOOR: { y0: 4168, y1: 4232 },              // the red roller door in the left wall
  CAB_IN: { x: 3112, y: 4262 },                  // stand here to climb into the cab
  CAB_SEAT: { x: 3114, y: 4212 },                // where the chef sits (hidden inside the truck)
  CONE: { x: 3150, y: 4238 }, STAIN: { x: 3160, y: 4204 },
  POSTER: { x0: 3050, y0: 4024, x1: 3108, y1: 4094 }, POSTER_SPOT: { x: 3086, y: 4150 },
  HELMETS: { x0: 3118, y0: 4030, x1: 3232, y1: 4094 }, HELMET_SPOT: { x: 3175, y: 4128 },
  BELL: { x: 3258, y: 4072 }, BELL_SPOT: { x: 3258, y: 4128 },
  GALLERY: { x0: 3330, y0: 4040, x1: 3552, y1: 4084, floor: 4066 },   // the upstairs balcony along the back wall
  STAIRS: { foot: { x: 3296, y: 4130 }, top: { x: 3338, y: 4066 } },
  POLE: { x: 3410, top: 4066, bottom: 4150, land: { x: 3410, y: 4166 } },
  CREW_HOMES: [{ x: 3450, y: 4066 }, { x: 3492, y: 4066 }, { x: 3534, y: 4066 }],
  LINE: [{ x: 3330, y: 4268 }, { x: 3372, y: 4268 }, { x: 3414, y: 4268 }],
  REEL: { x: 3572, y: 4160 }, SPRAY: { x: 3440, y: 4216 }, TARGET: { x: 3528, y: 4216 },
  KITCHEN: { x0: 3474, y0: 4292, x1: 3556, y1: 4336 }, POT: { x: 3532, y: 4298 },
  PADS: { chili: { x: 3436, y: 4316 } },
  CAT: { x: 3082, y: 4318 },
  DOG_HOME: { x: 3200, y: 4306 },
  EXIT: { x: 3300, y: 4322 },                    // the mat inside the door (the door is in the bottom wall)
  CLIMB: 0.9, WALK: 1.0, SLIDE: 0.8, SPRAY_T: 1.7, LINE_T: 5, HELMET: 30, CHILI: 20, ROLL_T: 2.4, DOG_WAKE: 90,   // seconds / px
};
CFG.AREAS.firestation = { WORLD: CFG.FIRESTATION.WORLD };

const FireStationExt = {
  name: 'firestation',
  st: null,
  defaults: { firestation: { seen: false, rides: 0, slides: 0, helmets: 0, sprays: 0, bells: 0, rolls: 0, chilis: 0, pets: 0 } },

  // ---------- state ----------
  build(g) {
    const F = CFG.FIRESTATION;
    if (!g.s.firestation) g.s.firestation = { seen: false, rides: 0, slides: 0, helmets: 0, sprays: 0, bells: 0, rolls: 0, chilis: 0, pets: 0 };
    this.st = {
      fade: 0,
      cab: null, climb: null, up: false, slide: null, spray: null, roll: null,   // the chef's scripted moments: { t }
      helmet: 0, chili: 0, bellSwing: 0, targetSpin: 0, splashed: false, catHappy: 0, awayNote: false,
      alarm: null, lineT: 0,                                           // the bell's alarm: { t } while the crew is out
      crew: F.CREW_HOMES.map((h, i) => ({ x: h.x, y: h.y, facing: -1, moving: false, bob: 0, state: 'up', i, t: 0, wait: 0 })),
      dog: { x: F.DOG_HOME.x, y: F.DOG_HOME.y, facing: 1, moving: false, bob: 0, wag: 0, sit: true, sleep: true, still: 9, happy: 0, trail: [], last: null, zT: 0 },
      base: null,
    };
    const R = F.ROOM, w = F.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: F.TARGET.x - 14, y: F.TARGET.y - 6, w: 28, h: 14 });
    o.push({ x: F.KITCHEN.x0, y: F.KITCHEN.y0, w: F.KITCHEN.x1 - F.KITCHEN.x0, h: F.KITCHEN.y1 - F.KITCHEN.y0 });
    this.st.base = o;
  },
  // the town's truck is in its bay whenever the core's FireTruck is at home (read only; the outings stay the core's)
  truckHome(g) { const t = (g || Game).fireTruck; return !t || t.state === 'home'; },
  obstacles(g) {
    if (g.area !== 'firestation' || !this.st) return [];
    return this.truckHome(g) ? this.st.base.concat([CFG.FIRESTATION.TRUCK_BOX]) : this.st.base;
  },
  freeOf(x, y, obs) {
    const R = CFG.FIRESTATION.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of obs) if (x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r) return false;
    return true;
  },
  free(x, y) { return this.freeOf(x, y, this.truckHome() ? this.st.base.concat([CFG.FIRESTATION.TRUCK_BOX]) : this.st.base); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inTown(g) { return g.area === 'town' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  atDoor(g) { const D = CFG.FIRESTATION.DOOR_OUT, p = g.player; return this.inTown(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  busy() { const st = this.st; return !!(st.cab || st.climb || st.up || st.slide || st.spray || st.roll); },
  near(g, s, r = 30) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < r; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const F = CFG.FIRESTATION, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go into the fire station', run: (gg) => this.enter(gg) };
    if (g.area !== 'firestation') return null;
    if (st.cab) return { label: '🚶 Climb out', run: (gg) => this.climbOut(gg) };
    if (st.up) return { label: '🧑‍🚒 Slide down!', run: (gg) => this.slideDown(gg) };
    if (st.climb || st.slide || st.spray || st.roll) return null;
    if (this.near(g, F.EXIT)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.truckHome(g) && this.near(g, F.CAB_IN)) return { label: '🚒 Climb in', run: (gg) => this.climbIn(gg) };
    if (this.near(g, F.STAIRS.foot)) return { label: '🪜 Climb the stairs', run: (gg) => this.climbStairs(gg) };
    if (this.near(g, F.HELMET_SPOT)) return { label: '⛑️ Try a helmet', run: (gg) => this.tryHelmet(gg) };
    if (this.near(g, F.BELL_SPOT)) return { label: '🔔 Ring the bell', run: (gg) => this.ringBell(gg) };
    if (this.near(g, F.POSTER_SPOT)) return { label: '🔥 Stop, drop and roll!', run: (gg) => this.stopDropRoll(gg) };
    if (this.near(g, F.SPRAY)) return { label: '💦 Spray the hose', run: (gg) => this.sprayHose(gg) };
    if (this.near(g, F.CAT, 44)) return { label: '🐈 Pet the cat', run: (gg) => this.petCat(gg) };
    return null;
  },
  enter(g) {
    const F = CFG.FIRESTATION, p = g.player, st = this.st;
    g.area = 'firestation'; p.x = F.EXIT.x; p.y = F.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; Sfx.ding(); Haptics.tap();
    const d = st.dog; d.x = F.DOG_HOME.x; d.y = F.DOG_HOME.y; d.trail = []; d.last = null; d.sit = true; d.sleep = true; d.still = 9; d.moving = false;
    st.awayNote = false;
    if (!g.s.firestation.seen) { g.s.firestation.seen = true; g.toast('🚒 Welcome to the fire station!', true); }
  },
  leave(g) {
    const F = CFG.FIRESTATION, p = g.player;
    g.area = 'town'; p.x = F.DOOR_OUT.x; p.y = F.DOOR_OUT.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.clearScripted(); this.st.fade = 0.45; Sfx.drop();
  },
  clearScripted() { const st = this.st; st.cab = null; st.climb = null; st.up = false; st.slide = null; st.spray = null; st.roll = null; },
  climbIn(g) {
    const F = CFG.FIRESTATION, p = g.player;
    this.st.cab = { t: 0 }; p.x = F.CAB_SEAT.x; p.y = F.CAB_SEAT.y; p.moving = false; p.facing = -1;
    g.s.firestation.rides++;
    Sfx.pickup(); Haptics.tap();
    // the siren, once: wee (up) then woo (down)
    Sfx.tone(620, 0.32, 'square', 0.03, 320); setTimeout(() => Sfx.tone(920, 0.36, 'square', 0.03, -340), 320);
    g.floats.push({ x: F.TRUCK.x, y: F.TRUCK.y - 60, text: 'Wee-woo! 🚒', color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },
  climbOut(g) {
    const F = CFG.FIRESTATION, p = g.player;
    this.st.cab = null; p.x = F.CAB_IN.x; p.y = F.CAB_IN.y; p.moving = false; p.facing = 1; Sfx.drop();
  },
  climbStairs(g) {
    const p = g.player; this.st.climb = { t: 0 }; p.moving = false; Sfx.pickup(); Haptics.tap();
  },
  slideDown(g) {
    const F = CFG.FIRESTATION, p = g.player;
    this.st.up = false; this.st.slide = { t: 0 }; p.x = F.POLE.x; p.y = F.POLE.top; p.moving = false; p.facing = 1;
    Sfx.tone(880, 0.7, 'sine', 0.04, -600); Haptics.tap();
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Wheee!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
  },
  tryHelmet(g) {
    const p = g.player; this.st.helmet = CFG.FIRESTATION.HELMET; g.s.firestation.helmets++; p.facing = 1;
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-14, 14), y0: p.y - 56 + U.rand(-8, 8), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
    g.floats.push({ x: p.x, y: p.y - 80, text: 'Firefighter chef! ⛑️', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.success();
  },
  ringBell(g) {
    const st = this.st, p = g.player;
    st.bellSwing = 1.6; Sfx.ding(); Haptics.tap(); g.s.firestation.bells++;
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Ding ding! 🔔', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    if (st.alarm) return;   // the crew is already on its way
    st.alarm = { t: 0 }; st.lineT = 0;
    st.crew.forEach((c, i) => { c.state = 'toPole'; c.wait = i * 0.55; });
  },
  sprayHose(g) {
    const F = CFG.FIRESTATION, p = g.player;
    this.st.spray = { t: 0 }; this.st.splashed = false; p.x = F.SPRAY.x; p.y = F.SPRAY.y; p.moving = false; p.facing = 1;
    g.s.firestation.sprays++; Sfx.clean(); Haptics.tap();
  },
  // the poster's lesson, acted out: stop (hands up), drop to the floor, roll over twice, up again
  stopDropRoll(g) {
    const F = CFG.FIRESTATION, p = g.player;
    this.st.roll = { t: 0, said: 0 }; p.x = F.POSTER_SPOT.x; p.y = F.POSTER_SPOT.y; p.moving = false; p.facing = 1;
    g.s.firestation.rolls++; Sfx.pickup(); Haptics.tap();
  },
  petCat(g) {
    const F = CFG.FIRESTATION, p = g.player;
    this.st.catHappy = 2.2; g.s.firestation.pets++; p.facing = F.CAT.x < p.x ? -1 : 1;
    g.floats.push({ x: F.CAT.x, y: F.CAT.y - 44, text: 'Purrr 💗', color: '#ffb6c1', t: 0, dur: 1.4, big: true });
    Sfx.chime(); Haptics.tap();
  },
  resetCrew() {
    const F = CFG.FIRESTATION, st = this.st;
    st.alarm = null; st.lineT = 0;
    st.crew.forEach((c, i) => { c.x = F.CREW_HOMES[i].x; c.y = F.CREW_HOMES[i].y; c.state = 'up'; c.moving = false; c.facing = -1; c.wait = 0; });
  },
  home(g) {
    if (!this.st) return;
    const F = CFG.FIRESTATION, st = this.st;
    this.clearScripted(); st.fade = 0; st.bellSwing = 0; st.targetSpin = 0; st.catHappy = 0;
    this.resetCrew();
    const d = st.dog; d.x = F.DOG_HOME.x; d.y = F.DOG_HOME.y; d.trail = []; d.last = null; d.moving = false; d.sit = true; d.sleep = true; d.still = 9;
  },
  // a save or a push that left the chef in a wall goes back onto the door mat; the truck coming home over the chef's
  // toes just nudges them out beside the cab
  rescue(g) {
    const p = g.player, F = CFG.FIRESTATION;
    if (this.free(p.x, p.y)) return false;
    if (this.freeOf(p.x, p.y, this.st.base)) {
      p.x = F.CAB_IN.x; p.y = F.CAB_IN.y; p.moving = false;
      g.floats.push({ x: p.x, y: p.y - 50, text: 'Beep beep! 🚒', color: '#ffe08a', t: 0, dur: 1.4, big: true });
      return true;
    }
    p.x = F.EXIT.x; p.y = F.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, F = CFG.FIRESTATION;
    st.fade = Math.max(0, st.fade - dt);
    st.helmet = Math.max(0, st.helmet - dt);
    st.chili = Math.max(0, st.chili - dt);
    st.bellSwing = Math.max(0, st.bellSwing - dt);
    st.catHappy = Math.max(0, st.catHappy - dt);
    if (g.area !== 'firestation') { if (this.busy()) this.clearScripted(); if (st.alarm) this.resetCrew(); return; }
    const home = this.truckHome(g);
    // the truck leaves for its pizza run while the chef sits in the cab: out you hop
    if (st.cab && !home) { this.climbOut(g); g.floats.push({ x: p.x, y: p.y - 60, text: 'Off it goes! 🚒', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    if (!home && !st.awayNote) { st.awayNote = true; g.floats.push({ x: F.TRUCK.x, y: F.TRUCK.y - 30, text: 'The truck is out! 🍕', color: '#ffe08a', t: 0, dur: 1.8, big: true }); }
    if (home) st.awayNote = false;
    // ---- the chef's scripted moments
    if (st.cab) {
      st.cab.t += dt; p.x = F.CAB_SEAT.x; p.y = F.CAB_SEAT.y; p.moving = false; p.facing = -1;
    } else if (st.climb) {
      const c = st.climb; c.t += dt;
      if (c.t < F.CLIMB) { const k = U.ease(c.t / F.CLIMB); p.x = U.lerp(F.STAIRS.foot.x, F.STAIRS.top.x, k); p.y = U.lerp(F.STAIRS.foot.y, F.STAIRS.top.y, k); p.facing = 1; p.moving = true; p.bob += dt * 12; }
      else if (c.t < F.CLIMB + F.WALK) { const k = U.ease((c.t - F.CLIMB) / F.WALK); p.x = U.lerp(F.STAIRS.top.x, F.POLE.x, k); p.y = F.GALLERY.floor; p.facing = 1; p.moving = true; p.bob += dt * 14; }
      else { st.climb = null; st.up = true; p.x = F.POLE.x; p.y = F.GALLERY.floor; p.moving = false; p.facing = 1; }
    } else if (st.up) {
      p.x = F.POLE.x; p.y = F.GALLERY.floor; p.moving = false; p.facing = 1;
    } else if (st.slide) {
      const s = st.slide; s.t += dt; const k = Math.min(1, s.t / F.SLIDE);
      p.x = F.POLE.x; p.y = U.lerp(F.POLE.top, F.POLE.land.y, k * k); p.moving = false; p.facing = 1;
      if (k >= 1) {
        st.slide = null; p.x = F.POLE.land.x; p.y = F.POLE.land.y; g.s.firestation.slides++;
        for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-18, 18), y0: p.y + U.rand(-6, 4), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
        Sfx.drop(); Haptics.success();
      }
    } else if (st.spray) {
      const s = st.spray; s.t += dt; p.x = F.SPRAY.x; p.y = F.SPRAY.y; p.moving = false; p.facing = 1;
      if (s.t > 0.45 && !st.splashed) {
        st.splashed = true;
        g.floats.push({ x: F.TARGET.x, y: F.TARGET.y - 60, text: 'Splash! 💦', color: '#9fd8ff', t: 0, dur: 1.5, big: true });
        for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: F.TARGET.x + U.rand(-16, 16), y0: F.TARGET.y - 24 + U.rand(-14, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 });
        Haptics.success();
      }
      if (s.t > 0.45) st.targetSpin += dt * 14 * Math.max(0.15, 1 - (s.t - 0.45) / F.SPRAY_T);
      if (s.t >= F.SPRAY_T) { st.spray = null; st.targetSpin = 0; }
    } else if (st.roll) {
      const r = st.roll, S = F.POSTER_SPOT; r.t += dt; p.moving = false; p.facing = 1;
      // while lying down the chef is drawn by this file (rolling); the core's standing chef is parked under a floor cover
      p.x = S.x; p.y = r.t < 0.5 ? S.y : S.y + 14;
      const say = (n, text) => { if (r.said < n) { r.said = n; g.floats.push({ x: S.x, y: S.y - 70, text, color: '#ffe08a', t: 0, dur: 1.1, big: true }); } };
      if (r.t >= 0) say(1, 'Stop! ✋');
      if (r.t >= 0.5) say(2, 'Drop! ⬇️');
      if (r.t >= 0.9) say(3, 'Roll! 🔄');
      if (r.t >= 0.9 && r.t < 2 && Math.floor(r.t * 10) !== Math.floor((r.t - dt) * 10)) g.fx.push({ kind: 'dirt', x0: S.x + U.rand(-24, 24), y0: S.y + 8, x1: S.x + U.rand(-40, 40), y1: S.y + 12, t: 0, dur: 0.5 });
      if (r.t >= F.ROLL_T) {
        st.roll = null; p.x = S.x; p.y = S.y;
        g.floats.push({ x: S.x, y: S.y - 70, text: 'Safe! ⭐', color: '#ffe08a', t: 0, dur: 1.4, big: true });
        for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: S.x + U.rand(-18, 18), y0: S.y - 20 + U.rand(-10, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 });
        Sfx.ding(); Haptics.success();
      }
    } else {
      this.rescue(g);
    }
    // ---- the alarm: the crew slides down, lines up for a while, then climbs back up
    if (st.alarm) {
      st.alarm.t += dt;
      for (const c of st.crew) this.stepCrew(c, dt, F);
      if (st.crew.every((c) => c.state === 'line')) {
        st.lineT += dt;
        if (st.lineT >= F.LINE_T) st.crew.forEach((c, i) => { c.state = 'toStairs'; c.wait = i * 0.5; });
      }
      if (st.crew.every((c) => c.state === 'up')) st.alarm = null;
    }
    for (const c of st.crew) c.bob = c.moving ? c.bob + dt * 14 : 0;
    // ---- the Dalmatian dozes until you come close, then follows and sits (and nods off again) when you stop
    this.stepDog(g, dt);
  },
  stepCrew(c, dt, F) {
    if (c.wait > 0) { c.wait -= dt; c.moving = false; return; }
    switch (c.state) {
      case 'toPole': if (U.moveToward(c, F.POLE.x, F.GALLERY.floor, 110, dt)) { c.state = 'slide'; c.t = 0; } else { c.moving = true; c.facing = F.POLE.x < c.x ? -1 : 1; } break;
      case 'slide': { c.t += dt; const k = Math.min(1, c.t / F.SLIDE); c.x = F.POLE.x; c.y = U.lerp(F.POLE.top, F.POLE.land.y, k * k); c.moving = false; c.facing = 1; if (k >= 1) c.state = 'toLine'; break; }
      case 'toLine': { const L = F.LINE[c.i]; if (U.moveToward(c, L.x, L.y, 130, dt)) { c.state = 'line'; c.facing = -1; c.moving = false; } else { c.moving = true; c.facing = L.x < c.x ? -1 : 1; } break; }
      case 'line': c.moving = false; c.facing = -1; break;
      case 'toStairs': if (U.moveToward(c, F.STAIRS.foot.x, F.STAIRS.foot.y, 120, dt)) { c.state = 'climb'; c.t = 0; } else { c.moving = true; c.facing = F.STAIRS.foot.x < c.x ? -1 : 1; } break;
      case 'climb': { c.t += dt; const k = U.ease(Math.min(1, c.t / F.CLIMB)); c.x = U.lerp(F.STAIRS.foot.x, F.STAIRS.top.x, k); c.y = U.lerp(F.STAIRS.foot.y, F.STAIRS.top.y, k); c.moving = true; c.facing = 1; if (k >= 1) c.state = 'toHome'; break; }
      case 'toHome': { const H = F.CREW_HOMES[c.i]; if (U.moveToward(c, H.x, H.y, 110, dt)) { c.state = 'up'; c.facing = -1; c.moving = false; } else { c.moving = true; c.facing = 1; } break; }
      default: c.moving = false;
    }
  },
  stepDog(g, dt) {
    const d = this.st.dog, p = g.player, F = CFG.FIRESTATION, st = this.st;
    d.wag += dt * 10; d.happy = Math.max(0, d.happy - dt); d.zT += dt;
    // where the dog wants to be: by the chef, or waiting nearby while the chef is up the pole, in the cab or rolling
    const tx = st.cab ? F.CAB_IN.x : (st.climb || st.up || st.slide) ? F.POLE.land.x : st.roll ? F.POSTER_SPOT.x + 60 : p.x;
    const ty = st.cab ? F.CAB_IN.y + 18 : (st.climb || st.up || st.slide) ? F.POLE.land.y + 30 : st.roll ? F.POSTER_SPOT.y + 24 : p.y;
    const dp = U.dist(d.x, d.y, tx, ty);
    if (d.sleep) {
      // dozing: wakes with a woof when the chef walks up close (standing beside a sleeping dog lets it sleep)
      if (dp < F.DOG_WAKE && p.moving && !this.busy()) { d.sleep = false; d.sit = true; d.still = 0; d.facing = tx < d.x ? -1 : 1; g.floats.push({ x: d.x, y: d.y - 40, text: 'Woof! 🐶', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
      d.moving = false; return;
    }
    // breadcrumbs: the chef's path, so the dog trots where the chef walked and never through the truck
    if (!d.last || U.dist(d.last.x, d.last.y, tx, ty) > 12) { d.last = { x: tx, y: ty }; d.trail.push(d.last); if (d.trail.length > 60) d.trail.shift(); }
    if (dp > 52) {
      while (d.trail.length > 1 && U.dist(d.trail[0].x, d.trail[0].y, tx, ty) > dp) d.trail.shift();   // skip crumbs further from the chef than we are
      const tgt = d.trail.length ? d.trail[0] : { x: tx, y: ty };
      d.facing = tgt.x < d.x - 2 ? -1 : tgt.x > d.x + 2 ? 1 : d.facing;
      if (U.moveToward(d, tgt.x, tgt.y, 150, dt)) d.trail.shift();
      d.moving = true; d.bob += dt * 16; d.sit = false; d.still = 0;
    } else {
      d.trail = []; d.moving = false; d.still += dt;
      if (d.still > 0.6) d.sit = true;
      if (d.still > 8) { d.sleep = true; d.zT = 0; }   // nods off again when nothing happens for a while
      if (dp > 20) d.facing = tx < d.x ? -1 : 1;
      if (dp < 40 && d.happy <= 0 && !this.busy()) { d.happy = 1.5; g.floats.push({ x: d.x, y: d.y - 40, text: '♥', color: '#ff6b8a', t: 0, dur: 1 }); }
    }
  },
  pads(g) {
    if (g.area !== 'firestation') return [];
    return [{ key: 'firestationChili', label: 'Chili bowl', ico: '🌶️', pos: CFG.FIRESTATION.PADS.chili, price: 3, sub: 'hot!' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'firestationChili') return;
    const p = g.player; this.st.chili = CFG.FIRESTATION.CHILI; g.s.firestation.chilis++;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'Spicy! 🌶️', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, F = CFG.FIRESTATION, st = this.st, s = g.s.firestation;
    if (g.area === 'town') {
      if (!this.inTown(g)) return undefined;
      const d = U.dist(p.x, p.y, F.DOOR_OUT.x, F.DOOR_OUT.y);
      if (d < 70) return { text: 'Go into the fire station! 🚒', target: d < 30 ? null : F.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'firestation') return undefined;
    const home = this.truckHome(g);
    if (st.cab) return { text: 'Wee-woo! Press the button to climb out 🚒', target: null };
    if (st.climb) return { text: 'Up we go! 🪜', target: null };
    if (st.up) return { text: 'Press the button to slide down the pole!', target: null };
    if (st.slide) return { text: 'Wheee! 🧑‍🚒', target: null };
    if (st.spray) return { text: 'Splash! 💦', target: null };
    if (st.roll) return { text: 'Stop, drop and roll! 🔥', target: null };
    if (!s.rides && home) return { text: 'Climb into the fire truck! 🚒', target: F.CAB_IN };
    if (!s.slides) return { text: 'Climb the stairs to the fire pole! 🪜', target: F.STAIRS.foot };
    if (!s.helmets) return { text: 'Try on a fire helmet! ⛑️', target: F.HELMET_SPOT };
    if (!s.sprays) return { text: 'Spray the target with the hose! 💦', target: F.SPRAY };
    if (!s.bells) return { text: 'Ring the bell to call the crew! 🔔', target: F.BELL_SPOT };
    if (!s.rolls) return { text: 'Stop, drop and roll by the poster! 🔥', target: F.POSTER_SPOT };
    if (!s.chilis && g.s.cash + (g.s.padPaid.firestationChili || 0) >= 3) return { text: 'Have a bowl of chili! 🌶️', target: F.PADS.chili };
    if (!s.pets) return { text: 'Pet the station cat! 🐈', target: F.CAT };
    if (st.helmet > 0) return { text: 'Looking brave! ⛑️', target: null };
    if (!home) return { text: 'The fire truck is out for pizza! Back soon 🚒', target: null };
    if (!s.rides) return { text: 'Climb into the fire truck! 🚒', target: F.CAB_IN };
    return { text: 'The Dalmatian loves you! 🐶', target: null };
  },

  // ---------- the town outside: a little door on the station's west wall, a lamp and a mat on the sidewalk ----------
  paintTown(r, g) {
    const ctx = r.ctx, D = CFG.FIRESTATION.DOOR_OUT, S = CFG.FIRE_STATION, dx = S.x0 + 1, dy = D.y - 22;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(dx, dy - 2, 28, 46);                       // frame
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(dx + 3, dy + 1, 22, 42);                   // a cream door
    ctx.fillStyle = '#c62828'; ctx.fillRect(dx + 6, dy + 22, 16, 3); ctx.fillRect(dx + 12.5, dy + 16, 3, 15);   // a little red cross
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(dx + 14, dy + 9, 5, 0, Math.PI * 2); ctx.fill();          // porthole window
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(dx + 22, dy + 26, 2, 0, Math.PI * 2); ctx.fill();        // knob
    ctx.fillStyle = '#5c6670'; ctx.fillRect(dx + 29, dy + 4, 8, 3); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(dx + 37, dy + 5, 4, 0, Math.PI * 2); ctx.fill();   // a lamp beside the door (it glows live)
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#d32f2f'; ctx.fillRect(D.x - 7 + i * 6, D.y - 6, 6, 12); }   // the mat
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 7, D.y - 6, 18, 12);
  },

  // ---------- the interior, static ----------
  paint: { firestation(r, g) { FireStationExt.paintRoom(r, g); } },
  // the concrete floor with its slab lines and the truck's yellow parking box, clipped to a rectangle (also used live
  // as a cover over the core's chef while they sit in the cab or roll on the floor)
  paintFloor(ctx, x0, y0, x1, y1) {
    const F = CFG.FIRESTATION, R = F.ROOM, B = F.BAY;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    ctx.fillStyle = '#b8bec6'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2;
    for (let x = R.x0 + 60; x < R.x1; x += 60) { ctx.beginPath(); ctx.moveTo(x, R.y0); ctx.lineTo(x, R.y1); ctx.stroke(); }
    for (let y = R.y0 + 60; y < R.y1; y += 60) { ctx.beginPath(); ctx.moveTo(R.x0, y); ctx.lineTo(R.x1, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = R.y0; y < R.y1; y += 60) for (let x = R.x0; x < R.x1; x += 60) ctx.fillRect(x + 4, y + 4, 10, 3);
    ctx.fillStyle = 'rgba(255,209,102,0.22)'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.strokeRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.setLineDash([]);
    ctx.restore();
  },
  paintRoom(r, g) {
    const ctx = r.ctx, F = CFG.FIRESTATION, W = F.WORLD, R = F.ROOM, w = F.WALL;
    // outside the station: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, F.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - F.BACK_TOP);
    this.paintFloor(ctx, R.x0, R.y0, R.x1, R.y1);
    // walls: a tall red-brick back wall with a cream band; blue-grey painted side and bottom walls
    ctx.fillStyle = '#c94f3d'; ctx.fillRect(R.x0 - w, F.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - F.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let y = F.BACK_TOP + 4, j = 0; y < R.y0; y += 10, j++) for (let x = R.x0 - w + ((j % 2) * 12); x < R.x1 + w; x += 24) ctx.fillRect(x, y, 22, 8);
    ctx.fillStyle = '#ffe9c2'; ctx.fillRect(R.x0 - w, F.BACK_TOP, R.x1 - R.x0 + 2 * w, 8);
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(R.x0 - w, F.BACK_TOP + 8, R.x1 - R.x0 + 2 * w, 3);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#6f7d8c'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, 3, R.y1 - R.y0);
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(R.x0 - w, R.y1 + 10, R.x1 - R.x0 + 2 * w, 3);   // a red stripe along the bottom wall
    // the big red roller door for the truck, in the left wall, with a dark gap under it
    const BD = F.BAY_DOOR;
    ctx.fillStyle = '#3a2323'; ctx.fillRect(R.x0 - w, BD.y0 - 6, w, BD.y1 - BD.y0 + 12);
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(R.x0 - w, BD.y0, w, BD.y1 - BD.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = BD.y0 + 4; y < BD.y1; y += 6) ctx.fillRect(R.x0 - w + 3, y, w - 6, 2);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(R.x0 - w + 2, (BD.y0 + BD.y1) / 2 - 2, w - 4, 3);
    // the fire-safety poster: the chef, a cheeky flame and STOP · DROP · ROLL pictures
    const P = F.POSTER, pw = P.x1 - P.x0, ph = P.y1 - P.y0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(P.x0 + 2, P.y0 + 2, pw, ph);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(P.x0, P.y0, pw, ph);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(P.x0, P.y0, pw, 10);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('STOP · DROP · ROLL', P.x0 + pw / 2, P.y0 + 5);
    ctx.save(); ctx.beginPath(); ctx.rect(P.x0, P.y0 + 10, pw, ph - 10); ctx.clip();
    ctx.save(); ctx.translate(P.x0 + 18, P.y0 + 60); ctx.scale(0.62, 0.62);
    r.drawPerson(0, 0, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
    ctx.restore();
    this.drawFlame(ctx, P.x0 + 44, P.y0 + 56, 9, 0);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(P.x0 + 41, P.y0 + 50, 1.2, 0, Math.PI * 2); ctx.arc(P.x0 + 46, P.y0 + 50, 1.2, 0, Math.PI * 2); ctx.fill();   // the flame's eyes
    ctx.fillStyle = '#d32f2f'; ctx.font = r.font(8); ctx.fillText('✋ ⬇️ 🔄', P.x0 + pw / 2, P.y0 + 20);
    ctx.restore();
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 2; ctx.strokeRect(P.x0, P.y0, pw, ph);
    // the wall of helmets: a wooden rack with hooks, three helmets, three yellow coats
    const H = F.HELMETS;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0, 4); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, H.x0 + 3, H.y0 + 3, H.x1 - H.x0 - 6, H.y1 - H.y0 - 6, 3); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(H.x0 + 6, H.y0 + 14, H.x1 - H.x0 - 12, 3); ctx.fillRect(H.x0 + 6, H.y0 + 34, H.x1 - H.x0 - 12, 3);
    for (let i = 0; i < 3; i++) {
      const hx = H.x0 + 20 + i * 37;
      this.drawHelmet(ctx, hx, H.y0 + 16, 1, 10, ['#d32f2f', '#ffd166', '#d32f2f'][i]);
      ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(hx, H.y0 + 37, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2b134'; U.roundRect(ctx, hx - 10, H.y0 + 39, 20, 22, 4); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(hx - 10, H.y0 + 45, 20, 2.5); ctx.fillRect(hx - 10, H.y0 + 52, 20, 2.5);
      ctx.fillStyle = '#2b1d14'; ctx.fillRect(hx - 1, H.y0 + 40, 2, 20);
    }
    // the fire bell: a brass bell under a little roof (the bell itself swings live)
    const B = F.BELL;
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(B.x - 18, B.y - 16); ctx.lineTo(B.x, B.y - 28); ctx.lineTo(B.x + 18, B.y - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x - 4, B.y - 18, 8, 6);
    // the upstairs gallery: wooden planks on brackets (the railing is drawn live, in front of the crew)
    const G = F.GALLERY;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(G.x0, G.y1, G.x1 - G.x0, R.y0 - G.y1);
    ctx.fillStyle = '#b5773a'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = G.x0; x < G.x1; x += 22) ctx.fillRect(x, G.y0, 2, G.y1 - G.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(G.x0, G.y1 - 4, G.x1 - G.x0, 6);
    ctx.fillStyle = '#5c6670'; for (let x = G.x0 + 16; x < G.x1; x += 48) { ctx.beginPath(); ctx.moveTo(x, G.y1 + 2); ctx.lineTo(x + 12, G.y1 + 2); ctx.lineTo(x, G.y1 + 12); ctx.closePath(); ctx.fill(); }
    // a bunk's blanket and a pillow at the far end of the gallery: the crew naps up there
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, G.x1 - 36, G.y0 + 10, 30, 14, 3); ctx.fill(); ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, G.x1 - 34, G.y0 + 6, 10, 7, 2); ctx.fill();
    // the staircase up to the gallery: diagonal wooden treads with a stringer
    const S = F.STAIRS, n = 7;
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(S.foot.x - 14, R.y0); ctx.lineTo(S.top.x - 4, S.top.y - 8); ctx.lineTo(S.top.x + 10, S.top.y - 8); ctx.lineTo(S.top.x + 10, R.y0); ctx.closePath(); ctx.fill();
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), x = U.lerp(S.foot.x - 10, S.top.x - 2, k), y = U.lerp(R.y0 - 2, S.top.y - 6, k);
      ctx.fillStyle = '#b5773a'; ctx.fillRect(x, y, 16, 6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, 16, 2);
    }
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(S.top.x - 1, S.top.y - 30, 3, 24);   // handrail post at the top
    // the pole's foot: a round rubber landing mat
    const Po = F.POLE;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(Po.land.x + 2, Po.land.y + 6, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(Po.land.x, Po.land.y + 4, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(Po.land.x, Po.land.y + 4, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    // the hose reel on the right wall: a red reel on a silver bracket, hose coiled around it
    const Rl = F.REEL;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(Rl.x - 6, Rl.y - 3, 12, 30); ctx.fillRect(Rl.x - 16, Rl.y + 24, 32, 5);
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(Rl.x, Rl.y, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff8a80'; ctx.lineWidth = 3; for (let rr = 6; rr < 18; rr += 4) { ctx.beginPath(); ctx.arc(Rl.x, Rl.y, rr, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(Rl.x, Rl.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Rl.x - 14, Rl.y + 16, 4, 0, Math.PI * 2); ctx.fill();   // brass nozzle
    // the kitchen corner: a counter with a stove and a shelf of cans on the wall below (the pot bubbles live)
    const K = F.KITCHEN, Pt = F.POT;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(K.x0 + 3, K.y0 + 3, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0, K.y1 - K.y0);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(K.x0, K.y0, K.x1 - K.x0, 6);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(K.x0 + 6, K.y0 + 12, 28, 26); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(K.x0 + 9, K.y0 + 15, 22, 8);   // a cupboard and a drawer
    ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, K.x1 - 42, K.y0 - 4, 38, 14, 3); ctx.fill();   // the stove top
    ctx.fillStyle = '#ff5252'; for (const kx of [K.x1 - 34, K.x1 - 14]) { ctx.beginPath(); ctx.arc(kx, K.y0 + 2, 2.2, 0, Math.PI * 2); ctx.fill(); }   // knobs
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.ellipse(Pt.x, Pt.y + 2, 16, 6, 0, 0, Math.PI * 2); ctx.fill();   // the pot's shadow on the stove
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(K.x0 + 4, R.y1 + 2, K.x1 - K.x0 - 8, 5);   // a shelf on the bottom wall
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#d32f2f', '#41b883', '#f2b134', '#3b7dd8'][i]; U.roundRect(ctx, K.x0 + 10 + i * 18, R.y1 + 8, 12, 12, 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.fillRect(K.x0 + 12 + i * 18, R.y1 + 12, 8, 3); }
    // the cat's cushion in the far corner and the Dalmatian's basket
    const C = F.CAT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(C.x + 2, C.y + 8, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.ellipse(C.x, C.y + 6, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a97ae0'; ctx.beginPath(); ctx.ellipse(C.x, C.y + 4, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    const Dh = F.DOG_HOME;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Dh.x + 2, Dh.y + 8, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b5773a'; ctx.beginPath(); ctx.ellipse(Dh.x, Dh.y + 6, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(Dh.x, Dh.y + 5, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    // the door in the bottom wall, its mat, and the station's name plate below
    const X = F.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(X.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(X.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(X.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#d32f2f'; ctx.fillRect(X.x - 21 + i * 14, X.y - 8, 14, 14); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(X.x - 21, X.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', X.x, X.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, X.x - 60, R.y1 + w + 4, 120, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🚒 TOWN FIRE STATION 🚒', X.x, R.y1 + w + 11);
  },

  // ---------- shared art ----------
  drawFlame(ctx, x, y, s, t) {
    const f = Math.sin(t * 9) * 0.12;
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x - s * 1.2, y - s * 1.4, x + f * s, y - s * 2.4); ctx.quadraticCurveTo(x + s * 1.2, y - s * 1.4, x + s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.8, x + f * s * 0.5, y - s * 1.4); ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.8, x + s * 0.5, y); ctx.closePath(); ctx.fill();
  },
  // a fire helmet: dome, back brim and a shield badge, drawn with its brim at (x, y)
  drawHelmet(ctx, x, y, f, rad, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 3, rad * 1.3, rad * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, rad, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - rad, y - 1, rad * 2, 3);
    ctx.beginPath(); ctx.ellipse(x - f * rad * 0.2, y + 1, rad * 1.3, rad * 0.32, 0, 0, Math.PI * 2); ctx.fill();   // the brim, longer at the back
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - rad * 0.35, y - rad * 0.55, rad * 0.3, rad * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();   // shine
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - 1.5, y - rad, 3, rad - 2);   // ridge
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x + f * 3 - 3.5, y - rad * 0.65, 7, 7, 2); ctx.fill();   // the badge
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(x + f * 3 - 1, y - rad * 0.65 + 2, 2, 3);
  },
  // a firefighter in a yellow turnout coat with silver stripes and a red helmet (one of them in a yellow helmet)
  drawFirefighter(r, g, c) {
    const ctx = r.ctx, f = c.facing || 1, bob = c.moving ? Math.sin(c.bob || 0) * 2 : 0;
    r.drawPerson(c.x, c.y, { shirt: '#f2b134', pants: '#2d3a4a', skin: ['#f1c27d', '#8d5a2b', '#e0ac69'][c.i] || '#e0ac69', hair: '#2b1d14', hairStyle: 0, facing: f, moving: c.moving, bob: c.bob, carry: 0, belt: true });
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(c.x - 12, c.y - 25 + bob, 24, 2.5); ctx.fillRect(c.x - 12, c.y - 19 + bob, 24, 2.5);   // reflective stripes
    this.drawHelmet(ctx, c.x, c.y - 42 + bob, f, 13, c.i === 1 ? '#ffd166' : '#d32f2f');
  },
  drawChefHelmet(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    this.drawHelmet(ctx, p.x, p.y - 46 + bob, f, 16, '#d32f2f');
  },
  // a steaming bowl of chili in the chef's hand
  drawBowl(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 17, y = p.y - 18 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.lineTo(x + 9, y - 4); ctx.lineTo(x + 6, y + 4); ctx.lineTo(x - 6, y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b23a1f'; ctx.beginPath(); ctx.ellipse(x, y - 4, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 3, y - 5, 2, 2); ctx.fillRect(x + 2, y - 4, 2, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; for (const d of [-4, 2]) { ctx.beginPath(); ctx.moveTo(x + d, y - 8); ctx.quadraticCurveTo(x + d + Math.sin(t * 4 + d) * 3, y - 13, x + d, y - 18); ctx.stroke(); }
  },
  // the Dalmatian: white with black spots, a floppy black ear and a red collar; trots, sits, or sleeps curled up
  drawDog(r, g, d) {
    const ctx = r.ctx, x = d.x, y = d.y, f = d.facing || 1, bob = d.moving ? Math.sin(d.bob) * 1.5 : 0, st = d.moving ? Math.sin(d.bob) * 3 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    const spot = (sx, sy, rr) => { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.fill(); };
    let hx, hy;
    if (d.sleep) {
      // curled up asleep: a round body, the head resting on the paws, tail tucked round
      const br = 1 + Math.sin(g.time * 2) * 0.03;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y - 7, 17 * br, 10 * br, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      spot(x - 8, y - 9, 2.6); spot(x + 3, y - 12, 2.2); spot(x + 8, y - 5, 2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - f * 14, y - 3); ctx.quadraticCurveTo(x - f * 4, y + 4, x + f * 6, y + 1); ctx.stroke();
      hx = x + f * 10; hy = y - 6;
      ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(hx - f * 5, hy + 4, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(hx - f * 5, hy - 3, 4, 5, f * 0.5, 0, Math.PI * 2); ctx.fill();   // ear
      spot(hx + f * 3, hy - 3, 3);
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx + f * 3, hy - 3, 1.6, 0, Math.PI); ctx.stroke();   // a closed eye
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hx + f * 8, hy + 1, 1.8, 0, Math.PI * 2); ctx.fill();
      const zk = (d.zT % 2.4) / 2.4;
      ctx.fillStyle = `rgba(154,208,255,${(1 - zk).toFixed(2)})`; ctx.font = r.font(9 + zk * 4); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', hx + f * 10 + zk * 8, hy - 14 - zk * 16);
      return;
    }
    if (d.sit) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - f * 5, y - 7, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + f * 3, y - 16, 9, 14, f * 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x + f * 4 - 2, y - 12, 4, 15, 2); ctx.fill(); U.roundRect(ctx, x + f * 10 - 2, y - 12, 4, 15, 2); ctx.fill();
      spot(x - f * 8, y - 8, 2.6); spot(x + f * 2, y - 22, 2.2); spot(x - f * 1, y - 13, 2); spot(x + f * 6, y - 8, 1.8);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - f * 14, y - 4); ctx.quadraticCurveTo(x - f * 24, y - 2 + Math.sin(d.wag) * 3, x - f * 22, y + 2); ctx.stroke();
      hx = x + f * 9; hy = y - 32;
    } else {
      ctx.fillStyle = '#fff';
      U.roundRect(ctx, x - 10, y - 6 + st, 4, 9, 2); ctx.fill(); U.roundRect(ctx, x + 6, y - 6 - st, 4, 9, 2); ctx.fill(); U.roundRect(ctx, x - 4, y - 6 - st, 4, 9, 2); ctx.fill(); U.roundRect(ctx, x + 1, y - 6 + st, 4, 9, 2); ctx.fill();
      U.roundRect(ctx, x - 14, y - 18 + bob, 28, 15, 7); ctx.fill(); ctx.stroke();
      spot(x - 8, y - 12 + bob, 2.6); spot(x + 2, y - 8 + bob, 2); spot(x + 7, y - 14 + bob, 2.3); spot(x - 2, y - 15 + bob, 1.7);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - f * 13, y - 12 + bob); ctx.lineTo(x - f * 21, y - 20 + bob + Math.sin(d.wag) * 5); ctx.stroke();
      hx = x + f * 12; hy = y - 20 + bob;
    }
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(hx - f * 4, hy + 7, 6, 3, 0, 0, Math.PI * 2); ctx.fill();   // collar
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#f1d3a8'; ctx.beginPath(); ctx.ellipse(hx + f * 5, hy + 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    spot(hx + f * 4, hy - 3, 3.2);   // the patch over one eye
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(hx - f * 6, hy - 3, 4, 6, f * 0.5, 0, Math.PI * 2); ctx.fill();   // floppy ear
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + f * 4, hy - 3, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hx + f * 4.5, hy - 3, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + f * 9, hy + 2, 1.8, 0, Math.PI * 2); ctx.fill();   // nose
    if (d.happy > 0) { ctx.fillStyle = '#ff6b8a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', hx, hy - 14); }
  },
  // the station's cat: a ginger tabby curled on its cushion; lifts its head and purrs when petted
  drawCat(r, g) {
    const ctx = r.ctx, C = CFG.FIRESTATION.CAT, x = C.x, y = C.y, t = g.time, happy = this.st.catHappy > 0, br = 1 + Math.sin(t * 1.6) * 0.03;
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    ctx.fillStyle = '#f29b4a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 16 * br, 9 * br, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c96f2a'; for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * 7 - 1.5, y - 14, 3, 7);   // stripes
    ctx.strokeStyle = '#f29b4a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 14, y - 2); ctx.quadraticCurveTo(x - 2, y + 4 + (happy ? Math.sin(t * 8) * 3 : 0), x + 10 + (happy ? Math.sin(t * 8) * 4 : 0), y + 1); ctx.stroke();   // tail
    const hy = happy ? y - 18 : y - 8, hx = x + 10;
    ctx.fillStyle = '#f29b4a'; ctx.beginPath(); ctx.arc(hx, hy, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx - 7, hy - 3); ctx.lineTo(hx - 6, hy - 11); ctx.lineTo(hx - 1, hy - 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + 7, hy - 3); ctx.lineTo(hx + 6, hy - 11); ctx.lineTo(hx + 1, hy - 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(hx, hy + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();   // muzzle
    ctx.fillStyle = '#e07a9a'; ctx.beginPath(); ctx.arc(hx, hy + 2, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2;
    if (happy) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hx - 3, hy - 1, 1.3, 0, Math.PI * 2); ctx.arc(hx + 3, hy - 1, 1.3, 0, Math.PI * 2); ctx.fill(); }
    else for (const d of [-3, 3]) { ctx.beginPath(); ctx.arc(hx + d, hy - 1, 1.6, 0, Math.PI); ctx.stroke(); }   // eyes shut
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + d * 4, hy + 2); ctx.lineTo(hx + d * 12, hy); ctx.moveTo(hx + d * 4, hy + 3.5); ctx.lineTo(hx + d * 12, hy + 5); ctx.stroke(); }   // whiskers
    if (!happy) { const zk = (t % 2.6) / 2.6; ctx.fillStyle = `rgba(154,208,255,${(1 - zk).toFixed(2)})`; ctx.font = r.font(8 + zk * 3); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', hx + 10 + zk * 6, hy - 12 - zk * 14); }
  },
  // the town's own truck in its bay: the core's top-down art, nose to the roller door; the chef's hat shows in the cab
  drawTruck(r, g) {
    const ctx = r.ctx, F = CFG.FIRESTATION, T = F.TRUCK, st = this.st, t = g.time;
    if (st.cab) this.paintFloor(ctx, F.BAY.x0 - 12, F.BAY.y0 - 24, F.BAY.x1 + 12, F.BAY.y1 + 10);   // hides the core's standing chef under the seat
    const flashing = !!(st.cab || st.alarm), on = Math.floor(t * 6) % 2;
    if (flashing) {
      ctx.fillStyle = on ? 'rgba(255,82,82,0.3)' : 'rgba(77,141,255,0.3)';
      ctx.beginPath(); ctx.arc(T.x - 36, T.y - 10, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = on ? 'rgba(77,141,255,0.3)' : 'rgba(255,82,82,0.3)';
      ctx.beginPath(); ctx.arc(T.x - 36, T.y + 10, 22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(T.x, T.y); ctx.rotate(Math.PI);
    r.drawVehicle('firetruck', g, '#d32f2f');
    if (st.cab) {
      // the chef's hat and face seen through the cab roof
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(38, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(41, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(39, 0, 5, 0, Math.PI * 2); ctx.fill();
      if (st.helmet > 0) { ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(38, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(40, -2, 4, 4); }
    }
    ctx.restore();
  },
  // the empty bay while the truck is out: an oil stain and a BACK SOON cone
  drawEmptyBay(r, g) {
    const ctx = r.ctx, F = CFG.FIRESTATION, S = F.STAIN, C = F.CONE;
    ctx.fillStyle = 'rgba(40,30,30,0.35)'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(S.x + 18, S.y + 6, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(S.x - 20, S.y - 5, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,160,220,0.25)'; ctx.beginPath(); ctx.ellipse(S.x - 6, S.y - 2, 10, 3, 0, 0, Math.PI * 2); ctx.fill();   // a rainbow sheen
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(C.x + 2, C.y + 4, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(C.x - 5, C.y - 26); ctx.lineTo(C.x + 5, C.y - 26); ctx.lineTo(C.x + 11, C.y); ctx.lineTo(C.x - 11, C.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(C.x - 8, C.y - 14, 16, 4);
    ctx.fillStyle = '#2b2b2b'; ctx.fillRect(C.x - 13, C.y - 2, 26, 4);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, C.x - 24, C.y - 46, 48, 16, 3); ctx.fill(); ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2; U.roundRect(ctx, C.x - 24, C.y - 46, 48, 16, 3); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BACK SOON 🍕', C.x, C.y - 38);
    ctx.fillStyle = '#ff7043'; ctx.fillRect(C.x - 1, C.y - 30, 2, 6);
  },
  drawTarget(r, g) {
    const ctx = r.ctx, T = CFG.FIRESTATION.TARGET, a = this.st.targetSpin, sx = Math.cos(a);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(T.x + 2, T.y + 6, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, T.x - 14, T.y - 2, 28, 8, 3); ctx.fill(); ctx.fillRect(T.x - 2, T.y - 24, 4, 24);
    ctx.save(); ctx.translate(T.x, T.y - 30); ctx.scale(Math.max(0.08, Math.abs(sx)), 1);
    const back = sx < 0;
    const rings = back ? ['#8d5a2b', '#8d5a2b', '#8d5a2b'] : ['#d32f2f', '#fff8ee', '#ffd166'];
    [18, 12, 6].forEach((rr, i) => { ctx.fillStyle = rings[i]; ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
    if (!back) { this.drawFlame(ctx, 0, 8, 6, g.time); }   // a little flame to put out
    ctx.restore();
  },
  drawBell(r, g) {
    const ctx = r.ctx, B = CFG.FIRESTATION.BELL, s = this.st.bellSwing, a = s > 0 ? Math.sin(g.time * 14) * 0.45 * Math.min(1, s) : 0;
    ctx.save(); ctx.translate(B.x, B.y - 14); ctx.rotate(a);
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(4, 10); ctx.quadraticCurveTo(12, 18, 13, 24); ctx.lineTo(-13, 24); ctx.quadraticCurveTo(-12, 18, -4, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b8862c'; ctx.fillRect(-13, 22, 26, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-5, 6, 3, 14);
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(0, 27, 3.5, 0, Math.PI * 2); ctx.fill();   // clapper
    ctx.restore();
    if (s > 0) { ctx.strokeStyle = `rgba(255,224,138,${(Math.min(1, s) * 0.7).toFixed(2)})`; ctx.lineWidth = 2; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(B.x + d * 16, B.y + 2, 6, d > 0 ? -0.9 : Math.PI - 0.9, d > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke(); } }
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B.x, B.y + 14); ctx.lineTo(B.x + Math.sin(g.time * 2) * 1.5, B.y + 30); ctx.stroke();   // the rope to pull
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(B.x + Math.sin(g.time * 2) * 1.5, B.y + 32, 3, 0, Math.PI * 2); ctx.fill();
  },
  drawRailing(r, g) {
    const ctx = r.ctx, G = CFG.FIRESTATION.GALLERY, P = CFG.FIRESTATION.POLE;
    ctx.fillStyle = '#e0b44c';
    for (let x = G.x0 + 6; x < G.x1; x += 22) if (Math.abs(x - P.x) > 12) ctx.fillRect(x - 1.5, G.y1 - 26, 3, 26);
    ctx.fillRect(G.x0, G.y1 - 28, P.x - 16 - G.x0, 4); ctx.fillRect(P.x + 16, G.y1 - 28, G.x1 - P.x - 16, 4);   // top rail with a gap at the pole
    ctx.fillStyle = '#b8862c'; ctx.fillRect(G.x0, G.y1 - 2, G.x1 - G.x0, 3);
  },
  drawPole(r, g) {
    const ctx = r.ctx, P = CFG.FIRESTATION.POLE, G = CFG.FIRESTATION.GALLERY;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(P.x, G.floor + 8, 12, 5, 0, 0, Math.PI * 2); ctx.fill();   // the hole in the gallery floor
    ctx.fillStyle = '#5c6670'; ctx.fillRect(P.x - 10, P.top - 40, 20, 5);   // ceiling bracket
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(P.x - 2, P.top - 36, 9, P.bottom - P.top + 46);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(P.x - 4, P.top - 36, 8, P.bottom - P.top + 46);
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(P.x - 3, P.top - 36, 2.5, P.bottom - P.top + 46);
    ctx.fillStyle = '#b8862c'; ctx.fillRect(P.x - 1, P.top - 36, 2, P.bottom - P.top + 46);
  },
  // the pot of chili on the stove: a red bubbling surface, steam and a ladle
  drawPot(r, g) {
    const ctx = r.ctx, P = CFG.FIRESTATION.POT, t = g.time;
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, P.x - 16, P.y - 18, 32, 20, 4); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(P.x - 22, P.y - 12, 6, 3); ctx.fillRect(P.x + 16, P.y - 12, 6, 3);   // handles
    ctx.fillStyle = '#b23a1f'; ctx.beginPath(); ctx.ellipse(P.x, P.y - 18, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) { const k = ((t * 1.3 + i * 0.37) % 1), bx = P.x - 9 + i * 6, by = P.y - 18 - Math.sin(k * Math.PI) * 2; ctx.fillStyle = k < 0.6 ? '#ff7043' : '#b23a1f'; ctx.beginPath(); ctx.arc(bx, by, 1.5 + Math.sin(k * Math.PI) * 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffd166'; ctx.fillRect(P.x - 2, P.y - 20, 2, 2);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(P.x + 6, P.y - 34, 2, 16); ctx.beginPath(); ctx.arc(P.x + 7, P.y - 34, 3, 0, Math.PI * 2); ctx.fill();   // the ladle
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const k = ((t * 0.6 + i * 0.33) % 1), sx = P.x - 8 + i * 8; ctx.beginPath(); ctx.moveTo(sx, P.y - 22 - k * 4); ctx.quadraticCurveTo(sx + Math.sin(t * 3 + i) * 4, P.y - 30 - k * 12, sx, P.y - 38 - k * 18); ctx.globalAlpha = 1 - k; ctx.stroke(); ctx.globalAlpha = 1; }
  },
  drawHoseAndWater(r, g) {
    const ctx = r.ctx, s = this.st.spray; if (!s) return;
    const F = CFG.FIRESTATION, p = g.player, Rl = F.REEL, T = F.TARGET, nx = p.x + 18, ny = p.y - 22, t = s.t;
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Rl.x - 14, Rl.y + 16); ctx.quadraticCurveTo(Rl.x - 60, Rl.y + 90, p.x - 10, p.y + 2); ctx.quadraticCurveTo(p.x - 14, p.y - 16, nx - 6, ny); ctx.stroke();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, nx - 6, ny - 3, 12, 6, 2); ctx.fill();   // the brass nozzle
    const tx = T.x, ty = T.y - 30;
    for (let k = 0; k < 16; k++) {
      const ph = t * 2.6 - k * 0.09; if (ph < 0 || ph > 1) continue;
      const x = U.lerp(nx, tx, ph), y = U.lerp(ny, ty, ph) - Math.sin(ph * Math.PI) * 34 + Math.sin(k * 7.3) * 3;
      ctx.fillStyle = k % 3 ? '#9fd8ff' : '#e3f4ff'; ctx.beginPath(); ctx.arc(x, y, 3.5 - ph * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    if (t > 0.45) {
      const k = Math.min(1, (t - 0.45) / 0.6);
      ctx.fillStyle = `rgba(159,216,255,${(0.6 * (1 - k)).toFixed(2)})`;
      for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.2 - i * 0.28 - 0.5; ctx.beginPath(); ctx.arc(tx + Math.cos(a) * (14 + k * 34), ty + Math.sin(a) * (14 + k * 34) + k * k * 24, 3.5 - k * 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = `rgba(159,216,255,${(0.45 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(tx, T.y + 4, 10 + k * 22, 4 + k * 5, 0, 0, Math.PI * 2); ctx.fill();
    }
  },
  // stop, drop and roll: the chef drawn by this file lying on the floor and rolling over (the core's chef is covered)
  drawRoll(r, g) {
    const ctx = r.ctx, F = CFG.FIRESTATION, S = F.POSTER_SPOT, ro = this.st.roll; if (!ro) return;
    const t = ro.t, look = { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' };
    if (t < 0.5) {
      // STOP: hands up (the core draws the chef standing; add the raised arms)
      const k = Math.min(1, t / 0.25);
      ctx.strokeStyle = '#f1c27d'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(S.x + d * 13, S.y - 18); ctx.lineTo(S.x + d * (16 + 2 * k), S.y - 18 - 22 * k); ctx.stroke(); }
      return;
    }
    this.paintFloor(ctx, F.ROOM.x0, F.ROOM.y0, S.x + 60, S.y + 46);   // cover the core's standing chef
    let a;
    if (t < 0.9) a = U.easeOut((t - 0.5) / 0.4) * Math.PI / 2;                            // DROP
    else if (t < 2) a = Math.PI / 2 + ((t - 0.9) / 1.1) * Math.PI * 4;                        // ROLL: two turns
    else a = Math.PI / 2 * (1 - U.ease(Math.min(1, (t - 2) / (F.ROLL_T - 2))));              // back up
    const wob = t >= 0.9 && t < 2 ? Math.sin(((t - 0.9) / 1.1) * Math.PI) * 10 : 0;
    ctx.save(); ctx.translate(S.x + wob, S.y - 28 + 22 * Math.min(1, Math.abs(Math.sin(a)))); ctx.rotate(a);   // the figure's middle: upright its feet are on the spot, lying down its side is
    r.drawPerson(0, 28, look);
    ctx.restore();
  },

  // ---------- moving things ----------
  // outside the station's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.FIRESTATION.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'town') {
      // the lamp over the little door glows warmly after dark... and a little in the day too
      const D = CFG.FIRESTATION.DOOR_OUT, k = 0.5 + 0.5 * Math.sin(t * 2);
      ctx.fillStyle = `rgba(255,224,138,${(0.1 + k * 0.1).toFixed(2)})`; ctx.beginPath(); ctx.arc(CFG.FIRE_STATION.x0 + 38, D.y - 17, 10 + k * 3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (g.area !== 'firestation') return;
    this.drawOutside(r, g);
    if (!this.truckHome(g)) this.drawEmptyBay(r, g);
    this.drawPole(r, g);
    this.drawBell(r, g);
    this.drawPot(r, g);
    if (this.st.alarm) { const B = CFG.FIRESTATION.BELL, on = Math.floor(t * 6) % 2; ctx.fillStyle = on ? 'rgba(255,82,82,0.35)' : 'rgba(255,82,82,0.1)'; ctx.beginPath(); ctx.arc(B.x, B.y - 30, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = on ? '#ff5252' : '#b71c1c'; ctx.beginPath(); ctx.arc(B.x, B.y - 30, 4, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, F = CFG.FIRESTATION;
    if (!g.driving && !g.onTrain && !st.cab && !(st.roll && st.roll.t >= 0.5)) {
      if (st.helmet > 0) items.push({ y: p.y + 1, draw: () => this.drawChefHelmet(r, g) });
      if (st.chili > 0) items.push({ y: p.y + 1, draw: () => this.drawBowl(r, g) });
    }
    if (g.area !== 'firestation') return;
    items.push({ y: F.GALLERY.y1 - 1, draw: () => this.drawRailing(r, g) });
    if (this.truckHome(g)) items.push({ y: st.cab ? p.y + 1 : F.TRUCK.y + 10, draw: () => this.drawTruck(r, g) });
    items.push({ y: F.TARGET.y + 2, draw: () => this.drawTarget(r, g) });
    for (const c of st.crew) items.push({ y: c.y, draw: () => this.drawFirefighter(r, g, c) });
    items.push({ y: st.dog.y, draw: () => this.drawDog(r, g, st.dog) });
    items.push({ y: F.CAT.y + 2, draw: () => this.drawCat(r, g) });
    if (st.spray) items.push({ y: p.y + 2, draw: () => this.drawHoseAndWater(r, g) });
    if (st.roll) items.push({ y: p.y + 1, draw: () => this.drawRoll(r, g) });
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(FireStationExt);   // first in line so the door's button and hint beat the town's own hints
Render.ext.push(FireStationExt);
