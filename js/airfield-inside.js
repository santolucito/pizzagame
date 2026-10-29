'use strict';
// Inside the airfield's buildings (js/airfield.js owns the airfield itself, its planes and the door spots in
// CFG.AIRFIELD.DOORS). Walk up to a door and press '🚪 Go inside':
//  - the TERMINAL (its south door, clear of the arrivals corridor): check-in desks with an agent ("Where to? ☁️"), a
//    departures board whose letters flip, a baggage carousel with suitcases going round (one is the chef's: '🧳 Grab your
//    bag' and carry it for half a minute), a security arch that beeps "Beep! 🍕" when the chef walks through, rows of
//    waiting seats to sit in, a gift shop corner with a $3 toy plane, and a big window onto the apron;
//  - the PIZZA AIR HANGAR (the small door between its bays): a plane under repair with a mechanic under it (a wrench,
//    sparks), tool walls, a tug to sit in ('🚜 Sit in the tug': it toots), parts on shelves, a stack of oil drums, a
//    propeller hanging from the roof and a big PIZZA AIR banner;
//  - the CONTROL TOWER: the ground floor (a spiral stair, a sofa with a dozing pilot) and, '🪜 Climb up', the glass cab at
//    the top: radar screens whose blips are the real planes, the controller in a headset, binoculars ('🔭 Look out': the
//    runway and the planes, live) and a microphone ('🎙️ Clear for take-off!');
//  - the WORKSHOP: a workbench with a vice, a propeller on a stand to spin, a mechanic who says hi, and a $4 toolbox.
// Extension module: registered with Game.ext (first, so its doors beat the airfield's own hints) and Render.ext.

CFG.AF_IN = {
  WALL: 24, FADE: 0.45, DOOR_R: 30, HINT_R: 60, NEAR: 34,
  CARRY: 30, CLIMB: 1.0, VIEW: 7, CLEAR: 3, STAND: 0.35,   // seconds: carrying a bag / toy / toolbox, the climb, the look-out, the radio call; stick-push to get up
  ROOMS: {
    afterminal: {
      door: 'terminal', toast: '🧳 Welcome to the terminal!', hint: 'Go inside the terminal! 🧳', title: '✈️ AIRFIELD TERMINAL',
      WORLD: { x0: 13000, y0: 4000, x1: 13600, y1: 4400 }, ROOM: { x0: 13040, y0: 4100, x1: 13560, y1: 4340 }, BACK_TOP: 4016,
      EXIT: { x: 13300, y: 4322 },
      WINDOW: { x0: 13054, y0: 4026, x1: 13228, y1: 4092 },    // the big window onto the apron (behind the check-in desk)
      BOARD: { x0: 13250, y0: 4026, x1: 13444, y1: 4090 },     // the departures board on the back wall
      DESK: { x0: 13058, y0: 4100, x1: 13190, y1: 4140 }, AGENT: { x: 13124, y: 4106 }, CHECKIN: { x: 13124, y: 4168 },
      ARCH: { x0: 13206, x1: 13270, y: 4206 },                 // the security arch: two posts, walk between them (north–south)
      CAROUSEL: { x: 13374, y: 4204, rx: 76, ry: 28 }, BAG_SPOT: { x: 13374, y: 4258 },
      SEAT_XS: [13072, 13102, 13132, 13162], SEAT_YS: [4232, 4294],
      SHELF: { x0: 13500, y0: 4100, x1: 13560, y1: 4214 }, TOY_PAD: { x: 13490, y: 4284 },
    },
    afhangar: {
      door: 'hangar', toast: '✈️ Welcome to the Pizza Air hangar!', hint: 'Go inside the hangar! ✈️', title: '🍕 PIZZA AIR HANGAR',
      WORLD: { x0: 14000, y0: 4000, x1: 14600, y1: 4400 }, ROOM: { x0: 14040, y0: 4100, x1: 14560, y1: 4340 }, BACK_TOP: 4016,
      EXIT: { x: 14300, y: 4322 },
      PLANE: { x: 14212, y: 4206, s: 1.25, color: '#3b7dd8' },
      MECH: { x: 14252, y: 4220 }, MECH_SPOT: { x: 14292, y: 4264 },
      TUG: { x: 14432, y: 4292 }, TUG_SPOT: { x: 14432, y: 4250 },
      CART: { x: 14336, y: 4152 },
      SHELF: { x0: 14504, y0: 4100, x1: 14560, y1: 4234 },
      DRUMS: { x0: 14046, y0: 4264, x1: 14130, y1: 4340 },
      PROP: { x: 14420, y: 4096 },                             // the propeller hanging from the roof (over everybody)
    },
    aftower: {
      door: 'tower', toast: '🗼 Welcome to the control tower!', hint: 'Go inside the control tower! 🗼', title: '🗼 CONTROL TOWER', titleUp: '🎧 THE TOWER CAB',
      WORLD: { x0: 15000, y0: 4000, x1: 15600, y1: 4400 }, ROOM: { x0: 15040, y0: 4100, x1: 15560, y1: 4340 }, BACK_TOP: 4016,
      EXIT: { x: 15300, y: 4322 },
      STAIRS: { x: 15440, y: 4166, r: 44 }, FOOT: { x: 15440, y: 4244 },   // the same spot on both floors
      SOFA: { x0: 15058, y0: 4266, x1: 15178, y1: 4322 }, TABLE: { x0: 15206, y0: 4166, x1: 15282, y1: 4200 },
      COOLER: { x0: 15514, y0: 4100, x1: 15552, y1: 4146 },
      // the cab, up top
      DESK: { x0: 15056, y0: 4100, x1: 15336, y1: 4140 }, RADARS: [{ x: 15104, y: 4070 }, { x: 15182, y: 4070 }], MIC: { x: 15300, y: 4120 }, MIC_SPOT: { x: 15300, y: 4170 },
      CTRL: { x: 15180, y: 4170 }, BINO: { x: 15522, y: 4262 }, BINO_SPOT: { x: 15488, y: 4262 },
    },
    afworkshop: {
      door: 'workshop', toast: '🔧 Welcome to the workshop!', hint: 'Go inside the workshop! 🔧', title: '🔧 WORKSHOP',
      WORLD: { x0: 16000, y0: 4000, x1: 16600, y1: 4400 }, ROOM: { x0: 16040, y0: 4100, x1: 16560, y1: 4340 }, BACK_TOP: 4016,
      EXIT: { x: 16300, y: 4322 },
      BENCH: { x0: 16056, y0: 4100, x1: 16252, y1: 4146 }, VICE: { x: 16234, y: 4116 }, VICE_SPOT: { x: 16234, y: 4176 },
      PROP: { x: 16346, y: 4214 }, PROP_SPOT: { x: 16346, y: 4258 },
      CABINET: { x0: 16492, y0: 4100, x1: 16556, y1: 4150 },
      MECHANIC: { x: 16452, y: 4176 }, HI_SPOT: { x: 16418, y: 4216 },
      WING: { x0: 16058, y0: 4258, x1: 16200, y1: 4302 },
      TOOL_PAD: { x: 16478, y: 4286 },
    },
  },
  BOARD_DESTS: ['CLOUD HARBOR', 'PIZZA MOON', 'SAUCE BAY', 'CHEESE PEAK', 'OLIVE ISLE', 'BASIL TOWN', 'MOZZA CITY', 'PEPPERONI'],
  BOARD_STATES: [['ON TIME', '#8ef0a0'], ['BOARDING', '#ffd166'], ['GO!', '#8ef0a0'], ['LANDED', '#9fd8ff']],
  MECH_LINES: ['Need a hand? 🔧', 'Every plane needs a tune-up!', 'Spin that propeller! 🌀', 'Nice hat, Chef! 👨‍🍳'],
};
for (const [k, R] of Object.entries(CFG.AF_IN.ROOMS)) CFG.AREAS[k] = { WORLD: R.WORLD };

const AirfieldInsideExt = {
  name: 'airfieldInside',
  defaults: { afIn: { seen: {}, checkins: 0, bags: 0, beeps: 0, sits: 0, toys: 0, tugs: 0, mechs: 0, climbs: 0, looks: 0, clears: 0, spins: 0, vices: 0, hellos: 0, toolboxes: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    if (!g.s.afIn) g.s.afIn = JSON.parse(JSON.stringify(this.defaults.afIn));
    for (const [k, v] of Object.entries(this.defaults.afIn)) if (g.s.afIn[k] === undefined) g.s.afIn[k] = JSON.parse(JSON.stringify(v));
    const C = CFG.AF_IN;
    this.st = {
      fade: 0, t: 0,
      // terminal: sitting { x, y }, the check-in bubble, the arch's beep, the board's rows
      seat: null, agent: 0, beep: 0, lastY: null, still: 0,
      rows: C.BOARD_DESTS.slice(0, 4).map((d, i) => ({ dest: d, time: (10 + i) + ':' + (i % 2 ? '30' : '00'), state: i % C.BOARD_STATES.length, flip: 0 })), flipT: 2.5, flipN: 4,
      // hangar: the tug { t }, the mechanic's sparks and bubble
      tug: null, sparks: [], sparkT: 0.6, mech: 0,
      // tower: on the top floor?, the climb { t, up, swapped }, the binoculars { t }, the radio call
      up: false, climb: null, viewing: null, clear: 0, thumbs: 0,
      // workshop: the propeller's spin, the vice, the mechanic's hello { t, i }
      propA: 0, propV: 0, vice: 0, hello: null, helloN: 0,
      // things the chef carries for a while (in any map)
      bag: 0, toy: 0, toolbox: 0,
      obs: {},
    };
    for (const k of Object.keys(C.ROOMS)) this.st.obs[k] = this.roomObstacles(k, false);
    this.st.obs.towerUp = this.roomObstacles('aftower', true);
  },
  room(g) { return CFG.AF_IN.ROOMS[g.area] ? g.area : null; },
  roomObstacles(k, up) {
    const R = CFG.AF_IN.ROOMS[k], A = R.ROOM, w = CFG.AF_IN.WALL, o = [];
    const box = (x0, y0, x1, y1) => o.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    o.push({ x: A.x0 - w, y: A.y0 - w, w: A.x1 - A.x0 + 2 * w, h: w }, { x: A.x0 - w, y: A.y1, w: A.x1 - A.x0 + 2 * w, h: w });
    o.push({ x: A.x0 - w, y: A.y0, w, h: A.y1 - A.y0 }, { x: A.x1, y: A.y0, w, h: A.y1 - A.y0 });
    const rect = (q) => box(q.x0, q.y0, q.x1, q.y1);
    if (k === 'afterminal') {
      rect(R.DESK);
      const Ar = R.ARCH; box(Ar.x0 - 6, Ar.y - 6, Ar.x0 + 6, Ar.y + 6); box(Ar.x1 - 6, Ar.y - 6, Ar.x1 + 6, Ar.y + 6);
      const C = R.CAROUSEL; box(C.x - C.rx, C.y - C.ry, C.x + C.rx, C.y + C.ry);
      for (const y of R.SEAT_YS) box(R.SEAT_XS[0] - 16, y - 26, R.SEAT_XS[R.SEAT_XS.length - 1] + 16, y - 16);   // the seat backs (you sit on the cushions)
      rect(R.SHELF);
    } else if (k === 'afhangar') {
      const P = R.PLANE, s = P.s;
      box(P.x - 46 * s, P.y - 11 * s, P.x + 44 * s, P.y + 11 * s);   // fuselage
      box(P.x - 8 * s, P.y - 47 * s, P.x + 21 * s, P.y + 47 * s);    // wings
      box(P.x - 41 * s, P.y - 21 * s, P.x - 27 * s, P.y + 21 * s);   // tailplane
      box(R.MECH.x - 12, R.MECH.y - 4, R.MECH.x + 14, R.MECH.y + 30);   // the mechanic on his creeper
      const T = R.TUG; box(T.x - 32, T.y - 16, T.x + 30, T.y + 14);
      box(R.CART.x - 18, R.CART.y - 12, R.CART.x + 18, R.CART.y + 12);
      rect(R.SHELF); rect(R.DRUMS);
    } else if (k === 'aftower') {
      const S = R.STAIRS; box(S.x - S.r, A.y0, S.x + S.r, S.y + S.r + 2);   // the staircase / the stairwell's railing
      if (up) {
        rect(R.DESK);
        box(R.CTRL.x - 16, R.CTRL.y - 12, R.CTRL.x + 16, R.CTRL.y + 8);
        box(R.BINO.x - 10, R.BINO.y - 8, R.BINO.x + 10, R.BINO.y + 8);
      } else { rect(R.SOFA); rect(R.TABLE); rect(R.COOLER); }
    } else if (k === 'afworkshop') {
      rect(R.BENCH); rect(R.CABINET); rect(R.WING);
      box(R.PROP.x - 16, R.PROP.y - 8, R.PROP.x + 16, R.PROP.y + 10);
      box(R.MECHANIC.x - 12, R.MECHANIC.y - 8, R.MECHANIC.x + 12, R.MECHANIC.y + 6);
    }
    return o;
  },
  curObs(g) { const k = this.room(g); if (!k || !this.st) return []; return k === 'aftower' && this.st.up ? this.st.obs.towerUp : this.st.obs[k]; },
  free(g, x, y) {
    const k = this.room(g); if (!k) return true;
    const A = CFG.AF_IN.ROOMS[k].ROOM, r = 12;
    if (x < A.x0 + r || x > A.x1 - r || y < A.y0 + r || y > A.y1 - r) return false;
    return !this.curObs(g).some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h);
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  airBusy() { const a = typeof AirfieldExt !== 'undefined' ? AirfieldExt.rt : null; return !!(a && (a.ride || a.runup || a.roll)); },
  near(g, s, r) { const p = g.player; return U.dist(p.x, p.y, s.x, s.y) < (r || CFG.AF_IN.NEAR); },
  // the door spots on the airfield, from js/airfield.js
  doorSpot(k) { const D = CFG.AIRFIELD && CFG.AIRFIELD.DOORS; return D ? D[CFG.AF_IN.ROOMS[k].door] : null; },
  // the room whose door the chef stands near in town (within r), or null
  doorAt(g, r) {
    if (g.area !== 'town' || !this.onFoot(g) || this.cityBusy() || this.airBusy()) return null;
    const p = g.player; let best = null, bd = r;
    for (const k of Object.keys(CFG.AF_IN.ROOMS)) { const d = this.doorSpot(k); if (!d) continue; const dd = U.dist(p.x, p.y, d.x, d.y); if (dd < bd) { bd = dd; best = k; } }
    return best;
  },
  busy() { const st = this.st; return !!(st.seat || st.tug || st.climb || st.viewing); },
  // the nearest seat cushion within reach, or null
  seatNear(g, r = 18) {
    const R = CFG.AF_IN.ROOMS.afterminal, p = g.player; let best = null, bd = r;
    for (const y of R.SEAT_YS) for (const x of R.SEAT_XS) { const d = U.dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = { x, y }; } }
    return best;
  },
  nearestSeat(g) {
    const R = CFG.AF_IN.ROOMS.afterminal, p = g.player; let best = null, bd = Infinity;
    for (const y of R.SEAT_YS) for (const x of R.SEAT_XS) { const d = U.dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = { x, y }; } }
    return best;
  },

  // ---------- game hooks ----------
  obstacles(g) { return this.curObs(g); },
  action(g) {
    if (!this.st) this.build(g);
    const st = this.st;
    const dk = this.doorAt(g, CFG.AF_IN.DOOR_R);
    if (dk) return { label: '🚪 Go inside', run: (gg) => this.enter(gg, dk) };
    const k = this.room(g); if (!k || !this.onFoot(g)) return null;
    const R = CFG.AF_IN.ROOMS[k];
    if (st.climb) return null;
    if (st.seat) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (st.tug) return { label: '🚶 Hop out', run: (gg) => this.hopOut(gg) };
    if (st.viewing) return { label: '🚶 Done looking', run: (gg) => this.doneLooking(gg) };
    if (!(k === 'aftower' && st.up) && this.near(g, R.EXIT, CFG.AF_IN.DOOR_R)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (k === 'afterminal') {
      if (this.near(g, R.CHECKIN, 36)) return { label: '🎫 Check in', run: (gg) => this.checkIn(gg) };
      if (st.bag <= 0 && this.near(g, R.BAG_SPOT, 40)) return { label: '🧳 Grab your bag', run: (gg) => this.grabBag(gg) };
      const s = this.seatNear(g); if (s) return { label: '💺 Sit down', run: (gg) => this.sitDown(gg, s) };
    } else if (k === 'afhangar') {
      if (this.near(g, R.TUG_SPOT, 40)) return { label: '🚜 Sit in the tug', run: (gg) => this.sitTug(gg) };
      if (this.near(g, R.MECH_SPOT, 40)) return { label: '👋 Say hi', run: (gg) => this.hiMech(gg) };
    } else if (k === 'aftower') {
      if (this.near(g, R.FOOT, 36)) return st.up ? { label: '🪜 Go down', run: (gg) => this.startClimb(gg, false) } : { label: '🪜 Climb up', run: (gg) => this.startClimb(gg, true) };
      if (st.up) {
        if (this.near(g, R.BINO_SPOT, 36)) return { label: '🔭 Look out', run: (gg) => this.lookOut(gg) };
        if (this.near(g, R.MIC_SPOT, 36)) return { label: '🎙️ Clear for take-off!', run: (gg) => this.clearTakeOff(gg) };
      }
    } else if (k === 'afworkshop') {
      if (this.near(g, R.PROP_SPOT, 36)) return { label: '🌀 Spin the propeller', run: (gg) => this.spinProp(gg) };
      if (this.near(g, R.VICE_SPOT, 36)) return { label: '🗜️ Squeeze the vice', run: (gg) => this.squeeze(gg) };
      if (this.near(g, R.HI_SPOT, 40)) return { label: '👋 Say hi', run: (gg) => this.sayHi(gg) };
    }
    return null;
  },
  enter(g, k) {
    const R = CFG.AF_IN.ROOMS[k], p = g.player, st = this.st;
    g.area = k; p.x = R.EXIT.x; p.y = R.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.resetRoom(); st.fade = CFG.AF_IN.FADE; st.lastY = p.y;
    Sfx.ding(); Haptics.tap();
    if (!g.s.afIn.seen[k]) { g.s.afIn.seen[k] = true; g.toast(R.toast, true); }
  },
  leave(g) {
    const k = this.room(g), d = this.doorSpot(k), p = g.player;
    g.area = 'town'; p.x = d.x; p.y = d.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.resetRoom(); this.st.fade = CFG.AF_IN.FADE; Sfx.drop();
  },
  resetRoom() { const st = this.st; st.seat = null; st.tug = null; st.up = false; st.climb = null; st.viewing = null; st.clear = 0; st.hello = null; st.mech = 0; st.agent = 0; st.still = 0; },
  home(g) { if (!this.st) return; const st = this.st; this.resetRoom(); st.fade = 0; st.beep = 0; st.bag = 0; st.toy = 0; st.toolbox = 0; st.vice = 0; st.propV = 0; st.thumbs = 0; st.sparks = []; st.lastY = null; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat (or the stair top)
  rescue(g) {
    const p = g.player, k = this.room(g);
    if (!k || this.free(g, p.x, p.y)) return false;
    const R = CFG.AF_IN.ROOMS[k], spot = k === 'aftower' && this.st.up ? R.FOOT : { x: R.EXIT.x, y: R.EXIT.y - 8 };
    p.x = spot.x; p.y = spot.y; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  float(g, x, y, text, dur = 1.5) { g.floats.push({ x, y, text, color: '#ffe08a', t: 0, dur, big: true }); },

  // ---------- the terminal ----------
  checkIn(g) {
    const st = this.st, R = CFG.AF_IN.ROOMS.afterminal, p = g.player;
    st.agent = 3; g.s.afIn.checkins++; p.facing = 1;
    this.float(g, p.x, p.y - 74, '🎫 Boarding pass!');
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: R.AGENT.x + U.rand(-20, 20), y0: R.AGENT.y - 30 + U.rand(-14, 10), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 });
    Sfx.ding(); Haptics.tap();
  },
  grabBag(g) {
    const st = this.st, p = g.player;
    st.bag = CFG.AF_IN.CARRY; g.s.afIn.bags++;
    this.float(g, p.x, p.y - 70, 'Got my bag! 🧳');
    Sfx.pickup(); Haptics.success();
  },
  sitDown(g, s) {
    const st = this.st, p = g.player;
    st.seat = { x: s.x, y: s.y, t: 0 }; st.still = 0; g.s.afIn.sits++;
    p.x = s.x; p.y = s.y; p.moving = false; p.facing = 1;
    this.float(g, p.x, p.y - 70, 'Ahh, comfy! 💺');
    Sfx.drop(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st, p = g.player;
    if (st.seat) { p.x = st.seat.x; p.y = st.seat.y; }
    st.seat = null; st.still = 0; p.moving = false; Sfx.drop();
  },
  beep(g) {
    const st = this.st;
    st.beep = 1.6; g.s.afIn.beeps++;
    Sfx.tone(1320, 0.12, 'square', 0.03); setTimeout(() => Sfx.tone(1320, 0.12, 'square', 0.03), 170);
    Haptics.tap();
  },
  // ---------- the hangar ----------
  sitTug(g) {
    const st = this.st, T = CFG.AF_IN.ROOMS.afhangar.TUG, p = g.player;
    st.tug = { t: 0 }; st.still = 0; g.s.afIn.tugs++;
    p.x = T.x - 10; p.y = T.y + 2; p.moving = false; p.facing = 1;
    this.float(g, T.x, T.y - 74, 'Toot toot! 🚜');
    Sfx.tone(392, 0.16, 'square', 0.035); setTimeout(() => Sfx.tone(392, 0.22, 'square', 0.035), 230);
    Haptics.tap();
  },
  hopOut(g) {
    const st = this.st, S = CFG.AF_IN.ROOMS.afhangar.TUG_SPOT, p = g.player;
    st.tug = null; st.still = 0; p.x = S.x; p.y = S.y; p.moving = false; Sfx.drop();
  },
  hiMech(g) {
    const st = this.st, M = CFG.AF_IN.ROOMS.afhangar.MECH;
    st.mech = 2.6; g.s.afIn.mechs++; st.sparkT = 0;
    for (let i = 0; i < 10; i++) st.sparks.push({ x: M.x + 4, y: M.y - 4, vx: U.rand(-90, 90), vy: U.rand(-150, -40), t: 0, dur: U.rand(0.4, 0.8) });
    Sfx.chime(); Haptics.tap();
  },
  // ---------- the tower ----------
  startClimb(g, up) { const st = this.st, p = g.player; st.climb = { t: 0, up, swapped: false, x: p.x, y: p.y }; st.viewing = null; p.moving = false; Sfx.pickup(); Haptics.tap(); },
  lookOut(g) { const st = this.st, p = g.player; st.viewing = { t: 0 }; st.still = 0; p.moving = false; p.facing = 1; g.s.afIn.looks++; Sfx.ding(); Haptics.tap(); },
  doneLooking(g) { this.st.viewing = null; this.st.still = 0; Haptics.tap(); },
  clearTakeOff(g) {
    const st = this.st, R = CFG.AF_IN.ROOMS.aftower, p = g.player;
    st.clear = CFG.AF_IN.CLEAR; st.thumbs = 1.6; g.s.afIn.clears++; p.facing = 1;
    this.float(g, R.CTRL.x, R.CTRL.y - 76, '👍');
    Sfx.chime(); Haptics.success();
  },
  // ---------- the workshop ----------
  spinProp(g) {
    const st = this.st, P = CFG.AF_IN.ROOMS.afworkshop.PROP;
    st.propV = 26; g.s.afIn.spins++;
    this.float(g, P.x, P.y - 104, 'Whirrr! 🌀');
    Sfx.tone(180, 0.6, 'sawtooth', 0.02, 260); Haptics.tap();
  },
  squeeze(g) {
    const st = this.st, V = CFG.AF_IN.ROOMS.afworkshop.VICE;
    st.vice = 1.6; g.s.afIn.vices++;
    this.float(g, V.x, V.y - 50, 'Squeeze! 🗜️');
    Sfx.tone(240, 0.25, 'triangle', 0.04, -60); Haptics.tap();
  },
  sayHi(g) {
    const st = this.st, M = CFG.AF_IN.ROOMS.afworkshop.MECHANIC;
    st.hello = { t: 0, i: st.helloN++ % CFG.AF_IN.MECH_LINES.length }; g.s.afIn.hellos++;
    Sfx.chime(); Haptics.tap();
  },
  pads(g) {
    if (g.area === 'afterminal') return [{ key: 'afToyPlane', label: 'Toy plane', ico: '✈️', pos: CFG.AF_IN.ROOMS.afterminal.TOY_PAD, price: 3, sub: 'zoom zoom!' }];
    if (g.area === 'afworkshop') return [{ key: 'afToolbox', label: 'Toolbox', ico: '🧰', pos: CFG.AF_IN.ROOMS.afworkshop.TOOL_PAD, price: 4, sub: 'for little fixers' }];
    return [];
  },
  onPad(g, pad) {
    const p = g.player, st = this.st;
    if (pad.key === 'afToyPlane') { st.toy = CFG.AF_IN.CARRY; g.s.afIn.toys++; this.float(g, p.x, p.y - 70, 'Zoom! A toy plane! ✈️'); }
    else if (pad.key === 'afToolbox') { st.toolbox = CFG.AF_IN.CARRY; g.s.afIn.toolboxes++; this.float(g, p.x, p.y - 70, 'My own toolbox! 🧰'); }
    else return;
    for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-20, 20), y0: p.y - 40 + U.rand(-20, 16), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 });
    Sfx.pickup(); Haptics.success();
  },

  // pushing the stick for a moment gets you up out of a seat / the tug / the binoculars
  pushedAway(g, dt) {
    const st = this.st, a = Input.axis();
    st.still = Math.hypot(a.x, a.y) > 0.6 ? st.still + dt : 0;
    return st.still > CFG.AF_IN.STAND;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, C = CFG.AF_IN;
    st.t += dt;
    st.fade = Math.max(0, st.fade - dt);
    for (const key of ['bag', 'toy', 'toolbox', 'beep', 'agent', 'mech', 'clear', 'thumbs', 'vice']) st[key] = Math.max(0, st[key] - dt);
    if (st.propV > 0) { st.propA += st.propV * dt; st.propV = Math.max(0, st.propV - dt * 7); } else st.propA += dt * 0.15;
    if (st.hello) { st.hello.t += dt; if (st.hello.t > 2.6) st.hello = null; }
    this.updateBoard(dt);
    const k = this.room(g);
    if (!k) { if (this.busy() || st.up) this.resetRoom(); st.lastY = null; return; }
    const R = C.ROOMS[k];
    if (k === 'afhangar') this.updateSparks(g, dt, R);
    if (!this.onFoot(g)) return;
    if (st.climb) {
      const cl = st.climb; cl.t += dt; p.moving = false;
      if (!cl.swapped) { p.x = cl.x; p.y = cl.y; }
      if (!cl.swapped && cl.t >= C.CLIMB / 2) {
        cl.swapped = true; st.up = cl.up; p.x = R.FOOT.x; p.y = R.FOOT.y; p.facing = 1; g.cameraSnap = true;
        if (cl.up) g.s.afIn.climbs++;
        this.float(g, p.x, p.y - 64, cl.up ? 'Wow, up so high! 🗼' : 'Back downstairs!', 1.4);
      }
      if (cl.t >= C.CLIMB) { st.climb = null; Haptics.tap(); }
      return;
    }
    if (st.seat) {
      st.seat.t += dt; p.x = st.seat.x; p.y = st.seat.y; p.moving = false; p.facing = 1;
      if (this.pushedAway(g, dt)) this.standUp(g);
      return;
    }
    if (st.tug) {
      const T = R.TUG; st.tug.t += dt; p.x = T.x - 10; p.y = T.y + 2; p.moving = false; p.facing = 1;
      if (this.pushedAway(g, dt)) this.hopOut(g);
      return;
    }
    if (st.viewing) {
      st.viewing.t += dt; p.moving = false;
      if (st.viewing.t >= C.VIEW || this.pushedAway(g, dt)) this.doneLooking(g);
      return;
    }
    // the security arch: walking between its posts (either way) beeps
    if (k === 'afterminal') {
      const A = R.ARCH;
      if (st.lastY !== null && (st.lastY - A.y) * (p.y - A.y) <= 0 && st.lastY !== p.y && Math.abs(p.y - st.lastY) < 16 && p.x > A.x0 + 4 && p.x < A.x1 - 4 && st.beep <= 0.6) this.beep(g);
      st.lastY = p.y;
    }
    this.rescue(g);
  },
  // the departures board: every few seconds one row flips to a new destination, letter by letter
  updateBoard(dt) {
    const st = this.st, C = CFG.AF_IN;
    for (const r of st.rows) r.flip = Math.max(0, r.flip - dt);
    st.flipT -= dt;
    if (st.flipT > 0) return;
    st.flipT = 2.6;
    const i = st.flipN % st.rows.length, row = st.rows[i];
    row.dest = C.BOARD_DESTS[st.flipN % C.BOARD_DESTS.length]; row.state = (row.state + 1) % C.BOARD_STATES.length; row.flip = 0.9;
    st.flipN++;
  },
  updateSparks(g, dt, R) {
    const st = this.st, M = R.MECH;
    st.sparkT -= dt;
    if (st.sparkT <= 0) { st.sparkT = U.rand(0.5, 1.3); for (let i = 0; i < 4; i++) st.sparks.push({ x: M.x + 4, y: M.y - 4, vx: U.rand(-60, 60), vy: U.rand(-110, -30), t: 0, dur: U.rand(0.3, 0.6) }); }
    for (const s of st.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 320 * dt; }
    st.sparks = st.sparks.filter((s) => s.t < s.dur);
  },

  hint(g) {
    if (!this.st) return undefined;
    const st = this.st, p = g.player, s = g.s.afIn, C = CFG.AF_IN;
    if (g.area === 'town') {
      const dk = this.doorAt(g, C.HINT_R); if (!dk) return undefined;
      if (p.carry > 0 && g.houses.some((h) => h.order)) return undefined;   // a delivery is more urgent (the door button still works)
      const d = this.doorSpot(dk);
      return { text: C.ROOMS[dk].hint, target: U.dist(p.x, p.y, d.x, d.y) < C.DOOR_R ? null : d };
    }
    const k = this.room(g); if (!k) return undefined;
    if (!this.onFoot(g)) return undefined;
    const R = C.ROOMS[k];
    const go = (text, spot, r = 36) => ({ text, target: this.near(g, spot, r) ? null : spot });
    const out = go('Back outside through the door 🚪', R.EXIT, 30);
    if (k === 'afterminal') {
      if (st.seat) return { text: 'Ding-dong! Your plane is boarding soon 🔔', target: null };
      if (st.beep > 0) return { text: 'Beep! It found your pizza! 🍕', target: null };
      if (!s.checkins) return go('Check in at the desk! 🎫', R.CHECKIN);
      if (!s.beeps) return go('Walk through the security arch! 🚨', { x: (R.ARCH.x0 + R.ARCH.x1) / 2, y: R.ARCH.y }, 20);
      if (!s.bags && st.bag <= 0) return go('Grab your bag from the belt! 🧳', R.BAG_SPOT, 40);
      if (!s.sits) { const n = this.nearestSeat(g); return { text: 'Have a seat and wait for your plane 💺', target: this.seatNear(g) ? null : n }; }
      if (!s.toys && g.s.cash + (g.s.padPaid.afToyPlane || 0) >= 3) return go('Buy a toy plane at the gift shop! ✈️', C.ROOMS.afterminal.TOY_PAD, 30);
      return out;
    }
    if (k === 'afhangar') {
      if (st.tug) return { text: 'Toot toot! Press the button to hop out 🚜', target: null };
      if (!s.tugs) return go('Sit in the tug! 🚜', R.TUG_SPOT, 40);
      if (!s.mechs) return go('Say hi to the mechanic under the plane 🔧', R.MECH_SPOT, 40);
      return out;
    }
    if (k === 'aftower') {
      if (st.climb) return { text: st.climb.up ? 'Up, up, up the stairs! 🪜' : 'Down, down, down! 🪜', target: null };
      if (!st.up) return go(s.climbs ? 'Climb up to see the planes! 🪜' : 'Climb up to the top of the tower! 🪜', R.FOOT);
      if (st.viewing) return { text: 'Look at the planes! 🔭', target: null };
      if (st.clear > 0) return { text: 'Pizza Air is cleared for take-off! ✈️', target: null };
      if (!s.looks) return go('Look out with the binoculars! 🔭', R.BINO_SPOT);
      if (!s.clears) return go('Clear a plane for take-off! 🎙️', R.MIC_SPOT);
      return go('Go back down the stairs 🪜', R.FOOT);
    }
    if (k === 'afworkshop') {
      if (!s.spins) return go('Spin the propeller! 🌀', R.PROP_SPOT);
      if (!s.vices) return go('Squeeze the vice on the workbench! 🗜️', R.VICE_SPOT);
      if (!s.hellos) return go('Say hi to the mechanic! 👋', R.HI_SPOT, 40);
      if (!s.toolboxes && g.s.cash + (g.s.padPaid.afToolbox || 0) >= 4) return go('Get your own toolbox! 🧰', R.TOOL_PAD, 30);
      return out;
    }
    return undefined;
  },

  // ======================= render hooks =======================
  bgKey(g) { return g.area === 'aftower' && this.st && this.st.up ? 'afTwrUp' : ''; },
  paint: {
    afterminal(r, g) { AirfieldInsideExt.paintTerminal(r, g); },
    afhangar(r, g) { AirfieldInsideExt.paintHangar(r, g); },
    aftower(r, g) { const E = AirfieldInsideExt; if (E.st && E.st.up) E.paintCab(r, g); else E.paintTowerFloor(r, g); },
    afworkshop(r, g) { AirfieldInsideExt.paintWorkshop(r, g); },
  },
  // the doors seen from outside, on the airfield
  paintAfter(r, g, area) {
    if (area !== 'town' || !CFG.AIRFIELD || !CFG.AIRFIELD.DOORS) return;
    const ctx = r.ctx, D = CFG.AIRFIELD.DOORS, A = CFG.AIRFIELD;
    const mat = (x, y, w, col = '#e4572e') => { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - w / 2 + 2, y - 4, w, 12); ctx.fillStyle = col; U.roundRect(ctx, x - w / 2, y - 6, w, 12, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = -w / 2 + 4; i < w / 2 - 2; i += 5) ctx.fillRect(x + i, y - 4, 2, 8); };
    // the terminal's south door: a little blue canopy over the glass door, and a mat
    const T = A.TERMINAL, td = D.terminal;
    ctx.fillStyle = '#9fe0ff'; ctx.fillRect(td.x - 10, T.y1 - 12, 20, 12); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(td.x - 1, T.y1 - 12, 2, 12);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#3b7dd8'; ctx.fillRect(td.x - 14 + i * 7, T.y1 - 2, 7, 6); }
    mat(td.x, td.y - 4, 26, '#3b7dd8');
    // the hangar: a small person door between the two big bay doors
    const H = A.HANGAR, hd = D.hangar;
    ctx.fillStyle = '#2d5a8a'; ctx.fillRect(hd.x - 7, H.y1 - 20, 14, 20); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(hd.x - 4, H.y1 - 17, 8, 6); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(hd.x + 4, H.y1 - 8, 1.5, 0, Math.PI * 2); ctx.fill();
    mat(hd.x, hd.y - 6, 22);
    // the tower and the workshop: mats in front of their doors
    mat(D.tower.x, D.tower.y - 10, 20);
    mat(D.workshop.x, D.workshop.y - 6, 30, '#5b3a1a');
  },

  // backdrop, floor, the tall back wall, side and bottom walls, the exit door with its mat and the name plate
  shell(r, k, o) {
    const ctx = r.ctx, R = CFG.AF_IN.ROOMS[k], W = R.WORLD, A = R.ROOM, w = CFG.AF_IN.WALL;
    ctx.fillStyle = o.out; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(A.x0 - w + 8, R.BACK_TOP + 10, A.x1 - A.x0 + 2 * w, A.y1 + w - R.BACK_TOP);
    o.floor(ctx, A);
    ctx.fillStyle = o.back; ctx.fillRect(A.x0 - w, R.BACK_TOP, A.x1 - A.x0 + 2 * w, A.y0 - R.BACK_TOP);
    if (o.backArt) { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - w, R.BACK_TOP, A.x1 - A.x0 + 2 * w, A.y0 - R.BACK_TOP); ctx.clip(); o.backArt(ctx, A, R); ctx.restore(); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(A.x0 - w, A.y0 - 6, A.x1 - A.x0 + 2 * w, 6);
    ctx.fillStyle = o.wall; ctx.fillRect(A.x0 - w, A.y1, A.x1 - A.x0 + 2 * w, w); ctx.fillRect(A.x0 - w, A.y0, w, A.y1 - A.y0); ctx.fillRect(A.x1, A.y0, w, A.y1 - A.y0);
    if (o.sideArt) o.sideArt(ctx, A, R);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = A.x0 - w; x < A.x1 + w; x += 16) ctx.fillRect(x, A.y1, 2, w); for (let y = A.y0; y < A.y1; y += 16) { ctx.fillRect(A.x0 - w, y, w, 2); ctx.fillRect(A.x1, y, w, 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(A.x0 - w, A.y1, A.x1 - A.x0 + 2 * w, 3); ctx.fillRect(A.x0 - w, A.y0, 3, A.y1 - A.y0); ctx.fillRect(A.x1 + w - 3, A.y0, 3, A.y1 - A.y0);
    if (o.bottomArt) o.bottomArt(ctx, A, R);
    if (!o.noDoor) {
      const E = R.EXIT;
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, A.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, A.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, A.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.mat || '#e4572e'; U.roundRect(ctx, E.x - 21, E.y - 8, 42, 14, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    }
    ctx.font = r.font(8); const tw = ctx.measureText(o.title).width + 20;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (A.x0 + A.x1) / 2 - tw / 2, A.y1 + w + 4, tw, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.title, (A.x0 + A.x1) / 2, A.y1 + w + 11);
  },
  tiles(a, b, size = 30) { return (ctx, A) => { for (let y = A.y0, j = 0; y < A.y1; y += size, j++) for (let x = A.x0, i = 0; x < A.x1; x += size, i++) { ctx.fillStyle = (i + j) % 2 ? a : b; ctx.fillRect(x, y, Math.min(size, A.x1 - x), Math.min(size, A.y1 - y)); } }; },
  concrete(col) { return (ctx, A) => { ctx.fillStyle = col; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 2; for (let x = A.x0 + 80; x < A.x1; x += 80) { ctx.beginPath(); ctx.moveTo(x, A.y0); ctx.lineTo(x, A.y1); ctx.stroke(); } for (let y = A.y0 + 80; y < A.y1; y += 80) { ctx.beginPath(); ctx.moveTo(A.x0, y); ctx.lineTo(A.x1, y); ctx.stroke(); } ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.ellipse(A.x0 + (i * 137) % (A.x1 - A.x0), A.y0 + (i * 71) % (A.y1 - A.y0), 6, 3, 0, 0, Math.PI * 2); ctx.fill(); } }; },
  plant(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, x - 11, y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - 12, y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x, y - 8); ctx.rotate(-1.2 + k * 0.6); ctx.beginPath(); ctx.ellipse(0, -14, 5, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  },
  // a little plane seen from the side, nose towards dir (+1 right / -1 left); the jet is white with a row of windows
  sidePlane(ctx, x, y, s, col, dir, jet) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = jet ? '#e4572e' : col; ctx.beginPath(); ctx.moveTo(-26, -4); ctx.lineTo(-34, -20); ctx.lineTo(-27, -20); ctx.lineTo(-16, -4); ctx.closePath(); ctx.fill();   // the fin
    ctx.fillStyle = jet ? '#f7f8fa' : col; U.roundRect(ctx, -34, -6, 66, 12, 6); ctx.fill();
    ctx.fillStyle = jet ? '#3b7dd8' : 'rgba(255,255,255,0.45)'; ctx.fillRect(-28, 0, 54, 2);
    if (jet) { ctx.fillStyle = '#9fd8ff'; for (let wx = 18; wx > -24; wx -= 6) ctx.fillRect(wx, -3, 3, 2.5); }
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.moveTo(32, -1); ctx.quadraticCurveTo(30, -5, 24, -5); ctx.lineTo(24, -1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = jet ? '#c9ced6' : 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(6, 2); ctx.lineTo(-10, 2); ctx.lineTo(-18, 10); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();   // the wing
    ctx.restore();
  },
  // a side-on view of the apron through a window: sky, the tree line, grass, the runway and planes going by
  apronView(r, g, x0, y0, w, h, extra) {
    const ctx = r.ctx, t = g.time;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    const sky = ctx.createLinearGradient(0, y0, 0, y0 + h); sky.addColorStop(0, '#49a8ea'); sky.addColorStop(0.6, '#bfe6fb'); sky.addColorStop(0.61, '#6cb35a'); sky.addColorStop(1, '#5a9c48');
    ctx.fillStyle = sky; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) { const cx = x0 + ((((i * 97 + t * 6) % (w + 80)) + w + 80) % (w + 80)) - 40, cy = y0 + 8 + (i % 2) * 10; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.arc(cx + 7, cy - 3, 7, 0, Math.PI * 2); ctx.arc(cx + 14, cy, 5, 0, Math.PI * 2); ctx.fill(); }
    const hz = y0 + h * 0.6;
    ctx.fillStyle = '#3f9a4a'; for (let x = x0; x < x0 + w + 10; x += 12) { ctx.beginPath(); ctx.arc(x, hz, 7 + ((x * 7) % 5), Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#5a5f6b'; ctx.fillRect(x0, hz + h * 0.14, w, h * 0.14);
    ctx.fillStyle = '#f3efe3'; for (let x = x0 + ((t * 0) % 30); x < x0 + w; x += 30) ctx.fillRect(x, hz + h * 0.21 - 1, 14, 2);
    // a jet parked at its gate, a little plane taking off now and then, a tug pottering about
    this.sidePlane(ctx, x0 + w * 0.22, hz + h * 0.1, h / 60, '#fff', 1, true);
    const k = (t % 11) / 11, px = x0 - 40 + k * (w + 80), lift = Math.max(0, k - 0.5) * h * 0.9;
    this.sidePlane(ctx, px, hz + h * 0.2 - lift, h / 90, '#f2b134', 1, false);
    const tx = x0 + w * 0.5 + Math.sin(t * 0.4) * w * 0.25; ctx.fillStyle = '#ffd166'; U.roundRect(ctx, tx - 6, hz + h * 0.06, 12, 5, 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(tx - 5, hz + h * 0.06 + 5, 3, 2); ctx.fillRect(tx + 2, hz + h * 0.06 + 5, 3, 2);
    if (extra) extra(ctx, hz);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x0 + w * 0.1, y0); ctx.lineTo(x0 + w * 0.22, y0); ctx.lineTo(x0 + w * 0.08, y0 + h); ctx.lineTo(x0 - w * 0.04, y0 + h); ctx.closePath(); ctx.fill();   // a glint on the glass
    ctx.restore();
  },

  // ---------- the terminal ----------
  paintTerminal(r, g) {
    const R = CFG.AF_IN.ROOMS.afterminal, E = this;
    this.shell(r, 'afterminal', {
      out: '#2d3a4a', back: '#dfe7ef', wall: '#9aa6b4', title: R.title, mat: '#3b7dd8',
      floor: (ctx, A) => {
        E.tiles('#eef2f6', '#e2e8ef', 30)(ctx, A);
        ctx.fillStyle = 'rgba(59,125,216,0.12)'; ctx.fillRect(A.x0, R.CHECKIN.y - 22, R.DESK.x1 - A.x0 + 10, 44);   // the queue lane
        ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(A.x0, R.CHECKIN.y + 22); ctx.lineTo(R.DESK.x1 + 10, R.CHECKIN.y + 22); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffd166'; ctx.fillRect(R.ARCH.x0 + 8, R.ARCH.y - 54, 3, 108); ctx.fillRect(R.ARCH.x1 - 11, R.ARCH.y - 54, 3, 108);   // the yellow lines through security
      },
      backArt: (ctx, A) => {
        ctx.fillStyle = '#3b7dd8'; ctx.fillRect(A.x0 - 24, R.BACK_TOP, A.x1 - A.x0 + 48, 6);
        // the departures board (its letters are drawn live)
        const B = R.BOARD; ctx.fillStyle = '#5c6670'; U.roundRect(ctx, B.x0 - 4, B.y0 - 4, B.x1 - B.x0 + 8, B.y1 - B.y0 + 8, 6); ctx.fill(); ctx.fillStyle = '#1e2733'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
        // the window frame (the view is drawn live)
        const Wn = R.WINDOW; ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, Wn.x0 - 6, Wn.y0 - 6, Wn.x1 - Wn.x0 + 12, Wn.y1 - Wn.y0 + 12, 6); ctx.fill();
        // the gift shop's sign and striped awning
        ctx.fillStyle = '#e4572e'; U.roundRect(ctx, 13476, 4030, 80, 22, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎁 GIFTS', 13516, 4041);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(13484 + i * 13, 4062, 13, 14); ctx.beginPath(); ctx.arc(13490.5 + i * 13, 4076, 6.5, 0, Math.PI); ctx.fill(); }
      },
    });
    const ctx = r.ctx;
    // the check-in desk's top (its front is drawn as an entity, over the agent's legs), a luggage scale beside it
    this.drawDesk(r, false);
    // the security arch's floor plate and an X-ray tray table
    ctx.fillStyle = '#9aa6b4'; ctx.fillRect(R.ARCH.x0 - 4, R.ARCH.y - 9, R.ARCH.x1 - R.ARCH.x0 + 8, 18);
    // the baggage carousel: a steel rim, a rubber belt and the plate in the middle
    const C = R.CAROUSEL;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(C.x + 4, C.y + 6, C.rx, C.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx, C.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx - 4, C.ry - 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9ced6'; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.rx - 26, C.ry - 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BAGS 🧳', C.x, C.y + 1);
    // the waiting seats: blue cushions in two rows, chrome backs
    for (const y of R.SEAT_YS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(R.SEAT_XS[0] - 16, y + 10, R.SEAT_XS[R.SEAT_XS.length - 1] - R.SEAT_XS[0] + 34, 6);
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(R.SEAT_XS[0] - 16, y - 27, R.SEAT_XS[R.SEAT_XS.length - 1] - R.SEAT_XS[0] + 32, 4);
      for (const x of R.SEAT_XS) {
        ctx.fillStyle = '#2d5a8a'; U.roundRect(ctx, x - 13, y - 25, 26, 14, 4); ctx.fill();
        ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - 13, y - 12, 26, 20, 5); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 10, y - 10, 20, 3);
      }
    }
    // the gift shop: shelves of toy planes, snow globes, a pizza teddy; a postcard stand
    const S = R.SHELF;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0);
    ctx.fillStyle = '#b98a55'; for (let y = S.y0 + 8; y < S.y1 - 6; y += 36) ctx.fillRect(S.x0 + 3, y, S.x1 - S.x0 - 6, 30);
    const cols = ['#e4572e', '#3b7dd8', '#ffd166', '#41b883'];
    for (let i = 0; i < 3; i++) {
      const y = S.y0 + 22 + i * 36;
      if (i === 1) { for (let j = 0; j < 2; j++) { const x = S.x0 + 16 + j * 26; ctx.fillStyle = 'rgba(159,224,255,0.75)'; ctx.beginPath(); ctx.arc(x, y - 2, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 4, 2, 2); ctx.fillRect(x + 2, y - 7, 2, 2); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 8, y + 5, 16, 5); } }
      else for (let j = 0; j < 2; j++) { ctx.save(); ctx.translate(S.x0 + 17 + j * 26, y); ctx.scale(0.24, 0.24); r.drawVehicle('plane', g, cols[(i + j) % 4], { color: cols[(i + j) % 4], lift: 1 }); ctx.restore(); }
    }
    ctx.fillStyle = '#c96a3f'; ctx.beginPath(); ctx.arc(13470, 4128, 11, 0, Math.PI * 2); ctx.arc(13462, 4118, 5, 0, Math.PI * 2); ctx.arc(13478, 4118, 5, 0, Math.PI * 2); ctx.fill(); r.drawPizza(13470, 4131, 6);   // the pizza teddy
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(13467, 4124, 2, 2); ctx.fillRect(13472, 4124, 2, 2);
    this.plant(ctx, 13060, 4320); this.plant(ctx, 13446, 4110);
    ctx.fillStyle = '#5c6670'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SECURITY', (R.ARCH.x0 + R.ARCH.x1) / 2, R.ARCH.y + 22);
  },
  // the check-in desk: its top (static) or its front (an entity, so the agent stands behind it)
  drawDesk(r, front) {
    const ctx = r.ctx, D = CFG.AF_IN.ROOMS.afterminal.DESK;
    if (!front) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(D.x0 + 4, D.y1 - 2, D.x1 - D.x0, 6);
      return;
    }
    ctx.fillStyle = '#f6f2ea'; U.roundRect(ctx, D.x0, D.y0 - 6, D.x1 - D.x0, 22, 5); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, D.x0, D.y0 + 14, D.x1 - D.x0, D.y1 - D.y0 - 14, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(D.x0 + 4, D.y0 + 16, D.x1 - D.x0 - 8, 3);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈️ CHECK-IN', (D.x0 + D.x1) / 2, D.y0 + 28);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, D.x0 + 12, D.y0 - 2, 22, 12, 2); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(D.x0 + 14, D.y0, 18, 7);   // a screen
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(D.x1 - 30, D.y0 - 2, 24, 12); ctx.fillStyle = '#e4572e'; ctx.fillRect(D.x1 - 22, D.y0 + 1, 8, 4);   // the bag scale
  },
  drawAgent(r, g) {
    const ctx = r.ctx, st = this.st, R = CFG.AF_IN.ROOMS.afterminal, Ag = R.AGENT, p = g.player, d = U.dist(p.x, p.y, Ag.x, Ag.y), t = g.time;
    r.drawPerson(Ag.x, Ag.y, { shirt: '#3b7dd8', skin: '#e0ac69', hair: '#2b1d14', hairStyle: 2, facing: p.x < Ag.x - 10 ? -1 : 1, moving: false, bob: 0, carry: 0, bowtie: '#e4572e', pants: '#2d3a4a' });
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(Ag.x - 12, Ag.y - 49); ctx.lineTo(Ag.x + 12, Ag.y - 49); ctx.lineTo(Ag.x + 8, Ag.y - 54); ctx.lineTo(Ag.x - 8, Ag.y - 54); ctx.closePath(); ctx.fill();   // a little hat
    if (st.agent > 0 || (d < 110 && g.area === 'afterminal' && !st.seat)) {
      const text = st.agent > 0 ? 'Have a nice trip! ✈️' : 'Where to? ☁️';
      r.drawBubble(Ag.x, Ag.y - 78 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(text, 0, 0); }, st.agent > 0 ? 136 : 96);
    }
  },
  // the security arch: a frame you walk through (north–south), its light green, flashing red when it beeps
  drawArch(r, g) {
    const ctx = r.ctx, A = CFG.AF_IN.ROOMS.afterminal.ARCH, st = this.st, H = 72, t = g.time, cx = (A.x0 + A.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(A.x0 - 6, A.y + 3, A.x1 - A.x0 + 16, 6);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, A.x0 - 7, A.y - H, 14, H + 6, 4); ctx.fill(); U.roundRect(ctx, A.x1 - 7, A.y - H, 14, H + 6, 4); ctx.fill();
    U.roundRect(ctx, A.x0 - 7, A.y - H - 6, A.x1 - A.x0 + 14, 16, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(A.x0 - 4, A.y - H + 8, 3, H - 8); ctx.fillRect(A.x1 - 4, A.y - H + 8, 3, H - 8); ctx.fillRect(A.x0, A.y - H - 4, A.x1 - A.x0, 3);
    ctx.fillStyle = '#5c6670'; for (let i = 0; i < 5; i++) { ctx.fillRect(A.x0 - 3, A.y - H + 18 + i * 10, 6, 2); ctx.fillRect(A.x1 - 3, A.y - H + 18 + i * 10, 6, 2); }
    const on = st.beep > 0;
    ctx.fillStyle = on ? (Math.floor(t * 10) % 2 ? '#ff5252' : '#ffd166') : '#44d36a'; ctx.beginPath(); ctx.arc(cx, A.y - H + 2, 5, 0, Math.PI * 2); ctx.fill();
    if (on) r.drawBubble(cx, A.y - H - 30 + Math.sin(t * 6) * 2, () => { ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e4572e'; ctx.fillText('Beep! 🍕', 0, 0); }, 84);
  },
  // the departures board's rows, flipping letter by letter
  drawBoard(r, g) {
    const ctx = r.ctx, R = CFG.AF_IN.ROOMS.afterminal, B = R.BOARD, st = this.st, C = CFG.AF_IN;
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈️ DEPARTURES', (B.x0 + B.x1) / 2, B.y0 + 7);
    const chars = 'ABCDEFGHIJKLMNOPRSTUVWZ';
    st.rows.forEach((row, i) => {
      const y = B.y0 + 21 + i * 12;
      ctx.fillStyle = '#2d3a4a'; ctx.fillRect(B.x0 + 4, y - 5, B.x1 - B.x0 - 8, 10);
      let text = row.dest;
      if (row.flip > 0) { const done = Math.floor((1 - row.flip / 0.9) * text.length); text = text.split('').map((ch, j) => j < done || ch === ' ' ? ch : chars[(Math.floor(g.time * 30) + j * 7 + i) % chars.length]).join(''); }
      ctx.font = r.font(7); ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(text, B.x0 + 7, y);
      const [label, col] = C.BOARD_STATES[row.state]; ctx.textAlign = 'right'; ctx.fillStyle = row.flip > 0 ? '#9aa0a8' : col; ctx.fillText(label, B.x1 - 7, y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(B.x0 + 4, y - 0.5, B.x1 - B.x0 - 8, 1);   // the split across each flap
    });
  },
  // the suitcases going round the carousel (the chef's is the red one with a pizza sticker)
  drawBags(r, g) {
    const ctx = r.ctx, C = CFG.AF_IN.ROOMS.afterminal.CAROUSEL, st = this.st, t = g.time, cols = ['#e4572e', '#3b7dd8', '#41b883', '#8e5bd1', '#ffd166', '#5b3a1a'];
    const bags = [];
    for (let i = 0; i < 6; i++) { if (i === 0 && st.bag > 0) continue; const a = t * 0.5 + i * Math.PI / 3; bags.push({ i, x: C.x + Math.cos(a) * (C.rx - 15), y: C.y + Math.sin(a) * (C.ry - 10) }); }
    bags.sort((a, b) => a.y - b.y);
    for (const b of bags) this.drawSuitcase(r, b.x, b.y, cols[b.i], b.i === 0, 0.85);
  },
  drawSuitcase(r, x, y, col, chefs, s = 1) {
    const ctx = r.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-10, 6, 22, 4);
    ctx.fillStyle = col; U.roundRect(ctx, -11, -10, 22, 16, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-11, -2, 22, 2);
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(-4, -14); ctx.lineTo(4, -14); ctx.lineTo(4, -10); ctx.stroke();
    if (chefs) { r.drawPizza(4, -3, 4); ctx.fillStyle = '#fff'; ctx.fillRect(-9, -8, 6, 4); }
    ctx.restore();
  },

  // ---------- the hangar ----------
  paintHangar(r, g) {
    const R = CFG.AF_IN.ROOMS.afhangar, E = this;
    this.shell(r, 'afhangar', {
      out: '#2d3a4a', back: '#c3c8d0', wall: '#7f8791', title: R.title, mat: '#e4572e',
      floor: (ctx, A) => {
        E.concrete('#b4bac2')(ctx, A);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.strokeRect(R.PLANE.x - 74, R.PLANE.y - 82, 168, 164); ctx.setLineDash([]);   // the maintenance box
        ctx.fillStyle = 'rgba(40,30,20,0.22)'; ctx.beginPath(); ctx.ellipse(R.PLANE.x + 30, R.PLANE.y + 40, 18, 7, 0.3, 0, Math.PI * 2); ctx.fill();   // an oil stain
      },
      backArt: (ctx, A) => {
        // ribs of the arched roof, two tool walls (pegboards with tool outlines), the banner hanging between them
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = A.x0 - 24; x < A.x1 + 24; x += 40) ctx.fillRect(x, R.BACK_TOP, 4, A.y0 - R.BACK_TOP);
        for (const x0 of [14052, 14420]) {
          ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, x0, 4030, 128, 62, 4); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 4036; y < 4090; y += 8) for (let x = x0 + 6; x < x0 + 124; x += 8) ctx.fillRect(x, y, 2, 2);
          E.toolRow(ctx, x0 + 10, 4040, ['#e4572e', '#2d3a4a', '#3b7dd8', '#41b883', '#e4572e', '#2d3a4a']);
        }
        ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(14200, R.BACK_TOP); ctx.lineTo(14212, 4034); ctx.moveTo(14400, R.BACK_TOP); ctx.lineTo(14388, 4034); ctx.stroke();
        ctx.fillStyle = '#e4572e'; U.roundRect(ctx, 14206, 4032, 188, 36, 6); ctx.fill(); ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, 14212, 4036, 176, 28, 4); ctx.fill();
        ctx.fillStyle = '#e4572e'; ctx.font = r.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA AIR ✈️', 14308, 4051);
        r.drawPizza(14228, 4050, 9);
        for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#ffd166' : '#e4572e'; ctx.beginPath(); ctx.moveTo(14210 + i * 18, 4068); ctx.lineTo(14228 + i * 18, 4068); ctx.lineTo(14219 + i * 18, 4078); ctx.closePath(); ctx.fill(); }
      },
      bottomArt: (ctx, A) => {   // the big hangar doors in the front wall (closed), red and yellow
        for (let x = A.x0; x < A.x1; x += 40) { ctx.fillStyle = (x / 40) % 2 ? '#e4572e' : '#f2b134'; ctx.fillRect(x, A.y1 + 3, 40, 14); }
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(A.x0, A.y1 + 17, A.x1 - A.x0, 3);
      },
    });
    const ctx = r.ctx;
    // the plane under repair, its engine cowling off (the mechanic is drawn live underneath)
    const P = R.PLANE;
    ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.s, P.s); r.drawVehicle('plane', g, P.color, { color: P.color, lift: 0 }); ctx.restore();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, P.x + 22 * P.s, P.y - 7 * P.s, 12 * P.s, 14 * P.s, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 3; i++) ctx.fillRect(P.x + 24 * P.s + i * 4, P.y - 5 * P.s, 2, 10 * P.s);   // the open engine
    ctx.fillStyle = P.color; ctx.save(); ctx.translate(P.x + 60, P.y + 54); ctx.rotate(0.3); U.roundRect(ctx, -14, -8, 28, 16, 6); ctx.fill(); ctx.restore();   // the cowling, set down on the floor
    // the red tool cart
    const Ct = R.CART;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(Ct.x - 16, Ct.y + 10, 36, 6);
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, Ct.x - 18, Ct.y - 14, 36, 26, 4); ctx.fill(); ctx.fillStyle = '#b71c1c'; for (let i = 0; i < 3; i++) ctx.fillRect(Ct.x - 15, Ct.y - 8 + i * 7, 30, 2);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(Ct.x - 12, Ct.y - 18, 10, 3); ctx.fillRect(Ct.x + 2, Ct.y - 19, 12, 3);
    ctx.fillStyle = '#2b1d14'; for (const dx of [-14, 12]) { ctx.beginPath(); ctx.arc(Ct.x + dx, Ct.y + 13, 3, 0, Math.PI * 2); ctx.fill(); }
    // the parts shelves along the right wall: wheels, boxes, a spare propeller
    const S = R.SHELF;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0); ctx.fillStyle = '#9aa0a8'; for (let y = S.y0 + 6; y < S.y1 - 4; y += 32) ctx.fillRect(S.x0 + 3, y, S.x1 - S.x0 - 6, 26);
    for (let i = 0; i < 4; i++) {
      const y = S.y0 + 20 + i * 32;
      if (i % 2 === 0) { for (const dx of [12, 34]) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(S.x0 + dx, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(S.x0 + dx, y, 3.5, 0, Math.PI * 2); ctx.fill(); } }
      else { ctx.fillStyle = '#b98a55'; ctx.fillRect(S.x0 + 6, y - 8, 20, 16); ctx.fillStyle = '#d9b48c'; ctx.fillRect(S.x0 + 28, y - 10, 22, 18); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(S.x0 + 6, y - 1, 20, 2); ctx.fillRect(S.x0 + 28, y - 2, 22, 2); }
    }
    // the stack of oil drums in the corner
    const Dr = R.DRUMS, dcol = ['#3b7dd8', '#e4572e', '#41b883', '#3b7dd8', '#e4572e'];
    const drum = (x, y, col) => { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 16, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(x - 14, y - 6, 28, 22); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - 14, y + 2, 28, 2); ctx.fillRect(x - 14, y + 9, 28, 2); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 6, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(x, y - 6, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + 5, y - 7, 2, 0, Math.PI * 2); ctx.fill(); };
    drum(Dr.x0 + 16, Dr.y1 - 30, dcol[0]); drum(Dr.x0 + 44, Dr.y1 - 30, dcol[1]); drum(Dr.x0 + 70, Dr.y1 - 30, dcol[2]);
    drum(Dr.x0 + 30, Dr.y1 - 54, dcol[3]); drum(Dr.x0 + 58, Dr.y1 - 54, dcol[4]);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OIL', Dr.x0 + 44, Dr.y1 - 20);
    // the propeller's shadow on the floor
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(R.PROP.x, R.PROP.y + 100, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
  },
  // a row of hanging tools: hammer, wrench, screwdriver, saw, pliers…
  toolRow(ctx, x, y, cols) {
    const tools = [
      (c) => { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(-2, -2, 4, 34); ctx.fillStyle = c; ctx.fillRect(-9, -4, 18, 8); },
      (c) => { ctx.fillStyle = c; ctx.fillRect(-2, 0, 4, 32); ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d9b48c'; ctx.fillRect(-2, -6, 4, 6); },
      (c) => { ctx.fillStyle = c; U.roundRect(ctx, -4, 0, 8, 14, 3); ctx.fill(); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-1, 14, 2, 18); },
      (c) => { ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.lineTo(4, 34); ctx.lineTo(-4, 34); ctx.closePath(); ctx.fill(); ctx.fillStyle = c; U.roundRect(ctx, -7, -2, 14, 10, 3); ctx.fill(); },
      (c) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, 34); ctx.lineTo(0, 10); ctx.lineTo(5, 34); ctx.stroke(); ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(0, 6, 4, 0, Math.PI * 2); ctx.fill(); },
      (c) => { ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-2, 0, 4, 30); ctx.fillStyle = c; ctx.fillRect(-5, 22, 10, 10); },
    ];
    tools.forEach((f, i) => { ctx.save(); ctx.translate(x + 10 + i * 19, y + 2); f(cols[i % cols.length]); ctx.restore(); ctx.fillStyle = '#5c6670'; ctx.fillRect(x + 8 + i * 19, y - 3, 4, 4); });
  },
  // the tug: the back part with its seat (under the chef) and the front with the bonnet and wheels (over the chef's legs)
  drawTug(r, g, front) {
    const ctx = r.ctx, T = CFG.AF_IN.ROOMS.afhangar.TUG, st = this.st, t = g.time, x = T.x, y = T.y, wob = st.tug ? Math.sin(t * 30) * 0.6 : 0;
    ctx.save(); ctx.translate(0, wob);
    if (!front) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 36, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9a227'; U.roundRect(ctx, x - 32, y - 14, 62, 26, 6); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, x - 26, y - 34, 26, 24, 5); ctx.fill();   // the seat back
      ctx.fillStyle = '#3e424a'; U.roundRect(ctx, x - 24, y - 12, 24, 12, 4); ctx.fill();   // the cushion
      ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 34, y - 2, 6, 6);   // the tow hitch
    } else {
      ctx.fillStyle = '#2b1d14'; for (const dx of [-22, 20]) { U.roundRect(ctx, x + dx - 8, y + 2, 16, 14, 4); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(x + dx, y + 9, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; }
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x - 32, y - 2, 62, 14, 4); ctx.fill();   // the low side panel
      ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x + 2, y - 18, 28, 26, 5); ctx.fill();   // the bonnet
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 8, y - 13 + i * 6, 18, 2);
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(x + 28, y - 4, 3, 0, Math.PI * 2); ctx.fill();   // a headlight
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x - 2, y - 18, 7, 3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 2, y - 15); ctx.lineTo(x + 2, y - 4); ctx.stroke();   // the steering wheel
      ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 30, y + 2, 10, 3); ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TUG', x - 10, y + 6);
      ctx.fillStyle = '#ffa000'; ctx.beginPath(); ctx.arc(x - 30, y - 18, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = Math.floor(t * 3) % 2 ? '#ffd54f' : '#ff8f00'; ctx.beginPath(); ctx.arc(x - 30, y - 20, 2, 0, Math.PI * 2); ctx.fill();   // the beacon
    }
    ctx.restore();
  },
  // the mechanic on his creeper under the engine: only his legs stick out, a wrench working away, sparks flying
  drawMech(r, g) {
    const ctx = r.ctx, M = CFG.AF_IN.ROOMS.afhangar.MECH, st = this.st, t = g.time, kick = Math.sin(t * 3) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(M.x - 10, M.y + 4, 24, 26);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, M.x - 9, M.y - 2, 20, 30, 3); ctx.fill();   // the creeper
    ctx.fillStyle = '#2b1d14'; for (const [dx, dy] of [[-9, 0], [11, 0], [-9, 26], [11, 26]]) { ctx.beginPath(); ctx.arc(M.x + dx, M.y + dy, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2d5a8a'; U.roundRect(ctx, M.x - 6, M.y - 4, 6, 26 + kick, 2); ctx.fill(); U.roundRect(ctx, M.x + 2, M.y - 4, 6, 26 - kick, 2); ctx.fill();   // overall legs
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(M.x - 3, M.y + 24 + kick, 4, 3, 0, 0, Math.PI * 2); ctx.ellipse(M.x + 5, M.y + 24 - kick, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(M.x + 8, M.y - 8); ctx.rotate(Math.sin(t * 8) * 0.5); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-1.5, -10, 3, 12); ctx.beginPath(); ctx.arc(0, -11, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // the wrench, at work
    for (const s of st.sparks) { const a = 1 - s.t / s.dur; ctx.fillStyle = `rgba(255,${180 + Math.round(60 * a)},80,${a.toFixed(2)})`; ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); }
    if (st.mech > 0) {
      ctx.save(); ctx.translate(M.x + 22, M.y - 20 + Math.sin(t * 6) * 3); ctx.rotate(Math.sin(t * 7) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore();   // waving: a 👋, no arm
      r.drawBubble(M.x + 30, M.y - 58 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Almost fixed! 🔧', 0, 0); }, 124);
    }
  },
  // the propeller hanging from the roof on two chains, face on, turning slowly in the draught
  drawHangProp(r, g) {
    const ctx = r.ctx, R = CFG.AF_IN.ROOMS.afhangar, P = R.PROP, t = g.time, a = t * 0.35 + Math.sin(t * 0.8) * 0.2, L = 44;
    ctx.strokeStyle = 'rgba(43,29,20,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(P.x - 24, R.BACK_TOP); ctx.lineTo(P.x - 3, P.y - 6); ctx.moveTo(P.x + 24, R.BACK_TOP); ctx.lineTo(P.x + 3, P.y - 6); ctx.stroke(); ctx.setLineDash([]);
    for (const s of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
      ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(a + s);
      ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(L / 2, 0, L / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(L / 2, -2, L / 2 - 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(L - 4, 0, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(P.x, P.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(P.x - 2, P.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  },

  // ---------- the control tower ----------
  paintTowerFloor(r, g) {
    const R = CFG.AF_IN.ROOMS.aftower, E = this;
    this.shell(r, 'aftower', {
      out: '#2d3a4a', back: '#e8e4d8', wall: '#9aa2ad', title: R.title, mat: '#3b7dd8',
      floor: (ctx, A) => { E.tiles('#d6d0c2', '#c9c3b5', 40)(ctx, A); ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(15300, 4250, 70, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(15300, 4250, 56, 20, 0, 0, Math.PI * 2); ctx.stroke(); },
      backArt: (ctx, A) => {
        ctx.fillStyle = '#5c6670'; ctx.fillRect(A.x0 - 24, R.BACK_TOP, A.x1 - A.x0 + 48, 6);
        // lockers, a map of the airfield, a weather board, a row of coat hooks with pilots' caps
        for (let i = 0; i < 4; i++) { const x = 15056 + i * 26; ctx.fillStyle = ['#3b7dd8', '#41b883', '#e4572e', '#ffd166'][i]; ctx.fillRect(x, 4032, 22, 64); ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = 4038; y < 4052; y += 4) ctx.fillRect(x + 6, y, 10, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(x + 16, 4064, 3, 8); }
        ctx.fillStyle = '#fff8ee'; ctx.fillRect(15172, 4030, 110, 60); ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; ctx.strokeRect(15172, 4030, 110, 60);
        ctx.fillStyle = '#8bc34a'; ctx.fillRect(15176, 4034, 102, 52); ctx.fillStyle = '#5a5f6b'; ctx.fillRect(15200, 4036, 12, 48); ctx.fillStyle = '#7c8088'; ctx.fillRect(15230, 4044, 40, 26); ctx.fillStyle = '#c3c8d0'; ctx.fillRect(15218, 4040, 14, 10); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(15186, 4060, 4, 0, Math.PI * 2); ctx.fill();   // the airfield map: you are here
        ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('YOU ARE HERE', 15190, 4080);
        ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, 15300, 4032, 66, 56, 6); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('WEATHER', 15333, 4040);
        ctx.font = r.font(18); ctx.fillText('☀️', 15318, 4062); ctx.font = r.font(12); ctx.fillText('🌬️', 15350, 4064); ctx.font = r.font(7); ctx.fillStyle = '#8ef0a0'; ctx.fillText('GOOD TO FLY!', 15333, 4080);
        ctx.fillStyle = '#5b3a1a'; ctx.fillRect(15486, 4044, 60, 4); for (let i = 0; i < 2; i++) { ctx.fillStyle = '#1f2a38'; ctx.beginPath(); ctx.arc(15500 + i * 30, 4054, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(15492 + i * 30, 4053, 18, 3); ctx.fillStyle = '#ffd166'; ctx.fillRect(15497 + i * 30, 4048, 6, 2); }
      },
    });
    const ctx = r.ctx, S = R.STAIRS;
    this.drawSpiral(ctx, S.x, S.y, S.r);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⬆ UP', S.x, S.y + S.r + 14);
    // the sofa, the coffee table with a radio and two mugs, the water cooler
    const So = R.SOFA;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(So.x0 + 4, So.y1 - 4, So.x1 - So.x0, 8);
    ctx.fillStyle = '#8e5bd1'; U.roundRect(ctx, So.x0, So.y0, So.x1 - So.x0, So.y1 - So.y0, 8); ctx.fill();
    ctx.fillStyle = '#a77be0'; U.roundRect(ctx, So.x0 + 6, So.y0 + 14, So.x1 - So.x0 - 12, So.y1 - So.y0 - 20, 6); ctx.fill();
    ctx.fillStyle = '#7a48bd'; U.roundRect(ctx, So.x0, So.y0, So.x1 - So.x0, 14, 6); ctx.fill();
    const Tb = R.TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Tb.x0 + 4, Tb.y1 - 2, Tb.x1 - Tb.x0, 6);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Tb.x0, Tb.y0, Tb.x1 - Tb.x0, Tb.y1 - Tb.y0, 5); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, Tb.x0 + 8, Tb.y0 + 6, 28, 16, 3); ctx.fill(); ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 4; i++) ctx.fillRect(Tb.x0 + 11 + i * 5, Tb.y0 + 9, 2, 10); ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Tb.x0 + 32, Tb.y0 + 6); ctx.lineTo(Tb.x0 + 38, Tb.y0 - 6); ctx.stroke();   // the radio
    ctx.fillStyle = '#fff'; U.roundRect(ctx, Tb.x0 + 46, Tb.y0 + 8, 9, 9, 2); ctx.fill(); U.roundRect(ctx, Tb.x0 + 60, Tb.y0 + 12, 9, 9, 2); ctx.fill();
    const Co = R.COOLER;
    ctx.fillStyle = '#e8e4d8'; U.roundRect(ctx, Co.x0, Co.y0 + 10, Co.x1 - Co.x0, Co.y1 - Co.y0 - 10, 4); ctx.fill(); ctx.fillStyle = 'rgba(159,224,255,0.85)'; U.roundRect(ctx, Co.x0 + 6, Co.y0 - 14, Co.x1 - Co.x0 - 12, 26, 8); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(Co.x0 + 12, Co.y0 + 22, 6, 4);
    this.plant(ctx, 15528, 4318);
  },
  paintCab(r, g) {
    const R = CFG.AF_IN.ROOMS.aftower, E = this;
    this.shell(r, 'aftower', {
      out: '#79c6f2', back: '#2d3a4a', wall: '#2d3a4a', title: R.titleUp, noDoor: true,
      floor: (ctx, A) => { ctx.fillStyle = '#4a5260'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = A.x0 + 6; x < A.x1; x += 14) for (let y = A.y0 + 6; y < A.y1; y += 14) ctx.fillRect(x, y, 2, 2); },
      sideArt: (ctx, A) => {   // glass all round: the side and front walls are windows too
        ctx.fillStyle = 'rgba(159,224,255,0.75)'; ctx.fillRect(A.x0 - 20, A.y0 + 4, 16, A.y1 - A.y0 - 8); ctx.fillRect(A.x1 + 4, A.y0 + 4, 16, A.y1 - A.y0 - 8); ctx.fillRect(A.x0 + 4, A.y1 + 4, A.x1 - A.x0 - 8, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let y = A.y0 + 10; y < A.y1; y += 60) { ctx.fillRect(A.x0 - 18, y, 4, 24); ctx.fillRect(A.x1 + 6, y, 4, 24); } for (let x = A.x0 + 10; x < A.x1; x += 80) ctx.fillRect(x, A.y1 + 6, 30, 4);
      },
    });
    const ctx = r.ctx, S = R.STAIRS, D = R.DESK;
    // the stairwell with its railing, coming up through the floor
    this.drawSpiral(ctx, S.x, S.y, S.r, true);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⬇ DOWN', S.x, S.y + S.r + 14);
    // the console along the windows: knobs, switches, a phone
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(D.x0 + 4, D.y1 - 2, D.x1 - D.x0, 6);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, D.x0, D.y0 - 4, D.x1 - D.x0, D.y1 - D.y0 + 4, 4); ctx.fill();
    ctx.fillStyle = '#7d8591'; ctx.fillRect(D.x0 + 2, D.y0 - 4, D.x1 - D.x0 - 4, 14);
    const cols = ['#ff5252', '#44d36a', '#ffd166', '#5ad1ff'];
    for (let i = 0; i < 18; i++) { ctx.fillStyle = cols[i % 4]; ctx.fillRect(D.x0 + 140 + (i % 9) * 10, D.y0 + 16 + Math.floor(i / 9) * 8, 5, 4); }
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, D.x0 + 236, D.y0 + 14, 18, 12, 3); ctx.fill();   // the red phone
    E.plant(ctx, 15062, 4320);
  },
  drawSpiral(ctx, x, y, rr, hole) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(x + 3, y + 4, rr + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hole ? '#1a1410' : '#5c6670'; ctx.beginPath(); ctx.arc(x, y, rr + 2, 0, Math.PI * 2); ctx.fill();
    const n = 14;
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI / 2 + (k / n) * Math.PI * 2 * 0.92, a1 = a0 + (Math.PI * 2 * 0.92) / n, lit = hole ? 0.25 + (1 - k / n) * 0.6 : 0.45 + (k / n) * 0.55;
      ctx.fillStyle = `rgba(${Math.round(120 * lit + 60)},${Math.round(130 * lit + 60)},${Math.round(140 * lit + 70)},1)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, rr, a0, a1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr); ctx.stroke();
    }
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.5, 0, Math.PI * 2); ctx.fill(); }
  },
  // the cab's big windows (the airfield live, a plane taking off when you clear it) and its radar screens
  drawCabLive(r, g) {
    const ctx = r.ctx, R = CFG.AF_IN.ROOMS.aftower, A = R.ROOM, st = this.st, t = g.time;
    const x0 = A.x0 - 20, x1 = A.x1 + 20, y0 = R.BACK_TOP + 6, y1 = A.y0 - 4;
    this.apronView(r, g, x0, y0, x1 - x0, y1 - y0, st.clear > 0 ? (c, hz) => {
      const k = 1 - st.clear / CFG.AF_IN.CLEAR, px = x0 + 40 + k * (x1 - x0), lift = Math.max(0, k - 0.35) * 70;
      this.sidePlane(c, px, hz + 18 - lift, 1.1, '#e4572e', 1, false);
      c.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 1; i < 5; i++) { c.beginPath(); c.arc(px - 30 - i * 14, hz + 20 - Math.max(0, k - 0.35 - i * 0.03) * 70, 3 + i, 0, Math.PI * 2); c.fill(); }
    } : null);
    ctx.fillStyle = '#2d3a4a'; for (let x = x0; x <= x1; x += 88) ctx.fillRect(x - 3, y0, 6, y1 - y0);   // window frames
    // the radar screens on the console: a sweep, and a blip for every plane (where it really is, round the tower)
    const T = CFG.AIRFIELD.TOWER, planes = typeof AirfieldExt !== 'undefined' && AirfieldExt.rt ? AirfieldExt.rt.planes.filter((v) => !v.away) : [];
    R.RADARS.forEach((c, i) => {
      const rr = 26;
      ctx.fillStyle = '#1e2733'; ctx.beginPath(); ctx.arc(c.x, c.y, rr + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0d3b1e'; ctx.beginPath(); ctx.arc(c.x, c.y, rr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(120,255,160,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c.x, c.y, rr * 0.5, 0, Math.PI * 2); ctx.moveTo(c.x - rr, c.y); ctx.lineTo(c.x + rr, c.y); ctx.moveTo(c.x, c.y - rr); ctx.lineTo(c.x, c.y + rr); ctx.stroke();
      const a = t * 2 + i;
      ctx.fillStyle = 'rgba(120,255,160,0.3)'; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.arc(c.x, c.y, rr, a - 0.6, a); ctx.closePath(); ctx.fill();
      const sc = i === 0 ? rr / 900 : rr / 450;
      for (const v of planes) {
        const bx = (v.x - T.x) * sc, by = (v.y - T.y) * sc; if (bx * bx + by * by > rr * rr) continue;
        ctx.fillStyle = v.kind === 'jet' ? '#ffd166' : '#8ef0a0'; ctx.beginPath(); ctx.arc(c.x + bx, c.y + by, v.kind === 'jet' ? 2.6 : 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(c.x, c.y, 1.6, 0, Math.PI * 2); ctx.fill();
    });
    // the microphone on its stand
    const M = R.MIC; ctx.fillStyle = '#2b1d14'; ctx.fillRect(M.x - 1, M.y - 14, 2, 14); ctx.fillRect(M.x - 6, M.y - 1, 12, 3); ctx.fillStyle = st.clear > 0 ? '#ff5252' : '#9aa0a8'; U.roundRect(ctx, M.x - 4, M.y - 22, 8, 11, 4); ctx.fill();
  },
  drawController(r, g) {
    const ctx = r.ctx, R = CFG.AF_IN.ROOMS.aftower, C = R.CTRL, st = this.st, p = g.player, t = g.time;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, C.x - 14, C.y - 30, 28, 30, 6); ctx.fill();   // the chair
    const bob = st.thumbs > 0 ? -Math.abs(Math.sin(st.thumbs * 8)) * 6 : 0;
    r.drawPerson(C.x, C.y + bob, { shirt: '#fff', skin: '#8d5524', hair: '#2b1d14', hairStyle: 0, facing: p.x < C.x ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', bowtie: '#3b7dd8' });
    // the headset: a band over the head, ear cups, a little microphone
    const hy = C.y + bob - 38;
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(C.x, hy, 12, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, C.x - 14, hy - 4, 5, 9, 2); ctx.fill(); U.roundRect(ctx, C.x + 9, hy - 4, 5, 9, 2); ctx.fill();
    const f = p.x < C.x ? -1 : 1; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(C.x + f * 11, hy + 3); ctx.quadraticCurveTo(C.x + f * 10, hy + 9, C.x + f * 4, hy + 8); ctx.stroke(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(C.x + f * 4, hy + 8, 1.8, 0, Math.PI * 2); ctx.fill();
    const d = U.dist(p.x, p.y, C.x, C.y);
    if (d < 120 && st.clear <= 0 && !st.viewing) r.drawBubble(C.x, C.y - 80 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Tower here! 🎧', 0, 0); }, 104);
  },
  drawBinoculars(r, g) {
    const ctx = r.ctx, B = CFG.AF_IN.ROOMS.aftower.BINO;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(B.x + 2, B.y + 6, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(B.x, B.y - 30); ctx.lineTo(B.x - 10, B.y + 4); ctx.moveTo(B.x, B.y - 30); ctx.lineTo(B.x + 10, B.y + 4); ctx.moveTo(B.x, B.y - 30); ctx.lineTo(B.x, B.y + 6); ctx.stroke();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, B.x - 12, B.y - 44, 10, 16, 4); ctx.fill(); U.roundRect(ctx, B.x + 2, B.y - 44, 10, 16, 4); ctx.fill(); ctx.fillRect(B.x - 3, B.y - 40, 6, 6);
    ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(B.x - 7, B.y - 44, 3, 0, Math.PI * 2); ctx.arc(B.x + 7, B.y - 44, 3, 0, Math.PI * 2); ctx.fill();
  },
  drawPilotNap(r, g) {
    const ctx = r.ctx, So = CFG.AF_IN.ROOMS.aftower.SOFA, t = g.time, x = (So.x0 + So.x1) / 2, y = So.y0 + 30;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2 * 0.98); ctx.scale(0.9, 0.9);
    r.drawPerson(0, 0, { shirt: '#2d3a4a', skin: '#f1c27d', hat: 'cap', capColor: '#1f2a38', facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a' });
    ctx.restore();
    const k = (t % 2) / 2; ctx.fillStyle = `rgba(255,255,255,${(1 - k).toFixed(2)})`; ctx.font = r.font(11 + k * 5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', x - 50 - k * 10, y - 16 - k * 22);
  },
  // looking out through the binoculars: the runway and the planes, live, in a pair of round lenses
  drawLookOut(r, g, W, H) {
    const ctx = r.ctx, v = this.st.viewing, C = CFG.AF_IN, k = v.t, a = Math.min(1, k / 0.3, (C.VIEW - k) / 0.3);
    const pw = Math.min(W - 24, 620), ph = Math.min(H - 220, pw * 0.56), cy = Math.max(90, H / 2 - 30) , R0 = Math.min(ph / 2, pw * 0.29), c1 = W / 2 - R0 * 0.78, c2 = W / 2 + R0 * 0.78;
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(10,14,20,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.arc(c1, cy, R0, 0, Math.PI * 2); ctx.arc(c2, cy, R0, 0, Math.PI * 2); ctx.clip();
    // follow a plane that is moving (taking off, landing, being driven), else pan slowly across the field
    const rt = typeof AirfieldExt !== 'undefined' ? AirfieldExt.rt : null, t = g.time;
    let fx = 2040 + Math.sin(t * 0.22) * 170, fy = 540 + Math.cos(t * 0.17) * 110;
    const busy = rt && ((rt.runup && rt.runup.plane) || (rt.roll && rt.roll.plane));
    if (busy && !busy.away) { fx = busy.x; fy = busy.y; }
    const span = c2 - c1 + 2 * R0, s = span / 640, vx = fx, vy = fy;
    ctx.translate(W / 2, cy); ctx.scale(s, s); ctx.translate(-vx, -vy);
    const hw = span / s / 2 + 40, hh = R0 / s + 40;
    ctx.fillStyle = '#6cb35a'; ctx.fillRect(vx - hw, vy - hh, hw * 2, hh * 2);
    const bg = Render.bgs && Render.bgs.town, TW = CFG.AREAS.town.WORLD;
    if (bg && bg.key && bg.canvas.width > 0) {
      const sx0 = Math.max(TW.x0, vx - hw), sy0 = Math.max(TW.y0, vy - hh), sx1 = Math.min(TW.x1, vx + hw), sy1 = Math.min(TW.y1, vy + hh), res = bg.canvas.width / (TW.x1 - TW.x0);
      if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(bg.canvas, (sx0 - TW.x0) * res, (sy0 - TW.y0) * res, (sx1 - sx0) * res, (sy1 - sy0) * res, sx0, sy0, sx1 - sx0, sy1 - sy0);
    } else if (rt) AirfieldExt.paintRunway(r, CFG.AIRFIELD.RUNWAY, true);
    if (rt) {
      const items = [];
      for (const pl of rt.planes) if (!pl.away) items.push({ y: pl.y, draw: () => AirfieldExt.drawPlaneTop(r, g, pl) });
      items.push({ y: rt.heli.y, draw: () => AirfieldExt.drawHeli(r, g) });
      items.push({ y: CFG.AIRFIELD.TOWER.y + 14, draw: () => AirfieldExt.drawTower(r, g, CFG.AIRFIELD.TOWER.x, CFG.AIRFIELD.TOWER.y) });
      items.sort((p, q) => p.y - q.y); for (const it of items) it.draw();
    }
    ctx.restore();
    // the rims of the lenses
    ctx.strokeStyle = '#1e2733'; ctx.lineWidth = 10; for (const cx of [c1, c2]) { ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (const cx of [c1, c2]) { ctx.beginPath(); ctx.arc(cx - R0 * 0.35, cy - R0 * 0.4, R0 * 0.18, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(43,29,20,0.85)'; U.roundRect(ctx, W / 2 - 120, cy + R0 + 16, 240, 32, 10); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔭 Look at the planes! ✈️', W / 2, cy + R0 + 32);
    ctx.restore();
  },

  // ---------- the workshop ----------
  paintWorkshop(r, g) {
    const R = CFG.AF_IN.ROOMS.afworkshop, E = this;
    this.shell(r, 'afworkshop', {
      out: '#2d3a4a', back: '#b98a55', wall: '#8d5a2b', title: R.title, mat: '#5b3a1a',
      floor: (ctx, A) => { ctx.fillStyle = '#c9b48f'; ctx.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let y = A.y0; y < A.y1; y += 20) { ctx.fillRect(A.x0, y, A.x1 - A.x0, 2); for (let x = A.x0 + ((y / 20) % 3) * 50; x < A.x1; x += 150) ctx.fillRect(x, y, 2, 20); } ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 14; i++) ctx.fillRect(A.x0 + 30 + (i * 97) % (A.x1 - A.x0 - 60), A.y0 + 20 + (i * 53) % (A.y1 - A.y0 - 40), 5, 2); },   // planks and a few wood shavings
      backArt: (ctx, A) => {
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = R.BACK_TOP + 10; y < A.y0; y += 12) ctx.fillRect(A.x0 - 24, y, A.x1 - A.x0 + 48, 2);
        ctx.fillStyle = '#d9b48c'; U.roundRect(ctx, 16058, 4028, 190, 66, 4); ctx.fill();   // the pegboard over the bench
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 4034; y < 4092; y += 8) for (let x = 16064; x < 16244; x += 8) ctx.fillRect(x, y, 2, 2);
        E.toolRow(ctx, 16066, 4036, ['#e4572e', '#3b7dd8', '#41b883', '#2d3a4a', '#ffd166', '#e4572e']);
        // a window, a calendar with a plane on it, a clock
        ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, 16290, 4030, 90, 56, 4); ctx.fill(); const sk = ctx.createLinearGradient(0, 4034, 0, 4082); sk.addColorStop(0, '#49a8ea'); sk.addColorStop(0.65, '#bfe6fb'); sk.addColorStop(0.66, '#6cb35a'); sk.addColorStop(1, '#5a9c48'); ctx.fillStyle = sk; ctx.fillRect(16294, 4034, 82, 48); ctx.fillStyle = '#fff8ee'; ctx.fillRect(16333, 4034, 4, 48); ctx.fillRect(16294, 4056, 82, 4);
        ctx.fillStyle = '#fff'; ctx.fillRect(16400, 4032, 44, 54); ctx.fillStyle = '#e4572e'; ctx.fillRect(16400, 4032, 44, 12); ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 12; i++) ctx.fillRect(16404 + (i % 4) * 10, 4066 + Math.floor(i / 4) * 6, 6, 3);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(16468, 4048, 11, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(16468, 4048, 11, 0, Math.PI * 2); ctx.moveTo(16468, 4048); ctx.lineTo(16468, 4041); ctx.moveTo(16468, 4048); ctx.lineTo(16473, 4050); ctx.stroke();
      },
    });
    const ctx = r.ctx;
    E.sidePlane(ctx, 16422, 4054, 0.45, '#3b7dd8', 1, false);   // the plane on the calendar
    // the workbench: a thick wooden top with tools, a radio and an oil can (the vice is drawn live)
    const B = R.BENCH;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 4, B.y1 - 2, B.x1 - B.x0, 6);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(B.x0, B.y0 + 16, B.x1 - B.x0, B.y1 - B.y0 - 16);
    ctx.fillStyle = '#c9975f'; U.roundRect(ctx, B.x0, B.y0 - 6, B.x1 - B.x0, 24, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = B.x0 + 20; x < B.x1; x += 30) ctx.fillRect(x, B.y0 - 6, 2, 24);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(B.x0 + 8, B.y1 - 8, 20, 6); ctx.fillRect(B.x1 - 28, B.y1 - 8, 20, 6);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, B.x0 + 12, B.y0 - 2, 26, 14, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(B.x0 + 20, B.y0 + 5, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(B.x0 + 27, B.y0 + 1, 8, 2); ctx.fillRect(B.x0 + 27, B.y0 + 5, 8, 2);   // the radio
    ctx.fillStyle = '#41b883'; U.roundRect(ctx, B.x0 + 50, B.y0, 12, 12, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(B.x0 + 55, B.y0 - 5, 2, 6);   // the oil can
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(B.x0 + 76, B.y0 + 4, 30, 3); ctx.fillStyle = '#e4572e'; ctx.fillRect(B.x0 + 70, B.y0 + 2, 8, 7);   // a screwdriver
    ctx.fillStyle = '#d9b48c'; ctx.fillRect(B.x0 + 116, B.y0 + 1, 40, 10); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(B.x0 + 116, B.y0 + 5, 40, 1);   // a plank
    // the red tool cabinet
    const Cb = R.CABINET;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(Cb.x0 + 4, Cb.y1 - 2, Cb.x1 - Cb.x0, 6);
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, Cb.x0, Cb.y0 - 30, Cb.x1 - Cb.x0, Cb.y1 - Cb.y0 + 30, 4); ctx.fill();
    ctx.fillStyle = '#b71c1c'; for (let i = 0; i < 5; i++) { ctx.fillRect(Cb.x0 + 4, Cb.y0 - 24 + i * 14, Cb.x1 - Cb.x0 - 8, 10); } ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 5; i++) ctx.fillRect((Cb.x0 + Cb.x1) / 2 - 8, Cb.y0 - 20 + i * 14, 16, 2);
    // a wing on two sawhorses, half painted, with a paint pot
    const Wg = R.WING;
    ctx.fillStyle = '#8d5a2b'; for (const x of [Wg.x0 + 20, Wg.x1 - 20]) { ctx.fillRect(x - 14, Wg.y1 - 10, 4, 12); ctx.fillRect(x + 10, Wg.y1 - 10, 4, 12); ctx.fillRect(x - 14, Wg.y0 + 10, 28, 4); }
    ctx.fillStyle = '#e8e4d8'; U.roundRect(ctx, Wg.x0, Wg.y0, Wg.x1 - Wg.x0, Wg.y1 - Wg.y0 - 10, 10); ctx.fill();
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, Wg.x0, Wg.y0, (Wg.x1 - Wg.x0) * 0.55, Wg.y1 - Wg.y0 - 10, 10); ctx.fill();
    r.drawPizza(Wg.x0 + 34, Wg.y0 + 17, 9);
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, Wg.x1 - 26, Wg.y0 + 8, 16, 14, 3); ctx.fill(); ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.ellipse(Wg.x1 - 18, Wg.y0 + 9, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  },
  // the vice at the end of the bench: its jaws close and the handle turns when you squeeze
  drawVice(r, g) {
    const ctx = r.ctx, V = CFG.AF_IN.ROOMS.afworkshop.VICE, st = this.st, k = st.vice > 0 ? Math.sin(Math.min(1, (1.6 - st.vice) / 0.4) * Math.PI / 2) * (st.vice < 0.4 ? st.vice / 0.4 : 1) : 0, gap = 10 - k * 6;
    ctx.fillStyle = '#3e424a'; ctx.fillRect(V.x - 14, V.y - 4, 28, 10);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(V.x - 14, V.y - 16, 10, 14); ctx.fillRect(V.x - 4 + gap, V.y - 16, 10, 14);
    ctx.fillStyle = '#d9b48c'; ctx.fillRect(V.x - 4, V.y - 22, gap, 18);   // the block of wood being held
    ctx.save(); ctx.translate(V.x + 10 + gap, V.y - 9); ctx.rotate(st.vice > 0 ? (1.6 - st.vice) * 6 : 0.4); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-1.5, -12, 3, 24); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -12, 3, 0, Math.PI * 2); ctx.arc(0, 12, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  },
  // the propeller on its stand: spin it and it whirrs round, slowing down again
  drawProp(r, g) {
    const ctx = r.ctx, P = CFG.AF_IN.ROOMS.afworkshop.PROP, st = this.st, hx = P.x, hy = P.y - 52, L = 40;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 8, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, P.x - 16, P.y - 6, 32, 14, 4); ctx.fill(); ctx.fillRect(P.x - 4, hy, 8, P.y - hy);
    if (st.propV > 6) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, st.propV / 50).toFixed(2)})`; ctx.beginPath(); ctx.arc(hx, hy, L + 3, 0, Math.PI * 2); ctx.fill(); }
    for (const s of [0, Math.PI]) {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(st.propA + s);
      ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.ellipse(L / 2, 0, L / 2, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(L - 4, 0, 5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(hx - 2, hy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    if (st.propV > 10) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const y = hy - 14 + i * 14; ctx.beginPath(); ctx.moveTo(hx + L + 10, y); ctx.lineTo(hx + L + 30, y + 2); ctx.stroke(); } }   // whoosh lines
  },
  drawMechanic(r, g) {
    const ctx = r.ctx, M = CFG.AF_IN.ROOMS.afworkshop.MECHANIC, st = this.st, p = g.player, t = g.time, d = U.dist(p.x, p.y, M.x, M.y);
    const hop = st.hello && st.hello.t < 0.5 ? -Math.sin(st.hello.t / 0.5 * Math.PI) * 12 : 0;
    if (hop) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(M.x, M.y + 4, 12, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    r.drawPerson(M.x, M.y + hop, { shirt: '#2d5a8a', skin: '#c68642', hat: 'cap', capColor: '#e4572e', facing: p.x < M.x ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#2d5a8a', belt: true });
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(M.x + 9, M.y + hop - 22, 3, 12);   // a wrench in his pocket
    if (st.hello) {
      ctx.save(); ctx.translate(M.x + 24, M.y + hop - 48); ctx.rotate(Math.sin(t * 7) * 0.3); ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore();   // waving: a 👋, no arm
      const line = CFG.AF_IN.MECH_LINES[st.hello.i];
      r.drawBubble(M.x - 10, M.y - 82 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(line, 0, 0); }, Math.max(110, line.length * 7.2));
    } else if (d < 120) r.drawBubble(M.x - 10, M.y - 82 + Math.sin(t * 4) * 3, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Hi, Chef! 🔧', 0, 0); }, 92);
  },

  // ---------- things the chef carries: the suitcase, the toy plane, the toolbox ----------
  drawCarried(r, g) {
    const ctx = r.ctx, st = this.st, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, t = g.time;
    if (st.bag > 0) this.drawSuitcase(r, p.x - f * 18, p.y - 6 + bob, '#e4572e', true, 0.8);
    if (st.toolbox > 0) {
      const x = p.x + f * 18, y = p.y - 8 + bob;
      ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x - 9, y - 6, 18, 12, 2); ctx.fill(); ctx.fillStyle = '#b71c1c'; ctx.fillRect(x - 9, y - 1, 18, 2);
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x - 4, y - 10); ctx.lineTo(x + 4, y - 10); ctx.lineTo(x + 4, y - 6); ctx.stroke();
    }
    if (st.toy > 0) {   // the toy plane zooms in little circles round the chef's hat
      const a = t * 3, x = p.x + Math.cos(a) * 26, y = p.y - 78 + Math.sin(a) * 8 + bob;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.scale(0.28, 0.28); r.drawVehicle('plane', g, '#3b7dd8', { color: '#3b7dd8', lift: 1 }); ctx.restore();
    }
  },

  // ---------- render hooks ----------
  dynamic(r, g) {
    if (!this.st) return;
    const k = this.room(g); if (!k) return;
    const R = CFG.AF_IN.ROOMS[k];
    if (k === 'afterminal') { this.apronView(r, g, R.WINDOW.x0, R.WINDOW.y0, R.WINDOW.x1 - R.WINDOW.x0, R.WINDOW.y1 - R.WINDOW.y0); this.drawWindowBars(r, R.WINDOW); this.drawBoard(r, g); this.drawBags(r, g); }
    else if (k === 'afhangar') this.drawMech(r, g);
    else if (k === 'aftower' && this.st.up) this.drawCabLive(r, g);
    else if (k === 'afworkshop') this.drawVice(r, g);
  },
  drawWindowBars(r, Wn) { const ctx = r.ctx; ctx.fillStyle = '#fff8ee'; for (let x = Wn.x0 + 55; x < Wn.x1 - 10; x += 55) ctx.fillRect(x - 2, Wn.y0, 4, Wn.y1 - Wn.y0); },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player;
    if ((st.bag > 0 || st.toy > 0 || st.toolbox > 0) && !g.driving && !g.onTrain && !g.travel) items.push({ y: p.y + 1, draw: () => this.drawCarried(r, g) });
    const k = this.room(g); if (!k) return;
    const R = CFG.AF_IN.ROOMS[k];
    if (k === 'afterminal') {
      items.push({ y: R.AGENT.y, draw: () => this.drawAgent(r, g) });
      items.push({ y: R.DESK.y1, draw: () => this.drawDesk(r, true) });
      items.push({ y: R.ARCH.y + 2, draw: () => this.drawArch(r, g) });
    } else if (k === 'afhangar') {
      items.push({ y: R.TUG.y - 4, draw: () => this.drawTug(r, g, false) });
      items.push({ y: R.TUG.y + 14, draw: () => this.drawTug(r, g, true) });
    } else if (k === 'aftower') {
      if (st.up) { items.push({ y: R.CTRL.y, draw: () => this.drawController(r, g) }); items.push({ y: R.BINO.y + 6, draw: () => this.drawBinoculars(r, g) }); }
      else items.push({ y: R.SOFA.y0 + 30, draw: () => this.drawPilotNap(r, g) });
    } else if (k === 'afworkshop') {
      items.push({ y: R.PROP.y + 10, draw: () => this.drawProp(r, g) });
      items.push({ y: R.MECHANIC.y, draw: () => this.drawMechanic(r, g) });
    }
  },
  overlay(r, g) {
    if (!this.st) return;
    const st = this.st, k = this.room(g), p = g.player, ctx = r.ctx, t = g.time;
    if (k === 'afhangar') this.drawHangProp(r, g);
    if (k === 'aftower' && st.clear > 0) {   // the chef's radio call, in a big bubble
      r.drawBubble(p.x, p.y - 84 + Math.sin(t * 4) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Pizza Air, cleared for take-off! ✈️', 0, 0); }, 250);
    }
  },
  screen(r, g) {
    if (!this.st || g.travel) return;
    const st = this.st, ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'aftower' && st.viewing) this.drawLookOut(r, g, W, H);
    let a = st.fade > 0 ? st.fade / CFG.AF_IN.FADE : 0;
    if (st.climb) { const k = st.climb.t / CFG.AF_IN.CLIMB; a = Math.max(a, 1 - Math.abs(k * 2 - 1)); }
    if (a > 0) { ctx.fillStyle = `rgba(20,12,6,${Math.min(1, a).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
};
Game.ext.unshift(AirfieldInsideExt);   // first in line so the doors' button and hint beat the airfield's own ("Hop in a plane", the coins)
Render.ext.push(AirfieldInsideExt);
