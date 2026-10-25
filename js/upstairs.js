'use strict';
// The pizzeria's roof, seen from outside, and the second floor with the owner's bedroom.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// A. THE ROOF. Whenever the chef is outside the pizzeria the whole building is covered by its flat roof (tar paper,
//    parapet, AC units, skylight, chimney, water tank, the big painted sign, pigeons, a pizza weather vane), drawn in
//    the `overlay` hook so it hides everything inside, like every other building in town is seen from above. It
//    fades in/out over ~0.35 s as you walk through the door. The still parts are cached in one offscreen canvas;
//    the fans, smoke, pigeons, vane and skylight glow move each frame.
// B. UPSTAIRS. A staircase in the office corner leads to its own little map (`CFG.AREAS.upstairs`): the owner's
//    bedroom. Beside the bed you can take a nap: the chef hops in, the screen goes a soft night blue with drifting
//    z's and dream pizzas for a few seconds, then a rooster wakes you to a fresh morning (the day/night clock resets).
//    Once bought, the bean bag is a seat: flop into it (the bag squashes, the chef sinks in) and get up again.
// C. DRAWINGS. The drawing pad (a DOM overlay) paints into a named "slot": 'bedroom' (the desk upstairs; hung on the
//    bedroom wall and copied in the dining room) and any slot another file adds with `addArtSlot` (the office's
//    hiring desk in js/hiredesk.js). Each slot saves its own small PNG and hangs it in its own frame.
CFG.UPSTAIRS = {
  ROOF: {
    fade: 0.35, pad: 8,                                   // seconds to fade; how far the roof overhangs the walls
    skylight: { x0: 110, y0: 196, x1: 300, y1: 326 },     // over the kitchen
    chimney: { x: 540, y: 172 },
    tank: { x: 856, y: 236 },
    ac: [{ x: 430, y: 186 }, { x: 650, y: 566 }, { x: 180, y: 566 }],
    vane: { x: 724, y: 178 },
    dish: { x: 912, y: 560 },
    sign: { x: 540, y: 446, pizza: { x: 150, y: 446 } },
    pigeons: [{ x: 380, y: 300 }, { x: 760, y: 420 }],
  },
  // The office stairs: a flight along the bottom wall climbing east into the corner; stand at its foot to go up.
  STAIRS: { block: { x: 296, y: 596, w: 76, h: 44 }, landing: { x: 266, y: 620 }, reach: 36, sign: { x: 334, y: 578 } },
  WORLD: { x0: 6400, y0: 1500, x1: 7000, y1: 1900 },      // free space east of the cabin's map
  room: { x0: 6460, y0: 1560, x1: 6940, y1: 1840 }, wall: 26,
  bed: { x0: 6484, y0: 1572, x1: 6592, y1: 1710 },
  sleepSpot: { x: 6626, y: 1664 }, sleepReach: 40,       // stand here, beside the bed, to nap
  napSpot: { x: 6538, y: 1640 },                          // where the chef lies (feet); the head lands on the pillow
  table: { x0: 6604, y0: 1574, x1: 6640, y1: 1608 },      // bedside table: lamp and alarm clock
  photo: { x: 6668, y: 1546 },                            // framed photo on the wall: the chef and the dog
  wardrobe: { x0: 6688, y0: 1562, x1: 6768, y1: 1612 },
  hook: { x: 6796, y: 1548 },                             // the chef hat's hook on the wall
  window: { x0: 6822, y0: 1504, x1: 6922, y1: 1558 },     // looks out over Main Street
  desk: { x0: 6894, y0: 1634, x1: 6936, y1: 1724 }, chair: { x: 6872, y: 1680 },
  rug: { x: 6700, y: 1716, rx: 86, ry: 46 },
  shelf: { x0: 6464, y0: 1744, x1: 6502, y1: 1836 },
  plant: { x: 6536, y: 1822 },
  opening: { x0: 6866, y0: 1766, x1: 6936, y1: 1838 },    // the stair hole in the floor, railed on two sides
  top: { x: 6836, y: 1806 }, topReach: 34,                // the top of the stairs: arrive here, go down from here
  nap: { hop: 0.45, sleep: 3.0, wake: 0.5 },              // seconds
  catalog: { x: 6622, y: 1602, reach: 36 },               // the catalog lies on the bedside table; stand just below it
  chairReach: 36,                                         // stand by the desk chair to draw
  beanbag: { reach: 46, seat: { dx: 0, dy: 10 }, hop: 0.35 }, // stand beside the (owned) bean bag to flop into it; the chef's feet land on the seat
  art: { room: { x: 6600, y: 1546, w: 44, h: 33 }, shop: { x: 922, y: 132, w: 48, h: 36 }, size: [160, 120] },   // where the drawing hangs
  slide: { entry: { x: 6600, y: 1712 }, top: { x: 6566, y: 1702 }, bottom: { x: 6566, y: 1804 }, reach: 14, dur: 1.1 },
  // bedroom upgrades, bought from the catalog: `spot` is where the item goes, `block` an obstacle rect once owned,
  // `view` how the catalog page shows it (scale, and the item's visual centre relative to its spot)
  items: [
    { key: 'poster', label: 'Pizza Chef Poster', ico: '🖼️', price: 50, spot: { x: 6728, y: 1547 }, view: { s: 3.4, dy: 0 } },
    { key: 'lava', label: 'Lava Lamp', ico: '🔮', price: 60, spot: { x: 6752, y: 1590 }, view: { s: 3.6, dy: -10 } },
    { key: 'beanbag', label: 'Bean Bag', ico: '🛋️', price: 70, spot: { x: 6790, y: 1680 }, view: { s: 3.2, dy: 0 }, block: [6766, 1664, 48, 32] },
    { key: 'stars', label: 'Star Projector', ico: '🌟', price: 80, spot: { x: 6706, y: 1590 }, view: { s: 3.4, dy: -6 } },
    { key: 'chest', label: 'Toy Chest', ico: '🧸', price: 90, spot: { x: 6630, y: 1820 }, view: { s: 2.8, dy: -4 }, block: [6600, 1804, 60, 34] },
    { key: 'hamster', label: 'Hamster Wheel', ico: '🐹', price: 100, spot: { x: 6806, y: 1802 }, view: { s: 3.4, dy: -4 }, block: [6786, 1784, 40, 34] },
    { key: 'horse', label: 'Rocking Horse', ico: '🐴', price: 110, spot: { x: 6690, y: 1806 }, view: { s: 3.4, dy: -8 }, block: [6672, 1790, 36, 30] },
    { key: 'fish', label: 'Fish Tank', ico: '🐟', price: 120, spot: { x: 6916, y: 1592 }, view: { s: 3.4, dy: 0 }, block: [6896, 1574, 40, 36] },
    { key: 'drums', label: 'Drum Kit', ico: '🥁', price: 150, spot: { x: 6745, y: 1802 }, view: { s: 2.8, dy: -6 }, block: [6716, 1782, 58, 40] },
    { key: 'slide', label: 'Bed Slide', ico: '🛝', price: 200, spot: { x: 6566, y: 1752 }, view: { s: 2.2, dy: 0 }, block: [6552, 1716, 28, 72] },
    { key: 'telescope', label: 'Telescope', ico: '🔭', price: 250, spot: { x: 6872, y: 1594 }, view: { s: 3.2, dy: -8 }, block: [6858, 1580, 28, 24] },
    { key: 'racecar', label: 'Race-Car Bed', ico: '🏎️', price: 300, spot: { x: 6538, y: 1641 }, view: { s: 1.5, dy: 0 } },
  ],
};
CFG.AREAS.upstairs = { WORLD: CFG.UPSTAIRS.WORLD };

const UpstairsExt = {
  name: 'upstairs',
  st: null, roofBg: null,

  // ---------- game hooks ----------
  defaults: { upstairs: { seen: false, owned: {}, drawing: null } },
  home(g) { if (this.st) { this.st.nap = null; this.st.slide = null; this.st.sit = null; this.st.fade = 0; this.st.roofA = 1; this.closeCatalog(g); } if (this.st && this.st.draw.on) this.closePad(g); },
  build(g) {
    if (!g.s.upstairs) g.s.upstairs = { seen: false, owned: {}, drawing: null };
    if (!g.s.upstairs.owned) g.s.upstairs.owned = {};
    const R = CFG.UPSTAIRS.ROOF;
    this.img = null; this.arts = {};
    this.st = {
      roofA: this.insideShop(g) ? 0 : 1, fade: 0, nap: null, slide: null, slideArmed: true,
      smoke: [], smokeT: 1, puffing: 0, rest: 3,
      pigeons: R.pigeons.map((p, i) => ({ x: p.x, y: p.y, tx: p.x, ty: p.y, wait: 1 + i, facing: 1, step: 0 })),
      cat: { on: false, page: 0, flip: null, ready: true, hold: null, bought: 0, nope: 0 },   // the decoration catalog
      draw: { on: false, hold: null, slot: null },                                           // the drawing pad (and which picture it paints)
      sit: null,                                                                             // flopped on the bean bag: { t, from, landed }
      notes: [], noteT: 0, wheel: 0, wheelV: 0, rock: 0,
    };
  },
  owned(g, key) { return !!(g.s.upstairs && g.s.upstairs.owned && g.s.upstairs.owned[key]); },
  // Inside the pizzeria, or in the door gap: the roof is off.
  insideShop(g) {
    if (typeof RooftopsExt !== 'undefined' && RooftopsExt.aboveRoofs(g)) return false;   // on the roof, or flying over it: the roof stays on
    const p = g.player, B = CFG.BUILDING, D = CFG.DOOR;
    return g.insideBuilding(p.x, p.y) || (p.x > B.x1 - 30 && p.x < B.x1 + 30 && p.y > D.y0 - 8 && p.y < D.y1 + 8);
  },
  obstacles(g) {
    if (g.area === 'upstairs') return this.roomBlocks();
    if (g.area === 'town') return [CFG.UPSTAIRS.STAIRS.block];
    return [];
  },
  roomBlocks() {
    const C = CFG.UPSTAIRS, R = C.room, w = C.wall, o = [];
    const rect = (q) => ({ x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 });
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push(rect(C.bed), rect(C.table), rect(C.wardrobe), rect(C.desk), rect(C.shelf), rect(C.opening));
    o.push({ x: C.chair.x - 10, y: C.chair.y - 10, w: 20, h: 20 });
    o.push({ x: C.plant.x - 13, y: C.plant.y - 12, w: 26, h: 20 });
    const g = Game;
    for (const it of C.items) if (it.block && this.owned(g, it.key)) o.push({ x: it.block[0], y: it.block[1], w: it.block[2], h: it.block[3] });
    return o;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, C = CFG.UPSTAIRS;
    st.fade = Math.max(0, st.fade - dt);
    if (g.area === 'upstairs') { this.updateRoom(g, dt); return; }
    // drawing somewhere else (the office's hiring desk): the chef stays on the chair while the pad is open
    if (st.draw.on && st.draw.hold) { const p = g.player; p.x = st.draw.hold.x; p.y = st.draw.hold.y; p.moving = false; }
    if (g.area !== 'town') return;
    // the roof: fade toward "on" while the chef is outside the shop
    const target = this.insideShop(g) ? 0 : 1;
    if (target > st.roofA) st.roofA = Math.min(1, st.roofA + dt / C.ROOF.fade);
    else if (target < st.roofA) st.roofA = Math.max(0, st.roofA - dt / C.ROOF.fade);
    if (st.roofA <= 0) return;
    // the chimney puffs for a few seconds, then rests
    if (st.puffing > 0) {
      st.puffing -= dt; st.smokeT -= dt;
      if (st.smokeT <= 0) { st.smokeT = U.rand(0.35, 0.6); st.smoke.push({ x: C.ROOF.chimney.x + U.rand(-3, 3), y: C.ROOF.chimney.y - 6, t: 0, dur: U.rand(2, 2.8), dx: U.rand(4, 12), r: U.rand(4, 7) }); }
      if (st.puffing <= 0) st.rest = U.rand(5, 9);
    } else { st.rest -= dt; if (st.rest <= 0) st.puffing = U.rand(3, 5); }
    for (const s of st.smoke) { s.t += dt; s.y -= 16 * dt; s.x += s.dx * dt; }
    st.smoke = st.smoke.filter((s) => s.t < s.dur);
    // the pigeons wander about the roof and peck
    const B = CFG.BUILDING;
    for (const q of st.pigeons) {
      if (q.wait > 0) { q.wait -= dt; q.step += dt * 6; continue; }
      q.step += dt * 14;
      if (U.moveToward(q, q.tx, q.ty, 26, dt)) {
        q.wait = U.rand(1.5, 4);
        q.tx = U.rand(B.x0 + 60, B.x1 - 60); q.ty = U.rand(B.y0 + 60, B.y1 - 60);
        q.facing = q.tx < q.x ? -1 : 1;
      }
    }
  },
  action(g) {
    const p = g.player, C = CFG.UPSTAIRS;
    if (g.driving || g.onTrain || g.ride || g.travel || g.fishing) return null;
    if (g.area === 'town') {
      if (U.dist(p.x, p.y, C.STAIRS.landing.x, C.STAIRS.landing.y) < C.STAIRS.reach) return { label: '🪜 Go upstairs', run: (gg) => this.goUp(gg) };
      return null;
    }
    if (g.area !== 'upstairs') return null;
    const st = this.st;
    if (st.nap || st.slide || st.draw.on) return null;                   // fast asleep, whooshing, or busy drawing
    if (st.cat.on) return this.catalogAction(g);
    if (st.sit) return { label: '🚶 Get up', run: (gg) => this.getUp(gg) };
    if (U.dist(p.x, p.y, C.top.x, C.top.y) < C.topReach) return { label: '🪜 Go downstairs', run: (gg) => this.goDown(gg) };
    if (U.dist(p.x, p.y, C.catalog.x, C.catalog.y) < C.catalog.reach) return { label: '📖 Open the catalog', run: (gg) => this.openCatalog(gg) };
    const nearBag = this.nearBeanbag(g), dChair = U.dist(p.x, p.y, C.chair.x, C.chair.y);
    if (nearBag && !(dChair < C.chairReach && dChair < nearBag)) return { label: '🛋️ Flop on the bean bag', run: (gg) => this.flop(gg) };
    if (dChair < C.chairReach) return { label: '✏️ Sit and draw', run: (gg) => this.openPad(gg, 'bedroom') };
    if (U.dist(p.x, p.y, C.sleepSpot.x, C.sleepSpot.y) < C.sleepReach) return { label: '😴 Sleep', run: (gg) => this.startNap(gg) };
    return null;
  },
  hint(g) {
    const p = g.player, C = CFG.UPSTAIRS;
    if (g.area === 'upstairs') {
      const st = this.st;
      if (st.nap || st.slide || st.draw.on || st.cat.on || st.sit) return null;   // the scenes and overlays explain themselves
      if (U.dist(p.x, p.y, C.catalog.x, C.catalog.y) < C.catalog.reach) return { text: 'Open the catalog to decorate 📖', target: null };
      const nearBag = this.nearBeanbag(g), dChair = U.dist(p.x, p.y, C.chair.x, C.chair.y);
      if (nearBag && !(dChair < C.chairReach && dChair < nearBag)) return { text: 'Flop on the bean bag! 🛋️', target: null };
      if (U.dist(p.x, p.y, C.chair.x, C.chair.y) < C.chairReach) return { text: 'Sit at the desk and draw ✏️', target: null };
      if (U.dist(p.x, p.y, C.sleepSpot.x, C.sleepSpot.y) < C.sleepReach) return { text: 'Hop into bed for a nap 😴', target: null };
      return null;
    }
    if (g.area !== 'town' || g.driving || !g.insideBuilding(p.x, p.y)) return undefined;
    const L = C.STAIRS.landing, d = U.dist(p.x, p.y, L.x, L.y);
    if (d < 110) return { text: 'Go upstairs to your room! 🛏️', target: d < C.STAIRS.reach ? null : L };
    return undefined;
  },
  goUp(g) {
    const C = CFG.UPSTAIRS, p = g.player;
    g.area = 'upstairs'; p.x = C.top.x; p.y = C.top.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.ROOF.fade; this.st.nap = null; this.st.slide = null; this.st.slideArmed = false; Sfx.ding(); Haptics.tap();
    if (!g.s.upstairs.seen) { g.s.upstairs.seen = true; g.toast('🛏️ Your very own room!', true); }
  },
  goDown(g) {
    const C = CFG.UPSTAIRS, p = g.player;
    g.area = 'town'; p.x = C.STAIRS.landing.x; p.y = C.STAIRS.landing.y; p.moving = false; p.facing = -1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = C.ROOF.fade; this.st.roofA = 0; Sfx.drop();
  },
  // Is this point somewhere the chef can stand: inside the room and not inside a wall or a piece of furniture?
  roomFree(x, y) {
    const R = CFG.UPSTAIRS.room, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.roomBlocks()) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  // A save (or a push) that left the chef outside the walls or inside furniture goes back to the top of the stairs.
  rescue(g) {
    const p = g.player, C = CFG.UPSTAIRS;
    if (this.roomFree(p.x, p.y)) return false;
    const B = C.bed;
    if (p.x > B.x0 && p.x < B.x1 && p.y > B.y0 && p.y < B.y1) { p.x = C.sleepSpot.x; p.y = C.sleepSpot.y; p.moving = false; return true; }   // a save made mid-nap: just get up
    const bb = this.beanbagBlock(g);
    if (bb && p.x > bb.x && p.x < bb.x + bb.w && p.y > bb.y && p.y < bb.y + bb.h) { const q = this.standSpot(g, null); if (q) { p.x = q.x; p.y = q.y; p.moving = false; return true; } }   // a save made on the bean bag: just get up
    p.x = C.top.x; p.y = C.top.y; p.moving = false;
    if (this.st.cat.hold) this.st.cat.hold = { x: p.x, y: p.y };
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  // ---------- the nap ----------
  startNap(g) {
    const p = g.player;
    this.st.nap = { phase: 'hop', t: 0, from: { x: p.x, y: p.y } };
    p.moving = false; p.facing = 1; Sfx.ding(); Haptics.tap();
  },
  napAlpha() {
    const n = this.st && this.st.nap, N = CFG.UPSTAIRS.nap;
    if (!n || n.phase !== 'sleep') return 0;
    return U.clamp(Math.min(n.t / 0.5, (N.sleep - n.t) / 0.6), 0, 1);
  },
  updateRoom(g, dt) {
    const st = this.st, p = g.player, C = CFG.UPSTAIRS, N = C.nap, n = st.nap;
    this.updateToys(g, dt);
    // reading the catalog: stay put (the ◀ ▶ buttons turn the pages and the ✕ closes it)
    if (st.cat.on) {
      const c = st.cat; p.x = c.hold.x; p.y = c.hold.y; p.moving = false;
      c.bought = Math.max(0, c.bought - dt); c.nope = Math.max(0, c.nope - dt);
      if (c.flip) { c.flip.t += dt; if (c.flip.t >= c.flip.dur) c.flip = null; }
      return;
    }
    // drawing at the desk: the chef stays on the chair's side while the pad is open
    if (st.draw.on) { p.x = st.draw.hold.x; p.y = st.draw.hold.y; p.moving = false; return; }
    // flopped on the bean bag: a little hop in, a squashy landing, then comfy until "Get up"
    if (st.sit) { this.updateSit(g, dt); return; }
    // the bed slide: step onto the little platform at the foot of the bed and whoosh down
    if (st.slide) {
      const S = C.slide, r = st.slide; r.t += dt; p.moving = false; p.facing = -1;
      const k = Math.min(1, r.t / S.dur);
      if (k < 0.25) { const q = k / 0.25; p.x = U.lerp(S.entry.x, S.top.x, q); p.y = U.lerp(S.entry.y, S.top.y, q) - Math.sin(q * Math.PI) * 18; }
      else { const q = (k - 0.25) / 0.75; p.x = S.top.x + Math.sin(q * Math.PI * 3) * 2; p.y = U.lerp(S.top.y, S.bottom.y, q * q); }
      if (k >= 1) { st.slide = null; p.x = S.bottom.x; p.y = S.bottom.y; Sfx.drop(); }
      return;
    }
    if (!n) {
      this.rescue(g);
      if (this.owned(g, 'slide')) {
        const S = C.slide, near = U.dist(p.x, p.y, S.entry.x, S.entry.y) < S.reach;
        if (near && st.slideArmed) { st.slide = { t: 0 }; st.slideArmed = false; Sfx.whistle(); Haptics.tap(); g.floats.push({ x: S.top.x, y: S.top.y - 40, text: 'Wheee!', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
        else if (!near && U.dist(p.x, p.y, S.entry.x, S.entry.y) > S.reach + 12) st.slideArmed = true;
      }
      return;
    }
    // asleep: the chef is frozen; the phases carry them into bed, through the night and back out
    n.t += dt; p.moving = false; p.facing = 1;
    const arc = (a, b, k) => { p.x = U.lerp(a.x, b.x, k); p.y = U.lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 26; };
    if (n.phase === 'hop') {
      const k = Math.min(1, n.t / N.hop); arc(n.from, C.napSpot, k);
      if (k >= 1) { n.phase = 'sleep'; n.t = 0; Sfx.drop(); }
    } else if (n.phase === 'sleep') {
      p.x = C.napSpot.x; p.y = C.napSpot.y;
      if (n.t >= N.sleep) {
        n.phase = 'wake'; n.t = 0;
        if (typeof AtmosphereExt !== 'undefined' && AtmosphereExt.force) AtmosphereExt.force({ phase: 'day' });
        g.s.stats.naps = (g.s.stats.naps || 0) + 1;
        g.floats.push({ x: p.x + 30, y: p.y - 70, text: '🐓 Good morning!', color: '#ffe08a', t: 0, dur: 1.8, big: true });
        g.floats.push({ x: p.x + 30, y: p.y - 40, text: '😊 Well rested!', color: '#ffe08a', t: 0.5, dur: 2.2, big: true });
        Sfx.ding(); Haptics.success();
      }
    } else {
      const k = Math.min(1, n.t / N.wake); arc(C.napSpot, C.sleepSpot, k);
      if (k >= 1) { st.nap = null; p.x = C.sleepSpot.x; p.y = C.sleepSpot.y; }
    }
  },

  // ---------- the bean bag: once bought, a squashy seat ----------
  beanbagItem() { return CFG.UPSTAIRS.items.find((it) => it.key === 'beanbag'); },
  beanbagBlock(g) {
    const it = this.beanbagItem();
    if (!it || !this.owned(g, 'beanbag')) return null;
    return { x: it.block[0], y: it.block[1], w: it.block[2], h: it.block[3] };
  },
  // How far the chef is from the bean bag when they can flop into it from here; 0 when not.
  nearBeanbag(g) {
    if (g.area !== 'upstairs' || !this.owned(g, 'beanbag')) return 0;
    const s = this.beanbagItem().spot, p = g.player, d = U.dist(p.x, p.y, s.x, s.y);
    return d < CFG.UPSTAIRS.beanbag.reach ? Math.max(d, 0.01) : 0;
  },
  seat() { const s = this.beanbagItem().spot, q = CFG.UPSTAIRS.beanbag.seat; return { x: s.x + q.dx, y: s.y + q.dy }; },
  // A spot where the chef fits, clear of the walls and every piece of furniture.
  clearSpot(g, x, y) {
    const R = CFG.UPSTAIRS.room, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    return !this.roomBlocks().some((o) => g.hitRect(x, y, r, o));
  },
  // Where to stand up from the bean bag: back where the chef came from, else the first free side of the bag.
  standSpot(g, from) {
    const b = this.beanbagBlock(g), s = this.beanbagItem().spot, cands = [];
    if (from) cands.push([from.x, from.y]);
    if (b) {
      const below = b.y + b.h + 14, above = b.y - 14, left = b.x - 14, right = b.x + b.w + 14;
      cands.push([s.x, below], [left, s.y], [right, s.y], [s.x, above], [left, below], [right, below], [left, above], [right, above]);
    }
    for (const [x, y] of cands) if (this.clearSpot(g, x, y)) return { x, y };
    return null;
  },
  flop(g) {
    const p = g.player;
    this.st.sit = { t: 0, from: { x: p.x, y: p.y }, landed: false };
    p.moving = false; Haptics.tap();
  },
  updateSit(g, dt) {
    const s = this.st.sit, p = g.player, seat = this.seat(), hop = CFG.UPSTAIRS.beanbag.hop;
    s.t += dt; p.moving = false;
    if (!s.landed) {
      const k = Math.min(1, s.t / hop);
      p.x = U.lerp(s.from.x, seat.x, k); p.y = U.lerp(s.from.y, seat.y, k) - Math.sin(k * Math.PI) * 22;
      if (Math.abs(seat.x - s.from.x) > 4) p.facing = seat.x > s.from.x ? 1 : -1;
      if (k >= 1) {
        s.landed = true; s.t = 0; p.x = seat.x; p.y = seat.y;
        Sfx.drop(); Haptics.tap();
        g.floats.push({ x: seat.x, y: seat.y - 70, text: 'Ahh, comfy! 😌', color: '#ffe08a', t: 0, dur: 1.8, big: true });
      }
      return;
    }
    p.x = seat.x; p.y = seat.y;
  },
  getUp(g) {
    const s = this.st.sit, p = g.player, q = this.standSpot(g, s && s.from);
    this.st.sit = null;
    if (q) { p.x = q.x; p.y = q.y; } else this.rescue(g);
    p.moving = false; p.hasMoved = true; Haptics.tap();
  },
  // How squashed the bag is: 0 empty, about 1 with the chef in it (a wobble on landing, then a slow breath).
  squash(g) {
    const s = this.st && this.st.sit;
    if (!s || !s.landed || g.area !== 'upstairs') return 0;
    return 1 + 0.3 * Math.sin(s.t * 16) * Math.exp(-s.t * 5) + 0.04 * Math.sin(g.time * 2.4);
  },
  drawBeanbag(ctx, x, y, sq) {
    const rx = 26 + 6 * sq, ry = 18 - 5 * sq, cy = y + 3 * sq;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 3, cy + 4, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a9be8'; ctx.beginPath(); ctx.ellipse(x - 2, cy - 4 + 2 * sq, 16 + 3 * sq, Math.max(3, 10 - 4 * sq), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x, cy + 1, 9 + 5 * sq, 5 + sq, 0, 0, Math.PI * 2); ctx.fill();
  },
  // The front of the squashed bag, drawn over the sitting chef: it hides the legs, puffs up at the sides, and the
  // chef's feet stick out over the edge.
  drawBeanbagFront(ctx, g) {
    const s = this.beanbagItem().spot, sq = this.squash(g), x = s.x, rx = 26 + 6 * sq, ry = 18 - 5 * sq, cy = s.y + 3 * sq;
    ctx.fillStyle = '#3b7dd8';
    ctx.beginPath();
    ctx.moveTo(x + rx, cy);
    ctx.quadraticCurveTo(x + rx - 2, cy - 13, x + 15, cy - 13);
    ctx.quadraticCurveTo(x + 9, cy - 6, x, cy - 6);
    ctx.quadraticCurveTo(x - 9, cy - 6, x - 15, cy - 13);
    ctx.quadraticCurveTo(x - rx + 2, cy - 13, x - rx, cy);
    ctx.ellipse(x, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a9be8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - rx + 5, cy - 4); ctx.quadraticCurveTo(x - rx + 6, cy - 11, x - 15, cy - 11); ctx.moveTo(x + rx - 5, cy - 4); ctx.quadraticCurveTo(x + rx - 6, cy - 11, x + 15, cy - 11); ctx.stroke();
    // legs out in front, and the shoes
    ctx.fillStyle = '#2d3a4a'; for (const d of [-7, 7]) { U.roundRect(ctx, x + d - 3.5, cy - 5, 7, ry + 1, 3); ctx.fill(); }
    ctx.fillStyle = '#2b1d14'; for (const d of [-7, 7]) { ctx.beginPath(); ctx.ellipse(x + d, cy + ry - 3, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  },

  // ======================= render hooks =======================
  // The roof, over everything inside the building (world space, after entities, effects and floats).
  overlay(r, g) {
    if (!this.st || g.area !== 'town' || this.st.roofA <= 0) return;
    const ctx = r.ctx, st = this.st, R = CFG.UPSTAIRS.ROOF, B = CFG.BUILDING, bg = this.roofCanvas(r), t = g.time;
    ctx.save();
    ctx.globalAlpha = st.roofA;
    // the building's shadow on the ground, then the still picture
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(bg.x0 + 10, bg.y0 + 12, bg.w, bg.h);
    ctx.drawImage(bg.canvas, bg.x0, bg.y0, bg.w, bg.h);
    // skylight glow: warm from the ovens, brighter at dusk
    const dusk = typeof AtmosphereExt !== 'undefined' && AtmosphereExt.state ? AtmosphereExt.state().dusk : 0;
    const S = R.skylight, sx = (S.x0 + S.x1) / 2, sy = (S.y0 + S.y1) / 2, pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 150);
    glow.addColorStop(0, `rgba(255,214,120,${(0.22 + 0.1 * pulse + 0.35 * dusk).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = glow; ctx.fillRect(sx - 150, sy - 150, 300, 300);
    ctx.fillStyle = `rgba(255,236,170,${(0.12 + 0.12 * pulse + 0.3 * dusk).toFixed(3)})`; ctx.fillRect(S.x0 + 4, S.y0 + 4, S.x1 - S.x0 - 8, S.y1 - S.y0 - 8);
    // AC fans, slowly turning
    R.ac.forEach((a, i) => {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(t * (2.2 + i * 0.5) + i);
      ctx.fillStyle = '#d7dbe0';
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(10, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    // chimney smoke
    for (const s of st.smoke) {
      const k = s.t / s.dur;
      ctx.fillStyle = `rgba(235,235,240,${(0.55 * (1 - k)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r + k * 12, 0, Math.PI * 2); ctx.fill();
    }
    // the pizza-slice weather vane, swinging in the breeze
    const V = R.vane, ang = -0.4 + Math.sin(t * 0.5) * 0.5 + Math.sin(t * 1.7) * 0.12;
    ctx.save(); ctx.translate(V.x, V.y); ctx.rotate(ang);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(-26, -1.5, 52, 3);
    ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(8, -10); ctx.lineTo(8, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(8, 10); ctx.lineTo(3, 10); ctx.lineTo(3, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(16, -2, 2, 0, Math.PI * 2); ctx.arc(21, 2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-18, -7); ctx.lineTo(-18, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(V.x, V.y, 3.5, 0, Math.PI * 2); ctx.fill();
    // pigeons
    for (const q of st.pigeons) this.drawPigeon(ctx, q);
    // the roof is outdoors: it takes the dusk tint the shop interiors are spared
    if (dusk > 0) { const A = CFG.ATMOSPHERE, c = A.DUSK_COLOR; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(A.DUSK_ALPHA * dusk).toFixed(3)})`; ctx.fillRect(bg.x0, bg.y0, bg.w, bg.h); }
    ctx.restore();
    // the chef walking along the south wall is in front of the building: draw them again, over the roof
    const p = g.player;
    if (!g.driving && !g.onTrain && !g.insideBuilding(p.x, p.y) && p.y > B.y1 - 4 && p.y < B.y1 + 72 && p.x > B.x0 - 40 && p.x < B.x1 + 40) r.drawPlayer(g);
  },
  drawPigeon(ctx, q) {
    const walking = q.wait <= 0, bob = walking ? Math.sin(q.step) * 1.2 : 0, peck = walking ? 0 : Math.max(0, Math.sin(q.step)) * 3, f = q.facing;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 4, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b8f99'; ctx.beginPath(); ctx.ellipse(q.x, q.y - 4 + bob, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6f7380'; ctx.beginPath(); ctx.ellipse(q.x - f * 3, q.y - 5 + bob, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();   // wing
    ctx.fillStyle = '#5a6fb0'; ctx.beginPath(); ctx.arc(q.x + f * 8, q.y - 9 + bob + peck, 4, 0, Math.PI * 2); ctx.fill();          // head
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.moveTo(q.x + f * 11, q.y - 9 + bob + peck); ctx.lineTo(q.x + f * 15, q.y - 8 + bob + peck); ctx.lineTo(q.x + f * 11, q.y - 7 + bob + peck); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(q.x + f * 9, q.y - 10 + bob + peck, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x - 3, q.y + 1); ctx.lineTo(q.x - 3, q.y + 4); ctx.moveTo(q.x + 3, q.y + 1); ctx.lineTo(q.x + 3, q.y + 4); ctx.stroke();
  },
  // The still parts of the roof, painted once into an offscreen canvas.
  roofCanvas(r) {
    if (this.roofBg) return this.roofBg;
    const B = CFG.BUILDING, P = CFG.UPSTAIRS.ROOF, res = 2;
    const x0 = B.x0 - P.pad, y0 = B.y0 - 4, w = B.x1 - B.x0 + 2 * P.pad, h = B.y1 - B.y0 + 4 + P.pad;
    const c = document.createElement('canvas'); c.width = Math.ceil(w * res); c.height = Math.ceil(h * res);
    const ctx = c.getContext('2d'); ctx.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    const main = r.ctx; r.ctx = ctx;
    this.paintRoof(r, x0, y0, w, h);
    r.ctx = main;
    this.roofBg = { canvas: c, x0, y0, w, h };
    return this.roofBg;
  },
  paintRoof(r, x0, y0, w, h) {
    const ctx = r.ctx, P = CFG.UPSTAIRS.ROOF;
    let seed = 20240601;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    // tar paper: dark grey with seams, gravel speckles and a few darker patches of fresh tar
    ctx.fillStyle = '#5c6069'; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let y = y0 + 44; y < y0 + h; y += 44) ctx.fillRect(x0, y, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (const [dx, dy, rx, ry] of [[0.3, 0.72, 90, 40], [0.68, 0.28, 70, 34], [0.82, 0.78, 60, 30], [0.12, 0.3, 40, 26]]) { ctx.beginPath(); ctx.ellipse(x0 + w * dx, y0 + h * dy, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 900; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h; ctx.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.09)'; ctx.fillRect(x, y, 2, 2); }
    // parapet: a raised ledge all round, lit from the top-left
    const pw = 12;
    ctx.fillStyle = '#8d9299'; ctx.fillRect(x0, y0, w, pw); ctx.fillRect(x0, y0 + h - pw, w, pw); ctx.fillRect(x0, y0, pw, h); ctx.fillRect(x0 + w - pw, y0, pw, h);
    ctx.fillStyle = '#b0b5bc'; ctx.fillRect(x0, y0, w, 3); ctx.fillRect(x0, y0, 3, h);
    ctx.fillStyle = '#4a4e55'; ctx.fillRect(x0 + pw, y0 + pw, w - 2 * pw, 3); ctx.fillRect(x0 + pw, y0 + pw, 3, h - 2 * pw);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, y0 + h - 3, w, 3); ctx.fillRect(x0 + w - 3, y0, 3, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = x0 + 24; x < x0 + w - 12; x += 24) { ctx.fillRect(x, y0 + 1, 1.5, pw - 2); ctx.fillRect(x, y0 + h - pw + 1, 1.5, pw - 2); }
    for (let y = y0 + 24; y < y0 + h - 12; y += 24) { ctx.fillRect(x0 + 1, y, pw - 2, 1.5); ctx.fillRect(x0 + w - pw + 1, y, pw - 2, 1.5); }
    // the big painted sign, readable from above (and from the planes)
    const sg = P.sign;
    ctx.font = r.font(56); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillText('NAPLES STREET PIZZA', sg.x + 4, sg.y + 5);
    ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.strokeStyle = '#c0392b'; ctx.strokeText('NAPLES STREET PIZZA', sg.x, sg.y);
    ctx.fillStyle = '#fff8ee'; ctx.fillText('NAPLES STREET PIZZA', sg.x, sg.y);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.arc(sg.pizza.x + 4, sg.pizza.y + 5, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(sg.pizza.x, sg.pizza.y, 46, 0, Math.PI * 2); ctx.fill();
    r.drawPizza(sg.pizza.x, sg.pizza.y, 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(sg.pizza.x - Math.cos(a) * 44, sg.pizza.y - Math.sin(a) * 44); ctx.lineTo(sg.pizza.x + Math.cos(a) * 44, sg.pizza.y + Math.sin(a) * 44); ctx.stroke(); }
    // skylight over the kitchen: a glass panel in a dark frame (its glow is drawn each frame)
    const S = P.skylight;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, S.x0 + 4, S.y0 + 6, S.x1 - S.x0, S.y1 - S.y0, 6); ctx.fill();
    ctx.fillStyle = '#3e424a'; U.roundRect(ctx, S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0, 6); ctx.fill();
    ctx.fillStyle = '#9fd8f2'; ctx.fillRect(S.x0 + 6, S.y0 + 6, S.x1 - S.x0 - 12, S.y1 - S.y0 - 12);
    ctx.fillStyle = '#3e424a'; ctx.fillRect((S.x0 + S.x1) / 2 - 2, S.y0, 4, S.y1 - S.y0); ctx.fillRect(S.x0, (S.y0 + S.y1) / 2 - 2, S.x1 - S.x0, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(S.x0 + 10, S.y0 + 30); ctx.lineTo(S.x0 + 40, S.y0 + 8); ctx.lineTo(S.x0 + 60, S.y0 + 8); ctx.lineTo(S.x0 + 10, S.y0 + 50); ctx.closePath(); ctx.fill();
    // chimney: brick, with a sooty mouth
    const ch = P.chimney;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(ch.x - 18, ch.y - 14, 44, 44);
    ctx.fillStyle = '#b5533c'; ctx.fillRect(ch.x - 22, ch.y - 22, 44, 44);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = ch.y - 22; y < ch.y + 22; y += 8) { ctx.fillRect(ch.x - 22, y, 44, 1.5); for (let x = ch.x - 22 + ((y / 8) % 2 ? 10 : 0); x < ch.x + 22; x += 20) ctx.fillRect(x, y, 1.5, 8); }
    ctx.fillStyle = '#6e7177'; ctx.fillRect(ch.x - 24, ch.y - 24, 48, 5); ctx.fillRect(ch.x - 24, ch.y - 24, 5, 48);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a4e55'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 8, 0, Math.PI * 2); ctx.fill();
    // water tank on a braced stand
    const T = P.tank;
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 5; ctx.strokeRect(T.x - 50, T.y - 50, 100, 100);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(T.x - 50, T.y - 50); ctx.lineTo(T.x + 50, T.y + 50); ctx.moveTo(T.x + 50, T.y - 50); ctx.lineTo(T.x - 50, T.y + 50); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(T.x + 5, T.y + 7, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.beginPath(); ctx.arc(T.x, T.y, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(T.x + Math.cos(a) * 46, T.y + Math.sin(a) * 46); ctx.stroke(); }
    const cone = ctx.createRadialGradient(T.x - 10, T.y - 12, 4, T.x, T.y, 46); cone.addColorStop(0, 'rgba(255,230,190,0.45)'); cone.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.arc(T.x, T.y, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 3; for (const rr of [44, 30]) { ctx.beginPath(); ctx.arc(T.x, T.y, rr, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(T.x, T.y, 7, 0, Math.PI * 2); ctx.fill();
    // AC units: light grey boxes with a round fan grille on top (fans drawn each frame) and side vents
    for (const a of P.ac) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; U.roundRect(ctx, a.x - 28, a.y - 26, 64, 64, 6); ctx.fill();
      ctx.fillStyle = '#b5bac1'; U.roundRect(ctx, a.x - 32, a.y - 32, 64, 64, 6); ctx.fill();
      ctx.fillStyle = '#d4d8dd'; U.roundRect(ctx, a.x - 32, a.y - 32, 64, 5, 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = a.y + 14; y < a.y + 30; y += 5) ctx.fillRect(a.x - 26, y, 52, 2);
      ctx.fillStyle = '#3e424a'; ctx.beginPath(); ctx.arc(a.x, a.y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c6069'; ctx.beginPath(); ctx.arc(a.x, a.y, 19, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8d9299'; ctx.lineWidth = 2; for (const rr of [8, 14]) { ctx.beginPath(); ctx.arc(a.x, a.y, rr, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#8d9299'; ctx.fillRect(a.x + 32, a.y - 4, 14, 8);                 // pipe to the wall
    }
    // vent pipes, a roof hatch and a satellite dish
    ctx.fillStyle = '#3e424a'; for (const [x, y] of [[360, 560], [600, 240], [880, 420]]) { ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8d9299'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3e424a'; }
    ctx.fillStyle = '#4a4e55'; U.roundRect(ctx, 300, 390, 44, 44, 4); ctx.fill(); ctx.fillStyle = '#6e7177'; U.roundRect(ctx, 304, 394, 36, 36, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(334, 408, 6, 8);
    const D = P.dish;
    ctx.fillStyle = '#3e424a'; ctx.fillRect(D.x - 3, D.y - 3, 6, 26);
    ctx.fillStyle = '#e6e9ec'; ctx.beginPath(); ctx.ellipse(D.x, D.y, 18, 12, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3e424a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x, D.y); ctx.lineTo(D.x + 12, D.y - 10); ctx.stroke();
    // weather vane base: a compass cross (the arrow turns each frame)
    const V = P.vane;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(V.x - 1.5, V.y - 24, 3, 48); ctx.fillRect(V.x - 24, V.y - 1.5, 48, 3);
    ctx.font = r.font(10); ctx.fillStyle = '#fff8ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', V.x, V.y - 30); ctx.fillText('S', V.x, V.y + 31); ctx.fillText('E', V.x + 31, V.y); ctx.fillText('W', V.x - 31, V.y);
  },

  // ---------- the office stairs (static town art) ----------
  paintTown(r, g) {
    const ctx = r.ctx, S = CFG.UPSTAIRS.STAIRS, b = S.block, L = S.landing;
    // a mat at the foot of the stairs
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(L.x + 2, L.y + 4, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.ellipse(L.x, L.y, 24, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(L.x, L.y, 18, 8, 0, 0, Math.PI * 2); ctx.stroke();
    // the flight: treads climbing east, each a little darker and narrower, into a dark opening at the top
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(b.x + 3, b.y + 3, b.w, b.h);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(b.x, b.y, b.w, b.h);
    const n = 7, tw = (b.w - 14) / n;
    for (let i = 0; i < n; i++) {
      const x = b.x + 2 + i * tw, k = i / (n - 1), inset = k * 5;
      ctx.fillStyle = `rgb(${Math.round(201 - 60 * k)},${Math.round(154 - 50 * k)},${Math.round(95 - 35 * k)})`;
      ctx.fillRect(x, b.y + 4 + inset, tw - 1.5, b.h - 8 - inset * 2);
      ctx.fillStyle = 'rgba(255,230,180,0.25)'; ctx.fillRect(x, b.y + 4 + inset, 1.5, b.h - 8 - inset * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + tw - 4.5, b.y + 4 + inset, 3, b.h - 8 - inset * 2);   // riser shadow
    }
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(b.x + b.w - 12, b.y + 2, 12, b.h - 4);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▲', b.x + b.w - 6, b.y + b.h / 2);
    // railing along the room side: posts and a hand rail
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(b.x, b.y - 2, b.w - 10, 4);
    ctx.fillStyle = '#5b3a1a'; for (let x = b.x + 2; x < b.x + b.w - 12; x += 12) ctx.fillRect(x, b.y - 10, 3, 12);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(b.x, b.y - 12, b.w - 10, 3);
    // "UPSTAIRS" sign on the railing
    const sg = S.sign;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, sg.x - 28, sg.y - 7, 60, 16, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, sg.x - 30, sg.y - 9, 60, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛏️ UPSTAIRS', sg.x, sg.y - 1);
    // the owner's drawing hangs in the dining room too, on the back wall past the neon sign
    const A = CFG.UPSTAIRS.art.shop;
    if (this.img && this.img.ok) this.paintArt(ctx, A.x, A.y, A.w, A.h);
  },

  // ---------- the bedroom (static) ----------
  paint: {
    upstairs(r, g) { UpstairsExt.paintRoom(r, g); },
  },
  // Little pizzas scattered over a red-and-cream check: the duvet print (also used for the chef's dream duvet).
  duvet(ctx, x0, y0, x1, y1, radius) {
    ctx.save(); U.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, radius); ctx.clip();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = '#fff3e0';
    for (let y = y0; y < y1; y += 16) for (let x = x0 + ((y - y0) / 16 % 2) * 16; x < x1; x += 32) ctx.fillRect(x, y, 16, 16);
    for (let y = y0 + 8; y < y1; y += 24) for (let x = x0 + 8 + ((y - y0) / 24 % 2) * 12; x < x1; x += 24) {
      ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6c453'; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1, 1, 0, Math.PI * 2); ctx.arc(x + 1.4, y + 1, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.5; U.roundRect(ctx, x0, y0, x1 - x0, y1 - y0, radius); ctx.stroke();
  },
  paintRoom(r, g) {
    const ctx = r.ctx, C = CFG.UPSTAIRS, W = C.WORLD, R = C.room, w = C.wall;
    // outside the walls: the dark of the attic
    ctx.fillStyle = '#1f1611'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    // wooden floor, like the office below
    for (let y = R.y0; y < R.y1; y += 18) {
      const row = Math.floor((y - R.y0) / 18), hh = Math.min(18, R.y1 - y);
      ctx.fillStyle = row % 2 ? '#c99a5f' : '#c4935a'; ctx.fillRect(R.x0, y, R.x1 - R.x0, hh);
      ctx.strokeStyle = 'rgba(80,40,10,0.18)'; ctx.beginPath(); ctx.moveTo(R.x0, y + 0.5); ctx.lineTo(R.x1, y + 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(80,40,10,0.12)';
      for (let x = R.x0 + (row % 2) * 60; x < R.x1; x += 120) { ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + hh); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,230,180,0.18)'; ctx.beginPath(); ctx.moveTo(R.x0, y + 6.5); ctx.lineTo(R.x1, y + 6.5); ctx.stroke();
    }
    const v = ctx.createRadialGradient((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 120, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 360);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,30,10,0.18)');
    ctx.fillStyle = v; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    // the rug (under everything else)
    const G = C.rug;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(G.x + 3, G.y + 4, G.rx, G.ry, 0, 0, Math.PI * 2); ctx.fill();
    for (const [k, col] of [[1, '#b23a48'], [0.78, '#f2e0bf'], [0.56, '#3b7dd8'], [0.34, '#f2e0bf'], [0.14, '#e4572e']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(G.x, G.y, G.rx * k, G.ry * k, 0, 0, Math.PI * 2); ctx.fill(); }
    // walls: the pizzeria's warm brown, with a cream wallpaper band on the top wall
    const wall = (x, y, ww, hh) => { ctx.fillStyle = '#7a5235'; ctx.fillRect(x, y, ww, hh); };
    wall(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, w); wall(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w);
    wall(R.x0 - w, R.y0, w, R.y1 - R.y0); wall(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = '#f2e0bf'; ctx.fillRect(R.x0, R.y0 - w + 6, R.x1 - R.x0, w - 10);
    ctx.fillStyle = 'rgba(228,87,46,0.25)'; for (let x = R.x0 + 8; x < R.x1; x += 24) ctx.fillRect(x, R.y0 - w + 6, 6, w - 10);
    ctx.fillStyle = '#9c6b45'; ctx.fillRect(R.x0 - w, R.y0 - w, R.x1 - R.x0 + 2 * w, 4);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0, R.y0 - 4, R.x1 - R.x0, 4); ctx.fillRect(R.x0, R.y1, R.x1 - R.x0, 3);   // skirting
    const sh = ctx.createLinearGradient(0, R.y0, 0, R.y0 + 16); sh.addColorStop(0, 'rgba(0,0,0,0.2)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, 16);
    // the window over Main Street: sky, the park trees, the road with a little car, a lamp post
    const N = C.window;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, N.x0 - 5, N.y0 - 5, N.x1 - N.x0 + 10, N.y1 - N.y0 + 10, 5); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0); ctx.clip();
    const sky = ctx.createLinearGradient(0, N.y0, 0, N.y1); sky.addColorStop(0, '#79c6f2'); sky.addColorStop(1, '#d9f0ff');
    ctx.fillStyle = sky; ctx.fillRect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0);
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(N.x1 - 16, N.y0 + 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(N.x0 + 22, N.y0 + 12, 5, 0, Math.PI * 2); ctx.arc(N.x0 + 29, N.y0 + 10, 6, 0, Math.PI * 2); ctx.arc(N.x0 + 36, N.y0 + 13, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7cc45f'; ctx.fillRect(N.x0, N.y0 + 24, N.x1 - N.x0, 12);
    for (const [dx, s] of [[10, 1], [26, 0.8], [44, 1.1], [86, 0.9]]) { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(N.x0 + dx - 1.5, N.y0 + 22, 3, 8); ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(N.x0 + dx, N.y0 + 20, 6 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(N.x0 + dx - 2, N.y0 + 17, 3 * s, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5c6069'; ctx.fillRect(N.x0, N.y0 + 36, N.x1 - N.x0, 18);
    ctx.fillStyle = '#ffe08a'; for (let x = N.x0 + 4; x < N.x1; x += 14) ctx.fillRect(x, N.y0 + 44, 7, 2);
    ctx.fillStyle = '#e4572e'; U.roundRect(ctx, N.x0 + 56, N.y0 + 39, 22, 10, 3); ctx.fill(); ctx.fillStyle = '#9fe0ff'; ctx.fillRect(N.x0 + 60, N.y0 + 40, 10, 4);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(N.x0 + 61, N.y0 + 49, 2.5, 0, Math.PI * 2); ctx.arc(N.x0 + 73, N.y0 + 49, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e424a'; ctx.fillRect(N.x0 + 68, N.y0 + 20, 2, 16); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(N.x0 + 69, N.y0 + 19, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f5f0dc'; ctx.fillRect((N.x0 + N.x1) / 2 - 2, N.y0, 4, N.y1 - N.y0); ctx.fillRect(N.x0, (N.y0 + N.y1) / 2 - 2, N.x1 - N.x0, 4);
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = 4; ctx.strokeRect(N.x0, N.y0, N.x1 - N.x0, N.y1 - N.y0);
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(N.x0 - 14, N.y0 - 6, 12, N.y1 - N.y0 + 12); ctx.fillRect(N.x1 + 2, N.y0 - 6, 12, N.y1 - N.y0 + 12);   // curtains
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (const x of [N.x0 - 11, N.x0 - 6, N.x1 + 5, N.x1 + 10]) ctx.fillRect(x, N.y0 - 6, 1.5, N.y1 - N.y0 + 12);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(N.x0 - 16, N.y1 + 6, N.x1 - N.x0 + 32, 5);   // sill
    // framed photo of the chef and the dog
    const ph = C.photo;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, ph.x - 15, ph.y - 12, 30, 24, 3); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(ph.x - 12, ph.y - 9, 24, 18);
    ctx.fillStyle = '#9fd8f2'; ctx.fillRect(ph.x - 11, ph.y - 8, 22, 10); ctx.fillStyle = '#7cc45f'; ctx.fillRect(ph.x - 11, ph.y + 2, 22, 6);
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(ph.x - 4, ph.y - 1, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ph.x - 4, ph.y - 4.5, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.fillRect(ph.x - 6, ph.y + 1, 4, 5);
    ctx.fillStyle = '#c99a5f'; ctx.beginPath(); ctx.ellipse(ph.x + 5, ph.y + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(ph.x + 8, ph.y + 1, 2.2, 0, Math.PI * 2); ctx.fill();
    // the chef hat on its hook
    const hk = C.hook;
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(hk.x, hk.y - 10, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
    U.roundRect(ctx, hk.x - 9, hk.y - 2, 18, 10, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(hk.x - 5, hk.y - 5, 6, 0, Math.PI * 2); ctx.arc(hk.x + 5, hk.y - 5, 6, 0, Math.PI * 2); ctx.fill();
    // the big bed (or the race-car bed once bought)
    this.paintBed(ctx, this.owned(g, 'racecar'));
    // bedside table with a lamp and the alarm clock
    const T = C.table, tx = (T.x0 + T.x1) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, T.x0 + 3, T.y0 + 4, T.x1 - T.x0, T.y1 - T.y0, 4); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 4); ctx.fill();
    ctx.fillStyle = '#9b6531'; U.roundRect(ctx, T.x0 + 2, T.y0 + 2, T.x1 - T.x0 - 4, T.y1 - T.y0 - 6, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(tx - 8, T.y0 + 12, 9, 0, Math.PI * 2); ctx.fill();       // lamp shade (seen from above)
    ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(tx - 8, T.y0 + 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(tx + 9, T.y0 + 20, 6.5, 0, Math.PI * 2); ctx.fill();     // alarm clock
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tx + 9, T.y0 + 20, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx + 9, T.y0 + 20); ctx.lineTo(tx + 9, T.y0 + 17); ctx.moveTo(tx + 9, T.y0 + 20); ctx.lineTo(tx + 11.5, T.y0 + 21); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(tx + 5, T.y0 + 14.5, 1.8, 0, Math.PI * 2); ctx.arc(tx + 13, T.y0 + 14.5, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, tx - 16, T.y0 + 22, 20, 10, 2); ctx.fill();                  // the catalog, lying on the table
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(tx - 14, T.y0 + 24, 16, 1.5); ctx.fillRect(tx - 14, T.y0 + 27, 12, 1.5);
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📖', tx - 6, T.y0 + 27);
    // wardrobe with two doors
    const Wd = C.wardrobe;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, Wd.x0 + 4, Wd.y0 + 5, Wd.x1 - Wd.x0, Wd.y1 - Wd.y0, 4); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Wd.x0, Wd.y0, Wd.x1 - Wd.x0, Wd.y1 - Wd.y0, 4); ctx.fill();
    ctx.fillStyle = '#9b6531'; ctx.fillRect(Wd.x0 + 4, Wd.y0 + 4, (Wd.x1 - Wd.x0) / 2 - 6, Wd.y1 - Wd.y0 - 8); ctx.fillRect((Wd.x0 + Wd.x1) / 2 + 2, Wd.y0 + 4, (Wd.x1 - Wd.x0) / 2 - 6, Wd.y1 - Wd.y0 - 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; ctx.strokeRect(Wd.x0 + 9, Wd.y0 + 9, (Wd.x1 - Wd.x0) / 2 - 16, Wd.y1 - Wd.y0 - 18); ctx.strokeRect((Wd.x0 + Wd.x1) / 2 + 7, Wd.y0 + 9, (Wd.x1 - Wd.x0) / 2 - 16, Wd.y1 - Wd.y0 - 18);
    ctx.fillStyle = '#ffe08a'; for (const x of [(Wd.x0 + Wd.x1) / 2 - 6, (Wd.x0 + Wd.x1) / 2 + 6]) { ctx.beginPath(); ctx.arc(x, (Wd.y0 + Wd.y1) / 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
    // desk with the shop's ledger and a mug, and a chair
    const D = C.desk, ch = C.chair;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, D.x0 + 3, D.y0 + 4, D.x1 - D.x0, D.y1 - D.y0, 5); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, 5); ctx.fill();
    ctx.fillStyle = '#9b6531'; U.roundRect(ctx, D.x0 + 2, D.y0 + 2, D.x1 - D.x0 - 4, D.y1 - D.y0 - 6, 4); ctx.fill();
    ctx.fillStyle = '#b23a48'; U.roundRect(ctx, D.x0 + 7, D.y0 + 14, 28, 36, 2); ctx.fill();                      // the ledger
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(D.x0 + 9, D.y0 + 16, 12, 32); ctx.fillRect(D.x0 + 22, D.y0 + 16, 11, 32);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = D.y0 + 20; y < D.y0 + 46; y += 5) { ctx.fillRect(D.x0 + 11, y, 8, 1); ctx.fillRect(D.x0 + 24, y, 7, 1); }
    ctx.fillStyle = '#2f9e44'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', D.x0 + 27, D.y0 + 44);
    ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.arc(D.x0 + 22, D.y0 + 68, 7, 0, Math.PI * 2); ctx.fill();   // mug
    ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.arc(D.x0 + 22, D.y0 + 68, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3b7dd8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(D.x0 + 31, D.y0 + 68, 4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#f2b134'; ctx.fillRect(D.x0 + 8, D.y0 + 60, 3, 18); ctx.fillStyle = '#e4572e'; ctx.fillRect(D.x0 + 8, D.y0 + 58, 3, 3);   // pencil
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(ch.x + 2, ch.y + 3, 11, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.arc(ch.x, ch.y, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, ch.x - 11, ch.y - 4, 4, 10, 2); ctx.fill();   // chair back (facing the desk)
    // bookshelf against the west wall, full of bright books
    const Sh = C.shelf;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, Sh.x0 + 3, Sh.y0 + 4, Sh.x1 - Sh.x0, Sh.y1 - Sh.y0, 3); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Sh.x0, Sh.y0, Sh.x1 - Sh.x0, Sh.y1 - Sh.y0, 3); ctx.fill();
    const cols = ['#e4572e', '#3b7dd8', '#2f9e44', '#f2b134', '#b23a48', '#9c6bd8', '#4aa3d8'];
    let by = Sh.y0 + 4, i = 0;
    while (by < Sh.y1 - 6) { const bh = 5 + (i * 7) % 5; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(Sh.x0 + 4 + (i % 3) * 2, by, Sh.x1 - Sh.x0 - 8 - (i % 3) * 2, bh); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(Sh.x0 + 8, by + 1.5, 6, 1.5); by += bh + 2; i++; }
    // potted plant
    const P = C.plant;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 6, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c45c2e'; U.roundRect(ctx, P.x - 10, P.y - 6, 20, 14, 3); ctx.fill(); ctx.fillStyle = '#e07a4a'; ctx.fillRect(P.x - 12, P.y - 8, 24, 4);
    ctx.fillStyle = '#3f9a4a'; for (const [dx, dy, rr] of [[-8, -14, 7], [8, -14, 7], [0, -20, 8], [-4, -9, 6], [5, -8, 6]]) { ctx.beginPath(); ctx.arc(P.x + dx, P.y + dy, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 2, P.y - 20, 4, 0, Math.PI * 2); ctx.fill();
    // the stair opening: a dark hole with the top steps showing, railed on the room sides
    const O = C.opening;
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(O.x0, O.y0, O.x1 - O.x0, O.y1 - O.y0);
    for (let k = 0; k < 4; k++) { const x = O.x0 + 6 + k * 12, kk = 1 - k / 4; ctx.fillStyle = `rgba(201,154,95,${(0.9 * kk).toFixed(2)})`; ctx.fillRect(x, O.y0 + 6, 10, O.y1 - O.y0 - 12); }
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▼', O.x1 - 12, (O.y0 + O.y1) / 2);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(O.x0 - 4, O.y0 - 4, O.x1 - O.x0 + 4, 4); ctx.fillRect(O.x0 - 4, O.y0 - 4, 4, O.y1 - O.y0 + 4);
    ctx.fillStyle = '#5b3a1a'; for (let x = O.x0 - 2; x < O.x1; x += 12) ctx.fillRect(x, O.y0 - 14, 3, 12);
    for (let y = O.y0 + 6; y < O.y1; y += 12) ctx.fillRect(O.x0 - 12, y, 12, 3);
    ctx.fillStyle = '#d7b98a'; ctx.fillRect(O.x0 - 16, O.y0 - 16, O.x1 - O.x0 + 16, 4); ctx.fillRect(O.x0 - 16, O.y0 - 16, 4, O.y1 - O.y0 + 16);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, O.x0 - 36, O.y0 - 36, 64, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕 DOWNSTAIRS', O.x0 - 4, O.y0 - 28);
    // bought decorations (their still parts; the moving bits are drawn each frame in `dynamic`)
    for (const it of C.items) if (it.key !== 'racecar' && this.owned(g, it.key)) this.drawItem(r, g, it, 'static');   // the car bed was painted with the bed
    // the owner's drawing, framed on the wall beside the photo
    const A = C.art.room;
    if (this.img && this.img.ok) this.paintArt(ctx, A.x, A.y, A.w, A.h);
  },

  // ---------- the chef tucked in (drawn with the people so the duvet covers the sprite) ----------
  entities(r, g, items) {
    if (!this.st || g.area !== 'upstairs') return;
    if (this.st.sit && this.st.sit.landed) { items.push({ y: g.player.y + 0.5, draw: () => this.drawBeanbagFront(r.ctx, g) }); return; }
    if (!this.st.nap || this.st.nap.phase !== 'sleep') return;
    const C = CFG.UPSTAIRS, B = C.bed, p = g.player;
    items.push({ y: B.y1 + 2, draw: () => {
      const ctx = r.ctx, x = p.x, y = p.y, t = g.time;
      // the duvet pulled up to the chin, rising and falling with each breath
      const br = Math.sin(t * 2.4) * 1.2;
      this.duvet(ctx, B.x0 + 3, y - 26 - br, B.x1 - 3, B.y1 - 6, 8);
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x0 + 3, y - 26 - br, B.x1 - B.x0 - 6, 11, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.ellipse(x, y - 8, 16, 14, 0, 0, Math.PI * 2); ctx.fill();   // the lump of the chef
      // closed eyes over the open ones, and a sleepy smile
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, y - 38, 2.6, 0, Math.PI * 2); ctx.arc(x + 6, y - 38, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 39, 2.4, Math.PI * 0.15, Math.PI * 0.85); ctx.arc(x + 6, y - 39, 2.4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      // a nightcap over the chef hat
      ctx.fillStyle = '#3b7dd8'; ctx.beginPath(); ctx.moveTo(x - 13, y - 44); ctx.lineTo(x + 13, y - 44); ctx.quadraticCurveTo(x + 14, y - 60, x + 24, y - 66); ctx.quadraticCurveTo(x + 2, y - 62, x - 13, y - 44); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 14, y - 47, 28, 6, 3); ctx.fill(); ctx.beginPath(); ctx.arc(x + 24, y - 66, 4, 0, Math.PI * 2); ctx.fill();
      // the chef hat hangs on the bedpost
      const hx = B.x1 + 2, hy = B.y0 - 6;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5;
      U.roundRect(ctx, hx - 8, hy - 2, 16, 9, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx - 4, hy - 5, 5.5, 0, Math.PI * 2); ctx.arc(hx + 4, hy - 5, 5.5, 0, Math.PI * 2); ctx.fill();
      // little z's above the pillow
      ctx.fillStyle = '#fff8ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.font = r.font(9 + k * 3); ctx.fillText('z', x + 18 + ph * 14 + k * 4, y - 56 - ph * 26 - k * 4); }
      ctx.globalAlpha = 1;
    } });
  },

  // ---------- screen space: the area fade and the night of the nap ----------
  screen(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    const a = this.napAlpha();
    if (a > 0 && g.area === 'upstairs') this.drawNight(r, g, W, H, a);
    if (g.area === 'upstairs' && this.st.cat.on) this.drawCatalog(r, g, W, H);
    if (this.st.fade > 0) { ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / CFG.UPSTAIRS.ROOF.fade).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },
  drawNight(r, g, W, H, a) {
    const ctx = r.ctx, t = this.st.nap.t;
    ctx.save();
    ctx.globalAlpha = a;
    const grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(16,24,66,0.9)'); grd.addColorStop(1, 'rgba(34,44,96,0.9)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    // a crescent moon and a few twinkling stars
    ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.2, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(16,24,66,0.95)'; ctx.beginPath(); ctx.arc(W * 0.82 - 12, H * 0.2 - 6, 24, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 18; i++) { const sx = ((i * 157) % 100) / 100 * W, sy = ((i * 83) % 100) / 100 * H * 0.7, tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.fillStyle = `rgba(255,255,255,${(0.35 + 0.55 * tw).toFixed(2)})`; ctx.beginPath(); ctx.arc(sx, sy, 1.2 + tw * 1.4, 0, Math.PI * 2); ctx.fill(); }
    // drifting z's
    ctx.fillStyle = '#dfe8ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < 6; k++) {
      const ph = (t * 0.35 + k / 6) % 1, size = 22 + k * 6;
      ctx.globalAlpha = a * Math.sin(ph * Math.PI);
      ctx.font = r.font(size);
      ctx.fillText('z', W * (0.3 + 0.08 * k) + Math.sin(t * 1.5 + k) * 18, H * 0.75 - ph * H * 0.55);
    }
    // dream pizzas floating by in little clouds
    for (let i = 0; i < 4; i++) {
      const x = ((t * 55 + i * (W + 120) / 4) % (W + 120)) - 60, y = H * (0.22 + 0.17 * i) + Math.sin(t * 1.6 + i * 2) * 14;
      ctx.globalAlpha = a * 0.95;
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(x - 20, y + 6, 18, 0, Math.PI * 2); ctx.arc(x, y - 4, 24, 0, Math.PI * 2); ctx.arc(x + 22, y + 6, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
      r.drawPizza(x, y, 18);
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(Math.min(30, W / 14)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('😴 Sweet dreams…', W / 2, H * 0.85);
    ctx.restore();
  },

  // ======================= the bed =======================
  paintBed(ctx, racecar) {
    const B = CFG.UPSTAIRS.bed;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, B.x0 + 4, B.y0 + 6, B.x1 - B.x0, B.y1 - B.y0, 6); ctx.fill();
    if (racecar) {
      // a red racing car: rounded body, four fat wheels, a spoiler at the head end and a number on the bonnet
      ctx.fillStyle = '#2b1d14'; for (const [x, y] of [[B.x0 - 2, B.y0 + 28], [B.x1 + 2, B.y0 + 28], [B.x0 - 2, B.y1 - 30], [B.x1 + 2, B.y1 - 30]]) { U.roundRect(ctx, x - 9, y - 16, 18, 32, 6); ctx.fill(); }
      ctx.fillStyle = '#8d9299'; for (const [x, y] of [[B.x0 - 2, B.y0 + 28], [B.x1 + 2, B.y0 + 28], [B.x0 - 2, B.y1 - 30], [B.x1 + 2, B.y1 - 30]]) ctx.fillRect(x - 3, y - 8, 6, 16);
      ctx.fillStyle = '#c62828'; U.roundRect(ctx, B.x0 - 4, B.y0 - 10, B.x1 - B.x0 + 8, B.y1 - B.y0 + 10, 22); ctx.fill();
      ctx.fillStyle = '#e53935'; U.roundRect(ctx, B.x0 + 2, B.y0 - 4, B.x1 - B.x0 - 4, B.y1 - B.y0 + 2, 18); ctx.fill();
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, B.x0 - 10, B.y0 - 16, B.x1 - B.x0 + 20, 10, 4); ctx.fill();          // spoiler
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(B.x0 + 16, B.y0 - 4, 10, B.y1 - B.y0 + 2); ctx.fillRect(B.x1 - 26, B.y0 - 4, 10, B.y1 - B.y0 + 2);   // racing stripes
      ctx.fillStyle = '#ffe08a'; for (const x of [B.x0 + 22, B.x1 - 22]) { ctx.beginPath(); ctx.arc(x, B.y1 - 6, 5, 0, Math.PI * 2); ctx.fill(); }   // headlights at the foot
      ctx.fillStyle = '#fff'; U.roundRect(ctx, B.x0 + 10, B.y0 + 8, B.x1 - B.x0 - 20, B.y1 - B.y0 - 16, 10); ctx.fill();   // the mattress inside
      for (const x of [B.x0 + 32, B.x1 - 32]) { ctx.fillStyle = '#9fd8f2'; U.roundRect(ctx, x - 18, B.y0 + 14, 38, 20, 7); ctx.fill(); }
      this.duvet(ctx, B.x0 + 12, B.y0 + 46, B.x1 - 12, B.y1 - 12, 8);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc((B.x0 + B.x1) / 2, B.y1 - 26, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = `900 14px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', (B.x0 + B.x1) / 2, B.y1 - 25);
      return;
    }
    // headboard and posts, mattress, two pillows and the pizza-print duvet
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, B.x0 - 4, B.y0 - 10, B.x1 - B.x0 + 8, 22, 5); ctx.fill();
    ctx.fillStyle = '#a5693a'; U.roundRect(ctx, B.x0 - 1, B.y0 - 7, B.x1 - B.x0 + 2, 14, 4); ctx.fill();
    for (const x of [B.x0 - 2, B.x1 + 2]) { ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(x, B.y0 - 8, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, B.y1 - 4, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, B.x0 - 3, B.y0 + 4, B.x1 - B.x0 + 6, B.y1 - B.y0 - 4, 6); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x0, B.y0 + 6, B.x1 - B.x0, B.y1 - B.y0 - 8, 5); ctx.fill();
    for (const x of [B.x0 + 28, B.x1 - 28]) { ctx.fillStyle = 'rgba(0,0,0,0.1)'; U.roundRect(ctx, x - 22, B.y0 + 14, 46, 24, 8); ctx.fill(); ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 23, B.y0 + 11, 46, 24, 8); ctx.fill(); ctx.strokeStyle = 'rgba(43,29,20,0.25)'; ctx.lineWidth = 1.5; U.roundRect(ctx, x - 23, B.y0 + 11, 46, 24, 8); ctx.stroke(); }
    this.duvet(ctx, B.x0 + 3, B.y0 + 48, B.x1 - 3, B.y1 - 6, 8);
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, B.x0 + 3, B.y0 + 48, B.x1 - B.x0 - 6, 12, 4); ctx.fill();   // folded sheet
  },

  // ======================= the decorations =======================
  // `mode`: 'static' paints the still parts (cached background), 'dynamic' the moving parts (each frame), 'all' both (the catalog page).
  drawItem(r, g, it, mode) {
    const ctx = r.ctx, x = it.spot.x, y = it.spot.y, t = g.time, st = this.st || {}, p = g.player;
    const S = mode !== 'dynamic', D = mode !== 'static';
    const near = g.area === 'upstairs' && U.dist(p.x, p.y, x, y) < 70;
    switch (it.key) {
      case 'poster':
        if (S) {
          ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, x - 26, y - 14, 52, 28, 3); ctx.fill();
          ctx.fillStyle = '#ffe08a'; ctx.fillRect(x - 23, y - 11, 46, 22);
          ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x - 12, y, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 16, y - 8, 8, 4, 1.5); ctx.fill(); ctx.beginPath(); ctx.arc(x - 14, y - 9, 2.5, 0, Math.PI * 2); ctx.arc(x - 10, y - 9, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e4572e'; ctx.fillRect(x - 15, y + 5, 6, 5);
          r.drawPizza(x + 2, y, 5);
          ctx.fillStyle = '#b8401c'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PIZZA', x + 14, y - 4); ctx.fillText('CHEF!', x + 14, y + 4);
        }
        break;
      case 'lava':
        if (S) { ctx.fillStyle = '#8d9299'; U.roundRect(ctx, x - 8, y + 6, 16, 6, 2); ctx.fill(); ctx.fillStyle = '#e8d2b4'; U.roundRect(ctx, x - 6, y - 24, 12, 32, 5); ctx.fill(); ctx.fillStyle = '#8d9299'; U.roundRect(ctx, x - 5, y - 28, 10, 5, 2); ctx.fill(); }
        if (D) {
          ctx.save(); ctx.beginPath(); U.roundRect(ctx, x - 5, y - 23, 10, 30, 4); ctx.clip();
          ctx.fillStyle = '#ff9f1c'; ctx.fillRect(x - 5, y - 23, 10, 30);
          ctx.fillStyle = '#e4572e';
          for (let k = 0; k < 3; k++) { const ph = (t * 0.25 + k * 0.33) % 1; ctx.beginPath(); ctx.ellipse(x + Math.sin(t + k * 2) * 2, y + 4 - ph * 26, 3 + Math.sin(t * 2 + k) * 0.8, 4, 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
          ctx.fillStyle = `rgba(255,159,28,${(0.12 + 0.06 * Math.sin(t * 2)).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y - 8, 22, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'beanbag':
        if (D) this.drawBeanbag(ctx, x, y, mode === 'dynamic' ? this.squash(g) : 0);   // drawn each frame: it squashes when the chef flops in
        break;
      case 'stars':
        if (S) { ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, x - 10, y - 4, 20, 12, 4); ctx.fill(); ctx.fillStyle = '#5a6fb0'; ctx.beginPath(); ctx.arc(x, y - 6, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; for (const [dx, dy] of [[-3, -8], [3, -5], [0, -10]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.2, 0, Math.PI * 2); ctx.fill(); } }
        if (D) {
          // stars drift across the ceiling (which, seen from above, is a soft lightshow over the floor)
          const R = CFG.UPSTAIRS.room, cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
          ctx.fillStyle = `rgba(90,111,176,${mode === 'all' ? 0 : 0.08})`; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
          for (let k = 0; k < 16; k++) {
            const a = t * 0.12 + k * 0.39, rad = (mode === 'all' ? 30 : 120) + (k % 4) * (mode === 'all' ? 8 : 34), sx = (mode === 'all' ? x : cx) + Math.cos(a) * rad * 1.6, sy = (mode === 'all' ? y - 26 : cy) + Math.sin(a) * rad * 0.9;
            const tw = 0.6 + 0.4 * Math.sin(t * 3 + k), s = (mode === 'all' ? 2.5 : 4) * tw;
            ctx.fillStyle = `rgba(255,224,138,${(0.55 * tw).toFixed(2)})`;
            ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? s * 0.4 : s, aa = i * Math.PI / 4; ctx.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } ctx.closePath(); ctx.fill();
          }
        }
        break;
      case 'chest':
        if (S) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, x - 27, y - 12, 60, 34, 4); ctx.fill(); ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, x - 30, y - 16, 60, 34, 4); ctx.fill(); ctx.fillStyle = '#e4572e'; U.roundRect(ctx, x - 27, y - 13, 54, 28, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(x - 27, y - 2, 54, 3); ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(x, y - 1, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧸', x - 14, y - 7); ctx.fillText('🚂', x + 14, y - 7); }
        break;
      case 'hamster':
        if (S) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, x - 17, y - 12, 40, 32, 5); ctx.fill(); ctx.fillStyle = '#d7b98a'; U.roundRect(ctx, x - 20, y - 16, 40, 32, 5); ctx.fill(); ctx.strokeStyle = '#8d9299'; ctx.lineWidth = 1; for (let k = -16; k <= 16; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, y - 14); ctx.lineTo(x + k, y + 14); ctx.stroke(); } ctx.fillStyle = '#e8d2b4'; ctx.fillRect(x - 18, y + 8, 36, 6); }
        if (D) {
          const ang = mode === 'all' ? t * 6 : st.wheel || 0;
          ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 6, y - 1, 11, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const a = ang + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x + 6 - Math.cos(a) * 11, y - 1 - Math.sin(a) * 11); ctx.lineTo(x + 6 + Math.cos(a) * 11, y - 1 + Math.sin(a) * 11); ctx.stroke(); }
          const run = mode === 'all' || (st.wheelV || 0) > 0.5, bob = run ? Math.sin(t * 20) * 1 : 0;
          ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.ellipse(x + 6, y + 5 + bob, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f3e6cf'; ctx.beginPath(); ctx.ellipse(x + 6, y + 6 + bob, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + 10, y + 4 + bob, 0.8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.arc(x + 3, y + 1 + bob, 1.6, 0, Math.PI * 2); ctx.arc(x + 8, y + 1 + bob, 1.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x - 12, y + 2, 2.5, 0, Math.PI * 2); ctx.fill();   // a seed
        }
        break;
      case 'horse':
        if (S) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 10, 20, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        if (D) {
          const rock = mode === 'all' ? Math.sin(t * 3) * 0.16 : st.rock || 0;
          ctx.save(); ctx.translate(x, y + 6); ctx.rotate(rock);
          ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, -16, 22, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();   // the rocker
          ctx.fillStyle = '#8d5a2b'; ctx.fillRect(-11, -16, 4, 14); ctx.fillRect(7, -16, 4, 14);
          ctx.fillStyle = '#d9a066'; U.roundRect(ctx, -16, -24, 30, 14, 6); ctx.fill();            // body
          ctx.fillStyle = '#b23a48'; U.roundRect(ctx, -6, -27, 12, 6, 2); ctx.fill();                // saddle
          ctx.fillStyle = '#d9a066'; U.roundRect(ctx, 8, -36, 11, 16, 4); ctx.fill(); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(9, -38, 8, 5); ctx.fillRect(10, -40, 3, 3);   // head + mane
          ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(15, -31, 1.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.moveTo(-16, -20); ctx.quadraticCurveTo(-24, -20, -22, -10); ctx.lineTo(-18, -14); ctx.closePath(); ctx.fill();   // tail
          ctx.restore();
        }
        break;
      case 'fish':
        if (S) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; U.roundRect(ctx, x - 17, y - 14, 40, 36, 3); ctx.fill(); ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, x - 20, y - 18, 40, 36, 3); ctx.fill(); ctx.fillStyle = '#4aa3d8'; ctx.fillRect(x - 17, y - 15, 34, 30); ctx.fillStyle = '#d9a066'; ctx.fillRect(x - 17, y + 10, 34, 5); ctx.fillStyle = '#3f9a4a'; for (const dx of [-12, 10]) { ctx.beginPath(); ctx.moveTo(x + dx, y + 11); ctx.quadraticCurveTo(x + dx - 4, y, x + dx, y - 8); ctx.quadraticCurveTo(x + dx + 4, y, x + dx, y + 11); ctx.fill(); } }
        if (D) {
          ctx.save(); ctx.beginPath(); ctx.rect(x - 17, y - 15, 34, 30); ctx.clip();
          const fishes = [['#ff8a3d', 0, 0.9, -6], ['#ffd166', 2.1, 1.3, 3], ['#ff5c8a', 4.2, 0.7, 7]];
          for (const [col, ph, sp, dy] of fishes) {
            const fx = x + Math.sin(t * sp + ph) * 11, dir = Math.cos(t * sp + ph) >= 0 ? 1 : -1, fy = y + dy + Math.sin(t * 2 + ph) * 1.5;
            ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, fy, 4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(fx - dir * 3, fy); ctx.lineTo(fx - dir * 6.5, fy - 2.5); ctx.lineTo(fx - dir * 6.5, fy + 2.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(fx + dir * 2, fy - 0.6, 0.6, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k * 0.33) % 1; ctx.beginPath(); ctx.arc(x + 12 + k * 1.5, y + 10 - ph * 24, 1 + k * 0.3, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        }
        break;
      case 'drums':
        if (S) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 30, 10, 0, 0, Math.PI * 2); ctx.fill(); }
        if (D) {
          const hit = mode === 'all' || near ? Math.max(0, Math.sin(t * 9)) * 1.5 : 0;
          const drum = (dx, dy, rr, col) => { ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy + 3, rr, rr * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, rr, rr * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy - hit, rr * 0.8, rr * 0.45, 0, 0, Math.PI * 2); ctx.fill(); };
          drum(-14, -4, 10, '#e4572e'); drum(14, -4, 10, '#e4572e'); drum(0, 8, 13, '#3b7dd8');
          ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.ellipse(x - 24, y - 14, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 24, y - 14, 9, 4, 0, 0, Math.PI * 2); ctx.fill();   // cymbals
          ctx.strokeStyle = '#d7b98a'; ctx.lineWidth = 2; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 6, y - 18 + hit * d); ctx.lineTo(x + d * 16, y - 4 - hit * d); ctx.stroke(); }   // sticks
        }
        break;
      case 'slide':
        if (S) {
          const Sl = CFG.UPSTAIRS.slide;
          ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Sl.top.x - 10, Sl.top.y + 14, 28, Sl.bottom.y - Sl.top.y - 6);
          ctx.fillStyle = '#f2b134'; U.roundRect(ctx, Sl.top.x - 14, Sl.top.y + 8, 28, Sl.bottom.y - Sl.top.y - 4, 8); ctx.fill();
          ctx.fillStyle = '#ffd166'; ctx.fillRect(Sl.top.x - 9, Sl.top.y + 12, 18, Sl.bottom.y - Sl.top.y - 14);
          ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(Sl.top.x - 6, Sl.top.y + 14, 4, Sl.bottom.y - Sl.top.y - 20);
          ctx.fillStyle = '#e4572e'; ctx.fillRect(Sl.top.x - 16, Sl.top.y + 8, 4, Sl.bottom.y - Sl.top.y - 12); ctx.fillRect(Sl.top.x + 12, Sl.top.y + 8, 4, Sl.bottom.y - Sl.top.y - 12);   // rails
          ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Sl.entry.x - 10, Sl.entry.y - 7, 20, 14, 3); ctx.fill();   // the little step you climb on
          ctx.fillStyle = '#d7b98a'; U.roundRect(ctx, Sl.entry.x - 8, Sl.entry.y - 5, 16, 10, 2); ctx.fill();
          ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▼', Sl.top.x, Sl.top.y + 26);
        }
        break;
      case 'telescope':
        if (S) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 10, 14, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 3; for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + d * 10, y + 10); ctx.stroke(); } ctx.save(); ctx.translate(x, y - 8); ctx.rotate(-0.9); ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -6, -4, 30, 8, 3); ctx.fill(); ctx.fillStyle = '#8d9299'; U.roundRect(ctx, 20, -5, 8, 10, 3); ctx.fill(); ctx.fillStyle = '#9fd8f2'; ctx.fillRect(26, -3, 2, 6); ctx.restore(); }
        if (D) { const tw = 0.5 + 0.5 * Math.sin(t * 4); ctx.fillStyle = `rgba(255,224,138,${(0.4 + 0.6 * tw).toFixed(2)})`; ctx.font = r.font(10 + tw * 3); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', x + 22, y - 30); }
        break;
      case 'racecar':
        if (S) this.paintBed(ctx, true);
        break;
    }
  },
  // Per-frame: the moving parts of the bought decorations and the notes from the drum kit.
  dynamic(r, g) {
    if (!this.st || g.area !== 'upstairs') return;
    const C = CFG.UPSTAIRS;
    for (const it of C.items) if (this.owned(g, it.key)) this.drawItem(r, g, it, 'dynamic');
    const ctx = r.ctx;
    for (const n of this.st.notes) { ctx.globalAlpha = Math.max(0, 1 - n.t / 1.6); ctx.fillStyle = n.col; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.ch, n.x + Math.sin(n.t * 5) * 4, n.y - n.t * 30); }
    ctx.globalAlpha = 1;
  },
  updateToys(g, dt) {
    const st = this.st, p = g.player, C = CFG.UPSTAIRS, byKey = (k) => C.items.find((it) => it.key === k).spot;
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.6);
    if (this.owned(g, 'drums')) {
      const d = byKey('drums');
      if (U.dist(p.x, p.y, d.x, d.y) < 70) { st.noteT -= dt; if (st.noteT <= 0) { st.noteT = 0.45; st.notes.push({ x: d.x + U.rand(-20, 20), y: d.y - 24, ch: U.pick(['♪', '♫', '♩', '🥁']), col: U.pick(['#e4572e', '#3b7dd8', '#f2b134']), t: 0 }); } }
      else st.noteT = 0;
    }
    if (this.owned(g, 'hamster')) {
      const h = byKey('hamster'), want = U.dist(p.x, p.y, h.x, h.y) < 70 ? 7 : 0;
      st.wheelV = U.lerp(st.wheelV, want, 0.04); st.wheel += st.wheelV * dt;
    }
    if (this.owned(g, 'horse')) { const h = byKey('horse'), amp = U.dist(p.x, p.y, h.x, h.y) < 70 ? 0.18 : 0.04; st.rock = Math.sin(g.time * 3) * amp; }
  },

  // ======================= the catalog: one item per page, the ◀ ▶ buttons turn pages, the ✕ closes, the big button buys =======================
  openCatalog(g) { const c = this.st.cat, p = g.player; c.on = true; c.page = 0; c.flip = null; c.bought = 0; c.nope = 0; c.hold = { x: p.x, y: p.y }; p.moving = false; Sfx.pickup(); Haptics.tap(); UI.openCatalog({ prev: () => this.turnPage(g, -1), next: () => this.turnPage(g, 1), close: () => this.closeCatalog(g) }); },
  closeCatalog(g) { if (!this.st.cat.on) return; this.st.cat.on = false; this.st.cat.hold = null; UI.closeCatalog(); Sfx.drop(); },
  catalogPages() { return CFG.UPSTAIRS.items.length + 1; },
  turnPage(g, dir) {
    const c = this.st.cat, n = this.catalogPages(), to = c.page + dir;
    if (to < 0 || to >= n || c.flip) return;
    c.flip = { from: c.page, to, t: 0, dur: 0.32 }; c.page = to; c.bought = 0; c.nope = 0; Sfx.pickup();
  },
  catalogAction(g) {
    const c = this.st.cat, items = CFG.UPSTAIRS.items;
    if (c.page === 0) return { label: '📖 Open it up!', run: (gg) => this.turnPage(gg, 1) };
    const it = items[c.page - 1];
    if (this.owned(g, it.key)) return { label: '✅ You have this one!', run: (gg) => this.turnPage(gg, c.page < this.catalogPages() - 1 ? 1 : -1) };
    if (g.s.cash >= it.price) return { label: `🛒 Buy for ${U.money(it.price)}`, run: (gg) => this.buyItem(gg, it) };
    return { label: `💰 Need ${U.money(it.price - g.s.cash)} more`, run: (gg) => { c.nope = 1.4; Sfx.error(); } };
  },
  buyItem(g, it) {
    const c = this.st.cat;
    if (this.owned(g, it.key) || g.s.cash < it.price) return;
    g.s.cash -= it.price; g.s.upstairs.owned[it.key] = true;
    Sfx.buy(); Haptics.success(); c.bought = 1.8; c.nope = 0;
    this.nudgeOut(g, it);
    g.fx.push({ kind: 'sparkle', x0: it.spot.x, y0: it.spot.y, x1: it.spot.x, y1: it.spot.y, t: 0, dur: 0.8 });
    g.floats.push({ x: g.player.x, y: g.player.y - 50, text: `${it.ico} It's in your room!`, color: '#ffe08a', t: 0, dur: 1.6, big: true });
    g.save();
  },
  // A newly solid item must never appear under the chef: step to the nearest free spot beside it.
  nudgeOut(g, it) {
    const p = g.player, b = it.block, r = 12;
    if (!b || !(p.x + r > b[0] && p.x - r < b[0] + b[2] && p.y + r > b[1] && p.y - r < b[1] + b[3])) return;
    const cands = [[b[0] - r - 2, p.y], [b[0] + b[2] + r + 2, p.y], [p.x, b[1] - r - 2], [p.x, b[1] + b[3] + r + 2]];
    let best = null, bd = 1e9;
    for (const [x, y] of cands) { if (!this.roomFree(x, y)) continue; const d = U.dist(p.x, p.y, x, y); if (d < bd) { bd = d; best = [x, y]; } }
    if (best) { p.x = best[0]; p.y = best[1]; } else this.rescue(g);
    if (this.st.cat.hold) this.st.cat.hold = { x: p.x, y: p.y };
  },
  drawCatalog(r, g, W, H) {
    const ctx = r.ctx, c = this.st.cat, items = CFG.UPSTAIRS.items, n = this.catalogPages();
    ctx.fillStyle = 'rgba(10,8,6,0.72)'; ctx.fillRect(0, 0, W, H);
    const cw = Math.min(360, W - 32), ch = Math.min(440, H - 150), cx = W / 2, cy = 56 + (H - 128) / 2;
    // page flip: the card squashes to a spine and back, the content switches half way
    let sq = 1, page = c.page;
    if (c.flip) { const k = c.flip.t / c.flip.dur; sq = Math.abs(Math.cos(k * Math.PI)); if (k < 0.5) page = c.flip.from; }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.max(0.04, sq), 1); ctx.translate(-cx, -cy);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; U.roundRect(ctx, cx - cw / 2 + 6, cy - ch / 2 + 8, cw, ch, 16); ctx.fill();
    if (page === 0) {
      // the cover: a little bed under a night sky
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 16); ctx.fill();
      ctx.fillStyle = '#2f64b0'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, 22, ch, 16); ctx.fill();
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - cw / 2 + 36, cy - ch / 2 + 22, cw - 56, ch - 44, 10); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(Math.min(30, cw * 0.08)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🛏️ Room Catalog', cx + 8, cy - ch / 2 + 62);
      const bx = cx + 8, by = cy + 10, bs = Math.min(1.1, ch / 400);
      ctx.save(); ctx.translate(bx, by); ctx.scale(bs, bs);
      ctx.fillStyle = '#182040'; U.roundRect(ctx, -110, -80, 220, 70, 10); ctx.fill();
      ctx.fillStyle = '#ffe08a'; for (let k = 0; k < 9; k++) { const tw = 0.5 + 0.5 * Math.sin(g.time * 3 + k); ctx.globalAlpha = 0.4 + 0.6 * tw; ctx.beginPath(); ctx.arc(-95 + k * 24, -66 + (k % 3) * 16, 2 + tw, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(80, -50, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#182040'; ctx.beginPath(); ctx.arc(74, -54, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c99a5f'; ctx.fillRect(-110, -10, 220, 70);
      ctx.save(); ctx.translate(0, 20); ctx.scale(0.55, 0.55); ctx.translate(-(CFG.UPSTAIRS.bed.x0 + CFG.UPSTAIRS.bed.x1) / 2, -(CFG.UPSTAIRS.bed.y0 + CFG.UPSTAIRS.bed.y1) / 2); this.paintBed(ctx, this.owned(g, 'racecar')); ctx.restore();
      ctx.restore();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(15); ctx.fillText(`${items.length} fun things for your room`, cx + 8, cy + ch / 2 - 72);
      ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(14); ctx.fillText('Tap ◀ ▶ to turn the pages', cx + 8, cy + ch / 2 - 46);
    } else {
      const it = items[page - 1], own = this.owned(g, it.key), afford = g.s.cash >= it.price;
      ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 16); ctx.fill();
      ctx.fillStyle = '#e8dcc4'; U.roundRect(ctx, cx - cw / 2, cy - ch / 2, 14, ch, 16); ctx.fill();
      ctx.fillStyle = '#2b1d14'; ctx.font = r.font(Math.min(26, cw * 0.072)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${it.ico} ${it.label}`, cx + 6, cy - ch / 2 + 40);
      // the picture, on a plain board
      const bw = cw - 60, bh = ch - 170, bx = cx + 6, by = cy - 12;
      ctx.fillStyle = '#fdf3dc'; U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.fill();
      ctx.strokeStyle = '#e8dcc4'; ctx.lineWidth = 2; U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.stroke();
      ctx.save(); ctx.beginPath(); U.roundRect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 12); ctx.clip();
      const k = it.view.s * Math.min(1, bh / 260);
      ctx.translate(bx, by + Math.sin(g.time * 1.4) * 2); ctx.scale(k, k); ctx.translate(-it.spot.x, -it.spot.y - it.view.dy);
      this.drawItem(r, g, it, 'all');
      ctx.restore();
      // price / status
      const tag = own ? '✅ In your room' : U.money(it.price);
      ctx.font = r.font(22); const tw = ctx.measureText(tag).width + 28;
      ctx.fillStyle = own ? '#2f9e44' : afford ? '#1f6e2e' : '#b8401c'; U.roundRect(ctx, cx + 6 - tw / 2, cy + ch / 2 - 74, tw, 34, 17); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(tag, cx + 6, cy + ch / 2 - 57);
      if (c.bought > 0) { ctx.globalAlpha = Math.min(1, c.bought); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(18); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,29,20,0.85)'; const yy = by - bh / 2 + 22 - (1.8 - c.bought) * 10; ctx.strokeText("✨ It's in your room! ✨", bx, yy); ctx.fillText("✨ It's in your room! ✨", bx, yy); ctx.globalAlpha = 1; }
      if (c.nope > 0) { ctx.globalAlpha = Math.min(1, c.nope); ctx.fillStyle = '#b8401c'; ctx.font = r.font(13); ctx.fillText('Earn more at the pizzeria 🍕', cx + 6, cy + ch / 2 - 32); ctx.globalAlpha = 1; }
    }
    // page counter and the arrows
    ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${page + 1} / ${n}`, cx + 6, cy + ch / 2 - 16);
    ctx.restore();
    UI.placeCatalog({ x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch }, page > 0, page < n - 1);   // the ✕ and ◀ ▶ buttons sit on the card
  },

  // ======================= the owner's drawings: one picture per slot, each hung in its own frame =======================
  // A slot says where its picture is saved (`get`/`set`), where it hangs (`area` + `frame()`, for the sparkle) and
  // what the chef says once it is up (`hung`). 'bedroom' is the desk upstairs: its picture hangs on the bedroom wall
  // and, copied, in the dining room. Other files add slots with `UpstairsExt.addArtSlot(name, spec)` and paint
  // their own frame from `UpstairsExt.art(g, name)`.
  artSlots: {
    bedroom: {
      get: (g) => g.s.upstairs && g.s.upstairs.drawing,
      set: (g, url) => { g.s.upstairs.drawing = url; },
      area: 'upstairs', frame: () => CFG.UPSTAIRS.art.room, hung: '🖼️ Hung on the wall!',
    },
  },
  addArtSlot(name, spec) { this.artSlots[name] = spec; },
  img: null, imgN: 0, arts: {},   // `img` is the bedroom slot's picture (kept for the bedroom code and its tests)
  // A slot's saved PNG as a loaded image record { src, el, ok, n }, or null. It loads asynchronously; the bgKeys
  // change once it has (`ok`, and `n` counts every new picture), so the cached backgrounds rebuild with it.
  art(g, name) {
    const S = this.artSlots[name], d = S && S.get(g);
    let rec = this.arts[name] || null;
    if (!d) rec = null;
    else if (!rec || rec.src !== d) {
      const el = new Image(), nr = { src: d, el, ok: false, n: ++this.imgN };
      el.onload = () => { nr.ok = true; };
      el.src = d; rec = nr;
    }
    this.arts[name] = rec;
    if (name === 'bedroom') this.img = rec;
    return rec;
  },
  ensureArt(g) { this.art(g, 'bedroom'); },
  bgKey(g) {
    if (!g.s.upstairs) return '';
    this.ensureArt(g);
    return 'up:' + CFG.UPSTAIRS.items.map((it) => this.owned(g, it.key) ? 1 : 0).join('') + ':' + (this.img && this.img.ok ? this.img.n : 0);
  },
  paintArt(ctx, x, y, w, h, el) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - w / 2 - 2, y - h / 2 - 1, w + 8, h + 8, 3); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, 3); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    try { ctx.drawImage(el || this.img.el, x - w / 2, y - h / 2, w, h); } catch (e) { /* a broken image just leaves the frame empty */ }
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x, y - h / 2 - 4, 2, 0, Math.PI * 2); ctx.fill();   // the nail
  },

  // ======================= the drawing pad: a DOM overlay over the game =======================
  pad: null,
  padColors: ['#2b1d14', '#e4572e', '#f2b134', '#2f9e44', '#3b7dd8', '#9c6bd8', '#ff8fab', '#8d5a2b'],
  padSizes: [4, 10, 22],
  buildPad() {
    if (this.pad) return this.pad;
    const el = document.createElement('div'); el.id = 'modal-draw'; el.className = 'modal hidden';
    el.innerHTML = `<style>
      .draw-card { width: min(640px, 100%); }
      .draw-body { padding: 10px; display: flex; flex-direction: column; gap: 10px; overflow: auto; align-items: center; flex: 1; }
      #draw-canvas { touch-action: none; background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); aspect-ratio: 4 / 3; width: min(100%, calc(52vh * 4 / 3)); height: auto; cursor: crosshair; }
      .draw-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; }
      .draw-sw { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 0 0 2px #e9c48a; cursor: pointer; padding: 0; font-size: 20px; }
      .draw-sw.on { border-color: #2b1d14; transform: scale(1.12); }
      .draw-sz { width: 54px; height: 44px; border-radius: 12px; border: 3px solid #e9c48a; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
      .draw-sz.on { border-color: #2b1d14; background: #fff3d6; }
      .draw-sz i { display: block; background: #2b1d14; border-radius: 50%; }
      .draw-actions .btn { flex: 1; min-height: 48px; font-size: 16px; min-width: 0; white-space: normal; }
      @media (max-width: 700px) { #draw-canvas { width: 100%; } .draw-actions #draw-hang { flex: 1 1 100%; } }
    </style>
    <div class="modal-card pizza-card draw-card">
      <div class="modal-head"><h2>✏️ Draw a picture</h2><button id="draw-close" class="close" aria-label="Close">✕</button></div>
      <div class="draw-body">
        <canvas id="draw-canvas" width="480" height="360"></canvas>
        <div class="draw-row" id="draw-colors"></div>
        <div class="draw-row" id="draw-sizes"></div>
        <div class="draw-row draw-actions"><button id="draw-clear" class="btn danger">🧽 Clear</button><button id="draw-done" class="btn">✅ Done</button><button id="draw-hang" class="btn primary">🖼️ Hang it on the wall</button></div>
      </div>
    </div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('#draw-canvas'), ctx = cv.getContext('2d');
    // `slot`: whose picture is on the pad; `drafts`: each slot's canvas as it was left (unsaved strokes stay put)
    const pad = this.pad = { el, cv, ctx, color: this.padColors[0], size: this.padSizes[1], eraser: false, down: false, last: null, dirty: false, slot: null, drafts: {} };
    const colors = el.querySelector('#draw-colors'), sizes = el.querySelector('#draw-sizes');
    const pick = (row, sel) => { for (const b of row.children) b.classList.toggle('on', b === sel); };
    for (const col of this.padColors.concat(['eraser'])) {
      const b = document.createElement('button'); b.className = 'draw-sw'; b.type = 'button';
      if (col === 'eraser') { b.textContent = '🧽'; b.style.background = '#fff'; b.title = 'Eraser'; } else { b.style.background = col; b.title = col; }
      b.addEventListener('click', () => { pad.eraser = col === 'eraser'; if (!pad.eraser) pad.color = col; pick(colors, b); });
      colors.appendChild(b);
    }
    pick(colors, colors.children[0]);
    this.padSizes.forEach((sz, i) => {
      const b = document.createElement('button'); b.className = 'draw-sz'; b.type = 'button'; b.innerHTML = `<i style="width:${6 + i * 8}px;height:${6 + i * 8}px"></i>`;
      b.addEventListener('click', () => { pad.size = sz; pick(sizes, b); });
      sizes.appendChild(b);
    });
    pick(sizes, sizes.children[1]);
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } pad.down = true; const q = pos(e); pad.last = q; this.padStroke(q.x, q.y, q.x, q.y); });
    cv.addEventListener('pointermove', (e) => { if (!pad.down) return; e.preventDefault(); const q = pos(e); this.padStroke(pad.last.x, pad.last.y, q.x, q.y); pad.last = q; });
    const up = (e) => { if (!pad.down) return; pad.down = false; pad.last = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    el.querySelector('#draw-clear').addEventListener('click', () => { this.padClear(); pad.dirty = true; });
    el.querySelector('#draw-done').addEventListener('click', () => this.closePad(Game));
    el.querySelector('#draw-close').addEventListener('click', () => this.closePad(Game));
    el.querySelector('#draw-hang').addEventListener('click', () => this.hangDrawing(Game));
    this.padClear();
    return pad;
  },
  padClear() { const p = this.buildPad(); p.ctx.fillStyle = '#fff'; p.ctx.fillRect(0, 0, p.cv.width, p.cv.height); p.dirty = false; },
  // A brush stroke from (x0, y0) to (x1, y1) in canvas pixels, with the current colour and size (the eraser paints white).
  padStroke(x0, y0, x1, y1) {
    const p = this.buildPad(), c = p.ctx;
    c.strokeStyle = p.eraser ? '#fff' : p.color; c.lineWidth = p.eraser ? p.size * 2 : p.size; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 === x0 && y1 === y0 ? x1 + 0.01 : x1, y1); c.stroke();
    p.dirty = true;
  },
  // Open the pad for a slot ('bedroom' by default): the chef stays where they stand until it closes.
  openPad(g, slot) {
    if (!this.st) this.build(g);
    if (!slot || !this.artSlots[slot]) slot = 'bedroom';
    const p = this.buildPad(), pl = g.player, st = this.st;
    st.draw.on = true; st.draw.slot = slot; st.draw.hold = { x: pl.x, y: pl.y }; pl.moving = false;
    // the canvas as this slot's pad was left; else the picture already on its wall, so it can be touched up
    const draft = p.drafts[slot], rec = this.art(g, slot);
    this.padClear(); p.slot = slot;
    if (draft) { try { p.ctx.putImageData(draft.data, 0, 0); } catch (e) { /* ignore */ } p.dirty = draft.dirty; }
    else if (rec && rec.ok) { try { p.ctx.drawImage(rec.el, 0, 0, p.cv.width, p.cv.height); } catch (e) { /* ignore */ } }
    p.el.classList.remove('hidden');
    Sfx.pickup(); Haptics.tap();
  },
  closePad(g) {
    const p = this.pad;
    if (p) {
      p.el.classList.add('hidden'); p.down = false; p.last = null;
      if (p.slot) { try { p.drafts[p.slot] = { data: p.ctx.getImageData(0, 0, p.cv.width, p.cv.height), dirty: p.dirty }; } catch (e) { delete p.drafts[p.slot]; } }
    }
    if (this.st) { this.st.draw.on = false; this.st.draw.hold = null; }
    Sfx.drop();
  },
  // Shrink the picture to a tiny PNG, save it in the open slot, and hang it in that slot's frame(s).
  hangDrawing(g) {
    const p = this.buildPad(), [w, h] = CFG.UPSTAIRS.art.size;
    const slot = (this.st && this.st.draw.slot) || p.slot || 'bedroom', S = this.artSlots[slot] || this.artSlots.bedroom;
    const small = document.createElement('canvas'); small.width = w; small.height = h;
    const sc = small.getContext('2d'); sc.fillStyle = '#fff'; sc.fillRect(0, 0, w, h); sc.drawImage(p.cv, 0, 0, w, h);
    let url = null;
    try { url = small.toDataURL('image/png'); } catch (e) { url = null; }
    if (!url) { g.toast('Oops, could not save that one'); return; }
    S.set(g, url); this.art(g, slot); p.dirty = false; g.save();
    Sfx.buy(); Haptics.success();
    const A = S.frame && S.frame(g);
    if (A && (!S.area || S.area === g.area)) g.fx.push({ kind: 'sparkle', x0: A.x, y0: A.y, x1: A.x, y1: A.y, t: 0, dur: 0.8 });
    g.floats.push({ x: g.player.x, y: g.player.y - 50, text: S.hung || '🖼️ Hung on the wall!', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    this.closePad(g);
  },
};
Game.ext.push(UpstairsExt);
Render.ext.push(UpstairsExt);
