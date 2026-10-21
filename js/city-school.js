'use strict';
// The school: City building 16 (lower row, facing Harbour Street, the purple one with the SCHOOL sign). Step inside
// for a cheerful classroom: rows of little desks with three pupils who wave, a teacher at a big chalkboard you can
// draw on (each press adds a chalk doodle; a sponge wipes it), an alphabet frieze, a spinning globe, a hamster in its
// wheel, a reading rug (sit down: the teacher reads a picture story, the pages turn by themselves), a bell for recess
// (the kids cheer and run in circles), a show-and-tell table for a pizza, a xylophone that plays a scale as you walk
// along it, and a $3 gold-star pad that sticks a star on the chef's hat for a while.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.SCHOOL = {
  BUILDING: 16,                                  // index in CFG.CITY.BUILDINGS: { x0: 5140, y0: 610, x1: 5330, y1: 876, sign: 'SCHOOL' }
  DOOR_OUT: { x: 5235, y: 890 },                 // on the sidewalk just below the door (the sports car lot is well to the west)
  WORLD: { x0: 13100, y0: 3000, x1: 13700, y1: 3400 },
  ROOM: { x0: 13140, y0: 3100, x1: 13660, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: the board and the frieze hang on it
  FRIEZE_Y: 3020,                                // the alphabet cards along the top of the back wall
  BOARD: { x0: 13232, y0: 3036, x1: 13452, y1: 3096 },
  CHALK_Y: 3150,                                 // stand in front of the board (above this line) to draw
  SPONGE_X: 13410,                               // the sponge sits at the right end of the chalk tray: stand there to wipe
  TDESK: { x0: 13150, y0: 3100, x1: 13214, y1: 3130 }, BELL: { x: 13196, y: 3100 }, BELL_SPOT: { x: 13190, y: 3148 },
  TEACHER_HOME: { x: 13478, y: 3134 }, READ_SPOT: { x: 13556, y: 3250 },
  CABINET: { x0: 13500, y0: 3100, x1: 13650, y1: 3124 }, GLOBE: { x: 13536, y: 3100 }, CAGE: { x: 13606, y: 3100 },
  DESKS: [{ x: 13250, y: 3162 }, { x: 13330, y: 3162 }, { x: 13410, y: 3162 }, { x: 13250, y: 3208 }, { x: 13330, y: 3208 }, { x: 13410, y: 3208 }],
  KIDS: [{ desk: 0, shirt: '#e4572e', skin: '#f1c27d', hair: '#8d5a2b', hairStyle: 2 }, { desk: 2, shirt: '#3b7dd8', skin: '#8d5524', hair: '#2b1d14', hairStyle: 1 }, { desk: 4, shirt: '#41b883', skin: '#e0ac69', hair: '#2b1d14', hairStyle: 3 }],
  RING: { x: 13340, y: 3262 },                   // recess: the kids run in rings around this spot on the open floor
  TABLE: { x0: 13472, y0: 3152, x1: 13540, y1: 3184 }, SHOW_SPOT: { x: 13506, y: 3206 },
  RUG: { x: 13590, y: 3260, rx: 60, ry: 38 }, SIT: { x: 13606, y: 3264 },
  XYLO: { x0: 13290, y: 3304, bar: 20, n: 8, y0: 3290, y1: 3320 },
  NOTES: [523, 587, 659, 698, 784, 880, 988, 1047],
  PADS: { star: { x: 13190, y: 3240 } },
  EXIT: { x: 13200, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  DOODLES: ['sun', 'pizza', 'cat', 'house', 'flower', 'star', 'heart', 'fish'],
  PAGE: 2.6, PAGES: 5, RECESS: 5, STAR: 30,      // seconds: a story page, how long recess lasts, how long the star sticker lasts
};
CFG.AREAS.school = { WORLD: CFG.SCHOOL.WORLD };

const SchoolExt = {
  name: 'school',
  st: null,
  defaults: { school: { seen: false, drawn: 0, rang: 0, reads: 0, shown: 0, xylo: 0, stars: 0 } },

  // ---------- state ----------
  build(g) {
    const S = CFG.SCHOOL;
    if (!g.s.school) g.s.school = { seen: false, drawn: 0, rang: 0, reads: 0, shown: 0, xylo: 0, stars: 0 };
    this.st = {
      fade: 0, read: null,                                            // read: { page, t, flip }
      teacher: { x: S.TEACHER_HOME.x, y: S.TEACHER_HOME.y, facing: -1, moving: false, bob: 0 },
      kids: S.KIDS.map((k) => ({ x: S.DESKS[k.desk].x, y: S.DESKS[k.desk].y - 14, facing: 1, moving: false, bob: 0, wave: 0 })),
      board: [], n: 0, recess: 0, cheer: 0, star: 0, shown: false, xylo: -1, hit: null, wheel: 0, hop: 0,
      obs: null,
    };
    const R = S.ROOM, w = S.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: S.TDESK.x0, y: S.TDESK.y0, w: S.TDESK.x1 - S.TDESK.x0, h: S.TDESK.y1 - S.TDESK.y0 });
    o.push({ x: S.CABINET.x0, y: S.CABINET.y0, w: S.CABINET.x1 - S.CABINET.x0, h: S.CABINET.y1 - S.CABINET.y0 });
    for (const d of S.DESKS) o.push({ x: d.x - 18, y: d.y - 16, w: 36, h: 26 });
    o.push({ x: S.TABLE.x0, y: S.TABLE.y0, w: S.TABLE.x1 - S.TABLE.x0, h: S.TABLE.y1 - S.TABLE.y0 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'school' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.SCHOOL.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  busy() { return typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.SCHOOL.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.busy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  atBoard(g) { const S = CFG.SCHOOL, p = g.player; return p.y < S.CHALK_Y && p.x > S.BOARD.x0 - 6 && p.x < S.BOARD.x1 + 6; },
  atSponge(g) { return this.atBoard(g) && g.player.x > CFG.SCHOOL.SPONGE_X; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, S = CFG.SCHOOL, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'school') return null;
    if (st.read) return { label: '🚶 Stand up', run: (gg) => this.standUp(gg) };
    if (U.dist(p.x, p.y, S.EXIT.x, S.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (U.dist(p.x, p.y, S.BELL_SPOT.x, S.BELL_SPOT.y) < 30 && st.recess <= 0) return { label: '🔔 Ring the bell', run: (gg) => this.ringBell(gg) };
    if (this.atBoard(g)) {
      if (st.board.length && (this.atSponge(g) || st.board.length >= S.DOODLES.length)) return { label: '🧽 Wipe the board', run: (gg) => this.wipe(gg) };
      return { label: '✏️ Draw with chalk', run: (gg) => this.draw(gg) };
    }
    if (p.carry > 0 && U.dist(p.x, p.y, S.SHOW_SPOT.x, S.SHOW_SPOT.y) < 30) return { label: '🍕 Show and tell', run: (gg) => this.showAndTell(gg) };
    if (U.dist(p.x, p.y, S.SIT.x, S.SIT.y) < 34) return { label: '📖 Story time', run: (gg) => this.sitDown(gg) };
    return null;
  },
  enter(g) {
    const S = CFG.SCHOOL, p = g.player;
    g.area = 'school'; p.x = S.EXIT.x; p.y = S.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.xylo = -1; Sfx.ding(); Haptics.tap();
    if (!g.s.school.seen) { g.s.school.seen = true; g.toast('🏫 Welcome to school! Draw on the board and ring the bell', true); }
  },
  leave(g) {
    const S = CFG.SCHOOL, p = g.player;
    g.area = 'city'; p.x = S.DOOR_OUT.x; p.y = S.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.read = null; this.st.fade = 0.45; Sfx.drop();
  },
  draw(g) {
    const S = CFG.SCHOOL, st = this.st, i = st.n++ % S.DOODLES.length;
    if (st.board.length >= S.DOODLES.length) st.board = [];
    st.board.push({ kind: S.DOODLES[i], slot: st.board.length, t: 0, col: ['#fff8ee', '#fff3b0', '#ffc9de', '#bfe3ff'][i % 4] });
    g.s.school.drawn++;
    const p = g.player;
    g.floats.push({ x: p.x, y: p.y - 64, text: ['Nice!', 'Lovely!', 'Wow!', 'Super!'][i % 4] + ' ✏️', color: '#ffe08a', t: 0, dur: 1.2, big: true });
    Sfx.pickup(); Haptics.tap();
  },
  wipe(g) {
    const st = this.st, S = CFG.SCHOOL;
    st.board = [];
    for (let i = 0; i < 6; i++) g.fx.push({ kind: 'sparkle', x0: U.rand(S.BOARD.x0 + 10, S.BOARD.x1 - 10), y0: U.rand(S.BOARD.y0 + 8, S.BOARD.y1 - 8), x1: 0, y1: 0, t: -i * 0.06, dur: 0.5 });
    g.floats.push({ x: g.player.x, y: g.player.y - 64, text: 'All clean! 🧽', color: '#bfe3ff', t: 0, dur: 1.2, big: true });
    Sfx.clean(); Haptics.tap();
  },
  ringBell(g) {
    const st = this.st, S = CFG.SCHOOL;
    st.recess = S.RECESS; st.cheer = 1.2; g.s.school.rang++;
    for (const k of st.kids) g.floats.push({ x: k.x, y: k.y - 44, text: U.pick(['Yay!', 'Recess!', 'Whee!']), color: '#ffe08a', t: 0, dur: 1.3, big: true });
    Sfx.chime(); Haptics.success();
  },
  showAndTell(g) {
    const st = this.st, S = CFG.SCHOOL, p = g.player;
    if (p.carry <= 0) return;
    p.carry--; st.shown = true; st.cheer = 1.5; g.s.school.shown++;
    const tx = (S.TABLE.x0 + S.TABLE.x1) / 2;
    g.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 40, x1: tx, y1: S.TABLE.y0 - 6, t: 0, dur: 0.4 });
    g.floats.push({ x: tx, y: S.TABLE.y0 - 40, text: 'Wow! 🍕', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: tx + U.rand(-24, 24), y0: S.TABLE.y0 + U.rand(-16, 10), x1: 0, y1: 0, t: -0.3 - i * 0.07, dur: 0.6 });
    Sfx.drop(); Haptics.success();
  },
  sitDown(g) {
    const S = CFG.SCHOOL, p = g.player;
    this.st.read = { page: 0, t: 0, flip: 0, done: false };
    p.x = S.SIT.x; p.y = S.SIT.y; p.moving = false; p.facing = -1;
    g.s.school.reads++;
    Sfx.pickup(); Haptics.tap();
  },
  standUp(g) {
    const st = this.st; if (!st.read) return;
    st.read = null; g.player.moving = false; Sfx.drop();
  },
  home(g) {
    if (!this.st) return;
    const S = CFG.SCHOOL, st = this.st;
    st.read = null; st.fade = 0; st.recess = 0; st.cheer = 0; st.xylo = -1;
    st.teacher.x = S.TEACHER_HOME.x; st.teacher.y = S.TEACHER_HOME.y; st.teacher.moving = false;
    st.kids.forEach((k, i) => { const d = S.DESKS[S.KIDS[i].desk]; k.x = d.x; k.y = d.y - 14; k.moving = false; });
  },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, S = CFG.SCHOOL;
    if (this.free(p.x, p.y)) return false;
    p.x = S.EXIT.x; p.y = S.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, S = CFG.SCHOOL;
    st.fade = Math.max(0, st.fade - dt);
    st.star = Math.max(0, st.star - dt);
    if (g.area !== 'school') { if (st.read) st.read = null; if (st.recess > 0) this.home(g); return; }
    const tc = st.teacher;
    st.recess = Math.max(0, st.recess - dt); st.cheer = Math.max(0, st.cheer - dt);
    st.wheel += dt * (3 + Math.sin(g.time * 0.7) * 2); st.hop = Math.max(0, st.hop - dt);
    for (const b of st.board) b.t = Math.min(1, b.t + dt * 2.2);
    if (st.hit) { st.hit.t += dt; if (st.hit.t > 0.4) st.hit = null; }
    if (st.read) {
      // story time: the chef stays on the rug, the teacher comes over and the pages turn by themselves
      const rd = st.read; rd.t += dt;
      p.x = S.SIT.x; p.y = S.SIT.y; p.moving = false; p.facing = -1;
      const arrived = U.moveToward(tc, S.READ_SPOT.x, S.READ_SPOT.y, 90, dt);
      if (arrived) tc.facing = 1;
      if (rd.flip > 0) rd.flip = Math.max(0, rd.flip - dt);
      else if (arrived && rd.t > S.PAGE && rd.page < S.PAGES - 1) { rd.page++; rd.t = 0; rd.flip = 0.35; Sfx.drop(); }
      else if (rd.page === S.PAGES - 1 && !rd.done && rd.t > 0.6) { rd.done = true; Sfx.chime(); }
    } else {
      this.rescue(g);
      U.moveToward(tc, S.TEACHER_HOME.x, S.TEACHER_HOME.y, 90, dt);
      if (!tc.moving) tc.facing = this.atBoard(g) ? -1 : (p.x < tc.x ? -1 : 1);
      // the xylophone along the bottom wall: each bar you step onto plays its note
      const X = S.XYLO, onX = p.y > X.y0 && p.y < X.y1 && p.x >= X.x0 && p.x < X.x0 + X.bar * X.n;
      const bar = onX ? Math.floor((p.x - X.x0) / X.bar) : -1;
      if (bar !== st.xylo) {
        st.xylo = bar;
        if (bar >= 0) { Sfx.tone(S.NOTES[bar], 0.22, 'triangle', 0.05); st.hit = { i: bar, t: 0 }; g.s.school.xylo++; }
      }
    }
    tc.bob = tc.moving ? tc.bob + dt * 14 : 0;
    // the pupils: at their desks they wave when the chef comes near; at recess they run rings on the floor
    st.kids.forEach((k, i) => {
      const d = S.DESKS[S.KIDS[i].desk], hx = d.x, hy = d.y - 14;
      if (st.recess > 0) {
        const e = S.RECESS - st.recess, ramp = Math.min(1, e / 0.6, st.recess / 0.6), a = g.time * (2.6 + i * 0.4) + i * 2.1, rr = 30 + i * 9;
        const ox = S.RING.x + Math.cos(a) * rr, oy = S.RING.y + Math.sin(a) * rr * 0.6;
        const nx = U.lerp(hx, ox, ramp), ny = U.lerp(hy, oy, ramp);
        k.facing = nx < k.x - 0.1 ? -1 : nx > k.x + 0.1 ? 1 : k.facing; k.x = nx; k.y = ny; k.moving = true; k.bob += dt * 16; k.wave = 0;
      } else {
        k.x = hx; k.y = hy; k.moving = false; k.bob = 0;
        const near = U.dist(p.x, p.y, k.x, k.y) < 90 || st.cheer > 0;
        k.wave = near ? Math.min(1, k.wave + dt * 4) : Math.max(0, k.wave - dt * 4);
        k.facing = p.x < k.x - 4 ? -1 : 1;
      }
    });
    if (st.cheer > 0 && Math.random() < dt * 2) { const k = U.pick(st.kids); g.fx.push({ kind: 'sparkle', x0: k.x + U.rand(-12, 12), y0: k.y - 40, x1: 0, y1: 0, t: 0, dur: 0.5 }); }
  },
  pads(g) {
    if (g.area !== 'school') return [];
    return [{ key: 'schoolStar', label: 'Gold Star', ico: '⭐', pos: CFG.SCHOOL.PADS.star, price: 3, sub: 'for your hat' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'schoolStar') return;
    const p = g.player; this.st.star = CFG.SCHOOL.STAR; g.s.school.stars++;
    for (let i = 0; i < 6; i++) g.fx.push({ kind: 'sparkle', x0: p.x + U.rand(-14, 14), y0: p.y - 56 + U.rand(-8, 8), x1: 0, y1: 0, t: -i * 0.06, dur: 0.6 });
    g.floats.push({ x: p.x, y: p.y - 72, text: 'A gold star! ⭐', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, S = CFG.SCHOOL, st = this.st, s = g.s.school;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.busy()) return undefined;
      const d = U.dist(p.x, p.y, S.DOOR_OUT.x, S.DOOR_OUT.y);
      if (d < 70) return { text: 'Go to school! 🏫', target: d < 30 ? null : S.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'school') return undefined;
    if (st.read) return st.read.done ? { text: 'The End! Press the button to stand up', target: null } : { text: 'Story time! 📖', target: null };
    if (st.recess > 0) return { text: 'Recess! Everybody run! 🔔', target: null };
    if (!s.drawn) return { text: 'Draw on the chalkboard! ✏️', target: { x: (S.BOARD.x0 + S.BOARD.x1) / 2, y: S.CHALK_Y - 26 } };
    if (!s.rang) return { text: 'Ring the bell for recess! 🔔', target: S.BELL_SPOT };
    if (!s.reads) return { text: 'Sit on the rug for a story 📖', target: S.SIT };
    if (p.carry > 0 && !st.shown) return { text: 'Show your pizza to the class! 🍕', target: S.SHOW_SPOT };
    if (!s.xylo) return { text: 'Walk along the xylophone 🎵', target: { x: S.XYLO.x0 + 10, y: S.XYLO.y } };
    if (!s.stars && g.s.cash + (g.s.padPaid.schoolStar || 0) >= 3) return { text: 'Get a gold star! ⭐', target: S.PADS.star };
    if (st.star > 0) return { text: 'A gold star on your hat! ⭐', target: null };
    return { text: 'School is fun! 🏫', target: null };
  },

  // ---------- the City outside: crayon ABC over the door and a hopscotch on the sidewalk ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.SCHOOL.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, D = CFG.SCHOOL.DOOR_OUT;
    // paper cut-outs in the windows: a sun and an apple, and big crayon letters
    const lw = (b.x0 + 10 + cx - 22) / 2, rw = (cx + 12 + b.x1 - 10) / 2;   // the two shop windows' centres
    ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌞', lw - 24, gy + 21); ctx.fillText('🍎', rw - 22, gy + 21);
    ctx.font = r.font(13);
    [['A', '#e4572e'], ['B', '#3b7dd8'], ['C', '#41b883']].forEach(([ch, col], i) => { ctx.fillStyle = col; ctx.fillText(ch, lw + 2 + i * 13, gy + 20); });
    [['1', '#8e5bd1'], ['2', '#f2b134'], ['3', '#e4572e']].forEach(([ch, col], i) => { ctx.fillStyle = col; ctx.fillText(ch, rw + 2 + i * 13, gy + 20); });
    // a hopscotch chalked on the sidewalk east of the door and a mat with a star by the door
    ctx.strokeStyle = 'rgba(255,248,238,0.8)'; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(255,248,238,0.85)'; ctx.font = r.font(7);
    for (let i = 0; i < 4; i++) { ctx.strokeRect(D.x + 30 + i * 13, D.y - 8, 13, 13); ctx.fillText(String(i + 1), D.x + 36.5 + i * 13, D.y - 1); }
    ctx.fillStyle = '#ffd166'; ctx.fillRect(D.x - 15, D.y - 6, 30, 10); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
    ctx.fillStyle = '#e4572e'; this.star(ctx, D.x, D.y - 1, 4); ctx.fill();
  },

  // ---------- chalk doodles (used on the board in chalk and in the story book in colour) ----------
  star(ctx, x, y, R) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * 0.45 : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  },
  // kind, centre, half-size; col strokes the outline, fills (optional) colour the shapes {main, extra}
  doodle(ctx, kind, x, y, s, col, fills) {
    const paint = (f) => { if (fills && f) { ctx.fillStyle = f; ctx.fill(); } ctx.stroke(); };
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, s * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const F = fills || {};
    if (kind === 'sun') {
      ctx.beginPath(); ctx.arc(x, y, s * 0.45, 0, Math.PI * 2); paint(F.main);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62); ctx.lineTo(x + Math.cos(a) * s * 0.95, y + Math.sin(a) * s * 0.95); ctx.stroke(); }
      if (fills) { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - s * 0.15, y - s * 0.08, s * 0.05, 0, Math.PI * 2); ctx.arc(x + s * 0.15, y - s * 0.08, s * 0.05, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + s * 0.05, s * 0.2, 0.2, Math.PI - 0.2); ctx.stroke(); }
    } else if (kind === 'pizza') {
      ctx.beginPath(); ctx.arc(x, y, s * 0.9, 0, Math.PI * 2); paint(F.main);
      if (fills) { ctx.fillStyle = F.extra; ctx.beginPath(); ctx.arc(x, y, s * 0.72, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(x - s * 0.9, y); ctx.lineTo(x + s * 0.9, y); ctx.moveTo(x, y - s * 0.9); ctx.lineTo(x, y + s * 0.9); ctx.stroke();
      for (const [dx, dy] of [[-0.4, -0.35], [0.35, -0.4], [-0.35, 0.4], [0.4, 0.35]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, s * 0.14, 0, Math.PI * 2); paint('#c62828'); }
    } else if (kind === 'cat') {
      ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.6, 0, Math.PI * 2); paint(F.main);
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * s * 0.5, y - s * 0.22); ctx.lineTo(x + d * s * 0.55, y - s * 0.85); ctx.lineTo(x + d * s * 0.12, y - s * 0.48); paint(F.main); }
      ctx.beginPath(); ctx.arc(x - s * 0.22, y, s * 0.07, 0, Math.PI * 2); ctx.arc(x + s * 0.22, y, s * 0.07, 0, Math.PI * 2); if (fills) { ctx.fillStyle = '#2b1d14'; ctx.fill(); } else ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - s * 0.06, y + s * 0.2); ctx.lineTo(x + s * 0.06, y + s * 0.2); ctx.lineTo(x, y + s * 0.28); ctx.closePath(); ctx.stroke();
      for (const d of [-1, 1]) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + d * s * 0.3, y + s * 0.2 + k * s * 0.1); ctx.lineTo(x + d * s * 0.95, y + s * 0.15 + k * s * 0.18); ctx.stroke(); }
    } else if (kind === 'house') {
      ctx.beginPath(); ctx.rect(x - s * 0.6, y - s * 0.1, s * 1.2, s * 0.95); paint(F.main);
      ctx.beginPath(); ctx.moveTo(x - s * 0.75, y - s * 0.1); ctx.lineTo(x, y - s * 0.85); ctx.lineTo(x + s * 0.75, y - s * 0.1); ctx.closePath(); paint(F.extra);
      ctx.beginPath(); ctx.rect(x - s * 0.15, y + s * 0.35, s * 0.3, s * 0.5); paint('#8d5a2b');
      ctx.beginPath(); ctx.rect(x + s * 0.2, y + s * 0.05, s * 0.28, s * 0.25); paint('#bfe3ff');
      ctx.beginPath(); ctx.rect(x - s * 0.48, y + s * 0.05, s * 0.28, s * 0.25); paint('#bfe3ff');
    } else if (kind === 'flower') {
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.1); ctx.lineTo(x, y + s * 0.95); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + s * 0.25, y + s * 0.6, s * 0.25, s * 0.12, -0.5, 0, Math.PI * 2); paint('#41b883');
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.4, y - s * 0.25 + Math.sin(a) * s * 0.4, s * 0.28, 0, Math.PI * 2); paint(F.main); }
      ctx.beginPath(); ctx.arc(x, y - s * 0.25, s * 0.22, 0, Math.PI * 2); paint(F.extra);
    } else if (kind === 'star') {
      this.star(ctx, x, y, s * 0.95); paint(F.main);
    } else if (kind === 'heart') {
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.8);
      ctx.bezierCurveTo(x - s * 1.3, y - s * 0.2, x - s * 0.5, y - s * 1.0, x, y - s * 0.3);
      ctx.bezierCurveTo(x + s * 0.5, y - s * 1.0, x + s * 1.3, y - s * 0.2, x, y + s * 0.8); ctx.closePath(); paint(F.main);
    } else if (kind === 'fish') {
      ctx.beginPath(); ctx.moveTo(x + s * 0.5, y); ctx.lineTo(x + s * 0.95, y - s * 0.45); ctx.lineTo(x + s * 0.95, y + s * 0.45); ctx.closePath(); paint(F.extra);
      ctx.beginPath(); ctx.ellipse(x - s * 0.1, y, s * 0.65, s * 0.42, 0, 0, Math.PI * 2); paint(F.main);
      ctx.beginPath(); ctx.arc(x - s * 0.4, y - s * 0.1, s * 0.07, 0, Math.PI * 2); if (fills) { ctx.fillStyle = '#2b1d14'; ctx.fill(); } else ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.3); ctx.quadraticCurveTo(x + s * 0.2, y, x, y + s * 0.3); ctx.stroke();
    }
    ctx.restore();
  },

  // ---------- the interior, static ----------
  paint: { school(r, g) { SchoolExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, S = CFG.SCHOOL, W = S.WORLD, R = S.ROOM, w = S.WALL;
    // outside the room: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, S.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - S.BACK_TOP);
    // a warm wooden floor with planks
    ctx.fillStyle = '#e9c48a'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let y = R.y0; y < R.y1; y += 20) { ctx.fillRect(R.x0, y, R.x1 - R.x0, 1.5); for (let x = R.x0 + ((y / 20) % 2) * 50; x < R.x1; x += 100) ctx.fillRect(x, y, 1.5, 20); }
    // walls: a tall sky-blue back wall, wooden side and bottom walls
    ctx.fillStyle = '#bfe8f7'; ctx.fillRect(R.x0 - w, S.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - S.BACK_TOP);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the alphabet frieze: 26 little cards along the top of the back wall
    const cols = ['#ffd166', '#ff8fab', '#8ef0a0', '#9fd8ff', '#c9a7ff'];
    ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 26; i++) {
      const x = R.x0 - w + 12 + i * 21, y = S.FRIEZE_Y;
      ctx.fillStyle = cols[i % cols.length]; U.roundRect(ctx, x, y, 18, 12, 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.fillText(String.fromCharCode(65 + i) + String.fromCharCode(97 + i), x + 9, y + 6.5);
    }
    // the chalkboard: wooden frame, green board, a chalk tray with chalks and the sponge
    const B = S.BOARD;
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0 - 6, B.y0 - 6, B.x1 - B.x0 + 12, B.y1 - B.y0 + 12, 4); ctx.fill();
    ctx.fillStyle = '#2f6b4f'; ctx.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 30; i++) ctx.fillRect(B.x0 + ((i * 53) % (B.x1 - B.x0 - 10)), B.y0 + ((i * 29) % (B.y1 - B.y0 - 6)), 8, 3);
    ctx.fillStyle = '#a86b36'; ctx.fillRect(B.x0 - 6, B.y1 + 2, B.x1 - B.x0 + 12, 6);
    [['#fff8ee', 0], ['#ffc9de', 1], ['#fff3b0', 2], ['#bfe3ff', 3]].forEach(([c, i]) => { ctx.fillStyle = c; ctx.fillRect(B.x0 + 8 + i * 9, B.y1 + 2, 7, 3); });
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, S.SPONGE_X + 14, B.y1 - 2, 22, 9, 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.SPONGE_X + 17, B.y1 + 1, 3, 2); ctx.fillRect(S.SPONGE_X + 26, B.y1 + 3, 3, 2);
    // the teacher's desk with an apple and the recess bell
    const T = S.TDESK;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 3, T.y0 + 4, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 4); ctx.fill();
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, T.x0 + 2, T.y0 - 4, T.x1 - T.x0 - 4, 14, 4); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(T.x0 + 16, T.y0 - 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#41b883'; ctx.fillRect(T.x0 + 16, T.y0 - 9, 4, 3);   // apple
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(T.x0 + 30, T.y0 - 2, 14, 10); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(T.x0 + 32, T.y0 + k * 3, 10, 1);   // papers
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(S.BELL.x, S.BELL.y - 2, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(S.BELL.x - 9, S.BELL.y - 3, 18, 3);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(S.BELL.x, S.BELL.y - 10, 2.5, 0, Math.PI * 2); ctx.fill();
    // a chalk circle on the floor in front of the bell
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(S.BELL_SPOT.x, S.BELL_SPOT.y, 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    // the cabinet along the back wall right: books in the shelf, the globe and the hamster cage are live
    const C = S.CABINET;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 3, C.y0 + 4, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x0, C.y0 - 4, C.x1 - C.x0, C.y1 - C.y0 + 4, 4); ctx.fill();
    ctx.fillStyle = '#b5773a'; ctx.fillRect(C.x0 + 2, C.y0 - 6, C.x1 - C.x0 - 4, 6);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = cols[(i * 2) % cols.length]; ctx.fillRect(C.x0 + 8 + i * 9, C.y0 + 6, 7, 14); }
    // a window on the back wall between the board and the cabinet
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, 13462, 3040, 40, 46, 3); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.fillRect(13466, 3044, 32, 38);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(13481, 3044, 2, 38); ctx.fillRect(13466, 3062, 32, 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(13474, 3054, 5, 0, Math.PI * 2); ctx.arc(13480, 3052, 6, 0, Math.PI * 2); ctx.arc(13486, 3055, 4, 0, Math.PI * 2); ctx.fill();
    // pupils' drawings pinned on the back wall by the window
    for (let i = 0; i < 2; i++) { ctx.fillStyle = '#fff8ee'; ctx.fillRect(13520 + i * 56, 3040, 40, 34); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(13540 + i * 56, 3040, 2.5, 0, Math.PI * 2); ctx.fill(); }
    this.doodle(ctx, 'house', 13540, 3059, 12, '#2b1d14', { main: '#ffd166', extra: '#e4572e' });
    this.doodle(ctx, 'sun', 13596, 3057, 12, '#2b1d14', { main: '#ffd166' });
    // the show-and-tell table (the pizza on it is live)
    const Tb = S.TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Tb.x0 + 3, Tb.y0 + 4, Tb.x1 - Tb.x0, Tb.y1 - Tb.y0);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, Tb.x0, Tb.y0, Tb.x1 - Tb.x0, Tb.y1 - Tb.y0, 5); ctx.fill();
    ctx.fillStyle = '#9fd8ff'; U.roundRect(ctx, Tb.x0 + 3, Tb.y0 - 4, Tb.x1 - Tb.x0 - 6, 14, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.fillText('SHOW & TELL', (Tb.x0 + Tb.x1) / 2, Tb.y1 - 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(S.SHOW_SPOT.x, S.SHOW_SPOT.y, 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    // the reading rug: a striped round rug with a cushion
    const Rg = S.RUG;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(Rg.x + 3, Rg.y + 4, Rg.rx, Rg.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx, Rg.ry, 0, 0, Math.PI * 2); ctx.clip();
    const rc = ['#e4572e', '#ffd166', '#41b883', '#3b7dd8', '#ff8fab'];
    for (let k = 0; k < 5; k++) { ctx.fillStyle = rc[k]; ctx.beginPath(); ctx.ellipse(Rg.x, Rg.y, Rg.rx * (1 - k * 0.2), Rg.ry * (1 - k * 0.2), 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#ff8fab'; U.roundRect(ctx, S.SIT.x - 14, S.SIT.y - 6, 28, 14, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, S.SIT.x - 10, S.SIT.y - 4, 20, 5, 3); ctx.fill();
    // the xylophone along the bottom wall: rainbow bars, long to short
    const X = S.XYLO, xc = ['#e4572e', '#f2b134', '#ffd166', '#41b883', '#3b7dd8', '#5b5bd6', '#8e5bd1', '#ff8fab'];
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(X.x0 - 4, X.y - 11, X.bar * X.n + 8, 4); ctx.fillRect(X.x0 - 4, X.y + 7, X.bar * X.n + 8, 4);
    for (let i = 0; i < X.n; i++) {
      const h = 30 - i * 2, x = X.x0 + i * X.bar + 2;
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; U.roundRect(ctx, x + 2, X.y - h / 2 + 2, X.bar - 4, h, 3); ctx.fill();
      ctx.fillStyle = xc[i]; U.roundRect(ctx, x, X.y - h / 2, X.bar - 4, h, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 3, X.y - h / 2 + 3, 4, h - 6);
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + X.bar / 2 - 2, X.y - 8, 1.5, 0, Math.PI * 2); ctx.arc(x + X.bar / 2 - 2, X.y + 8, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.fillText('🎵 walk along me', X.x0 + X.bar * X.n / 2, X.y + 20);
    // a toy box and a coat rack in the corners
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, R.x0 + 4, R.y1 - 28, 34, 22, 3); ctx.fill(); ctx.fillStyle = '#c62828'; ctx.fillRect(R.x0 + 2, R.y1 - 30, 38, 6);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(R.x0 + 14, R.y1 - 30, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3b7dd8'; ctx.fillRect(R.x0 + 24, R.y1 - 36, 8, 8);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x1 - 44 + i * 14, R.y0 - 2, 3, 10); ctx.fillStyle = ['#e4572e', '#3b7dd8', '#ffd166'][i]; U.roundRect(ctx, R.x1 - 48 + i * 14, R.y0 + 6, 11, 16, 3); ctx.fill(); }
    // the door in the bottom wall, its mat and the school's name plate below
    const E = S.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8e5bd1'; ctx.fillRect(E.x - 21, E.y - 8, 42, 14); ctx.fillStyle = '#ffd166'; for (let i = 0; i < 3; i++) { this.star(ctx, E.x - 12 + i * 12, E.y - 1, 4); ctx.fill(); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 46, R.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏫 SCHOOL 🏫', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the room's little map the screen would show the dark backdrop: paint the slate around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.SCHOOL.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawBoard(r, g) {
    const ctx = r.ctx, S = CFG.SCHOOL, B = S.BOARD, st = this.st;
    for (const d of st.board) {
      const x = B.x0 + 28 + (d.slot % 4) * 54, y = B.y0 + 16 + Math.floor(d.slot / 4) * 30;
      ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * d.t;
      if (d.t < 1) { ctx.beginPath(); ctx.rect(x - 14, y - 14, 28 * d.t + 2, 28); ctx.clip(); }
      this.doodle(ctx, d.kind, x, y, 11, d.col);
      ctx.restore();
    }
  },
  drawGlobe(r, g) {
    const ctx = r.ctx, G = CFG.SCHOOL.GLOBE, x = G.x, y = G.y - 14, t = g.time;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - 8, y + 10, 16, 3); ctx.fillRect(x - 1.5, y + 2, 3, 9);
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 13, -Math.PI * 0.2, Math.PI * 0.75); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(x - 10, y - 10, 20, 20);
    ctx.fillStyle = '#41b883';
    for (let k = 0; k < 3; k++) { const px = x + ((t * 12 + k * 14) % 42) - 21, py = y - 5 + k * 5; ctx.beginPath(); ctx.ellipse(px, py, 5 + k, 3, 0.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawCage(r, g) {
    const ctx = r.ctx, C = CFG.SCHOOL.CAGE, x = C.x, y = C.y - 2, st = this.st, t = g.time;
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, x - 20, y - 26, 40, 26, 3); ctx.fill();
    ctx.fillStyle = '#f6d9a0'; ctx.fillRect(x - 19, y - 5, 38, 5);
    // the wheel spins, the hamster runs inside it
    const wx = x + 8, wy = y - 13;
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = st.wheel + k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * 9, wy - Math.sin(a) * 9); ctx.lineTo(wx + Math.cos(a) * 9, wy + Math.sin(a) * 9); ctx.stroke(); }
    ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.ellipse(wx, wy + 3 + Math.sin(t * 16) * 0.8, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(wx - 3.5, wy + 2, 0.8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(wx - 5, wy + 3, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, x - 16, y - 10, 10, 5, 2); ctx.fill();   // the water bowl
    ctx.strokeStyle = 'rgba(154,160,168,0.9)'; ctx.lineWidth = 1; for (let k = -18; k <= 18; k += 6) { ctx.beginPath(); ctx.moveTo(x + k, y - 25); ctx.lineTo(x + k, y - 5); ctx.stroke(); }
    ctx.strokeRect(x - 20, y - 26, 40, 26);
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'school') return;
    const ctx = r.ctx, S = CFG.SCHOOL, st = this.st, t = g.time;
    this.drawOutside(r, g);
    this.drawBoard(r, g);
    this.drawGlobe(r, g);
    this.drawCage(r, g);
    // the bell shakes at recess
    if (st.recess > S.RECESS - 0.8) { const k = (S.RECESS - st.recess) / 0.8, dx = Math.sin(t * 40) * 3 * (1 - k); ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(S.BELL.x + dx, S.BELL.y - 2, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(S.BELL.x - 9 + dx, S.BELL.y - 3, 18, 3); ctx.strokeStyle = 'rgba(224,180,76,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S.BELL.x, S.BELL.y - 4, 12 + k * 20, 0, Math.PI * 2); ctx.stroke(); }
    // the xylophone bar just stepped on glows
    if (st.hit) { const X = S.XYLO, x = X.x0 + st.hit.i * X.bar + X.bar / 2 - 2, a = 1 - st.hit.t / 0.4; ctx.fillStyle = `rgba(255,255,255,${(a * 0.6).toFixed(2)})`; ctx.beginPath(); ctx.arc(x, X.y, 10 + (1 - a) * 10, 0, Math.PI * 2); ctx.fill(); }
    // a chalk circle under the chef in front of the board shows where to draw
    if (!st.read) { const atB = this.atBoard(g); ctx.strokeStyle = atB ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.strokeRect(S.BOARD.x0, S.CHALK_Y - 40, S.BOARD.x1 - S.BOARD.x0, 36); ctx.setLineDash([]); }
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, S = CFG.SCHOOL;
    if (st.star > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawHatStar(r, g) });
    if (g.area !== 'school') return;
    S.DESKS.forEach((d, i) => items.push({ y: d.y + 2, draw: () => this.drawDesk(r, g, i) }));
    st.kids.forEach((k, i) => items.push({ y: k.y + (st.recess > 0 ? 0 : -1), draw: () => this.drawKid(r, g, i) }));
    items.push({ y: st.teacher.y, draw: () => this.drawTeacher(r, g) });
    if (st.shown) items.push({ y: S.TABLE.y0 + 2, draw: () => r.drawPizza((S.TABLE.x0 + S.TABLE.x1) / 2, S.TABLE.y0 - 2, 11) });
  },
  drawHatStar(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, t = g.time;
    const x = p.x + f * 6, y = p.y - 50 + bob, pulse = 1 + Math.sin(t * 6) * 0.12;
    ctx.fillStyle = 'rgba(255,224,138,0.45)'; ctx.beginPath(); ctx.arc(x, y, 8 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; this.star(ctx, x, y, 6 * pulse); ctx.fill(); ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
  },
  drawDesk(r, g, i) {
    const ctx = r.ctx, d = CFG.SCHOOL.DESKS[i];
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(d.x - 15, d.y - 4, 34, 14);
    ctx.fillStyle = '#5c6670'; ctx.fillRect(d.x - 14, d.y + 2, 3, 9); ctx.fillRect(d.x + 11, d.y + 2, 3, 9);
    ctx.fillStyle = '#f6d9a0'; U.roundRect(ctx, d.x - 17, d.y - 8, 34, 12, 3); ctx.fill();
    ctx.fillStyle = '#e9c48a'; ctx.fillRect(d.x - 17, d.y + 1, 34, 3);
    ctx.fillStyle = ['#fff8ee', '#ffd166', '#9fd8ff'][i % 3]; ctx.fillRect(d.x - 8, d.y - 6, 12, 8); ctx.fillStyle = '#e4572e'; ctx.fillRect(d.x + 7, d.y - 5, 6, 2);   // a sheet of paper and a crayon
  },
  drawKid(r, g, i) {
    const ctx = r.ctx, K = CFG.SCHOOL.KIDS[i], k = this.st.kids[i], t = g.time;
    ctx.save(); ctx.translate(k.x, k.y); ctx.scale(0.72, 0.72);
    r.drawPerson(0, 0, { shirt: K.shirt, skin: K.skin, hair: K.hair, hairStyle: K.hairStyle, facing: k.facing, moving: k.moving, bob: k.bob, carry: 0, pants: '#3a3f5c', stripes: i === 1 });
    if (k.wave > 0) {
      // a waving arm up above the shoulder
      const f = k.facing, ax = f * 13, ay = -16, hx = f * 20, hy = -34 - Math.abs(Math.sin(t * 8)) * 8 * k.wave;
      ctx.strokeStyle = K.shirt; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(U.lerp(ax, hx, k.wave), U.lerp(ay, hy, k.wave)); ctx.stroke();
      ctx.fillStyle = K.skin; ctx.beginPath(); ctx.arc(U.lerp(ax, hx, k.wave), U.lerp(ay, hy, k.wave), 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
  drawTeacher(r, g) {
    const ctx = r.ctx, tc = this.st.teacher, st = this.st, t = g.time;
    r.drawPerson(tc.x, tc.y, { shirt: '#8e5bd1', skin: '#e0ac69', hair: '#5b3a1a', hairStyle: 2, facing: tc.facing, moving: tc.moving, bob: tc.bob, carry: 0, pants: '#2d3a4a' });
    const bob = tc.moving ? Math.sin(tc.bob) * 2 : 0;
    // round glasses
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tc.x - 4, tc.y - 39 + bob, 3, 0, Math.PI * 2); ctx.moveTo(tc.x + 7, tc.y - 39 + bob); ctx.arc(tc.x + 4, tc.y - 39 + bob, 3, 0, Math.PI * 2); ctx.stroke();
    if (st.read && !tc.moving) {
      // holding the story book open towards the chef
      const bx = tc.x + 18, by = tc.y - 22 + Math.sin(t * 2) * 1;
      ctx.fillStyle = '#e4572e'; U.roundRect(ctx, bx - 13, by - 9, 26, 18, 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(bx - 11, by - 7, 10, 14); ctx.fillRect(bx + 1, by - 7, 10, 14);
      ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) { ctx.fillRect(bx - 9, by - 4 + k * 3, 6, 1); ctx.fillRect(bx + 3, by - 4 + k * 3, 6, 1); }
    } else if (!st.read && this.atBoard(g)) {
      // a piece of chalk held up
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(tc.x - 20, tc.y - 24, 3, 8);
    }
  },
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    if (g.area === 'school' && this.st.read && !this.st.teacher.moving) this.drawStory(r, g, W, H);
    if (this.st.fade <= 0) return;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
  // the story book: a picture card at the top of the screen, pages turn by themselves
  drawStory(r, g, W, H) {
    const ctx = r.ctx, rd = this.st.read, S = CFG.SCHOOL;
    const cw = Math.min(340, W - 32), ch = Math.min(230, H * 0.38), cx = W / 2, cy = (W < 500 ? 132 : 98) + ch / 2;   // below the hint pill (which sits lower on phones)
    let sq = 1, page = rd.page;
    if (rd.flip > 0) { const k = 1 - rd.flip / 0.35; sq = Math.abs(Math.cos(k * Math.PI)); if (k < 0.5) page = rd.page - 1; }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.04, sq), 1); ctx.translate(-cx, -cy);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, cx - cw / 2 + 5, cy - ch / 2 + 7, cw, ch, 14); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 14); ctx.fill();
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, 14, ch, 14); ctx.fill();
    ctx.strokeStyle = '#e8dcc4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 7, cy - ch / 2 + 12); ctx.lineTo(cx + 7, cy + ch / 2 - 12); ctx.stroke();
    const titles = ['Once upon a time…', 'A hungry little cat', '…smelled a pizza!', 'Yum yum yum! 💛', 'The End ✨'];
    const s = Math.min(ch * 0.2, 40), lx = cx - cw / 4 + 7, rx = cx + cw / 4 + 7, py = cy - 8;
    const pics = [
      () => { this.doodle(ctx, 'sun', lx, py - s * 0.3, s * 0.8, '#2b1d14', { main: '#ffd166' }); this.doodle(ctx, 'house', rx, py, s, '#2b1d14', { main: '#ffd166', extra: '#e4572e' }); },
      () => { this.doodle(ctx, 'cat', lx, py, s * 1.1, '#2b1d14', { main: '#f2b134' }); this.doodle(ctx, 'heart', rx, py, s * 0.7, '#2b1d14', { main: '#ff8fab' }); },
      () => { this.doodle(ctx, 'cat', lx, py, s, '#2b1d14', { main: '#f2b134' }); this.doodle(ctx, 'pizza', rx, py, s, '#2b1d14', { main: '#e0b44c', extra: '#e4572e' }); },
      () => { this.doodle(ctx, 'pizza', lx, py, s * 0.9, '#2b1d14', { main: '#e0b44c', extra: '#e4572e' }); this.doodle(ctx, 'star', rx, py, s, '#2b1d14', { main: '#ffd166' }); },
      () => { this.doodle(ctx, 'flower', lx, py, s, '#2b1d14', { main: '#ff8fab', extra: '#ffd166' }); this.doodle(ctx, 'fish', rx, py, s, '#2b1d14', { main: '#3b7dd8', extra: '#9fd8ff' }); },
    ];
    pics[page]();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(Math.min(18, cw * 0.055)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(titles[page], cx + 7, cy + ch / 2 - 30);
    ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(11); ctx.fillText(`${page + 1} / ${S.PAGES}`, cx + cw / 2 - 26, cy + ch / 2 - 14);
    ctx.restore();
  },
};
Game.ext.unshift(SchoolExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(SchoolExt);
