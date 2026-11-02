'use strict';
// The Diner in Construction Town (the chrome DINER with the neon sign in the south strip, js/sitetown.js) can be entered
// through its front door. Inside: a classic 1950s roadside diner seen from above, with a black-and-white checker floor,
// a long counter with red spinning stools (sit on one and it spins you round once), two red booths by the windows, a
// jukebox with bubbling lights that plays a little rock-and-roll tune, a cook behind the pass-through window flipping
// pancakes, a waitress on roller skates gliding between the tables, a pie case, a neon EAT sign and a milkshake machine.
// Three walk-on pads: pancakes and a burger (the plate appears at the nearest free counter spot; sit there, or sit
// anywhere and the waitress skates it over, and the chef eats it with noms) and a milkshake to carry with a straw.
// Extension module: registered with Game.ext (unshift, so the door beats Construction Town's own buttons) and Render.ext.
// See js/EXTENSIONS.md ("Interiors": the rectangle 17000..17600 × 4000..4400).
CFG.DINER = {
  DOOR_OUT: { x: 3530, y: 1190 },                 // on the forecourt just below the diner's door (CFG.SITETOWN.DINER.door)
  WORLD: { x0: 17000, y0: 4000, x1: 17600, y1: 4400 },
  ROOM: { x0: 17040, y0: 4100, x1: 17560, y1: 4340 }, WALL: 24, BACK_TOP: 4016,   // the tall back wall: sign, kitchen window, menu, window
  EAT_SIGN: { x: 17156, y: 4048 },                                                 // the neon EAT sign on the back wall
  KITCHEN: { x0: 17216, y0: 4030, x1: 17338, y1: 4088 },                           // the pass-through window; the cook works behind it
  MENU: { x0: 17352, y0: 4030, x1: 17440, y1: 4088 },
  WINDOW: { x0: 17468, y0: 4028, x1: 17552, y1: 4082 },                            // over the first booth
  COUNTER: { x0: 17128, y0: 4122, x1: 17420, y1: 4166 },                           // top 4122..4146, chrome front 4146..4166
  MACHINE: { x: 17146, y: 4136 },                                                   // the milkshake machine on the counter's left end
  PIES: { x0: 17374, y0: 4110, x1: 17416, y1: 4142 },                              // the glass pie case on the counter's right end
  STOOLS: [17184, 17226, 17268, 17310, 17352], STOOL_Y: 4196,                       // red spinning stools; the plate goes on the counter above
  PLATE_DX: 16, PLATE_Y: 4134,
  BOOTH: { x0: 17462, x1: 17560, tops: [4100, 4214] },                             // two booths by the right wall (table, two benches)
  JUKE: { x0: 17048, y0: 4100, x1: 17100, y1: 4140, spot: { x: 17074, y: 4168 } },
  PADS: { pancakes: { x: 17100, y: 4284 }, burger: { x: 17196, y: 4284 }, shake: { x: 17292, y: 4284 } },
  EXIT: { x: 17400, y: 4322 },                                                      // the mat inside the door (the door is in the bottom wall)
  SKATE_PATH: [{ x: 17130, y: 4228 }, { x: 17442, y: 4228 }, { x: 17442, y: 4302 }, { x: 17442, y: 4228 }],
  SKATE: 130, EAT_T: 2.0, SPIN_T: 0.9, SONG: 2.6, SHAKE: 30, WHIR: 1.6, MAX_PLATES: 3, FLIP: 2.2,
};
CFG.AREAS.diner = { WORLD: CFG.DINER.WORLD };

const DinerExt = {
  name: 'diner',
  defaults: { diner: { seen: false, eats: 0, shakes: 0, songs: 0, spins: 0, booths: 0 } },
  st: null,

  // ---------- state ----------
  build(g) {
    if (!g.s.diner) g.s.diner = JSON.parse(JSON.stringify(this.defaults.diner));
    const K = CFG.DINER, P = K.SKATE_PATH;
    this.st = {
      fade: 0, seat: null,                    // seat: { kind: 'stool' | 'booth', i, t }
      plates: [],                             // { kind: 'pancakes' | 'burger', at: { kind, i }, held, eat (s eaten so far), nomT }
      job: null,                              // the waitress's delivery: { plate, to: { kind, i }, phase: 'fetch' | 'bring' }
      wait: { x: P[0].x, y: P[0].y, i: 1, pause: 0, facing: 1, moving: false },
      shake: 0, whir: 0, juke: 0, notes: [], noteT: 0, ring: 0, flip: 0, steam: [],
      obs: this.makeObstacles(),
    };
  },
  ready(g) { if (!this.st) this.build(g); if (!g.s.diner) g.s.diner = JSON.parse(JSON.stringify(this.defaults.diner)); return this.st; },
  makeObstacles() {
    const K = CFG.DINER, R = K.ROOM, w = K.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: K.COUNTER.x0, y: R.y0, w: K.COUNTER.x1 - K.COUNTER.x0, h: K.COUNTER.y1 - R.y0 });
    o.push({ x: K.JUKE.x0, y: K.JUKE.y0, w: K.JUKE.x1 - K.JUKE.x0, h: K.JUKE.y1 - K.JUKE.y0 });
    for (const top of K.BOOTH.tops) o.push({ x: K.BOOTH.x0, y: top, w: K.BOOTH.x1 - K.BOOTH.x0, h: 78 });
    return o;
  },
  obstacles(g) { return g.area === 'diner' ? this.ready(g).obs : []; },
  free(x, y) {
    const R = CFG.DINER.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // seats: where the chef sits, where a plate sits in front of them, where the waitress stands to serve, where to stand to sit down
  seatPos(at) {
    const K = CFG.DINER;
    if (at.kind === 'stool') { const x = K.STOOLS[at.i]; return { x, y: K.STOOL_Y }; }
    return { x: (K.BOOTH.x0 + K.BOOTH.x1) / 2 - 2, y: K.BOOTH.tops[at.i] + 38 };
  },
  platePos(at) {
    const K = CFG.DINER;
    if (at.kind === 'stool') return { x: K.STOOLS[at.i] + K.PLATE_DX, y: K.PLATE_Y };
    return { x: (K.BOOTH.x0 + K.BOOTH.x1) / 2 + 14, y: K.BOOTH.tops[at.i] + 44 };
  },
  servePos(at) {
    const K = CFG.DINER;
    if (at.kind === 'stool') return { x: K.STOOLS[at.i] + 22, y: K.STOOL_Y + 22 };
    return this.boothSpot(at.i);
  },
  boothSpot(i) { const K = CFG.DINER; return { x: (K.BOOTH.x0 + K.BOOTH.x1) / 2 - 2, y: K.BOOTH.tops[i] + 98 }; },
  sameSeat(a, b) { return !!a && !!b && a.kind === b.kind && a.i === b.i; },
  plateAt(at) { return this.st.plates.find((pl) => !pl.held && this.sameSeat(pl.at, at)) || null; },

  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.DINER.DOOR_OUT, p = g.player; return g.area === 'site' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  nearStool(g) {
    const K = CFG.DINER, p = g.player;
    for (let i = 0; i < K.STOOLS.length; i++) if (U.dist(p.x, p.y, K.STOOLS[i], K.STOOL_Y) < 22) return i;
    return -1;
  },
  nearBooth(g) {
    const p = g.player;
    for (let i = 0; i < CFG.DINER.BOOTH.tops.length; i++) { const s = this.boothSpot(i); if (U.dist(p.x, p.y, s.x, s.y) < 28) return i; }
    return -1;
  },
  nearJuke(g) { const s = CFG.DINER.JUKE.spot, p = g.player; return U.dist(p.x, p.y, s.x, s.y) < 30; },

  // ---------- game hooks ----------
  action(g) {
    const st = this.ready(g), p = g.player, K = CFG.DINER;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'diner' || !this.onFoot(g)) return null;
    if (st.seat) return st.seat.t < K.SPIN_T && st.seat.kind === 'stool' ? null : { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, K.EXIT.x, K.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.nearJuke(g) && st.juke <= 0) return { label: '🎵 Play the jukebox', run: (gg) => this.playJuke(gg) };
    const s = this.nearStool(g); if (s >= 0) return { label: '🪑 Sit at the counter', run: (gg) => this.sitDown(gg, { kind: 'stool', i: s }) };
    const b = this.nearBooth(g); if (b >= 0) return { label: '🪑 Sit in the booth', run: (gg) => this.sitDown(gg, { kind: 'booth', i: b }) };
    return null;
  },
  enter(g) {
    const K = CFG.DINER, p = g.player, st = this.ready(g);
    g.area = 'diner'; p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    st.fade = 0.45; st.seat = null; Sfx.ding(); Haptics.tap();
    if (!g.s.diner.seen) { g.s.diner.seen = true; g.toast('🍔 Welcome to the diner!', true); }
  },
  leave(g) {
    const K = CFG.DINER, p = g.player, st = this.ready(g);
    g.area = 'site'; p.x = K.DOOR_OUT.x; p.y = K.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    st.seat = null; st.juke = 0; st.notes = []; st.fade = 0.45; Sfx.drop();
  },
  sitDown(g, at) {
    const st = this.ready(g), p = g.player, s = this.seatPos(at);
    st.seat = { kind: at.kind, i: at.i, t: at.kind === 'stool' ? 0 : 99 };
    p.x = s.x; p.y = s.y; p.moving = false; p.facing = 1;
    if (at.kind === 'stool') g.s.diner.spins++; else g.s.diner.booths++;
    if (!this.plateAt(at)) this.callWaitress(at);
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.ready(g), p = g.player; if (!st.seat) return;
    if (st.seat.kind === 'booth') { const s = this.boothSpot(st.seat.i); p.x = s.x; p.y = s.y; }
    st.seat = null; p.moving = false; Sfx.drop();
  },
  // a plate waiting somewhere else: the waitress skates it over to the chef's seat
  callWaitress(at) {
    const st = this.st;
    if (st.job) return;
    const pl = st.plates.find((q) => !q.held && !this.sameSeat(q.at, at));
    if (pl) st.job = { plate: pl, to: { kind: at.kind, i: at.i }, phase: 'fetch' };
  },
  playJuke(g) {
    const st = this.ready(g), K = CFG.DINER;
    if (st.juke > 0) return;
    st.juke = K.SONG; st.notes = []; st.noteT = 0; g.s.diner.songs++;
    // a short rock-and-roll riff
    [392, 494, 587, 659, 587, 494, 440, 523, 659, 587, 523, 784].forEach((f, i) => setTimeout(() => Sfx.tone(f, 0.16, 'square', 0.03), i * 190));
    Haptics.tap();
  },
  home(g) { const st = this.ready(g); st.seat = null; st.fade = 0; st.juke = 0; st.notes = []; st.job = null; for (const pl of st.plates) pl.held = false; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, K = CFG.DINER;
    if (this.free(p.x, p.y)) return false;
    p.x = K.EXIT.x; p.y = K.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    const st = this.ready(g), p = g.player, K = CFG.DINER;
    st.fade = Math.max(0, st.fade - dt);
    st.shake = Math.max(0, st.shake - dt);
    if (g.area !== 'diner') { if (st.seat) st.seat = null; st.juke = 0; st.notes = []; return; }
    st.whir = Math.max(0, st.whir - dt); st.ring = Math.max(0, st.ring - dt);
    st.flip = (st.flip + dt) % K.FLIP;
    // seated: stay put (the stool spins you round once as you sit down)
    if (st.seat && this.onFoot(g)) {
      const s = this.seatPos(st.seat); st.seat.t += dt; p.x = s.x; p.y = s.y; p.moving = false;
      if (st.seat.kind === 'stool' && st.seat.t < K.SPIN_T) p.facing = Math.floor(st.seat.t / 0.15) % 2 ? -1 : 1;
      // eat the plate in front of you
      const pl = this.plateAt(st.seat);
      if (pl && !(st.seat.kind === 'stool' && st.seat.t < K.SPIN_T)) {
        pl.eat += dt; pl.nomT = (pl.nomT || 0) - dt;
        if (pl.nomT <= 0 && pl.eat < K.EAT_T) { pl.nomT = 0.5; g.floats.push({ x: p.x + U.rand(-10, 10), y: p.y - 66, text: 'nom!', color: '#fff', t: 0, dur: 0.8, big: false }); }
        if (pl.eat >= K.EAT_T) {
          st.plates.splice(st.plates.indexOf(pl), 1); g.s.diner.eats++;
          g.floats.push({ x: p.x, y: p.y - 80, text: pl.kind === 'burger' ? 'Yum! 🍔' : 'Yum! 🥞', color: '#ffe08a', t: 0, dur: 1.6, big: true });
          Sfx.chime(); Haptics.success();
        }
      } else if (!pl) this.callWaitress(st.seat);
    } else if (!st.seat) this.rescue(g);
    this.stepWaitress(g, dt);
    // the jukebox: notes float up while it plays
    if (st.juke > 0) {
      st.juke = Math.max(0, st.juke - dt); st.noteT -= dt;
      if (st.noteT <= 0) { st.noteT = 0.28; st.notes.push({ x: K.JUKE.spot.x + U.rand(-14, 14), y: K.JUKE.y0 - 46, ch: U.pick(['♪', '♫', '♩']), t: 0 }); }
    }
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.6);
    // steam off the griddle
    if (Math.random() < dt * 3) st.steam.push({ x: U.rand(K.KITCHEN.x0 + 20, K.KITCHEN.x1 - 20), y: K.KITCHEN.y1 - 14, t: 0 });
    for (const q of st.steam) { q.t += dt; q.y -= 14 * dt; }
    st.steam = st.steam.filter((q) => q.t < 1.2);
  },
  stepWaitress(g, dt) {
    const st = this.st, w = st.wait, K = CFG.DINER, path = K.SKATE_PATH;
    const go = (x, y) => { const px = w.x; const done = U.moveToward(w, x, y, K.SKATE, dt); if (Math.abs(w.x - px) > 0.01) w.facing = w.x > px ? 1 : -1; w.moving = !done; return done; };
    const job = st.job;
    if (job && !st.plates.includes(job.plate)) st.job = null;
    if (st.job) {
      if (job.phase === 'fetch') { const s = this.servePos(job.plate.at); if (go(s.x, s.y)) { job.plate.held = true; job.phase = 'bring'; } }
      else {
        const s = this.servePos(job.to);
        if (go(s.x, s.y)) { job.plate.at = { kind: job.to.kind, i: job.to.i }; job.plate.held = false; st.job = null; w.pause = 0.6; g.floats.push({ x: w.x, y: w.y - 66, text: 'Enjoy! 😊', color: '#ffe08a', t: 0, dur: 1.2, big: false }); }
      }
      return;
    }
    // idle: glide up and down between the counter and the booths, with a little rest at each end
    if (w.pause > 0) { w.pause -= dt; w.moving = false; return; }
    const tg = path[w.i % path.length];
    if (go(tg.x, tg.y)) { w.i = (w.i + 1) % path.length; w.pause = 0.5; }
  },
  pads(g) {
    if (g.area !== 'diner') return [];
    const P = CFG.DINER.PADS, st = this.ready(g), full = st.plates.length >= CFG.DINER.MAX_PLATES;
    return [
      { key: 'dinerPancakes', label: 'Pancakes', ico: '🥞', pos: P.pancakes, price: 3, sub: 'fluffy!', maxed: full },
      { key: 'dinerBurger', label: 'Burger', ico: '🍔', pos: P.burger, price: 4, sub: 'yum!', maxed: full },
      { key: 'dinerShake', label: 'Milkshake', ico: '🥤', pos: P.shake, price: 3, sub: 'with a straw', maxed: st.shake > CFG.DINER.SHAKE - 5 },
    ];
  },
  onPad(g, pad) {
    const st = this.ready(g), K = CFG.DINER, p = g.player;
    if (pad.key === 'dinerShake') {
      st.shake = K.SHAKE; st.whir = K.WHIR; g.s.diner.shakes++;
      g.floats.push({ x: p.x, y: p.y - 60, text: 'A milkshake! 🥤', color: '#ffe08a', t: 0, dur: 1.5, big: true });
      Haptics.success();
      return;
    }
    const kind = pad.key === 'dinerBurger' ? 'burger' : pad.key === 'dinerPancakes' ? 'pancakes' : null;
    if (!kind) return;
    // the plate goes to the nearest free counter spot (or straight to the chef's seat, if the chef somehow is seated)
    let at = null;
    if (st.seat && !this.plateAt(st.seat)) at = { kind: st.seat.kind, i: st.seat.i };
    else {
      let bd = Infinity;
      for (let i = 0; i < K.STOOLS.length; i++) {
        const a = { kind: 'stool', i }; if (this.plateAt(a) || (st.job && this.sameSeat(st.job.to, a))) continue;
        const d = U.dist(p.x, p.y, K.STOOLS[i], K.STOOL_Y); if (d < bd) { bd = d; at = a; }
      }
    }
    if (!at) at = { kind: 'stool', i: 0 };
    st.plates.push({ kind, at, held: false, eat: 0, nomT: 0 });
    st.ring = 1.4;
    const pp = this.platePos(at);
    g.fx.push({ kind: 'sparkle', x0: pp.x, y0: pp.y, x1: pp.x, y1: pp.y, t: 0, dur: 0.6 });
    g.floats.push({ x: (K.KITCHEN.x0 + K.KITCHEN.x1) / 2, y: K.KITCHEN.y0 - 6, text: '🔔 Order up!', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },
  hint(g) {
    const st = this.ready(g), p = g.player, K = CFG.DINER, s = g.s.diner;
    if (g.area === 'site') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, K.DOOR_OUT.x, K.DOOR_OUT.y);
      if (d < 60) return { text: 'Go inside the diner! 🍔', target: d < 30 ? null : K.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'diner') return undefined;
    if (!this.onFoot(g)) return null;
    if (st.seat) {
      if (st.seat.kind === 'stool' && st.seat.t < K.SPIN_T) return { text: 'Wheee! Spinny stool! 🌀', target: null };
      const pl = this.plateAt(st.seat);
      if (pl) return { text: pl.kind === 'burger' ? 'Nom nom nom! 🍔' : 'Nom nom nom! 🥞', target: null };
      if (st.job && this.sameSeat(st.job.to, st.seat)) return { text: 'Here comes your food! 🛼', target: null };
      if (st.shake > 0) return { text: 'Slurp! Mmm, milkshake 🥤', target: null };
      return { text: 'Comfy! Press the button to stand up 🍔', target: null };
    }
    if (st.juke > 0) return { text: 'Rock and roll! 🎵', target: null };
    if (this.nearJuke(g)) return { text: 'Play the jukebox! 🎵', target: null };
    const waiting = st.plates.find((q) => !q.held);
    if (waiting) {
      const sp = this.seatPos(waiting.at), tgt = waiting.at.kind === 'booth' ? this.boothSpot(waiting.at.i) : sp;
      return { text: 'Your food is ready! Sit down to eat 🍽️', target: U.dist(p.x, p.y, tgt.x, tgt.y) < 22 ? null : tgt };
    }
    if (this.nearStool(g) >= 0) return { text: 'Sit on a spinny stool! 🪑', target: null };
    if (this.nearBooth(g) >= 0) return { text: 'Sit in the comfy booth 🛋️', target: null };
    const cash = (k) => g.s.cash + (g.s.padPaid[k] || 0);
    if (!s.eats && !st.plates.length && cash('dinerPancakes') >= 3) return { text: 'Order some pancakes! 🥞', target: K.PADS.pancakes };
    if (!s.songs) return { text: 'Play the jukebox! 🎵', target: K.JUKE.spot };
    if (!s.spins) return { text: 'Spin on a counter stool! 🪑', target: { x: K.STOOLS[2], y: K.STOOL_Y } };
    if (!s.booths) return { text: 'Sit in a booth by the window 🛋️', target: this.boothSpot(0) };
    if (!s.eats && cash('dinerBurger') >= 4) return { text: 'Order a burger! 🍔', target: K.PADS.burger };
    if (st.shake > 0) return { text: 'Mmm, milkshake! 🥤', target: null };
    if (!s.shakes && cash('dinerShake') >= 3) return { text: 'Get a milkshake! 🥤', target: K.PADS.shake };
    return { text: 'Yummy diner! 🍔', target: null };
  },

  // ---------- Construction Town outside: a welcome mat at the door and a COME IN tag on the door glass ----------
  bgKey() { return 'diner1'; },
  paintAfter(r, g, area) {
    if (area !== 'site') return;
    const ctx = r.ctx, D = CFG.DINER.DOOR_OUT;
    // the door (redrawn here so the diner always has one) with a round porthole and a chrome handle
    const dx = D.x, dy = (CFG.SITETOWN && CFG.SITETOWN.DINER) ? CFG.SITETOWN.DINER.y1 : D.y - 20;
    ctx.fillStyle = '#b8401c'; ctx.fillRect(dx - 17, dy - 44, 34, 44);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(dx - 14, dy - 41, 28, 41);
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(dx, dy - 27, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(dx, dy - 27, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(dx - 4, dy - 31, 3, 6);
    ctx.fillStyle = '#e8eaee'; ctx.fillRect(dx + 7, dy - 16, 4, 9);
    ctx.fillStyle = '#fff'; U.roundRect(ctx, dx - 12, dy - 13, 16, 8, 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.font = r.font(5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OPEN', dx - 4, dy - 9);
    // a red-and-white checker welcome mat on the forecourt
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#e4572e'; ctx.fillRect(D.x - 18 + i * 6, D.y - 14 + j * 6, 6, 6); }
    ctx.strokeStyle = '#8a3550'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 18, D.y - 14, 36, 12);
  },

  // ---------- the interior, static ----------
  paint: { diner(r, g) { DinerExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, K = CFG.DINER, W = K.WORLD, R = K.ROOM, w = K.WALL;
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, K.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - K.BACK_TOP);
    // the black-and-white checker floor
    const T = 20;
    ctx.fillStyle = '#fafafa'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = '#26262b';
    for (let y = R.y0, j = 0; y < R.y1; y += T, j++) for (let x = R.x0, i = 0; x < R.x1; x += T, i++) if ((i + j) % 2) ctx.fillRect(x, y, Math.min(T, R.x1 - x), Math.min(T, R.y1 - y));
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 6);
    // walls: a tall mint back wall with a red band and chrome trim; red side and bottom walls with chrome edges
    ctx.fillStyle = '#bdeedd'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - K.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(R.x0 - w, K.BACK_TOP, R.x1 - R.x0 + 2 * w, 4);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(R.x0 - w, R.y0 - 14, R.x1 - R.x0 + 2 * w, 10);
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(R.x0 - w, R.y0 - 4, R.x1 - R.x0 + 2 * w, 4); ctx.fillRect(R.x0 - w, R.y0 - 16, R.x1 - R.x0 + 2 * w, 2);
    ctx.fillStyle = '#c62828'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - 3, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, 3, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let x = R.x0 - w; x < R.x1 + w; x += 12) ctx.fillRect(x, R.y1 + 10, 6, 2);
    // little windows in the right wall beside the booths
    for (const top of K.BOOTH.tops) { ctx.fillStyle = '#d7dbe0'; ctx.fillRect(R.x1 + 4, top + 14, 16, 44); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(R.x1 + 7, top + 17, 10, 38); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(R.x1 + 8, top + 19, 3, 16); }
    // the big window over the first booth: blue sky, a far crane, little hills
    const Wn = K.WINDOW;
    ctx.fillStyle = '#d7dbe0'; U.roundRect(ctx, Wn.x0 - 5, Wn.y0 - 5, Wn.x1 - Wn.x0 + 10, Wn.y1 - Wn.y0 + 10, 6); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(Wn.x0, Wn.y0, Wn.x1 - Wn.x0, Wn.y1 - Wn.y0); ctx.clip();
    const sky = ctx.createLinearGradient(0, Wn.y0, 0, Wn.y1); sky.addColorStop(0, '#7ec8f5'); sky.addColorStop(1, '#d6efff'); ctx.fillStyle = sky; ctx.fillRect(Wn.x0, Wn.y0, Wn.x1 - Wn.x0, Wn.y1 - Wn.y0);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Wn.x0 + 20, Wn.y0 + 12, 6, 0, Math.PI * 2); ctx.arc(Wn.x0 + 28, Wn.y0 + 9, 7, 0, Math.PI * 2); ctx.arc(Wn.x0 + 36, Wn.y0 + 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8bc34a'; ctx.beginPath(); ctx.ellipse(Wn.x0 + 20, Wn.y1, 40, 12, 0, 0, Math.PI * 2); ctx.ellipse(Wn.x1 - 10, Wn.y1 + 2, 44, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(Wn.x1 - 26, Wn.y1 - 4); ctx.lineTo(Wn.x1 - 26, Wn.y0 + 14); ctx.moveTo(Wn.x1 - 50, Wn.y0 + 14); ctx.lineTo(Wn.x1 - 8, Wn.y0 + 14); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Wn.x1 - 44, Wn.y0 + 14); ctx.lineTo(Wn.x1 - 44, Wn.y0 + 28); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect((Wn.x0 + Wn.x1) / 2 - 2, Wn.y0, 4, Wn.y1 - Wn.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(Wn.x0 + 4, Wn.y0 + 4, 6, Wn.y1 - Wn.y0 - 8);
    // the neon EAT sign's dark backing board (the tubes glow live)
    const E = K.EAT_SIGN;
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, E.x - 40, E.y - 22, 80, 44, 8); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(E.x - 30, E.y - 30, 2, 8); ctx.fillRect(E.x + 28, E.y - 30, 2, 8);
    // the pass-through window frame (the kitchen and the cook are drawn live inside it) and its steel sill
    const Kt = K.KITCHEN;
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, Kt.x0 - 6, Kt.y0 - 6, Kt.x1 - Kt.x0 + 12, Kt.y1 - Kt.y0 + 12, 5); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(Kt.x0, Kt.y0, Kt.x1 - Kt.x0, Kt.y1 - Kt.y0);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, (Kt.x0 + Kt.x1) / 2 - 34, Kt.y0 - 15, 68, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KITCHEN', (Kt.x0 + Kt.x1) / 2, Kt.y0 - 9);
    // the menu board
    const M = K.MENU;
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, M.x0 - 4, M.y0 - 4, M.x1 - M.x0 + 8, M.y1 - M.y0 + 8, 5); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(M.x0, M.y0, M.x1 - M.x0, M.y1 - M.y0);
    ctx.fillStyle = '#c62828'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.fillText('MENU', (M.x0 + M.x1) / 2, M.y0 + 9);
    ctx.font = r.font(9); ctx.textAlign = 'left'; ctx.fillStyle = '#2b1d14';
    [['🥞', '$3'], ['🍔', '$4'], ['🥤', '$3']].forEach(([ic, pr], i) => { ctx.fillText(ic, M.x0 + 10, M.y0 + 23 + i * 14); ctx.textAlign = 'right'; ctx.fillText(pr, M.x1 - 10, M.y0 + 23 + i * 14); ctx.textAlign = 'left'; });
    // the counter: chrome-ribbed front, a red stripe and a pale speckled top
    const C = K.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(C.x0 + 4, C.y1 - 4, C.x1 - C.x0, 8);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(C.x0, C.y0 + 24, C.x1 - C.x0, C.y1 - C.y0 - 24);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let x = C.x0 + 4; x < C.x1; x += 8) ctx.fillRect(x, C.y0 + 26, 3, C.y1 - C.y0 - 28);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(C.x0, C.y0 + 24, C.x1 - C.x0, 5);
    ctx.fillStyle = '#d7dbe0'; U.roundRect(ctx, C.x0 - 3, C.y0 - 2, C.x1 - C.x0 + 6, 28, 5); ctx.fill();
    ctx.fillStyle = '#fff3e0'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, 23, 4); ctx.fill();
    ctx.fillStyle = 'rgba(228,87,46,0.25)'; for (let i = 0; i < 70; i++) ctx.fillRect(C.x0 + 4 + ((i * 37) % (C.x1 - C.x0 - 8)), C.y0 + 3 + ((i * 13) % 18), 2, 2);
    // napkin holders and ketchup / mustard between the stools
    for (let i = 0; i < K.STOOLS.length - 1; i++) {
      const x = (K.STOOLS[i] + K.STOOLS[i + 1]) / 2 + 2, y = C.y0 + 4;
      if (i % 2) { ctx.fillStyle = '#d7dbe0'; ctx.fillRect(x - 5, y, 10, 9); ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, y - 3, 6, 4); }
      else { ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 6, y - 2, 5, 11, 2); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x + 1, y - 2, 5, 11, 2); ctx.fill(); }
    }
    // the pie case: a glass dome with a cherry pie and a lemon meringue pie
    const P = K.PIES, pcx = (P.x0 + P.x1) / 2;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(P.x0, P.y1 - 4, P.x1 - P.x0, 5);
    const pie = (x, y, filling, top) => {
      ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.ellipse(x, y, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = filling; ctx.beginPath(); ctx.ellipse(x, y - 1, 11, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      if (top) { ctx.fillStyle = top; ctx.beginPath(); ctx.arc(x - 4, y - 3, 3, 0, Math.PI * 2); ctx.arc(x + 3, y - 4, 3.5, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.strokeStyle = '#e8c08a'; ctx.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 5 - 2, y - 4); ctx.lineTo(x + k * 5 + 2, y + 2); ctx.stroke(); } }
    };
    pie(pcx, P.y1 - 7, '#c62828', null);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(pcx - 16, P.y1 - 17, 32, 2);
    pie(pcx, P.y1 - 20, '#ffd166', '#fff8ee');
    ctx.fillStyle = 'rgba(191,227,255,0.45)'; ctx.beginPath(); ctx.moveTo(P.x0, P.y1 - 2); ctx.lineTo(P.x0, P.y0 + 10); ctx.quadraticCurveTo(pcx, P.y0 - 8, P.x1, P.y0 + 10); ctx.lineTo(P.x1, P.y1 - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(pcx, P.y0 - 1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P.x0 + 6, P.y1 - 8); ctx.lineTo(P.x0 + 9, P.y0 + 8); ctx.stroke();
    // the booths: tall red tufted backrests against the wall, a red back bench, and a speckled table (drawn live in front)
    for (const top of K.BOOTH.tops) {
      const x0 = K.BOOTH.x0, x1 = K.BOOTH.x1;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0 + 4, top + 4, x1 - x0 - 4, 78);
      ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x0 + 2, top - 8, x1 - x0 - 4, 26, 8); ctx.fill();
      ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x0 + 5, top - 6, x1 - x0 - 10, 21, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0 + 14; x < x1 - 8; x += 16) ctx.fillRect(x, top - 4, 2, 17);
      ctx.fillStyle = '#c62828'; U.roundRect(ctx, x0 + 4, top + 14, x1 - x0 - 8, 18, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0 + 10, top + 17, x1 - x0 - 20, 3);
    }
    // the jukebox: an arched cabinet with a chrome grille (the bubble lights glow live)
    const J = K.JUKE, jx = (J.x0 + J.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(J.x0 + 4, J.y1 - 4, J.x1 - J.x0, 8);
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.moveTo(J.x0, J.y1); ctx.lineTo(J.x0, J.y0 - 34); ctx.arc(jx, J.y0 - 34, (J.x1 - J.x0) / 2, Math.PI, 0); ctx.lineTo(J.x1, J.y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(J.x0 + 8, J.y1 - 4); ctx.lineTo(J.x0 + 8, J.y0 - 32); ctx.arc(jx, J.y0 - 32, (J.x1 - J.x0) / 2 - 8, Math.PI, 0); ctx.lineTo(J.x1 - 8, J.y1 - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, jx - 14, J.y0 - 30, 28, 16, 3); ctx.fill();   // the record window
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(jx, J.y0 - 22, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(jx, J.y0 - 22, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(jx - 16, J.y0 - 8, 32, 30);
    ctx.fillStyle = '#9aa0a8'; for (let y = J.y0 - 5; y < J.y0 + 20; y += 4) ctx.fillRect(jx - 14, y, 28, 1.5);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(jx - 16, J.y0 + 24, 32, 6);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('JUKEBOX', jx, J.y0 + 27);
    // the door in the bottom wall, its mat, and the diner's name plate below
    const X = K.EXIT;
    ctx.fillStyle = '#9b1d1d'; ctx.fillRect(X.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(X.x, R.y1 + 11, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d7dbe0'; ctx.fillRect(X.x + 13, R.y1 + 8, 3, 9);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#fff' : '#e4572e'; ctx.fillRect(X.x - 21 + i * 6, X.y - 8 + j * 7, 6, 7); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, X.x - 14, X.y - 5, 28, 8, 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', X.x, X.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 44, R.y1 + w + 4, 88, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🍔 DINER 🍔', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.DINER.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawNeon(r, g) {
    const ctx = r.ctx, E = CFG.DINER.EAT_SIGN, t = g.time, on = Math.sin(t * 5) > -0.92 || this.st.juke > 0;
    if (on) { ctx.fillStyle = 'rgba(255,92,138,0.18)'; U.roundRect(ctx, E.x - 48, E.y - 30, 96, 60, 14); ctx.fill(); }
    ctx.font = r.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = on ? '#ff5c8a' : '#8a3550'; ctx.fillText('EAT', E.x, E.y + 1);
    ctx.strokeStyle = Math.sin(t * 2.1) > -0.95 ? '#4dd0e1' : '#2a6a74'; ctx.lineWidth = 2.5; U.roundRect(ctx, E.x - 35, E.y - 17, 70, 34, 7); ctx.stroke();
    // a little blinking arrow under the sign
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(E.x - 6, E.y + 24); ctx.lineTo(E.x + 6, E.y + 24); ctx.lineTo(E.x, E.y + 31); ctx.closePath(); ctx.fill(); }
  },
  // the kitchen through the pass-through: a tiled wall, the griddle, and the cook flipping a pancake (no arms, the pan hops)
  drawKitchen(r, g) {
    const ctx = r.ctx, K = CFG.DINER, Kt = K.KITCHEN, st = this.st, t = g.time, w = Kt.x1 - Kt.x0, h = Kt.y1 - Kt.y0;
    ctx.save(); ctx.beginPath(); ctx.rect(Kt.x0, Kt.y0, w, h); ctx.clip();
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(Kt.x0, Kt.y0, w, h);
    ctx.fillStyle = '#d9e6ee'; for (let y = Kt.y0, j = 0; y < Kt.y1; y += 8, j++) for (let x = Kt.x0 + (j % 2) * 4; x < Kt.x1; x += 8) ctx.fillRect(x, y, 7, 7);
    // the cook: chef hat, head and white shoulders behind the griddle
    const cx = Kt.x0 + 40, ph = st.flip / K.FLIP, hop = ph > 0.7 && ph < 0.8 ? -2 : 0, base = Kt.y1 + 4;
    ctx.fillStyle = '#fff'; U.roundRect(ctx, cx - 16, base - 22 + hop, 32, 28, 9); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(cx - 6, base - 21 + hop); ctx.lineTo(cx, base - 15 + hop); ctx.lineTo(cx + 6, base - 21 + hop); ctx.closePath(); ctx.fill();   // a red neckerchief
    ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(cx, base - 32 + hop, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, cx - 8, base - 50 + hop, 16, 9, 3); ctx.fill(); ctx.beginPath(); ctx.arc(cx - 4, base - 51 + hop, 5, 0, Math.PI * 2); ctx.arc(cx + 4, base - 51 + hop, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(cx + 1, base - 34 + hop, 1.5, 0, Math.PI * 2); ctx.arc(cx + 7, base - 34 + hop, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx + 4, base - 30 + hop, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#6b3e1e'; ctx.beginPath(); ctx.ellipse(cx + 1, base - 28 + hop, 5, 1.6, 0, 0, Math.PI * 2); ctx.fill();   // moustache
    // the griddle along the bottom of the window, with a pancake flipping over it
    ctx.fillStyle = '#5c6670'; ctx.fillRect(Kt.x0, Kt.y1 - 9, w, 9); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(Kt.x0, Kt.y1 - 11, w, 3);
    const px = cx + 34, py = Kt.y1 - 13;
    for (let i = 0; i < 2; i++) { ctx.fillStyle = '#e0a04a'; ctx.beginPath(); ctx.ellipse(px + 30 + i * 22, py, 9, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }   // two more cooking
    const air = ph > 0.3 && ph < 0.7 ? (ph - 0.3) / 0.4 : -1, lift = air >= 0 ? Math.sin(air * Math.PI) * 26 : 0, flipS = air >= 0 ? Math.cos(air * Math.PI * 2) : 1;
    ctx.fillStyle = '#2b2b2b'; U.roundRect(ctx, px - 13, py - 1 - (air >= 0 ? 2 : 0), 26, 4, 2); ctx.fill(); ctx.fillRect(px - 26, py, 13, 2.5);   // the pan and its handle
    ctx.save(); ctx.translate(px, py - 3 - lift); ctx.scale(1, Math.max(0.15, Math.abs(flipS)));
    ctx.fillStyle = flipS < 0 ? '#c9823a' : '#e8b060'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    for (const q of st.steam) { const k = q.t / 1.2; ctx.fillStyle = `rgba(255,255,255,${(0.7 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2 + k * 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the steel sill with the order bell (it rings with a little jump)
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(Kt.x0 - 8, Kt.y1, w + 16, 6); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(Kt.x0 - 8, Kt.y1 + 5, w + 16, 2);
    const bx = Kt.x1 - 16, jump = st.ring > 0 ? Math.abs(Math.sin(t * 20)) * 3 : 0;
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(bx, Kt.y1 - jump, 5, Math.PI, 0); ctx.fill(); ctx.fillRect(bx - 6, Kt.y1 - jump, 12, 2); ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.arc(bx, Kt.y1 - 6 - jump, 1.5, 0, Math.PI * 2); ctx.fill();
  },
  drawJukeLights(r, g) {
    const ctx = r.ctx, J = CFG.DINER.JUKE, st = this.st, t = g.time, jx = (J.x0 + J.x1) / 2, rad = (J.x1 - J.x0) / 2 - 4, play = st.juke > 0;
    const cols = ['#ff5c8a', '#ffd166', '#4dd0e1', '#41b883', '#b39ddb'];
    // a glowing arch of bubble tubes round the top, and side tubes
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI, x = jx + Math.cos(a) * rad, y = J.y0 - 34 + Math.sin(a) * rad, k = (i + Math.floor(t * (play ? 10 : 2))) % cols.length;
      ctx.fillStyle = cols[k]; ctx.globalAlpha = play ? 1 : 0.75; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const sx of [J.x0 + 4, J.x1 - 4]) for (let k = 0; k < 4; k++) {
      const y = J.y0 - 26 + k * 12 + ((t * (play ? 30 : 8) + k * 6) % 12);
      ctx.fillStyle = cols[(k + (sx > jx ? 2 : 0)) % cols.length]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(sx, Math.min(y, J.y1 - 6), 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (play) {
      ctx.fillStyle = 'rgba(255,224,138,0.18)'; ctx.beginPath(); ctx.ellipse(jx, J.y1 + 14, 46, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(jx, J.y0 - 22); ctx.rotate(t * 8); ctx.fillStyle = '#ffd166'; ctx.fillRect(-1, -4, 2, 3); ctx.restore();   // the record turning
    }
  },
  drawMachine(r, g) {
    const ctx = r.ctx, M = CFG.DINER.MACHINE, st = this.st, t = g.time, x = M.x, y = M.y, whir = st.whir > 0, sh = whir ? Math.sin(t * 60) * 0.8 : 0;
    ctx.fillStyle = '#41b883'; U.roundRect(ctx, x - 9 + sh, y - 30, 18, 12, 4); ctx.fill();   // motor head
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(x - 9 + sh, y - 20, 18, 3);
    ctx.fillStyle = '#41b883'; ctx.fillRect(x + 4, y - 20, 5, 22); U.roundRect(ctx, x - 10, y, 22, 5, 2); ctx.fill();   // column and base
    ctx.fillStyle = '#d7dbe0'; ctx.beginPath(); ctx.moveTo(x - 7, y - 16); ctx.lineTo(x + 3, y - 16); ctx.lineTo(x + 2, y); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();   // steel cup
    if (whir) { ctx.fillStyle = '#ff8fab'; ctx.fillRect(x - 6, y - 12, 8, 10); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; for (let k = 0; k < 2; k++) { const ph = (t * 12 + k * 0.5) % 1; ctx.beginPath(); ctx.moveTo(x - 6, y - 12 + ph * 10); ctx.lineTo(x + 2, y - 10 + ph * 10); ctx.stroke(); } }
    ctx.fillStyle = whir ? '#ff5252' : '#ffd166'; ctx.beginPath(); ctx.arc(x - 4 + sh, y - 24, 2, 0, Math.PI * 2); ctx.fill();
  },
  drawFood(ctx, kind, x, y, left) {
    // a plate, and the food on it shrinking as it is eaten (left: 1 = full, 0 = gone)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 2, 13, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4dd0e1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 11, 4, 0, 0, Math.PI * 2); ctx.stroke();
    if (left <= 0.02) return;
    if (kind === 'pancakes') {
      const n = Math.max(1, Math.ceil(left * 3));
      for (let i = 0; i < n; i++) { ctx.fillStyle = '#c9823a'; ctx.beginPath(); ctx.ellipse(x, y - 1 - i * 3, 9, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e8b060'; ctx.beginPath(); ctx.ellipse(x, y - 2 - i * 3, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
      const ty = y - 2 - (n - 1) * 3;
      ctx.fillStyle = 'rgba(140,70,20,0.75)'; ctx.beginPath(); ctx.ellipse(x + 1, ty, 6, 2, 0, 0, Math.PI * 2); ctx.fill();   // syrup
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - 2, ty - 3, 4, 3);   // butter
    } else {
      const s = 0.55 + 0.45 * left;
      ctx.save(); ctx.translate(x, y - 1); ctx.scale(s, s);
      ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b3e1e'; ctx.fillRect(-9, -4, 18, 4);
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(6, -1); ctx.lineTo(-6, -1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#56b862'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * 4, -5, 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#e4a04a'; ctx.beginPath(); ctx.ellipse(0, -7, 9, 5, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff8ee'; for (const [sx, sy] of [[-4, -9], [0, -10], [4, -9]]) ctx.fillRect(sx, sy, 1.5, 1);
      ctx.restore();
    }
  },
  drawShake(ctx, x, y) {
    ctx.fillStyle = 'rgba(191,227,255,0.8)'; ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x + 4, y + 10); ctx.lineTo(x - 4, y + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x + 3.5, y + 9); ctx.lineTo(x - 3.5, y + 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 6, 6, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(x - 1, y - 12, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 2, y - 4); ctx.lineTo(x + 6, y - 20); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 3, y - 8); ctx.lineTo(x + 4, y - 12); ctx.stroke();
  },
  drawCarried(r, g) {
    const p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    this.drawShake(r.ctx, p.x + f * 16, p.y - 22 + bob);
  },
  drawStool(r, g, i) {
    const ctx = r.ctx, K = CFG.DINER, x = K.STOOLS[i], y = K.STOOL_Y, st = this.st;
    const spin = st.seat && st.seat.kind === 'stool' && st.seat.i === i && st.seat.t < K.SPIN_T ? st.seat.t / K.SPIN_T : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 5, 12, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(x, y + 3, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7dbe0'; ctx.fillRect(x - 2, y - 12, 4, 15);
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(x, y - 11, 13, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.ellipse(x, y - 13, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    // a white button stripe that whirls round while the stool spins
    const a = spin * Math.PI * 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 9, y - 13 - Math.sin(a) * 3.5); ctx.lineTo(x + Math.cos(a) * 9, y - 13 + Math.sin(a) * 3.5); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 13, 1.8, 0, Math.PI * 2); ctx.fill();
    if (spin > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y - 13, 18, 7, 0, a, a + 2.2); ctx.stroke(); }
  },
  drawBoothFront(r, g, top) {
    const ctx = r.ctx, x0 = CFG.DINER.BOOTH.x0, x1 = CFG.DINER.BOOTH.x1;
    ctx.fillStyle = '#9b1d1d'; U.roundRect(ctx, x0 + 2, top + 58, x1 - x0 - 4, 20, 6); ctx.fill();
    ctx.fillStyle = '#d32f2f'; U.roundRect(ctx, x0 + 5, top + 60, x1 - x0 - 10, 15, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0 + 14; x < x1 - 8; x += 16) ctx.fillRect(x, top + 62, 2, 11);
  },
  drawBoothTable(r, g, i) {
    const ctx = r.ctx, K = CFG.DINER, top = K.BOOTH.tops[i], x0 = K.BOOTH.x0 + 10, x1 = K.BOOTH.x1 - 10;
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect((x0 + x1) / 2 - 3, top + 50, 6, 8);
    ctx.fillStyle = '#d7dbe0'; U.roundRect(ctx, x0, top + 30, x1 - x0, 24, 5); ctx.fill();
    ctx.fillStyle = '#ffccd5'; U.roundRect(ctx, x0 + 2, top + 30, x1 - x0 - 4, 19, 4); ctx.fill();
    ctx.fillStyle = 'rgba(228,87,46,0.3)'; for (let k = 0; k < 14; k++) ctx.fillRect(x0 + 5 + ((k * 23) % (x1 - x0 - 10)), top + 33 + ((k * 7) % 13), 2, 2);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x0 + 6, top + 33, 4, 9, 1.5); ctx.fill(); ctx.fillStyle = '#ffd166'; U.roundRect(ctx, x0 + 11, top + 33, 4, 9, 1.5); ctx.fill();   // ketchup & mustard
    const pl = this.st.plates.find((q) => !q.held && q.at.kind === 'booth' && q.at.i === i);
    if (pl) { const pp = this.platePos(pl.at); this.drawFood(ctx, pl.kind, pp.x, pp.y, 1 - pl.eat / K.EAT_T); }
  },
  drawWaitress(r, g) {
    const ctx = r.ctx, st = this.st, w = st.wait, t = g.time, f = w.facing, glide = w.moving ? Math.sin(t * 6) * 1.2 : 0;
    const x = w.x, y = w.y;
    // roller skates first (under the dress), then the waitress, then the boots' wheels peeking out
    r.drawPerson(x, y + glide * 0.3, { shirt: '#ff8fab', skin: '#c68642', hair: '#c0392b', hairStyle: 2, facing: f, moving: false, bob: 0, carry: 0, pants: '#ff8fab', apron: '#fff' });
    for (const sx of [-5.5, 5.5]) {
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x + sx - 5, y - 1, 10, 6, 2); ctx.fill();
      ctx.fillStyle = ['#4dd0e1', '#ffd166'][sx < 0 ? 0 : 1]; ctx.beginPath(); ctx.arc(x + sx - 3, y + 6.5, 2.2, 0, Math.PI * 2); ctx.arc(x + sx + 3, y + 6.5, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, y - 52, 3, 0, Math.PI * 2); ctx.arc(x + 4, y - 52, 3, 0, Math.PI * 2); ctx.fill();   // a bow on her bun
    // the tray at her hand, with the plate she is bringing
    const job = st.job;
    if (job && job.phase === 'bring') {
      const tx = x + f * 16, ty = y - 18;
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(tx, ty + 2, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
      this.drawFood(ctx, job.plate.kind, tx, ty, 1 - job.plate.eat / CFG.DINER.EAT_T);
    }
    if (w.moving) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(x - f * (14 + k * 6), y + 2 - k * 4); ctx.lineTo(x - f * (22 + k * 6), y + 2 - k * 4); ctx.stroke(); } }   // speed lines
  },
  dynamic(r, g) {
    const st = this.st; if (!st || g.area !== 'diner') return;
    this.drawOutside(r, g);
    this.drawNeon(r, g);
    this.drawKitchen(r, g);
    this.drawJukeLights(r, g);
    this.drawMachine(r, g);
    // plates on the counter
    const K = CFG.DINER;
    for (const pl of st.plates) if (!pl.held && pl.at.kind === 'stool') { const pp = this.platePos(pl.at); this.drawFood(r.ctx, pl.kind, pp.x, pp.y, 1 - pl.eat / K.EAT_T); }
  },
  entities(r, g, items) {
    const st = this.st; if (!st) return;
    const p = g.player, K = CFG.DINER;
    if (st.shake > 0 && !g.driving && !g.onTrain && !g.travel) items.push({ y: p.y + 0.5, draw: () => this.drawCarried(r, g) });
    if (g.area !== 'diner') return;
    for (let i = 0; i < K.STOOLS.length; i++) items.push({ y: K.STOOL_Y - 0.5, draw: () => this.drawStool(r, g, i) });
    K.BOOTH.tops.forEach((top, i) => {
      items.push({ y: top + 56, draw: () => this.drawBoothTable(r, g, i) });
      items.push({ y: top + 78, draw: () => this.drawBoothFront(r, g, top) });
    });
    items.push({ y: st.wait.y, draw: () => this.drawWaitress(r, g) });
  },
  overlay(r, g) {
    const st = this.st; if (!st || g.area !== 'diner' || !st.notes.length) return;
    const ctx = r.ctx;
    for (const n of st.notes) { const k = n.t / 1.6; ctx.globalAlpha = 1 - k; ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ff5c8a'][Math.floor(n.x) % 3]; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.ch, n.x + Math.sin(k * 6 + n.x) * 6, n.y - k * 40); }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(DinerExt);   // first in line so the door's button and hint beat Construction Town's own
Render.ext.push(DinerExt);
