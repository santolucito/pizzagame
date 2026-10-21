'use strict';
// The fire station: City building 19 (lower row, facing Harbour Street) gets a '🚒 FIRE DEPT' sign, a red bay door and a
// flashing beacon. Step inside for the engine bay: a shiny red fire engine you can climb into (the lights flash and the
// siren goes wee-woo), a wall of helmets and coats (try a helmet on), a brass fire pole from the upstairs gallery (climb
// the stairs, then slide down), a Dalmatian that follows you about and sits when you stop, a hose reel and a practice
// target to spray, a saluting captain, a fire bell that calls the whole crew down the pole, and a $4 toy fire engine.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.FIREDEPT = {
  BUILDING: 19,                                  // index in CFG.CITY.BUILDINGS: { x0: 5910, y0: 650, x1: 6060, y1: 876 }
  DOOR_OUT: { x: 5985, y: 890 },                 // on the sidewalk just below the door
  WORLD: { x0: 15800, y0: 3000, x1: 16400, y1: 3400 },
  ROOM: { x0: 15840, y0: 3100, x1: 16360, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: helmets, bell and the gallery hang on it
  ENGINE: { x0: 15868, y0: 3172, x1: 16060, y1: 3254 },        // the fire engine, side-on, cab at the right end
  CAB_IN: { x: 16086, y: 3240 },                 // stand here to climb into the cab
  CAB_SEAT: { x: 16034, y: 3238 },               // where the chef sits (seen through the cab window)
  HELMETS: { x0: 15862, y0: 3030, x1: 15984, y1: 3094 }, HELMET_SPOT: { x: 15922, y: 3124 },
  BELL: { x: 16012, y: 3072 }, BELL_SPOT: { x: 16012, y: 3124 },
  GALLERY: { x0: 16100, y0: 3040, x1: 16352, y1: 3084, floor: 3066 },   // the upstairs balcony along the back wall
  STAIRS: { foot: { x: 16064, y: 3128 }, top: { x: 16106, y: 3066 } },
  POLE: { x: 16190, top: 3066, bottom: 3152, land: { x: 16190, y: 3164 } },
  CREW_HOMES: [{ x: 16236, y: 3066 }, { x: 16282, y: 3066 }, { x: 16328, y: 3066 }],
  CAPTAIN_HOME: { x: 15892, y: 3292 },
  LINE: [{ x: 16100, y: 3270 }, { x: 16140, y: 3270 }, { x: 16180, y: 3270 }, { x: 16220, y: 3270 }],   // captain first, then the crew
  REEL: { x: 16372, y: 3166 }, SPRAY: { x: 16250, y: 3210 }, TARGET: { x: 16330, y: 3210 },
  PADS: { toy: { x: 16300, y: 3300 } },
  DOG_HOME: { x: 15980, y: 3300 },
  EXIT: { x: 16110, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  CLIMB: 0.9, WALK: 1.0, SLIDE: 0.8, SPRAY_T: 1.7, LINE_T: 5, HELMET: 30, TOY: 40,   // seconds
};
CFG.AREAS.firedept = { WORLD: CFG.FIREDEPT.WORLD };

const FireDeptExt = {
  name: 'firedept',
  st: null,
  defaults: { firedept: { seen: false, rides: 0, slides: 0, helmets: 0, sprays: 0, bells: 0, toys: 0 } },

  // ---------- state ----------
  build(g) {
    const F = CFG.FIREDEPT;
    if (!g.s.firedept) g.s.firedept = { seen: false, rides: 0, slides: 0, helmets: 0, sprays: 0, bells: 0, toys: 0 };
    this.st = {
      fade: 0,
      cab: null, climb: null, up: false, slide: null, spray: null,   // the chef's scripted moments: { t }
      helmet: 0, toy: 0, bellSwing: 0, targetSpin: 0, splashed: false,
      alarm: null, lineT: 0,                                           // the bell's alarm: { t } while the crew is out
      captain: { x: F.CAPTAIN_HOME.x, y: F.CAPTAIN_HOME.y, facing: 1, moving: false, bob: 0, state: 'home', salute: 0, greeted: false, wait: 0 },
      crew: F.CREW_HOMES.map((h, i) => ({ x: h.x, y: h.y, facing: -1, moving: false, bob: 0, state: 'up', i, t: 0, wait: 0 })),
      dog: { x: F.DOG_HOME.x, y: F.DOG_HOME.y, facing: 1, moving: false, bob: 0, wag: 0, sit: false, still: 0, happy: 0, trail: [], last: null },
      obs: null,
    };
    const R = F.ROOM, w = F.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: F.ENGINE.x0, y: F.ENGINE.y0, w: F.ENGINE.x1 - F.ENGINE.x0, h: F.ENGINE.y1 - F.ENGINE.y0 });
    o.push({ x: F.TARGET.x - 14, y: F.TARGET.y - 6, w: 28, h: 14 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'firedept' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.FIREDEPT.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inCityStreet(g) { return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  atDoor(g) { const D = CFG.FIREDEPT.DOOR_OUT, p = g.player; return this.inCityStreet(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  busy() { const st = this.st; return !!(st.cab || st.climb || st.up || st.slide || st.spray); },
  near(g, s, r = 30) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < r; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const F = CFG.FIREDEPT, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'firedept') return null;
    if (st.cab) return { label: '🚶 Climb out', run: (gg) => this.climbOut(gg) };
    if (st.up) return { label: '🧑‍🚒 Slide down!', run: (gg) => this.slideDown(gg) };
    if (st.climb || st.slide || st.spray) return null;
    if (this.near(g, F.EXIT)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, F.CAB_IN)) return { label: '🚒 Climb in', run: (gg) => this.climbIn(gg) };
    if (this.near(g, F.STAIRS.foot)) return { label: '🪜 Climb the stairs', run: (gg) => this.climbStairs(gg) };
    if (this.near(g, F.HELMET_SPOT)) return { label: '⛑️ Try a helmet', run: (gg) => this.tryHelmet(gg) };
    if (this.near(g, F.BELL_SPOT)) return { label: '🔔 Ring the bell', run: (gg) => this.ringBell(gg) };
    if (this.near(g, F.SPRAY)) return { label: '💦 Spray the hose', run: (gg) => this.sprayHose(gg) };
    return null;
  },
  enter(g) {
    const F = CFG.FIREDEPT, p = g.player, st = this.st;
    g.area = 'firedept'; p.x = F.EXIT.x; p.y = F.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; Sfx.ding(); Haptics.tap();
    const d = st.dog; d.x = F.DOG_HOME.x; d.y = F.DOG_HOME.y; d.trail = []; d.last = null; d.sit = true; d.still = 1;
    if (!g.s.firedept.seen) { g.s.firedept.seen = true; g.toast('🚒 Welcome to the fire station!', true); }
  },
  leave(g) {
    const F = CFG.FIREDEPT, p = g.player;
    g.area = 'city'; p.x = F.DOOR_OUT.x; p.y = F.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.clearScripted(); this.st.fade = 0.45; Sfx.drop();
  },
  clearScripted() { const st = this.st; st.cab = null; st.climb = null; st.up = false; st.slide = null; st.spray = null; },
  climbIn(g) {
    const F = CFG.FIREDEPT, p = g.player;
    this.st.cab = { t: 0 }; p.x = F.CAB_SEAT.x; p.y = F.CAB_SEAT.y; p.moving = false; p.facing = 1;
    g.s.firedept.rides++;
    Sfx.pickup(); Haptics.tap();
    // the siren, once: wee (up) then woo (down)
    Sfx.tone(620, 0.32, 'square', 0.03, 320); setTimeout(() => Sfx.tone(920, 0.36, 'square', 0.03, -340), 320);
    g.floats.push({ x: p.x, y: p.y - 90, text: 'Wee-woo! 🚒', color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },
  climbOut(g) {
    const F = CFG.FIREDEPT, p = g.player;
    this.st.cab = null; p.x = F.CAB_IN.x; p.y = F.CAB_IN.y; p.moving = false; p.facing = 1; Sfx.drop();
  },
  climbStairs(g) {
    const p = g.player; this.st.climb = { t: 0 }; p.moving = false; Sfx.pickup(); Haptics.tap();
  },
  slideDown(g) {
    const F = CFG.FIREDEPT, p = g.player;
    this.st.up = false; this.st.slide = { t: 0 }; p.x = F.POLE.x; p.y = F.POLE.top; p.moving = false; p.facing = 1;
    Sfx.tone(880, 0.7, 'sine', 0.04, -600); Haptics.tap();
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Wheee!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
  },
  tryHelmet(g) {
    const p = g.player; this.st.helmet = CFG.FIREDEPT.HELMET; g.s.firedept.helmets++; g.player.facing = 1;
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-14, 14), y0: p.y - 56 + U.rand(-8, 8), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
    g.floats.push({ x: p.x, y: p.y - 80, text: 'Firefighter chef! ⛑️', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.success();
  },
  ringBell(g) {
    const st = this.st, p = g.player;
    st.bellSwing = 1.6; Sfx.ding(); Haptics.tap(); g.s.firedept.bells++;
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Ding ding! 🔔', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    if (st.alarm) return;   // the crew is already on its way
    st.alarm = { t: 0 }; st.lineT = 0;
    st.crew.forEach((c, i) => { c.state = 'toPole'; c.wait = i * 0.55; });
    st.captain.state = 'toLine'; st.captain.wait = 0.3;
  },
  sprayHose(g) {
    const F = CFG.FIREDEPT, p = g.player;
    this.st.spray = { t: 0 }; this.st.splashed = false; p.x = F.SPRAY.x; p.y = F.SPRAY.y; p.moving = false; p.facing = 1;
    g.s.firedept.sprays++; Sfx.clean(); Haptics.tap();
  },
  home(g) {
    if (!this.st) return;
    const F = CFG.FIREDEPT, st = this.st;
    this.clearScripted(); st.fade = 0; st.alarm = null; st.lineT = 0; st.bellSwing = 0; st.targetSpin = 0;
    st.crew.forEach((c, i) => { c.x = F.CREW_HOMES[i].x; c.y = F.CREW_HOMES[i].y; c.state = 'up'; c.moving = false; c.facing = -1; });
    const cp = st.captain; cp.x = F.CAPTAIN_HOME.x; cp.y = F.CAPTAIN_HOME.y; cp.state = 'home'; cp.moving = false; cp.salute = 0;
    const d = st.dog; d.x = F.DOG_HOME.x; d.y = F.DOG_HOME.y; d.trail = []; d.last = null; d.moving = false;
  },
  // a save or a push that left the chef in a wall or inside the engine goes back onto the door mat
  rescue(g) {
    const p = g.player, F = CFG.FIREDEPT;
    if (this.free(p.x, p.y)) return false;
    p.x = F.EXIT.x; p.y = F.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, F = CFG.FIREDEPT;
    st.fade = Math.max(0, st.fade - dt);
    st.helmet = Math.max(0, st.helmet - dt);
    st.toy = Math.max(0, st.toy - dt);
    st.bellSwing = Math.max(0, st.bellSwing - dt);
    if (g.area !== 'firedept') { if (this.busy()) this.clearScripted(); if (st.alarm) this.home(g); return; }
    // ---- the chef's scripted moments
    if (st.cab) {
      st.cab.t += dt; p.x = F.CAB_SEAT.x; p.y = F.CAB_SEAT.y; p.moving = false; p.facing = 1;
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
        st.slide = null; p.x = F.POLE.land.x; p.y = F.POLE.land.y; g.s.firedept.slides++;
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
    } else {
      this.rescue(g);
    }
    // ---- the captain salutes whoever comes close
    const cp = st.captain, dCap = U.dist(p.x, p.y, cp.x, cp.y);
    if (cp.state === 'home') {
      if (dCap < 70 && !this.busy()) {
        cp.facing = p.x < cp.x ? -1 : 1; cp.salute = Math.min(1, cp.salute + dt * 4);
        if (!cp.greeted) { cp.greeted = true; g.floats.push({ x: cp.x, y: cp.y - 66, text: '🫡', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
      } else { cp.salute = Math.max(0, cp.salute - dt * 3); if (dCap > 110) cp.greeted = false; }
    } else cp.salute = 0;
    // ---- the alarm: the crew slides down, lines up for a while, then climbs back up
    if (st.alarm) {
      st.alarm.t += dt;
      for (const c of st.crew) this.stepCrew(c, dt, F);
      this.stepCaptain(cp, dt, F);
      const allLined = st.crew.every((c) => c.state === 'line') && cp.state === 'line';
      if (allLined) {
        st.lineT += dt;
        if (st.lineT >= F.LINE_T) { st.crew.forEach((c, i) => { c.state = 'toStairs'; c.wait = i * 0.5; }); cp.state = 'toHome'; cp.wait = 0; }
      }
      if (st.crew.every((c) => c.state === 'up') && cp.state === 'home') st.alarm = null;
    }
    for (const c of st.crew) c.bob = c.moving ? c.bob + dt * 14 : 0;
    cp.bob = cp.moving ? cp.bob + dt * 14 : 0;
    // ---- the Dalmatian follows the chef's footsteps and sits when the chef stops
    this.stepDog(g, dt);
  },
  stepCrew(c, dt, F) {
    if (c.wait > 0) { c.wait -= dt; c.moving = false; return; }
    switch (c.state) {
      case 'toPole': if (U.moveToward(c, F.POLE.x, F.GALLERY.floor, 110, dt)) { c.state = 'slide'; c.t = 0; } break;
      case 'slide': { c.t += dt; const k = Math.min(1, c.t / F.SLIDE); c.x = F.POLE.x; c.y = U.lerp(F.POLE.top, F.POLE.land.y, k * k); c.moving = false; c.facing = 1; if (k >= 1) c.state = 'toLine'; break; }
      case 'toLine': { const L = F.LINE[c.i + 1]; if (U.moveToward(c, L.x, L.y, 130, dt)) { c.state = 'line'; c.facing = -1; } break; }
      case 'line': c.moving = false; c.facing = -1; break;
      case 'toStairs': if (U.moveToward(c, F.STAIRS.foot.x, F.STAIRS.foot.y, 120, dt)) { c.state = 'climb'; c.t = 0; } break;
      case 'climb': { c.t += dt; const k = U.ease(Math.min(1, c.t / F.CLIMB)); c.x = U.lerp(F.STAIRS.foot.x, F.STAIRS.top.x, k); c.y = U.lerp(F.STAIRS.foot.y, F.STAIRS.top.y, k); c.moving = true; c.facing = 1; if (k >= 1) c.state = 'toHome'; break; }
      case 'toHome': { const H = F.CREW_HOMES[c.i]; if (U.moveToward(c, H.x, H.y, 110, dt)) { c.state = 'up'; c.facing = -1; } break; }
      default: c.moving = false;
    }
  },
  stepCaptain(cp, dt, F) {
    if (cp.wait > 0) { cp.wait -= dt; cp.moving = false; return; }
    if (cp.state === 'toLine') { if (U.moveToward(cp, F.LINE[0].x, F.LINE[0].y, 130, dt)) { cp.state = 'line'; cp.facing = -1; } }
    else if (cp.state === 'line') { cp.moving = false; cp.facing = -1; }
    else if (cp.state === 'toHome') { if (U.moveToward(cp, F.CAPTAIN_HOME.x, F.CAPTAIN_HOME.y, 120, dt)) { cp.state = 'home'; cp.facing = 1; } }
  },
  stepDog(g, dt) {
    const d = this.st.dog, p = g.player, F = CFG.FIREDEPT;
    d.wag += dt * 10; d.happy = Math.max(0, d.happy - dt);
    // the chef in the cab or up on the gallery: the dog waits by the engine / under the pole
    const tx = this.st.cab ? F.CAB_IN.x : (this.st.climb || this.st.up || this.st.slide) ? F.POLE.land.x : p.x;
    const ty = this.st.cab ? F.CAB_IN.y + 18 : (this.st.climb || this.st.up || this.st.slide) ? F.POLE.land.y + 30 : p.y;
    // breadcrumbs: the chef's path, so the dog trots where the chef walked and never through the engine
    if (!d.last || U.dist(d.last.x, d.last.y, tx, ty) > 12) { d.last = { x: tx, y: ty }; d.trail.push(d.last); if (d.trail.length > 60) d.trail.shift(); }
    const dp = U.dist(d.x, d.y, tx, ty);
    if (dp > 52) {
      while (d.trail.length > 1 && U.dist(d.trail[0].x, d.trail[0].y, tx, ty) > dp) d.trail.shift();   // skip crumbs further from the chef than we are
      const tgt = d.trail.length ? d.trail[0] : { x: tx, y: ty };
      if (U.moveToward(d, tgt.x, tgt.y, 150, dt)) { d.trail.shift(); }
      d.moving = true; d.bob += dt * 16; d.sit = false; d.still = 0;
      if (d.trail.length === 0 || U.dist(d.x, d.y, tx, ty) <= 52) d.moving = d.trail.length > 0;
    } else {
      d.trail = []; d.moving = false; d.still += dt;
      if (d.still > 0.6) d.sit = true;
      if (dp > 20) d.facing = tx < d.x ? -1 : 1;
      if (dp < 40 && d.happy <= 0 && !this.busy()) { d.happy = 1.5; g.floats.push({ x: d.x, y: d.y - 40, text: '♥', color: '#ff6b8a', t: 0, dur: 1 }); }
    }
  },
  pads(g) {
    if (g.area !== 'firedept') return [];
    return [{ key: 'firedeptToy', label: 'Toy engine', ico: '🚒', pos: CFG.FIREDEPT.PADS.toy, price: 4, sub: 'wee-woo!' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'firedeptToy') return;
    const p = g.player; this.st.toy = CFG.FIREDEPT.TOY; g.s.firedept.toys++;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'A toy fire engine! 🚒', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, F = CFG.FIREDEPT, st = this.st, s = g.s.firedept;
    if (g.area === 'city') {
      if (!this.inCityStreet(g)) return undefined;
      const d = U.dist(p.x, p.y, F.DOOR_OUT.x, F.DOOR_OUT.y);
      if (d < 70) return { text: 'Visit the fire station! 🚒', target: d < 30 ? null : F.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'firedept') return undefined;
    if (st.cab) return { text: 'Wee-woo! Press the button to climb out 🚒', target: null };
    if (st.climb) return { text: 'Up we go! 🪜', target: null };
    if (st.up) return { text: 'Press the button to slide down the pole!', target: null };
    if (st.slide) return { text: 'Wheee! 🧑‍🚒', target: null };
    if (st.spray) return { text: 'Splash! 💦', target: null };
    if (!s.rides) return { text: 'Climb into the fire engine! 🚒', target: F.CAB_IN };
    if (!s.slides) return { text: 'Climb the stairs to the fire pole! 🪜', target: F.STAIRS.foot };
    if (!s.helmets) return { text: 'Try on a fire helmet! ⛑️', target: F.HELMET_SPOT };
    if (!s.sprays) return { text: 'Spray the target with the hose! 💦', target: F.SPRAY };
    if (!s.bells) return { text: 'Ring the fire bell! 🔔', target: F.BELL_SPOT };
    if (!s.toys && g.s.cash + (g.s.padPaid.firedeptToy || 0) >= 4) return { text: 'Buy a toy fire engine! 🚒', target: F.PADS.toy };
    if (st.helmet > 0) return { text: 'Looking brave! ⛑️', target: null };
    return { text: 'The Dalmatian loves you! 🐶', target: null };
  },

  // ---------- the City outside: the sign, a red bay door (static) and the beacon (live) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.FIREDEPT.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🚒 FIRE DEPT';
    // the right-hand shop window becomes a red roller door for the engine
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(cx + 12, gy + 6, b.x1 - 10 - cx - 12, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = gy + 10; y < gy + 40; y += 6) ctx.fillRect(cx + 14, y, b.x1 - 10 - cx - 16, 2);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(cx + 20, gy + 26, b.x1 - 10 - cx - 28, 3);
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // the beacon's bracket above the sign (the light itself flashes live)
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, cx - 8, gy - 30, 16, 6, 2); ctx.fill();
    // a red and white mat on the sidewalk in front of the door
    const D = CFG.FIREDEPT.DOOR_OUT;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#d32f2f'; ctx.fillRect(D.x - 15 + i * 10, D.y - 6, 10, 10); }
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
  },

  // ---------- the interior, static ----------
  paint: { firedept(r, g) { FireDeptExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, F = CFG.FIREDEPT, W = F.WORLD, R = F.ROOM, w = F.WALL;
    // outside the station: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, F.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - F.BACK_TOP);
    // the engine bay floor: grey concrete slabs, a yellow parking box under the engine
    ctx.fillStyle = '#b8bec6'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2; for (let x = R.x0 + 60; x < R.x1; x += 60) { ctx.beginPath(); ctx.moveTo(x, R.y0); ctx.lineTo(x, R.y1); ctx.stroke(); } for (let y = R.y0 + 60; y < R.y1; y += 60) { ctx.beginPath(); ctx.moveTo(R.x0, y); ctx.lineTo(R.x1, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = R.y0; y < R.y1; y += 60) for (let x = R.x0; x < R.x1; x += 60) ctx.fillRect(x + 4, y + 4, 10, 3);
    const E = F.ENGINE;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.strokeRect(E.x0 - 8, E.y0 - 2, E.x1 - E.x0 + 16, E.y1 - E.y0 + 10); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,209,102,0.25)'; ctx.fillRect(E.x0 - 6, E.y0, E.x1 - E.x0 + 12, E.y1 - E.y0 + 6);
    // walls: a tall red-brick back wall with a cream band; wooden side and bottom walls
    ctx.fillStyle = '#c94f3d'; ctx.fillRect(R.x0 - w, F.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - F.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; for (let y = F.BACK_TOP + 4, j = 0; y < R.y0; y += 10, j++) for (let x = R.x0 - w + ((j % 2) * 12); x < R.x1 + w; x += 24) ctx.fillRect(x, y, 22, 8);
    ctx.fillStyle = '#ffe9c2'; ctx.fillRect(R.x0 - w, F.BACK_TOP, R.x1 - R.x0 + 2 * w, 8);
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(R.x0 - w, F.BACK_TOP + 8, R.x1 - R.x0 + 2 * w, 3);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the big red bay door in the bottom wall, under the engine
    ctx.fillStyle = '#d32f2f'; ctx.fillRect(E.x0, R.y1, E.x1 - E.x0, w); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = R.y1 + 4; y < R.y1 + w; y += 6) ctx.fillRect(E.x0 + 3, y, E.x1 - E.x0 - 6, 2);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(E.x0 + 10, R.y1 + 10, E.x1 - E.x0 - 20, 3);
    // the wall of helmets and coats: a wooden rack with hooks, three helmets, three coats
    const H = F.HELMETS;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, H.x0, H.y0, H.x1 - H.x0, H.y1 - H.y0, 4); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, H.x0 + 3, H.y0 + 3, H.x1 - H.x0 - 6, H.y1 - H.y0 - 6, 3); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(H.x0 + 6, H.y0 + 14, H.x1 - H.x0 - 12, 3); ctx.fillRect(H.x0 + 6, H.y0 + 34, H.x1 - H.x0 - 12, 3);
    for (let i = 0; i < 3; i++) {
      const hx = H.x0 + 22 + i * 40;
      this.drawHelmet(ctx, hx, H.y0 + 16, 1, 11, ['#d32f2f', '#ffd166', '#d32f2f'][i]);
      // a navy coat with yellow stripes hanging from the lower hook
      ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(hx, H.y0 + 37, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, hx - 11, H.y0 + 39, 22, 22, 4); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.fillRect(hx - 11, H.y0 + 45, 22, 2.5); ctx.fillRect(hx - 11, H.y0 + 52, 22, 2.5);
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(hx - 1, H.y0 + 40, 2, 20);
    }
    // the fire bell on the back wall: a brass bell under a little roof (the bell itself swings live)
    const B = F.BELL;
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(B.x - 18, B.y - 16); ctx.lineTo(B.x, B.y - 28); ctx.lineTo(B.x + 18, B.y - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x - 4, B.y - 18, 8, 6);
    // the upstairs gallery: wooden planks on brackets, its front edge over the room (the railing is drawn live)
    const G = F.GALLERY;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(G.x0, G.y1, G.x1 - G.x0, R.y0 - G.y1);   // shadow on the wall under it
    ctx.fillStyle = '#b5773a'; ctx.fillRect(G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = G.x0; x < G.x1; x += 22) ctx.fillRect(x, G.y0, 2, G.y1 - G.y0);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(G.x0, G.y1 - 4, G.x1 - G.x0, 6);
    ctx.fillStyle = '#5c6670'; for (let x = G.x0 + 16; x < G.x1; x += 48) { ctx.beginPath(); ctx.moveTo(x, G.y1 + 2); ctx.lineTo(x + 12, G.y1 + 2); ctx.lineTo(x, G.y1 + 12); ctx.closePath(); ctx.fill(); }   // brackets
    // the staircase up to the gallery: diagonal wooden treads with a stringer, from the floor by the bell
    const S = F.STAIRS, n = 7;
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(S.foot.x - 14, R.y0); ctx.lineTo(S.top.x - 4, S.top.y - 8); ctx.lineTo(S.top.x + 10, S.top.y - 8); ctx.lineTo(S.top.x + 10, R.y0); ctx.closePath(); ctx.fill();
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), x = U.lerp(S.foot.x - 10, S.top.x - 2, k), y = U.lerp(R.y0 - 2, S.top.y - 6, k);
      ctx.fillStyle = '#b5773a'; ctx.fillRect(x, y, 16, 6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, 16, 2);
    }
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(S.top.x - 1, S.top.y - 30, 3, 24);   // handrail post at the top
    // the pole's foot: a round rubber landing mat
    const P = F.POLE;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(P.land.x + 2, P.land.y + 6, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(P.land.x, P.land.y + 4, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(P.land.x, P.land.y + 4, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    // the hose reel on the right wall: a red reel on a silver bracket, hose coiled around it
    const Rl = F.REEL;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(Rl.x - 6, Rl.y - 3, 12, 30); ctx.fillRect(Rl.x - 16, Rl.y + 24, 32, 5);
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(Rl.x, Rl.y, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff8a80'; ctx.lineWidth = 3; for (let rr = 6; rr < 18; rr += 4) { ctx.beginPath(); ctx.arc(Rl.x, Rl.y, rr, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(Rl.x, Rl.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(Rl.x - 14, Rl.y + 16, 4, 0, Math.PI * 2); ctx.fill();   // brass nozzle
    // the door in the bottom wall, its mat, and the station's name plate below
    const X = F.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(X.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(X.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(X.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#d32f2f'; ctx.fillRect(X.x - 21 + i * 14, X.y - 8, 14, 14); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(X.x - 21, X.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', X.x, X.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 50, R.y1 + w + 4, 100, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🚒 FIRE DEPT 🚒', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- shared art ----------
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
  drawFirefighter(r, g, c, salute) {
    const ctx = r.ctx, f = c.facing || 1, bob = c.moving ? Math.sin(c.bob || 0) * 2 : 0;
    r.drawPerson(c.x, c.y, { shirt: '#2d3a4a', pants: '#2d3a4a', skin: c.skin || '#e0ac69', hair: '#2b1d14', hairStyle: 0, facing: f, moving: c.moving, bob: c.bob, carry: 0, belt: true });
    ctx.fillStyle = '#ffd166'; ctx.fillRect(c.x - 12, c.y - 25 + bob, 24, 2.5); ctx.fillRect(c.x - 12, c.y - 19 + bob, 24, 2.5);   // reflective stripes
    if (salute > 0) {
      // the near arm swings up to the brim of the helmet
      const k = U.easeOut(salute);
      ctx.strokeStyle = '#e0ac69'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c.x + f * 13, c.y - 22 + bob); ctx.lineTo(c.x + f * (13 + 6 * (1 - k)), c.y - 22 - 18 * k + bob); ctx.lineTo(c.x + f * (12 - 6 * k), c.y - 22 - 22 * k + bob); ctx.stroke();
      ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(c.x + f * 13, c.y - 24 + bob); ctx.lineTo(c.x + f * (13 + 6 * (1 - k)), c.y - 24 - 14 * k + bob); ctx.stroke();
    }
    this.drawHelmet(ctx, c.x, c.y - 42 + bob, f, 13, c.helmet || '#d32f2f');
  },
  drawChefHelmet(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    this.drawHelmet(ctx, p.x, p.y - 46 + bob, f, 16, '#d32f2f');
  },
  drawToy(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 17, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x - 9, y - 7, 18, 9, 2); ctx.fill();
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x + f * 3 - 3, y - 11, 7, 6, 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(x + f * 3 - 1.5, y - 10, 3.5, 3);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x - 8, y - 9, 10, 1.5);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 5, y + 2, 2.2, 0, Math.PI * 2); ctx.arc(x + 5, y + 2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = (Math.floor(g.time * 6) % 2) ? '#ff5252' : '#4d8dff'; ctx.fillRect(x + f * 3 - 2, y - 13, 4, 2);
  },
  // the Dalmatian: white with black spots, floppy black ears and a red collar; sits when the chef stops
  drawDog(r, g, d) {
    const ctx = r.ctx, x = d.x, y = d.y, f = d.facing || 1, bob = d.moving ? Math.sin(d.bob) * 1.5 : 0, st = d.moving ? Math.sin(d.bob) * 3 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    const spot = (sx, sy, rr) => { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.fill(); };
    let hx, hy;
    if (d.sit) {
      // sitting: haunches on the floor, the body up, front legs straight
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - f * 5, y - 7, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + f * 3, y - 16, 9, 14, f * 0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x + f * 4 - 2, y - 12, 4, 15, 2); ctx.fill(); U.roundRect(ctx, x + f * 10 - 2, y - 12, 4, 15, 2); ctx.fill();
      spot(x - f * 8, y - 8, 2.6); spot(x + f * 2, y - 22, 2.2); spot(x - f * 1, y - 13, 2); spot(x + f * 6, y - 8, 1.8);
      // the tail curled on the floor
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
    // collar, head, ear, eye patch, nose
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(hx - f * 4, hy + 7, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#f1d3a8'; ctx.beginPath(); ctx.ellipse(hx + f * 5, hy + 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    spot(hx + f * 4, hy - 3, 3.2);   // the patch over one eye
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(hx - f * 6, hy - 3, 4, 6, f * 0.5, 0, Math.PI * 2); ctx.fill();   // floppy ear
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + f * 4, hy - 3, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hx + f * 4.5, hy - 3, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + f * 9, hy + 2, 1.8, 0, Math.PI * 2); ctx.fill();   // nose
    if (d.happy > 0) { ctx.fillStyle = '#ff6b8a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', hx, hy - 14); }
  },
  // the fire engine, side-on with its cab at the right end; the cab window is see-through so the chef shows inside
  drawEngine(r, g) {
    const ctx = r.ctx, E = CFG.FIREDEPT.ENGINE, st = this.st, t = g.time, x0 = E.x0, y0 = E.y0, x1 = E.x1, y1 = E.y1;
    const flashing = !!(st.cab || st.alarm), on = Math.floor(t * 6) % 2;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2 + 3, y1 + 2, (x1 - x0) / 2 + 4, 9, 0, 0, Math.PI * 2); ctx.fill();
    // wheels
    for (const wx of [x0 + 30, x0 + 66, x1 - 26]) {
      ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(wx, y1 - 4, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(wx, y1 - 4, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(wx, y1 - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // the rear body: lockers, a white stripe, the pump panel and a ladder on the roof
    const bw = x1 - x0 - 54;
    ctx.fillStyle = '#b71c1c'; U.roundRect(ctx, x0 + 2, y0 + 12, bw + 2, y1 - y0 - 22, 6); ctx.fill();
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x0, y0 + 10, bw, y1 - y0 - 22, 6); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(x0, y0 + 36, bw, 8);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x0, y0 + 44, bw, 2);
    for (let i = 0; i < 3; i++) {
      const lx = x0 + 10 + i * 42;
      ctx.fillStyle = '#9e1414'; U.roundRect(ctx, lx, y0 + 16, 32, 16, 3); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(lx + 10, y0 + 22, 12, 3);
      ctx.fillStyle = '#9e1414'; U.roundRect(ctx, lx, y0 + 50, 32, 14, 3); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(lx + 10, y0 + 55, 12, 3);
    }
    // the pump panel gauges by the cab
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x0 + bw - 16, y0 + 50, 14, 14, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x0 + bw - 9, y0 + 57, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + bw - 9, y0 + 57); ctx.lineTo(x0 + bw - 6, y0 + 54); ctx.stroke();
    // the ladder along the roof
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x0 + 8, y0 + 2, bw - 16, 3); ctx.fillRect(x0 + 8, y0 + 8, bw - 16, 3);
    for (let lx = x0 + 12; lx < x0 + bw - 10; lx += 12) ctx.fillRect(lx, y0 + 2, 2.5, 9);
    // the cab: red, a big see-through window, a silver grille and bumper, headlights and the light bar
    const cx0 = x1 - 56;
    ctx.fillStyle = '#b71c1c'; U.roundRect(ctx, cx0 + 2, y0 + 2, 56, y1 - y0 - 12, 8); ctx.fill();
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, cx0, y0, 56, y1 - y0 - 12, 8); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, cx0 + 6, y0 + 8, 44, 34, 4); ctx.fill();
    ctx.fillStyle = 'rgba(191,227,255,0.45)'; U.roundRect(ctx, cx0 + 9, y0 + 11, 38, 28, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx0 + 12, y0 + 13, 8, 20);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(cx0, y0 + 48, 56, 6); ctx.fillStyle = '#ffd166'; ctx.fillRect(cx0, y0 + 54, 56, 2);
    ctx.fillStyle = '#9e1414'; ctx.fillRect(cx0 + 6, y0 + 60, 22, 3);   // the cab door's step
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x1 - 3, y1 - 30, 7, 14); ctx.fillRect(x1 - 2, y1 - 30, 2, 14);
    ctx.fillStyle = '#2b2b2b'; for (let k = 0; k < 3; k++) ctx.fillRect(x1 - 1, y1 - 28 + k * 4, 4, 1.5);
    ctx.fillStyle = '#c9ccd2'; U.roundRect(ctx, x1 - 6, y1 - 14, 12, 5, 2); ctx.fill();   // bumper
    ctx.fillStyle = on || !flashing ? '#fff3b0' : '#ffe08a'; ctx.beginPath(); ctx.arc(x1 + 1, y1 - 34, 3, 0, Math.PI * 2); ctx.fill();
    // light bar
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, cx0 + 8, y0 - 7, 40, 7, 2); ctx.fill();
    const red = flashing && on, blue = flashing && !on;
    ctx.fillStyle = red ? '#ff5252' : '#9e1414'; U.roundRect(ctx, cx0 + 10, y0 - 6, 16, 5, 2); ctx.fill();
    ctx.fillStyle = blue ? '#4d8dff' : '#2d5a8a'; U.roundRect(ctx, cx0 + 30, y0 - 6, 16, 5, 2); ctx.fill();
    if (flashing) {
      ctx.fillStyle = red ? 'rgba(255,82,82,0.35)' : 'rgba(77,141,255,0.35)';
      ctx.beginPath(); ctx.arc(red ? cx0 + 18 : cx0 + 38, y0 - 4, 16, 0, Math.PI * 2); ctx.fill();
    }
    // the station's number on the door
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('19', x0 + 26, y0 + 40);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 4, y0 + 13, bw - 8, 2);   // shine along the top
  },
  drawTarget(r, g) {
    const ctx = r.ctx, T = CFG.FIREDEPT.TARGET, a = this.st.targetSpin, sx = Math.cos(a);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(T.x + 2, T.y + 6, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, T.x - 14, T.y - 2, 28, 8, 3); ctx.fill(); ctx.fillRect(T.x - 2, T.y - 24, 4, 24);
    ctx.save(); ctx.translate(T.x, T.y - 30); ctx.scale(Math.max(0.08, Math.abs(sx)), 1);
    const back = sx < 0;
    const rings = back ? ['#8d5a2b', '#8d5a2b', '#8d5a2b'] : ['#d32f2f', '#fff8ee', '#ffd166'];
    [18, 12, 6].forEach((rr, i) => { ctx.fillStyle = rings[i]; ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
    if (!back) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawBell(r, g) {
    const ctx = r.ctx, B = CFG.FIREDEPT.BELL, s = this.st.bellSwing, a = s > 0 ? Math.sin(g.time * 14) * 0.45 * Math.min(1, s) : 0;
    ctx.save(); ctx.translate(B.x, B.y - 14); ctx.rotate(a);
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(4, 10); ctx.quadraticCurveTo(12, 18, 13, 24); ctx.lineTo(-13, 24); ctx.quadraticCurveTo(-12, 18, -4, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b8862c'; ctx.fillRect(-13, 22, 26, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-5, 6, 3, 14);
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(0, 27, 3.5, 0, Math.PI * 2); ctx.fill();   // clapper
    ctx.restore();
    if (s > 0) { ctx.strokeStyle = `rgba(255,224,138,${(Math.min(1, s) * 0.7).toFixed(2)})`; ctx.lineWidth = 2; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(B.x + d * 16, B.y + 2, 6, d > 0 ? -0.9 : Math.PI - 0.9, d > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke(); } }
    // the rope to pull
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B.x, B.y + 14); ctx.lineTo(B.x + Math.sin(g.time * 2) * 1.5, B.y + 30); ctx.stroke();
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(B.x + Math.sin(g.time * 2) * 1.5, B.y + 32, 3, 0, Math.PI * 2); ctx.fill();
  },
  drawRailing(r, g) {
    const ctx = r.ctx, G = CFG.FIREDEPT.GALLERY, P = CFG.FIREDEPT.POLE;
    ctx.fillStyle = '#e0b44c';
    for (let x = G.x0 + 6; x < G.x1; x += 22) if (Math.abs(x - P.x) > 12) ctx.fillRect(x - 1.5, G.y1 - 26, 3, 26);
    ctx.fillRect(G.x0, G.y1 - 28, P.x - 16 - G.x0, 4); ctx.fillRect(P.x + 16, G.y1 - 28, G.x1 - P.x - 16, 4);   // top rail with a gap at the pole
    ctx.fillStyle = '#b8862c'; ctx.fillRect(G.x0, G.y1 - 2, G.x1 - G.x0, 3);
  },
  drawPole(r, g) {
    const ctx = r.ctx, P = CFG.FIREDEPT.POLE, G = CFG.FIREDEPT.GALLERY;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(P.x, G.floor + 8, 12, 5, 0, 0, Math.PI * 2); ctx.fill();   // the hole in the gallery floor
    ctx.fillStyle = '#5c6670'; ctx.fillRect(P.x - 10, P.top - 40, 20, 5);   // ceiling bracket
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(P.x - 2, P.top - 36, 9, P.bottom - P.top + 46);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(P.x - 4, P.top - 36, 8, P.bottom - P.top + 46);
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(P.x - 3, P.top - 36, 2.5, P.bottom - P.top + 46);
    ctx.fillStyle = '#b8862c'; ctx.fillRect(P.x - 1, P.top - 36, 2, P.bottom - P.top + 46);
  },
  drawHoseAndWater(r, g) {
    const ctx = r.ctx, s = this.st.spray; if (!s) return;
    const F = CFG.FIREDEPT, p = g.player, Rl = F.REEL, T = F.TARGET, nx = p.x + 18, ny = p.y - 22, t = s.t;
    // the hose from the reel to the chef's hands
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Rl.x - 14, Rl.y + 16); ctx.quadraticCurveTo(Rl.x - 60, Rl.y + 70, p.x - 10, p.y + 2); ctx.quadraticCurveTo(p.x - 14, p.y - 16, nx - 6, ny); ctx.stroke();
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, nx - 6, ny - 3, 12, 6, 2); ctx.fill();   // the brass nozzle
    // the water arc: droplets flying from the nozzle to the target
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

  // ---------- moving things ----------
  // outside the station's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.FIREDEPT.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      // the beacon above the sign pulses red
      const b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, k = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.fillStyle = `rgba(255,82,82,${(0.12 + k * 0.25).toFixed(2)})`; ctx.beginPath(); ctx.arc(cx, gy - 34, 10 + k * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = k > 0.5 ? '#ff5252' : '#b71c1c'; ctx.beginPath(); ctx.arc(cx, gy - 34, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(cx - 1.5, gy - 36, 1.5, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (g.area !== 'firedept') return;
    this.drawOutside(r, g);
    this.drawPole(r, g);
    this.drawBell(r, g);
    // the alarm light by the bell when the crew is out
    if (this.st.alarm) { const B = CFG.FIREDEPT.BELL, on = Math.floor(t * 6) % 2; ctx.fillStyle = on ? 'rgba(255,82,82,0.35)' : 'rgba(255,82,82,0.1)'; ctx.beginPath(); ctx.arc(B.x, B.y - 30, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = on ? '#ff5252' : '#b71c1c'; ctx.beginPath(); ctx.arc(B.x, B.y - 30, 4, 0, Math.PI * 2); ctx.fill(); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, F = CFG.FIREDEPT;
    if (!g.driving && !g.onTrain) {
      if (st.helmet > 0) items.push({ y: p.y + 1, draw: () => this.drawChefHelmet(r, g) });
      if (st.toy > 0) items.push({ y: p.y + 1, draw: () => this.drawToy(r, g) });
    }
    if (g.area !== 'firedept') return;
    items.push({ y: F.GALLERY.y1 - 1, draw: () => this.drawRailing(r, g) });
    items.push({ y: F.ENGINE.y1 + 2, draw: () => this.drawEngine(r, g) });
    items.push({ y: F.TARGET.y + 2, draw: () => this.drawTarget(r, g) });
    items.push({ y: st.captain.y, draw: () => this.drawFirefighter(r, g, st.captain, st.captain.salute) });
    for (const c of st.crew) items.push({ y: c.y, draw: () => this.drawFirefighter(r, g, Object.assign({ skin: ['#f1c27d', '#8d5a2b', '#e0ac69'][c.i], helmet: c.i === 1 ? '#ffd166' : '#d32f2f' }, c), 0) });
    items.push({ y: st.dog.y, draw: () => this.drawDog(r, g, st.dog) });
    if (st.spray) items.push({ y: p.y + 2, draw: () => this.drawHoseAndWater(r, g) });
    if (st.cab) items.push({ y: F.ENGINE.y1 + 3, draw: () => this.drawCabChef(r, g) });
  },
  // the chef seen through the cab window (the core draws the player under the engine): head, shoulders, the wheel
  drawCabChef(r, g) {
    const ctx = r.ctx, E = CFG.FIREDEPT.ENGINE, S = CFG.FIREDEPT.CAB_SEAT, cx0 = E.x1 - 56, y0 = E.y0;
    ctx.save(); U.roundRect(ctx, cx0 + 9, y0 + 11, 38, 28, 3); ctx.clip();
    r.drawPerson(S.x, S.y, { shirt: '#fff', apron: '#e4572e', skin: '#f1c27d', hat: 'chef', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
    if (this.st.helmet > 0) this.drawHelmet(ctx, S.x, S.y - 46, 1, 16, '#d32f2f');
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx0 + 38, y0 + 34, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();   // the steering wheel
    ctx.fillStyle = 'rgba(191,227,255,0.22)'; ctx.fillRect(cx0 + 9, y0 + 11, 38, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cx0 + 12, y0 + 13, 6, 20);
    ctx.restore();
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(FireDeptExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(FireDeptExt);
