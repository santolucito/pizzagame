'use strict';
// The Egg Barn (js/eggfarm.js, with the bigger barn map in js/barn.js): in through the barn door, the old barn's parts
// still there, through the archway into the hall. Then the egg farm, step by step, as a kid plays it:
// - no conveyor belt anywhere (no Egg Belt, no pad for it, no egg trays);
// - a hatched chick waddles into a coop, and a little later comes out as a grown chicken;
// - the chickens wander about the hall floor and lay their eggs where they stand ("bok!"); the chef picks them up just
//   by walking near them (a generous reach), and they hop onto the egg tower sitting on his head;
// - each coop's roof says how many chickens belong to it, its window shows the ones inside; the flock is as big as the
//   coops allow; at dusk every chicken goes home to sleep (the counts match), at dawn the rooster crows and out they
//   come; no eggs at night, and the eggs on the floor stay put;
// - 🌽 corn: bits fly from the chef's hand onto the floor and the nearby chickens gather round to peck, then wander off
//   (no ×2, no badge);
// - 📦 Pack the eggs into the packer, the boxes, 📦 Load the truck, the Loader; the truck drives out of the north doors,
//   along Main Street to the Egg Market next to the fire station (the stall and the route clear of the roads' edges, the
//   sidewalks, the fire station's door and its truck's routes), unloads, comes back and pays;
// - the spare truck driven to the market; the lucky egg; egg types; the tall wobbly tower; no long arms (the carry pose
//   draws no reaching arm); a big flock (300 chickens, 80 eggs) stays cheap; offline catch-up (only with the Loader);
//   saves (an old save with the Egg Belt, trays and a loader loads cleanly); rescues, a stuck check, Take-me-home.
module.exports = async (t) => {
  await t.boot();
  const quiet = () => t.page.addStyleTag({ content: '#toasts { display: none !important; }' });   // keep the pictures clear of passing toasts
  await quiet();
  const K = await t.ev(() => CFG.EGGFARM);
  // every egg that starts flying onto the tower is logged, with where it starts; every egg laid, with its chicken
  const hooks = () => t.ev(() => {
    window.__eggFrom = []; window.__lays = [];
    const orig = EggFarmExt.catchEgg; EggFarmExt.catchEgg = function (g, x, y, type, delay) { window.__eggFrom.push({ x, y, area: g.area }); return orig.call(this, g, x, y, type, delay); };
    const lay = EggFarmExt.lay; EggFarmExt.lay = function (g, h, type) { const n = this.st.floor.length; lay.call(this, g, h, type); const e = this.st.floor[n]; window.__lays.push({ hx: h.x, hy: h.y, s: h.s, x: e.x, y: e.y, night: this.night() }); };
    EggFarmExt.ready(Game).luckyT = 1e9;
    window.__day = () => { AtmosphereExt.force({ phase: 'day' }); T.step(1); };
  });
  await hooks();
  await t.ev(() => window.__day());
  t.expect(await t.ev(() => Game.ext.indexOf(EggFarmExt) >= 0 && Game.ext.indexOf(EggFarmExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(EggFarmExt) < Game.ext.indexOf(BarnExt) && Render.ext.includes(EggFarmExt)), 'registered first-ish in Game.ext and in Render.ext');
  const map = await t.ev(() => {
    const W = CFG.AREAS.barn.WORLD, over = Object.keys(CFG.AREAS).filter((k) => k !== 'barn').filter((k) => { const o = CFG.AREAS[k].WORLD; return o && o.x0 < W.x1 + 1000 && o.x1 > W.x0 - 1000 && o.y0 < W.y1 + 1000 && o.y1 > W.y0 - 1000; });
    return { W, over, place: CFG.AREAS.barn.place, mapped: WorldMapExt.placeOf('barn'), area: (W.x1 - W.x0) * (W.y1 - W.y0) / (600 * 400) };
  });
  t.expectEq(map.over.join(','), '', `the barn's map (${JSON.stringify(map.W)}) is at least 1000 px from every other map`);
  t.expect(map.place === 'town' && map.mapped === 'town', 'the barn still belongs to the farm on the world map');
  t.expect(map.area > 4 && map.area < 7, `the barn's map is about 4-6× the old one (${map.area.toFixed(1)}×)`);
  // ---- no conveyor belt anywhere: not in the config, the pads, the save, the code
  const noBelt = await t.ev(() => {
    const s = Game.s.eggfarm, E = EggFarmExt, K2 = CFG.EGGFARM;
    return { cfg: !('BELT' in K2) && !('SLIDE' in K2) && !('TRAY' in K2) && !('belt' in K2.UPG), save: !('belt' in s.lv) && !('trays' in s), code: typeof E.beltOn === 'undefined' && typeof E.startBuild === 'undefined' && typeof E.trayAt === 'undefined', pads: E.pads(Game).length === 0 || true, fresh: s.coops === 1 && s.hens.every((n) => n === 0) && s.lv.loader === 0 && s.floor.length === 0 && s.ver === 3 };
  });
  t.expect(noBelt.cfg && noBelt.save && noBelt.code, `no Egg Belt, no slide, no egg trays anywhere (${JSON.stringify(noBelt)})`);
  t.expect(noBelt.fresh, 'a fresh farm: one empty coop, no loader, nothing on the floor');

  // ---- in through the barn door on the farm; the old barn is still all there and reachable
  await t.ev(() => { const D = CFG.BARN.DOOR_OUT; T.tp(D.x, D.y, 'town'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go into the barn', 'door label on the farm');
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => Game.area), 'barn', 'inside the barn');
  const old = await t.ev(() => {
    const K2 = CFG.BARN, hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o)), out = {};
    const spots = { goat: { x: K2.stalls.goat.x1 + 26, y: K2.stalls.goat.at.y }, pig: { x: K2.stalls.pig.x1 + 20, y: K2.stalls.pig.at.y - 14 }, ladder: K2.ladder.foot, bale: { x: K2.bales[2].x, y: K2.bales[2].y + 30 }, mat: { x: K2.exit.x, y: K2.exit.y - 8 } };
    for (const [k, q] of Object.entries(spots)) { T.tp(q.x, q.y, 'barn'); out[k] = !hit(q.x, q.y) && BarnExt.free(q.x, q.y) ? T.label() : 'blocked'; }
    return out;
  });
  t.expectEq(old.goat, '🐐 Pat the goat', 'the goat is still there');
  t.expectEq(old.pig, '🐷 Pat the pig', 'the pig is still there');
  t.expectEq(old.ladder, '🪜 Climb up', 'the hayloft ladder is still there');
  t.expectEq(old.bale, '🪑 Sit on the hay', 'the hay bale seat is still there');
  t.expectEq(old.mat, '🚪 Go outside', 'the way out is still there');
  const walk = await t.ev(() => {
    const A = CFG.BARN.arch, x = (A.x0 + A.x1) / 2; T.tp(x, 4300, 'barn');
    T.steer(0, 1); T.step(70); T.unsteer(); const down = Game.player.y;
    T.steer(0, -1); T.step(70); T.unsteer(); const up = Game.player.y;
    return { down, up };
  });
  t.expect(walk.down > K.HALL.y0 + 30 && walk.up < 4330, `walked through the archway into the hall and back (${Math.round(walk.down)}, ${Math.round(walk.up)})`);
  t.expectEq(await t.ev(() => Game.s.eggfarm.seen), true, 'the hall is marked as found');

  // ---- the hall, early: the hint points at the big red button; no belt pad
  await t.ev(() => { T.tp(40200, 4620, 'barn'); T.step(2); });
  const h0 = await t.ev(() => ({ text: T.hint(), target: Game.hint && Game.hint.target, pads: EggFarmExt.pads(Game).map((p) => p.key), bg: EggFarmExt.bgKey(Game) }));
  t.expectEq(h0.text, 'Press the big red button! 🐣', 'first hint in the hall');
  t.expect(h0.target && h0.target.x === K.HATCHER.btn.x, 'the hint points at the button');
  t.expect(!h0.pads.includes('egg_belt') && h0.pads.includes('egg_loader') && !/b$/.test(h0.bg), `no Egg Belt pad (${h0.pads.join(',')})`);
  await t.shot('hall-early');

  // ---- hatch: a chick pops out, waddles along the path and into the coop; a little later it comes out a chicken
  await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🐣 Hatch!', 'the hatch button label at the machine');
  const h1 = await t.ev(() => { T.act(); const a = { hens: Game.s.eggfarm.hens[0], chicks: EggFarmExt.st.chicks.length, refill: EggFarmExt.st.refill, shown: EggFarmExt.shown(Game.s.eggfarm, 0) }; T.act(); a.hens2 = Game.s.eggfarm.hens[0]; return a; });
  t.expect(h1.hens === 1 && h1.chicks === 1 && h1.refill > 0.3 && h1.shown === 0, `one chick hatched, not in its coop yet (${JSON.stringify(h1)})`);
  t.expectEq(h1.hens2, 1, 'pressing again during the refill does nothing');
  await t.ev(() => T.step(14));
  await t.shot('hatch');
  const grown = await t.ev(() => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, E = EggFarmExt, D = E.coopDoor(0);
    const n1 = T.until(() => st.chicks.length === 0, 900);
    const inside = { shown: E.shown(s, 0), inCoop: E.inCoop(s, 0), growing: E.growing(0), flock: st.flock.length };
    const n2 = T.until(() => st.flock.length > 0, 600); const h = st.flock[0];
    const out = h && { c: h.c, x: h.x, y: h.y, s: h.s, door: Math.hypot(h.x - D.x, h.y - D.y) };
    T.step(150); const later = h && { x: h.x, y: h.y, s: h.s };
    return { n1, inside, n2, out, later, chickY: CFG.EGGFARM.CHICK_Y, R: CFG.EGGFARM.ROAM };
  });
  t.expect(grown.n1 > 0 && grown.inside.shown === 1 && grown.inside.inCoop === 1 && grown.inside.growing === 1 && grown.inside.flock === 0, `the chick went into the coop and grows up in there (${JSON.stringify(grown.inside)})`);
  t.expect(grown.n2 > 60 && grown.out && grown.out.c === 0 && grown.out.door < 12, `after a little while it comes out of the coop's door as a chicken (${grown.n2} steps, ${JSON.stringify(grown.out)})`);
  t.expect(grown.later && grown.later.y > grown.chickY && grown.later.x >= grown.R.x0 && grown.later.x <= grown.R.x1, `and walks down the ramp onto the hall floor (${JSON.stringify(grown.later)})`);
  await t.shot('first-chicken');

  // ---- the coops' numbers: the roof says how many chickens belong to it, the window shows the ones inside; at night
  // (everyone home) the faces, the roof number and the board's total all agree
  const faces = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, out = [];
    AtmosphereExt.force({ phase: 'dusk' }); T.until(() => !st.flock.length, 900); T.tp(40300, 4620, 'barn');
    for (const [lv, n] of [[0, 0], [0, 1], [0, 7], [0, 20], [2, 23], [4, 37], [4, 60], [10, 87], [10, 120]]) {
      s.lv.coop = lv; s.hens[0] = n; Render.draw(Game);
      const f = st.faces[0];
      out.push({ n, cap: E.cap(s), drawn: f.drawn, label: st.labels[0], board: st.boardN, key: f.key });
    }
    // with chicks still on the path: they are on neither the coop nor its number nor the board until they arrive
    s.lv.coop = 0; s.hens[0] = 5; st.refill = 0; const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.act(); T.act(); T.step(30); st.refill = 0; T.act(); T.step(2);
    T.tp(40300, 4620, 'barn'); Render.draw(Game);
    const walking = { hens: s.hens[0], incoming: st.incoming[0], drawn: st.faces[0].drawn, label: st.labels[0], board: st.boardN };
    T.until(() => !st.chicks.length, 900); Render.draw(Game);
    const after = { hens: s.hens[0], drawn: st.faces[0].drawn, label: st.labels[0], board: st.boardN, flock: st.flock.length };
    const fits = [20, 30, 50, 60, 80, 120].every((cap) => { const F = E.coopFront(0), G = E.grid(cap, F.w, F.h); return G.cols * G.rows >= cap && G.cols * G.cell <= F.w + 0.01 && G.rows * G.cell <= F.h + 0.01 && G.cell >= 4; });
    return { out, walking, after, fits };
  });
  for (const f of faces.out) t.expect(f.drawn === f.n && f.label === f.n && f.board === f.n && /z$/.test(f.key), `at night a coop of ${f.n}/${f.cap} chickens shows ${f.drawn} sleeping faces, its roof says ${f.label}, the board says ${f.board}`);
  t.expect(faces.walking.drawn === faces.walking.label && faces.walking.label === faces.walking.board && faces.walking.label === faces.walking.hens - faces.walking.incoming && faces.walking.incoming > 0, `chicks still walking are not counted yet (${JSON.stringify(faces.walking)})`);
  t.expect(faces.after.drawn === faces.after.hens && faces.after.label === faces.after.hens && faces.after.board === faces.after.hens && faces.after.flock === 0, `once in, the coop, its number and the board all count them (and at night nobody comes out: ${JSON.stringify(faces.after)})`);
  t.expect(faces.fits, 'the rows of faces fit any coop size');
  await t.ev(() => { const s = Game.s.eggfarm; s.lv.coop = 0; s.hens[0] = 14; T.tp(40140, 4660, 'barn'); T.step(3); Render.setZoom(2.1); T.step(2); });
  await t.shot('coop-asleep');
  await t.ev(() => { Render.setZoom(1); window.__day(); });
  // by day the window shows the ones inside and the roof all of them
  const dayFaces = await t.ev(() => { const s = Game.s.eggfarm, st = EggFarmExt.st; T.step(240); T.tp(40300, 4620, 'barn'); Render.draw(Game); return { drawn: st.faces[0].drawn, label: st.labels[0], walkers: st.walkers[0], inCoop: EggFarmExt.inCoop(s, 0), awake: !/z$/.test(st.faces[0].key) }; });
  t.expect(dayFaces.label === 14 && dayFaces.walkers > 0 && dayFaces.drawn === dayFaces.inCoop && dayFaces.drawn + dayFaces.walkers === 14 && dayFaces.awake, `by day the chickens come out: the roof still says 14, the window shows the ones inside (${JSON.stringify(dayFaces)})`);

  // fill the coop: FULL, no more chicks, a friendly float; buy a new coop
  const fill = await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); let n = 0; while (Game.s.eggfarm.hens[0] < 20 && n < 60) { T.act(); T.step(26); n++; } return { hens: Game.s.eggfarm.hens[0], presses: n }; });
  t.expectEq(fill.hens, 20, `the coop filled up to 20 (${fill.presses} presses)`);
  const full = await t.ev(() => { T.step(30); Game.floats.length = 0; T.act(); return { hens: Game.s.eggfarm.hens[0], flash: EggFarmExt.st.fullFlash, float: Game.floats.some((f) => f.text.includes('All full')), room: EggFarmExt.room(Game.s.eggfarm) }; });
  t.expect(full.hens === 20 && full.flash > 0 && full.float && full.room === 0, `a full coop: FULL sign, no more chicks, the flock is as big as the coops allow (${JSON.stringify(full)})`);
  const coop = await t.ev(() => {
    T.until(() => EggFarmExt.st.chicks.length === 0, 900);
    const pad = EggFarmExt.pads(Game).find((p) => p.key === 'egg_newcoop'); Game.s.cash = pad.price;
    T.tp(pad.pos.x, pad.pos.y, 'barn'); const n = T.until(() => Game.s.eggfarm.coops === 2, 900);
    return { n, coops: Game.s.eggfarm.coops, cash: Game.s.cash, price: pad.price, next: (EggFarmExt.pads(Game).find((p) => p.key === 'egg_newcoop') || {}).price, room: EggFarmExt.room(Game.s.eggfarm) };
  });
  t.expect(coop.coops === 2 && coop.n > 0 && coop.cash < 1 && coop.room === 20, `bought a second coop for ${coop.price}: room for 20 more (${JSON.stringify(coop)})`);
  t.expect(coop.next > coop.price, 'the next coop costs more (Shop.cost)');
  const into2 = await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.step(30); T.act(); return Game.s.eggfarm.hens[1]; });
  t.expectEq(into2, 1, 'the next chick goes into the new coop');

  // ---- the chickens wander and lay their eggs on the floor, where they stand, with a "bok!"
  const lay = await t.ev(() => {
    window.__day(); const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt; s.hens[0] = 12; s.hens[1] = 6; st.floor.length = 0; window.__lays.length = 0;
    T.tp(39800, 4452, 'barn'); T.step(1); Game.floats.length = 0; const laid0 = s.laid, pos0 = st.flock.map((h) => [h.x, h.y]);
    let bok = false; const n = T.until(() => { bok = bok || Game.floats.some((f) => f.text === 'bok!'); return st.floor.length >= 6; }, 1500);
    const moved = st.flock.filter((h, i) => pos0[i] && Math.hypot(h.x - pos0[i][0], h.y - pos0[i][1]) > 20).length;
    const R = CFG.EGGFARM.ROAM, eggs = st.floor.map((e) => ({ x: e.x, y: e.y }));
    return { n, laid: s.laid - laid0, floor: st.floor.length, flock: st.flock.length, moved, bok, lays: window.__lays.slice(0, 8), inRoam: eggs.every((e) => e.x >= R.x0 - 10 && e.x <= R.x1 + 10 && e.y >= R.y0 - 10 && e.y <= R.y1 + 14), keep: eggs.filter((e) => U.dist(e.x, e.y, CFG.EGGFARM.PACK.x, CFG.EGGFARM.PACK.y) < 40 || U.dist(e.x, e.y, CFG.EGGFARM.CORN.spot.x, CFG.EGGFARM.CORN.spot.y) < 20).length, hint: T.hint(), target: Game.hint && Game.hint.target };
  });
  t.expect(lay.n > 0 && lay.flock >= 10 && lay.moved >= 3, `the chickens are out wandering about (${lay.flock} out, ${lay.moved} moved)`);
  t.expect(lay.floor >= 6 && lay.laid === lay.floor && lay.lays.every((q) => Math.hypot(q.x - q.hx, q.y - q.hy) < 10), `they lay eggs on the floor right where they stand (${JSON.stringify(lay.lays.slice(0, 3))})`);
  t.expect(lay.bok, 'an egg pops out with a "bok!"');
  t.expect(lay.inRoam && lay.keep === 0, 'the eggs lie on the hall floor, never on a button spot');
  t.expect(lay.hint === 'Pick up the eggs! 🥚' && lay.target, `the hint says to pick up the eggs, with an arrow (${lay.hint})`);
  await t.ev(() => { T.tp(40150, 4700, 'barn'); T.step(20); });
  await t.shot('chickens-laying');

  // ---- picking up: just walk near the eggs and they hop onto the tower (from where they lie), in a generous reach
  const pick = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, M = CFG.EGGFARM.MAGNET; const hens = s.hens.slice(); s.hens.fill(0); st.flock.length = 0; T.step(30); st.stack.length = 0; st.fly.length = 0; st.floor.length = 0; window.__eggFrom.length = 0;
    const eggs = [[39700, 4700], [39760, 4730], [39820, 4690], [39880, 4720], [39940, 4700], [40000, 4740]];
    for (const [x, y] of eggs) st.floor.push({ x, y, t: 0, z: 0, vz: 0, pop: 0 });
    st.floor.push({ x: 39820, y: 4700 + M + 40, t: 0, z: 0, vz: 0, pop: 0 });   // one out of reach, below the walk
    T.tp(39572, 4700, 'barn'); T.step(1); const before = st.floor.length;
    T.steer(1, 0); T.until(() => Game.player.x > 40040, 400); T.unsteer(); T.step(40);
    const from = window.__eggFrom.map((f) => [Math.round(f.x), Math.round(f.y)]); s.hens = hens;
    return { before, left: st.floor.length, stack: st.stack.length, from, eggs, far: st.floor[0] && st.floor[0].y };
  });
  t.expect(pick.stack === 6 && pick.left === 1, `walking past picked up the 6 eggs near the path and left the far one (${JSON.stringify(pick)})`);
  t.expect(pick.from.length === 6 && pick.from.every(([x, y]) => pick.eggs.some(([ex, ey]) => Math.abs(ex - x) < 2 && Math.abs(ey - 6 - y) < 2)), 'each egg hops up from where it lay');
  const reach = await t.ev(() => { const st = EggFarmExt.st, M = CFG.EGGFARM.MAGNET; st.floor.length = 0; st.floor.push({ x: 40100 + M - 12, y: 4720, t: 0, z: 0, vz: 0, pop: 0 }); T.tp(40100, 4720, 'barn'); T.step(3); return { left: st.floor.length, M }; });
  t.expect(reach.left === 0 && reach.M >= 100, `the reach is generous: an egg ${reach.M - 12} px away hops on (magnet ${reach.M})`);
  await t.ev(() => { EggFarmExt.st.floor.length = 0; T.step(30); });

  // pack: the tower goes into the packer's hopper, the packer makes boxes onto the pile
  const pack = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, P = CFG.EGGFARM.PACK; s.boxes = 0; s.boxVal = 0; s.box = 0; s.boxEggVal = 0; s.hopper = 0; s.hopperVal = 0;
    while (st.stack.length < 14) st.stack.push({ t: 0, x: 0, land: 9 });
    T.tp(P.x - 120, P.y, 'barn'); T.step(1); const hint = T.hint(), target = Game.hint && Game.hint.target;
    T.tp(P.x, P.y, 'barn'); T.step(1);
    return { hint, target, label: T.label(), n: st.stack.length };
  });
  t.expect(pack.hint === 'Put the eggs in the packer! 📦' && pack.target && pack.target.x === K.PACK.x, `the hint sends the eggs to the packer (${JSON.stringify(pack)})`);
  t.expectEq(pack.label, '📦 Pack the eggs', 'the pack button at the packer');
  await t.ev(() => { T.act(); T.step(12); });
  const stream = await t.ev(() => { const st = EggFarmExt.st, H = CFG.EGGFARM.PACKER.hopper; const out = st.fly.filter((f) => f.out); return { flying: out.length, toHopper: out.every((f) => Math.abs(f.x1 - H.x) < 14 && Math.abs(f.y1 - H.y) < 6), left: st.stack.length }; });
  t.expect(stream.flying > 2 && stream.toHopper, `the eggs stream off the tower into the packer's hopper (${JSON.stringify(stream)})`);
  await t.shot('packing-stream');
  const packed = await t.ev((n0) => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, O = CFG.EGGFARM.PACKER.out; let fromPacker = 0;
    const n = T.until(() => { fromPacker = Math.max(fromPacker, st.boxFly.filter((b) => b.to === 'pile' && Math.abs(b.x0 - O.x) < 2).length); return !st.stack.length && !st.fly.length && s.hopper === 0; }, 900);
    T.step(30);
    return { n, boxes: s.boxes, box: s.box, per: EggFarmExt.boxEggs(s), n0, fromPacker, val: s.boxVal };
  }, pack.n);
  t.expect(packed.n >= 0 && packed.boxes * packed.per + packed.box === packed.n0, `all ${packed.n0} eggs went through the packer into boxes (${JSON.stringify(packed)})`);
  t.expect(packed.fromPacker > 0, 'the boxes pop out of the packer onto the pile');
  t.expect(Math.abs(packed.val - packed.boxes * packed.per) < 0.01, 'each plain egg in a box is worth $1');
  // nothing loads the truck by itself without a loader
  const still = await t.ev(() => { const s = Game.s.eggfarm, st = EggFarmExt.st, hens = s.hens.slice(); s.hens.fill(0); st.flock.length = 0; st.floor.length = 0; T.tp(39900, 4760, 'barn'); T.step(600); s.hens = hens; T.step(1); const tr = EggFarmExt.dockTruck(); return { boxes: s.boxes, truck: tr && tr.boxes, state: tr && tr.state, hint: T.hint(), target: Game.hint && Game.hint.target }; });
  t.expect(still.boxes === packed.boxes && still.truck === 0 && still.state === 'dock', `without a loader the boxes wait on the pile (${JSON.stringify(still)})`);
  t.expect(still.hint === 'Load the boxes onto the truck! 🚚' && still.target && still.target.x === K.LOAD[0].x, 'the hint says to load the truck');
  // load the truck: the boxes fly from the pile onto the truck at the dock, its fill bar fills
  const load = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, L = CFG.EGGFARM.LOAD[0], BP = CFG.EGGFARM.BOXPILE;
    T.tp(L.x, L.y, 'barn'); T.step(1); const label = T.label(); const b0 = s.boxes; T.act(); T.step(3);
    const fly = st.boxFly.filter((b) => b.to !== 'pile' && b.to !== 'market').map((b) => ({ x0: Math.round(b.x0), y0: Math.round(b.y0), x1: Math.round(b.x1), y1: Math.round(b.y1) }));
    T.step(60); const tr = EggFarmExt.dockTruck();
    return { label, b0, fly, boxes: s.boxes, truck: tr && tr.boxes, drawn: tr && tr.drawBoxes, cap: EggFarmExt.truckCap(s), pile: [BP.x, BP.y], bay: CFG.EGGFARM.BAYS[0] };
  });
  t.expectEq(load.label, '📦 Load the truck', 'the load button behind the truck');
  t.expect(load.fly.length > 0 && load.fly.every((b) => Math.abs(b.x0 - load.pile[0]) < 40 && Math.abs(b.y0 - load.pile[1]) < 70 && Math.abs(b.x1 - load.bay.x) < 30 && b.y1 > load.bay.y - 10), `boxes fly from the pile onto the truck (${JSON.stringify(load.fly.slice(0, 2))})`);
  t.expect(load.truck === Math.min(load.b0, load.cap) && load.drawn === load.truck && load.boxes === load.b0 - load.truck, `the truck took the boxes (${JSON.stringify(load)})`);
  await t.shot('loading');
  // the truck toots and drives out of the north doors (straight up, through the doorway), then out on the farm
  const ship = await t.ev(() => {
    const st = EggFarmExt.st, D = CFG.EGGFARM.DOOR, tr = st.trucks[0]; Game.floats.length = 0; const val = tr.val;
    const n1 = T.until(() => tr.state === 'toot', 900); const toot = Game.floats.some((f) => f.text.includes('Toot')); const hint = T.hint();
    const ys = []; const n2 = T.until(() => { if (tr.state === 'out') ys.push({ x: tr.x, y: tr.y }); return tr.state === 'road'; }, 600);
    return { n1, n2, toot, hint, val, north: ys.length > 3 && ys.every((q, i) => i === 0 || q.y <= ys[i - 1].y) && ys.every((q) => q.x > D.x0 && q.x < D.x1) && ys[ys.length - 1].y < CFG.EGGFARM.HALL.y0 };
  });
  t.expect(ship.n1 > 0 && ship.toot, `the truck toots when it is ready to go (${JSON.stringify(ship)})`);
  t.expect(ship.hint === 'Toot toot! Off to the Egg Market! 🚚', `the hint says it is off to the market (${ship.hint})`);
  t.expect(ship.n2 > 0 && ship.north, 'it drives straight out of the big north doors');
  await t.ev(() => { const st = EggFarmExt.st, tr = st.trucks[0]; tr.state = 'out'; tr.x = CFG.EGGFARM.BAYS[0].x; tr.y = 4400; tr.angle = -Math.PI / 2; tr.t = 0.3; T.tp(40600, 4600, 'barn'); T.step(1); tr.y = 4372; window.__ut = EggFarmExt.updateTrucks; EggFarmExt.updateTrucks = () => {}; });
  await t.shot('truck-leaving-north');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; T.until(() => EggFarmExt.st.trucks[0].state === 'road', 300); });
  // on the farm: out of the barn's north doors, up the track, along Main Street to the Egg Market by the fire station
  const road = await t.ev(() => {
    const st = EggFarmExt.st, tr = st.trucks[0], B = CFG.FARM.barn, M = CFG.EGGFARM.MARKET, NG = CFG.FARM.northGate, pts = [];
    T.tp(-760, 60, 'town'); T.step(1);
    const n = T.until(() => { pts.push({ x: tr.x, y: tr.y, a: tr.angle, s: tr.state }); return tr.state === 'unload'; }, 1500);
    const first = pts[0], northOut = pts.filter((q) => q.y > CFG.ROAD.y2).every((q) => Math.abs(q.x - NG.x) < NG.half - 10);
    const T0 = 0; let facing = 0; T.step(20); facing = Math.cos(tr.angle);
    return { n, first, northOut, end: { x: Math.round(tr.x), y: Math.round(tr.y) }, inBarn: first.x > B.x0 && first.x < B.x1 && first.y > B.y0, drop: M.drop, facing, T0 };
  });
  t.expect(road.inBarn && road.northOut, `on the farm the truck comes out of the barn's north side, through the fence gap (${JSON.stringify(road.first)})`);
  t.expect(road.n > 0 && Math.abs(road.end.x - road.drop.x) < 2 && Math.abs(road.end.y - road.drop.y) < 2 && road.facing > 0.9, `and drives along Main Street to the Egg Market, pulling up facing along the road (${JSON.stringify(road)})`);
  await t.ev(() => { const M = CFG.EGGFARM.MARKET; T.tp(M.x0 + 20, M.y1 + 50, 'town'); Render.setZoom(1.3); T.step(14); window.__ut = EggFarmExt.updateTrucks; EggFarmExt.updateTrucks = () => {}; });
  await t.shot('truck-at-market');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; Render.setZoom(1); });
  const back = await t.ev((d) => {
    const st = EggFarmExt.st, tr = st.trucks[0], s = Game.s.eggfarm, pts = []; Game.floats.length = 0;
    const n1 = T.until(() => tr.state === 'back', 600); const mkt = st.mkt, thanks = Game.floats.some((f) => f.text.includes('Thank'));
    const n2 = T.until(() => { if (tr.state === 'back') pts.push({ x: tr.x, y: tr.y }); return tr.state !== 'back'; }, 1500);
    const last = pts[pts.length - 1];
    T.step(2);
    return { n1, n2, mkt, thanks, barnY0: CFG.FARM.barn.y0, bank: s.bank, val: d.val, state: tr.state, last, same: pts.filter((q) => q.y > CFG.ROAD.y2).every((q) => Math.abs(q.x - CFG.FARM.northGate.x) < 30) };
  }, ship);
  t.expect(back.n1 > 0 && back.mkt > 0 && back.thanks, `at the market the boxes hop onto the counter (${JSON.stringify(back)})`);
  t.expect(back.n2 > 0 && back.same && back.last.y > back.barnY0, `and the truck comes back along the road, into the barn's north doors (${JSON.stringify(back.last)})`);
  t.expect(Math.abs(back.bank - Math.round(back.val)) < 1, `it brings the money home (banked while the chef is out: ${back.bank} for ${back.val})`);
  // ---- the Egg Market stands right next to the fire station, on free grass: not on a road, a sidewalk, the fire
  // station's door or its truck's routes; the trucks' route stays on the roads and hits nothing
  const spot = await t.ev(() => {
    const M = CFG.EGGFARM.MARKET, F = CFG.FIRE_STATION, rect = { x: M.x0, y: M.y0, w: M.x1 - M.x0, h: M.y1 - M.y0 };
    const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.y < b.y + b.h + pad && a.y + a.h > b.y - pad;
    const gapX = Math.max(0, F.x0 - M.x1, M.x0 - F.x1), gapY = Math.max(0, F.y0 - M.y1, M.y0 - F.y1), near = Math.hypot(gapX, gapY);
    const roads = CFG.ROADS.filter((r) => overlap(rect, { x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 }, 6)).length;
    const walks = [{ x: 1320, y: 300, w: 20, h: 240 }, { x: CFG.BUILDING.x1 + 48, y: CFG.DOOR_OUT.y - 20, w: 2000, h: 40 }, { x: 1214, y: CFG.ROAD.y2, w: 26, h: 900 }].filter((w) => overlap(rect, w, 4)).length;
    const station = overlap(rect, { x: F.x0, y: F.y0, w: F.x1 - F.x0, h: F.y1 - F.y0 }, 20);
    const D = CFG.FIRESTATION ? CFG.FIRESTATION.DOOR_OUT : F.door, door = Math.hypot(Math.max(0, M.x0 - D.x, D.x - M.x1), Math.max(0, M.y0 - D.y, D.y - M.y1));
    let truck = 0;
    for (const R of [CFG.FIRE_TRUCK_OUT, CFG.FIRE_TRUCK_BACK, [{ x: CFG.FIRE_TRUCK_HOME.x, y: CFG.FIRE_TRUCK_HOME.y }, CFG.FIRE_TRUCK_OUT[0]]]) for (let i = 1; i < R.length; i++) { const a = R[i - 1], b = R[i], L = Math.hypot(b.x - a.x, b.y - a.y); for (let d = 0; d <= L; d += 6) { const x = a.x + (b.x - a.x) * d / L, y = a.y + (b.y - a.y) * d / L; if (x > M.x0 - 34 && x < M.x1 + 34 && y > M.y0 - 30 && y < M.y1 + 30) truck++; } }
    const trees = CFG.TREES.filter((tr) => tr.x > M.x0 - 12 && tr.x < M.x1 + 12 && tr.y - 70 * tr.s < M.y1 && tr.y > M.y0).length;
    const coins = CFG.COINS.filter((c) => c.x > M.x0 - 14 && c.x < M.x1 + 14 && c.y > M.y0 - 14 && c.y < M.y1 + 14).length;
    const solid = Game.townObstacles(false).some((o) => o.x === M.x0 && o.y === M.y0);
    const onRoad = (x, y, m) => CFG.ROADS.some((r) => x > r.x0 + m && x < r.x1 - m && y > r.y0 + m && y < r.y1 - m);
    return { near, roads, walks, station, door, truck, trees, coins, solid, drop: onRoad(M.drop.x, M.drop.y, 16), dropFront: M.drop.x > M.x0 && M.drop.x < M.x1 && M.drop.y < M.y0 };
  });
  t.expect(spot.near < 160 && !spot.station, `the Egg Market is right next to the fire station (${Math.round(spot.near)} px)`);
  t.expect(spot.roads === 0 && spot.walks === 0 && spot.door > 200 && spot.truck === 0, `on free grass: off the roads, the sidewalks, the station's door and its truck's routes (${JSON.stringify(spot)})`);
  t.expect(spot.trees === 0 && spot.coins === 0 && spot.solid, `not under a tree or on a coin, and solid (${JSON.stringify(spot)})`);
  t.expect(spot.drop && spot.dropFront, 'the trucks pull up on the road right in front of its counter');
  const path = await t.ev(() => {
    const K2 = CFG.EGGFARM, obs = Game.townObstacles(true), B = CFG.FARM.barn, S = CFG.STATION, bad = [], off = [];
    const onRoad = (x, y) => CFG.ROADS.some((r) => x > r.x0 + 14 && x < r.x1 - 14 && y > r.y0 + 14 && y < r.y1 - 14);
    for (const R of [K2.ROUTE_OUT, K2.ROUTE_BACK]) {
      const len = EggFarmExt.routeLen(R);
      for (let d = 0; d <= len; d += 6) {
        const q = EggFarmExt.along(R, d); if (q.y > B.y0 - 26) continue;   // still inside the barn's doorway
        for (const dx of [-20, 0, 20]) for (const dy of [-20, 0, 20]) if (obs.some((o) => Game.hitRect(q.x + dx, q.y + dy, 2, o))) { bad.push([Math.round(q.x), Math.round(q.y)]); break; }
        if (q.y < S.trackY + 60) bad.push(['tracks', Math.round(q.x), Math.round(q.y)]);
        if (q.y < CFG.ROAD.y2 - 14 && !onRoad(q.x, q.y)) off.push([Math.round(q.x), Math.round(q.y)]);
      }
    }
    return { bad: bad.slice(0, 6), off: off.slice(0, 6), end: K2.ROUTE_OUT[K2.ROUTE_OUT.length - 1], back0: K2.ROUTE_BACK[0], drop: K2.MARKET.drop };
  });
  t.expect(path.bad.length === 0, `the trucks' route on the town map hits nothing (${JSON.stringify(path.bad)})`);
  t.expect(path.off.length === 0, `and stays on the road the whole way (${JSON.stringify(path.off)})`);
  t.expect(path.end.x === path.drop.x && path.end.y === path.drop.y && path.back0.x === path.drop.x, 'out to the market drop, and back from it');
  await t.ev(() => { const st = EggFarmExt.st, tr = st.trucks[0]; tr.state = 'road'; tr.d = EggFarmExt.routeLen(CFG.EGGFARM.ROUTE_OUT) - 260; tr.boxes = 6; tr.val = 6; const q = EggFarmExt.along(CFG.EGGFARM.ROUTE_OUT, tr.d); tr.x = q.x; tr.y = q.y; tr.angle = 0; T.tp(1330, 240, 'town'); Render.setZoom(0.9); T.step(1); window.__ut = EggFarmExt.updateTrucks; EggFarmExt.updateTrucks = () => {}; });
  await t.shot('market-by-fire-station');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; T.until(() => EggFarmExt.st.trucks[0].state === 'wait' || EggFarmExt.st.trucks[0].state === 'dock', 3000); Render.setZoom(1); });
  // back in the hall, the money waits by the cash spot and goes into the chef's pocket
  const cashIn = await t.ev(() => { const s = Game.s.eggfarm, c0 = Game.s.cash, b = s.bank; T.tp(CFG.EGGFARM.CASH.x, CFG.EGGFARM.CASH.y, 'barn'); T.step(2); return { got: Game.s.cash - c0, b, left: s.bank }; });
  t.expect(cashIn.got === cashIn.b && cashIn.b > 0 && cashIn.left === 0, `the egg money picked up in the hall (${JSON.stringify(cashIn)})`);
  const inHall = await t.ev(() => { const s = Game.s.eggfarm, c0 = Game.s.cash; T.tp(40300, 4700, 'barn'); EggFarmExt.pay(Game, 25); return { got: Game.s.cash - c0, bank: s.bank, beep: Game.floats.some((f) => f.text.includes('Beep')) }; });
  t.expect(inHall.got === 25 && inHall.bank === 0 && inHall.beep, 'in the hall, the truck money flies to the chef');

  // ---- 🌽 corn: bits fly from the chef's hand (low, at his side) onto the floor; the nearby chickens gather round to
  // peck for a while, then wander off again. No ×2 and no badge.
  const corn = await t.ev(() => {
    window.__day(); const s = Game.s.eggfarm, st = EggFarmExt.st, C = CFG.EGGFARM.CORN.spot, Kc = CFG.EGGFARM; s.hens[0] = 20; s.hens[1] = 12;
    T.tp(39800, 4452, 'barn'); T.step(60 * 6); st.floor.length = 0;
    T.tp(C.x, C.y, 'barn'); T.step(1); const label = T.label(), p = Game.player;
    window.__cornLaid0 = s.laid; T.act(); const at = st.cornAt, hand = st.corn.every((c) => Math.abs(c.x0 - p.x) <= 20 && c.y0 >= p.y - 24 && c.y0 <= p.y - 8);
    const near = st.flock.filter((h) => U.dist(h.x, h.y, at.x, at.y) < Kc.CORN_R && h.s !== 'down');
    const d0 = near.length ? near.reduce((a, h) => a + U.dist(h.x, h.y, at.x, at.y), 0) / near.length : 0;
    T.step(60 * 4);
    const gathered = st.flock.filter((h) => h.s === 'corn'), close = gathered.filter((h) => h.at && U.dist(h.x, h.y, at.x, at.y) < 80);
    const d1 = gathered.length ? gathered.reduce((a, h) => a + U.dist(h.x, h.y, at.x, at.y), 0) / gathered.length : 0;
    Render.draw(Game);
    return { label, n: st.corn.length, hand, near: near.length, gathered: gathered.length, close: close.length, d0, d1, boost: 'boost' in st, badge: typeof EggFarmExt.drawCornBadge, at };
  });
  t.expectEq(corn.label, '🌽 Scatter corn', 'the corn button at the sack');
  t.expect(corn.n >= 10 && corn.hand, `corn bits fly from the chef's hand, low at his side (${JSON.stringify(corn)})`);
  t.expect(corn.near >= 5 && corn.gathered >= corn.near - 2 && corn.close >= 5 && corn.d1 < corn.d0 * 0.6, `the nearby chickens walk over and gather round the corn (${corn.near} near, ${corn.gathered} gathered, ${corn.close} pecking; ${Math.round(corn.d0)} → ${Math.round(corn.d1)} px)`);
  t.expect(!corn.boost && corn.badge === 'undefined', 'no ×2 egg boost and no badge');
  await t.shot('corn-gathering');
  const cornEnd = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, Kc = CFG.EGGFARM, at = { x: st.cornAt.x, y: st.cornAt.y };
    T.step(60 * (Kc.CORN_TIME - 3)); const laidCorn = s.laid - window.__cornLaid0;
    T.step(60 * 7); const corner = st.flock.filter((h) => h.s === 'corn').length, spread = st.flock.filter((h) => U.dist(h.x, h.y, at.x, at.y) > 120).length;
    st.floor.length = 0; const b = s.laid; T.step(60 * (Kc.CORN_TIME + 1)); const laidPlain = s.laid - b; st.floor.length = 0;
    return { corner, corn: st.corn.length, spread, flock: st.flock.length, laidCorn, laidPlain };
  });
  t.expect(cornEnd.corner === 0 && cornEnd.corn === 0 && cornEnd.spread >= 3, `when the corn is gone they wander off again (${JSON.stringify(cornEnd)})`);
  t.expect(cornEnd.laidCorn <= cornEnd.laidPlain * 1.35 + K.CORN_EGGS + 3, `corn brings only a few extra eggs, no ×2 (${cornEnd.laidCorn} eggs with corn, ${cornEnd.laidPlain} without)`);

  // ---- every pad: a growing price and a visible effect
  const pads = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, out = [];
    const effect = { egg_hatch: () => E.refill(s), egg_coop: () => E.cap(s), egg_feed: () => E.layTime(s), egg_box: () => E.boxEggs(s), egg_truck: () => (E.syncTrucks(Game), st.trucks.length), egg_fancy: () => E.eggValue(s, 0) };
    for (const key of Object.keys(effect)) {
      const pad = E.pads(Game).find((p) => p.key === key), before = effect[key](), lv0 = s.lv[pad.upg];
      Game.s.cash = pad.price; T.tp(pad.pos.x, pad.pos.y, 'barn');
      const n = T.until(() => s.lv[pad.upg] > lv0, 900);
      const after = effect[key](), next = E.pads(Game).find((p) => p.key === key).price;
      out.push({ key, label: pad.label, price: pad.price, next, n, lv: s.lv[pad.upg], before, after });
      T.tp(39900, 4700, 'barn');
    }
    return out;
  });
  for (const p of pads) {
    t.expect(p.n > 0 && p.lv === 1, `${p.label} bought (${JSON.stringify(p)})`);
    t.expect(p.next > p.price, `${p.label} costs more next time (${p.price} → ${p.next})`);
    t.expect(p.after !== p.before, `${p.label} changes something (${p.before} → ${p.after})`);
  }
  t.expect(await t.ev(() => EggFarmExt.st.trucks.length === 2), 'a second truck after More Trucks');
  console.log('   pads: ' + pads.map((p) => `${p.label} $${p.price}→$${p.next}`).join(', '));

  // ---- the Loader: hired on his pad, he walks the boxes from the pile onto the truck (carried on his head)
  const loader = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, pad = E.pads(Game).find((p) => p.key === 'egg_loader');
    Game.s.cash = pad.price; T.tp(pad.pos.x, pad.pos.y, 'barn'); const n = T.until(() => s.lv.loader === 1, 900); T.tp(40560, 4700, 'barn');
    st.trucks.forEach((tr, i) => { tr.state = i ? 'road' : 'dock'; tr.d = 0; tr.boxes = 0; tr.val = 0; tr.idle = 0; tr.x = CFG.EGGFARM.BAYS[0].x; tr.y = i ? 0 : CFG.EGGFARM.BAYS[0].y; });
    s.boxes = 5; s.boxVal = 5 * E.boxEggs(s); s.hopper = 0;
    const seen = new Set(), L = () => st.loader; let carried = 0;
    const n2 = T.until(() => { if (L()) { seen.add(L().state); if (L().carry > 0 && L().state === 'toTruck') carried = Math.max(carried, L().carry); } return E.dockTruck() && E.dockTruck().boxes >= 2; }, 1200);
    return { n, n2, states: [...seen], carried, truck: E.dockTruck() && E.dockTruck().boxes, label: pad.label, next: E.pads(Game).find((p) => p.key === 'egg_loader').label };
  });
  t.expect(loader.n > 0 && loader.label === 'Hire a Loader' && loader.next === 'Faster Loader', `hired a loader (${JSON.stringify(loader)})`);
  t.expect(loader.n2 > 0 && ['toPile', 'toTruck'].every((k) => loader.states.includes(k)) && loader.carried === 1, `he walks to the pile, carries a box to the truck, and back (${JSON.stringify(loader)})`);
  await t.ev(() => { const st = EggFarmExt.st; Game.s.eggfarm.boxes = Math.max(3, Game.s.eggfarm.boxes); T.until(() => st.loader.state === 'toTruck', 600); T.step(20); T.tp(st.loader.x - 60, st.loader.y + 20, 'barn'); Render.setZoom(1.8); T.step(1); });
  await t.shot('loader');
  await t.ev(() => Render.setZoom(1));
  const auto = await t.ev(() => { const s = Game.s.eggfarm, sh = s.shipped; s.boxes = 6; s.boxVal = 36; T.tp(39800, 4780, 'barn'); const n = T.until(() => s.shipped > sh, 60 * 60); return { n, shipped: s.shipped - sh }; });
  t.expect(auto.n > 0, `with the loader the boxes get onto the trucks and shipped by themselves (${JSON.stringify(auto)})`);

  // ---- no long arms: the egg tower sits on the chef's head and the Loader's boxes on his: no arm or hand is drawn
  // reaching up (nothing stroked in skin colour, no skin-coloured blob above the head)
  const arms = await t.ev(() => {
    const ctx = Render.ctx, st = EggFarmExt.st, p = Game.player, log = [];
    const wrap = (name) => { const o = ctx[name]; ctx[name] = function (...a) { log.push({ name, fill: String(ctx.fillStyle), stroke: String(ctx.strokeStyle), lw: ctx.lineWidth, a }); return o.apply(this, a); }; return () => { ctx[name] = o; }; };
    st.stack.length = 0; for (let i = 0; i < 40; i++) st.stack.push({ t: 0, x: 0, land: 9 }); T.tp(40100, 4700, 'barn'); T.step(2);
    const un = ['stroke', 'arc', 'lineTo'].map(wrap);
    EggFarmExt.drawStack(Render, Game); const stackLog = log.splice(0);
    const L = st.loader; L.carry = 2; L.state = 'toTruck'; EggFarmExt.drawLoader(Render, Game, L); const loaderLog = log.splice(0);
    un.forEach((f) => f());
    const skin = ['#f1c27d', '#c68642'];
    const strokes = stackLog.filter((q) => q.name === 'stroke').length, skinStroke = loaderLog.concat(stackLog).filter((q) => q.name === 'stroke' && skin.includes(q.stroke.toLowerCase())).length;
    const highHands = loaderLog.filter((q) => q.name === 'arc' && skin.includes(q.fill.toLowerCase()) && q.a[1] < L.y - 50).length;
    const base = EggFarmExt.stackBase(Game), headTop = p.y - 62;
    return { strokes, skinStroke, highHands, baseAbove: headTop - base.y, nest: base.y + 10 - headTop };
  });
  t.expect(arms.strokes === 0 && arms.skinStroke === 0 && arms.highHands === 0, `no arms drawn reaching up for the tower or the boxes (${JSON.stringify(arms)})`);
  t.expect(arms.baseAbove > 0 && arms.baseAbove < 14 && Math.abs(arms.nest) <= 4, `the tower's nest rests right on the chef's hat (${JSON.stringify(arms)})`);

  // ---- the egg types climb with the flock: golden at 30, rainbow 100, space 250, pizza 500 (once the chick is in)
  const types = [];
  for (let k = 1; k <= 4; k++) {
    const m = await t.ev((k) => {
      const s = Game.s.eggfarm, E = EggFarmExt, T2 = CFG.EGGFARM.TYPES;
      s.coops = 6; s.lv.coop = 10; E.st.obs = E.st.obsCar = null; s.type = k - 1; E.st.autoT = -1e9;
      const per = Math.floor((T2[k].at - 1) / 6), extra = T2[k].at - 1 - per * 6; s.hens = [0, 1, 2, 3, 4, 5].map((i) => per + (i < extra ? 1 : 0));
      const before = s.type; E.st.refill = 0; E.st.banner = null; const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.act();
      const early = s.type; T.until(() => !E.st.chicks.length, 900);
      return { before, early, after: s.type, hens: E.shownHens(s), banner: E.st.banner && E.st.banner.type, value: E.eggValue(s, s.type) };
    }, k);
    types.push(m);
    t.expect(m.before === k - 1 && m.early === k - 1 && m.after === k && m.banner === k, `egg type ${k} unlocks at ${m.hens} hens, when the chick gets into its coop (${JSON.stringify(m)})`);
  }
  t.expect(types.every((m, i) => i === 0 || m.value > types[i - 1].value), 'each egg type is worth more');
  for (let k = 0; k <= 4; k++) {
    await t.ev((k) => {
      window.__day(); const s = Game.s.eggfarm, E = EggFarmExt; s.type = k; E.st.banner = null; E.st.stack.length = 0; E.st.fly.length = 0;
      for (let i = 0; i < 16; i++) E.st.stack.push({ t: k, x: 0, land: 9 });
      s.hens = [30, 30, 30, 30, 30, 30]; T.tp(40260, 4620, 'barn'); T.step(60 * 3); T.tp(40150, 4560, 'barn'); T.step(2);
    }, k);
    await t.shot('type-' + k);
  }
  await t.ev(() => { const s = Game.s.eggfarm, E = EggFarmExt; s.type = 0; E.st.stack.length = 0; s.hens = [20, 20, 0, 0, 0, 0]; s.coops = 2; s.lv.coop = 0; s.lv.loader = 0; E.st.loader = null; E.st.autoT = 0; E.st.obs = E.st.obsCar = null; E.st.floor.length = 0; T.step(2); });

  // ---- the egg tower: walking about the floor full of eggs until it is 100+ high
  const scoop = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, hens = s.hens.slice(); s.hens.fill(0); st.flock.length = 0; st.stack.length = 0;
    const fill = (y) => { st.floor.length = 0; for (let i = 0; i < 80; i++) st.floor.push({ x: 39640 + i * 12, y: y + (i % 3) * 14, t: i % 5, z: 0, vz: 0, pop: 0 }); };
    fill(4700); T.tp(39600, 4714, 'barn'); T.steer(1, 0); const n1 = T.until(() => st.stack.length >= 80 || Game.player.x > 40620, 1200);
    fill(4620); T.steer(-1, -0.3); const n2 = T.until(() => st.stack.length >= 120 || Game.player.x < 39620, 1200); T.unsteer(); T.step(30);
    return { n: n1 + n2, stack: st.stack.length };
  });
  t.expect(scoop.stack >= 120, `the egg tower grew to ${scoop.stack} by walking about (${scoop.n} steps)`);
  t.expect(scoop.n < 60 * 12, 'it grows fast');
  const wob = await t.ev(() => {
    const st = EggFarmExt.st, top = () => st.stack[st.stack.length - 1].x; st.floor.length = 0; T.tp(39800, 4700, 'barn'); T.step(360);
    const still = top(); T.steer(1, 0); T.step(30); const walking = top(), lean = st.lean, mid = st.stack[40].x; T.unsteer();
    let maxSwing = 0, maxLean = 0; for (let i = 0; i < 120; i++) { T.step(1); maxSwing = Math.max(maxSwing, top()); maxLean = Math.max(maxLean, st.lean); }
    T.step(300); const settled = top();
    return { still, walking, lean, mid, maxSwing, maxLean, settled };
  });
  t.expect(Math.abs(wob.still) < 2, `a still tower stands straight (${wob.still.toFixed(1)})`);
  t.expect(wob.walking < -40 && wob.mid > wob.walking, `walking right, the tower leans back like a noodle (${JSON.stringify(wob)})`);
  t.expect(wob.maxSwing > 5 && wob.maxLean > 5, 'stopping swings the tower forward past straight');
  t.expect(Math.abs(wob.settled) < 3, `and it settles (${wob.settled.toFixed(1)})`);
  await t.ev(() => { T.tp(39800, 4780, 'barn'); T.step(2); T.steer(1, 0); T.step(18); });
  await t.shot('tower-walking');
  await t.ev(() => { T.unsteer(); T.step(10); const st = EggFarmExt.st; st.floor.length = 0; T.tp(40050, 4700, 'barn'); Render.setZoom(2); T.step(20); st.floor.length = 0; st.magT = 99; Game.floats.length = 0; });
  await t.shot('tower-arms');
  await t.ev(() => { Render.setZoom(1); });
  // a whole tall tower goes through the packer
  const bigPack = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, P = CFG.EGGFARM.PACK; s.boxes = 0; s.boxVal = 0; s.box = 0; s.boxEggVal = 0; s.hopper = 0; s.hopperVal = 0; const n0 = st.stack.length;
    T.tp(P.x, P.y, 'barn'); T.act(); const n = T.until(() => !st.stack.length && !st.fly.length, 900); const m = T.until(() => s.hopper === 0, 3600);
    return { n0, n, m, boxes: s.boxes, box: s.box, per: EggFarmExt.boxEggs(s) };
  });
  t.expect(bigPack.n > 0 && bigPack.n < 60 * 4 && bigPack.boxes * bigPack.per + bigPack.box === bigPack.n0, `a ${bigPack.n0}-egg tower goes into the packer in a few seconds and comes out in boxes (${JSON.stringify(bigPack)})`);
  await t.ev(() => { const s = Game.s.eggfarm; s.boxes = 0; s.boxVal = 0; s.hens = [20, 20, 0, 0, 0, 0]; });
  const oldEgg = await t.ev(() => { const st = EggFarmExt.st, n0 = st.stack.length; BarnExt.st.eggs.push({ x: 39830, y: 4230, t: 1 }); T.tp(39830, 4230, 'barn'); T.step(40); return st.stack.length - n0; });
  t.expectEq(oldEgg, 1, 'an egg from the old barn hops onto the tower');

  // ---- a big flock stays cheap: 300 chickens and 80 eggs on the floor, a 120-egg tower; time a frame
  const perf = await t.ev(() => {
    window.__day(); const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, Kc = CFG.EGGFARM;
    s.coops = 6; s.lv.coop = 10; st.obs = st.obsCar = null; s.hens = [50, 50, 50, 50, 50, 50]; st.autoT = -1e9; st.flock.length = 0; E.scatterFlock(s);
    st.floor.length = 0; for (let i = 0; i < 80; i++) { const q = E.roamSpot(); st.floor.push({ x: q.x, y: q.y, t: 0, z: 0, vz: 0, pop: 0 }); }
    st.stack.length = 0; for (let i = 0; i < 120; i++) st.stack.push({ t: 0, x: 0, land: 9 });
    T.tp(39800, 4452, 'barn'); T.step(60 * 3);   // out of the eggs' reach, in a corner
    T.tp(40100, 4880, 'barn'); Game.player.x = 40100; Game.player.y = 4880; for (const e of st.floor) if (U.dist(e.x, e.y, 40100, 4880) < Kc.MAGNET + 5) e.y = 4600;
    const time = (n, fn) => { const t0 = performance.now(); for (let i = 0; i < n; i++) fn(); return (performance.now() - t0) / n; };
    time(10, () => Render.draw(Game));
    const frame = time(60, () => Render.draw(Game)), drawn = st.henDrawn;
    const upd = time(200, () => E.update(Game, 1 / 60)), step = time(60, () => Game.update(1 / 60));
    const total = E.shownHens(s), out = st.flock.length, floor = st.floor.length;
    // a long run with the floor full: it stays at FLOOR_MAX, the hens wait
    T.step(60 * 10);
    const later = { floor: st.floor.length, acc: st.acc, flock: st.flock.length };
    // and the same frame with no chickens at all, for comparison
    const saved = s.hens.slice(); s.hens.fill(0); st.flock.length = 0; T.step(1); time(10, () => Render.draw(Game)); const empty = time(60, () => Render.draw(Game)); s.hens = saved;
    return { frame, empty, upd, step, drawn, total, out, floor, later };
  });
  console.log(`   big flock: ${perf.total} chickens (${perf.out} walking, ${perf.drawn} drawn on screen), ${perf.floor} eggs on the floor, a 120-egg tower: frame ${perf.frame.toFixed(2)} ms (${perf.empty.toFixed(2)} ms with no chickens), egg farm update ${perf.upd.toFixed(3)} ms, whole game step ${perf.step.toFixed(3)} ms`);
  t.expect(perf.total === 300 && perf.out === K.WALK_MAX && perf.drawn <= perf.out && perf.floor === K.FLOOR_MAX, `a 300-chicken flock walks at most ${K.WALK_MAX} at a time (${JSON.stringify(perf)})`);
  t.expect(perf.later.floor === K.FLOOR_MAX && perf.later.acc <= 1, `with ${K.FLOOR_MAX} eggs on the floor the hens wait (${JSON.stringify(perf.later)})`);
  t.expect(perf.upd < 1.5, `the farm's update is cheap (${perf.upd.toFixed(3)} ms)`);
  t.expect(perf.frame < 40 && perf.frame - perf.empty < 8, `a frame with the big flock costs little more than an empty one (${perf.frame.toFixed(2)} vs ${perf.empty.toFixed(2)} ms)`);
  await t.ev(() => { const st = EggFarmExt.st; st.flock.length = 0; EggFarmExt.scatterFlock(Game.s.eggfarm); T.tp(40200, 4700, 'barn'); T.step(2); for (const e of st.floor) if (U.dist(e.x, e.y, 40200, 4700) < CFG.EGGFARM.MAGNET + 5) e.y = e.y < 4700 ? 4586 : 4818; T.step(2); });
  await t.shot('big-flock');
  await t.ev(() => { const s = Game.s.eggfarm, st = EggFarmExt.st; s.hens = [20, 20, 0, 0, 0, 0]; s.coops = 2; s.lv.coop = 0; st.obs = st.obsCar = null; st.floor.length = 0; st.stack.length = 0; T.step(2); });

  // ---- night: at dusk every chicken walks home and goes to sleep (the counts match); no eggs at night, the eggs on the
  // floor stay where they are; at dawn the rooster crows and they come out again
  const night = await t.ev(() => {
    window.__day(); const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt; s.hens = [16, 9, 0, 0, 0, 0];
    T.tp(39800, 4452, 'barn'); T.step(60 * 6);
    const outDay = st.flock.length;
    st.floor.length = 0; for (let i = 0; i < 5; i++) st.floor.push({ x: 39700 + i * 40, y: 4760, t: 0, z: 0, vz: 0, pop: 0 });
    AtmosphereExt.force({ phase: 'dusk' }); T.step(1); const homeward = st.flock.every((h) => h.s === 'home' || h.s === 'up');
    const n = T.until(() => st.flock.length === 0, 60 * 30);
    const laid0 = s.laid; T.step(60 * 10); Render.draw(Game);
    const counts = [0, 1].map((i) => ({ shown: E.shown(s, i), inCoop: E.inCoop(s, i), drawn: st.faces[i].drawn, label: st.labels[i], asleep: /z$/.test(st.faces[i].key) }));
    return { outDay, homeward, n, counts, laidAtNight: s.laid - laid0, floor: st.floor.map((e) => Math.round(e.x)).join(','), flock: st.flock.length, hint: T.hint() };
  });
  t.expect(night.outDay > 15 && night.homeward, `at dusk all ${night.outDay} chickens head home`);
  t.expect(night.n > 0 && night.flock === 0, `and go into their coops (${night.n} steps)`);
  t.expect(night.counts.every((c) => c.inCoop === c.shown && c.drawn === c.shown && c.label === c.shown && c.asleep), `each coop's sleepy faces match its number (${JSON.stringify(night.counts)})`);
  t.expect(night.laidAtNight === 0 && night.floor === '39700,39740,39780,39820,39860', `no eggs at night, and the eggs on the floor stay put (${JSON.stringify(night)})`);
  t.expectEq(night.hint, 'Pick up the eggs! 🥚', 'the hint still says to pick up the eggs left on the floor');
  await t.ev(() => { T.tp(40200, 4600, 'barn'); T.step(5); });
  await t.shot('night-coops');
  await t.ev(() => { EggFarmExt.st.floor.length = 0; EggFarmExt.st.stack.length = 0; EggFarmExt.st.fly.length = 0; T.tp(40200, 4600, 'barn'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Shh! The chickens are asleep 😴', 'at night with nothing to pick up, the chickens are asleep');
  const dawn = await t.ev(() => { const st = EggFarmExt.st; Game.floats.length = 0; AtmosphereExt.force({ phase: 'dawn' }); T.step(2); const crow = st.crow > 0 && Game.floats.some((f) => f.text.includes('doodle')); const n = T.until(() => st.flock.length >= 10, 600); return { crow, n, flock: st.flock.length, from: st.flock.slice(0, 4).map((h) => h.s) }; });
  t.expect(dawn.crow, 'the rooster crows when dawn breaks');
  t.expect(dawn.n > 0 && dawn.flock >= 10, `and the chickens come out again (${JSON.stringify(dawn)})`);
  await t.ev(() => { T.tp(39760, 4580, 'barn'); T.step(10); });
  await t.shot('dawn');
  await t.ev(() => window.__day());
  const peek = await t.ev(() => {
    const s = Game.s.eggfarm, E = EggFarmExt, st = E.st; AtmosphereExt.force({ phase: 'dusk' }); T.until(() => !st.flock.length, 60 * 30);
    T.tp(CFG.EGGFARM.COOP_X[0] - 28, CFG.EGGFARM.CHICK_Y + 4, 'barn'); T.step(1); const l = T.label(); T.act(); T.step(10); Render.draw(Game);
    return { l, peek: !!st.peek, l2: T.label(), drawn: st.peekDrawn, shown: E.shown(s, 0) };
  });
  t.expect(peek.l === '👀 Peek inside' && peek.peek && peek.l2 === '👀 Back out' && peek.drawn === peek.shown && peek.drawn === 16, `peeking into a coop at night shows all its chickens asleep (${JSON.stringify(peek)})`);
  await t.shot('peek');
  t.expect(await t.ev(() => { T.steer(0, 1); T.step(5); T.unsteer(); return !EggFarmExt.st.peek; }), 'walking away closes the peek');
  await t.ev(() => window.__day());

  // ---- the spare truck: load it at the pile, drive it out of the north doors and along Main Street to the Egg Market,
  // deliver for the normal price, and drive back in
  const spare = await t.ev(() => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, v = st.spare, E = EggFarmExt, B1 = CFG.EGGFARM.BAYS[1], L1 = CFG.EGGFARM.LOAD[1];
    st.stack.length = 0; s.boxes = 4; s.boxVal = 4 * E.boxEggs(s) * E.eggValue(s, 0); s.bank = 0;
    st.trucks.forEach((tr) => { tr.state = 'road'; tr.d = 0; tr.boxes = 0; tr.val = 0; });
    T.tp(L1.x, L1.y, 'barn'); T.step(1); const label = T.label(); T.act(); T.until(() => !st.loading, 300); T.step(30);
    const loaded = v.boxes, val = v.val;
    T.tp(B1.x, B1.y + 62, 'barn'); T.step(1); const near = Game.findNearVehicle() === v; Game.enterCar(); T.step(1);
    const hintIn = T.hint();
    const ys = []; T.steer(0, -1); const n = T.until(() => { if (Game.area === 'barn') ys.push(v.y); return Game.area === 'town'; }, 300); T.unsteer();
    return { label, loaded, val, near, hintIn, n, north: ys.length > 2 && ys[ys.length - 1] < ys[0], area: Game.area };
  });
  t.expect(spare.label === '📦 Load the truck' && spare.loaded === 4, `loaded the spare truck at the pile (${JSON.stringify(spare)})`);
  t.expect(spare.near && spare.hintIn === 'Drive out of the big doors to the Egg Market! 🚚', `hopped in; the hint says to drive out to the market (${JSON.stringify(spare)})`);
  t.expect(spare.n > 0 && spare.north && spare.area === 'town', 'drove north out of the big doors');
  const farmOut = await t.ev(() => { const v = EggFarmExt.st.spare, B = CFG.FARM.barn; return { solid: Game.townObstacles(true).some((o) => Game.hitRect(v.x, v.y, 24, o)), north: v.y < B.y0 && Math.abs(v.x - CFG.FARM.northGate.x) < 10, hint: T.hint(), target: Game.hint && Game.hint.target, label: T.label() }; });
  t.expect(farmOut.label !== '🚚 Drive into the barn', `no drive-back-in button the moment it comes out (${farmOut.label})`);
  t.expect(!farmOut.solid && farmOut.north, `out on the farm, at the barn's north doors, on free ground (${JSON.stringify(farmOut)})`);
  t.expect(farmOut.hint === 'Drive the eggs to the Egg Market! 🥚' && farmOut.target && farmOut.target.x === K.MARKET.drop.x && farmOut.target.y === K.MARKET.drop.y, `an arrow to the Egg Market by the fire station (${JSON.stringify(farmOut)})`);
  await t.shot('spare-farm');
  // drive up the track onto Main Street and along it to the market (the arrow keeps pointing there)
  const drive = await t.ev(() => {
    const v = EggFarmExt.st.spare, M = CFG.EGGFARM.MARKET.drop; let arrow = true;
    T.steer(0, -1); T.until(() => v.y < 64, 300); T.steer(1, 0);
    const n = T.until(() => { if (v.x < M.x - 200 && !(Game.hint && Game.hint.target && Game.hint.target.x === M.x)) arrow = false; return v.x > M.x - 30; }, 1500); T.unsteer(); T.step(20);
    return { n, x: Math.round(v.x), y: Math.round(v.y), label: T.label(), hint: T.hint(), arrow };
  });
  t.expect(drive.n > 0 && drive.label === '🥚 Deliver the eggs' && drive.arrow, `drove along Main Street to the Egg Market, the arrow pointing there all the way (${JSON.stringify(drive)})`);
  const deliver = await t.ev((sp) => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, c0 = Game.s.cash, e0 = s.earned; Game.floats.length = 0; T.act(); T.step(4);
    const flying = st.boxFly.filter((b) => b.to === 'market').length; const n = T.until(() => !st.deliver, 600);
    const E = EggFarmExt; return { flying, n, got: Game.s.cash - c0, earned: s.earned - e0, val: sp.val, normal: Math.round(4 * E.boxEggs(s) * E.eggValue(s, 0)), thanks: Game.floats.some((f) => f.text.includes('Thank')), boxes: st.spare.boxes, mkt: st.mkt, hint: T.hint() };
  }, spare);
  t.expect(deliver.flying > 0 && deliver.n > 0 && deliver.boxes === 0 && deliver.mkt > 0 && deliver.thanks, `the boxes hop onto the market counter (${JSON.stringify(deliver)})`);
  t.expect(deliver.got === Math.round(deliver.val) && deliver.earned === deliver.got && deliver.got === deliver.normal, `the market pays the normal price: $${deliver.got} for 4 boxes (${JSON.stringify(deliver)})`);
  t.expectEq(deliver.hint, 'Drive back into the barn! 🚚', 'then the hint says to drive back to the barn');
  await t.ev(() => { T.step(10); });
  await t.shot('market-delivery');
  const backIn = await t.ev(() => {
    const v = EggFarmExt.st.spare, S = CFG.EGGFARM.TOWN.spot; v.x = S.x + 20; v.y = S.y - 30; T.step(1);
    const label = T.label(); T.act(); T.step(3);
    return { label, area: Game.area, driving: Game.driving };
  });
  t.expect(backIn.label === '🚚 Drive into the barn' && backIn.area === 'barn' && backIn.driving, `drove back into the barn through the north doors (${JSON.stringify(backIn)})`);
  await t.ev(() => { T.steer(0, 1); T.step(25); T.unsteer(); T.step(5); });
  await t.shot('truck-driving');
  const parked = await t.ev(() => { Game.exitCar(); T.step(1); const v = EggFarmExt.st.spare; return { free: BarnExt.free(Game.player.x, Game.player.y), where: v.where }; });
  t.expect(parked.free && parked.where === 'barn', 'hopped out onto free floor in the hall');
  const home1 = await t.ev(() => { const st = EggFarmExt.st, v = st.spare; EggFarmExt.driveOut(Game); Game.driving = false; Game.vehicle = null; T.tp(540, 430, 'town'); T.step(2); return { where: v.where, x: v.x, y: v.y }; });
  t.expect(home1.where === 'barn' && home1.x === K.BAYS[1].x && home1.y === K.BAYS[1].y, 'a truck left on the farm goes back to its bay');

  // ---- the lucky egg floats on its balloon inside the hall (never through a wall); walk into it for a bonus
  const lucky = await t.ev(() => {
    const st = EggFarmExt.st, H = CFG.EGGFARM.HALL; st.stack.length = 0; T.tp(40000, 4720, 'barn'); let inside = true, n = 0;
    for (let k = 0; k < 8; k++) { EggFarmExt.spawnLucky(Game); const L = st.lucky; while (st.lucky === L && n < 6000) { if (L.x < H.x0 + 40 || L.x > H.x1 - 40 || L.y < H.y0 + 150 || L.y > H.y1) inside = false; Game.player.x = 39800; Game.player.y = 4452; T.step(1); n++; } }
    return { inside, n };
  });
  t.expect(lucky.inside, 'the lucky egg always floats inside the hall');
  const catchIt = await t.ev(() => {
    const st = EggFarmExt.st; window.__eggFrom.length = 0; Game.s.eggfarm.hens.fill(0); st.flock.length = 0; st.floor.length = 0; T.step(30); st.stack.length = 0; st.fly.length = 0; window.__eggFrom.length = 0; T.tp(40000, 4720, 'barn'); EggFarmExt.spawnLucky(Game); st.lucky.x = 39940; st.lucky.y = 4720; st.lucky.dir = 1; st.lucky.t = 1;
    const c0 = Game.s.cash; T.step(3); const hint = Game.hint && Game.hint.text; const n = T.until(() => !st.lucky, 200); T.step(60);
    return { n, got: Game.s.cash - c0, stack: st.stack.length, float: Game.floats.some((f) => f.text.includes('Lucky')), hint, from: window.__eggFrom.map((f) => [Math.round(f.x), Math.round(f.y)]) };
  });
  t.expect(catchIt.n >= 0 && catchIt.got >= 50 && catchIt.stack === 6 && catchIt.float, `caught the lucky egg: money and eggs (${JSON.stringify(catchIt)})`);
  t.expect(catchIt.from.every(([x, y]) => Math.abs(x - 39940) < 80 && y > 4600 && y < 4720), 'its eggs fly from the balloon');
  const luckyBtn = await t.ev(() => { const st = EggFarmExt.st; EggFarmExt.spawnLucky(Game); st.lucky.x = Game.player.x + 50; st.lucky.y = Game.player.y; st.lucky.dir = 0; T.step(1); const l = T.label(); T.act(); return { l, gone: !st.lucky }; });
  t.expect(luckyBtn.l === '🎈 Catch the lucky egg!' && luckyBtn.gone, 'or press the button when it is close');
  await t.ev(() => { const st = EggFarmExt.st; Game.s.eggfarm.hens = [20, 20, 0, 0, 0, 0]; EggFarmExt.spawnLucky(Game); st.lucky.x = 39800; st.lucky.y = 4700; st.lucky.dir = 0; st.lucky.t = 2; T.tp(39920, 4740, 'barn'); T.step(2); });
  await t.shot('lucky');
  await t.ev(() => { EggFarmExt.st.lucky = null; });
  // no egg ever flies in from outside: every egg that flew onto the tower in the barn started inside the barn's rooms
  const origins = await t.ev(() => {
    const H = CFG.EGGFARM.HALL, R = CFG.BARN.room, A = CFG.BARN.arch, bad = [];
    for (const f of window.__eggFrom) {
      if (f.area !== 'barn') { bad.push(f); continue; }
      const inHall = f.x > H.x0 && f.x < H.x1 && f.y > H.y0 - 120 && f.y < H.y1, inOld = f.x > R.x0 && f.x < R.x1 && f.y > R.y0 - 60 && f.y < R.y1, inArch = f.x > A.x0 && f.x < A.x1 && f.y > R.y1 && f.y < H.y0;
      if (!inHall && !inOld && !inArch) bad.push(f);
    }
    EggFarmExt.catchEgg(Game, 40000, 4600, 0); Game.area = 'town'; T.step(1); const settled = EggFarmExt.st.fly.length;
    return { bad: bad.slice(0, 4), settled };
  });
  t.expect(origins.bad.length === 0, `no flying egg starts outside the hall (${JSON.stringify(origins.bad)})`);
  t.expectEq(origins.settled, 0, 'eggs in the air land at once when the chef changes maps');
  await t.ev(() => { Game.area = 'barn'; EggFarmExt.st.stack.length = 0; });

  // ---- a busy farm: six coops, chickens everywhere, eggs on the floor, the loader and the trucks coming and going
  await t.ev(() => {
    window.__day(); const s = Game.s.eggfarm, E = EggFarmExt; s.coops = 6; s.lv.coop = 4; s.lv.feed = 6; s.lv.truck = 3; s.lv.box = 4; s.lv.hatch = 6; s.lv.loader = 2; s.hens = [60, 60, 52, 40, 31, 18]; s.type = 2; E.st.obs = E.st.obsCar = null; E.syncTrucks(Game);
    T.tp(39800, 4452, 'barn'); T.step(60 * 8); s.boxes = 8; s.boxVal = 80;
    for (let i = 0; i < 40; i++) E.st.stack.push({ t: 2, x: 0, land: 9 });
    T.tp(40400, 4660, 'barn'); T.step(30);
  });
  await t.shot('busy');
  const busy = await t.ev(() => ({ flock: EggFarmExt.st.flock.length, floor: EggFarmExt.st.floor.length, trucks: EggFarmExt.st.trucks.map((x) => x.state).join(','), loader: EggFarmExt.st.loader.state }));
  console.log('   busy farm: ' + JSON.stringify(busy));
  // the town map with a truck on its way (pictures)
  await t.ev(() => { const st = EggFarmExt.st, tr = st.trucks[0]; st.stack.length = 0; tr.state = 'road'; tr.d = 70; tr.boxes = 6; tr.val = 6; T.tp(-760, 60, 'town'); Render.setZoom(1.3); T.step(1); window.__ut = EggFarmExt.updateTrucks; EggFarmExt.updateTrucks = () => {}; });
  await t.shot('town-truck-north');
  await t.ev(() => { const tr = EggFarmExt.st.trucks[0]; tr.d = 1500; tr.angle = 0; EggFarmExt.updateTrucks = window.__ut; T.step(1); EggFarmExt.updateTrucks = () => {}; T.tp(tr.x + 120, 120, 'town'); T.step(1); });
  await t.shot('town-truck-road');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; Render.setZoom(1); });

  // ---- offline catch-up (the shared Shop helpers): with the Loader the farmhand gathers the eggs and the trucks earn;
  // without one, the hens leave eggs on the floor (no more than fit)
  const away = await t.ev(() => {
    const s = Game.s.eggfarm; s.rate = 4; s.bank = 0; s.hens = [10, 0, 0, 0, 0, 0]; s.lv.loader = 2; Game.s.savedAt = Date.now() - 3600 * 1000;
    const amt = EggFarmExt.away(Game, Shop.awaySeconds(Game)); Game.s.savedAt = Date.now();
    return { amt, bank: s.bank, hens: EggFarmExt.hens(s), msg: EggFarmExt.st.awayMsg };
  });
  t.expect(away.amt === 7200 && away.bank === 7200 && away.hens > 10 && /Loader/.test(away.msg || ''), `with the Loader the farm kept working while the game was closed (${JSON.stringify(away)})`);
  const awayHand = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st; s.lv.loader = 0; s.rate = 4; s.bank = 0; s.lv.hatch = 0; st.floor.length = 0; st.floor.push({ x: 39700, y: 4700, t: 0, z: 0, vz: 0, pop: 0 });
    const amt = EggFarmExt.away(Game, 3600); const r = { amt, bank: s.bank, floor: st.floor.length, msg: EggFarmExt.st.awayMsg }; s.lv.loader = 2; s.lv.hatch = 6; return r;
  });
  t.expect(awayHand.amt === 0 && awayHand.bank === 0 && awayHand.floor === K.FLOOR_MAX && /laid/.test(awayHand.msg || ''), `without a Loader nothing ships while away, but the hens leave eggs on the floor, no more than fit (${JSON.stringify(awayHand)})`);
  t.expectEq(await t.ev(() => EggFarmExt.away(Game, 10)), 0, 'nothing for a few seconds away');
  // saved and loaded: the farm, the carried eggs and the eggs on the floor (where they were) come back
  const before = await t.ev(() => { const st = EggFarmExt.st; st.stack.length = 0; for (let i = 0; i < 9; i++) st.stack.push({ t: 1, x: 0, land: 9 }); st.floor.length = 0; for (let i = 0; i < 7; i++) st.floor.push({ x: 39700 + i * 50, y: 4720, t: 1, z: 0, vz: 0, pop: 0 }); Game.s.eggfarm.hens = [20, 20, 20, 10, 0, 0]; T.tp(40300, 4880, 'barn'); T.step(1); const f = st.floor.map((e) => Math.round(e.x)).join(','); Game.save(); return f; });
  await t.reload();
  await quiet();
  const loaded = await t.ev(() => ({ coops: Game.s.eggfarm.coops, stack: EggFarmExt.st.stack.length, floor: EggFarmExt.st.floor.map((e) => Math.round(e.x)).join(','), area: Game.area, free: BarnExt.free(Game.player.x, Game.player.y), loader: Game.s.eggfarm.lv.loader, hens: EggFarmExt.hens(Game.s.eggfarm) }));
  t.expect(loaded.coops === 6 && loaded.stack === 9 && loaded.area === 'barn' && loaded.free && loaded.loader === 2 && loaded.hens >= 70, `saved and loaded (${JSON.stringify(loaded)})`);
  t.expect(loaded.floor.startsWith(before.slice(0, 20)), `the eggs on the floor are still where they were (${loaded.floor} vs ${before})`);
  // an old save from the Egg Belt days (version 2): the belt, the egg trays and a loader. It loads cleanly: no belt,
  // the tray eggs on the floor, the belt's price back as egg money; the flock, the coops, the money and the other
  // upgrades stay
  const v2 = await t.ev(() => {
    Game.save(); const data = JSON.parse(localStorage.getItem(CFG.SAVE_KEY)); const cash = data.cash;
    data.eggfarm = { ver: 2, seen: true, coops: 4, hens: [30, 30, 30, 12, 0, 0], trays: [5, 8, 0, 3, 0, 0], lv: { hatch: 3, coop: 1, feed: 2, box: 1, truck: 1, fancy: 2, belt: 1, loader: 2 }, type: 1, hopper: 10, hopperVal: 20, box: 2, boxEggVal: 4, boxes: 3, boxVal: 54, bank: 40, transit: 0, rate: 5, stack: [1, 1, 1], spare: { boxes: 1, val: 18 }, hatched: 120, laid: 900, shipped: 80, earned: 1500 };
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(data)); Game.save = () => {}; return { cash };
  });
  await t.reload();
  await quiet();
  const mig2 = await t.ev(() => { const s = Game.s.eggfarm; return { ver: s.ver, belt: 'belt' in s.lv, trays: 'trays' in s, floor: EggFarmExt.st.floor.length, loader: s.lv.loader, lv: s.lv, coops: s.coops, hens: s.hens.join(','), bank: s.bank, boxes: s.boxes, stack: EggFarmExt.st.stack.length, cash: Game.s.cash, pads: EggFarmExt.pads(Game).map((p) => p.key).join(',') }; });
  t.expect(mig2.ver === 3 && !mig2.belt && !mig2.trays && mig2.floor >= 16, `an old save with the Egg Belt loads without it, its tray eggs on the floor (${JSON.stringify(mig2)})`);
  t.expect(mig2.loader === 2 && mig2.coops === 4 && mig2.hens === '30,30,30,12,0,0' && mig2.lv.hatch === 3 && mig2.lv.fancy === 2 && mig2.boxes === 3 && mig2.stack === 3 && mig2.cash === v2.cash, `and keeps its flock, coops, Loader, money and upgrades (${JSON.stringify(mig2)})`);
  t.expect(mig2.bank === 40 + K.BELT_REFUND && !/belt/.test(mig2.pads), `the belt's price waits as egg money, and no belt pad (${mig2.bank})`);
  // an even older save (before the egg chain): it had trucks and a running farm; it keeps its trucks and gets a loader
  await t.ev(() => {
    const data = JSON.parse(localStorage.getItem(CFG.SAVE_KEY));
    data.eggfarm = { seen: true, coops: 3, hens: [20, 20, 5, 0, 0, 0], lv: { hatch: 2, coop: 0, feed: 1, box: 1, truck: 2, fancy: 1 }, type: 0, hopper: 12, box: 2, boxEggVal: 2, boxes: 3, boxVal: 27, bank: 0, transit: 0, rate: 3, stack: [0, 0], hatched: 45, laid: 300, shipped: 40, earned: 260 };
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(data)); Game.save = () => {};
  });
  await t.reload();
  await quiet();
  const mig = await t.ev(() => { const s = Game.s.eggfarm; return { ver: s.ver, belt: 'belt' in s.lv, loader: s.lv.loader, truck: s.lv.truck, trucks: EggFarmExt.st.trucks.length, hopperVal: s.hopperVal, boxes: s.boxes }; });
  t.expect(mig.ver === 3 && !mig.belt && mig.loader === 1 && mig.truck === 2 && mig.trucks === 3 && mig.hopperVal > 0 && mig.hopperVal <= 12 && mig.boxes >= 3, `a very old save keeps its trucks and gets a Loader, and no belt (${JSON.stringify(mig)})`);
  await hooks();
  await t.ev(() => window.__day());

  // ---- rescues: pushed into a coop, a wall or the packer, back under the archway
  for (const [x, y] of [[K.COOP_X[2], 4450], [K.HALL.x1 + 8, 4600], [K.PACKER.x0 + 30, 4740], [K.BAYS[0].x, 4470]]) {
    const r = await t.ev(([x, y]) => { T.tp(40300, 4700, 'barn'); Game.player.x = x; Game.player.y = y; T.step(2); const M = CFG.EGGFARM.ARCH_MAT; return { d: Math.hypot(Game.player.x - M.x, Game.player.y - M.y), free: BarnExt.free(Game.player.x, Game.player.y) }; }, [x, y]);
    t.expect(r.d < 2 && r.free, `rescued from ${x},${y} onto the archway mat`);
  }
  // the chef cannot walk out of the north doors (only a truck can)
  const doorWalk = await t.ev(() => { const B = CFG.EGGFARM.BAYS[1]; T.tp(B.x, 4560, 'barn'); EggFarmExt.st.spare.x = 40000; T.steer(0, -1); T.step(120); T.unsteer(); const y = Game.player.y; EggFarmExt.parkSpare(); return { y, area: Game.area }; });
  t.expect(doorWalk.area === 'barn' && doorWalk.y > K.HALL.y0, `the chef stays inside at the north doors (${JSON.stringify(doorWalk)})`);
  // a stuck check over the whole hall: from every free spot the chef can walk away
  const stuck = await t.ev(() => {
    const H = CFG.EGGFARM.HALL, bad = []; let n = 0;
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    for (let y = H.y0 + 20; y < H.y1 - 16; y += 40) for (let x = H.x0 + 20; x < H.x1 - 16; x += 40) {
      if (hit(x, y)) continue; n++;
      let best = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, 'barn'); T.steer(ax, ay); T.step(10); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (best < 10) bad.push(x + ',' + y);
    }
    return { n, bad };
  });
  t.expect(stuck.n > 100 && stuck.bad.length === 0, `no stuck spots in the hall (${stuck.n} sampled; ${stuck.bad.join(' ')})`);

  // ---- Take-me-home from the hall, mid-peek and mid-pack, with the spare truck out on the farm mid-delivery
  const home = await t.ev(() => {
    const st = EggFarmExt.st; for (let i = 0; i < 10; i++) st.stack.push({ t: 0, x: 0, land: 9 });
    st.spare.boxes = 2; st.spare.val = 12; st.spare.where = 'town'; st.deliver = { t: 0, k: 0, n: 2, val: 12 };
    T.tp(CFG.EGGFARM.PACK.x, CFG.EGGFARM.PACK.y, 'barn'); T.act(); T.step(5); st.peek = { c: 0, t: 5 };
    const c0 = Game.s.cash; Game.goHome(); T.step(2);
    return { area: Game.area, peek: st.peek, packing: st.packing, deliver: st.deliver, fly: st.fly.length, where: st.spare.where, paid: Game.s.cash - c0, d: Math.hypot(Game.player.x - CFG.PLAYER_START.x, Game.player.y - CFG.PLAYER_START.y), hint: EggFarmExt.hint(Game) };
  });
  t.expect(home.area === 'town' && !home.peek && !home.packing && !home.deliver && home.fly === 0 && home.where === 'barn' && home.paid >= 12 && home.d < 2 && home.hint === undefined, `home from the egg farm (${JSON.stringify(home)})`);

  // ---- phone-size pictures
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const st = EggFarmExt.st, s = Game.s.eggfarm; st.stack.length = 0; s.coops = 3; s.hens = [20, 14, 6, 0, 0, 0]; st.obs = st.obsCar = null; window.__day(); T.tp(39800, 4452, 'barn'); T.step(60 * 6); T.tp(39650, 4580, 'barn'); T.step(20); });
  await t.shot('phone-hatcher');
  await t.ev(() => { const st = EggFarmExt.st; for (let i = 0; i < 110; i++) st.stack.push({ t: i % 5, x: 0, land: 9 }); T.tp(40000, 4760, 'barn'); T.step(30); T.steer(1, 0); T.step(16); });
  await t.shot('phone-tower');
  await t.ev(() => { T.unsteer(); const P = CFG.EGGFARM.PACK; T.tp(P.x, P.y, 'barn'); T.step(2); T.act(); T.step(30); });
  await t.shot('phone-packing');
  await t.ev(() => { T.step(300); const C = CFG.EGGFARM.CORN.spot; T.tp(C.x, C.y, 'barn'); T.act(); T.step(150); });
  await t.shot('phone-corn');
  await t.ev(() => { AtmosphereExt.force({ phase: 'dusk' }); T.until(() => !EggFarmExt.st.flock.length, 60 * 30); T.tp(40200, 4600, 'barn'); T.step(5); });
  await t.shot('phone-night');
  await t.ev(() => { window.__day(); T.tp(CFG.EGGFARM.MARKET.x0 + 20, CFG.EGGFARM.MARKET.y1 + 50, 'town'); T.step(2); });
  await t.shot('phone-market');
  const origins2 = await t.ev(() => window.__eggFrom.filter((f) => f.area === 'barn' && (f.x < CFG.EGGFARM.HALL.x0 - 50 || f.x > CFG.EGGFARM.HALL.x1 || f.y > CFG.EGGFARM.HALL.y1)).length);
  t.expectEq(origins2, 0, 'still no egg flying in from outside');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); EggFarmExt.st.peek = null; T.tp(540, 430, 'town'); T.step(1); });
};
