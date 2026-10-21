'use strict';
// The flower shop: City building 13 (middle row, facing Market Street) gets a '🌸 FLOWERS 🌷' sign, buckets of blooms
// on the sidewalk and butterflies by the door. Step inside for a shop full of colour: buckets of tulips, sunflowers,
// roses and daisies, hanging baskets swaying from the ceiling, a watering can to pick up and pour on a thirsty plant
// (it perks up and blooms with sparkles), butterflies that flutter around the chef, a bee that visits the flowers,
// a florist arranging a bouquet behind the counter, a potting table where one press plants a seed that grows into a
// flower in ten seconds, a $4 flower the chef tucks behind the hat, a $7 bouquet to carry, and a sleepy shop cat.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.FLOWERS = {
  BUILDING: 13,                                  // index in CFG.CITY.BUILDINGS: { x0: 6052, y0: 180, x1: 6190, y1: 456 }
  DOOR_OUT: { x: 6121, y: 470 },                 // on the Market Street sidewalk just below the door
  WORLD: { x0: 10400, y0: 3000, x1: 11000, y1: 3400 },
  ROOM: { x0: 10440, y0: 3100, x1: 10960, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: baskets hang in front of it
  BASKETS: [{ x: 10500, y: 3058 }, { x: 10620, y: 3052 }, { x: 10840, y: 3056 }, { x: 10940, y: 3050 }],   // hanging from the ceiling
  SHELF: { x0: 10450, y0: 3040, x1: 10600, y1: 3094 },         // vases on the back wall, left of the counter
  BUCKETS: [                                                    // along the back wall and the left wall
    { x: 10470, y: 3118, kind: 'tulip' }, { x: 10512, y: 3118, kind: 'sunflower' }, { x: 10556, y: 3118, kind: 'rose' }, { x: 10600, y: 3118, kind: 'daisy' },
    { x: 10462, y: 3178, kind: 'rose' }, { x: 10462, y: 3230, kind: 'tulip' },
    { x: 10822, y: 3118, kind: 'lavender' },
  ],
  COUNTER: { x0: 10640, y0: 3136, x1: 10800, y1: 3168 }, FLORIST: { x: 10722, y: 3126 }, VASE: { x: 10672, y: 3134 },
  PADS: { flower: { x: 10676, y: 3216 }, bouquet: { x: 10766, y: 3216 } },
  TABLE: { x0: 10856, y0: 3122, x1: 10944, y1: 3160 }, POT: { x: 10900, y: 3126 }, TABLE_SPOT: { x: 10900, y: 3186 },
  WILTED: { x: 10900, y: 3254 },                 // the thirsty plant in its big pot
  CAN_HOME: { x: 10606, y: 3300 },               // the watering can waits on the floor by the door
  CAT: { x: 10484, y: 3306 },                    // asleep on a sack among the pots in the corner
  CORNER_POTS: [{ x: 10452, y: 3326 }, { x: 10520, y: 3328 }, { x: 10940, y: 3318 }],
  EXIT: { x: 10700, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  GROW: 10, FLOWER: 30, BOUQUET: 30, BLOOM: 45, POUR: 1.6,   // seconds: the seed's growth, the flower and bouquet, the plant's bloom, the pour
};
CFG.AREAS.flowers = { WORLD: CFG.FLOWERS.WORLD };

const FlowersExt = {
  name: 'flowers',
  st: null,
  defaults: { flowers: { seen: false, watered: 0, planted: 0, flowers: 0, bouquets: 0 } },
  COLS: { tulip: ['#ff5c8a', '#ffd166', '#ff7043'], sunflower: ['#ffd166'], rose: ['#e53935', '#ff8fab'], daisy: ['#fff8ee'], lavender: ['#9b7fe0'] },

  // ---------- state ----------
  build(g) {
    const F = CFG.FLOWERS;
    if (!g.s.flowers) g.s.flowers = { seen: false, watered: 0, planted: 0, flowers: 0, bouquets: 0 };
    this.st = {
      fade: 0,
      can: false, pour: 0, pourAt: null,                             // carrying the watering can; seconds left of pouring and where the chef stands
      plant: { perk: 0, bloom: 0 },                                  // perk 0 = drooping .. 1 = standing tall; bloom = seconds of bloom left
      pot: null,                                                     // { t, done } once a seed is planted
      flower: 0, bouquet: 0,                                         // seconds left carrying them
      butterflies: [], bee: { x: F.BUCKETS[0].x, y: F.BUCKETS[0].y - 40, i: 0, pause: 1, flap: 0 },
      florist: { t: 0, stems: 0, lift: 0 }, cat: { z: [], zt: 0 },
      obs: null,
    };
    const cols = ['#ff8fab', '#4dd0e1', '#ffd166', '#b39ddb', '#ff7043'];
    for (let i = 0; i < 3; i++) this.st.butterflies.push({ x: F.EXIT.x + (i - 1) * 30, y: F.EXIT.y - 60, a: i * 2.1, r: 34 + i * 12, spd: 1.1 + i * 0.25, col: cols[i], flap: i, wob: i * 1.7 });
    const R = F.ROOM, w = F.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    for (const b of F.BUCKETS) o.push({ x: b.x - 14, y: b.y - 10, w: 28, h: 22 });
    o.push({ x: F.COUNTER.x0, y: R.y0, w: F.COUNTER.x1 - F.COUNTER.x0, h: F.COUNTER.y1 - R.y0 });
    o.push({ x: F.TABLE.x0, y: R.y0, w: F.TABLE.x1 - F.TABLE.x0, h: F.TABLE.y1 - R.y0 });
    o.push({ x: F.WILTED.x - 16, y: F.WILTED.y - 12, w: 32, h: 26 });
    o.push({ x: R.x0, y: F.CAT.y - 20, w: 100, h: R.y1 - F.CAT.y + 20 });            // the cat's corner with its pots
    o.push({ x: F.CORNER_POTS[2].x - 18, y: F.CORNER_POTS[2].y - 16, w: 36, h: 30 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'flowers' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.FLOWERS.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.FLOWERS.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  near(g, s, d) { return U.dist(g.player.x, g.player.y, s.x, s.y) < d; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const F = CFG.FLOWERS, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'flowers') return null;
    if (st.pour > 0) return null;
    if (this.near(g, F.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (st.can && this.near(g, F.WILTED, 44)) return { label: '💧 Water the plant', run: (gg) => this.water(gg) };
    if (!st.can && this.near(g, F.CAN_HOME, 34)) return { label: '💧 Take the watering can', run: (gg) => this.takeCan(gg) };
    if (this.near(g, F.TABLE_SPOT, 34) && (!st.pot || st.pot.done)) return { label: '🌱 Plant a seed', run: (gg) => this.plantSeed(gg) };
    return null;
  },
  enter(g) {
    const F = CFG.FLOWERS, p = g.player;
    g.area = 'flowers'; p.x = F.EXIT.x; p.y = F.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    for (const b of this.st.butterflies) { b.x = p.x + U.rand(-40, 40); b.y = p.y - 50; }
    if (!g.s.flowers.seen) { g.s.flowers.seen = true; g.toast('🌸 Welcome to the flower shop!', true); }
  },
  leave(g) {
    const F = CFG.FLOWERS, p = g.player;
    g.area = 'city'; p.x = F.DOOR_OUT.x; p.y = F.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.can = false; this.st.pour = 0; this.st.fade = 0.45; Sfx.drop();
  },
  takeCan(g) {
    this.st.can = true; Sfx.pickup(); Haptics.tap();
    g.floats.push({ x: g.player.x, y: g.player.y - 60, text: 'Got the watering can! 💧', color: '#9ad0ff', t: 0, dur: 1.4, big: true });
  },
  water(g) {
    const F = CFG.FLOWERS, p = g.player;
    this.st.pour = F.POUR; this.st.pourAt = { x: p.x, y: p.y }; p.moving = false; p.facing = p.x <= F.WILTED.x ? 1 : -1; Sfx.pickup(); Haptics.tap();
  },
  plantSeed(g) {
    const p = g.player;
    this.st.pot = { t: 0, done: false }; p.facing = 1; Sfx.pickup(); Haptics.tap();
    g.floats.push({ x: CFG.FLOWERS.POT.x, y: CFG.FLOWERS.POT.y - 40, text: "It's growing! 🌱", color: '#8ef0a0', t: 0, dur: 1.6, big: true });
  },
  home(g) { if (!this.st) return; this.st.can = false; this.st.pour = 0; this.st.fade = 0; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, F = CFG.FLOWERS;
    if (this.free(p.x, p.y)) return false;
    p.x = F.EXIT.x; p.y = F.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, F = CFG.FLOWERS;
    st.fade = Math.max(0, st.fade - dt);
    st.flower = Math.max(0, st.flower - dt);
    st.bouquet = Math.max(0, st.bouquet - dt);
    // the planted seed keeps growing and the watered plant keeps blooming while the chef is away
    if (st.pot && !st.pot.done) {
      st.pot.t += dt;
      if (st.pot.t >= F.GROW) {
        st.pot.done = true; g.s.flowers.planted++;
        if (g.area === 'flowers') {
          for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: F.POT.x + U.rand(-14, 14), y0: F.POT.y - 30 + U.rand(-10, 8), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
          g.floats.push({ x: F.POT.x, y: F.POT.y - 48, text: '🌸 Bloom!', color: '#ff8fab', t: 0, dur: 1.8, big: true });
          Sfx.chime(); Haptics.success();
        }
      }
    }
    const pl = st.plant;
    if (pl.bloom > 0) { pl.bloom = Math.max(0, pl.bloom - dt); pl.perk = Math.min(1, pl.perk + dt * 1.2); }
    else pl.perk = Math.max(0, pl.perk - dt * 0.5);
    if (g.area !== 'flowers') { st.can = false; st.pour = 0; return; }
    // pouring: the chef stands still, then the plant perks up with sparkles and the can hops back to its spot
    if (st.pour > 0) {
      if (st.pourAt) { p.x = st.pourAt.x; p.y = st.pourAt.y; }   // stand still by the pot
      p.moving = false;
      st.pour -= dt;
      if (st.pour <= 0) {
        st.pour = 0; st.can = false; pl.bloom = F.BLOOM; g.s.flowers.watered++;
        for (let i = 0; i < 6; i++) g.fx.push({ kind: 'sparkle', x0: F.WILTED.x + U.rand(-18, 18), y0: F.WILTED.y - 36 + U.rand(-14, 10), x1: 0, y1: 0, t: -i * 0.07, dur: 0.6 });
        g.floats.push({ x: F.WILTED.x, y: F.WILTED.y - 60, text: "Ahh, that's better! 🌸", color: '#ff8fab', t: 0, dur: 1.8, big: true });
        Sfx.chime(); Haptics.success();
      }
    } else this.rescue(g);
    // butterflies flutter around the chef
    for (const b of st.butterflies) {
      b.a += dt * b.spd; b.flap += dt * 18; b.wob += dt * 0.7;
      const tx = p.x + Math.cos(b.a) * b.r, ty = p.y - 34 + Math.sin(b.a * 1.3 + b.wob) * b.r * 0.45 - Math.sin(b.wob * 2) * 10;
      b.x += (tx - b.x) * Math.min(1, dt * 2.2); b.y += (ty - b.y) * Math.min(1, dt * 2.2);
    }
    // the bee visits one bucket after another
    const bee = st.bee, tgt = F.BUCKETS[bee.i]; bee.flap += dt * 30;
    if (bee.pause > 0) { bee.pause -= dt; bee.x += Math.sin(g.time * 9) * 0.3; bee.y += Math.cos(g.time * 7) * 0.3; if (bee.pause <= 0) { bee.i = (bee.i + 1 + U.randInt(0, F.BUCKETS.length - 2)) % F.BUCKETS.length; } }
    else if (U.moveToward(bee, tgt.x + 6, tgt.y - 34, 70, dt)) bee.pause = U.rand(1.2, 2.2);
    // the florist adds a stem to the vase every so often; a finished bouquet sparkles and a new one starts
    const fl = st.florist; fl.t += dt; fl.lift = Math.max(0, fl.lift - dt);
    if (fl.t > 2.2) { fl.t = 0; fl.lift = 0.5; fl.stems++; if (fl.stems > 6) { fl.stems = 1; for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: F.VASE.x + U.rand(-10, 10), y0: F.VASE.y - 28 + U.rand(-8, 8), x1: 0, y1: 0, t: -i * 0.1, dur: 0.6 }); } }
    // the cat snores
    for (const z of st.cat.z) z.t += dt;
    st.cat.z = st.cat.z.filter((z) => z.t < 2);
    st.cat.zt -= dt; if (st.cat.zt <= 0) { st.cat.zt = 1.4; st.cat.z.push({ t: 0, dx: U.rand(-4, 4) }); }
  },
  pads(g) {
    if (g.area !== 'flowers') return [];
    const P = CFG.FLOWERS.PADS;
    return [
      { key: 'flowersFlower', label: 'A flower', ico: '🌷', pos: P.flower, price: 4, sub: 'for your hat' },
      { key: 'flowersBouquet', label: 'A bouquet', ico: '💐', pos: P.bouquet, price: 7, sub: 'so pretty!' },
    ];
  },
  onPad(g, pad) {
    const p = g.player, F = CFG.FLOWERS;
    if (pad.key === 'flowersFlower') { this.st.flower = F.FLOWER; g.s.flowers.flowers++; g.floats.push({ x: p.x, y: p.y - 70, text: 'A flower for your hat! 🌷', color: '#ff8fab', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'flowersBouquet') { this.st.bouquet = F.BOUQUET; g.s.flowers.bouquets++; g.floats.push({ x: p.x, y: p.y - 70, text: 'A big bouquet! 💐', color: '#ff8fab', t: 0, dur: 1.5, big: true }); }
    else return;
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, F = CFG.FLOWERS, st = this.st, s = g.s.flowers;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, F.DOOR_OUT.x, F.DOOR_OUT.y);
      if (d < 70) return { text: 'Visit the flower shop! 🌸', target: d < 30 ? null : F.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'flowers') return undefined;
    if (st.pour > 0) return { text: 'Glug glug glug… 💧', target: null };
    if (st.can) return { text: 'Water the thirsty plant! 💧', target: F.WILTED };
    if (!s.watered && st.plant.bloom <= 0) return { text: 'Pick up the watering can! 💧', target: F.CAN_HOME };
    if (!s.planted && !st.pot) return { text: 'Plant a seed at the potting table! 🌱', target: F.TABLE_SPOT };
    if (st.pot && !st.pot.done) return { text: "It's growing! 🌱", target: null };
    if (st.flower > 0 || st.bouquet > 0) return { text: 'So pretty! 🌷', target: null };
    if (!s.flowers && g.s.cash + (g.s.padPaid.flowersFlower || 0) >= 4) return { text: 'Buy a flower! 🌷', target: F.PADS.flower };
    if (st.plant.bloom <= 0) return { text: 'The plant is thirsty! 💧', target: F.CAN_HOME };
    return { text: 'Smell the flowers! 🌸', target: null };
  },

  // ---------- drawing helpers ----------
  // one flower on a stem: the base at (x, y), the blossom `h` above, leaning `lean` px to the right
  drawFlower(ctx, x, y, kind, h, lean, col, sc) {
    sc = sc || 1; col = col || this.COLS[kind][0];
    const tx = x + lean, ty = y - h;
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 2 * sc; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - h * 0.5, tx, ty + 4 * sc); ctx.stroke();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.ellipse(x - 4 * sc, y - h * 0.45, 5 * sc, 2.2 * sc, -0.6, 0, Math.PI * 2); ctx.fill();
    if (kind === 'tulip') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(tx - 6 * sc, ty + 4 * sc); ctx.lineTo(tx - 6 * sc, ty - 6 * sc); ctx.lineTo(tx - 2 * sc, ty - 2 * sc); ctx.lineTo(tx, ty - 7 * sc); ctx.lineTo(tx + 2 * sc, ty - 2 * sc); ctx.lineTo(tx + 6 * sc, ty - 6 * sc); ctx.lineTo(tx + 6 * sc, ty + 4 * sc); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(tx - 4 * sc, ty - 3 * sc, 2 * sc, 6 * sc);
    } else if (kind === 'sunflower') {
      ctx.fillStyle = col; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * 7 * sc, ty + Math.sin(a) * 7 * sc, 4 * sc, 2.4 * sc, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#6b3e1e'; ctx.beginPath(); ctx.arc(tx, ty, 4.5 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(tx - 1.5 * sc, ty - 1.5 * sc, 1.5 * sc, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'rose') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, ty, 6.5 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2 * sc; ctx.beginPath(); for (let a = 0; a < Math.PI * 3.5; a += 0.3) { const rr = a / (Math.PI * 3.5) * 5 * sc; const px = tx + Math.cos(a) * rr, py = ty + Math.sin(a) * rr; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
    } else if (kind === 'daisy') {
      ctx.fillStyle = col; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * 5 * sc, ty + Math.sin(a) * 5 * sc, 3.6 * sc, 2 * sc, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(tx, ty, 3 * sc, 0, Math.PI * 2); ctx.fill();
    } else {   // lavender: a spike of little purple dots
      ctx.fillStyle = col; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(tx + (k % 2 ? 2 : -2) * sc, ty + 6 * sc - k * 2.6 * sc, 2.2 * sc, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  drawBucket(ctx, b, t) {
    const sway = t === undefined ? 0 : Math.sin(t * 1.3 + b.x * 0.01) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(b.x + 2, b.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    const cols = this.COLS[b.kind];
    for (let k = 0; k < 5; k++) this.drawFlower(ctx, b.x - 6 + k * 3, b.y - 6, b.kind, 24 + ((k * 7) % 3) * 4, (k - 2) * 5 + sway, cols[k % cols.length], 0.9);
    ctx.fillStyle = '#7fa8c9'; ctx.beginPath(); ctx.moveTo(b.x - 12, b.y - 8); ctx.lineTo(b.x + 12, b.y - 8); ctx.lineTo(b.x + 9, b.y + 12); ctx.lineTo(b.x - 9, b.y + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5c8ab0'; ctx.fillRect(b.x - 12, b.y - 8, 24, 3); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(b.x - 8, b.y - 4, 3, 13);
    ctx.strokeStyle = '#5c8ab0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y - 8, 10, Math.PI, 0); ctx.stroke();
  },
  drawPotFlower(ctx, x, y, big) {   // a terracotta pot with a leafy plant
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 10, big ? 16 : 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    const w = big ? 14 : 10, h = big ? 18 : 13;
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.moveTo(x - w, y - h + 6); ctx.lineTo(x + w, y - h + 6); ctx.lineTo(x + w - 3, y + 8); ctx.lineTo(x - w + 3, y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x - w - 1, y - h + 2, 2 * w + 2, 5);
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y - h - 6, big ? 11 : 8, 0, Math.PI * 2); ctx.arc(x - (big ? 9 : 7), y - h - 1, big ? 7 : 5, 0, Math.PI * 2); ctx.arc(x + (big ? 9 : 7), y - h - 1, big ? 7 : 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(x - 2, y - h - 9, big ? 4 : 3, 0, Math.PI * 2); ctx.fill();
  },
  drawButterfly(ctx, b, t) {
    const open = 0.35 + Math.abs(Math.sin(b.flap)) * 0.65;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = b.col;
    for (const d of [-1, 1]) { ctx.save(); ctx.scale(d * open, 1); ctx.beginPath(); ctx.ellipse(5, -2, 6, 4.5, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(4, 4, 4, 3, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(6, -2.5, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = b.col; ctx.restore(); }
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -1.2, -5, 2.4, 11, 1.2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-2.5, -9); ctx.moveTo(0, -5); ctx.lineTo(2.5, -9); ctx.stroke();
    ctx.restore();
  },
  drawBee(ctx, bee) {
    const x = bee.x, y = bee.y + Math.sin(bee.flap * 0.3) * 1.5;
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; const wo = 0.5 + Math.abs(Math.sin(bee.flap)) * 0.6;
    ctx.beginPath(); ctx.ellipse(x - 2, y - 5, 4 * wo, 2.5, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 2, y - 5, 4 * wo, 2.5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(x - 3, y - 5, 2, 10); ctx.fillRect(x + 1, y - 5, 2, 10); ctx.restore();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x - 5, y - 1, 1, 0, Math.PI * 2); ctx.fill();
  },
  drawCan(ctx, x, y, tilt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt || 0);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(2, 9, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#41b883'; U.roundRect(ctx, -9, -8, 18, 16, 3); ctx.fill();
    ctx.fillStyle = '#2f9e44'; ctx.fillRect(-9, -8, 18, 3);
    ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -8, 7, Math.PI, 0); ctx.stroke();   // top handle
    ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(19, -12); ctx.stroke();   // spout
    ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(19, -12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-6, -4, 3, 10);
    ctx.restore();
  },
  drawCat(ctx, t) {
    const C = CFG.FLOWERS.CAT, x = C.x, y = C.y, br = Math.sin(t * 2) * 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 6, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4a65b'; ctx.beginPath(); ctx.ellipse(x, y - 2 - br * 0.5, 20, 10 + br, 0, 0, Math.PI * 2); ctx.fill();   // curled body
    ctx.strokeStyle = '#c98a3e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y - 10); ctx.lineTo(x - 2, y - 4); ctx.moveTo(x + 2, y - 11); ctx.lineTo(x + 6, y - 5); ctx.stroke();   // stripes
    ctx.strokeStyle = '#e4a65b'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 14, y + 2); ctx.quadraticCurveTo(x + 26, y + 4 + Math.sin(t * 0.8) * 2, x + 22, y - 8); ctx.stroke();   // tail
    ctx.fillStyle = '#e4a65b'; ctx.beginPath(); ctx.arc(x - 12, y - 2, 9, 0, Math.PI * 2); ctx.fill();   // head
    ctx.beginPath(); ctx.moveTo(x - 19, y - 7); ctx.lineTo(x - 17, y - 16); ctx.lineTo(x - 11, y - 10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 5, y - 7); ctx.lineTo(x - 7, y - 16); ctx.lineTo(x - 13, y - 10); ctx.closePath(); ctx.fill();   // ears
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.moveTo(x - 17, y - 8); ctx.lineTo(x - 16, y - 13); ctx.lineTo(x - 13, y - 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 16, y - 3, 2, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 9, y - 3, 2, 0.2, Math.PI - 0.2); ctx.stroke();   // closed eyes
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.arc(x - 12.5, y, 1.3, 0, Math.PI * 2); ctx.fill();   // nose
    ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 0.8; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x - 12.5 + d * 3, y); ctx.lineTo(x - 12.5 + d * 10, y - 2); ctx.moveTo(x - 12.5 + d * 3, y + 1); ctx.lineTo(x - 12.5 + d * 10, y + 2.5); ctx.stroke(); }
  },

  // ---------- the City outside: the sign, buckets by the door (static) and butterflies (live) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.FLOWERS.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🌸 FLOWERS 🌷';
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
    // buckets of blooms either side of the door, against the shop front (the sidewalk in front stays clear)
    for (const [dx, kind] of [[-52, 'tulip'], [-30, 'sunflower'], [30, 'rose'], [52, 'daisy']]) {
      const x = cx + dx, y = b.y1 + 6, cols = this.COLS[kind];
      for (let k = 0; k < 4; k++) this.drawFlower(ctx, x - 4 + k * 3, y - 4, kind, 18 + (k % 2) * 4, (k - 1.5) * 4, cols[k % cols.length], 0.75);
      ctx.fillStyle = '#7fa8c9'; ctx.beginPath(); ctx.moveTo(x - 9, y - 6); ctx.lineTo(x + 9, y - 6); ctx.lineTo(x + 7, y + 8); ctx.lineTo(x - 7, y + 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5c8ab0'; ctx.fillRect(x - 9, y - 6, 18, 2.5);
    }
    // a flowery welcome mat on the sidewalk in front of the door
    const D = CFG.FLOWERS.DOOR_OUT;
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(D.x - 15, D.y - 6, 30, 10); ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
    ctx.fillStyle = '#fff8ee'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(D.x - 9 + k * 9, D.y - 1, 2.2, 0, Math.PI * 2); ctx.fill(); }
  },

  // ---------- the interior, static ----------
  paint: { flowers(r, g) { FlowersExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, F = CFG.FLOWERS, W = F.WORLD, R = F.ROOM, w = F.WALL;
    // outside the shop: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, F.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - F.BACK_TOP);
    // floor: warm terracotta tiles with a petal here and there
    const ts = 26;
    for (let y = R.y0, j = 0; y < R.y1; y += ts, j++) for (let x = R.x0, i = 0; x < R.x1; x += ts, i++) { ctx.fillStyle = (i + j) % 2 ? '#e9c9a6' : '#f3dcc0'; ctx.fillRect(x, y, Math.min(ts, R.x1 - x), Math.min(ts, R.y1 - y)); }
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; for (let y = R.y0; y < R.y1; y += ts) for (let x = R.x0; x < R.x1; x += ts) ctx.fillRect(x + 2, y + 2, 7, 2);
    const petals = ['#ff8fab', '#ffd166', '#fff8ee', '#b39ddb'];
    for (let i = 0; i < 26; i++) { ctx.fillStyle = petals[i % 4]; ctx.beginPath(); ctx.ellipse(R.x0 + 20 + ((i * 97) % (R.x1 - R.x0 - 40)), R.y0 + 60 + ((i * 53) % (R.y1 - R.y0 - 80)), 3, 1.8, i, 0, Math.PI * 2); ctx.fill(); }
    // walls: a tall back wall in soft green with a trellis, a cream cornice; wooden side and bottom walls
    ctx.fillStyle = '#d7f0d2'; ctx.fillRect(R.x0 - w, F.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - F.BACK_TOP);
    ctx.strokeStyle = 'rgba(63,154,74,0.25)'; ctx.lineWidth = 2;
    for (let x = R.x0 - w; x < R.x1 + w + 60; x += 22) { ctx.beginPath(); ctx.moveTo(x, F.BACK_TOP); ctx.lineTo(x - 60, R.y0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 60, F.BACK_TOP); ctx.lineTo(x, R.y0); ctx.stroke(); }
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(R.x0 - w, F.BACK_TOP, R.x1 - R.x0 + 2 * w, 8); ctx.fillStyle = '#ff8fab'; ctx.fillRect(R.x0 - w, F.BACK_TOP + 8, R.x1 - R.x0 + 2 * w, 3);
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the shelf of vases on the back wall
    const S = F.SHELF;
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(S.x0, S.y1 - 6, S.x1 - S.x0, 6); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(S.x0, S.y1, S.x1 - S.x0, 2);
    const vases = [['#4dd0e1', 'tulip'], ['#ff7043', 'daisy'], ['#b39ddb', 'rose'], ['#41b883', 'sunflower'], ['#ffd166', 'lavender']];
    vases.forEach(([col, kind], i) => {
      const x = S.x0 + 16 + i * 30, y = S.y1 - 6;
      for (let k = 0; k < 3; k++) this.drawFlower(ctx, x - 2 + k * 2, y - 14, kind, 14 + k * 3, (k - 1) * 6, this.COLS[kind][k % this.COLS[kind].length], 0.7);
      ctx.fillStyle = col; U.roundRect(ctx, x - 7, y - 16, 14, 16, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 5, y - 13, 3, 10);
    });
    // the counter: wooden with a cream top, a till, ribbon spools and wrapping paper
    const C = F.COUNTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#b5773a'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let x = C.x0 + 10; x < C.x1 - 8; x += 20) ctx.fillRect(x, C.y0 + 12, 10, C.y1 - C.y0 - 16);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0 - 2, C.y0 - 8, C.x1 - C.x0 + 4, 18, 6); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, C.x1 - 36, C.y0 - 22, 28, 18, 4); ctx.fill(); ctx.fillStyle = '#8ef0a0'; ctx.fillRect(C.x1 - 32, C.y0 - 19, 20, 6); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(C.x1 - 31 + k * 7, C.y0 - 11, 5, 3);   // till
    for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ff8fab', '#4dd0e1', '#ffd166'][k]; ctx.beginPath(); ctx.arc(C.x0 + 100 + k * 16, C.y0 - 8, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(C.x0 + 100 + k * 16, C.y0 - 8, 2, 0, Math.PI * 2); ctx.fill(); }   // ribbon spools
    ctx.fillStyle = '#ffe9c2'; ctx.fillRect(C.x0 + 100, C.y0 - 2, 44, 6); ctx.fillStyle = 'rgba(255,143,171,0.6)'; for (let k = 0; k < 4; k++) ctx.fillRect(C.x0 + 103 + k * 11, C.y0 - 1, 3, 4);   // wrapping paper
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, C.x0 + 40, C.y1 - 24, 80, 14, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌸 FRESH FLOWERS', C.x0 + 80, C.y1 - 17);
    // the potting table: planks, a sack of soil, a trowel and spare pots
    const T = F.TABLE;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(T.x0 + 4, T.y0 + 6, T.x1 - T.x0, T.y1 - T.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, T.x0, T.y0, T.x1 - T.x0, T.y1 - T.y0, 5); ctx.fill();
    ctx.fillStyle = '#a86b36'; U.roundRect(ctx, T.x0 - 2, T.y0 - 6, T.x1 - T.x0 + 4, 14, 5); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = T.x0 + 12; x < T.x1 - 6; x += 22) ctx.fillRect(x, T.y0 - 6, 2, 14);
    ctx.fillStyle = '#6b4a2b'; U.roundRect(ctx, T.x0 + 6, T.y0 - 26, 22, 24, 6); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(T.x0 + 8, T.y0 - 26, 18, 4); ctx.fillStyle = '#fff8ee'; ctx.font = r.font(6); ctx.fillText('SOIL', T.x0 + 17, T.y0 - 13);   // sack
    ctx.fillStyle = '#b86f2d'; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(T.x1 - 26 + k * 4, T.y0 - 14 - k * 5); ctx.lineTo(T.x1 - 10 + k * 4, T.y0 - 14 - k * 5); ctx.lineTo(T.x1 - 12 + k * 4, T.y0 - 2 - k * 5); ctx.lineTo(T.x1 - 24 + k * 4, T.y0 - 2 - k * 5); ctx.closePath(); ctx.fill(); }   // stacked pots
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x0 + 36, T.y1 - 10); ctx.lineTo(T.x0 + 52, T.y1 - 16); ctx.stroke(); ctx.strokeStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(T.x0 + 52, T.y1 - 16); ctx.lineTo(T.x0 + 60, T.y1 - 19); ctx.stroke();   // trowel
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, T.x0 + 14, T.y1 + 4, 60, 12, 3); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('🌱 PLANT A SEED', T.x0 + 44, T.y1 + 10);
    // the thirsty plant's big pot (the plant itself is drawn live, it droops and perks up)
    const Wd = F.WILTED;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Wd.x + 2, Wd.y + 12, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c5e1a5'; ctx.beginPath(); ctx.moveTo(Wd.x - 16, Wd.y - 10); ctx.lineTo(Wd.x + 16, Wd.y - 10); ctx.lineTo(Wd.x + 12, Wd.y + 12); ctx.lineTo(Wd.x - 12, Wd.y + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9ccc65'; ctx.fillRect(Wd.x - 17, Wd.y - 13, 34, 6); ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.ellipse(Wd.x, Wd.y - 10, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
    // the cat's corner: a burlap sack and pots; the plant in the far corner
    ctx.fillStyle = '#d9b382'; U.roundRect(ctx, F.CAT.x - 26, F.CAT.y - 14, 56, 30, 8); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 4; k++) ctx.fillRect(F.CAT.x - 22 + k * 13, F.CAT.y - 12, 2, 26);
    for (const P of F.CORNER_POTS) this.drawPotFlower(ctx, P.x, P.y, true);
    // a watering spot mark where the can lives
    const Cn = F.CAN_HOME; ctx.fillStyle = 'rgba(77,208,225,0.25)'; ctx.beginPath(); ctx.ellipse(Cn.x, Cn.y + 6, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
    // the door in the bottom wall, its mat, and the shop's name plate below
    const E = F.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(E.x - 21, E.y - 8, 42, 14); ctx.fillStyle = '#fff8ee'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(E.x - 15 + k * 10, E.y - 1, 2.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 50, R.y1 + w + 4, 100, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🌸 FLOWERS 🌷', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the shop's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.FLOWERS.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawBaskets(r, g) {
    const ctx = r.ctx, F = CFG.FLOWERS, t = g.time;
    F.BASKETS.forEach((B, i) => {
      const a = Math.sin(t * 1.1 + i * 1.9) * 0.09, len = B.y - F.BACK_TOP;
      ctx.save(); ctx.translate(B.x, F.BACK_TOP); ctx.rotate(a);
      ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len - 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, len - 18); ctx.lineTo(-14, len - 4); ctx.moveTo(0, len - 18); ctx.lineTo(14, len - 4); ctx.stroke();
      // trailing greenery and blooms spill over the rim
      ctx.fillStyle = '#56b862'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(-12 + k * 6, len - 2 + (k % 2) * 6, 5, 8, (k - 2) * 0.3, 0, Math.PI * 2); ctx.fill(); }
      const cols = [['#ff8fab', '#ffd166', '#fff8ee'], ['#9b7fe0', '#ff7043', '#ffd166'], ['#ff5c8a', '#fff8ee', '#4dd0e1'], ['#ffd166', '#ff8fab', '#9b7fe0']][i % 4];
      for (let k = 0; k < 5; k++) { ctx.fillStyle = cols[k % 3]; ctx.beginPath(); ctx.arc(-12 + k * 6, len - 8 + ((k * 3) % 2) * 4, 3.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#a86b36'; ctx.beginPath(); ctx.moveTo(-16, len - 6); ctx.lineTo(16, len - 6); ctx.lineTo(11, len + 8); ctx.lineTo(-11, len + 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-15 + k, len - 2 + k * 3); ctx.lineTo(15 - k, len - 2 + k * 3); ctx.stroke(); }
      ctx.restore();
    });
  },
  drawWilted(r, g) {
    const ctx = r.ctx, F = CFG.FLOWERS, Wd = F.WILTED, k = this.st.plant.perk, t = g.time;
    // the stems lean over when thirsty and stand tall when watered; the blooms open with the perk
    const droop = (1 - k), sway = Math.sin(t * 1.4) * 2 * k;
    for (let s = -1; s <= 1; s++) {
      const h = 22 + 14 * k + Math.abs(s) * -4, lean = s * (8 + 6 * droop) + droop * 16 + sway;
      ctx.strokeStyle = k > 0.5 ? '#3f9a4a' : '#7a9a4a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(Wd.x + s * 5, Wd.y - 10); ctx.quadraticCurveTo(Wd.x + s * 5 + lean * 0.3, Wd.y - 10 - h * 0.7, Wd.x + s * 5 + lean, Wd.y - 10 - h + droop * 10); ctx.stroke();
      ctx.fillStyle = k > 0.5 ? '#56b862' : '#a8b06a'; ctx.beginPath(); ctx.ellipse(Wd.x + s * 5 + lean * 0.2 - 4, Wd.y - 10 - h * 0.4, 5, 2.4, -0.5 - droop * 0.6, 0, Math.PI * 2); ctx.fill();
      const bx = Wd.x + s * 5 + lean, by = Wd.y - 10 - h + droop * 10, sc = 0.45 + 0.75 * k;
      ctx.fillStyle = ['#ff5c8a', '#ffd166', '#ff8fab'][s + 1];
      if (k < 0.3) { ctx.fillStyle = '#c9a0a8'; ctx.beginPath(); ctx.ellipse(bx, by + 3, 4 * sc + 2, 3 * sc + 1, 0, 0, Math.PI * 2); ctx.fill(); }
      else { for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2 + t * 0.2; ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * 5 * sc, by + Math.sin(a) * 5 * sc, 4 * sc, 2.4 * sc, a, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(bx, by, 2.4 * sc, 0, Math.PI * 2); ctx.fill(); }
    }
    if (k < 0.5 && this.st.pour <= 0) { ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#4dd0e1'; ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3; ctx.fillText('💧', Wd.x + 20, Wd.y - 40 + Math.sin(t * 3) * 3); ctx.globalAlpha = 1; }
  },
  drawPot(r, g) {
    const ctx = r.ctx, F = CFG.FLOWERS, P = F.POT, pot = this.st.pot, t = g.time;
    ctx.fillStyle = '#b86f2d'; ctx.beginPath(); ctx.moveTo(P.x - 12, P.y - 10); ctx.lineTo(P.x + 12, P.y - 10); ctx.lineTo(P.x + 9, P.y + 8); ctx.lineTo(P.x - 9, P.y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 13, P.y - 13, 26, 5); ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.ellipse(P.x, P.y - 10, 10, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    if (!pot) return;
    const k = pot.done ? 1 : U.clamp(pot.t / F.GROW, 0, 1);
    if (k < 0.1) { ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(P.x, P.y - 11, 4, 2, 0, 0, Math.PI * 2); ctx.fill(); return; }   // the seed in its little mound
    const h = 4 + k * 30, sway = Math.sin(t * 2) * k * 2;
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 2 + k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(P.x, P.y - 10); ctx.quadraticCurveTo(P.x, P.y - 10 - h * 0.6, P.x + sway, P.y - 10 - h); ctx.stroke();
    ctx.fillStyle = '#56b862';
    if (k > 0.2) { ctx.beginPath(); ctx.ellipse(P.x - 5, P.y - 14 - h * 0.35, 5 * Math.min(1, k * 2), 2.5, -0.6, 0, Math.PI * 2); ctx.fill(); }
    if (k > 0.45) { ctx.beginPath(); ctx.ellipse(P.x + 5, P.y - 16 - h * 0.55, 5 * Math.min(1, (k - 0.3) * 2), 2.5, 0.6, 0, Math.PI * 2); ctx.fill(); }
    const bx = P.x + sway, by = P.y - 10 - h;
    if (k < 0.75) { ctx.fillStyle = '#7bc47f'; ctx.beginPath(); ctx.ellipse(bx, by, 3 + k * 3, 4 + k * 3, 0, 0, Math.PI * 2); ctx.fill(); }   // a bud
    else {
      const o = pot.done ? 1 : (k - 0.75) / 0.25;
      ctx.fillStyle = '#ff5c8a'; for (let q = 0; q < 7; q++) { const a = q / 7 * Math.PI * 2 + t * 0.3; ctx.beginPath(); ctx.ellipse(bx + Math.cos(a) * 6 * o, by + Math.sin(a) * 6 * o, 4.5 * o, 2.6 * o, a, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(bx, by, 3 * o, 0, Math.PI * 2); ctx.fill();
    }
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, t = g.time, st = this.st;
    if (g.area === 'city' && !this.cityBusy()) {
      // two butterflies by the buckets at the door
      const b = this.bld(), cx = (b.x0 + b.x1) / 2;
      for (let i = 0; i < 2; i++) { const a = t * (0.9 + i * 0.3) + i * 3; this.drawButterfly(ctx, { x: cx + (i ? 44 : -44) + Math.cos(a) * 14, y: b.y1 - 20 + Math.sin(a * 1.7) * 10, flap: t * 16 + i, col: i ? '#4dd0e1' : '#ff8fab' }, t); }
      return;
    }
    if (g.area !== 'flowers') return;
    this.drawOutside(r, g);
    this.drawBaskets(r, g);
    for (const b of CFG.FLOWERS.BUCKETS) this.drawBucket(ctx, b, t);
    if (!st.can) this.drawCan(ctx, CFG.FLOWERS.CAN_HOME.x, CFG.FLOWERS.CAN_HOME.y, 0);
    this.drawPot(r, g);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, F = CFG.FLOWERS, carrying = !g.driving && !g.onTrain;
    if (st.flower > 0 && carrying) items.push({ y: p.y - 0.5, draw: () => this.drawHatFlower(r, g) });
    if (st.bouquet > 0 && carrying) items.push({ y: p.y + 1, draw: () => this.drawBouquet(r, g) });
    if (g.area !== 'flowers') return;
    if (st.can) items.push({ y: p.y + 1, draw: () => this.drawHeldCan(r, g) });
    items.push({ y: F.WILTED.y, draw: () => this.drawWilted(r, g) });
    items.push({ y: F.FLORIST.y, draw: () => this.drawFlorist(r, g) });
    items.push({ y: F.CAT.y + 2, draw: () => this.drawCat(r.ctx, g.time) });
    items.push({ y: F.ROOM.y1 + 100, draw: () => { for (const b of st.butterflies) this.drawButterfly(r.ctx, b, g.time); this.drawBee(r.ctx, st.bee); } });
  },
  drawHatFlower(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, t = g.time;
    // tucked behind the hat: the stem hides behind the head, the blossom peeks out above the brim
    this.drawFlower(ctx, p.x - f * 7, p.y - 40 + bob, 'tulip', 26, -f * 3 + Math.sin(t * 3) * 1.5, '#ff5c8a', 1.05);
  },
  drawBouquet(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 20 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    const kinds = ['rose', 'daisy', 'tulip', 'sunflower', 'rose'];
    for (let k = 0; k < 5; k++) this.drawFlower(ctx, x, y, kinds[k], 16 + (k % 2) * 4, (k - 2) * 6, this.COLS[kinds[k]][k % this.COLS[kinds[k]].length], 0.8);
    ctx.fillStyle = '#ffe9c2'; ctx.beginPath(); ctx.moveTo(x - 12, y - 10); ctx.lineTo(x + 12, y - 10); ctx.lineTo(x + 4, y + 8); ctx.lineTo(x - 4, y + 8); ctx.closePath(); ctx.fill();   // paper cone
    ctx.fillStyle = 'rgba(255,143,171,0.7)'; ctx.fillRect(x - 10, y - 8, 20, 3);
    ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.arc(x - 4, y - 2, 3, 0, Math.PI * 2); ctx.arc(x + 4, y - 2, 3, 0, Math.PI * 2); ctx.fill();   // bow
  },
  drawHeldCan(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, st = this.st;
    if (st.pour > 0) {
      const W = CFG.FLOWERS.WILTED, k = 1 - st.pour / CFG.FLOWERS.POUR;
      const x = p.x + f * 18, y = p.y - 26;
      ctx.save(); if (f < 0) { ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); }
      this.drawCan(ctx, x, y, -0.9 * Math.min(1, k * 3)); ctx.restore();
      // a stream of drops falling into the pot
      ctx.fillStyle = '#4dd0e1';
      for (let i = 0; i < 6; i++) { const ph = (g.time * 2.2 + i / 6) % 1; const sx = x + f * 19, sy = y - 12; ctx.beginPath(); ctx.arc(U.lerp(sx, W.x, ph), U.lerp(sy, W.y - 12, ph) - Math.sin(ph * Math.PI) * 8, 2.2, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    const x = p.x + f * 18, y = p.y - 12 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.save(); if (f < 0) { ctx.translate(x, y); ctx.scale(-1, 1); ctx.translate(-x, -y); }
    this.drawCan(ctx, x, y, 0); ctx.restore();
  },
  drawFlorist(r, g) {
    const ctx = r.ctx, F = CFG.FLOWERS, fl = this.st.florist, t = g.time, x = F.FLORIST.x, y = F.FLORIST.y;
    r.drawPerson(x, y, { shirt: '#fff8ee', stripes: false, skin: '#c68642', hair: '#2b1d14', hairStyle: 1, facing: 1, moving: false, bob: 0, carry: 0, pants: '#3b7dd8', apron: '#41b883' });
    // the flower in hand goes up into the vase when a stem is added
    const lift = fl.lift > 0 ? Math.sin((1 - fl.lift / 0.5) * Math.PI) : 0, hx = x - 16 - lift * 14, hy = y - 16 - lift * 10;
    this.drawFlower(ctx, hx, hy, 'rose', 14, 3 + Math.sin(t * 4) * 2, '#ff5c8a', 0.85);
    // the vase on the counter fills up stem by stem
    const V = F.VASE, kinds = ['rose', 'daisy', 'tulip', 'sunflower', 'rose', 'daisy'];
    for (let k = 0; k < fl.stems; k++) this.drawFlower(ctx, V.x, V.y - 10, kinds[k], 20 + (k % 3) * 4, (k - 2.5) * 6, this.COLS[kinds[k]][k % this.COLS[kinds[k]].length], 0.85);
    ctx.fillStyle = '#4dd0e1'; U.roundRect(ctx, V.x - 9, V.y - 14, 18, 20, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(V.x - 6, V.y - 11, 3, 13);
    if (fl.t < 0.8 && fl.stems > 0) { ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff8fab'; ctx.fillText('♥', x + 14, y - 56 - fl.t * 10); }
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'flowers') return;
    const ctx = r.ctx, C = CFG.FLOWERS.CAT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5c6670';
    for (const z of this.st.cat.z) { const k = z.t / 2; ctx.globalAlpha = 1 - k; ctx.font = r.font(8 + k * 8); ctx.fillText('z', C.x - 10 + z.dx + k * 14, C.y - 20 - k * 30); }
    ctx.globalAlpha = 1;
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(FlowersExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(FlowersExt);
